import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fse from 'fs-extra';
import { promisify } from 'util';
import downloadGitRepo from 'download-git-repo';

import { pluginDirectory } from '../constants';
import { parseCmdParams, copyFiles, runCmd } from '../shared/utils';
import type { Cmd, ParsedParams, GitUser } from '../interfaces';

const downloadGit = promisify(downloadGitRepo);
const definedInquirer = {
  defaultRepo: [
    {
      type: 'confirm',
      name: 'defaultRepo',
      message: '是否使用默认模板创建项目',
      default: true,
    },
  ],
  customRepo: [
    {
      type: 'input',
      name: 'customRepo',
      message: '请输入模板仓库地址',
    },
  ],
  recover: [
    {
      type: 'list',
      name: 'recover',
      message: '当前文件夹已存在，请选择操作',
      choices: [
        { name: 'New folder', value: 'new' },
        { name: 'Cover', value: 'cover' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ],
  rename: [
    {
      type: 'input',
      name: 'rename',
      message: '请输入新的项目名称',
    },
  ],
  packageJson: (name: string, user: GitUser) => [
    {
      type: 'input',
      name: 'projectName',
      message: '请输入插件名称',
      default: name,
    },
    {
      type: 'input',
      name: 'description',
      message: '请输入插件描述',
    },
    {
      type: 'input',
      name: 'author',
      message: '请输入插件开发者邮箱',
      default: `${user.name} <${user.email}>`,
    },
  ],
};

export class CreateCommand {
  source: string;
  cmdParams: ParsedParams;
  repoMaps: {
    target: string;
    templatePath: string;
    repository: string;
    branch: string;
  };

  constructor(projectName: string, destination: Cmd, opts = {}) {
    this.source = projectName;
    this.cmdParams = parseCmdParams(destination);
    this.repoMaps = {
      target: '',
      templatePath: '',
      repository: 'dotlim-cli',
      branch: 'main',
    };

    this.init();
  }

  async init() {
    try {
      this.repoMaps.templatePath = path.join(pluginDirectory, this.repoMaps.repository);
      this.genTargetPath(this.source);

      await this.checkFolderExist();

      await this.downloadRepo();

      await this.copyTemplateFields();

      await this.updatePackageJson();

      await this.initGit();

      await this.installDependencies();

      console.log(chalk.green(`\nGet started with the following commands:\n`));
      console.log(chalk.cyan(`  $ cd ${this.source}`));
      console.log(chalk.cyan(`  $ npm run serve`));
    } catch (err) {
      fse.removeSync(this.repoMaps.target);
      console.log(chalk.red(err));
      process.exit(1);
    }
  }

  // 检查目标路径文件是否正确
  private checkFolderExist() {
    return new Promise(async (resolve) => {
      const { target } = this.repoMaps;

      if (this.cmdParams.force) {
        fse.removeSync(target);
        resolve();
      }

      try {
        const isTarget = fse.pathExistsSync(target);
        if (!isTarget) return resolve();

        const { recover } = await inquirer.prompt(definedInquirer.recover);

        if (recover === 'cover') {
          fse.removeSync(target);
          return resolve();
        } else if (recover === 'new') {
          const { rename } = await inquirer.prompt(definedInquirer.rename);
          this.source = rename;
          this.genTargetPath(rename);
          return resolve();
        } else {
          process.exit(1);
        }
      } catch (err) {
        console.log(chalk.red(`[dotlim] ${err}`));
        process.exit(1);
      }
    });
  }

  // 拉取远程仓库的项目模板
  private async downloadRepo() {
    const { repository, branch, templatePath } = this.repoMaps;
    // const remoteRepo = `direct:git@gitlab.gridsum.com:Moebius/frontend-tech/moebius-plugin-template.git`;
    const remotePath = `github:dotlim/${repository}#${branch}`;
    const spinner = ora('Downloading the project template...');

    try {
      spinner.start();
      // 如果本地临时文件夹存在，则先删除临时文件夹
      fse.removeSync(templatePath);
      await downloadGit(remotePath, templatePath, { clone: true });
      spinner.succeed('Successfully downloaded template.');
    } catch (err) {
      console.log(chalk.red(`[dotlim] ${err}`));
      process.exit(1);
    }
  }

  // 复制模板文件到目标文件夹
  private async copyTemplateFields() {
    const { templatePath, target } = this.repoMaps;
    const removeFiles = ['./git', './changelogs', 'README.md'];
    await copyFiles(templatePath, target, removeFiles);
  }

  // 更新 package.json
  private async updatePackageJson() {
    const gitPrifiles = await this.getGitUser();
    const { projectName, description, author } = await inquirer.prompt(
      definedInquirer.packageJson(this.source, gitPrifiles)
    );

    const pkgPath = path.resolve(this.repoMaps.target, 'package.json');
    const spinner = ora('Updating package.json...');
    spinner.start();
    // Define the fields to be removed
    const unnecessaryKeys = ['keywords', 'licence', 'files'];
    // read package.json
    const pkgData = fse.readJsonSync(pkgPath);
    for (let key of unnecessaryKeys) {
      delete pkgData[key];
    }

    Object.assign(pkgData, {
      name: projectName,
      description: description,
      version: '1.0.0',
      private: true,
      author: author,
    });

    fse.writeJsonSync(pkgPath, pkgData, { spaces: 2 });

    spinner.succeed('Successfully updated package.json');
  }

  // 初始化 Git
  private async initGit() {
    const spinner = ora('Initializing git repository...');
    spinner.start();
    await runCmd(`cd ${this.repoMaps.target}`);
    process.chdir(this.repoMaps.target);
    await runCmd(`git init`);
    spinner.succeed('Successfully initialized the repository.');
  }

  // 安装项目依赖
  private async installDependencies() {
    const spinner = ora('Installing CLI plugins. This might take a while...');

    try {
      spinner.start();
      // ensure the execution directory is the target
      if (path.resolve() !== this.repoMaps.target) {
        await runCmd(`cd ${this.repoMaps.target}`);
        process.chdir(this.repoMaps.target);
      }
      // await runCmd(`npm install --registry=http://registry.npm.gridsum.com`);
      await runCmd(`npm install`);
      // await runCmd(`git add . && git commit -m "initial project"`);
      spinner.succeed(`Successfully created project ${this.source}.`);
    } catch (err) {
      console.log(chalk.red(`[dotlim] ${err}`));

      process.exit(1);
    }
  }

  // 获取本地 Git 用户信息
  private getGitUser(): Promise<GitUser> {
    return new Promise(async (resolve, reject) => {
      const user = {
        name: '',
        email: '',
      };

      try {
        const [name] = await runCmd('git config user.name');
        const [email] = await runCmd('git config user.email');
        if (name) user.name = name.replace(/\n/, '');
        if (email) user.email = email.replace(/\n/, '');
      } catch (err) {
        console.log(chalk.red(`[dotlim] ${err}`));
        reject(err);
      } finally {
        resolve(user);
      }
    });
  }

  // 生成目标目录路径
  private genTargetPath(target: string): string {
    const genPath = path.resolve(target);
    this.repoMaps.target = genPath;
    return genPath;
  }
}

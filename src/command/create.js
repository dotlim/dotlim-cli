const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const fse = require('fs-extra');
const { promisify } = require('util');
const downloadGitRepo = require('download-git-repo');
const downloadGit = promisify(downloadGitRepo);
const childProcess = require('child_process');

const { downloadDirectory } = require('./utils/constants');
// 命令行交互操作定义
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
  description: [
    {
      type: 'input',
      name: 'description',
      message: '请输入插件描述',
    },
  ],
  author: [
    {
      type: 'input',
      name: 'author',
      message: '请输入插件开发者邮箱',
    },
  ],
};

class CreateCommand {
  constructor(projectName, destination, opts = {}) {
    this.source = projectName;
    this.cmdParams = this.parseCmdParams(destination);
    this.repoMaps = {
      target: '',
      templatePath: '',
      repository: 'dotlim-cli',
      branch: 'main',
    };
    this.userInput = {
      target: projectName,
      recover: undefined,
    };

    this.init();
  }

  async init() {
    try {
      this.repoMaps.templatePath = path.join(downloadDirectory, this.repoMaps.repository);
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

  parseCmdParams(cmd) {
    if (!cmd) return {};
    return cmd.options.reduce((ops, option) => {
      const key = option.long.slice(2);
      if (cmd[key] && typeof cmd[key] !== 'function') ops[key] = cmd[key];
      return ops;
    }, {});
  }

  checkFolderExist() {
    // eslint-disable-next-line no-async-promise-executor
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

  async downloadRepo() {
    const { repository, branch, templatePath } = this.repoMaps;
    // const remoteRepo = `direct:git@gitlab.gridsum.com:Moebius/frontend-tech/moebius-plugin-template.git`;
    const remotePath = `github:dotlim/${repository}#${branch}`;
    const spinner = ora('Downloading the project template...');

    try {
      spinner.start();
      // 如果本地临时文件夹存在，则先删除临时文件夹
      fse.removeSync(templatePath);
      await downloadGit(remotePath, templatePath);
      spinner.succeed('Successfully downloaded template.');
    } catch (err) {
      console.log(chalk.red(`[dotlim] ${err}`));
      process.exit(1);
    }
  }

  async copyTemplateFields() {
    const { templatePath, target } = this.repoMaps;
    const removeFiles = ['./git', './changelogs', 'README.md'];
    await this.copyFiles(templatePath, target, removeFiles);
  }

  async copyFiles(source, target, excludes = []) {
    try {
      fse.copySync(source, target);
      if (excludes.length) {
        // FIXME: 删除失效
        await Promise.all(excludes.map((file) => () => fse.removeSync(path.join(target, file))));
      }
    } catch (err) {
      console.log(chalk.red(`[dotlim] ${err}`));
      process.exit(1);
    }
  }

  async updatePackageJson() {
    const pkgPath = path.resolve(this.repoMaps.target, 'package.json');
    const spinner = ora('Updating package.json...');
    spinner.start();
    // Define the fields to be removed
    const unnecessaryKeys = ['keywords', 'licence', 'files'];
    const { name = '', email = '' } = await this.getGitUser();
    // read package.json
    const pkgData = fse.readJsonSync(pkgPath);
    for (let key of unnecessaryKeys) {
      delete pkgData[key];
    }

    Object.assign(pkgData, {
      name: this.source,
      version: '1.0.0',
      private: true,
      author: `${name} <${email}>`,
    });

    fse.writeJsonSync(pkgPath, pkgData, { spaces: 2 });

    spinner.succeed('Successfully updated package.json');
  }

  async getGitUser() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const user = {};

      try {
        const [name] = await this.runCmd('git config user.name');
        const [email] = await this.runCmd('git config user.email');
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

  async installDependencies() {
    const spinner = ora('Installing CLI plugins. This might take a while...');

    try {
      spinner.start();
      // ensure the execution directory is the target
      if (path.resolve() !== this.repoMaps.target) {
        await this.runCmd(`cd ${this.repoMaps.target}`);
        process.chdir(this.repoMaps.target);
      }
      // await this.runCmd(`npm install --registry=http://registry.npm.gridsum.com`);
      await this.runCmd(`npm install`);
      // await this.runCmd(`git add . && git commit -m "initial project"`);
      spinner.succeed(`Successfully created project ${this.source}.`);
    } catch (err) {
      console.log(chalk.red(`[dotlim] ${err}`));

      process.exit(1);
    }
  }

  async initGit() {
    const spinner = ora('Initializing git repository...');
    spinner.start();
    await this.runCmd(`cd ${this.repoMaps.target}`);
    process.chdir(this.repoMaps.target);
    await this.runCmd(`git init`);
    spinner.succeed('Successfully initialized the repository.');
  }

  genTargetPath(target) {
    const genPath = path.resolve(target);
    this.repoMaps.target = genPath;
    return genPath;
  }

  runCmd(cmd) {
    return new Promise((resolve, reject) => {
      childProcess.exec(cmd, (err, ...args) => {
        if (err) return reject(err);
        return resolve(args);
      });
    });
  }
}

module.exports = (projectName, argv) => new CreateCommand(projectName, argv);

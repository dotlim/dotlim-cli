import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fse from 'fs-extra';
import { parseCmdParams, runCmd } from '../shared/utils';
import type { Cmd, ParsedParams } from '../interfaces';

const definedInquirer = {
  lint: [
    {
      type: 'checkbox',
      name: 'lint',
      message: 'Check the linters needed for your project',
      choices: [
        { name: 'ESLint', value: 'eslint' },
        { name: 'Prettier', value: 'prettier' },
        { name: 'Husky', value: 'husky' },
      ],
    },
  ],
};

export default class UseCommand {
  feature: string;
  cmdParams: ParsedParams;

  constructor(feature: string, destination: Cmd) {
    this.feature = feature;
    this.cmdParams = parseCmdParams(destination);

    this.init();
  }

  init() {
    switch (this.feature) {
      case 'lint':
        this.initLint();
        break;
      default:
    }
  }

  async initLint() {
    try {
      const { lint } = await inquirer.prompt(definedInquirer.lint);
      console.log(lint, path.resolve(__dirname, '../../static'), process.cwd());

      if (lint.includes('eslint')) await this.useESLint();
      if (lint.includes('prettier')) await this.usePrettier();
      if (lint.includes('husky')) await this.useHusky();
    } catch (err) {
      console.log(chalk.red(`[mox] ${err}`));
      process.exit(1);
    }
  }

  async useESLint() {
    const includeProperties = ['eslintConfig'];
    const includeFiles = [
      '.eslintrc.js',
      '.eslintrc.ymal',
      '.eslintrc.yml',
      '.eslintrc.json',
      '.eslintrc',
    ];

    const spinner = ora('Setting eslint...');
    spinner.start();

    // remove old config files
    for (const file of includeFiles) {
      fse.removeSync(path.resolve(file));
    }

    // delete old package properties
    const pkgPath = path.resolve('package.json');
    const pkgData = fse.readJsonSync(pkgPath);
    for (const property of includeProperties) {
      delete pkgData[property];
    }
    fse.writeJsonSync(pkgPath, pkgData, { spaces: 2 });

    // copy new config file
    const targetPath = process.cwd();
    const staticDir = path.resolve(__dirname, '../../static');
    fse.copyFileSync(
      path.resolve(staticDir, '.eslintrc.js'),
      path.resolve(targetPath, '.eslintrc.js')
    );

    // update dependencies
    await runCmd(`npm uninstall @vue/eslint-config-standard`);
    await runCmd(`npm install eslint@latest @dotlim/fabric@latest -D`);

    spinner.succeed('Successfully setted eslint.');
  }

  async usePrettier() {
    const includeProperties = ['prettier'];
    const includeFiles = [
      '.prettierrc',
      '.prettierrc.ymal',
      '.prettierrc.yml',
      '.prettierrc.json',
      '.prettierrc.js',
      '.prettierrc.cjs',
      'prettier.config.js',
      'prettier.config.cjs',
    ];

    const spinner = ora('Setting prettier...');
    spinner.start();

    // remove old config files
    for (const file of includeFiles) {
      fse.removeSync(path.resolve(file));
    }

    // delete old package properties
    const pkgPath = path.resolve('package.json');
    const pkgData = fse.readJsonSync(pkgPath);
    for (const property of includeProperties) {
      delete pkgData[property];
    }
    fse.writeJsonSync(pkgPath, pkgData, { spaces: 2 });

    // copy new config file
    const targetPath = process.cwd();
    const staticDir = path.resolve(__dirname, '../../static');
    fse.copyFileSync(
      path.resolve(staticDir, '.prettierrc.js'),
      path.resolve(targetPath, '.prettierrc.js')
    );

    // update dependencies
    await runCmd(`npm install prettier@latest -D`);

    spinner.succeed('Successfully setted prettier.');
  }

  async useHusky() {
    const includeProperties = ['gitHooks', 'husky'];

    const spinner = ora('Setting husky and lint-staged...');
    spinner.start();

    // delete old package properties
    const pkgPath = path.resolve('package.json');
    const pkgData = fse.readJsonSync(pkgPath);
    for (const property of includeProperties) {
      delete pkgData[property];
    }

    // add new husky config
    Object.assign(pkgData, {
      husky: {
        hooks: {
          'pre-commit': 'lint-staged',
        },
      },
      'lint-staged': {
        'src/**/*.{js,jsx,ts,tsx,vue}': ['prettier --write', 'eslint --fix', 'git add'],
        'src/**/*.s+(a|c)ss': ['sass-lint -v -q'],
      },
    });
    fse.writeJsonSync(pkgPath, pkgData, { spaces: 2 });

    // update dependencies
    await runCmd(`npm install husky@latest lint-staged@latest -D`);

    spinner.succeed('Successfully setted husky and lint-staged.');
  }
}

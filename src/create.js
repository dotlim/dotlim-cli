const inquirer = require('inquirer');
const { execWithOraLoading, fetchRepoInfo, cloneRepo, copyTemplateToDir } = require('./utils/common');

module.exports = async (projectName) => {
  if (!projectName) {
    program.help();
    return;
  }

  const { defaultRepo } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'defaultRepo',
      message: '是否使用默认模板创建项目',
      default: true
    },
  ]);

  if (!defaultRepo) {
    console.log(`请先设置项目模板地址`);
    return;
  }

  const repo = await execWithOraLoading(fetchRepoInfo, 'Fetch Github repo...');

  console.log('\n====================================');
  console.log(`this is ${projectName}`);
  console.log(`repo name:`, repo.name);
  console.log('====================================');

  const dest = await execWithOraLoading(cloneRepo, 'Clone remote repo...');

  // TODO: copy
  copyTemplateToDir(dest, projectName)
};

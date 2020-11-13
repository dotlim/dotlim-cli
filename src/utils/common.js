const ora = require('ora');
const axios = require('axios');
const { promisify } = require('util');
const path = require('path');
const fse = require('fs-extra');
let downloadGit = require('download-git-repo');
let ncp = require('ncp');
const { downloadDirectory, defaultRepo, defaultBranch } = require('./constants');

downloadGit = promisify(downloadGit);
ncp = promisify(ncp);

// execute async function with loading
async function execWithOraLoading(fn, message) {
  console.log('\n');
  const spinner = ora(message);
  spinner.start();
  const result = await fn();
  spinner.succeed();
  return result;
}

// fetch github repository
async function fetchRepoInfo(repo = defaultRepo) {
  try {
    const { data } = await axios.get(`https://api.github.com/repos/dotlim/${repo}`);
    return data;
  } catch (err) {
    console.log('\nerror', err);
  }
}

// clone remote repo to lcoal
async function cloneRepo(repo = defaultRepo) {
  const project = `github:dotlim/${repo}#${defaultBranch}`;
  const dest = `${downloadDirectory}/${repo}`;

  console.log('\n====================================');
  console.log('project:', project);
  console.log('dest:', dest);
  console.log('====================================');

  try {
    await downloadGit(project, dest);
  } catch (err) {
    console.log('\n\nerror', err);
  }

  return dest;
}

// copy template to target directory
async function copyTemplateToDir(target, projectName) {
  const resolvedPath = path.join(path.resolve(), projectName);

  console.log(resolvedPath);

  // 目录是否已存在

  if (!fse.existsSync(path.join(target, 'ask.js'))) {
    await ncp(target, resolvedPath);
    fse.remove(target);
  } else {
    // 复杂项目
  }
}

module.exports = {
  execWithOraLoading,
  fetchRepoInfo,
  cloneRepo,
  copyTemplateToDir,
};

const { name, version } = require('../../package.json');

// 定义命令
const mapActions = {
  create: {
    alias: 'c',
    description: 'Create a project with default template',
    examples: [
      'dotlim-cli create <project-name>'
    ],
  },
  config: {
    alias: 'conf',
    description: 'Config project variables',
    examples: [
      'dotlim-cli config set <key> <value>',
      'dotlim-cli config set <key>',
    ],
  },
};

const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.dotlim-template`;

module.exports = {
  name,
  version,
  mapActions,
  downloadDirectory,
  defaultRepo: 'dotlim-cli',
  defaultBranch: 'main',
};

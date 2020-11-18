const path = require('path');
const { name, version } = require('../../package.json');

// defined commands
const mapActions = {
  create: {
    command: 'create',
    alias: 'c',
    description: 'create a new project with default template',
    examples: ['dotlim create <project-name>'],
  },
  config: {
    command: 'config',
    alias: 'conf',
    description: 'Config project variables',
    examples: ['dotlim config set <key> <value>', 'dotlim config set <key>'],
  },
};

const downloadDirectory = path.join(
  process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE'],
  '.dotlim-template'
);

module.exports = {
  name,
  version,
  mapActions,
  downloadDirectory,
  defaultRepo: 'dotlim-cli',
  defaultBranch: 'main',
};

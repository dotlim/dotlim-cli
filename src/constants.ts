import path from 'path';
import { name, version } from '../package.json';

// 插件暂存根目录
const userdir: string = process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE'] || '';
export const pluginDirectory: string = path.join(userdir, '.dotlim-cli');

// package.json
export const pkgJson = {
  name,
  version,
};

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
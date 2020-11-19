import path from 'path';
import { name, version } from '../package.json';

// 插件暂存根目录
const userdir = process.platform === 'darwin' ? 'HOME' : 'USERPROFILE';
export const pluginDirectory: string = path.join(userdir, '.dotlim-template');

// package.json
export const pkgJson = {
  name,
  version,
};

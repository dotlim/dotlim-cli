import path from 'path';
import fse from 'fs-extra';
import childProcess from 'child_process';
import { isFunction } from './is';
import type { Cmd, ParsedParams } from '../interfaces';

/**
 * 解析命令行参
 * @param {string} dest 带解析的命令行参数 
 */
export function parseCmdParams(dest: Cmd): ParsedParams {
  if (!dest) return {};
  return dest.options.reduce((ops: ParsedParams, option) => {
    const key = option.long.slice(2);
    if (dest[key] && !isFunction(dest[key])) ops[key] = dest[key];
    return ops;
  }, {});
}

/**
 * 拷贝文件
 * @param {string} source 待拷贝的资源路径（绝对路径）
 * @param {string} target 资源放置路径（绝对路径）
 * @param {string[]} excludes 需要排除的资源名称（会自动移除其所有子文件）
 */
export async function copyFiles(source: string, target: string, excludes: string[] = []) {
  fse.copySync(source, target);
  if (excludes.length) {
    await Promise.all(excludes.map((file) => () => fse.removeSync(path.join(target, file))));
  }
}

/**
 * 执行命令
 * @param {string} cmd 待执行命令 
 */
export function runCmd(cmd: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      return resolve([stdout, stderr]);
    });
  });
}

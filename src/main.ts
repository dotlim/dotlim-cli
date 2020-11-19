import program from 'commander';
import { CreateCommand } from './command/init';

import { pkgJson } from './constants';

program
  .command('init <dir>')
  .alias('i')
  .description('init a new project with default templates')
  .option('-f, --force', 'force all the question')
  .action((dir, payload) => {
    // console.log(dir, payload.options);
    new CreateCommand(dir, payload);
  });

program
  .name('dotlim')
  .usage('<command> [options]')
  .option('-f, --force', 'force all the question')
  .option('-y, --yes', 'run default action')
  .version(pkgJson.version, '-v, --version');

program.parse(process.argv);

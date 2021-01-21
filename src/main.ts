import program from 'commander';
import CreateCommand from './commands/init';
import UseCommand from './commands/use';

import { pkgJson } from './constants';

program
  .command('init <dir>')
  .alias('i')
  .description('init a new project with templates')
  .option('-f, --force', 'force all the question')
  .action((dir, payload) => {
    new CreateCommand(dir, payload);
  });

program
  .command('use <feature>')
  .description('use some features for your project')
  .option('-f, --force', 'force all the question')
  .action((feature, payload) => {
    new UseCommand(feature, payload);
  });

program
  .name('dotlim')
  .usage('<command> [options]')
  .option('-f, --force', 'force all the question')
  .option('-y, --yes', 'run default action')
  .version(pkgJson.version, '-v, --version');

program.parse(process.argv);

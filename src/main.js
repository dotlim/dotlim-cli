const program = require('commander');
const path = require('path');

const mapActions = [];

Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action)
    .alias(mapActions[action].alias)
    .description(mapActions[action].description)
    .action(() => {
      if (action === '*') {
        console.log(mapActions[action].description);
      } else {
        console.log('\n');
        require(path.join(__dirname, action))(...process.argv.slice(3));
      }
    });
});

program
  .command('init <dir>')
  .alias('i')
  .description('init a new project with default templates')
  .option('-f, --force', 'force all the question')
  .action((dir, payload) => {
    require('./command/create')(dir, payload);
  });

program
  .name('dotlim')
  .usage('<command> [options]')
  .option('-f, --force', 'force all the question')
  .option('-y, --yes', 'run default action')
  .version(require('../package.json').version, '-v, --version');

program.parse(process.argv);

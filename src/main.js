const program = require('commander');
const path = require('path');
const { version, mapActions } = require('./utils/constants');

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
    // console.log(dir, payload.options);
    require('./create')(dir, payload);
    // console.log(process.argv);
  });

program.command('');

// program.on('--help', () => {
//   console.log('\nExamples:');

//   Reflect.ownKeys(mapActions).forEach((action) => {
//     mapActions[action].examples.forEach((example) => {
//       console.log(`  ${example}`);
//     });
//   });
// });

program
  .name('dotlim')
  .usage('<command> [options]')
  .option('-f, --force', 'force all the question')
  .option('-y, --yes', 'run default action')
  .version(version, '-v, --version');

program.parse(process.argv);

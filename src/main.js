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

program.on('--help', () => {
  console.log('\nExamples:');

  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(`  ${example}`);
    });
  });
});

program.version(version).parse(process.argv);

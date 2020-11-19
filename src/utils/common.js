const ora = require('ora');

// execute async function with loading
async function initSpinner(fn, message) {
  console.log('\n');
  const spinner = ora(message);
  spinner.start();
  const result = await fn();
  spinner.succeed();
  return result;
}

module.exports = {
  initSpinner,
};

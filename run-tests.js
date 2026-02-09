/**
 * Simple Test Runner
 * Run tests and output results to file
 */

const { exec } = require('child_process');
const fs = require('fs');
const path= require('path');

const outputFile = path.join(__dirname, 'test-results.txt');

console.log('Starting test run...');
console.log('Output will be saved to:', outputFile);

const testProcess = exec('npx jest --no-coverage --maxWorkers=1', {
  cwd: __dirname,
  maxBuffer: 10 * 1024 * 1024, // 10MB buffer
});

let output = '';

testProcess.stdout.on('data', (data) => {
  output += data;
  process.stdout.write(data);
});

testProcess.stderr.on('data', (data) => {
  output += data;
  process.stderr.write(data);
});

testProcess.on('close', (code) => {
  fs.writeFileSync(outputFile, output);
  console.log(`\n\nTest run complete. Exit code: ${code}`);
  console.log(`Results saved to: ${outputFile}`);
  process.exit(code);
});

testProcess.on('error', (error) => {
  const errorMsg = `Error running tests: ${error.message}`;
  fs.writeFileSync(outputFile, errorMsg);
  console.error(errorMsg);
  process.exit(1);
});

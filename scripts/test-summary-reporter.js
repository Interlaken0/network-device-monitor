// Custom Jest reporter that outputs a text summary (ESM format)
import fs from 'fs';
import path from 'path';

export default class TestSummaryReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.outputFile = options.outputFile || 'test-summary.txt';
  }

  onRunComplete(contexts, results) {
    const { testResults, numTotalTests, numPassedTests, numFailedTests, numPendingTests, startTime, endTime } = results;

    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const date = new Date().toISOString();

    let output = `Test Summary - ${date}\n`;
    output += '='.repeat(50) + '\n\n';
    output += `Total: ${numTotalTests} | Passed: ${numPassedTests} | Failed: ${numFailedTests} | Skipped: ${numPendingTests}\n`;
    output += `Duration: ${duration}s\n\n`;

    testResults.forEach(suite => {
      const relPath = suite.testFilePath.replace(process.cwd(), '');
      output += `\n${relPath}\n`;
      output += '-'.repeat(40) + '\n';

      suite.testResults.forEach(test => {
        const status = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○';
        output += `  ${status} ${test.title}\n`;
      });

      if (suite.failureMessage) {
        output += `  ERROR: ${suite.failureMessage.split('\n')[0]}\n`;
      }
    });

    output += `\n${'='.repeat(50)}\n`;
    output += numFailedTests > 0 ? 'RESULT: FAILURE\n' : 'RESULT: SUCCESS\n';

    fs.writeFileSync(this.outputFile, output);
    console.log(`\nTest summary written to ${this.outputFile}`);
  }
}

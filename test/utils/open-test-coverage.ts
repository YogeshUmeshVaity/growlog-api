/**
 * Opens test coverage report in the browser. The following script in the package.json launches
 * these commands:
 * "posttest:cov": "ts-node test/utils/open-test-coverage.ts"
 */
import { resolve } from 'path'
import { exec } from 'child_process'

const url = resolve(__dirname, '../../coverage/lcov-report/index.html')
const launch =
  process.platform == 'darwin'
    ? 'open'
    : process.platform == 'win32'
    ? 'start'
    : 'xdg-open'
exec(`${launch} ${url}`)

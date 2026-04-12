import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { getHelpText, getNonTtyMessage, getPackageVersion, resolveCliMode } from './cli.js';

const args = process.argv.slice(2);
const cliMode = resolveCliMode(args, Boolean(process.stdin.isTTY), Boolean(process.stdout.isTTY));

if (cliMode === 'help') {
  process.stdout.write(getHelpText());
  process.exit(0);
}

if (cliMode === 'version') {
  process.stdout.write(getPackageVersion() + '\n');
  process.exit(0);
}

if (cliMode === 'non-tty') {
  process.stderr.write(getNonTtyMessage());
  process.exit(1);
}

if (process.stdout.isTTY) {
  // Clear the visible screen, clear scrollback where supported, then move home.
  process.stdout.write('\u001b[2J\u001b[3J\u001b[H');
}

render(React.createElement(App));

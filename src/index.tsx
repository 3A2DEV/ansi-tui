import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

if (process.stdout.isTTY) {
  // Clear the visible screen, clear scrollback where supported, then move home.
  process.stdout.write('\u001b[2J\u001b[3J\u001b[H');
}

render(React.createElement(App));

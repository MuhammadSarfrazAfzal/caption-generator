const { spawn } = require('child_process');
const electron = require('electron');

// Ensure ELECTRON_RUN_AS_NODE is removed so Electron launches as a GUI app
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = ['.', ...process.argv.slice(2)];

const child = spawn(electron, args, {
  env,
  stdio: 'inherit',
  windowsHide: false,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

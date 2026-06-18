import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const resolveExecutable = (name) => (
  process.platform === 'win32' && ['mvn', 'npm'].includes(name) ? `${name}.cmd` : name
);

export const createDevCommands = () => [
  { label: 'db', command: 'docker', args: ['compose', 'up', '-d'], cwd: process.cwd(), blocking: true },
  { label: 'backend', command: resolveExecutable('mvn'), args: ['spring-boot:run'], cwd: resolve('backend'), blocking: false },
  { label: 'frontend', command: resolveExecutable('npm'), args: ['run', 'dev'], cwd: process.cwd(), blocking: false },
];

export const createSpawnOptions = (cwd, { includeEnv = false, platform = process.platform } = {}) => ({
  cwd,
  stdio: 'inherit',
  ...(includeEnv ? { env: process.env } : {}),
  ...(platform === 'win32' ? { shell: true } : {}),
});

const runBlocking = ({ label, command, args, cwd }) => new Promise((resolveRun, rejectRun) => {
  console.log(`[${label}] ${command} ${args.join(' ')}`);
  const child = spawn(command, args, createSpawnOptions(cwd));

  child.on('error', rejectRun);
  child.on('exit', (code) => {
    if (code === 0) {
      resolveRun();
      return;
    }

    rejectRun(new Error(`[${label}] exited with code ${code}`));
  });
});

const startLongRunning = ({ label, command, args, cwd }) => {
  console.log(`[${label}] ${command} ${args.join(' ')}`);
  const child = spawn(command, args, createSpawnOptions(cwd, { includeEnv: true }));

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${label}] stopped by ${signal}`);
      return;
    }

    console.log(`[${label}] exited with code ${code}`);
  });

  return child;
};

const stopChildren = (children) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
};

const main = async () => {
  if (!existsSync(resolve(rootDir, '.env'))) {
    console.warn('[dev:all] .env not found. Copy .env.example to .env and fill DATABASE_PASSWORD, SITE_ADMIN_EMAIL, and SITE_ADMIN_PASSWORD first.');
  }

  process.chdir(rootDir);
  const commands = createDevCommands();
  const children = [];

  for (const command of commands.filter((item) => item.blocking)) {
    await runBlocking(command);
  }

  for (const command of commands.filter((item) => !item.blocking)) {
    children.push(startLongRunning(command));
  }

  const shutdown = () => {
    console.log('\n[dev:all] stopping backend and frontend...');
    stopChildren(children);
    setTimeout(() => process.exit(0), 300);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

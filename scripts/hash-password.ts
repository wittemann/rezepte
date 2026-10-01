// Prints the APP_PASSWORD_HASH value for a password typed at the prompt (docs/specs/04-auth.md).
// Usage: npm run hash-password
import { stdin, stdout, exit } from 'node:process';
import { hashPassword } from '../src/lib/auth/password.ts';

const MIN_LENGTH = 16;

/** Reads one line from the terminal without echoing it. */
function promptHidden(question: string) {
  if (!stdin.isTTY) throw new Error('Run this in an interactive terminal.');
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  return new Promise<string>((resolve) => {
    let input = '';
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          resolve(input);
          return;
        }
        if (char === '\u0003') {
          stdout.write('\n');
          exit(130);
        }
        if (char === '\u007f' || char === '\b') input = input.slice(0, -1);
        else input += char;
      }
    };
    stdin.on('data', onData);
  });
}

const password = await promptHidden('Password: ');
if (password.length < MIN_LENGTH) {
  console.error(`Too short: use a passphrase of at least ${MIN_LENGTH} characters.`);
  exit(1);
}
if ((await promptHidden('Repeat:   ')) !== password) {
  console.error('The passwords do not match.');
  exit(1);
}

console.log('\nAPP_PASSWORD_HASH value:\n');
console.log(await hashPassword(password));

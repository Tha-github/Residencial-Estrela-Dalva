#!/usr/bin/env node
/**
 * Gera os valores secretos do painel (uso da Top Site, uma vez por site):
 *
 *   npm run admin:hash-password
 *
 * Pede a senha do proprietário (sem mostrar na tela) e imprime:
 *   - ADMIN_PASSWORD_HASH  (PBKDF2-SHA256, 100.000 iterações, sal aleatório)
 *   - SESSION_SECRET       (64 caracteres aleatórios)
 * Cole cada valor em `npx wrangler secret put <NOME>` (pasta admin-worker).
 * A senha em si não é gravada em lugar nenhum.
 */
import { webcrypto as crypto } from 'node:crypto';
import { stdin, stdout } from 'node:process';

const ITERATIONS = 100_000;

function ask(question) {
  return new Promise((resolve) => {
    stdout.write(question);
    const chars = [];
    const raw = stdin.isTTY;
    if (raw) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          if (raw) stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          resolve(chars.join(''));
          return;
        }
        if (ch === '\u0003') process.exit(1);
        if (ch === '\u007f' || ch === '\b') chars.pop();
        else chars.push(ch);
      }
    };
    stdin.on('data', onData);
  });
}

const password = process.env.ADMIN_PASSWORD ?? (await ask('Senha do painel: '));
if (password.length < 10) {
  console.error('Use uma senha com pelo menos 10 caracteres.');
  process.exit(1);
}
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveBits'],
);
const bits = new Uint8Array(
  await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    key,
    256,
  ),
);
const b64 = (u8) => Buffer.from(u8).toString('base64');
const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString('base64url');

stdout.write(`\nADMIN_PASSWORD_HASH=pbkdf2-sha256$${ITERATIONS}$${b64(salt)}$${b64(bits)}\n`);
stdout.write(`SESSION_SECRET=${secret}\n\n`);

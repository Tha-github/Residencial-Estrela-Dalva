#!/usr/bin/env node
/** Gera o código de provisionamento e as chaves privadas do Worker. */
import { randomBytes } from 'node:crypto';

console.log(`PROVISIONING_KEY=${randomBytes(32).toString('base64url')}`);
console.log(`CONFIG_ENCRYPTION_KEY=${randomBytes(32).toString('base64url')}`);
console.log(`SESSION_SECRET=${randomBytes(48).toString('base64url')}`);
console.log('\nGuarde os valores em um gerenciador de senhas e cadastre cada um como secret no Worker.');

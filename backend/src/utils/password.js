import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const SALT_ROUNDS = 10;

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Deterministic hash used to store refresh tokens at rest (so a DB leak does
// not expose usable tokens).
export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

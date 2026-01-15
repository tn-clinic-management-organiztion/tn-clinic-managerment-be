import * as argon2 from 'argon2';

// Utility method
export function hashData(data: string): Promise<string> {
  return argon2.hash(data);
}

export function verifyHash(hash: string, data: string): Promise<boolean> {
  return argon2.verify(hash, data);
}

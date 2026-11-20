import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function getAuthPayload() {
  const token = (await cookies()).get('auth_token')?.value;
  const jwtSecret = process.env.JWT_SECRET;

  if (!token) return null;
  if (!jwtSecret) {
    console.error('JWT secret is not configured. Set JWT_SECRET in your environment.');
    return null;
  }

  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(jwtSecret));
    return payload;
  } catch {
    return null;
  }
}

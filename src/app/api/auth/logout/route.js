import { NextResponse } from 'next/server';
import { isSecureRequest } from '@/lib/auth-cookie';

export async function POST(request) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
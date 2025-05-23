import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '@/app/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get users collection
    const users = await getCollection('users');

    // Find user
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Create response with user data
    const response = NextResponse.json(
      { message: 'Login successful', user: userWithoutPassword },
      { status: 200 }
    );

    // Set cookie with user data
    response.cookies.set({
      name: 'user',
      value: JSON.stringify(userWithoutPassword),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
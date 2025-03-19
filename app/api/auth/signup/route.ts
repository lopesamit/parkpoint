import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/app/lib/mongodb';
import { User } from '@/app/models/User';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('data');
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user: Omit<User, '_id'> = {
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
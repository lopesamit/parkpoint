import { NextResponse } from 'next/server';

export async function GET() {
  // For now, we'll just return success since we don't have session management yet
  // In a real application, you would check the session/token here
  return NextResponse.json({ authenticated: true });
} 
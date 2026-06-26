import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasGeminiKey = !!apiKey && !apiKey.includes('your-');
  
  return NextResponse.json({
    hasGeminiKey
  });
}

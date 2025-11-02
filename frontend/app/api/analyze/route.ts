import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Proxying analyze request to Flask API...');
    
    // Flask APIにリクエストを転送
    const response = await fetch(`${FLASK_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flask API error:', response.status, errorText);
      throw new Error(`Flask API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Analysis request successful:', data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Analyze API endpoint',
    status: 'ready',
    flask_url: FLASK_API_URL
  });
}
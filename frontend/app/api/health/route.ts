import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

export async function GET() {
  try {
    // Flask APIのヘルスチェック
    const response = await fetch(`${FLASK_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Flask API health check failed: ${response.status}`);
    }
    
    const flaskHealth = await response.json();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      frontend: {
        status: 'healthy',
        version: '1.0.0'
      },
      backend: flaskHealth
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        frontend: {
          status: 'healthy',
          version: '1.0.0'
        },
        backend: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 503 }
    );
  }
}
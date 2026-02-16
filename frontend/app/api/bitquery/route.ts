// export const dynamic = 'force-dynamic'; // Disabled for static export

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    console.log('📊 Starting Jupiter (Token & Price) Data Collection...');
    
    // Path to the bitquery directory
    const bitqueryPath = path.join(process.cwd(), '..', 'bitquery');
    
    return new Promise<Response>((resolve) => {
      const child = spawn('node', ['index.mjs'], {
        cwd: bitqueryPath,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        console.log('Jupiter:', message.trim());
      });

      child.stderr.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        console.error('Jupiter Error:', message.trim());
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: 'Jupiter token & price data collection completed successfully',
            output: output,
            timestamp: new Date().toISOString()
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            message: 'Jupiter data collection failed',
            error: errorOutput,
            code: code,
            timestamp: new Date().toISOString()
          }, { status: 500 }));
        }
      });

      child.on('error', (error) => {
        resolve(NextResponse.json({
          success: false,
          message: 'Failed to start Jupiter data collection',
          error: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Jupiter API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({
    message: 'Token & Price Data (Jupiter Tokens V2) - Use POST to start collection',
    endpoints: {
      'POST /api/bitquery': 'Start Jupiter token & price data collection (tokens + prices)'
    }
  });
}

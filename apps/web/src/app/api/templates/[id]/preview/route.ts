import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const previewPath = path.join(process.cwd(), '../../templates/free', `${id}.preview.png`);
  const fallbackPath = path.join(process.cwd(), '../../templates/free', `${id}.preview.svg`);

  try {
    if (fs.existsSync(previewPath)) {
      const buffer = fs.readFileSync(previewPath);
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'image/png' }
      });
    }

    if (fs.existsSync(fallbackPath)) {
      const buffer = fs.readFileSync(fallbackPath);
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }

    return new NextResponse('Not Found', { status: 404 });
  } catch {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

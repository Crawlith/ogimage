import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const previewPath = path.join(process.cwd(), '../../templates', id, 'preview.png');
    const fallbackPath = path.join(process.cwd(), '../../templates', id, 'preview.svg');

    try {
        if (fs.existsSync(previewPath)) {
            const buffer = fs.readFileSync(previewPath);
            return new NextResponse(buffer, {
                headers: { 'Content-Type': 'image/png' },
            });
        }

        if (fs.existsSync(fallbackPath)) {
            const buffer = fs.readFileSync(fallbackPath);
            return new NextResponse(buffer, {
                headers: { 'Content-Type': 'image/svg+xml' },
            });
        }

        return new NextResponse('Not Found', { status: 404 });
    } catch (err) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

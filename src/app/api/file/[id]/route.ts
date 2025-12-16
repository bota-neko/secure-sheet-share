import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { readSheet } from '@/lib/googleSheets';
import { extractFileIdFromUrl } from '@/lib/utils';
import { Record } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { id } = await params;

    if (!session.isLoggedIn) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Fetch record to verify permission and get URL
    // Temporary: Read all records and find. (Ideally add getRecordById to db.ts)
    // Schema matches Record interface
    const records = await readSheet<Record>('records');
    const record = records.find((r) => r.record_id === id);

    if (!record) {
        return new NextResponse('Record Not Found', { status: 404 });
    }

    // 2. Check Permission
    let allowed = false;
    if (session.role === 'admin') {
        allowed = true;
    } else if (session.role !== 'facility_viewer' && record['facility_id' as keyof typeof record] === session.facility_id) {
        // Edit/Admin of facility
        allowed = true;
    } else if (session.role === 'facility_viewer' && record['facility_id' as keyof typeof record] === session.facility_id) {
        // Viewer of facility
        allowed = true;
    }

    if (!allowed) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    const fileId = extractFileIdFromUrl((record as any).file_url);
    if (!fileId) {
        return new NextResponse('Invalid File URL', { status: 400 });
    }

    // 4. Secure Redirect
    // Instead of streaming content, we redirect authorized users to the Google URL.
    // The Google Sheet MUST be set to "Anyone with the link can Edit" (or View).
    // The App acts as the "Gate" that keeps the URL secret.

    // Add access log here? (Optional, but we already have login logs)
    console.log(`User ${session.user_id} accessing file ${id} `);

    return NextResponse.redirect((record as any).file_url);
}

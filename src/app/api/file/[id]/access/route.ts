import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { drive } from '@/lib/googleSheets';
import { extractFileIdFromUrl } from '@/lib/utils';
import { getUserByLoginId } from '@/lib/db';
// Note: We need a way to get record by ID securely. 
// Re-using generic readSheet or similar logic.

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { id } = await params;

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get User's Google Email
    // Fetch fresh user data to be sure
    const user = await getUserByLoginId(session.login_id);
    if (!user || !user.google_email) {
        return NextResponse.json({ error: 'Google連携用メールアドレスが登録されていません' }, { status: 400 });
    }

    try {
        // 2. Fetch Record to get File URL
        const { readSheet } = await import('@/lib/googleSheets');
        const records = await readSheet<any>('records');
        const record = records.find((r: any) => r.record_id === id);

        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // Permission check
        let allowed = false;
        if (session.role === 'admin') {
            allowed = true;
        } else if (session.role !== 'facility_viewer' && record.facility_id === session.facility_id) {
            allowed = true;
        } else if (session.role === 'facility_viewer' && record.facility_id === session.facility_id) {
            allowed = true;
        }

        if (!allowed) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Extract File ID
        const fileId = extractFileIdFromUrl(record.file_url);
        if (!fileId) {
            return NextResponse.json({ error: 'Invalid File URL' }, { status: 400 });
        }

        // 4. Grant Permission via Drive API
        // Determine role based on Access Level and User Role
        let permissionRole = 'writer'; // Default to Editor

        if (session.role === 'facility_viewer') {
            permissionRole = 'reader';
        } else if (record.access_level === 'view_only') {
            // View Only file: Admin can still edit, others read only
            if (session.role !== 'admin') {
                permissionRole = 'reader';
            }
        }

        await drive.permissions.create({
            fileId,
            requestBody: {
                role: permissionRole,
                type: 'user',
                emailAddress: user.google_email,
            },
            fields: 'id',
        });

        // 5. Audit & Record Access
        const { recordUserAccess } = await import('@/lib/db');
        await recordUserAccess(session.user_id, id);

        // 6. Success
        return NextResponse.json({
            success: true,
            message: 'Granted',
            redirect_url: record.file_url
        });

    } catch (e: any) {
        console.error('Grant permission error:', e);
        // Drive API returns 400 if already exists? Or just ignores.
        // If it sends back an error saying "already shared", we consider it success.

        return NextResponse.json({ error: '権限付与に失敗しました: ' + e.message }, { status: 500 });
    }
}

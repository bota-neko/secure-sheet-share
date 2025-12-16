import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { updateRecord, softDeleteRecord, addAuditLog, getRecordsByFacility } from '@/lib/db';
import { readSheet } from '@/lib/googleSheets'; // Import readSheet correctly
import { Record } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { id } = await params;

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'facility_viewer') {
        return NextResponse.json({ error: '閲覧のみの権限です' }, { status: 403 });
    }

    try {
        // Fetch the existing record to check permissions
        const allRecords = await readSheet<Record>('records');
        const existing = allRecords.find(r => r.record_id === id);

        if (!existing) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // Authorization check: Only creator or admin can update
        if (existing.created_by !== session.user_id && session.role !== 'admin') {
            // Check if facility admin? maybe they can update?
            // Spec: "Admin" can delete. Creator can delete.
            // Update? Assuming same rules as delete for now.
            return NextResponse.json({ error: '権限がありません' }, { status: 403 });
        }

        const body = await request.json();
        const { file_name, file_creator, sharer, file_url, access_level } = body;

        // Access Level Change Permission
        if (access_level && access_level !== existing.access_level) {
            // Validate value
            if (!['editable', 'view_only', 'admin_only'].includes(access_level)) {
                return NextResponse.json({ error: 'Invalid access_level' }, { status: 400 });
            }

            // 'admin_only' can only be set by Global Admin
            if (access_level === 'admin_only' && session.role !== 'admin') {
                return NextResponse.json({ error: 'このアクセスレベルは全体管理者のみ設定可能です' }, { status: 403 });
            }
            // General logic: If we passed the earlier check (Creator or Admin/FacilityAdmin), we can generally change level
            // unless it's to 'admin_only' (checked above).
            // So no extra check needed here if we rely on "Creator/Admin" check at top.
        }

        let actorFacilityId = session.facility_id;
        if (session.role === 'admin') {
            if (body.facility_id) {
                actorFacilityId = body.facility_id;
            }
        }

        const updated = await updateRecord(actorFacilityId, session.user_id, id, {
            file_name,
            file_creator,
            sharer,
            file_url,
            access_level // Included
        });

        // Audit Log
        await addAuditLog({
            user_id: session.user_id,
            facility_id: actorFacilityId,
            action: 'RECORD_UPDATE',
            target_type: 'record',
            target_id: id,
            after_json: JSON.stringify(updated), // Todo: store before/after properly?
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Error updating record:', error);
        return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { id } = await params;

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Admin, FacilityAdmin, or FacilityEditor (own only)
    if (session.role !== 'admin' && session.role !== 'facility_admin' && session.role !== 'facility_editor') {
        return NextResponse.json({ error: '削除権限がありません' }, { status: 403 });
    }

    try {
        let facilityId = session.facility_id;

        // Fetch record to check permissions
        const { readSheet } = await import('@/lib/googleSheets');
        const records = await readSheet<Record>('records');
        const existing = records.find(r => r.record_id === id);

        if (!existing) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // Permission Logic
        if (session.role === 'facility_editor') {
            if (existing.created_by !== session.user_id) {
                return NextResponse.json({ error: '他人のデータを削除する権限はありません' }, { status: 403 });
            }
            // Editor can only delete own
        } else if (session.role === 'facility_admin') {
            // Facility Admin can delete any file in their facility
            if (existing.facility_id !== session.facility_id) {
                return NextResponse.json({ error: '自施設のデータのみ削除可能です' }, { status: 403 });
            }
        }
        // Admin is god

        // ... continue with softDeleteRecord
        // Note: softDeleteRecord takes facilityId.
        // If we are admin, we might need existing.facility_id, but 'system' is fine for the function call as analyzed before.

        // Wait, if I fetch here, I don't need to rely on softDeleteRecord's internal check blindly.
        // But softDeleteRecord calls `updateRow`.

        if (session.role === 'admin') facilityId = 'system';

        await softDeleteRecord(facilityId, session.user_id, id);

        // Audit Log
        await addAuditLog({
            user_id: session.user_id,
            facility_id: facilityId,
            action: 'RECORD_DELETE',
            target_type: 'record',
            target_id: id,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        return NextResponse.json({ success: true });


    } catch (error: any) {
        console.error('Delete error:', error);
        if (error.message.includes('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


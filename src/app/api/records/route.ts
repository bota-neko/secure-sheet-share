import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { createRecord, getRecordsByFacility, updateRecord, softDeleteRecord, addAuditLog } from '@/lib/db';

// GET: List records for logged in user's facility
export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow: facility_admin, facility_editor, facility_viewer
    // Admin? Spec says "Admin: All facilities view/edit".
    // But strictly speaking, the context is usually "Self Facility".
    // If admin wants to view, they might need to "masquerade" or we allow them to pass ?facility_id.
    // BUT the spec says: "认可是必ずサーバー側で強制し、facility_id不一致のデータは取得・更新・作成不可"
    // For Admin, we can relax this IF they are an Admin.

    let targetFacilityId = session.facility_id;

    if (session.role === 'admin') {
        const queryFacilityId = request.nextUrl.searchParams.get('facility_id');
        if (queryFacilityId) {
            targetFacilityId = queryFacilityId;
        } else {
            // If admin doesn't specify, maybe return nothing or require it?
            // Let's require it for clarity.
            return NextResponse.json({ error: 'Facility ID required for admin' }, { status: 400 });
        }
    }

    try {
        const records = await getRecordsByFacility(targetFacilityId);

        // Filter out admin_only for non-admins
        const visibleRecords = records.filter(r => {
            if (session.role === 'admin') return true;
            return r.access_level !== 'admin_only';
        });

        // Fetch user permissions
        const { getUserAccessedRecordIds } = await import('@/lib/db');
        const accessedIds = await getUserAccessedRecordIds(session.user_id);

        const recordsWithStatus = visibleRecords.map(r => ({
            ...r,
            is_accessed: accessedIds.has(r.record_id)
        }));

        return NextResponse.json(recordsWithStatus);
    } catch (error) {
        console.error('Error fetching records:', error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}

// POST: Create record
export async function POST(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'facility_viewer') {
        return NextResponse.json({ error: '閲覧のみの権限です' }, { status: 403 });
    }

    // Determine target facility
    let targetFacilityId = session.facility_id;
    if (session.role === 'admin') {
        const body = await request.clone().json();
        // We will parse properly below
    }

    try {
        const body = await request.json();
        const { file_name, file_creator, sharer, file_url, facility_id, access_level } = body;

        if (session.role === 'admin') {
            if (!facility_id) return NextResponse.json({ error: 'Facility ID is required for admin' }, { status: 400 });
            targetFacilityId = facility_id;
        }

        // Validate required fields
        if (!file_name || !file_creator || !sharer || !file_url) {
            return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
        }

        // Validate access_level
        if (access_level && !['editable', 'view_only', 'admin_only'].includes(access_level)) {
            return NextResponse.json({ error: 'Invalid access_level' }, { status: 400 });
        }

        const newRecord = await createRecord(targetFacilityId, session.user_id, {
            file_name,
            file_creator,
            sharer,
            file_url,
            access_level: access_level || 'editable'
        });

        // Audit Log
        await addAuditLog({
            user_id: session.user_id,
            facility_id: targetFacilityId,
            action: 'RECORD_CREATE',
            target_type: 'record',
            target_id: newRecord.record_id,
            after_json: JSON.stringify(newRecord),
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        return NextResponse.json(newRecord);

    } catch (error) {
        console.error('Error creating record:', error);
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
    }
}

// PUT: Update record
// We don't have a dynamic route file yet (e.g. [id]/route.ts).
// I will implement this in `src/app/api/records/route.ts` handling PUT with checking an ID in the body 
// OR simpler: use `src/app/api/records/[id]/route.ts` structure.
// Let's use the dynamic route structure for better design.
// I will just create GET/POST here.

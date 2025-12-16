import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { createFacility, getAllFacilities, addAuditLog } from '@/lib/db';

// Force re-compile
// GET: List all facilities
export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const facilities = await getAllFacilities();
        return NextResponse.json(facilities);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 });
    }
}

// POST: Create new facility
export async function POST(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, contact_email } = body;

        if (!name) {
            return NextResponse.json({ error: '施設名は必須です' }, { status: 400 });
        }

        const newFacility = await createFacility({
            name,
            contact_email: contact_email || '',
            status: 'active'
        });

        // Audit Log
        await addAuditLog({
            user_id: session.user_id,
            facility_id: session.facility_id,
            action: 'FACILITY_CREATE',
            target_type: 'facility',
            target_id: newFacility.facility_id,
            after_json: JSON.stringify(newFacility),
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        return NextResponse.json(newFacility);

    } catch (error) {
        console.error('Error creating facility:', error);
        return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 });
    }
}

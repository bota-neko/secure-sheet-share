import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { deleteFacility, addAuditLog } from '@/lib/db';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { id } = await params;

    if (!session.isLoggedIn || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await deleteFacility(id);

        // Audit Log
        await addAuditLog({
            user_id: session.user_id,
            facility_id: session.facility_id,
            action: 'FACILITY_DELETE',
            target_type: 'facility',
            target_id: id,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting facility:', error);
        return NextResponse.json({ error: 'Failed to delete facility' }, { status: 500 });
    }
}

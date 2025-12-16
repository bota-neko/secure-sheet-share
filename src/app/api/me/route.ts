import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { getFacilityById } from '@/lib/db';

export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (session.isLoggedIn) {
        let facilityName = '';
        if (session.facility_id) {
            const facility = await getFacilityById(session.facility_id);
            facilityName = facility ? facility.name : '';
        }

        return NextResponse.json({
            isLoggedIn: true,
            user: {
                login_id: session.login_id,
                role: session.role,
                facility_id: session.facility_id,
                facility_name: facilityName, // Expose name
                google_email: session.google_email,
            },
        });
    } else {
        return NextResponse.json({
            isLoggedIn: false,
        });
    }
}

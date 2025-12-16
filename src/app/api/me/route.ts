import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (session.isLoggedIn) {
        return NextResponse.json({
            isLoggedIn: true,
            user: {
                login_id: session.login_id,
                role: session.role,
                facility_id: session.facility_id,
                google_email: session.google_email,
            },
        });
    } else {
        return NextResponse.json({
            isLoggedIn: false,
        });
    }
}

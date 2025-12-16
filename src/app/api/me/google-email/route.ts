import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { updateRow } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { google_email } = await request.json();

        // Update in DB
        await updateRow('users', 'user_id', session.user_id, { google_email });

        // Update Session
        session.google_email = google_email;
        await session.save();

        // Create the actual response
        const jsonResponse = NextResponse.json({ success: true, google_email });

        // CRITICAL: Transfer the Set-Cookie header from the session response object to the final JSON response
        // because iron-session wrote the cookie to 'response', not 'jsonResponse'.
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            jsonResponse.headers.set('set-cookie', setCookie);
        }

        return jsonResponse;

    } catch (error) {
        console.error('Update email error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

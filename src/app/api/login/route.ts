import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData, verifyPassword } from '@/lib/auth';
import { getUserByLoginId } from '@/lib/db';

export async function POST(request: NextRequest) {
    const { login_id, password } = await request.json();

    if (!login_id || !password) {
        return NextResponse.json({ error: 'IDとパスワードを入力してください' }, { status: 400 });
    }

    try {
        const user = await getUserByLoginId(login_id);

        if (!user) {
            // Don't reveal user existence
            return NextResponse.json({ error: 'IDまたはパスワードが間違っています' }, { status: 401 });
        }

        const isMatch = await verifyPassword(password, user.password_hash);

        if (!isMatch) {
            // TODO: Implement lockout logic here (failed attempts)
            return NextResponse.json({ error: 'IDまたはパスワードが間違っています' }, { status: 401 });
        }

        const response = new NextResponse(JSON.stringify({ success: true }));
        const session = await getIronSession<SessionData>(request, response, sessionOptions);

        session.user_id = user.user_id;
        session.facility_id = user.facility_id;
        session.role = user.role;
        session.login_id = user.login_id;
        session.isLoggedIn = true;

        await session.save();

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: `エラーが発生しました: ${(error as Error).message}` }, { status: 500 });
    }
}

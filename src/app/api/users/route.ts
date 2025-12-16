import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData, hashPassword } from '@/lib/auth';
import { createUser, getUsersByFacility, getAllFacilities, addAuditLog, getUserByLoginId, getAllUsers } from '@/lib/db';
import { User } from '@/lib/types';

// GET: List users
export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let users: User[] = [];
        if (session.role === 'admin') {
            // Admin: Can see all users, or filter by facility_id query param
            // For simplicity, let's just return all users if no param, or filtered
            // But we don't have getAllUsers in db.ts yet, let's assume we want to support facility viewing
            const facilityId = request.nextUrl.searchParams.get('facility_id');
            if (facilityId) {
                users = await getUsersByFacility(facilityId);
            } else {
                // Admin sees all users
                // We need a helper for this or just use readSheet (but db.ts abstracts it)
                // Let's import readSheet or add getAllUsers to db.ts
                // For now, I'll add getAllUsers to db.ts in next step or use what I have.
                // Wait, I can't import `readSheet` here easily if I want to stick to db abstraction.
                // Let's assume I will add `getAllUsers` to db.ts.
                // BUT for this step I must return something.
                // I will modify db.ts first? No, I can modify this file.
                // actually `getUsersByFacility` is just a filter.
                // I will use a new function `getAllUsers` which I will add to db.ts
                // For now let's just use a placeholder and then fix db.ts
                users = await getAllUsers();
            }
        } else {
            // Facility Admin: Can only see their own facility users
            if (session.role === 'facility_admin') {
                users = await getUsersByFacility(session.facility_id);
            } else {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Sanitize secrets
        const sanitized = users.map(u => {
            const { password_hash, ...rest } = u;
            return rest;
        });

        return NextResponse.json(sanitized);

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST: Create new user
export async function POST(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { login_id, password, role, facility_id, email } = body;

        // Validation
        if (!login_id || !password || !role) {
            return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
        }

        // Permission Check
        let targetFacilityId = facility_id;

        if (session.role === 'admin') {
            // Admin user creation logic
            if (role === 'admin') {
                targetFacilityId = 'system';
            } else {
                // If creating normal user, facility_id is required
                if (!targetFacilityId) return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 });
            }
        } else if (session.role === 'facility_admin') {
            // Facility Admin can only create users for their own facility
            if (targetFacilityId && targetFacilityId !== session.facility_id) {
                return NextResponse.json({ error: '自施設のユーザーのみ作成可能です' }, { status: 403 });
            }
            targetFacilityId = session.facility_id;

            // Cannot create 'admin' role
            if (role === 'admin') {
                return NextResponse.json({ error: '管理者ユーザーは作成できません' }, { status: 403 });
            }
        } else {
            return NextResponse.json({ error: '権限がありません' }, { status: 403 });
        }

        // Check uniqueness
        const existing = await getUserByLoginId(login_id);
        if (existing) {
            return NextResponse.json({ error: 'このログインIDは既に使用されています' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await createUser({
            facility_id: targetFacilityId,
            login_id,
            email: email || '',
            password_hash: hashedPassword,
            role, // TODO: validate role against enum
            status: 'active',
            last_login_at: ''
        });

        // Audit Log
        await addAuditLog({
            user_id: session.user_id,
            facility_id: session.facility_id,
            action: 'USER_CREATE',
            target_type: 'user',
            target_id: newUser.user_id,
            after_json: JSON.stringify({ ...newUser, password_hash: '***' }),
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        const { password_hash, ...safeUser } = newUser;
        return NextResponse.json(safeUser);

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

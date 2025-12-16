import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';
import { deleteUser, addAuditLog, getUserById } from '@/lib/db';

// DELETE: Delete (soft delete) a user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { id } = await params;

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const targetUser = await getUserById(id);
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Overall Admin Protection
        if (targetUser.login_id === 'admin-share-sheet') {
            return NextResponse.json({ error: '全体管理者は削除できません' }, { status: 403 });
        }

        // 2. Admin vs Admin Protection
        if (targetUser.role === 'admin') {
            // Only 'admin' (Root) can delete other admins
            if (session.login_id !== 'admin-share-sheet') {
                return NextResponse.json({ error: '運用管理者は他の管理者を削除できません' }, { status: 403 });
            }
        }

        // 3. Facility Admin Permission Check
        if (session.role === 'facility_admin') {
            // Can only delete users in same facility
            if (targetUser.facility_id !== session.facility_id) {
                return NextResponse.json({ error: '他グループのユーザーは削除できません' }, { status: 403 });
            }
        }

        // 4. General permission check (already covered by role checks above, but good to be safe)
        if (session.role !== 'admin' && session.role !== 'facility_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await deleteUser(id);

        await addAuditLog({
            user_id: session.user_id,
            facility_id: session.facility_id,
            action: 'USER_DELETE',
            target_type: 'user',
            target_id: id,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

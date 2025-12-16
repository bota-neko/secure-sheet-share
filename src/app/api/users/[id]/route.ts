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

// PUT: Update user (e.g. Role change)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { id } = await params;

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { updateUser, getUserById } = await import('@/lib/db');
        const targetUser = await getUserById(id);

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Permission Check
        let allowed = false;

        // 1. Root Admin cannot be edited this way (safety)
        if (targetUser.login_id === 'admin-share-sheet') {
            return NextResponse.json({ error: '全体管理者は編集できません' }, { status: 403 });
        }

        // 2. Admin Logic
        if (session.role === 'admin') {
            // Can edit anyone basic fields
            allowed = true;
        }
        // 3. Facility Admin Logic
        else if (session.role === 'facility_admin') {
            if (targetUser.facility_id === session.facility_id) {
                // Cannot edit other admins? 
                // Creating user logic says: "Cannot create admin".
                // Editing user: If target is 'admin', Facility Admin cannot touch.
                if (targetUser.role === 'admin') {
                    return NextResponse.json({ error: '管理者ユーザーは編集できません' }, { status: 403 });
                }
                allowed = true;
            }
        }

        if (!allowed) {
            return NextResponse.json({ error: '権限がありません' }, { status: 403 });
        }

        const body = await request.json();
        const { role, password, status } = body;

        // Role Validation for Facility Admin
        if (session.role === 'facility_admin' && role === 'admin') {
            return NextResponse.json({ error: '管理者権限は付与できません' }, { status: 403 });
        }

        // Prepare updates
        const updates: any = {};
        if (role) updates.role = role;
        if (status) updates.status = status;
        // Password update logic if needed
        if (password) {
            const { hashPassword } = await import('@/lib/auth');
            updates.password_hash = await hashPassword(password);
        }

        const updatedUser = await updateUser(id, updates);

        const { password_hash, ...safeUser } = updatedUser;

        const { addAuditLog } = await import('@/lib/db');
        await addAuditLog({
            user_id: session.user_id,
            facility_id: session.facility_id,
            action: 'USER_UPDATE',
            target_type: 'user',
            target_id: id,
            after_json: JSON.stringify(safeUser),
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || '',
        });

        return NextResponse.json(safeUser);

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

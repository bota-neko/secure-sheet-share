'use client';

import useSWR from 'swr';
import { Facility, User } from '@/lib/types';
import { forwardRef, useImperativeHandle, useState } from 'react';
import Modal from './Modal';
import useUser from '@/hooks/useUser';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserManagementProps {
    facilities: Facility[];
}

export interface UserManagementRef {
    refresh: () => void;
}

const UserManagement = forwardRef<UserManagementRef, UserManagementProps>(({ facilities }, ref) => {
    const { data: users, mutate } = useSWR<User[]>('/api/users', fetcher);
    const { user: currentUser } = useUser();

    useImperativeHandle(ref, () => ({
        refresh: () => mutate()
    }));

    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/users/${deleteTarget.user_id}`, { method: 'DELETE' });
            if (res.ok) {
                mutate();
                setDeleteTarget(null);
            } else {
                const data = await res.json();
                alert(data.error || '削除に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    // Helper to get facility name
    const getFacilityName = (id: string) => {
        if (id === 'system') return 'システム (全体管理者)';
        return facilities.find(f => f.facility_id === id)?.name || '削除されたグループ';
    };

    const canDelete = (targetUser: User) => {
        if (!currentUser) return false;
        // Cannot delete Root
        if (targetUser.login_id === 'admin-share-sheet') return false;

        // Admin vs Admin
        if (targetUser.role === 'admin') {
            // Only Root can delete other admins
            return currentUser.login_id === 'admin-share-sheet';
        }

        // Standard user
        return true;
    };

    return (
        <section style={{ marginTop: '3rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>ユーザー管理</h3>

            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: 'var(--muted)', textAlign: 'left' }}>
                        <tr>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>ID</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>権限</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>所属グループ</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((u) => (
                            <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem 1rem' }}><strong>{u.login_id}</strong></td>
                                <td style={{ padding: '0.75rem 1rem' }}>{u.role}</td>
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                                    {getFacilityName(u.facility_id)}
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {canDelete(u) && (
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(u)}
                                            style={{
                                                color: 'var(--danger)',
                                                border: '1px solid var(--danger)',
                                                borderRadius: '4px',
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                background: '#fff',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            削除
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!users || users.length === 0) && (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                    ユーザーがいません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Modal
                isOpen={!!deleteTarget}
                title="ユーザー削除"
                onClose={() => setDeleteTarget(null)}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>キャンセル</button>
                        <button
                            className="btn btn-primary"
                            style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? '処理中...' : '削除する'}
                        </button>
                    </>
                }
            >
                <p>{deleteTarget?.login_id} を本当に削除（無効化）しますか？</p>
            </Modal>
        </section>
    );
});

UserManagement.displayName = 'UserManagement';
export default UserManagement;

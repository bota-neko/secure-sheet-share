'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import useUser from '@/hooks/useUser';
import { Facility } from '@/lib/types';
import UserManagement, { UserManagementRef } from './UserManagement';
import FacilityRecords from './FacilityRecords';
import AddFacilityForm from './AddFacilityForm';
import AddUserForm from './AddUserForm';
import Modal from './Modal';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: authLoading } = useUser();
    const { data: facilities, error: facilitiesError, mutate } = useSWR<Facility[]>('/api/admin/facilities', fetcher);

    const userManagementRef = useRef<UserManagementRef>(null);
    const [viewingRecordsFor, setViewingRecordsFor] = useState<Facility | null>(null);

    // Delete Modal State
    const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/facilities/${deleteTarget.facility_id}`, { method: 'DELETE' });
            if (res.ok) {
                mutate();
                setDeleteTarget(null);
            } else {
                alert('削除に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    // Auth check handled by middleware, but visually we can wait
    if (authLoading) return <div className="container" style={{ paddingTop: '2rem' }}>読み込み中...</div>;
    if (!isLoggedIn || user?.role !== 'admin') {
        return null; // Or redirect
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h2>管理者ダッシュボード</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>{user.login_id} (Admin)</span>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>ログアウト</button>
                </div>
            </header>

            {/* Sharing Group List */}
            <section style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>共有グループ一覧</h3>
                <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: 'var(--muted)', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>グループ名</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>ID</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>ステータス</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>連絡先</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>作成日</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facilities?.map((f) => (
                                <tr key={f.facility_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}><strong>{f.name}</strong></td>
                                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>{f.facility_id}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            backgroundColor: f.status === 'active' ? '#dcfce7' : '#f3f4f6',
                                            color: f.status === 'active' ? '#166534' : '#6b7280',
                                            fontSize: '0.75rem'
                                        }}>
                                            {f.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{f.contact_email}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{new Date(f.created_at).toLocaleDateString("ja-JP")}</td>
                                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                            onClick={() => setViewingRecordsFor(f)}
                                        >
                                            データ管理
                                        </button>
                                        <button
                                            type="button"
                                            style={{
                                                color: 'var(--danger)',
                                                border: '1px solid var(--danger)',
                                                borderRadius: '4px',
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                background: '#fff',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setDeleteTarget(f)}
                                        >
                                            削除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!facilities || facilities.length === 0) && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                        グループが見つかりません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {viewingRecordsFor && (
                    <FacilityRecords
                        facilityId={viewingRecordsFor.facility_id}
                        facilityName={viewingRecordsFor.name}
                        onClose={() => setViewingRecordsFor(null)}
                    />
                )}
            </section>

            {/* Top Forms Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                <AddFacilityForm onCreated={mutate} />
                <AddUserForm facilities={facilities || []} onCreated={() => userManagementRef.current?.refresh()} />
            </div>

            <UserManagement ref={userManagementRef} facilities={facilities || []} />

            <Modal
                isOpen={!!deleteTarget}
                title="グループ削除"
                message={`${deleteTarget?.name} を本当に削除（無効化）しますか？`}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                confirmText="削除する"
                isProcessing={isDeleting}
                type="confirm"
            />
        </div>
    );
}

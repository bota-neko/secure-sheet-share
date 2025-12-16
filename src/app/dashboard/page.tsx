'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import useUser from '@/hooks/useUser';
import { Record } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FacilityDashboard() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: authLoading } = useUser();
    const { data: records, error: recordsError, mutate } = useSWR<Record[]>('/api/records', fetcher);
    const { data: config } = useSWR('/api/config', fetcher);

    const [showModal, setShowModal] = useState(false);

    // Form State
    const [fileCreator, setFileCreator] = useState('');
    const [fileName, setFileName] = useState('');
    const [sharer, setSharer] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [accessLevel, setAccessLevel] = useState<'writer' | 'reader'>('writer'); // Default writer
    const [submitting, setSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Record | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Auth Check - Must be after all hooks
    const shouldRender = !authLoading && isLoggedIn && user?.role !== 'admin';
    if (authLoading) return <div className="container" style={{ paddingTop: '2rem' }}>読み込み中...</div>;
    if (!shouldRender) return null;



    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    const handleCreateRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const url = editingRecord ? `/api/records/${editingRecord.record_id}` : '/api/records';
        const method = editingRecord ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_name: fileName, file_creator: fileCreator, sharer, file_url: fileUrl, access_level: accessLevel }),
            });

            if (res.ok) {
                setFileName('');
                setFileCreator('');
                setSharer('');
                setFileUrl('');
                setAccessLevel('writer');
                setEditingRecord(null);
                setShowModal(false);
                mutate();
            } else {
                alert('操作に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/records/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                mutate();
                setDeleteId(null);
            } else {
                alert('削除に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        }
    };

    const handleOpenEdit = (r: Record) => {
        setEditingRecord(r);
        setFileName(r.file_name || '');
        setFileCreator(r.file_creator);
        setSharer(r.sharer);
        setFileUrl(r.file_url);
        setAccessLevel(r.access_level || 'writer');
        setShowModal(true);
    };



    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRecord(null);
        setFileName('');
        setFileCreator('');
        setSharer('');
        setFileUrl('');
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                    <h2>施設データ管理</h2>
                    <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {user?.facility_name ? `グループ: ${user.facility_name}` : '読み込み中...'}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                        <div style={{ marginBottom: '0.25rem' }}>ID: {user?.login_id}</div>
                        <GoogleEmailSettings currentEmail={user?.google_email} mutateUser={() => window.location.reload()} />
                    </div>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>ログアウト</button>
                </div>
            </header>

            <section style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>登録リスト</h3>
                {user?.role !== 'facility_viewer' && (
                    <button className="btn btn-primary" onClick={() => { setEditingRecord(null); setFileCreator(''); setSharer(''); setFileUrl(''); setShowModal(true); }}>
                        + 新規登録
                    </button>
                )}
            </section>

            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: 'var(--muted)', textAlign: 'left' }}>
                        <tr>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>ファイル名</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>作成者</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>共有者</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>リンク</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>登録日</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records?.map((r) => (
                            <tr key={r.record_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{r.file_name}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{r.file_creator}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{r.sharer}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <Link
                                        href={`/dashboard/open/${r.record_id}`}
                                        target="_blank"
                                        style={{
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            color: r.is_accessed ? '#166534' : '#fff',
                                            backgroundColor: r.is_accessed ? '#dcfce7' : 'var(--primary)',
                                            border: r.is_accessed ? '1px solid #bbf7d0' : 'none',
                                            padding: '0.375rem 0.75rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            transition: 'opacity 0.2s'
                                        }}
                                        className={!r.is_accessed ? 'btn-primary-hover' : ''}
                                    >
                                        {r.is_accessed ? '✅ 接続済み' : '🚀 共同編集を開く'}
                                    </Link>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)' }}>
                                    {new Date(r.created_at).toLocaleDateString("ja-JP")}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                        onClick={() => handleOpenEdit(r)}
                                        disabled={user?.role !== 'admin' && r.created_by !== user?.user_id}
                                    >
                                        編集
                                    </button>
                                    {(user?.role === 'admin' || r.created_by === user?.user_id) && (
                                        <button
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                            onClick={() => handleDeleteClick(r.record_id)}
                                        >
                                            削除
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!records || records.length === 0) && (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                    データがありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingRecord ? 'データ編集' : '新規登録'}</h3>
                        <form onSubmit={handleCreateRecord}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">ファイル名 (必須)</label>
                                <input className="input" value={fileName} onChange={e => setFileName(e.target.value)} required placeholder="例: 2024年度 顧客リスト" />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">ファイル作成者 (必須)</label>
                                <input className="input" value={fileCreator} onChange={e => setFileCreator(e.target.value)} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">共有者 (必須)</label>
                                <input className="input" value={sharer} onChange={e => setSharer(e.target.value)} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">ファイルURL (必須)</label>
                                <input className="input" type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} required placeholder="https://..." />
                            </div>

                            {config && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '0.875rem', color: '#0369a1' }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ 共有設定について</p>
                                    <p style={{ marginBottom: '0.5rem' }}>登録するファイルは、Googleドライブ上で以下のシステム用メールアドレスを「編集者」として追加してください。</p>
                                    <code style={{ display: 'block', padding: '0.5rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #bae6fd', userSelect: 'all' }}>
                                        {config.systemEmail}
                                    </code>
                                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>システムがこのアカウント経由で、閲覧者に自動的に編集権限を付与します。</p>
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">公開権限</label>
                                <select
                                    className="input"
                                    value={accessLevel} // Changed from selectedAccessLevel to accessLevel
                                    onChange={e => setAccessLevel(e.target.value as 'writer' | 'reader')}
                                    required
                                >
                                    <option value="writer">共同編集 (編集可能)</option>
                                    <option value="reader">閲覧のみ (編集不可)</option>
                                </select>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--muted-foreground)' }}>
                                    ※「共同編集」はユーザーがファイルを直接編集できます。「閲覧のみ」は見るだけです。
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>キャンセル</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>登録</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>削除の確認</h3>
                        <p style={{ marginBottom: '1.5rem' }}>本当にこのデータを削除しますか？この操作は取り消せません。</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setDeleteId(null)}>キャンセル</button>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={confirmDelete}>削除する</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function GoogleEmailSettings({ currentEmail, mutateUser }: { currentEmail?: string, mutateUser?: () => void }) {
    const [editing, setEditing] = useState(false);
    const [email, setEmail] = useState(currentEmail || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/me/google-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ google_email: email })
            });
            if (!res.ok) throw new Error();

            setEditing(false);
            if (mutateUser) mutateUser();
        } catch (e) {
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleUnlink = async () => {
        if (!confirm('Googleアカウントとの連携を解除しますか？\n（解除後は共同編集ができなくなります）')) return;
        setSaving(true);
        try {
            const res = await fetch('/api/me/google-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ google_email: '' })
            });
            if (!res.ok) throw new Error();

            if (mutateUser) mutateUser();
        } catch (e) {
            alert('解除に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor: currentEmail ? '#dcfce7' : '#fee2e2',
                    color: currentEmail ? '#166534' : '#991b1b',
                    border: '1px solid',
                    borderColor: currentEmail ? '#bbf7d0' : '#fecaca'
                }}>
                    {currentEmail ? `連携済: ${currentEmail}` : 'Google未連携 ⚠️'}
                </span>
                <button
                    onClick={() => setEditing(true)}
                    style={{
                        fontSize: '0.75rem',
                        border: '1px solid var(--border)',
                        background: '#fff',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem'
                    }}
                >
                    {currentEmail ? '変更' : '設定'}
                </button>
                {currentEmail && (
                    <button
                        onClick={handleUnlink}
                        disabled={saving}
                        style={{
                            fontSize: '0.75rem',
                            border: '1px solid var(--danger)',
                            background: '#fff',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem'
                        }}
                    >
                        解除
                    </button>
                )}
            </div>

            {/* Google Email Modal */}
            {editing && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 120
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Googleアカウント連携</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
                            共同編集に使用するGoogleアカウント（Gmailアドレス）を入力してください。
                            <br /><span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>※このメールアドレスに権限が付与されます。</span>
                        </p>

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Googleメールアドレス</label>
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="example@gmail.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>キャンセル</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? '保存中...' : '保存して連携'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

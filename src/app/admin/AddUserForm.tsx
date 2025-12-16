// imports
import { useState } from 'react';
import { Facility } from '@/lib/types';
import Modal from './Modal';

interface AddUserFormProps {
    facilities: Facility[];
    onCreated: () => void;
}

export default function AddUserForm({ facilities, onCreated }: AddUserFormProps) {
    const [selectedFacility, setSelectedFacility] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    // New: Role selection for facility admin
    const [selectedRole, setSelectedRole] = useState<'facility_admin' | 'facility_editor' | 'facility_viewer'>('facility_editor');
    const [creating, setCreating] = useState(false);

    // Modal State
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'alert' as 'alert' | 'confirm' });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Facility required unless creating check is Admin
        if ((!isAdmin && !selectedFacility) || !loginId || !password) return;

        setCreating(true);

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facility_id: isAdmin ? 'system' : selectedFacility,
                    login_id: loginId,
                    password: password,
                    role: isAdmin ? 'admin' : selectedRole,
                    status: 'active'
                }),
            });

            if (res.ok) {
                setLoginId('');
                setPassword('');
                onCreated();
                setModal({ isOpen: true, title: '成功', message: 'ユーザーを作成しました', type: 'alert' });
            } else {
                const data = await res.json();
                setModal({ isOpen: true, title: 'エラー', message: data.error || '作成に失敗しました', type: 'alert' });
            }
        } catch (e) {
            setModal({ isOpen: true, title: 'エラー', message: 'エラーが発生しました', type: 'alert' });
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <section className="card" style={{ height: '100%' }}>
                <h4 style={{ marginBottom: '1rem' }}>新規ユーザー追加</h4>
                <form onSubmit={handleCreateUser}>
                    <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--muted)', borderRadius: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem', fontWeight: 'bold' }}>
                            <input
                                type="checkbox"
                                checked={isAdmin}
                                onChange={e => {
                                    setIsAdmin(e.target.checked);
                                    if (e.target.checked) setSelectedFacility('');
                                }}
                            />
                            システム管理者（全体権限）として作成
                        </label>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--muted-foreground)', marginLeft: '1.5rem' }}>
                            ※チェックを入れると、全てのグループを管理できる管理者権限が付与されます。
                        </p>
                    </div>

                    <div style={{ marginBottom: '1rem', opacity: isAdmin ? 0.5 : 1, pointerEvents: isAdmin ? 'none' : 'auto' }}>
                        <label className="label">対象グループ</label>
                        <select
                            className="input"
                            value={selectedFacility}
                            onChange={e => setSelectedFacility(e.target.value)}
                            required={!isAdmin}
                            disabled={isAdmin}
                        >
                            <option value="">選択してください</option>
                            {facilities.map(f => (
                                <option key={f.facility_id} value={f.facility_id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!isAdmin && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">権限設定</label>
                            <select
                                className="input"
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value as any)}
                                required
                            >
                                <option value="facility_admin">管理者 (ユーザー管理・全ファイル操作)</option>
                                <option value="facility_editor">編集者 (ファイルの追加・編集のみ)</option>
                                <option value="facility_viewer">閲覧者 (閲覧のみ)</option>
                            </select>
                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--muted-foreground)' }}>
                                ※通常は「編集者」または「閲覧者」を選択してください。
                            </p>
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">ログインID</label>
                        <input
                            className="input"
                            value={loginId}
                            onChange={e => setLoginId(e.target.value)}
                            required
                            placeholder="半角英数字"
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">初期パスワード</label>
                        <input
                            className="input"
                            type="text"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="8文字以上推奨"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
                        {creating ? '追加中...' : 'ユーザーを追加'}
                    </button>
                </form>
            </section>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onClose={() => setModal({ ...modal, isOpen: false })}
            />
        </>
    );
}

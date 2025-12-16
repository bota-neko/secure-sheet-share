// imports
import { useState } from 'react';
import Modal from './Modal';

export default function AddFacilityForm({ onCreated }: { onCreated: () => void }) {
    const [newFacilityName, setNewFacilityName] = useState('');
    const [newFacilityEmail, setNewFacilityEmail] = useState('');
    const [creating, setCreating] = useState(false);

    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'alert' as 'alert' | 'confirm' });

    const handleCreateFacility = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFacilityName) return;
        setCreating(true);

        try {
            const res = await fetch('/api/admin/facilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFacilityName, contact_email: newFacilityEmail }),
            });
            if (res.ok) {
                setNewFacilityName('');
                setNewFacilityEmail('');
                onCreated();
                setModal({ isOpen: true, title: '成功', message: 'グループを作成しました', type: 'alert' });
            } else {
                setModal({ isOpen: true, title: 'エラー', message: '作成に失敗しました', type: 'alert' });
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
                <h3 style={{ marginBottom: '1rem' }}>新規共有グループ追加</h3>
                <form onSubmit={handleCreateFacility}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">グループ名 (必須)</label>
                        <input className="input" value={newFacilityName} onChange={e => setNewFacilityName(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">連絡先メール (任意)</label>
                        <input className="input" type="email" value={newFacilityEmail} onChange={e => setNewFacilityEmail(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={creating} style={{ width: '100%' }}>
                        {creating ? '追加中...' : 'グループを追加'}
                    </button>
                </form>
            </section>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                onClose={() => setModal({ ...modal, isOpen: false })}
            >
                <p>{modal.message}</p>
            </Modal>
        </>
    );
}

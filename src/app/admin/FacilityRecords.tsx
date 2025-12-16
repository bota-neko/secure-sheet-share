'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Record } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FacilityRecordsProps {
    facilityId: string;
    facilityName: string;
    onClose: () => void;
}

export default function FacilityRecords({ facilityId, facilityName, onClose }: FacilityRecordsProps) {
    // Admin needs to pass facility_id query
    const { data: records, mutate } = useSWR<Record[]>(`/api/records?facility_id=${facilityId}`, fetcher);

    const [showModal, setShowModal] = useState(false);

    // Form State
    const [fileName, setFileName] = useState('');
    const [fileCreator, setFileCreator] = useState('');
    const [sharer, setSharer] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [editingRecord, setEditingRecord] = useState<Record | null>(null);

    const handleCreateRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const url = editingRecord ? `/api/records/${editingRecord.record_id}` : '/api/records';
        const method = editingRecord ? 'PUT' : 'POST';

        // Admin must provide facility_id in body for create, but maybe not update?
        // Actually updateRecord checks facility_id match.
        const body: any = {
            file_name: fileName,
            file_creator: fileCreator,
            sharer,
            file_url: fileUrl
        };
        if (!editingRecord) {
            body.facility_id = facilityId;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setFileName('');
                setFileCreator('');
                setSharer('');
                setFileUrl('');
                setEditingRecord(null);
                setShowModal(false);
                mutate();
                alert('操作成功しました');
            } else {
                alert('操作に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
            if (res.ok) mutate();
            else alert('削除に失敗しました');
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
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: '#f9fafb', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>{facilityName} のデータ管理</h4>
                <div>
                    <button className="btn btn-primary" style={{ marginRight: '0.5rem', fontSize: '0.8rem' }} onClick={() => { setEditingRecord(null); setFileName(''); setFileCreator(''); setSharer(''); setFileUrl(''); setShowModal(true); }}>+ 新規登録</button>
                    <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={onClose}>閉じる</button>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: 'var(--muted)', textAlign: 'left' }}>
                        <tr>
                            <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>ファイル名</th>
                            <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>ファイル作成者</th>
                            <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>共有者</th>
                            <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>ファイルURL</th>
                            <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>登録日</th>
                            <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records?.map((r) => (
                            <tr key={r.record_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem' }}><strong>{r.file_name}</strong></td>
                                <td style={{ padding: '0.5rem' }}>{r.file_creator}</td>
                                <td style={{ padding: '0.5rem' }}>{r.sharer}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Link</a>
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    {new Date(r.created_at).toLocaleDateString("ja-JP")}
                                </td>
                                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                        onClick={() => handleOpenEdit(r)}
                                    >
                                        編集
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                        onClick={() => handleDelete(r.record_id)}
                                    >
                                        削除
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!records || records.length === 0) && (
                            <tr>
                                <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>データなし</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal for Admin */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{facilityName}: {editingRecord ? '編集' : '新規登録'}</h3>
                        <form onSubmit={handleCreateRecord}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">ファイル名 (必須)</label>
                                <input className="input" value={fileName} onChange={e => setFileName(e.target.value)} required placeholder="例: ファイル名" />
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
                                <input className="input" type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>キャンセル</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>登録</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

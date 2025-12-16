'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OpenFilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [message, setMessage] = useState('Googleドライブに接続中...');

    useEffect(() => {
        if (!id) return;

        const connect = async () => {
            try {
                const res = await fetch(`/api/file/${id}/access`, { method: 'POST' });
                const json = await res.json();

                if (!res.ok) {
                    setStatus('error');
                    setMessage(json.error || '不明なエラーが発生しました');
                    return;
                }

                setStatus('success');
                setMessage('接続成功。Googleドライブへ移動します...');

                // Fetch record to get URL (or maybe API should return it? API Access currently doesn't)
                // Wait, Access API creates permission but doesn't return URL?
                // Actually the current Access API implementation returns { success: true }.
                // We need the URL.
                // Optimally, the Access API should return the destination URL.

                // For now, let's fetch the record details to get the URL ?
                // Or update Access API to return it. 
                // Updating Access API is better.

                if (json.redirect_url) {
                    window.location.href = json.redirect_url;
                } else {
                    // Fallback if API hasn't been updated yet?
                    // But let's assume I will update the API next.
                    setMessage('移動先のURLが見つかりません');
                    setStatus('error');
                }

            } catch (e) {
                setStatus('error');
                setMessage('接続エラーが発生しました');
            }
        };

        connect();
    }, [id]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                {status === 'loading' && (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <h3>Googleドライブへ接続中...</h3>
                        <p style={{ color: '#666', fontSize: '0.875rem' }}>権限を確認しています。そのままお待ちください。</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'green' }}>✅</div>
                        <h3>接続成功</h3>
                        <p style={{ color: '#666' }}>Googleドライブを開いています...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 style={{ color: '#d32f2f' }}>エラーが発生しました</h3>
                        <p style={{ margin: '1rem 0', fontWeight: 'bold' }}>{message}</p>

                        {message.includes('Google連携') && (
                            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff4f4', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Googleアカウントの連携が必要です。</p>
                                <button
                                    onClick={() => window.close()}
                                    style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
                                >
                                    このタブを閉じて設定する
                                </button>
                            </div>
                        )}
                        {!message.includes('Google連携') && (
                            <button onClick={() => window.close()} style={{ marginTop: '1rem' }}>閉じる</button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login_id: loginId, password }),
            });

            if (res.ok) {
                // Redirect handled by middleware mostly, but let's push to dashboard or reload
                // Since middleware handles initial role redirect, we can just go to root or check body
                // But for simplicity, we force a refresh or goto root and let middleware route
                router.push('/');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'ログインに失敗しました');
            }
        } catch (err) {
            setError('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>ログイン</h2>

                {error && (
                    <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label" htmlFor="loginId">ログインID</label>
                        <input
                            id="loginId"
                            type="text"
                            className="input"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label" htmlFor="password">パスワード</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>
            </div>
            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                初期アカウント情報は管理者に問い合わせてください。
            </p>
        </div>
    );
}

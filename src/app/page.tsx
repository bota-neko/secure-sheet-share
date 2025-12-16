import Link from "next/link";

export default function Home() {
  return (
    <main className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Secure Sheet Share</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
        施設ごとのデータを安全に共有・編集。<br />
        関係者以外はアクセスできません。
      </p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/login" className="btn btn-primary">
          ログイン
        </Link>
      </div>
    </main>
  );
}

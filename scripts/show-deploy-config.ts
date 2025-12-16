
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env.local
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('\n===== Vercel デプロイ用設定値 (コピペ用) =====\n');

    try {
        // 1. Credentials
        const credPath = path.join(process.cwd(), 'credentials.json');
        if (fs.existsSync(credPath)) {
            const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));

            console.log('--- [1] GOOGLE_SERVICE_ACCOUNT_EMAIL ---');
            console.log(creds.client_email);
            console.log('\n');

            console.log('--- [2] GOOGLE_PRIVATE_KEY ---');
            // Remove double quotes if printed by JSON.stringify, but console.log prints raw string.
            // Just printing the raw value is best.
            console.log(creds.private_key);
            console.log('\n');
        } else {
            console.error('❌ credentials.json が見つかりません。');
        }

        // 2. Env Vars
        console.log('--- [3] SPREADSHEET_ID ---');
        console.log(process.env.SPREADSHEET_ID || '未設定');
        console.log('\n');

        console.log('--- [4] SESSION_PASSWORD ---');
        console.log(process.env.SESSION_PASSWORD || '未設定');
        console.log('\n');

        console.log('--- [5] NEXT_PUBLIC_APP_URL ---');
        console.log('https://あなたのアプリ名.vercel.app (後で設定でもOK)');
        console.log('\n');

        console.log('============================================');
        console.log('上記の値を Vercel の Environment Variables に貼り付けてください。');

    } catch (e) {
        console.error('エラーが発生しました:', e);
    }
}

main();

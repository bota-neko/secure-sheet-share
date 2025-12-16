import { sheets, getServiceAccountEmail } from '../src/lib/googleSheets';

// Mock env if needed, but we rely on dotenv preloaded or .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
        console.error('No SPREADSHEET_ID in .env.local');
        return;
    }

    console.log('Spreadsheet ID:', spreadsheetId);

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'users!A1:Z1', // Get first row (headers)
        });

        const headers = res.data.values?.[0] || [];
        console.log('Current Headers in "users" sheet:', headers);

        if (!headers.includes('google_email')) {
            console.error('❌ Missing "google_email" header!');
        } else {
            console.log('✅ "google_email" header exists.');
        }

        // Get all data to see if values exist
        const allRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'users!A1:Z100', // First 100 rows
        });

        const rows = allRes.data.values || [];
        // Print first 5 rows
        console.log('Top 5 rows:', rows.slice(0, 5));

    } catch (e) {
        console.error('Error:', e);
    }
}

main();

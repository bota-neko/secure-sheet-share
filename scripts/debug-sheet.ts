import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
});

async function main() {
    console.log('Debugging Sheet Content...');
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'records!A1:Z5', // Read headers + top 4 rows
        });

        console.log('--- HEADERS (Row 1) ---');
        console.log(JSON.stringify(res.data.values?.[0], null, 2));

        console.log('--- ROW 2 (Data) ---');
        console.log(JSON.stringify(res.data.values?.[1], null, 2));

        console.log('--- ROW 3 (Data) ---');
        console.log(JSON.stringify(res.data.values?.[2], null, 2));
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error);

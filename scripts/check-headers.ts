
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function main() {
    console.log('Checking headers for Spreadsheet ID:', process.env.SPREADSHEET_ID);

    if (!process.env.SPREADSHEET_ID) {
        throw new Error('SPREADSHEET_ID is missing');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) ? {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        } : undefined,
        scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = 'records';

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!1:1`,
        });

        const headers = res.data.values?.[0] || [];
        console.log('Current headers in "records":', headers);

        if (headers.includes('file_name')) {
            console.log('SUCCESS: "file_name" column exists.');
        } else {
            console.error('FAILURE: "file_name" column is MISSING.');
        }
    } catch (error) {
        console.error('Error reading sheet:', error);
    }
}

main().catch(console.error);

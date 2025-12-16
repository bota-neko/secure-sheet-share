
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function main() {
    console.log('Starting migration: Adding "access_level" column to records sheet...');

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

    // 1. Read current headers
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`,
    });

    const headers = res.data.values?.[0] || [];
    console.log('Current headers:', headers);

    if (headers.includes('access_level')) {
        console.log('Column "access_level" already exists. Skipping.');
        return;
    }

    // Append 'access_level' to the end of headers
    const newHeaders = [...headers, 'access_level'];
    console.log('New headers:', newHeaders);

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [newHeaders]
        }
    });

    console.log('Migration complete: "access_level" added to the end of headers.');
}

main().catch(console.error);

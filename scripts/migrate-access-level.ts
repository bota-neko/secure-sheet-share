
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

    // 1. Read all data (Header + Rows)
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}`, // Read entire sheet
    });

    const rows = res.data.values || [];
    if (rows.length === 0) {
        console.log('Sheet is empty. No headers found. Exiting.');
        return;
    }

    const headers = rows[0];
    console.log('Current headers:', headers);

    if (headers.includes('access_level')) {
        console.log('Column "access_level" already exists. Skipping.');
        return;
    }

    // 2. Append 'access_level' to header
    const newHeaders = [...headers, 'access_level'];
    rows[0] = newHeaders;

    // 3. Update existing data rows
    // For every row > 0, append 'editable'
    // Note: rows might be jagged (different lengths provided by API for trailing empties)
    // We must ensure we put 'editable' at the correct index matching newHeaders.length - 1
    // But since we just appended to header, we just need to push 'editable' to each row.
    // Wait, if intermediate columns are empty?
    // Google API returns truncated rows if trailing columns are empty.
    // If I just push, it fills the *next* available slot.
    // If headers are [A, B, C] and row is [a, b], putting 'editable' makes [a, b, 'editable'].
    // But 'editable' corresponds to C? No, C is empty.
    // So 'editable' becomes C. But AccessLevel is D?
    // We must pad the row with empty strings until it matches (newHeaders.length - 1).

    const targetIndex = newHeaders.length - 1;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        while (row.length < targetIndex) {
            row.push(''); // Pad intermediate missing values
        }
        row[targetIndex] = 'editable'; // Set default
    }

    console.log(`Updated ${rows.length - 1} rows with default 'editable'.`);

    // 4. Write back
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: rows
        }
    });

    console.log('Migration complete: "access_level" added and backfilled.');
}

main().catch(console.error);

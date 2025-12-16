import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
});

async function main() {
    console.log('Migrating sheet headers...');

    if (!process.env.SPREADSHEET_ID) {
        console.error('Error: SPREADSHEET_ID is not set in .env or environment.');
        process.exit(1);
    }
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheets = google.sheets({ version: 'v4', auth });

    // The NEW headers we want for 'records' sheet
    const newHeaders = [
        'record_id',
        'facility_id',
        'file_creator',
        'sharer',
        'file_url',
        'created_at',
        'created_by',
        'updated_at',
        'deleted_flag'
    ];

    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'records!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newHeaders],
            },
        });
        console.log('Successfully updated "records" sheet headers.');
        console.log('New headers:', newHeaders.join(', '));
    } catch (e) {
        console.error('Failed to update headers:', e);
    }
}

main().catch(console.error);

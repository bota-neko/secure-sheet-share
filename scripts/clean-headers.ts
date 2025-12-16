import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
});

async function main() {
    console.log('Fixing Sheet Headers...');
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheets = google.sheets({ version: 'v4', auth });

    // The NEW headers (9 columns)
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

    // Create array length 20, fill rest with empty string to clear old headers
    const paddedHeaders = [...newHeaders];
    while (paddedHeaders.length < 20) {
        paddedHeaders.push('');
    }

    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'records!A1:T1', // Update A1 to T1 to ensure clearing
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [paddedHeaders],
            },
        });
        console.log('Successfully CLEANED "records" sheet headers.');
    } catch (e) {
        console.error('Failed to update headers:', e);
    }
}

main().catch(console.error);

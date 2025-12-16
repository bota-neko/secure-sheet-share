import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';
import { extractFileIdFromUrl } from '../src/lib/utils';
import { readSheet } from '../src/lib/googleSheets'; // Depending on if it works in script context

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
});

async function main() {
    console.log('Diagnosing latest record file access...');
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Get latest record
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'records',
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) {
        console.log('No records found.');
        return;
    }

    // Get last row
    const lastRow = rows[rows.length - 1];
    // Assuming file_url is at index 4 (based on debug-sheet output earlier: record_id, facility_id, creator, sharer, url...)
    // Headers: record_id, facility_id, file_creator, sharer, file_url
    const url = lastRow[4];
    console.log('Testing URL:', url);

    const fileId = extractFileIdFromUrl(url);
    console.log('Extracted ID:', fileId);

    if (!fileId) {
        console.error('Failed to extract ID from URL');
        return;
    }

    // 2. Try to get file metadata
    try {
        const file = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType, capabilities',
        });
        console.log('SUCCESS! File found.');
        console.log('Name:', file.data.name);
        console.log('Mime:', file.data.mimeType);
        console.log('Can Download:', file.data.capabilities?.canDownload);

    } catch (e: any) {
        console.error('FAILURE. Drive API returned error:');
        console.error(e.response?.status, e.response?.statusText);
        console.error(JSON.stringify(e.response?.data, null, 2));
    }
}

main().catch(console.error);

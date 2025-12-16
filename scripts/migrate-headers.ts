
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function main() {
    console.log('Starting migration: Adding "file_name" column to records sheet...');

    if (!process.env.SPREADSHEET_ID) {
        throw new Error('SPREADSHEET_ID is missing');
    }

    // Auth setup (duplicated from googleSheets.ts for standalone script)
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

    if (headers.includes('file_name')) {
        console.log('Column "file_name" already exists. Skipping.');
        return;
    }

    // 2. Add 'file_name' at index 2 (after facility_id) or append?
    // Let's insert it after 'facility_id' (index 1) to keep it logical: record_id, facility_id, file_name, file_creator...
    // But inserting in the middle requires shifting all data.
    // For simplicity and safety, let's APPEND it to the end, or reuse an existing logic if possible.
    // Wait, the user wants it "visible" and "logical".
    // "file_name" is important.
    // However, `appendRow` in `googleSheets.ts` maps object keys to headers. It doesn't care about order as long as headers exist.
    // So the column order in the Sheet only affects visual inspection of the raw sheet.
    // Let's insert it after 'facility_id' for cleanliness using batchUpdate with insertDimension? No, that's complex.
    // Simplest: Just add it to the header row. `appendRow` map logic handles mapping.
    // But `appendRow` *creates* the row based on the header order found.
    // So if we just update the header row, future `appendRow` calls will respect it.
    // EXISTING data rows will have one less column. This might cause offset issues if we strictly rely on index?
    // My `readSheet` implementation:
    // `obj[header] = row[index]`.
    // If I insert `file_name` at index 2, then `row[2]` of existing data will be the OLD `file_creator`.
    // Everything will shift and break! Danger!

    // STRATEGY: Append `file_name` to the END of the header list.
    // This way, existing rows (length N) map to headers[0]...headers[N-1].
    // `file_name` will be headers[N]. `row[N]` will be undefined (empty) for existing rows.
    // This is safe!

    const newHeaders = [...headers, 'file_name'];
    console.log('New headers:', newHeaders);

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [newHeaders]
        }
    });

    console.log('Migration complete: "file_name" added to the end of headers.');
}

main().catch(console.error);

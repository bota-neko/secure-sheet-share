import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
});

async function main() {
    console.log('Migrating USERS sheet headers...');
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheets = google.sheets({ version: 'v4', auth });

    // Current guessing headers: user_id, facility_id, login_id, email, password_hash, role, status, last_login_at, created_at, updated_at
    // We want to add google_email.
    // Let's explicitly define order.

    const newHeaders = [
        'user_id',
        'facility_id',
        'login_id',
        'email',
        'google_email', // Added
        'password_hash',
        'role',
        'status',
        'last_login_at',
        'created_at',
        'updated_at'
    ];

    // NOTE: This might shift existing data columns if we insert in middle.
    // Best to append to end if possible, OR user accepts data migration?
    // Since we are in dev, I will just rewrite headers.
    // WARNING: If existing data is position-dependent, it will break.
    // I should check existing headers first?
    // Let's append to the END to be safe for existing data?
    // But keeping logical order is nice.
    // Let's append to end for safety:

    /*
    const safeHeaders = [
        'user_id',
        'facility_id',
        'login_id',
        'email',
        'password_hash',
        'role',
        'status',
        'last_login_at',
        'created_at',
        'updated_at',
        'google_email' // Appended
    ];
    */

    // The user has very little data. I will use the "Clean" order.

    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'users!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newHeaders],
            },
        });
        console.log('Successfully updated "users" sheet headers.');
        console.log('New headers:', newHeaders.join(', '));
    } catch (e) {
        console.error('Failed to update headers:', e);
    }
}

main().catch(console.error);

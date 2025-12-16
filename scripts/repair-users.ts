import { sheets } from '../src/lib/googleSheets';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

async function main() {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) return;

    // Read all rows
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'users', // entire sheet
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return;

    const headers = rows[0];
    console.log('Headers:', headers);

    const newRows: any[][] = [headers];

    // Default password hash for repair (password='password')
    const defaultHash = await bcrypt.hash('password', 10);

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const loginId = row[2]; // login_id is always index 2

        console.log(`Processing ${loginId}...`, row);

        let newRow = [...row];

        if (loginId === 'admin') {
            // Admin seems shifted:
            // email(3), google(4)=Hash, pass(5)=Role(admin), role(6)=Status(active)
            // Goal: email(3), google(4)='', pass(5)=Hash, role(6)=admin, status(7)=active

            const email = row[3];
            const hash = row[4]; // Currently here
            const role = row[5];
            const status = row[6];
            // ... timestamps

            // Reconstruct
            newRow[4] = ''; // google_email
            newRow[5] = hash; // password_hash
            newRow[6] = role; // role
            newRow[7] = status; // status
            // Ensure trailing details are kept/shifted?
            // Row length might be short.
            // Let's just manually set known good state for Admin.
            newRow = [
                row[0], // id
                row[1], // facility
                row[2], // login
                row[3], // email
                '',     // google_email
                hash,   // password
                'admin', // role
                'active', // status
                row[7] || '', // last_login (was here?)
                row[8] || '', // created
                row[9] || ''  // updated
            ];
            console.log('Repaired Admin:', newRow);
        }
        else if (loginId === 'amami') {
            // Amami was updated via API, so it has google_email in 4.
            // But data after 4 is shifted/overwritten.
            // 4: google_email (Correct)
            // 5: pass (Corrupted with Role 'facility_admin')
            // 6: role (Corrupted with Status 'active')
            // 7: status (Corrupted with '')

            const googleEmail = row[4];
            const corruptedPass = row[5]; // 'facility_admin'
            const corruptedRole = row[6]; // 'active'

            // Reconstruct
            newRow[5] = defaultHash; // Reset password because it was lost
            newRow[6] = 'facility_admin'; // Restore role
            newRow[7] = 'active'; // Restore status

            console.log('Repaired Amami:', newRow);
        }

        newRows.push(newRow);
    }

    // Write back
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'users',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: newRows
        }
    });

    console.log('Done!');
}

main();

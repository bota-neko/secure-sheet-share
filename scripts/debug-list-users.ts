import 'dotenv/config'; // Load env vars
import { readSheet } from '../src/lib/googleSheets';
import { User } from '../src/lib/types';

async function main() {
    try {
        const users = await readSheet<User>('users');
        console.log('--- Users List ---');
        users.forEach(u => {
            console.log(`ID: ${u.login_id}, Role: ${u.role}, Status: ${u.status}, Facility: ${u.facility_id}`);
        });
        console.log('------------------');
    } catch (e) {
        console.error('Error reading users:', e);
    }
}

main();

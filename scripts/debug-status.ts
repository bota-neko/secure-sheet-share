import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readSheet } from '../src/lib/googleSheets';
import { Facility, User } from '../src/lib/types';

async function main() {
    console.log('--- Checking DB Status ---');

    const facilities = await readSheet<Facility>('facilities');
    console.log('Facilities count:', facilities.length);
    facilities.forEach(f => {
        console.log(`[Facility] ${f.name} (${f.facility_id}): ${f.status}`);
    });

    const users = await readSheet<User>('users');
    console.log('Users count:', users.length);
    users.forEach(u => {
        console.log(`[User] ${u.login_id} (${u.user_id}): ${u.status} (Role: ${u.role})`);
    });
}

main();

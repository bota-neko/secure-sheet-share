import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readSheet, updateRow } from '../src/lib/googleSheets';
import { Facility, User } from '../src/lib/types';

async function main() {
    console.log('Cleaning up test data...');

    // 1. Clean up Facilities
    try {
        const facilities = await readSheet<Facility>('facilities');
        const testFacilities = facilities.filter(f => f.name.startsWith('VerifyGroup') || f.name === 'TestGroup');

        for (const f of testFacilities) {
            console.log(`Soft deleting facility: ${f.name} (${f.facility_id})`);
            await updateRow('facilities', 'facility_id', f.facility_id, { status: 'inactive' });
        }
    } catch (e) {
        console.error('Error cleaning facilities:', e);
    }

    // 2. Clean up Users
    try {
        const users = await readSheet<User>('users');
        const testUsers = users.filter(u => u.login_id.startsWith('VerifyUser') || u.login_id === 'testuser');

        for (const u of testUsers) {
            console.log(`Soft deleting user: ${u.login_id} (${u.user_id})`);
            await updateRow('users', 'user_id', u.user_id, { status: 'inactive' });
        }
    } catch (e) {
        console.error('Error cleaning users:', e);
    }

    console.log('Cleanup complete.');
}

main();

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readSheet, updateRow, appendRow } from '../src/lib/googleSheets';
import { hashPassword } from '../src/lib/auth';
import * as crypto from 'crypto';
import { User } from '../src/lib/types';

async function main() {
    console.log('Resetting/Creating admin user...');

    // Hardcoded credentials from user
    const targetId = 'admin-share-sheet';
    const rawPass = 'MTXJSfUzC8z5';

    try {
        const users = await readSheet<User>('users');
        const existing = users.find(u => u.login_id === targetId);
        const hashed = await hashPassword(rawPass);

        if (existing) {
            console.log(`Found existing admin '${targetId}'. Updating password...`);
            await updateRow('users', 'user_id', existing.user_id, {
                password_hash: hashed,
                status: 'active' // Ensure active
            });
            console.log('Password updated.');
        } else {
            console.log(`User '${targetId}' not found. Creating...`);
            const newUser: User = {
                user_id: crypto.randomUUID(),
                facility_id: 'system',
                login_id: targetId,
                email: '',
                password_hash: hashed,
                role: 'admin',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login_at: ''
            };
            await appendRow('users', newUser);
            console.log('Admin user created.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();

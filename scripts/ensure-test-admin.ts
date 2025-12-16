import { readSheet, createUser } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function main() {
    const users = await readSheet('users');
    const admin = users.find(u => u.role === 'admin');

    if (admin) {
        console.log('Found Admin:', admin.login_id);
        console.log('Password is unknown (hashed).');
        // If we don't know the password, we might need to create a temp admin or update this one's password.
        // Let's create a temp admin execution/test-admin
    }

    // Create a known admin for testing
    const testAdminId = 'test-admin';
    const testPass = 'password123';

    // Check if exists
    const existing = users.find(u => u.login_id === testAdminId);
    if (!existing) {
        console.log('Creating test-admin...');
        await createUser({
            facility_id: 'system',
            login_id: testAdminId,
            password_hash: await hashPassword(testPass),
            role: 'admin',
            email: '',
            status: 'active',
            last_login_at: ''
        });
        console.log(`Created admin: ${testAdminId} / ${testPass}`);
    } else {
        console.log(`Test admin exists: ${testAdminId} / ${testPass} (Assuming password is correct or unchanged)`);
    }
}

main().catch(console.error);

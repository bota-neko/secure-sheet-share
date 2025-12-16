import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeTab, appendRow, readSheet } from '../src/lib/googleSheets';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../src/lib/types';

async function main() {
    console.log('Initializing Secure Sheet Share...');

    if (!process.env.SPREADSHEET_ID) {
        console.error('Error: SPREADSHEET_ID is not set in .env or environment.');
        process.exit(1);
    }

    // Define Schemas
    const schemas = {
        facilities: ['facility_id', 'name', 'status', 'contact_email', 'created_at', 'updated_at'],
        users: ['user_id', 'facility_id', 'login_id', 'email', 'password_hash', 'role', 'status', 'last_login_at', 'created_at', 'updated_at'],
        records: ['record_id', 'facility_id', 'full_name', 'phone', 'address', 'note', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_flag'],
        audit_logs: ['log_id', 'timestamp', 'user_id', 'facility_id', 'action', 'target_type', 'target_id', 'before_json', 'after_json', 'ip', 'user_agent']
    };

    // Initialize Tabs
    for (const [sheetName, headers] of Object.entries(schemas)) {
        console.log(`Checking sheet: ${sheetName}...`);
        const created = await initializeTab(sheetName, headers);
        if (created) {
            console.log(`  -> Created/Initialized ${sheetName} with headers.`);
        } else {
            console.log(`  -> ${sheetName} already exists and has data/headers. Skipped.`);
        }
    }

    // Check if Admin exists
    try {
        const existingUsers = await readSheet<User>('users');
        const adminExists = existingUsers.some(u => u.role === 'admin' && u.status === 'active');

        if (adminExists) {
            console.log('Admin user already exists. Skipping creation.');
        } else {
            console.log('Creating initial Admin user...');
            const adminPassword = crypto.randomUUID().slice(0, 8); // Simple random password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const adminUser = {
                user_id: crypto.randomUUID(),
                facility_id: 'system',
                login_id: 'admin',
                email: 'admin@example.com',
                password_hash: hashedPassword,
                role: 'admin',
                status: 'active',
                last_login_at: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await appendRow('users', adminUser);

            console.log('===================================================');
            console.log('Admin User Created');
            console.log('Login ID: admin');
            console.log(`Password: ${adminPassword}`);
            console.log('PLEASE SAVE THIS PASSWORD NOW.');
            console.log('===================================================');

            // Add audit log for this
            const log = {
                log_id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                user_id: 'system',
                facility_id: 'system',
                action: 'INIT_ADMIN',
                target_type: 'user',
                target_id: adminUser.user_id,
                before_json: '',
                after_json: JSON.stringify(adminUser),
                ip: 'local',
                user_agent: 'init-script'
            };
            await appendRow('audit_logs', log);
        }
    } catch (err) {
        console.error('Error creating admin user:', err);
    }

    console.log('Initialization complete.');
}

main().catch(console.error);

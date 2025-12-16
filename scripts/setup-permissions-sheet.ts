import { initializeTab } from '../src/lib/googleSheets';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Initializing user_permissions sheet...');

    // updated logic for user_permissions headers
    const headers = [
        'permission_id',
        'user_id',
        'record_id',
        'last_accessed_at'
    ];

    try {
        const initialized = await initializeTab('user_permissions', headers);
        if (initialized) {
            console.log('✅ Created user_permissions sheet');
        } else {
            console.log('ℹ️ user_permissions sheet already exists');
        }
    } catch (e) {
        console.error('Failed to initialize:', e);
    }
}

main();

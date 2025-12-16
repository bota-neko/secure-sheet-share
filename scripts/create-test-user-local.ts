
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createUser, createFacility, getUserByLoginId } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

async function main() {
    console.log('Creating test facility and user...');

    // 1. Create Facility
    const facility = await createFacility({
        name: 'Test Group for verification',
        status: 'active',
        contact_email: 'test@example.com'
    });
    console.log('Created Facility:', facility);

    // 2. Create User
    const rawPass = 'test1234';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const user = await createUser({
        facility_id: facility.facility_id,
        login_id: 'verify_user',
        password_hash: passwordHash,
        role: 'facility_admin',
        status: 'active',
        email: 'verify@example.com'
    });
    console.log('Created User:', user);
    console.log(`Login with: ID=${user.login_id}, Pass=${rawPass}`);
}

main().catch(console.error);

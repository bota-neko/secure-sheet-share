import { appendRow, readSheet, updateRow } from './googleSheets';
import { AuditLog, Facility, Record, User, UserPermission } from './types';
import * as crypto from 'crypto';

// --- Facilities ---

export async function getAllFacilities(): Promise<Facility[]> {
    const data = await readSheet<Facility>('facilities');
    return data.filter(f => f.status !== 'inactive');
}

export async function createFacility(data: Omit<Facility, 'facility_id' | 'created_at' | 'updated_at'>): Promise<Facility> {
    const newFacility: Facility = {
        ...data,
        facility_id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    await appendRow('facilities', newFacility);
    return newFacility;
}

export async function deleteFacility(facilityId: string): Promise<void> {
    // Soft delete
    await updateRow('facilities', 'facility_id', facilityId, { status: 'inactive' });
}

// --- Users ---

export async function getUserByLoginId(loginId: string): Promise<User | undefined> {
    const users = await readSheet<User>('users');
    return users.find(u => u.login_id === loginId && u.status === 'active');
}

export async function getUserById(userId: string): Promise<User | undefined> {
    const users = await readSheet<User>('users');
    return users.find(u => u.user_id === userId && u.status === 'active');
}

export async function getAllUsers(): Promise<User[]> {
    const users = await readSheet<User>('users');
    return users.filter(u => u.status !== 'inactive');
}

export async function getUsersByFacility(facilityId: string): Promise<User[]> {
    const users = await readSheet<User>('users');
    return users.filter(u => u.facility_id === facilityId && u.status !== 'inactive');
}

export async function createUser(data: Omit<User, 'user_id' | 'created_at' | 'updated_at'>): Promise<User> {
    const newUser: User = {
        ...data,
        user_id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    await appendRow('users', newUser);
    return newUser;
}

export async function deleteUser(userId: string): Promise<void> {
    await updateRow('users', 'user_id', userId, { status: 'inactive' });
}

// --- Records ---

export async function getRecordsByFacility(facilityId: string): Promise<Record[]> {
    const records = await readSheet<Record>('records');
    // Strict filter
    return records.filter(r => {
        const flag = String(r.deleted_flag).toLowerCase();
        return r.facility_id === facilityId && flag !== 'true';
    });
}

export async function createRecord(actorFacilityId: string, actorUserId: string, data: Omit<Record, 'record_id' | 'facility_id' | 'created_at' | 'created_by' | 'updated_at' | 'deleted_flag'>): Promise<Record> {
    const newRecord: Record = {
        ...data,
        record_id: crypto.randomUUID(),
        facility_id: actorFacilityId, // FORCE facility_id
        created_at: new Date().toISOString(),
        created_by: actorUserId,
        updated_at: new Date().toISOString(),
        deleted_flag: false,
    };
    await appendRow('records', newRecord);
    return newRecord;
}

export async function updateRecord(actorFacilityId: string, actorUserId: string, recordId: string, data: Partial<Record>): Promise<Record> {
    const records = await readSheet<Record>('records');
    const existing = records.find(r => r.record_id === recordId);

    if (!existing) {
        throw new Error('Record not found');
    }

    // CRITICAL: Force facility check, but allow 'system' admin
    if (actorFacilityId !== 'system' && existing.facility_id !== actorFacilityId) {
        throw new Error('Unauthorized: Facility ID mismatch');
    }

    const updates: Partial<Record> = {
        ...data,
        updated_at: new Date().toISOString(),
    };

    // Prevent changing immutable fields via this API if necessary
    delete updates.record_id;
    delete updates.facility_id;
    delete updates.created_at;
    delete updates.created_by;

    await updateRow('records', 'record_id', recordId, updates);

    return { ...existing, ...updates };
}

export async function softDeleteRecord(actorFacilityId: string, actorUserId: string, recordId: string): Promise<void> {
    const records = await readSheet<Record>('records');
    const existing = records.find(r => r.record_id === recordId);

    // Check permission
    if (existing && actorFacilityId !== 'system') { // 'system' is admin
        if (existing.created_by && existing.created_by !== actorUserId) {
            throw new Error('Forbidden: Only the creator can delete this record');
        }
    }

    await updateRecord(actorFacilityId, actorUserId, recordId, { deleted_flag: true });
}


// --- User Permissions ---

export async function recordUserAccess(userId: string, recordId: string): Promise<void> {
    const perms = await readSheet<UserPermission>('user_permissions');
    const existing = perms.find(p => p.user_id === userId && p.record_id === recordId);

    if (existing) {
        // Update timestamp
        await updateRow('user_permissions', 'permission_id', existing.permission_id, {
            last_accessed_at: new Date().toISOString()
        });
    } else {
        // Create new
        const newPerm: UserPermission = {
            permission_id: crypto.randomUUID(),
            user_id: userId,
            record_id: recordId,
            last_accessed_at: new Date().toISOString()
        };
        await appendRow('user_permissions', newPerm);
    }
}

export async function getUserAccessedRecordIds(userId: string): Promise<Set<string>> {
    const perms = await readSheet<UserPermission>('user_permissions');
    const userPerms = perms.filter(p => p.user_id === userId);
    return new Set(userPerms.map(p => p.record_id));
}

// --- Audit Logs ---

export async function addAuditLog(log: Omit<AuditLog, 'log_id' | 'timestamp'>): Promise<void> {
    const newLog: AuditLog = {
        ...log,
        log_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
    };
    await appendRow('audit_logs', newLog);
}

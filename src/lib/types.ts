export type Role = 'admin' | 'facility_admin' | 'facility_editor' | 'facility_viewer';

export interface Facility {
    facility_id: string;
    name: string;
    status: 'active' | 'inactive';
    contact_email?: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    user_id: string;
    facility_id: string; // For admin, this might be 'system' or strict checking
    facility_name?: string; // Display name
    login_id: string;
    email?: string;
    google_email?: string; // For auto-permission
    password_hash: string;
    role: Role;
    status: 'active' | 'inactive';
    last_login_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Record {
    record_id: string;
    facility_id: string;
    file_name: string;    // ファイル名（表示用タイトル）
    file_creator: string; // ファイル作成者
    sharer: string;       // 共有者
    file_url: string;     // ファイルURL
    access_level: 'editable' | 'view_only' | 'admin_only'; // アクセスレベル
    created_at: string;
    created_by: string;   // システムユーザーID
    updated_at: string;
    deleted_flag: boolean;
    is_accessed?: boolean; // API Response field
}

export interface AuditLog {
    log_id: string;
    timestamp: string;
    user_id: string;
    facility_id: string;
    action: string;
    target_type: string;
    target_id: string;
    before_json?: string;
    after_json?: string;
    ip?: string;
    user_agent?: string;
}

export interface UserPermission {
    permission_id: string;
    user_id: string;
    record_id: string;
    last_accessed_at: string;
}

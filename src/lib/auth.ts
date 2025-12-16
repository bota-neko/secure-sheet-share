import { SessionOptions } from 'iron-session';
import bcrypt from 'bcryptjs';

export interface SessionData {
    user_id: string;
    facility_id: string;
    role: string;
    login_id: string;
    google_email?: string;
    isLoggedIn: boolean;
}

// Ensure password is long enough
const password = process.env.SESSION_PASSWORD || 'complex_password_at_least_32_characters_long_default';

if (password.length < 32) {
    console.warn('WARNING: SESSION_PASSWORD is too short. Iron Session requires 32+ characters.');
}

export const sessionOptions: SessionOptions = {
    password,
    cookieName: 'secure_sheet_share_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};

export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

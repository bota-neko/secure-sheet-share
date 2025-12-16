import { NextResponse } from 'next/server';
import { getServiceAccountEmail } from '@/lib/googleSheets';

export async function GET() {
    try {
        const email = await getServiceAccountEmail();
        return NextResponse.json({ systemEmail: email });
    } catch (e) {
        return NextResponse.json({ systemEmail: 'Email unavailable' });
    }
}

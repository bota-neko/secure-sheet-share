import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const { pathname } = request.nextUrl;

    // 1. Unprotected Routes (Public)
    if (pathname === '/login' || pathname === '/api/login' || pathname === '/') {
        // If already logged in, redirect to appropriate dashboard
        if (session.isLoggedIn) {
            if (session.role === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url));
            } else {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }
        return response;
    }

    // 2. Protected Routes
    if (!session.isLoggedIn) {
        // API Request: Return 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Page Request: Redirect to Login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Role-Based Access Control
    // Admin only areas
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        if (session.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url)); // or 403 page
        }
    }

    // Facility only areas (if needed strict separation, but /dashboard is ok for all?)
    // Generally, Admin shouldn't need to go to /dashboard unless acting as one, 
    // but for now let's keep /dashboard for facility users.
    // Admin might want to see it? Let's restrict /dashboard to non-admins or allow strictly.
    // Spec says: "Admin: All facilities view/edit". 
    // Maybe Admin has their own view.

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files if any
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

export function extractFileIdFromUrl(url: string): string | null {
    try {
        const u = new URL(url);
        // Common patterns:
        // /spreadsheets/d/ID/edit
        // /document/d/ID/edit
        // /file/d/ID/view
        // /open?id=ID

        // 1. Query parameter ?id=
        if (u.searchParams.has('id')) {
            return u.searchParams.get('id');
        }

        // 2. Path segments
        const segments = u.pathname.split('/');
        // Find 'd' and take next
        const dIndex = segments.indexOf('d');
        if (dIndex !== -1 && dIndex < segments.length - 1) {
            return segments[dIndex + 1];
        }

        return null;
    } catch (e) {
        return null;
    }
}

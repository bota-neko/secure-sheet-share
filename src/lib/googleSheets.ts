import { google } from 'googleapis';
import path from 'path';

// Define strict scopes
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
];

// Initialize Auth
const auth = new google.auth.GoogleAuth({
    credentials: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) ? {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    } : undefined,
    scopes: SCOPES,
});

export const sheets = google.sheets({ version: 'v4', auth });
export const drive = google.drive({ version: 'v3', auth });

export async function getServiceAccountEmail(): Promise<string> {
    const client = await auth.getClient();
    const email = (client as any).email;
    if (email) return email;
    // Fallback if keyFile is used
    const creds = await auth.getCredentials();
    return (creds as any).client_email || 'Service Account Email Not Found';
}

function getSpreadsheetId(): string {
    const id = process.env.SPREADSHEET_ID;
    if (!id) throw new Error('SPREADSHEET_ID is not set');
    return id;
}

/**
 * Reads all rows from a sheet and returns them as an array of objects.
 * Assumes the first row is the header.
 */
export async function readSheet<T>(sheetName: string): Promise<T[]> {
    const spreadsheetId = getSpreadsheetId();

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetName, // Read the whole sheet
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        const headers = rows[0];
        const dataRows = rows.slice(1);

        return dataRows.map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
                // Handle empty strings or undefined
                obj[header] = row[index] === undefined ? '' : row[index];
            });
            return obj as T;
        });
    } catch (error) {
        console.error(`Error reading sheet ${sheetName}:`, error);
        throw error;
    }
}

/**
 * Appends a new row to the sheet.
 * Assumes the object keys match the headers.
 * Note: This function verifies headers before appending to ensure order.
 */
export async function appendRow<T extends object>(sheetName: string, data: T): Promise<void> {
    const spreadsheetId = getSpreadsheetId();

    // First, get headers to ensure correct order
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`, // Read specific header row
    });

    const headers = response.data.values?.[0];
    if (!headers) throw new Error(`Sheet ${sheetName} has no headers. Initialize it first.`);

    const rowValues = headers.map((header) => {
        const val = (data as any)[header];
        return val === undefined || val === null ? '' : String(val); // Convert to string for safety
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [rowValues],
        },
    });
}

/**
 * Updates a row by matching a unique key column.
 * This is inefficient for large datasets but sufficient for 30 facilities.
 * Uses atomic-like behavior? No, Sheets API is not transactional.
 * It finds the row index and updates it.
 */
export async function updateRow<T extends object>(
    sheetName: string,
    keyColumn: string,
    keyValue: string,
    newData: Partial<T>
): Promise<boolean> {
    const spreadsheetId = getSpreadsheetId();

    // 1. Read all data to find the index
    // We accept the cost of reading (small scale).
    // Optimization: Read only the key column?
    // Let's read strictly the key column to find index.

    // We need to know which column index corresponds to `keyColumn`
    const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`,
    });
    const headers = headerRes.data.values?.[0] as string[] | undefined;
    if (!headers) throw new Error(`Sheet ${sheetName} has no headers.`);

    const colIndex = headers.indexOf(keyColumn);
    if (colIndex === -1) throw new Error(`Column ${keyColumn} not found in sheet ${sheetName}`);

    // Convert colIndex to A1 notation letter (simplistic, assuming < 26 columns for now or using API to read full and index in JS)
    // Actually, easiest is just read the whole sheet values.
    const allDataRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName,
    });
    const rows = allDataRes.data.values;
    if (!rows) return false;

    let rowIndex = -1;
    // Start from 1 to skip header
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][colIndex] === keyValue) {
            rowIndex = i + 1; // 1-based index for A1 notation
            break;
        }
    }

    if (rowIndex === -1) return false; // Not found

    // Construct the new row merging existing and new
    const existingRowWithMap: any = {};
    headers.forEach((h, i) => {
        existingRowWithMap[h] = rows[rowIndex - 1][i];
    });

    const mergedData = { ...existingRowWithMap, ...newData };

    const newRowValues = headers.map((header) => {
        const val = mergedData[header];
        return val === undefined || val === null ? '' : String(val);
    });

    // Update specific row
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [newRowValues],
        },
    });

    return true;
}

/**
 * Initializes a sheet with new headers if it doesn't exist or is empty.
 * Returns true if initialized, false if skipped.
 */
export async function initializeTab(sheetName: string, headers: string[]): Promise<boolean> {
    const spreadsheetId = getSpreadsheetId();

    try {
        // Check if tab exists and has content
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A1:Z1`,
        });

        if (res.data.values && res.data.values.length > 0) {
            // Already has headers
            return false;
        }
    } catch (e: any) {
        // If error includes "Unable to parse range", it might mean tab doesn't exist?
        // Or we need to create the tab first using batchUpdate addSheet.
        // Let's try to add the sheet first, ignoring error if it exists.
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: sheetName } } }],
                },
            });
        } catch (createErr) {
            // Ignore if it already exists
        }
    }

    // Write headers
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [headers],
        },
    });

    return true;
}

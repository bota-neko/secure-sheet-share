import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
});

async function main() {
    console.log('Testing Drive API Access...');
    const drive = google.drive({ version: 'v3', auth });

    try {
        const client = await auth.getClient();
        console.log('Service Account Email:', (client as any).email);

        console.log('Listing files (limit 5)...');
        const res = await drive.files.list({
            pageSize: 5,
        });
        console.log('Success! Found files:', res.data.files?.length);
    } catch (e: any) {
        console.error('Drive API Error:');
        console.error(e.message);
        if (e.message.includes('API has not been used') || e.message.includes('drive.googleapis.com')) {
            console.log('\n!!! ACTION REQUIRED: You must enable the Google Drive API in GCP Console !!!');
            console.log('Link: https://console.developers.google.com/apis/library/drive.googleapis.com');
        }
    }
}

main().catch(console.error);

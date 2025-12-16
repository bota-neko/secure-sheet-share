import { extractFileIdFromUrl } from '../src/lib/utils';

const urls = [
    'https://docs.google.com/spreadsheets/d/123456789/edit#gid=0',
    'https://drive.google.com/file/d/abcdefg/view?usp=sharing',
    'https://docs.google.com/document/d/xyz123/edit'
];

console.log('Testing URL Parser...');
urls.forEach(url => {
    console.log(`URL: ${url} -> ID: ${extractFileIdFromUrl(url)}`);
});

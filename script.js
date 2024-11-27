const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const fs = require('fs');

// Load credentials for Google Sheets
const credentials = require('./credentials.json');
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function scrapeAndValidate() {
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = '14CrCAbT8JY4dhGEJRdCnekzbMSwUitaISg_2xSlI6NY'; // Your Google Sheet ID
    const readRange = 'Showroom!D2:D'; // Fetch URLs from Column D
    const writeRange = 'Showroom!E2:E'; // Write results to Column E

    // Fetch URLs from Column D
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: readRange,
    });

    const urls = response.data.values || []; // Default to an empty array if no values found
    const results = [];
    const keywords = [
        "showroom", "showrooms", "design center", "design centre", "studio",
        "our showroom", "design centre", "showrooms"
    ];

    const browser = await puppeteer.launch();

    for (const [url] of urls) {
        if (!url) {
            results.push(['']); // Skip empty rows
            continue;
        }

        try {
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' }); // Wait for the site to fully load
            const content = await page.evaluate(() => document.body.innerText.toLowerCase());

            // Count occurrences of each keyword
            const keywordCounts = {};
            keywords.forEach(keyword => {
                const count = (content.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
                if (count > 0) {
                    keywordCounts[keyword] = count;
                }
            });

            // Determine the most frequent keyword
            const mostFrequentKeyword = Object.keys(keywordCounts).reduce((a, b) =>
                keywordCounts[a] > keywordCounts[b] ? a : b, null);

            results.push([mostFrequentKeyword || 'No keywords found']);
        } catch (e) {
            console.error(`Error accessing ${url}:`, e);
            results.push(['Error accessing site']);
        }
    }

    await browser.close();

    // Write results back to Column E
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: writeRange,
        valueInputOption: 'RAW',
        requestBody: { values: results },
    });

    console.log('Scraping complete. Results saved to Google Sheets.');
}

scrapeAndValidate().catch(console.error);

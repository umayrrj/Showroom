const express = require('express');
const { exec } = require('child_process');
const app = express();

// Endpoint to trigger the Puppeteer script
app.post('/run', (req, res) => {
    exec('node script.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${stderr}`);
            res.status(500).send(stderr);
        } else {
            console.log(`Output: ${stdout}`);
            res.send(stdout);
        }
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

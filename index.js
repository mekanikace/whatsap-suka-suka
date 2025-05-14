const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode');
const routes = require('./src/routes/routes');
const clientManager = require('./src/clientManager'); // Import the client manager
const path = require('path');
const checkAuth = require('./src/middleware/checkAuth'); // Middleware
const fs = require('fs');

const app = express();
const PORT = 3000;

// Setup Express server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Serve static files (for serving QR code images)
app.use('/qr-codes', express.static(path.join(__dirname, 'qr-codes')));

// Route to initialize a new WhatsApp client session for a user
app.post('/api/start-session', checkAuth, (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send({ status: false, message: 'User ID is required' });
    }

    if (clientManager.clientExists(userId)) {
        const client = clientManager.getClient(userId);

        if (client.authState === 'authenticated') {
            return res.send({ status: true, message: 'User is already authenticated' });
        }

        return res.send({ status: true, message: 'Session already exists, please scan QR code', qr: null });
    }

    // Create a new client session
    const client = clientManager.createClient(userId);
    clientManager.addClient(userId, client); 

    const qrFolderPath = path.join(__dirname, 'qr-codes', userId); 
    let responseSent = false;

    fs.mkdirSync(qrFolderPath, { recursive: true });

    client.on('qr', (qr) => {
        if (responseSent) return; // Prevent sending response multiple times

        const qrFilePath = path.join(qrFolderPath, 'qr-code.png');

        // Generate the QR code and save it as a PNG file
        qrcode.toFile(qrFilePath, qr, (err) => {
            if (err) {
                console.error(`Failed to save QR code for ${userId}:`, err);
                if (!responseSent) {
                    res.status(500).send({ status: false, message: 'Failed to generate QR code' });
                    responseSent = true;
                }
                return;
            }

            // Return the URL to the saved QR code image
            const qrCodeUrl = `${req.protocol}://${req.get('host')}/qr-codes/${userId}/qr-code.png`;
            if (!responseSent) {
                res.send({ status: true, message: 'Session started, scan QR code', qrCodeUrl });
                responseSent = true; // Set the flag to prevent sending the response again
            }
        });
    });

    // Handle authentication failure
    client.on('auth_failure', (msg) => {
        console.error('Authentication failure:', msg);
        if (!responseSent) {
            res.status(500).send({ status: false, message: 'Authentication failed, please try again.' });
            responseSent = true;
        }
    });

    // Handle successful authentication
    client.on('authenticated', () => {
        console.log(`User ${userId} authenticated successfully.`);
        if (!responseSent) {
            res.send({ status: true, message: 'Authenticated successfully' });
            responseSent = true;
        }
    });

    // Cleanup client on disconnection
    // client.on('disconnected', () => {
    //     client.destroy();
    //     clientManager.deleteClient(userId);
    //     console.log(`Client session for user ${userId} was disconnected and cleaned up.`);
    // });
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

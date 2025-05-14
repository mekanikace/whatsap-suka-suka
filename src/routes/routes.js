const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/checkAuth'); // Middleware
const clientMiddleware = require('../middleware/clientMiddleware'); // Middleware
const clientManager = require('../clientManager'); // Import the client manager
const path = require('path');
const fs = require('fs');

// Import controllers
const documentController = require('../controllers/documentController');
const messageController = require('../controllers/messageController');
const locationController = require('../controllers/locationController');

// Define routes
router.post('/send-document', checkAuth, clientMiddleware, documentController.sendDocument);
router.post('/send-message', checkAuth, clientMiddleware, messageController.sendMessage);
router.post('/send-location', checkAuth, clientMiddleware, locationController.sendLocation);

// Client status
router.post('/status', checkAuth, (req, res) => {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
        return res.status(400).send({ status: false, message: 'User ID is required' });
    }

    // Check if the client exists
    if (!clientManager.clientExists(userId)) {
        return res.status(400).send({ status: false, message: `No active session for userId: ${userId}` });
    }

    // Get the client and logout
    const client = clientManager.getClient(userId);

    const isReady = client.info !== undefined;
    res.send({ status: isReady ? 'true' : 'false', message: `Status has been refresh` });
});
// // Start a new client session
// router.post('/start-session', checkAuth, (req, res) => {
//     const { userId } = req.body;

//     if (!userId) {
//         return res.status(400).send({ status: false, message: 'User ID is required' });
//     }

//     if (clientManager.clientExists(userId)) {
//         const client = clientManager.getClient(userId);

//         if (client.authState === 'authenticated') {
//             return res.send({ status: true, message: 'User is already authenticated' });
//         }

//         return res.send({ status: true, message: 'Session already exists, please scan QR code', qr: null });
//     }

//     // Create a new client session
//     const client = clientManager.createClient(userId);
//     clientManager.addClient(userId, client); 

//     const qrFolderPath = path.join(__dirname, '..', '..', 'qr-codes', userId);
//     let responseSent = false;

//     client.on('qr', (qr) => {
//         if (responseSent) return; // Prevent sending response multiple times

//         const qrFilePath = path.join(qrFolderPath, 'qr-code.png');

//         // Generate the QR code and save it as a PNG file
//         qrcode.toFile(qrFilePath, qr, (err) => {
//             if (err) {
//                 console.error(`Failed to save QR code for ${userId}:`, err);
//                 if (!responseSent) {
//                     res.status(500).send({ status: false, message: 'Failed to generate QR code' });
//                     responseSent = true;
//                 }
//                 return;
//             }

//             // Return the URL to the saved QR code image
//             const qrCodeUrl = `${req.protocol}://${req.get('host')}/qr-codes/${userId}/qr-code.png`;
//             if (!responseSent) {
//                 res.send({ status: true, message: 'Session started, scan QR code', qrCodeUrl });
//                 responseSent = true; // Set the flag to prevent sending the response again
//             }
//         });
//     });

//     // Handle authentication failure
//     client.on('auth_failure', (msg) => {
//         console.error('Authentication failure:', msg);
//         if (!responseSent) {
//             res.status(500).send({ status: false, message: 'Authentication failed, please try again.' });
//             responseSent = true;
//         }
//     });
// });

// Start a new client session
// router.post('/start-session', checkAuth, (req, res) => {
//     const { userId } = req.body;

//     if (!userId) {
//         return res.status(400).send({ status: false, message: 'User ID is required' });
//     }

//     if (clientManager.clientExists(userId)) {
//         const client = clientManager.getClient(userId);

//         if (client.authState === 'authenticated') {
//             return res.send({ status: true, message: 'User is already authenticated' });
//         }

//         return res.send({ status: true, message: 'Session already exists, please scan QR code', qr: null });
//     }

//     // Create a new client session
//     const client = clientManager.createClient(userId);
//     clientManager.addClient(userId, client); 

//     const qrFolderPath = path.join(__dirname, '..', '..', 'qr-codes', userId);
//     let responseSent = false;  // Flag to prevent multiple responses

//     // Ensure the directory for storing QR codes exists
//     fs.mkdirSync(qrFolderPath, { recursive: true });

//     client.on('qr', (qr) => {
//         if (responseSent) return; // Prevent sending response multiple times

//         const qrFilePath = path.join(qrFolderPath, 'qr-code.png');

//         // Generate the QR code and save it as a PNG file
//         qrcode.toFile(qrFilePath, qr, (err) => {
//             if (err) {
//                 console.error(`Failed to save QR code for ${userId}:`, err);
//                 if (!responseSent) {
//                     res.status(500).send({ status: false, message: 'Failed to generate QR code' });
//                     responseSent = true;
//                 }
//                 return;
//             }

//             // Return the URL to the saved QR code image
//             const qrCodeUrl = `${req.protocol}://${req.get('host')}/qr-codes/${userId}/qr-code.png`;
//             if (!responseSent) {
//                 res.send({ status: true, message: 'Session started, scan QR code', qrCodeUrl });
//                 responseSent = true; // Set the flag to prevent sending the response again
//             }
//         });
//     });

//     // Handle authentication failure
//     client.on('auth_failure', (msg) => {
//         console.error('Authentication failure:', msg);
//         if (!responseSent) {
//             res.status(500).send({ status: false, message: 'Authentication failed, please try again.' });
//             responseSent = true;
//         }
//     });

//     // Handle successful authentication
//     client.on('authenticated', () => {
//         console.log(`User ${userId} authenticated successfully.`);
//         if (!responseSent) {
//             res.send({ status: true, message: 'Authenticated successfully' });
//             responseSent = true;
//         }
//     });

//     // Cleanup client on disconnection
//     client.on('disconnected', () => {
//         clientManager.deleteClient(userId);
//         console.log(`Client session for user ${userId} was disconnected and cleaned up.`);
//     });
// });

// Logout client
router.post('/logout-session', checkAuth, (req, res) => {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
        return res.status(400).send({ status: false, message: 'User ID is required' });
    }

    // Check if the client exists
    if (!clientManager.clientExists(userId)) {
        return res.status(400).send({ status: false, message: `No active session for userId: ${userId}` });
    }

    // Get the client and logout
    const client = clientManager.getClient(userId);

    client.logout()
        .then(() => {
            client.destroy(); // Destroy the client
            clientManager.deleteClient(userId); // Remove client from client manager
            res.send({ status: true, message: `Session for userId ${userId} has been logged out` });
        })
        .catch((error) => {
            console.error(`Failed to logout session for userId ${userId}:`, error);
            res.status(500).send({ status: false, message: 'Failed to logout session', error: error.toString() });
        });
});


// Delete client session
router.delete('/session/:userId', checkAuth, (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).send({ status: false, message: 'User ID is required' });
    }

    if (!clientManager.clientExists(userId)) {
        return res.status(404).send({ status: false, message: 'Session not found' });
    }

    clientManager.deleteClient(userId);
    res.send({ status: true, message: 'Session deleted' });
});

// Delete all client sessions
router.delete('/sessions', checkAuth, (req, res) => {
    clientManager.deleteAllClients();
    res.send({ status: true, message: 'All sessions deleted' });
});

module.exports = router;

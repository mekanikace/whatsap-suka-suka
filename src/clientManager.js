const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const clients = {}; 

// Helper function to create a directory if it doesn't exist
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Helper function to create a new WhatsApp client for a given user
const createClient = (userId) => {
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: userId, 
            dataPath: path.join(__dirname, '../whatsapp-sessions'), 
        }),
    });

    const qrFolderPath = path.join(__dirname, '../qr-codes', userId); 
    ensureDirectoryExists(qrFolderPath); 

    client.on('qr', (qr) => {
        console.log(`QR Code for ${userId}`);

        const qrFilePath = path.join(qrFolderPath, 'qr-code.png');
        qrcode.toFile(qrFilePath, qr, (err) => {
            if (err) {
                console.error(`Failed to save QR code for ${userId}:`, err);
            } else {
                console.log(`QR code saved for user ${userId} at: ${qrFilePath}`);
            }
        });
    });

    client.on('ready', () => {
        console.log(`WhatsApp client for user ${userId} is ready!`);

        const qrFilePath = path.join(qrFolderPath, 'qr-code.png');
        if (fs.existsSync(qrFilePath)) {
            fs.unlink(qrFilePath, (err) => {
                if (err) {
                    console.error(`Failed to delete QR code for ${userId}:`, err);
                } else {
                    console.log(`QR code deleted for user ${userId}`);
                }
            });
        }
    });

    client.on('authenticated', () => {
        console.log(`WhatsApp client for user ${userId} is authenticated!`);
    });

    client.on("disconnected", async (reason) => {
        await client.destroy();
        if (reason == 'NAVIGATION' || reason == 'LOGOUT') {
            const folderPath = path.join(__dirname, `../whatsapp-sessions/session-${userId}`);
            fs.rm(folderPath, { recursive: true, force: true }, (err) => {
                if (err) {
                    console.log(`Error deleting folder: ${err.message}`);
                } else {
                    console.log('Folder deleted successfully');
                }
            });
        }
    });

    client.initialize();
    return client;
};

// Function to get client by userId
const getClient = (userId) => clients[userId];

// Function to add a client to the clients object
const addClient = (userId, client) => {
    clients[userId] = client;
};

// Function to check if a client exists
const clientExists = (userId) => !!clients[userId];

// Function to delete a client
const deleteClient = (userId) => {
    if (clients[userId]) {
        const qrFolderPath = path.join(__dirname, '../qr-codes', userId);
        if (fs.existsSync(qrFolderPath)) {
            fs.rmdirSync(qrFolderPath, { recursive: true });
        }
        
        clients[userId].destroy();
        delete clients[userId];
        // delete folder whatsapp-sessions/session-[id]
        const sessionFolderPath = path.join(__dirname, '../whatsapp-sessions', `session-${userId}`);
        if (fs.existsSync(sessionFolderPath)) {
            fs.rmdirSync(sessionFolderPath, { recursive: true });
        }
    }
};

// Function to delete all clients
const deleteAllClients = () => {
    Object.keys(clients).forEach((userId) => {
        deleteClient(userId);
    });
};

module.exports = {
    createClient,
    getClient,
    addClient,
    clientExists,
    deleteClient,
    deleteAllClients,
};

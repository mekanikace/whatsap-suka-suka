const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const axios = require('axios'); 
const { MessageMedia } = require('whatsapp-web.js');

const sendDocument = async (req, res) => {
    const { number, documentPath } = req.body;

    // Validate input
    if (!number || !documentPath) {
        return res.status(400).send({ status: false, message: 'Number and document path are required' });
    }

    // Validate format number
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(number)) {
        return res.status(400).send({ status: false, message: 'Invalid phone number format' });
    }

    // Format the number
    const formattedNumber = `${number}@c.us`;

    // Limit size file
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit

    try {
        let fileBuffer;
        let mimeType;
        let fileName;

        // Check if the documentPath is a URL or local file path
        const isUrl = documentPath.startsWith('http://') || documentPath.startsWith('https://');
        
        if (isUrl) {
            // Fetch file from the URL
            const response = await axios({
                url: documentPath,
                method: 'GET',
                responseType: 'arraybuffer', // Important: read response as a binary buffer
            });

            fileBuffer = Buffer.from(response.data, 'binary');
            mimeType = response.headers['content-type'] || 'application/octet-stream';
            fileName = path.basename(documentPath);
        } else {
            // Local file: Check if file exists
            if (!fs.existsSync(documentPath)) {
                return res.status(400).send({ status: false, message: 'Document file does not exist' });
            }

            // Check file size
            const fileStats = fs.statSync(documentPath);
            if (fileStats.size > MAX_FILE_SIZE) {
                return res.status(400).send({ status: false, message: `File exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB` });
            }

            // Read file and get MIME type
            fileBuffer = fs.readFileSync(documentPath);
            mimeType = mime.lookup(documentPath) || 'application/octet-stream';
            fileName = path.basename(documentPath);
        }

        // Check if file size from URL exceeds the limit
        if (fileBuffer.length > MAX_FILE_SIZE) {
            return res.status(400).send({ status: false, message: `File exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB` });
        }

        // Create a MessageMedia object
        const media = new MessageMedia(mimeType, fileBuffer.toString('base64'), fileName);

        // Send the document
        await req.client.sendMessage(formattedNumber, media);

        res.send({ status: true, message: 'Document sent successfully' });
    } catch (error) {
        console.error('Error sending document:', error);
        res.status(500).send({ status: false, message: 'Failed to send document', error: error.toString() });
    }
};

module.exports = {
    sendDocument,
};

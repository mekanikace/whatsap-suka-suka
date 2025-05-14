const { Location } = require('whatsapp-web.js');

const sendLocation = async (req, res) => {
    const { number, latitude, longitude, name } = req.body;

    // Validate input
    if (!number || !latitude || !longitude) {
        return res.status(400).send({ status: false, message: 'Number, latitude, and longitude are required' });
    }

    // Validate format number
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(number)) {
        return res.status(400).send({ status: false, message: 'Invalid phone number format' });
    }

    // Format number
    const formattedNumber = `${number}@c.us`;

    try {
        const locationMessage = new Location(latitude, longitude, {name: name});
        await req.client.sendMessage(formattedNumber, locationMessage);
        res.send({ status: true, message: 'Location sent successfully' });
    } catch (error) {
        res.status(500).send({ status: false, message: 'Failed to send location', error: error.toString() });
    }
};

module.exports = {
    sendLocation,
};

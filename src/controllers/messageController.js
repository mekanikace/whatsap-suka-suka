const sendMessage = async (req, res) => {
    const { number, message } = req.body;

    // Validate input
    if (!number || !message) {
        return res.status(400).send({ status: false, message: 'Number and message are required' });
    }

    // Validate format number
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(number)) {
        return res.status(400).send({ status: false, message: 'Invalid phone number format' });
    }

    // Format the number 
    const formattedNumber = `${number}@c.us`;

    try {
        await req.client.sendMessage(formattedNumber, message);
        res.send({ status: true, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).send({ status: false, message: 'Failed to send message', error: error.toString() });
    }
};

module.exports = {
    sendMessage,
};
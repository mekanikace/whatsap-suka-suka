const clientManager = require('../clientManager'); 

const clientMiddleware = (req, res, next) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send({ status: false, message: 'User ID is required' });
    }

    const client = clientManager.getClient(userId);
    if (!client) {
        return res.status(400).send({ status: false, message: `No active session for userId: ${userId}` });
    }

    req.client = client;
    next();
};

module.exports = clientMiddleware;

// Token for authorization 
const AUTH_TOKEN = "akukeren";

// Middleware 
const checkAuth = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).send({ status: false, message: 'Authorization token is required' });
    }

    if (token !== `Bearer ${AUTH_TOKEN}`) {
        return res.status(403).send({ status: false, message: 'Invalid authorization token' });
    }

    next(); 
};

module.exports = checkAuth;
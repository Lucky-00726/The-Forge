const { verifyAccessToken } = require('../config/jwt');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const user = verifyAccessToken(token);

  if (!user) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired access token'
    });
  }

  req.user = user;
  next();
}

module.exports = { authenticateToken };

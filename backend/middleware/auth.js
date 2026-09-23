const jwt = require('jsonwebtoken');

const JWT_SECRET = 'blog-platform-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    // Missing/invalid/expired credentials are all 401 so the client
    // can uniformly reset its auth state and ask for a fresh login.
    const message = err.name === 'TokenExpiredError'
      ? '登录已失效，请重新登录'
      : 'Invalid or expired token';
    return res.status(401).json({ error: message });
  }
}

module.exports = { authenticateToken, JWT_SECRET };

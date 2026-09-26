const jwt = require('jsonwebtoken');


const userAuthMiddleware = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required.'
      });
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    console.error('User authentication error:', error);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.'
    });
  }
};

module.exports = userAuthMiddleware;

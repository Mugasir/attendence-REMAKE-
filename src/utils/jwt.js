const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAdminToken, verifyToken };

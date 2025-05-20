const jwt = require('jsonwebtoken');
require('dotenv').config();
/**
 * Generate access and refresh tokens for a user
 * @param {Object} admin - Admin user object
 * @returns {Object} Object containing accessToken and refreshToken
 */
exports.generateTokens = (admin) => {
  console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET);
  console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
  
  // Create access token
  const accessToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );

  // Create refresh token
  const refreshToken = jwt.sign(
    { id: admin._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Set refresh token cookie
 * @param {Object} res - Express response object
 * @param {string} refreshToken - JWT refresh token
 */
exports.setRefreshTokenCookie = (res, refreshToken) => {
  const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

/**
 * Clear refresh token cookie (for logout)
 * @param {Object} res - Express response object
 */
exports.clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken');
}; 
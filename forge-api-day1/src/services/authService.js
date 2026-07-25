const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');

async function createUser(email, password, displayName) {
  const userId = uuidv4();
  const passwordHash = await hashPassword(password);

  const sql = `
    INSERT INTO users (id, email, password_hash, display_name)
    VALUES (?, ?, ?, ?)
  `;

  await query(sql, [userId, email, passwordHash, displayName]);

  return {
    id: userId,
    email,
    displayName,
    totalXp: 0,
    currentRank: 'Cadet',
    currentStreak: 0
  };
}

async function validateCredentials(email, password) {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const results = await query(sql, [email]);

  if (results.length === 0) {
    return null;
  }

  const user = results[0];
  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    totalXp: user.total_xp,
    currentRank: user.current_rank,
    currentStreak: user.current_streak
  };
}

async function generateTokens(userId, email) {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, email });

  await saveRefreshToken(userId, refreshToken);

  return { accessToken, refreshToken };
}

async function saveRefreshToken(userId, refreshToken) {
  const tokenId = uuidv4();
  const tokenHash = require('crypto')
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const sql = `
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `;

  await query(sql, [tokenId, userId, tokenHash, expiresAt]);
}

async function verifyRefreshTokenInDb(refreshToken) {
  const tokenHash = require('crypto')
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const sql = `
    SELECT * FROM refresh_tokens 
    WHERE token_hash = ? AND expires_at > NOW()
  `;

  const results = await query(sql, [tokenHash]);
  return results.length > 0;
}

async function revokeRefreshToken(refreshToken) {
  const tokenHash = require('crypto')
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const sql = 'DELETE FROM refresh_tokens WHERE token_hash = ?';
  await query(sql, [tokenHash]);
}

module.exports = {
  createUser,
  validateCredentials,
  generateTokens,
  verifyRefreshTokenInDb,
  revokeRefreshToken
};

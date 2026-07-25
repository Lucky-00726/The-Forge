const authService = require('../services/authService');
const { verifyRefreshToken, generateAccessToken } = require('../config/jwt');
const { successResponse } = require('../utils/responseFormatter');

async function signup(req, res, next) {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and display name are required'
      });
    }

    // Check if user exists
    const existingUser = await authService.validateCredentials(email, 'dummy');
    if (existingUser !== null) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = await authService.createUser(email, password, displayName);
    const { accessToken, refreshToken } = await authService.generateTokens(user.id, user.email);

    res.status(201).json(successResponse({
      user,
      accessToken,
      refreshToken
    }, 'User created successfully'));

  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await authService.validateCredentials(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const { accessToken, refreshToken } = await authService.generateTokens(user.id, user.email);

    res.json(successResponse({
      user,
      accessToken,
      refreshToken
    }, 'Login successful'));

  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const isValid = await authService.verifyRefreshTokenInDb(refreshToken);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token not found or expired'
      });
    }

    const accessToken = generateAccessToken({ 
      userId: payload.userId, 
      email: payload.email 
    });

    res.json(successResponse({ accessToken }, 'Token refreshed'));

  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    await authService.revokeRefreshToken(refreshToken);

    res.json(successResponse(null, 'Logged out successfully'));

  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  login,
  refresh,
  logout
};

const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { generateToken } = require('../utils/token');
const { bcryptSaltRounds } = require('../config/env');
const { User } = require('../models');

// POST /api/auth/register  — Module 1: User Registration & Auth
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, address } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409, errorCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(password, bcryptSaltRounds);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'customer',
    address,
  });

  const token = generateToken({ id: user._id, role: user.role });

  return success(res, 201, 'Registered successfully', {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApprovedSeller: user.isApprovedSeller,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401, errorCodes.INVALID_CREDENTIALS);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError('Invalid email or password', 401, errorCodes.INVALID_CREDENTIALS);
  }

  const token = generateToken({ id: user._id, role: user.role });

  return success(res, 200, 'Logged in successfully', {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApprovedSeller: user.isApprovedSeller,
    },
  });
});

// GET /api/auth/me — convenience endpoint to fetch the logged-in profile
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404, errorCodes.NOT_FOUND);
  return success(res, 200, 'Profile fetched', { user });
});

module.exports = { register, login, getMe };

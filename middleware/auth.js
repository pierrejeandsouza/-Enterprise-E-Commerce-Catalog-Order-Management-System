const { verifyToken } = require('../utils/token');
const { error } = require('../utils/apiResponse');
const errorCodes = require('../utils/errorCodes');
const { User } = require('../models');

// Verifies the JWT on protected routes and attaches req.user = { id, role }.
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return error(res, 401, 'Authentication token missing', errorCodes.AUTH_REQUIRED);
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('_id role isActive');
    if (!user || !user.isActive) {
      return error(res, 401, 'Account not found or deactivated', errorCodes.AUTH_REQUIRED);
    }

    req.user = { id: user._id.toString(), role: user.role };
    return next();
  } catch (err) {
    return error(res, 401, 'Invalid or expired token', errorCodes.TOKEN_INVALID);
  }
}

// Role-based access control: authorize('admin'), authorize('seller', 'admin'), etc.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, 'Authentication required', errorCodes.AUTH_REQUIRED);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 403, 'You do not have permission to perform this action', errorCodes.FORBIDDEN);
    }
    return next();
  };
}

module.exports = { authenticate, authorize };

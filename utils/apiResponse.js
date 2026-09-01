// Central success/error response shape, per the API convention in the project spec:
// success:  { success: true,  message, data }
// error:    { success: false, message, errorCode }

function success(res, statusCode, message, data = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

function error(res, statusCode, message, errorCode = 'ERROR') {
  return res.status(statusCode).json({ success: false, message, errorCode });
}

module.exports = { success, error };

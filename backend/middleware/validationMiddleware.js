const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    data: errors.array()
  });
};

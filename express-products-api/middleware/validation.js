const { ValidationError } = require('../utils/errors');

const validateProduct = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  const errors = [];
  
  // Validation rules
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }
  
  if (price === undefined || typeof price !== 'number' || price < 0) {
    errors.push('Price is required and must be a non-negative number');
  }
  
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required and must be a non-empty string');
  }
  
  if (typeof inStock !== 'boolean') {
    errors.push('inStock is required and must be a boolean');
  }
  
  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }
  
  // Sanitize data
  req.body.name = name.trim();
  req.body.description = description.trim();
  req.body.category = category.trim();
  
  next();
};

const validateProductUpdate = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  const errors = [];
  
  // For updates, all fields are optional but must be valid if provided
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    errors.push('Name must be a non-empty string');
  }
  
  if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
    errors.push('Description must be a non-empty string');
  }
  
  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    errors.push('Price must be a non-negative number');
  }
  
  if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
    errors.push('Category must be a non-empty string');
  }
  
  if (inStock !== undefined && typeof inStock !== 'boolean') {
    errors.push('inStock must be a boolean');
  }
  
  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }
  
  // Sanitize provided data
  if (name) req.body.name = name.trim();
  if (description) req.body.description = description.trim();
  if (category) req.body.category = category.trim();
  
  next();
};

module.exports = {
  validateProduct,
  validateProductUpdate
};
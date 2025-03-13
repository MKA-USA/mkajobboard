/**
 * @fileoverview Data Validation Utilities
 * Provides validation functions for various data types and forms.
 * 
 * @module validation
 */

/**
 * Validates job data
 * @param {Object} data - Job data to validate
 * @returns {Object} Validation result
 */
export const validateJobData = (data) => {
  const errors = {};

  // Required fields
  const requiredFields = ['title', 'company', 'location', 'type', 'description'];
  requiredFields.forEach(field => {
    if (!data[field]?.trim()) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });

  // Field-specific validations
  if (data.title && data.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }

  if (data.description && data.description.length > 5000) {
    errors.description = 'Description must be less than 5000 characters';
  }

  if (data.salary && !/^\$?\d+([,-]\d+)?k?$/i.test(data.salary)) {
    errors.salary = 'Invalid salary format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates application data
 * @param {Object} data - Application data to validate
 * @returns {Object} Validation result
 */
export const validateApplicationData = (data) => {
  const errors = {};

  // Required fields
  const requiredFields = ['name', 'email', 'phone'];
  requiredFields.forEach(field => {
    if (!data[field]?.trim()) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });

  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  }

  // Phone validation
  if (data.phone && !/^\+?[\d\s-()]{10,}$/.test(data.phone)) {
    errors.phone = 'Invalid phone number';
  }

  // Cover letter length
  if (data.coverLetter && data.coverLetter.length > 5000) {
    errors.coverLetter = 'Cover letter must be less than 5000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitizes user input
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

/**
 * Validates search parameters
 * @param {Object} params - Search parameters
 * @returns {Object} Validated and sanitized parameters
 */
export const validateSearchParams = (params) => {
  const validated = {};
  
  if (params.search) {
    validated.search = sanitizeInput(params.search);
  }
  
  if (params.category) {
    validated.category = sanitizeInput(params.category);
  }
  
  if (params.location) {
    validated.location = sanitizeInput(params.location);
  }
  
  if (params.type && ['Full-time', 'Part-time', 'Contract', 'Remote'].includes(params.type)) {
    validated.type = params.type;
  }
  
  return validated;
};

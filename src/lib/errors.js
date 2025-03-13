/**
 * @fileoverview Error handling utilities and custom error classes
 * This module provides a centralized error handling system for the application.
 * 
 * Features:
 * - Custom error classes for different types of errors
 * - Error handling utilities with toast notifications
 * - API response handling
 * 
 * @module errors
 */

/**
 * Custom error class for API-related errors
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Custom error class for validation errors
 * @class ValidationError
 * @extends Error
 */
export class ValidationError extends Error {
  /**
   * @param {string} message - Error message
   * @param {Object} [fields={}] - Field-specific error messages
   */
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Handles errors and displays appropriate toast notifications
 * @param {Error} error - The error to handle
 * @param {Function} toast - Toast notification function
 * @returns {Object|null} Field errors for validation errors, null otherwise
 */
export const handleError = (error, toast) => {
  console.error('Error:', error);

  if (error instanceof ValidationError) {
    toast({
      title: "Validation Error",
      description: error.message,
      variant: "destructive",
    });
    return error.fields;
  }

  if (error instanceof ApiError) {
    // Handle different status codes
    switch (error.statusCode) {
      case 401:
        toast({
          title: "Authentication Error",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        // Redirect to login if needed
        break;
      case 403:
        toast({
          title: "Access Denied",
          description: "You don't have permission to perform this action.",
          variant: "destructive",
        });
        break;
      case 404:
        toast({
          title: "Not Found",
          description: "The requested resource was not found.",
          variant: "destructive",
        });
        break;
      case 429:
        toast({
          title: "Rate Limit Exceeded",
          description: "Please try again later.",
          variant: "destructive",
        });
        break;
      default:
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
    }
    return null;
  }

  // Handle network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toast({
      title: "Network Error",
      description: "Please check your internet connection.",
      variant: "destructive",
    });
    return null;
  }

  // Generic error handling
  toast({
    title: "Error",
    description: "An unexpected error occurred. Please try again.",
    variant: "destructive",
  });
  return null;
};

/**
 * Handles API responses and throws appropriate errors
 * @async
 * @param {Response} response - Fetch API response
 * @returns {Promise<any>} Parsed response data
 * @throws {ApiError} If the response is not ok
 */
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    
    // Handle specific error cases
    switch (response.status) {
      case 400:
        if (data.validationErrors) {
          throw new ValidationError(
            data.message || 'Validation failed',
            data.validationErrors
          );
        }
        break;
      case 401:
        // Clear auth state if needed
        localStorage.removeItem('authToken');
        break;
      case 429:
        // Handle rate limiting
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          // Could implement retry logic here
        }
        break;
    }
    
    throw new ApiError(
      data.message || 'An error occurred while processing your request',
      response.status
    );
  }
  
  return response.json();
};

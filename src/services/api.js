/**
 * @fileoverview API service for MKA USA Job Board
 * This module handles all API interactions with the backend server.
 * 
 * Key features:
 * - Job CRUD operations
 * - Error handling with custom error types
 * - Request caching for performance
 * - Authentication handling
 * 
 * @module api
 */

import { handleApiResponse, ValidationError, ApiError } from '../lib/errors';

/**
 * Cache configuration for API responses
 * @private
 */
const cache = {
  jobs: new Map(),
  categories: new Map(),
  expiryTime: 5 * 60 * 1000 // 5 minutes
};

/**
 * Validates job data against required fields and format constraints
 * @private
 * @param {Object} jobData - The job data to validate
 * @throws {ValidationError} If validation fails
 */
const validateJobData = (jobData) => {
  const requiredFields = ['title', 'company', 'location', 'type', 'description'];
  const missingFields = requiredFields.filter(field => !jobData[field]?.trim());
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      'Missing required fields',
      missingFields.reduce((acc, field) => ({
        ...acc,
        [field]: 'This field is required'
      }), {})
    );
  }

  // Validate field lengths
  if (jobData.title.length > 100) {
    throw new ValidationError('Title is too long', { title: 'Maximum 100 characters allowed' });
  }
  
  if (jobData.description.length > 5000) {
    throw new ValidationError('Description is too long', { description: 'Maximum 5000 characters allowed' });
  }
};

/**
 * Validates email format
 * @private
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Fetches all jobs with optional filtering
 * @async
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.search] - Search term for title/company/description
 * @param {string} [filters.category] - Job category filter
 * @param {string} [filters.location] - Location filter
 * @param {string} [filters.type] - Job type filter
 * @returns {Promise<Array>} Array of job objects
 * @throws {ApiError} If the API request fails
 */
export const fetchJobs = async (filters = {}) => {
  try {
    // Generate cache key based on filters
    const cacheKey = JSON.stringify(filters);
    
    // Check cache first
    const cachedData = cache.jobs.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < cache.expiryTime) {
      return cachedData.data;
    }
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`/api/jobs?${queryParams.toString()}`);
    const data = await handleApiResponse(response);
    
    // Cache the response
    cache.jobs.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    throw new ApiError(`Failed to fetch jobs: ${error.message}`, error.statusCode);
  }
};

/**
 * Fetch a single job by ID
 * @async
 * @param {string} id - Job ID
 * @returns {Promise<Object>} Job object
 * @throws {ApiError} If the API request fails
 */
export const fetchJobById = async (id) => {
  try {
    // Check cache first
    const cacheKey = `job-${id}`;
    const cachedData = cache.jobs.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < cache.expiryTime) {
      return cachedData.data;
    }
    
    const response = await fetch(`/api/jobs/${id}`);
    const data = await handleApiResponse(response);
    
    // Cache the response
    cache.jobs.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    throw new ApiError(`Failed to fetch job ${id}: ${error.message}`, error.statusCode);
  }
};

/**
 * Fetch job categories
 * @async
 * @returns {Promise<Array>} Array of category objects
 * @throws {ApiError} If the API request fails
 */
export const fetchCategories = async () => {
  try {
    // Check cache first
    const cacheKey = 'categories';
    const cachedData = cache.categories.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < cache.expiryTime) {
      return cachedData.data;
    }
    
    const response = await fetch('/api/categories');
    const data = await handleApiResponse(response);
    
    // Cache the response
    cache.categories.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    throw new ApiError(`Failed to fetch categories: ${error.message}`, error.statusCode);
  }
};

/**
 * Creates a new job listing
 * @async
 * @param {Object} jobData - Job data
 * @param {string} jobData.title - Job title
 * @param {string} jobData.company - Company name
 * @param {string} jobData.location - Job location
 * @param {string} jobData.type - Job type (full-time, part-time, etc.)
 * @param {string} jobData.description - Job description
 * @param {string} [jobData.category] - Job category
 * @param {string} [jobData.salary] - Salary information
 * @param {string} [jobData.requirements] - Job requirements
 * @returns {Promise<Object>} Created job object
 * @throws {ValidationError} If job data is invalid
 * @throws {ApiError} If the API request fails
 */
export const createJob = async (jobData) => {
  try {
    // Validate job data
    validateJobData(jobData);
    
    const response = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
      credentials: 'include' // Important for authentication
    });
    
    const data = await handleApiResponse(response);
    
    // Invalidate jobs cache after creation
    cache.jobs.clear();
    
    return data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ApiError(`Failed to create job: ${error.message}`, error.statusCode);
  }
};

/**
 * Updates an existing job
 * @async
 * @param {string} id - Job ID
 * @param {Object} jobData - Updated job data
 * @returns {Promise<Object>} Updated job object
 * @throws {ValidationError} If job data is invalid
 * @throws {ApiError} If the API request fails
 */
export const updateJob = async (id, jobData) => {
  try {
    // Validate job data
    validateJobData(jobData);
    
    const response = await fetch(`/api/admin/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
      credentials: 'include'
    });
    
    const data = await handleApiResponse(response);
    
    // Invalidate jobs cache after update
    cache.jobs.clear();
    
    return data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ApiError(`Failed to update job ${id}: ${error.message}`, error.statusCode);
  }
};

/**
 * Deletes a job
 * @async
 * @param {string} id - Job ID
 * @returns {Promise<Object>} Deletion result
 * @throws {ApiError} If the API request fails
 */
export const deleteJob = async (id) => {
  try {
    const response = await fetch(`/api/admin/jobs/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await handleApiResponse(response);
    
    // Invalidate jobs cache after deletion
    cache.jobs.clear();
    
    return data;
  } catch (error) {
    throw new ApiError(`Failed to delete job ${id}: ${error.message}`, error.statusCode);
  }
};

/**
 * Submits a job application
 * @async
 * @param {string} jobId - ID of the job being applied for
 * @param {Object} applicationData - Application data
 * @param {string} applicationData.name - Applicant's name
 * @param {string} applicationData.email - Applicant's email
 * @param {string} applicationData.phone - Applicant's phone number
 * @param {string} [applicationData.coverLetter] - Cover letter
 * @returns {Promise<Object>} Application submission result
 * @throws {ValidationError} If application data is invalid
 * @throws {ApiError} If the API request fails
 */
export const applyForJob = async (jobId, applicationData) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !applicationData[field]);
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        'Missing required fields',
        missingFields.reduce((acc, field) => ({
          ...acc,
          [field]: 'This field is required'
        }), {})
      );
    }

    // Validate email format
    if (!isValidEmail(applicationData.email)) {
      throw new ValidationError(
        'Invalid email format',
        { email: 'Please enter a valid email address' }
      );
    }

    // Rate limiting check (prevent spam applications)
    const applicationKey = `${jobId}-${applicationData.email}`;
    if (localStorage.getItem(applicationKey)) {
      throw new ValidationError(
        'Application limit exceeded',
        { general: 'You have already applied for this job recently' }
      );
    }

    const response = await fetch(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData)
    });
    
    const data = await handleApiResponse(response);
    
    // Set rate limiting flag
    localStorage.setItem(applicationKey, Date.now().toString());
    
    return data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ApiError(`Failed to submit application: ${error.message}`, error.statusCode);
  }
};

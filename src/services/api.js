import { handleApiResponse, ValidationError } from '../lib/errors';

// Fetch all jobs
export const fetchJobs = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.search) queryParams.append('search', filters.search);
    
    const response = await fetch(`/api/jobs?${queryParams.toString()}`);
    return handleApiResponse(response);
  } catch (error) {
    throw new ApiError('Failed to fetch jobs: ' + error.message);
  }
};

// Fetch a single job by ID
export const fetchJobById = async (id) => {
  try {
    const response = await fetch(`/api/jobs/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    throw new ApiError(`Failed to fetch job ${id}: ${error.message}`);
  }
};

// Admin: Create a new job
export const createJob = async (jobData) => {
  // Validate required fields
  const requiredFields = ['title', 'company', 'location', 'type', 'description'];
  const missingFields = requiredFields.filter(field => !jobData[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      'Missing required fields',
      missingFields.reduce((acc, field) => ({
        ...acc,
        [field]: 'This field is required'
      }), {})
    );
  }

  try {
    const response = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
      credentials: 'include'
    });
    
    return handleApiResponse(response);
  } catch (error) {
    throw new ApiError('Failed to create job: ' + error.message);
  }
};

// Admin: Update a job
export const updateJob = async (id, jobData) => {
  // Validate required fields
  const requiredFields = ['title', 'company', 'location', 'type', 'description'];
  const missingFields = requiredFields.filter(field => !jobData[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      'Missing required fields',
      missingFields.reduce((acc, field) => ({
        ...acc,
        [field]: 'This field is required'
      }), {})
    );
  }

  try {
    const response = await fetch(`/api/admin/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
      credentials: 'include'
    });
    
    return handleApiResponse(response);
  } catch (error) {
    throw new ApiError(`Failed to update job ${id}: ${error.message}`);
  }
};

// Admin: Delete a job
export const deleteJob = async (id) => {
  try {
    const response = await fetch(`/api/admin/jobs/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    return handleApiResponse(response);
  } catch (error) {
    throw new ApiError(`Failed to delete job ${id}: ${error.message}`);
  }
};

// Fetch job categories
export const fetchCategories = async () => {
  try {
    const response = await fetch('/api/categories');
    return handleApiResponse(response);
  } catch (error) {
    throw new ApiError('Failed to fetch categories: ' + error.message);
  }
};

// Apply for a job
export const applyForJob = async (jobId, applicationData) => {
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

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(applicationData.email)) {
    throw new ValidationError(
      'Invalid email format',
      { email: 'Please enter a valid email address' }
    );
  }

  try {
    const response = await fetch(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData)
    });
    
    return handleApiResponse(response);
  } catch (error) {
    throw new ApiError('Failed to submit application: ' + error.message);
  }
};

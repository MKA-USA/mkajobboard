// Custom error classes
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

// Error handler utility
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
    toast({
      title: "API Error",
      description: error.message,
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

// API response handler
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.message || 'An error occurred while processing your request',
      response.status
    );
  }
  return response.json();
};

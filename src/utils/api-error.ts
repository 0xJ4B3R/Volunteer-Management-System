import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string; error?: string }>;
    const status = axiosError.response?.status || 500;
    const message = 
      axiosError.response?.data?.message || 
      axiosError.response?.data?.error || 
      axiosError.message || 
      'An unexpected error occurred';
    
    return new ApiError(status, message, axiosError.response?.data);
  }
  
  if (error instanceof Error) {
    return new ApiError(500, error.message);
  }
  
  return new ApiError(500, 'An unexpected error occurred');
}; 
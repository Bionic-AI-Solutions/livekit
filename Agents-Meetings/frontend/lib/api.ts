/**
 * API client for backend communication
 */
import axios from 'axios';

// Create axios instance - baseURL will be set dynamically in interceptor
const apiClient = axios.create({
  baseURL: '', // Will be set to full HTTPS URL in interceptor
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => status < 500,
});

// Interceptor to ensure HTTPS protocol for all API requests
// This MUST be the first interceptor to run
apiClient.interceptors.request.use((config) => {
  // Only modify in browser environment
  if (typeof window !== 'undefined') {
    // Get the current origin and ALWAYS force HTTPS
    const origin = window.location.origin;
    const httpsOrigin = origin.replace(/^http:/i, 'https:');
    
    // ALWAYS set baseURL to full HTTPS URL - this prevents any HTTP requests
    config.baseURL = `${httpsOrigin}/api/v1`;
    
    // CRITICAL: Force HTTPS on baseURL - multiple safety checks
    config.baseURL = config.baseURL.replace(/^http:/i, 'https:');
    if (config.baseURL.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    
    // Handle config.url - ensure it's a relative path
    if (config.url) {
      // If url is absolute, extract just the path
      if (config.url.startsWith('http://') || config.url.startsWith('https://')) {
        try {
          const url = new URL(config.url);
          config.url = url.pathname + (url.search || '');
        } catch (e) {
          // If URL parsing fails, extract path manually
          config.url = config.url.replace(/^https?:\/\/[^\/]+/, '');
        }
      }
      
      // Remove leading slash to make it relative to baseURL
      if (config.url.startsWith('/')) {
        config.url = config.url.substring(1);
      }
      
      // Remove /api/v1 prefix if present (since baseURL already has it)
      if (config.url.startsWith('api/v1/')) {
        config.url = config.url.substring(7);
      }
    }
    
    // Don't override Content-Type for FormData - let axios set it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      const fullUrl = config.baseURL + (config.url ? '/' + config.url : '');
      if (fullUrl.includes('http://')) {
        console.error('WARNING: URL still contains HTTP!', { baseURL: config.baseURL, url: config.url, fullUrl });
      }
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle redirects, HTTPS, and authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response && error.response.status === 401) {
      // Only clear token if we're in browser environment
      if (typeof window !== 'undefined') {
        // Clear the invalid token
        localStorage.removeItem('access_token');
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          // Use window.location for a hard redirect to ensure state is cleared
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
    
    // If we get a redirect (307, 308), handle it manually with HTTPS
    if (error.response && error.response.status >= 300 && error.response.status < 400) {
      const location = error.response.headers.location;
      if (location) {
        // Ensure redirect uses HTTPS
        const httpsLocation = location.replace(/^http:/i, 'https:');
        
        // Extract the path from the location
        let redirectUrl = httpsLocation;
        if (httpsLocation.startsWith('http://') || httpsLocation.startsWith('https://')) {
          // Extract path from full URL
          try {
            const url = new URL(httpsLocation);
            redirectUrl = url.pathname + (url.search || '');
          } catch (e) {
            // If URL parsing fails, try to extract path manually
            redirectUrl = httpsLocation.replace(/^https?:\/\/[^\/]+/, '');
          }
        }
        
        // Remove leading slash if present
        redirectUrl = redirectUrl.replace(/^\/+/, '');
        
        // Ensure the retry config uses HTTPS
        const retryConfig = {
          ...error.config,
          url: redirectUrl,
        };
        
        // Force HTTPS on the retry config
        if (typeof window !== 'undefined') {
          const origin = window.location.origin;
          const httpsOrigin = origin.replace(/^http:/i, 'https:');
          retryConfig.baseURL = `${httpsOrigin}/api/v1`;
        }
        
        // Retry the request with HTTPS
        return apiClient.request(retryConfig);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;



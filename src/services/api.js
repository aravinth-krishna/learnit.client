// Use proxy in development, or explicit URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(fullName, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
  }

  async logout() {
    const token = localStorage.getItem('token');
    
    // If no token exists, skip API call
    if (!token) {
      return { message: 'Already logged out' };
    }

    try {
      return await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // If logout fails due to 401 (unauthorized) or network error, it's okay
      // since the token might be expired or server unreachable - we'll still logout locally
      if (error.message.includes('401') || error.message.includes('Failed to fetch')) {
        console.log('Logout API call failed, proceeding with local logout:', error.message);
        return { message: 'Logged out successfully' };
      }
      // For other errors, still proceed with logout but log the error
      console.warn('Logout API error:', error.message);
      return { message: 'Logged out successfully' };
    }
  }
}

export default new ApiService();


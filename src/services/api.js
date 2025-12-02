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
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }
}

export default new ApiService();


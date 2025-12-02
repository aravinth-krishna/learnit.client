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

  // Courses API
  async getCourses(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.duration) queryParams.append('duration', params.duration);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/api/courses${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getCourse(id) {
    return this.request(`/api/courses/${id}`);
  }

  async createCourse(courseData) {
    return this.request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id, courseData) {
    return this.request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id) {
    return this.request(`/api/courses/${id}`, {
      method: 'DELETE',
    });
  }

  async getCourseStats() {
    return this.request('/api/courses/stats');
  }

  // Schedule API
  async getScheduleEvents(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    const queryString = queryParams.toString();
    const endpoint = `/api/schedule${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async createScheduleEvent(event) {
    return this.request('/api/schedule', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateScheduleEvent(id, event) {
    return this.request(`/api/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  async deleteScheduleEvent(id) {
    return this.request(`/api/schedule/${id}`, {
      method: 'DELETE',
    });
  }

  // Course-Schedule Integration
  async getAvailableModules() {
    return this.request('/api/schedule/available-modules');
  }

  async autoScheduleModules(startDateTime = null) {
    return this.request('/api/schedule/auto-schedule', {
      method: 'POST',
      body: JSON.stringify({ startDateTime }),
    });
  }

  async linkEventToModule(eventId, moduleId) {
    return this.request(`/api/schedule/${eventId}/link-module/${moduleId}`, {
      method: 'POST',
    });
  }

  async unlinkEventFromModule(eventId) {
    return this.request(`/api/schedule/${eventId}/unlink-module`, {
      method: 'DELETE',
    });
  }

  // Profile API
  async getProfile() {
    return this.request('/api/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/profile/info', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updatePreferences(preferencesData) {
    return this.request('/api/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferencesData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Progress API
  async getProgressDashboard() {
    return this.request('/api/progress/dashboard');
  }

  // Course Management
  async editCourse(courseId, courseData) {
    return this.request(`/api/courses/${courseId}/edit`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  // Session Management
  async startStudySession(courseId, moduleId = null) {
    const params = moduleId ? `?moduleId=${moduleId}` : '';
    return this.request(`/api/courses/${courseId}/sessions/start${params}`, {
      method: 'POST',
    });
  }

  async stopStudySession(sessionId, notes = '') {
    return this.request(`/api/courses/sessions/${sessionId}/stop`, {
      method: 'PUT',
      body: JSON.stringify(notes),
    });
  }

  async getCourseSessions(courseId) {
    return this.request(`/api/courses/${courseId}/sessions`);
  }
}

export default new ApiService();


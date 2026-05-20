const BASE_URL = '/api';

const handleAuthFailure = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

export const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error(`[Auth Error] ${response.status} on GET ${endpoint}. Clearing session and redirecting to login.`);
          handleAuthFailure();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error(`API GET error on ${endpoint}:`, error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const token = localStorage.getItem('token');
      const isPublicRoute = ['/auth/login', '/health'].includes(endpoint);
      
      if (!token && !isPublicRoute) {
        console.warn(`[API Client] Missing token for POST ${endpoint}`);
      }
      
      const isFormData = data instanceof FormData;
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: isFormData ? data : JSON.stringify(data)
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error(`[Auth Error] ${response.status} on POST ${endpoint}. Clearing session and redirecting to login.`);
          handleAuthFailure();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error(`API POST error on ${endpoint}:`, error);
      throw error;
    }
  },

  async patch(endpoint, data) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error(`API PATCH error on ${endpoint}:`, error);
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error(`API PUT error on ${endpoint}:`, error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error(`API DELETE error on ${endpoint}:`, error);
      throw error;
    }
  }
};

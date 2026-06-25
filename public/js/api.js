/* ==========================================
   PREETHI NUTRITION CENTER - UNIFIED API
   ========================================== */

(function () {
  const API_BASE = '/api';

  // API Client Object attached to Window context
  const PreethiAPI = {
    // 1. Session Storage Helpers
    getToken: () => localStorage.getItem('token'),
    saveToken: (token) => localStorage.setItem('token', token),
    
    getUser: () => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    },
    saveUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const protectedPaths = ['/admin', '/dashboard'];
      const currentPath = window.location.pathname;
      const isProtected = protectedPaths.some(path => currentPath.includes(path));
      if (isProtected) {
        window.location.href = '/login';
      }
    },

    // 2. Generic Fetch request wrapper
    request: async (url, options = {}) => {
      const token = PreethiAPI.getToken();
      
      // Setup headers
      options.headers = options.headers || {};
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      // Automatically format JSON bodies if not Multipart FormData
      if (options.body && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }

      try {
        const response = await fetch(`${API_BASE}${url}`, options);
        
        // Log out user if token has expired or is invalid (ignore for login/registration gates)
        if (response.status === 401 && !url.startsWith('/auth/')) {
          PreethiAPI.logout();
          throw new Error('Session expired. Please log in again.');
        }

        let data = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textMsg = await response.text();
          data = { message: textMsg || 'API request failed' };
        }

        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }

        return data;
      } catch (error) {
        console.error(`API Error [${url}]:`, error);
        throw error;
      }
    },

    /* --- AUTH ENDPOINTS --- */
    login: (email, password) => {
      return PreethiAPI.request('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
    },

    register: (userData) => {
      return PreethiAPI.request('/auth/register', {
        method: 'POST',
        body: userData
      });
    },

    adminLogin: (email, password) => {
      return PreethiAPI.request('/auth/admin/login', {
        method: 'POST',
        body: { email, password }
      });
    },

    /* --- ABOUT PAGE ENDPOINTS --- */
    getAbout: () => {
      return PreethiAPI.request('/about', { method: 'GET' });
    },

    updateAbout: (aboutData) => {
      return PreethiAPI.request('/admin/about', {
        method: 'PUT',
        body: aboutData
      });
    },

    /* --- POSTS / FEED ENDPOINTS --- */
    getPosts: () => {
      return PreethiAPI.request('/posts', { method: 'GET' });
    },

    uploadPost: (formData) => {
      return PreethiAPI.request('/admin/posts', {
        method: 'POST',
        body: formData // Form data handles boundaries automatically
      });
    },

    deletePost: (id) => {
      return PreethiAPI.request(`/admin/posts/${id}`, {
        method: 'DELETE'
      });
    },

    updatePost: (id, formData) => {
      return PreethiAPI.request(`/admin/posts/${id}`, {
        method: 'PUT',
        body: formData
      });
    },

    /* --- PRODUCTS STORE ENDPOINTS --- */
    getProducts: () => {
      return PreethiAPI.request('/products', { method: 'GET' });
    },

    addProduct: (formData) => {
      return PreethiAPI.request('/admin/products', {
        method: 'POST',
        body: formData
      });
    },

    updateProduct: (id, formData) => {
      return PreethiAPI.request(`/admin/products/${id}`, {
        method: 'PUT',
        body: formData
      });
    },

    deleteProduct: (id) => {
      return PreethiAPI.request(`/admin/products/${id}`, {
        method: 'DELETE'
      });
    },

    /* --- SUCCESS STORIES ENDPOINTS --- */
    getSuccessStories: () => {
      return PreethiAPI.request('/success', { method: 'GET' });
    },

    addSuccessStory: (formData) => {
      return PreethiAPI.request('/admin/success', {
        method: 'POST',
        body: formData
      });
    },

    deleteSuccessStory: (id) => {
      return PreethiAPI.request(`/admin/success/${id}`, {
        method: 'DELETE'
      });
    },

    /* --- WELLNESS BLOGS ENDPOINTS --- */
    getBlogs: () => {
      return PreethiAPI.request('/blogs', { method: 'GET' });
    },

    addBlog: (blogData) => {
      return PreethiAPI.request('/admin/blogs', {
        method: 'POST',
        body: blogData
      });
    },

    updateBlog: (id, blogData) => {
      return PreethiAPI.request(`/admin/blogs/${id}`, {
        method: 'PUT',
        body: blogData
      });
    },

    deleteBlog: (id) => {
      return PreethiAPI.request(`/admin/blogs/${id}`, {
        method: 'DELETE'
      });
    }
  };

  // Expose to window context
  window.PreethiAPI = PreethiAPI;
})();

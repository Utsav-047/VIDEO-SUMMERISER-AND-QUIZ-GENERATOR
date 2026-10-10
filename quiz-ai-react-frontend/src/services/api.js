// API Service Client for Synapse AI Backend

const BASE_URL = ''; // Relative path leverages Vite dev server proxy to http://127.0.0.1:5000

async function request(endpoint, options = {}) {
  const defaultHeaders = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    credentials: 'include', // Crucial for Flask session cookie handling
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth endpoints
  async getMe() {
    return request('/api/me');
  },

  async login(email, password) {
    return request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(fullName, email, password) {
    return request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
  },

  async logout() {
    return request('/api/logout', {
      method: 'POST',
    });
  },

  async forgotPassword(email) {
    return request('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email, otp, newPassword) {
    return request('/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
  },

  // Video processing & AI Generation
  async processVideo({ youtubeUrl, file }) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      return request('/api/process', {
        method: 'POST',
        body: formData,
      });
    } else {
      return request('/api/process', {
        method: 'POST',
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });
    }
  },

  async generate(videoId, transcript, { difficulty = 'medium', numQuestions = 5, summaryFormat = 'executive' } = {}) {
    return request(`/api/generate/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({
        transcript,
        difficulty,
        num_questions: numQuestions,
        summary_format: summaryFormat,
      }),
    });
  },

  async submitQuiz(quizId, answers) {
    return request(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async getHistory() {
    return request('/api/history');
  },

  async getPerformance() {
    return request('/api/performance');
  },
};

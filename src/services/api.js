import axios from 'axios';

// Use relative URLs to leverage Vite proxy, or fallback to direct connection
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The Echo - Document Analysis
export const analyzeDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/textract/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// The Bridge - Portfolio Summarization
export const summarizePortfolio = async (portfolioData, modelId = null) => {
  const payload = { portfolio_data: portfolioData };
  if (modelId) payload.model_id = modelId;
  
  const response = await api.post('/api/bedrock/summarize', payload);
  return response.data;
};

// Upload Portfolio - Upload document, extract with Textract, summarize with Bedrock, and store in S3
export const uploadPortfolio = async (file) => {
  // Expects a File object (PDF, PNG, JPG)
  if (!(file instanceof File)) {
    throw new Error('Please upload a portfolio document file (PDF, PNG, or JPG)');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/portfolio/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// The Mentor - Financial Education
export const explainConcept = async (concept, context = {}) => {
  const response = await api.post('/api/mentor/explain', {
    concept,
    context,
  });
  return response.data;
};

// Quiz
export const startQuiz = async () => {
  const response = await api.get('/api/quiz/start');
  return response.data;
};

export const submitQuiz = async (answers) => {
  const response = await api.post('/api/quiz/submit', { answers });
  return response.data;
};

// Goals
export const generateGoals = async (caseId, quizAnswers, selectedGoals, totalAccountValue) => {
  const response = await api.post(`/api/goals/generate/${caseId}`, {
    quiz_answers: quizAnswers,
    selected_goals: selectedGoals,
    total_account_value: totalAccountValue,
  });
  return response.data;
};

export const completeGoal = async (goalId, userId = 'default_user', pointsReward = 50) => {
  const response = await api.post('/api/goals/complete', {
    goal_id: goalId,
    user_id: userId,
    points_reward: pointsReward,
  });
  return response.data;
};

// Gamification
export const getProgress = async (userId = 'default_user') => {
  const response = await api.get(`/api/gamification/progress?user_id=${userId}`);
  return response.data;
};

// Health Check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;

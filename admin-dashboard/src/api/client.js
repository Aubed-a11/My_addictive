import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

client.interceptors.request.use((config) => {
  const jeton = localStorage.getItem('admin_jeton');
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

client.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const message = erreur?.response?.data?.error || 'Une erreur reseau est survenue.';
    return Promise.reject(new Error(message));
  }
);

export default client;

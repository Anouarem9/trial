import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

export const AuthAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data)
};

export const TournoiAPI = {
  list: () => api.get('/tournois').then(r => r.data),
  get: id => api.get(`/tournois/${id}`).then(r => r.data),
  create: data => api.post('/tournois', data).then(r => r.data),
  update: (id, data) => api.put(`/tournois/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/tournois/${id}`).then(r => r.data),
  matches: id => api.get(`/tournois/${id}/matches`).then(r => r.data),
  generateBracket: id => api.post(`/tournois/${id}/bracket`).then(r => r.data),
  registerEquipe: (tid, eid) => api.post(`/tournois/${tid}/equipes/${eid}`).then(r => r.data),
  unregisterEquipe: (tid, eid) => api.delete(`/tournois/${tid}/equipes/${eid}`).then(r => r.data)
};

export const EquipeAPI = {
  list: (tournoiId) => api.get('/equipes', { params: tournoiId ? { tournoiId } : {} }).then(r => r.data),
  get: id => api.get(`/equipes/${id}`).then(r => r.data),
  participations: id => api.get(`/equipes/${id}/tournois`).then(r => r.data),
  create: data => api.post('/equipes', data).then(r => r.data),
  update: (id, data) => api.put(`/equipes/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/equipes/${id}`).then(r => r.data)
};

export const JoueurAPI = {
  list: (equipeId) => api.get('/joueurs', { params: equipeId ? { equipeId } : {} }).then(r => r.data),
  get: id => api.get(`/joueurs/${id}`).then(r => r.data),
  create: data => api.post('/joueurs', data).then(r => r.data),
  update: (id, data) => api.put(`/joueurs/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/joueurs/${id}`).then(r => r.data)
};

export const MatcheAPI = {
  updateScore: (id, scoreEquipe1, scoreEquipe2) =>
    api.put(`/matches/${id}/score`, { scoreEquipe1, scoreEquipe2 }).then(r => r.data),
  updateSchedule: (id, dateMatch, lieu) =>
    api.put(`/matches/${id}/programmation`, { dateMatch, lieu }).then(r => r.data),
  getPlayerStats: id => api.get(`/matches/${id}/player-stats`).then(r => r.data),
  updatePlayerStats: (id, stats) => api.put(`/matches/${id}/player-stats`, stats).then(r => r.data),
  getEvents: id => api.get(`/matches/${id}/events`).then(r => r.data),
  updateEvents: (id, payload) => api.put(`/matches/${id}/events`, payload).then(r => r.data)
};

export default api;

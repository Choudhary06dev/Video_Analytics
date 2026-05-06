import { get, post, put, del } from './api';

const blacklistService = {
  getAll: async () => {
    return await get('/api/v1/blacklist/');
  },
  
  create: async (data) => {
    return await post('/api/v1/blacklist/', data);
  },
  
  update: async (id, data) => {
    return await put(`/api/v1/blacklist/${id}`, data);
  },
  
  delete: async (id) => {
    return await del(`/api/v1/blacklist/${id}`);
  }
};

export default blacklistService;

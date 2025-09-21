import api from './client';

export const updateLatecomerStatus = async (id, status, remarks) => {
  try {
    const response = await api.put(`/api/latecomers/${id}/status`, {
      status,
      remarks,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
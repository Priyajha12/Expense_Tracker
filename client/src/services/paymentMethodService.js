import api from './api';

export const fetchPaymentMethods = async () => {
    const response = await api.get('/payment-methods');
    return response.data;
};

export const createPaymentMethod = async (data) => {
    const response = await api.post('/payment-methods', data);
    return response.data;
};

export const updatePaymentMethod = async (id, data) => {
    const response = await api.put(`/payment-methods/${id}`, data);
    return response.data;
};

export const deletePaymentMethod = async (id) => {
    const response = await api.delete(`/payment-methods/${id}`);
    return response.data;
};

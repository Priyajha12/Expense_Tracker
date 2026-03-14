import api from './api';

export const fetchIncomes = async () => {
    const response = await api.get('/incomes');
    return response.data;
};

export const createIncome = async (data) => {
    const response = await api.post('/incomes', data);
    return response.data;
};

export const deleteIncome = async (id) => {
    const response = await api.delete(`/incomes/${id}`);
    return response.data;
};

export const fetchIncomeCategories = async () => {
    const response = await api.get('/incomes/categories');
    return response.data;
};

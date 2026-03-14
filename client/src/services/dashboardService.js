import api from './api';

export const fetchDashboardData = async (month, year) => {
    const response = await api.get(`/dashboard?month=${month}&year=${year}`);
    return response.data;
};

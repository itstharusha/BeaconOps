// FILE: src/store/analyticsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '@/services/api';

export const fetchDashboardStats = createAsyncThunk('analytics/dashboard', async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/analytics/dashboard');
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch dashboard'); }
});

export const fetchSupplierAnalytics = createAsyncThunk('analytics/suppliers', async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/analytics/suppliers');
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics'); }
});

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState: { dashboard: null, supplierAnalytics: null, loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
            .addCase(fetchDashboardStats.fulfilled, (state, { payload }) => { state.loading = false; state.dashboard = payload; })
            .addCase(fetchDashboardStats.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(fetchSupplierAnalytics.fulfilled, (state, { payload }) => { state.supplierAnalytics = payload; });
    },
});

export default analyticsSlice.reducer;

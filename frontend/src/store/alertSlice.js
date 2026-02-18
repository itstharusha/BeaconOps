// FILE: src/store/alertSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '@/services/api';

export const fetchAlerts = createAsyncThunk('alerts/fetchAll', async (params, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/alerts', { params });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch alerts'); }
});

export const fetchMyAlerts = createAsyncThunk('alerts/fetchMine', async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/alerts/my-alerts');
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch my alerts'); }
});

export const assignAlert = createAsyncThunk('alerts/assign', async ({ id, assigneeId }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/alerts/${id}/assign`, { assigneeId });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to assign alert'); }
});

export const acknowledgeAlert = createAsyncThunk('alerts/acknowledge', async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/alerts/${id}/acknowledge`);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to acknowledge alert'); }
});

export const resolveAlert = createAsyncThunk('alerts/resolve', async ({ id, resolutionNotes }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/alerts/${id}/resolve`, { resolutionNotes });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to resolve alert'); }
});

const alertSlice = createSlice({
    name: 'alerts',
    initialState: { items: [], myAlerts: [], loading: false, error: null, totalCount: 0 },
    reducers: { clearAlertError: (state) => { state.error = null; } },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAlerts.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAlerts.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.data || payload;
                state.totalCount = payload.totalCount || (payload.data || payload).length;
            })
            .addCase(fetchAlerts.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(fetchMyAlerts.fulfilled, (state, { payload }) => { state.myAlerts = payload.data || payload; })
            .addCase(assignAlert.fulfilled, (state, { payload }) => {
                const idx = state.items.findIndex((a) => a._id === payload._id);
                if (idx >= 0) state.items[idx] = payload;
            })
            .addCase(acknowledgeAlert.fulfilled, (state, { payload }) => {
                const idx = state.items.findIndex((a) => a._id === payload._id);
                if (idx >= 0) state.items[idx] = payload;
            })
            .addCase(resolveAlert.fulfilled, (state, { payload }) => {
                const idx = state.items.findIndex((a) => a._id === payload._id);
                if (idx >= 0) state.items[idx] = payload;
            });
    },
});

export const { clearAlertError } = alertSlice.actions;
export default alertSlice.reducer;

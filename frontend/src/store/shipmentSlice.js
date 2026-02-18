// FILE: src/store/shipmentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '@/services/api';

export const fetchShipments = createAsyncThunk('shipments/fetchAll', async (params, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/shipments', { params });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch shipments'); }
});

export const fetchShipmentById = createAsyncThunk('shipments/fetchById', async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.get(`/shipments/${id}`);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch shipment'); }
});

export const createShipment = createAsyncThunk('shipments/create', async (body, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/shipments', body);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create shipment'); }
});

export const updateShipmentStatus = createAsyncThunk('shipments/updateStatus', async ({ id, status, reason }, { rejectWithValue }) => {
    try {
        const { data } = await API.patch(`/shipments/${id}/status`, { status, reason });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update status'); }
});

export const addTrackingEvent = createAsyncThunk('shipments/addTracking', async ({ id, ...body }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/shipments/${id}/tracking`, body);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to add tracking event'); }
});

const shipmentSlice = createSlice({
    name: 'shipments',
    initialState: { items: [], current: null, loading: false, error: null, totalCount: 0 },
    reducers: { clearShipmentError: (state) => { state.error = null; } },
    extraReducers: (builder) => {
        builder
            .addCase(fetchShipments.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchShipments.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.data || payload;
                state.totalCount = payload.totalCount || (payload.data || payload).length;
            })
            .addCase(fetchShipments.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(fetchShipmentById.fulfilled, (state, { payload }) => { state.current = payload; })
            .addCase(createShipment.fulfilled, (state, { payload }) => { state.items.unshift(payload); })
            .addCase(updateShipmentStatus.fulfilled, (state, { payload }) => {
                const idx = state.items.findIndex((s) => s._id === payload._id);
                if (idx >= 0) state.items[idx] = payload;
                if (state.current?._id === payload._id) state.current = payload;
            })
            .addCase(addTrackingEvent.fulfilled, (state, { payload }) => {
                if (state.current?._id === payload._id) state.current = payload;
            });
    },
});

export const { clearShipmentError } = shipmentSlice.actions;
export default shipmentSlice.reducer;

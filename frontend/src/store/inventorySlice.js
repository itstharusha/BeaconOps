// FILE: src/store/inventorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '@/services/api';

export const fetchInventory = createAsyncThunk('inventory/fetchAll', async (params, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/inventory', { params });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch inventory'); }
});

export const fetchInventoryById = createAsyncThunk('inventory/fetchById', async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.get(`/inventory/${id}`);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch item'); }
});

export const createInventoryItem = createAsyncThunk('inventory/create', async (body, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/inventory', body);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create item'); }
});

export const adjustStock = createAsyncThunk('inventory/adjustStock', async ({ id, adjustment, reason }, { rejectWithValue }) => {
    try {
        const { data } = await API.post(`/inventory/${id}/adjust`, { adjustment, reason });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to adjust stock'); }
});

const inventorySlice = createSlice({
    name: 'inventory',
    initialState: { items: [], current: null, loading: false, error: null, totalCount: 0 },
    reducers: { clearInventoryError: (state) => { state.error = null; } },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInventory.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchInventory.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.data || payload;
                state.totalCount = payload.totalCount || (payload.data || payload).length;
            })
            .addCase(fetchInventory.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(fetchInventoryById.fulfilled, (state, { payload }) => { state.current = payload; })
            .addCase(createInventoryItem.fulfilled, (state, { payload }) => { state.items.unshift(payload); })
            .addCase(adjustStock.fulfilled, (state, { payload }) => {
                const idx = state.items.findIndex((s) => s._id === payload._id);
                if (idx >= 0) state.items[idx] = payload;
                if (state.current?._id === payload._id) state.current = payload;
            });
    },
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;

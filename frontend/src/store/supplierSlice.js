// FILE: src/store/supplierSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '@/services/api';

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async (params, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/suppliers', { params });
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch suppliers'); }
});

export const fetchSupplierById = createAsyncThunk('suppliers/fetchById', async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.get(`/suppliers/${id}`);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch supplier'); }
});

export const fetchSupplierRiskHistory = createAsyncThunk('suppliers/fetchRiskHistory', async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.get(`/suppliers/${id}/risk-history`);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch risk history'); }
});

export const createSupplier = createAsyncThunk('suppliers/create', async (body, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/suppliers', body);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create supplier'); }
});

export const updateSupplier = createAsyncThunk('suppliers/update', async ({ id, ...body }, { rejectWithValue }) => {
    try {
        const { data } = await API.put(`/suppliers/${id}`, body);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update supplier'); }
});

export const deleteSupplier = createAsyncThunk('suppliers/delete', async (id, { rejectWithValue }) => {
    try {
        await API.delete(`/suppliers/${id}`);
        return id;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete supplier'); }
});

const supplierSlice = createSlice({
    name: 'suppliers',
    initialState: { items: [], current: null, riskHistory: [], loading: false, error: null, totalCount: 0 },
    reducers: { clearSupplierError: (state) => { state.error = null; } },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSuppliers.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchSuppliers.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.data || payload;
                state.totalCount = payload.totalCount || (payload.data || payload).length;
            })
            .addCase(fetchSuppliers.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(fetchSupplierById.fulfilled, (state, { payload }) => { state.current = payload; })
            .addCase(fetchSupplierRiskHistory.fulfilled, (state, { payload }) => { state.riskHistory = payload; })
            .addCase(createSupplier.fulfilled, (state, { payload }) => { state.items.unshift(payload); })
            .addCase(updateSupplier.fulfilled, (state, { payload }) => {
                const idx = state.items.findIndex((s) => s._id === payload._id);
                if (idx >= 0) state.items[idx] = payload;
                if (state.current?._id === payload._id) state.current = payload;
            })
            .addCase(deleteSupplier.fulfilled, (state, { payload }) => {
                state.items = state.items.filter((s) => s._id !== payload);
            });
    },
});

export const { clearSupplierError } = supplierSlice.actions;
export default supplierSlice.reducer;

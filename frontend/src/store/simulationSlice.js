// FILE: src/store/simulationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '@/services/api';

export const fetchSimulations = createAsyncThunk('simulations/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/simulations');
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch simulations'); }
});

export const runSimulation = createAsyncThunk('simulations/run', async (body, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/simulations/run', body);
        return data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to run simulation'); }
});

const simulationSlice = createSlice({
    name: 'simulations',
    initialState: { items: [], current: null, loading: false, running: false, error: null },
    reducers: { clearSimError: (state) => { state.error = null; } },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSimulations.pending, (state) => { state.loading = true; })
            .addCase(fetchSimulations.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload.data || payload; })
            .addCase(fetchSimulations.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(runSimulation.pending, (state) => { state.running = true; state.error = null; })
            .addCase(runSimulation.fulfilled, (state, { payload }) => { state.running = false; state.current = payload; state.items.unshift(payload); })
            .addCase(runSimulation.rejected, (state, { payload }) => { state.running = false; state.error = payload; });
    },
});

export const { clearSimError } = simulationSlice.actions;
export default simulationSlice.reducer;

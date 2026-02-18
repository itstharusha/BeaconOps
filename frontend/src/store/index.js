// FILE: src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import supplierReducer from './supplierSlice';
import shipmentReducer from './shipmentSlice';
import inventoryReducer from './inventorySlice';
import alertReducer from './alertSlice';
import analyticsReducer from './analyticsSlice';
import simulationReducer from './simulationSlice';
import uiReducer from './uiSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        suppliers: supplierReducer,
        shipments: shipmentReducer,
        inventory: inventoryReducer,
        alerts: alertReducer,
        analytics: analyticsReducer,
        simulations: simulationReducer,
        ui: uiReducer,
    },
    devTools: import.meta.env.DEV,
});

export default store;

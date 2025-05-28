// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';
import categoryReducer from './slices/categorySlice';

// export const store = configureStore({
//   reducer: {
//     products: productReducer,
//   },
// });

export const store = configureStore({
  reducer: {
    categories: categoryReducer,
    products: productReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

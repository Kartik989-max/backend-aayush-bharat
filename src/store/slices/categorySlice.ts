import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { databases } from '@/lib/appwrite';

export interface Category {
  $id: string;
  name: string;
  sub_text: string;
  description: string;
  image?: string;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
};

export const fetchCategories = createAsyncThunk('categories/fetch', async () => {
  const res = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
  );
  return res.documents.map((doc) => ({
    $id: doc.$id,
    name: doc.name,
    sub_text: doc.sub_text,
    description: doc.description,
    image: doc.image,
  })) as Category[];
});

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategories(state) {
      state.categories = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.loading = false;
      });
  }
});

export const { clearCategories } = categorySlice.actions;
export default categorySlice.reducer;

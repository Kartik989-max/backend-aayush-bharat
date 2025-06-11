// App configuration
export const config = {
  // Appwrite configuration
  appwriteEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  appwriteDatabaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
  
  // Collections
  appwriteProductsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID || '',
  appwriteCategoriesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID || '',
  appwriteInventoryCollectionId: process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID || '',
  appwriteOrdersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID || '',
  appwriteHeroCollectionId: process.env.NEXT_PUBLIC_APPWRITE_HERO_COLLECTION_ID || '',
  appwriteContactCollectionId: process.env.NEXT_PUBLIC_APPWRITE_CONTACT_COLLECTION_ID || '',
  appwriteCollectionCollectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID || '',
  appwriteCouponsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_COUPONS_COLLECTION_ID || '',
  appwriteBlogCollectionId: process.env.NEXT_PUBLIC_APPWRITE_BLOG_COLLECTION_ID || '',
    // Storage buckets
  appwriteProductBucketId: process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID || '',
  appwriteHeroBucketId: process.env.NEXT_PUBLIC_APPWRITE_HERO_BUCKET_ID || '',
  appwriteCollectionBucketId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BUCKET_ID || '',
  appwriteReelsBucketId: process.env.NEXT_PUBLIC_APPWRITE_REELS_BUCKET_ID || '',
  appwriteBlogBucketId: process.env.NEXT_PUBLIC_APPWRITE_BLOG_BUCKET_ID || '',
  
  // URL
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

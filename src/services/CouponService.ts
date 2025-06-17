import { databases, createDocument, ID } from '@/lib/appwrite';

interface CouponData {
  coupon_code: string;
  min_price: number | string;
  expiry_date: string;
  description?: string;
  coupon_discount: number | string;
  discount_type: 'percentage' | 'flat';
}

export interface Coupon extends CouponData {
  $id: string;
}

class CouponService {
  private databaseId: string;
  private collectionId: string;

  constructor() {
    this.databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    this.collectionId = process.env.NEXT_PUBLIC_APPWRITE_COUPON_COLLECTION_ID || '';
  }

  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId
      );
      return response.documents as unknown as Coupon[];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  async getCouponById(couponId: string): Promise<Coupon> {
    try {
      const response = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        couponId
      );
      return response as unknown as Coupon;
    } catch (error) {
      console.error(`Error fetching coupon with ID ${couponId}:`, error);
      throw error;
    }
  }  async checkCouponCodeExists(couponCode: string, excludeId?: string): Promise<boolean> {
    try {
      console.log(`Checking if coupon code "${couponCode}" exists, excluding ID: ${excludeId || 'none'}`);
      
      // Get all coupons
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId
      );
      
      const coupons = response.documents as unknown as Coupon[];
      console.log(`Found ${coupons.length} total coupons`);
      
      // Check if any match the code (excluding the current one if editing)
      const matchingCoupon = coupons.find(coupon => {
        // If coupon code matches
        const codeMatches = coupon.coupon_code === couponCode;
        
        // If this is the coupon we're currently editing (should be excluded)
        const isExcludedCoupon = excludeId && coupon.$id === excludeId;
        
        if (codeMatches) {
          console.log(`Found matching code on coupon ${coupon.$id}, excluded: ${isExcludedCoupon}`);
        }
        
        // Return true if code matches AND it's not the excluded coupon
        return codeMatches && !isExcludedCoupon;
      });
      
      const exists = !!matchingCoupon;
      console.log(`Coupon code "${couponCode}" exists: ${exists}`);
      return exists;
    } catch (error) {
      console.error('Error checking coupon code:', error);
      throw error;
    }
  }
  async createCoupon(couponData: CouponData): Promise<Coupon> {
    try {
      // Check if coupon code already exists
      const exists = await this.checkCouponCodeExists(couponData.coupon_code);
      if (exists) {
        throw new Error(`Coupon code "${couponData.coupon_code}" already exists`);
      }

      // Process the data
      const processedData = {
        ...couponData,
        min_price: typeof couponData.min_price === 'string' ? parseInt(couponData.min_price) : couponData.min_price,
        coupon_discount: typeof couponData.coupon_discount === 'string' ? parseInt(couponData.coupon_discount) : couponData.coupon_discount,
        expiry_date: new Date(couponData.expiry_date).toISOString(),
      };

      const response = await createDocument(
        this.collectionId,
        processedData
      );
      
      return response as unknown as Coupon;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  }  async updateCoupon(couponId: string, couponData: CouponData): Promise<Coupon> {
    try {
      console.log(`Starting update for coupon ID: ${couponId}`);
      
      // Skip all checks and directly update the document
      console.log('Directly updating document without any duplicate checks');
      
      // Process the data
      const processedData = {
        ...couponData,
        min_price: typeof couponData.min_price === 'string' ? parseInt(couponData.min_price) : couponData.min_price,
        coupon_discount: typeof couponData.coupon_discount === 'string' ? parseInt(couponData.coupon_discount) : couponData.coupon_discount,
        expiry_date: new Date(couponData.expiry_date).toISOString(),
      };

      const response = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        couponId,
        processedData
      );
      
      console.log(`Successfully updated coupon ID: ${couponId}`);
      return response as unknown as Coupon;
    } catch (error) {
      console.error(`Error updating coupon with ID ${couponId}:`, error);
      throw error;
    }
  }

  async deleteCoupon(couponId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        couponId
      );
    } catch (error) {
      console.error(`Error deleting coupon with ID ${couponId}:`, error);
      throw error;
    }
  }

  async renewCoupon(couponId: string, newExpiryDate: string): Promise<Coupon> {
    try {
      const response = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        couponId,
        {
          expiry_date: new Date(newExpiryDate).toISOString()
        }
      );
      
      return response as unknown as Coupon;
    } catch (error) {
      console.error(`Error renewing coupon with ID ${couponId}:`, error);
      throw error;
    }
  }
}

export const couponService = new CouponService();
export default couponService;

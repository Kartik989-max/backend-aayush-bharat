'use client';
import { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import CouponForm from '@/components/coupon/CouponForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { databases } from '@/lib/appwrite';

interface Coupon {
  $id: string;
  coupon_code: string;
  min_price: number;
  expiry_date: string;
  description?: string;
  coupon_discount: number;
  discount_type: 'percentage' | 'flat';
}

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string) => void;
  coupon: Coupon | null;
}

const RenewConfirmationModal = ({ isOpen, onClose, onConfirm, coupon }: RenewModalProps) => {
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    setNewExpiryDate(thirtyDaysFromNow.toISOString().split('T')[0]);
  }, [isOpen]);

  if (!isOpen || !coupon) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Renew Coupon</h2>
        <p className="text-gray-600 mb-6">
          Set a new expiry date for coupon <span className="font-mono font-semibold text-primary">{coupon.coupon_code}</span>
        </p>
        
        <div className="mb-4">
          <label className="block mb-2">New Expiry Date</label>
          <Input
            type="date"
            value={newExpiryDate}
            onChange={(e) => setNewExpiryDate(e.target.value)}
            min={today}
            className="w-full"
            required
          />
        </div>
        
        <div className="flex gap-4">
          <Button 
            onClick={() => onConfirm(newExpiryDate)}
            className="flex-1"
            disabled={!newExpiryDate}
          >
            Renew Coupon
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renewCoupon, setRenewCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COUPON_COLLECTION_ID!
      );
      setCoupons(response.documents as unknown as Coupon[]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleFormSubmit = async () => {
    await fetchCoupons();
    setShowForm(false);
    setSelectedCoupon(null);
  };const handleDelete = async (couponId: string) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COUPON_COLLECTION_ID!,
        couponId
      );
      await fetchCoupons();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };  const handleRenew = async (couponId: string, newExpiryDate: string) => {
    try {
      setLoading(true);
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COUPON_COLLECTION_ID!,
        couponId,
        {
          expiry_date: new Date(newExpiryDate).toISOString()
        }
      );
      await fetchCoupons();
      setRenewCoupon(null);
    } catch (error) {
      console.error('Error renewing coupon:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
        <div className="text-xl font-semibold text-primary animate-pulse">
          Loading Coupons...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Coupons</h1>
     
     

     

{showForm ? (
  <Button
    variant="outline"
    onClick={() => setShowForm(false)}
    className="flex items-center gap-2"
  >
    Back to Coupon List
  </Button>
) : (
  <Button 
    onClick={() => setShowForm(true)}
    className="flex items-center gap-2"
  >
    <Plus className="w-4 h-4" />
    Add Coupon
  </Button>
)}

        

      </div>      {showForm && (
        <div className="mb-6">
          <CouponForm
            onSubmit={handleFormSubmit}
            initialData={selectedCoupon}
            onCancel={() => {
              setShowForm(false);
              setSelectedCoupon(null);
            }}
            isEditing={!!selectedCoupon}
          />
        </div>
      )}



{!showForm ? (<>
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => {
          const isExpired = new Date(coupon.expiry_date) < new Date();
          
          return (
            <div 
              key={coupon.$id}
              className="relative bg-dark-100 rounded-lg overflow-hidden group h-[280px]"
            >
              <div className="relative p-6 border-2 border-dashed border-primary/30 rounded-lg bg-dark-200 h-full flex flex-col">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="flex gap-2 bg-dark-100/90 p-2 rounded-lg">            <Button
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setShowForm(true);
                      }}
                      className="p-1 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setDeleteId(coupon.$id)}
                      className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="relative flex flex-col flex-grow">
                  <div>
                    <span className="text-xs font-semibold text-primary/70">Limited Time Offer</span>
                    <h3 className="text-3xl font-bold text-primary mb-2 font-mono">
                      {coupon.coupon_code}
                    </h3>
                  </div>
                  
                  <div className="flex-grow">
                    <p className="text-2xl font-bold text-light-100">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.coupon_discount}% OFF`
                        : `₹${coupon.coupon_discount} OFF`}
                    </p>
                    <p className="text-sm text-light-100/70">
                      On orders above ₹{coupon.min_price}
                    </p>
                    <div className="mt-2 min-h-[40px]">
                      {coupon.description ? (
                        <p className="text-sm text-light-100/60 line-clamp-2">
                          {coupon.description}
                        </p>
                      ) : (
                        <p className="text-sm text-light-100/40 italic">
                          No description available
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 mt-auto border-t border-dark-100">
                    <p className="text-xs text-light-100/50">
                      Valid until {new Date(coupon.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isExpired && (
                  <div className="absolute inset-0 bg-dark-300/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                    <span className="text-red-500 font-bold transform rotate-[-15deg] border-2 border-red-500/70 px-4 py-1 rounded-lg mb-6 bg-dark-300/60">
                      EXPIRED
                    </span>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setRenewCoupon(coupon)}
                        className="bg-white hover:bg-gray-100 text-gray-900"
                      >
                        Renew
                      </Button>
                      <Button
                        onClick={() => setDeleteId(coupon.$id)}
                        className="bg-dark-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {coupons.length === 0 && (
        <div className="text-center py-12 bg-dark-100 rounded-lg">
          <p className="text-light-100/70">No coupons found. Create your first coupon!</p>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-100 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-light-100 mb-4">Confirm Delete</h2>
            <p className="text-light-100/70 mb-6">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => deleteId && handleDelete(deleteId)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </Button>
              <Button
                onClick={() => setDeleteId(null)}
                className="flex-1 " variant='secondary'
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

</>):(<></>)}

   


      <RenewConfirmationModal
        isOpen={renewCoupon !== null}
        onClose={() => setRenewCoupon(null)}
        onConfirm={(newDate) => renewCoupon && handleRenew(renewCoupon.$id, newDate)}
        coupon={renewCoupon}
      />
      </div>
    </div>
  );
};

export default CouponsPage;
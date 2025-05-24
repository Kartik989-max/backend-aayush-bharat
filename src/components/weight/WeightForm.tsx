'use client';
import { useState } from 'react';
import { createDocument } from '@/lib/appwrite';

interface WeightFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel: () => void;
}

const WeightForm = ({ onSubmit, initialData, onCancel }: WeightFormProps) => {
  const [formData, setFormData] = useState({
    weight: initialData?.weight || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const processedData = {
        weight: parseInt(formData.weight, 10),
      };

      if (isNaN(processedData.weight)) {
        throw new Error('Please enter a valid number for weight');
      }

      await createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_WEIGHT_COLLECTION_ID!,
        processedData
      );
      onSubmit(processedData);
    } catch (error: any) {
      console.error('Form submission failed:', error);
      setError(error?.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-dark-100 p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div>
        <label className="block mb-2 text-light-100">Weight (in grams)</label>
        <input
          type="number"
          value={formData.weight}
          onChange={(e) => setFormData({...formData, weight: e.target.value})}
          className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
          required
        />
      </div>

      <div className="flex gap-4">
        <button 
          type="submit" 
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default WeightForm;

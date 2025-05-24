'use client';
import React, { useState, useEffect } from 'react';
import { databases, NetworkError as NetworkErrorType } from '@/lib/appwrite';
import { Pencil, Trash2 } from 'lucide-react';
import WeightForm from './WeightForm';
import NetworkError from '@/components/NetworkError';

interface Weight {
  $id: string;
  weight: number;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-100 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-light-100 mb-4">Confirm Delete</h2>
        <p className="text-light-100/70 mb-6">Are you sure you want to delete this weight? This action cannot be undone.</p>
        <div className="flex gap-4">
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Delete
          </button>
          <button 
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Weight = () => {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<Weight | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    fetchWeights();
  }, []);

  const fetchWeights = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_WEIGHT_COLLECTION_ID!
      );
      setWeights(response.documents as unknown as Weight[]);
    } catch (error) {
      console.error('Error fetching weights:', error);
      if (error instanceof NetworkErrorType) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    await fetchWeights();
    setShowForm(false);
    setSelectedWeight(null);
  };

  const handleEdit = (weight: Weight) => {
    setSelectedWeight(weight);
    setShowForm(true);
  };

  const handleDelete = async (weightId: string) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_WEIGHT_COLLECTION_ID!,
        weightId
      );
      await fetchWeights();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting weight:', error);
    }
  };

  if (networkError) {
    return <NetworkError onRetry={fetchWeights} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
        <div className="text-xl font-semibold text-primary animate-pulse">
          Loading Weights...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-light-100">Weights</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Add Weight
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <WeightForm
            onSubmit={handleFormSubmit}
            initialData={selectedWeight}
            onCancel={() => {
              setShowForm(false);
              setSelectedWeight(null);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weights.map((weight) => (
          <div key={weight.$id} className="bg-dark-100 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{weight.weight}g</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(weight)}
                  className="p-1 text-blue-500 hover:text-blue-700"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(weight.$id)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmationModal 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
};

export default Weight;
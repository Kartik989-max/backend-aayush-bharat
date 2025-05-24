'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import HeroForm from './HeroForm';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
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
        <p className="text-light-100/70 mb-6">Are you sure you want to delete this hero section? This action cannot be undone.</p>
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

const Hero = () => {
  const [heroes, setHeroes] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      setError(null);      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_HERO_COLLECTION_ID!,
      );
      
      setHeroes(response.documents);
    } catch (error: any) {
      console.error('Failed to fetch hero data:', error);
      setError(error?.message || 'Failed to load hero data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      await fetchHeroData(); // Refresh the data after submission
      setEditingId(null);
      setIsAddingNew(false);
    } catch (error: any) {
      setError(error?.message || 'Failed to update hero');
    }
  };

  const handleDelete = async (heroId: string) => {
    try {
      setError(null);
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_HERO_COLLECTION_ID!,
        heroId
      );
      await fetchHeroData();
      setDeleteId(null);
    } catch (error: any) {
      console.error('Failed to delete hero:', error);
      setError(error?.message || 'Failed to delete hero');
    }
  };

  const handleEdit = (hero: any) => {
    const heroFormData = {
      ...hero,
      $id: hero.$id // Ensure $id is included
    };
    setEditingId(hero.$id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
        <div className="text-xl font-semibold text-primary animate-pulse">
          Loading Hero...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Hero Section Manager</h1>
        <Button 
          onClick={() => setIsAddingNew(true)}
          className="btn-primary"
        >
          Add Hero
        </Button>
      </div>

      {isAddingNew && (
        <div className="mb-8">
          <HeroForm 
            onSubmit={handleFormSubmit}
            onCancel={() => setIsAddingNew(false)}
          />
        </div>
      )}

      {editingId && (
        <div className="mb-8">
          <HeroForm 
            onSubmit={handleFormSubmit}
            initialData={heroes.find(hero => hero.$id === editingId)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      <div className="bg-dark-100 rounded-lg shadow overflow-hidden">
        <table className="w-full">          <thead>
            <tr className="border-b border-dark-200">
              <th className="p-3 text-left">Position</th>
              <th className="p-3 text-left">Video Preview</th>
              <th className="p-3 text-left">Mobile Preview</th>
              <th className="p-3 text-left">Link</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {heroes.map((hero) => (              <tr key={hero.$id} className="border-b border-dark-200">
                <td className="p-3 text-center">
                  <span className="inline-block bg-dark-200 text-light-100 rounded-full px-3 py-1 text-sm">
                    {hero.heroHeading || '-'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="relative h-20 w-36 rounded overflow-hidden">
                    {hero.videourl ? (
                      <video
                        src={hero.videourl}
                        className="object-cover"
                        autoPlay
                        muted
                      />
                    ) : (
                      <div className="h-full w-full bg-dark-200 flex items-center justify-center text-light-100/50">
                        No Video
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  </div>
                </td>
                <td className="p-3">
                  <div className="relative h-20 w-12 rounded overflow-hidden">
                    {hero.mobile_image ? (
                      <Image
                        src={hero.mobile_image}
                        alt="Mobile preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-dark-200 flex items-center justify-center text-light-100/50">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-primary">/{hero.slug}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleEdit(hero)}
                      className="p-1 text-blue-500 hover:text-blue-700"
                      title="Edit Hero"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteId(hero.$id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete Hero"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {heroes.length === 0 && (
          <div className="p-6 text-center text-light-100/50">
            No hero sections found. Add one to get started.
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
};

export default Hero;

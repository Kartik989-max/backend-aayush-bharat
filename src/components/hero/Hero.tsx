"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import HeroForm from "./HeroForm";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { HeroService, Hero as HeroType } from "@/services/HeroService";
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-100 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-light-100 mb-4">
          Confirm Delete
        </h2>
        <p className="text-light-100/70 mb-6">
          Are you sure you want to delete this hero section? This action cannot
          be undone.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Delete
          </Button>
          <Button onClick={onClose} className="flex-1" variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  const [heroes, setHeroes] = useState<HeroType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const heroService = new HeroService();

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      setError(null);
      const heroes = await heroService.listHeroes();
      setHeroes(heroes);
    } catch (error: any) {
      console.error("Failed to fetch hero data:", error);
      setError(error?.message || "Failed to load hero data");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: HeroType) => {
    try {
      if (editingId) {
        await heroService.updateHero(editingId, data);
      } else {
        await heroService.createHero(data);
      }
      await fetchHeroData();
      setEditingId(null);
      setIsAddingNew(false);
    } catch (error: any) {
      setError(error?.message || "Failed to save hero");
    }
  };

  const handleDelete = async (heroId: string) => {
    try {
      setError(null);
      await heroService.deleteHero(heroId);
      await fetchHeroData();
      setDeleteId(null);
    } catch (error: any) {
      console.error("Failed to delete hero:", error);
      setError(error?.message || "Failed to delete hero");
    }
  };

  const handleEdit = (hero: HeroType) => {
    setEditingId(hero.$id!);
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

      <div className="flex justify-between items-center my-8">
        <h1 className="text-3xl text-primary font-bold">Hero Section Manager</h1>
        {(isAddingNew || editingId) ? (
          <Button
            onClick={() => {setIsAddingNew(false);setEditingId(null)}}
            className="bg-black text-white px-4 py-2 rounded hover:text-black hover:bg-gray-300"
          >
            Back to Hero
          </Button>
        ) : (
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-black text-white px-4 py-2 rounded hover:text-black hover:bg-gray-300"
          >
            Add Hero
          </Button>
        )}
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
            initialData={heroes.find((hero) => hero.$id === editingId)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {(!isAddingNew && !editingId) && (
        <div className="bg-dark-100 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200">
                <th className="p-3 text-left">Media</th>
                <th className="p-3 text-left">Mobile Image</th>
                <th className="p-3 text-left">Heading</th>
                <th className="p-3 text-left">Sub Text</th>
                <th className="p-3 text-left">Buttons</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {heroes.map((hero) => (
                <tr key={hero.$id} className="border-b border-dark-200">
                  <td className="p-3">
                    <div className="relative h-20 w-36 rounded overflow-hidden">
                      {hero.video ? (
                        <video
                          src={hero.video}
                          className="object-cover"
                          autoPlay
                          muted
                          loop
                        />
                      ) : hero.image ? (
                        <Image
                          src={hero.image}
                          alt="Hero image"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-dark-200 flex items-center justify-center text-light-100/50">
                          No Media
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
                    <span className="text-primary">{hero.heading}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-primary">{hero.sub_text}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">{hero.button1}</span>
                        <span className="text-xs text-gray-500">→</span>
                        <span className="text-xs text-gray-500">{hero.button1_slug}</span>
                      </div>
                      {hero.button2 && (
                        <div className="flex items-center gap-2">
                          <span className="text-primary">{hero.button2}</span>
                          <span className="text-xs text-gray-500">→</span>
                          <span className="text-xs text-gray-500">{hero.button2_slug}</span>
                        </div>
                      )}
                    </div>
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
                        onClick={() => setDeleteId(hero.$id!)}
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
      )}
      <DeleteConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
};

export default Hero;

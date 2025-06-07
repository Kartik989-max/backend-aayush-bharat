"use client";

import { useState, useEffect } from "react";
import { HeroService, Hero as HeroType } from "@/services/HeroService";
import HeroForm from "./HeroForm";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import Image from "next/image";
import { Pencil, Trash2, Loader2, ArrowLeft } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} title="Confirm Delete">
      <div className="space-y-4">
        <p className="text-light-100/70">
          Are you sure you want to delete this hero section? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

const Hero = () => {
  const [heroes, setHeroes] = useState<HeroType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
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
      setSavingId(editingId || 'new');
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
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (heroId: string) => {
    try {
      setError(null);
      setSavingId(heroId);
      await heroService.deleteHero(heroId);
      await fetchHeroData();
      setDeleteId(null);
    } catch (error: any) {
      console.error("Failed to delete hero:", error);
      setError(error?.message || "Failed to delete hero");
    } finally {
      setSavingId(null);
    }
  };

  const handleEdit = (hero: HeroType) => {
    setEditingId(hero.$id!);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xl font-medium text-primary">Loading hero sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Hero Section Manager</h1>
        {(isAddingNew || editingId) ? (
          <Button 
            variant="outline" 
            onClick={() => {setIsAddingNew(false); setEditingId(null)}}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Heroes
          </Button>
        ) : (
          <Button 
            onClick={() => setIsAddingNew(true)} 
            variant="default"
          >
            Add Hero Section
          </Button>
        )}
      </div>

      {isAddingNew && (
        <div className="bg-dark-200/50 rounded-lg border border-border/50 shadow-sm">
          <HeroForm
            onSubmit={handleFormSubmit}
            onCancel={() => setIsAddingNew(false)}
          />
        </div>
      )}

      {editingId && (
        <div className="bg-dark-200/50 rounded-lg border border-border/50 shadow-sm">
          <HeroForm
            onSubmit={handleFormSubmit}
            initialData={heroes.find((hero) => hero.$id === editingId)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {(!isAddingNew && !editingId) && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Desktop Media</TableHead>
                <TableHead>Mobile Media</TableHead>
                <TableHead>Heading</TableHead>
                <TableHead>Sub Text</TableHead>
                <TableHead>Buttons</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heroes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No hero sections found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                heroes.map((hero) => (
                  <TableRow key={hero.$id} className="group">
                    <TableCell>
                      <div className="relative h-20 w-36 rounded-lg overflow-hidden bg-muted">
                        {hero.desktop_view ? (
                          hero.desktop_view.includes('68447dfa00141d2b6986') ? (
                            <video
                              src={hero.desktop_view}
                              className="object-cover h-full w-full"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <Image
                              src={hero.desktop_view}
                              alt={hero.heading}
                              fill
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            No Media
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative h-20 w-12 rounded-lg overflow-hidden bg-muted">
                        {hero.mobile_view ? (
                          hero.mobile_view.includes('68447dfa00141d2b6986') ? (
                            <video
                              src={hero.mobile_view}
                              className="object-cover h-full w-full"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <Image
                              src={hero.mobile_view}
                              alt={`${hero.heading} mobile`}
                              fill
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                            No mobile media
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {hero.heading}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {hero.sub_text}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs font-medium">{hero.button1}</div>
                        {hero.button2 && (
                          <div className="text-xs text-muted-foreground">{hero.button2}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(hero)}
                          disabled={Boolean(savingId)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(hero.$id!)}
                          disabled={Boolean(savingId)}
                          className="h-8 w-8 p-0 hover:text-destructive"
                        >
                          {savingId === hero.$id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
};

export default Hero;

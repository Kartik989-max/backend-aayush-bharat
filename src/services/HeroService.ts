import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";

export interface Hero {
  $id?: string;
  heading: string;
  mobile_image?: string;
  image?: string;
  video?: string;
  button1: string;
  button1_slug: string;
  button2?: string;
  button2_slug?: string;
  sub_text: string;
}

export class HeroService {
  private databaseId: string;
  private collectionId: string;

  constructor() {
    this.databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    this.collectionId = process.env.NEXT_PUBLIC_APPWRITE_HERO_COLLECTION_ID!;
  }

  async createHero(hero: Omit<Hero, '$id'>) {
    try {
      return await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        hero
      );
    } catch (error) {
      console.error('Error creating hero:', error);
      throw error;
    }
  }

  async updateHero(heroId: string, hero: Partial<Hero>) {
    try {
      return await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        heroId,
        hero
      );
    } catch (error) {
      console.error('Error updating hero:', error);
      throw error;
    }
  }

  async deleteHero(heroId: string) {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        heroId
      );
    } catch (error) {
      console.error('Error deleting hero:', error);
      throw error;
    }
  }  async listHeroes(): Promise<Hero[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId
      );
      
      return response.documents.map(doc => ({
        $id: doc.$id,
        heading: doc.heading,
        mobile_image: doc.mobile_image,
        image: doc.image,
        video: doc.video,
        button1: doc.button1,
        button1_slug: doc.button1_slug,
        button2: doc.button2,
        button2_slug: doc.button2_slug,
        sub_text: doc.sub_text
      }));
    } catch (error) {
      console.error('Error listing heroes:', error);
      throw error;
    }
  }
  async getHero(heroId: string): Promise<Hero> {
    try {
      const doc = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        heroId
      );
      
      return {
        $id: doc.$id,
        heading: doc.heading,
        mobile_image: doc.mobile_image,
        image: doc.image,
        video: doc.video,
        button1: doc.button1,
        button1_slug: doc.button1_slug,
        button2: doc.button2,
        button2_slug: doc.button2_slug,
        sub_text: doc.sub_text
      };
    } catch (error) {
      console.error('Error getting hero:', error);
      throw error;
    }
  }
}
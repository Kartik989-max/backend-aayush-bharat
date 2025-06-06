import { Client, Databases, Storage, Permission, Role, ID, Models } from 'appwrite';

// Custom error for network issues
class NetworkError extends Error {
    constructor(message = 'No internet connection') {
        super(message);
        this.name = 'NetworkError';
    }
}

// Check internet connection
const checkInternetConnection = () => {
    if (!navigator.onLine) {
        throw new NetworkError();
    }
};

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);
const storage = new Storage(client);

// Wrap database operations with connection check
const safeDatabaseOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
        checkInternetConnection();
        return await operation();
    } catch (error) {
        if (!navigator.onLine) {
            throw new NetworkError();
        }
        throw error;
    }
};

// Modified helper functions with connection check
const createDocument = async (collectionId: string, data: any) => {
    return safeDatabaseOperation(() => 
        databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            collectionId,
            ID.unique(),
            data,
            [
                Permission.read(Role.any()),
                Permission.write(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]
        )
    );
};

const listDocuments = async (collectionId: string) => {
    return safeDatabaseOperation(() =>
        databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            collectionId
        )
    );
};

const deleteDocument = async (collectionId: string, documentId: string) => {
    return safeDatabaseOperation(() =>
        databases.deleteDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            collectionId,
            documentId
        )
    );
};

// Enhanced upload file function
const uploadFile = async (file: File) => {
    try {
        checkInternetConnection();
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File size exceeds 10MB limit');
        }

        const uploadResult = await storage.createFile(
            process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
            ID.unique(),
            file,
            [Permission.read(Role.any())]
        );
        
        return uploadResult;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

// Enhanced file preview function with error handling and URL sanitization
const getFilePreview = (fileId: string) => {
    if (!fileId) return '';
    
    try {
        const baseUrl = 'https://backend.aayudhbharat.com/v1';
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        
        // Include mode=admin in the URL
        return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&mode=admin`;
    } catch (error) {
        console.error('Error generating file preview URL:', error);
        return '';
    }
};

// Add a function to get direct file view URL as fallback
const getFileView = (fileId: string) => {
    if (!fileId) return '';
    
    try {
        return storage.getFileView(
            process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
            fileId
        ).toString();
    } catch (error) {
        console.error('Error generating file view URL:', error);
        return '';
    }
};

// Add these new helper functions
const deleteFile = async (fileId: string) => {
    return safeDatabaseOperation(() =>
        storage.deleteFile(
            process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
            fileId
        )
    );
};

const getImageUrlForNextJS = (fileId: string) => {
    if (!fileId) return '/images/placeholder.jpg';
    
    try {
        const baseUrl = 'https://backend.aayudhbharat.com/v1';
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        
        // Include mode=admin in the URL
        return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&mode=admin`;
    } catch (error) {
        console.error('Error generating image URL:', error);
        return '/images/placeholder.jpg';
    }
};

export { 
    client, 
    databases, 
    storage, 
    createDocument,
    listDocuments,
    deleteDocument,
    uploadFile,
    getFilePreview, 
    ID,
    NetworkError,
    deleteFile,
    getFileView,
    getImageUrlForNextJS
};

export type { Models }; // Changed to export type

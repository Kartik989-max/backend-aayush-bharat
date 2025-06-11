import { config } from "@/config/config";

const getFilePreview = (fileId?: string | null) => {
    if (!fileId) return '/placeholder.jpg';
    
    try {
        if (!config.appwriteBlogBucketId) {
            console.error('Storage bucket ID is missing');
            return '/placeholder.jpg';
        }

        const bucketId = config.appwriteBlogBucketId;
        const url = `${config.appwriteEndpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${config.appwriteProjectId}&project=${config.appwriteProjectId}&mode=admin`;
        
        console.log('Generated Image URL:', {
            fileId,
            endpoint: config.appwriteEndpoint,
            bucketId,
            projectId: config.appwriteProjectId,
            fullUrl: url
        });
        return url;
    } catch (error) {
        console.error('Error generating file preview URL:', error);
        return '/placeholder.jpg';
    }
};

export default getFilePreview;

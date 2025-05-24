import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
    // First, check file size to determine compression options
    const fileSizeInMB = file.size / 1024 / 1024;
    
    // Progressively stronger compression based on file size
    let maxSizeMB = 0.5; // Default to 500KB max
    let initialQuality = 0.7;
    
    if (fileSizeInMB > 10) {
        // Very large image (> 10MB)
        maxSizeMB = 0.3;
        initialQuality = 0.6;
    } else if (fileSizeInMB > 5) {
        // Large image (5-10MB)
        maxSizeMB = 0.4;
        initialQuality = 0.65;
    }
    
    const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1600,  // Reduced from 1920 to save more space
        useWebWorker: true,
        fileType: file.type,  // Preserve original file type
        initialQuality: initialQuality,
        alwaysKeepResolution: true, // Preserve image quality
        preserveHeaders: true, // Preserve image metadata
        strict: true // Strict mode to ensure quality
    };

    try {
        console.log(`Original file size: ${fileSizeInMB.toFixed(2)}MB, using maxSizeMB: ${maxSizeMB}`);
        
        // First compression pass
        let compressedBlob = await imageCompression(file, options);
        
        // Check if still too large (> 1MB), apply another pass
        if (compressedBlob.size > 1024 * 1024) {
            console.log(`First compression resulted in ${(compressedBlob.size/1024/1024).toFixed(2)}MB, compressing further`);
            
            // Second pass with stronger settings
            const secondOptions = {
                ...options,
                maxSizeMB: 0.25,
                maxWidthOrHeight: 1200,
                initialQuality: 0.5
            };
            
            compressedBlob = await imageCompression(compressedBlob, secondOptions);
        }
        
        // Log final compression result
        console.log(`Final compressed size: ${(compressedBlob.size/1024/1024).toFixed(2)}MB`);
        
        // Convert Blob back to File with original name and type
        return new File([compressedBlob], file.name, {
            type: file.type, // Preserve original file type
            lastModified: new Date().getTime()
        });
    } catch (error) {
        console.error('Error compressing image:', error);
        throw new Error('Failed to compress image');
    }
}

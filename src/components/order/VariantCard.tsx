import { VariantType } from '@/types/variant';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface VariantCardProps {
  variant: VariantType;
}

export function VariantCard({ variant }: VariantCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Construct image URL from variant.image (which is the file ID)
  const getImageUrl = (fileId: string) => {
    if (!fileId) return null;
    
    try {
      const baseUrl = 'https://backend.aayudhbharat.com/v1';
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      
      return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&mode=admin`;
    } catch (error) {
      console.error('Error generating image URL:', error);
      return null;
    }
  };
    // Get the image URL or null if not available
  const imageUrl = variant.image ? getImageUrl(variant.image) : null;
  const hasValidImage = imageUrl && !imageError;
  
  // Log image information for debugging
  if (variant.image && !imageUrl) {
    console.warn('Failed to construct image URL for variant:', variant.$id, 'with image ID:', variant.image);
  }
    return (
    <Card className="overflow-hidden border border-border h-[350px] hover:shadow-md transition-shadow">
      <div className="relative aspect-square h-[50%] w-full bg-muted">
        {hasValidImage ? (
          <Image 
            src={imageUrl!} 
            alt="Product Variant" 
            fill 
            className="object-cover"
            // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-muted">
            <ImageOff className="h-12 w-12 text-muted-foreground opacity-50" />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm text-muted-foreground">Weight:</div>
          <div className="font-semibold">{variant.weight || 'N/A'} {variant.weight ? 'g' : ''}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm text-muted-foreground">Price:</div>
          <div className="font-semibold">
            {variant.sale_price ? (
              <div className="flex items-center gap-2">
                <span className="">₹{variant.sale_price}</span>
                <span className=" text-sm text-primary line-through">₹{variant.price}</span>
              </div>
            ) : variant.price ? (
              <span>₹{variant.price}</span>
            ) : (
              <span>N/A</span>
            )}
          </div>
        </div>
        
        {variant.months > 0 && (
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm text-muted-foreground">Duration:</div>
            <div className="font-semibold">{variant.months} {variant.months === 1 ? 'month' : 'months'}</div>
          </div>
        )}
        
        {/* <div className="flex items-center justify-between">
          <div className="font-medium text-sm text-muted-foreground">Stock:</div>
          <div className={`font-semibold ${variant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {variant.stock > 0 ? `In Stock (${variant.stock})` : 'Out of Stock'}
          </div>
        </div> */}
        
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm text-muted-foreground">Product ID:</div>
          <div className="font-semibold text-xs truncate  max-w-[120px]" title={variant.productId || 'N/A'}>
            {variant.productId || 'N/A'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="font-medium text-sm text-muted-foreground">Variant ID:</div>
          <div className="font-semibold text-xs truncate max-w-[120px]" title={variant.$id || 'N/A'}>
            {variant.$id || 'N/A'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

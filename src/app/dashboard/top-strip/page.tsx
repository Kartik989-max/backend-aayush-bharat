// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { databases, Models, ID } from '@/lib/appwrite';

// interface TopStripDocument extends Models.Document {
//   strip_data: string;
//   is_active: boolean;  // Updated field name
// }

// export default function TopStripPage() {
//   const [stripData, setStripData] = useState('');
//   const [isActive, setIsActive] = useState(false);
//   const [documentId, setDocumentId] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

//   const maxCharacterLimit = 400;
//   const remainingCharacters = maxCharacterLimit - stripData.length;

//   const StripPreview = ({ text, isActive }: { text: string; isActive: boolean }) => {
//     const scrollRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//       if (!isActive || !text || !scrollRef.current) return;

//       const scroll = () => {
//         const container = scrollRef.current;
//         if (!container) return;

//         if (container.scrollLeft >= container.scrollWidth / 2) {
//           container.scrollLeft = 0;
//         } else {
//           container.scrollLeft += 1;
//         }
//       };

//       const intervalId = setInterval(scroll, 30);
//       return () => clearInterval(intervalId);
//     }, [text, isActive]);

//     if (!isActive || !text) return null;

//     return (
//       <div className="bg-gradient-to-r from-spice-900 via-spice-800 to-spice-900 text-white py-2 overflow-hidden rounded-lg">
//         <div 
//           ref={scrollRef}
//           className="whitespace-nowrap overflow-hidden relative"
//           style={{ scrollBehavior: 'smooth' }}
//         >
//           <div className="inline-block px-4">
//             {text}
//           </div>
//           <div className="inline-block px-4">
//             {text}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   useEffect(() => {
//     const fetchStripData = async () => {
//       try {
//         const response = await (databases.listDocuments as (
//           databaseId: string,
//           collectionId: string
//         ) => Promise<{ documents: TopStripDocument[] }>)(
//           process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
//           process.env.NEXT_PUBLIC_APPWRITE_TOP_STRIP_COLLECTION_ID!
//         );
        
//         if (response.documents.length > 0) {
//           const doc = response.documents[0];
//           setStripData(doc.strip_data || '');
//           setIsActive(doc.is_active ?? true);  // Default to true if not set
//           setDocumentId(doc.$id);
//         }
//       } catch (error) {
//         showNotification('error', 'Failed to load strip data');
//       }
//     };

//     fetchStripData();
//   }, []);

//   const showNotification = (type: 'success' | 'error', message: string) => {
//     setNotification({ type, message });
//     setTimeout(() => setNotification(null), 3000);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const data = {
//         strip_data: stripData.trim(),
//         is_active: isActive  // Updated field name
//       };

//       if (documentId) {
//         await (databases.updateDocument as (
//           databaseId: string,
//           collectionId: string,
//           documentId: string,
//           data: any
//         ) => Promise<Models.Document>)(
//           process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
//           process.env.NEXT_PUBLIC_APPWRITE_TOP_STRIP_COLLECTION_ID!,
//           documentId,
//           data
//         );
//       } else {
//         await (databases.createDocument as (
//           databaseId: string,
//           collectionId: string,
//           documentId: string,
//           data: any
//         ) => Promise<Models.Document>)(
//           process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
//           process.env.NEXT_PUBLIC_APPWRITE_TOP_STRIP_COLLECTION_ID!,
//           ID.unique(),
//           data
//         );
//       }

//       showNotification('success', 'Top strip updated successfully');
//     } catch (error: any) {
//       console.error('Error updating strip:', error);
//       showNotification('error', error.message || 'Failed to update strip');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 relative">
//       {notification && (
//         <div 
//           className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
//             notification.type === 'success' 
//               ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' 
//               : 'bg-gradient-to-r from-red-600 to-red-500 text-white'
//           }`}
//         >
//           {notification.message}
//         </div>
//       )}

//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-2xl font-bold text-light-100 mb-6">Top Strip Management</h1>
        
//         <div className="mb-8 bg-dark-100 p-6 rounded-lg">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-lg font-semibold text-light-100">Live Preview</h2>
//             <div className="flex items-center gap-3">
//               <span className={`text-sm ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
//                 {isActive ? 'Strip Active' : 'Strip Disabled'}
//               </span>
//               <button
//                 onClick={() => setIsActive(!isActive)}
//                 className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
//                 style={{
//                   backgroundColor: isActive ? '#10B981' : '#4B5563'
//                 }}
//               >
//                 <span
//                   className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
//                     isActive ? 'translate-x-6' : 'translate-x-1'
//                   }`}
//                 />
//               </button>
//             </div>
//           </div>
//           <div className="bg-dark-200 rounded-lg p-4">
//             <StripPreview text={stripData} isActive={isActive} />
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6 bg-dark-100 p-6 rounded-lg">
//           <div>
//             <div className="flex justify-between items-center mb-2">
//               <label className="text-light-100">News Ticker Text</label>
//               <span className={`text-sm ${
//                 remainingCharacters < 50 ? 'text-red-500' : 'text-light-100/70'
//               }`}>
//                 {remainingCharacters} characters remaining
//               </span>
//             </div>
//             <textarea
//               value={stripData}
//               onChange={(e) => {
//                 if (e.target.value.length <= maxCharacterLimit) {
//                   setStripData(e.target.value);
//                 }
//               }}
//               className="w-full p-3 rounded bg-dark-200 text-light-100 border border-dark-50 min-h-[100px] resize-none"
//               placeholder="Enter text to display in the ticker..."
//               maxLength={maxCharacterLimit}
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-gradient-to-r from-primary to-primary/90 text-dark-200 px-4 py-3 rounded-lg hover:from-primary/90 hover:to-primary disabled:opacity-50 font-medium transition-all duration-300"
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <span className="w-4 h-4 border-2 border-dark-200 border-t-transparent rounded-full animate-spin"></span>
//                 Saving...
//               </span>
//             ) : 'Save Changes'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import React from 'react'

function TopStripPage() {
  return (
    <div>TopStripPage</div>
  )
}

export default TopStripPage
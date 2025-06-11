
/**
 * Utility function to check Appwrite configuration
 * This is useful for debugging Appwrite connection issues
 */
export function checkAppwriteConfig() {
  console.log('Checking Appwrite configuration...');
  
  const config = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
    blogCollectionId: process.env.NEXT_PUBLIC_APPWRITE_BLOG_COLLECTION_ID || '',
  };
  
  const missing = [];
  
  if (!config.endpoint) missing.push({ key: 'NEXT_PUBLIC_APPWRITE_URL', name: 'Appwrite Endpoint' });
  if (!config.projectId) missing.push({ key: 'NEXT_PUBLIC_APPWRITE_PROJECT_ID', name: 'Project ID' });
  if (!config.databaseId) missing.push({ key: 'NEXT_PUBLIC_APPWRITE_DATABASE_ID', name: 'Database ID' });
  if (!config.blogCollectionId) missing.push({ key: 'NEXT_PUBLIC_APPWRITE_BLOG_COLLECTION_ID', name: 'Blog Collection ID' });
  
  const isConfigured = missing.length === 0;
  
  console.log('Appwrite configuration:', {
    ...config,
    isConfigured,
    missing: missing.map(m => m.key)
  });
  
  return { isConfigured, missing, config };
}

// Function to check environment variables on page load
export function checkEnvironmentVariables() {
  if (typeof window === 'undefined') return;
  
  const result = checkAppwriteConfig();
  
  if (!result.isConfigured) {
    console.warn('⚠️ Missing Appwrite configuration:', result.missing.map(m => m.key).join(', '));
    
    // Print helpful information in the console
    console.info(
      '%c✅ Fix Appwrite Configuration',
      'color: white; background: green; font-size: 14px; padding: 5px;',
      '\n\nAdd the following to your .env.local file:\n\n' +
      result.missing.map(m => `${m.key}=YOUR_${m.name.toUpperCase().replace(/\s/g, '_')}`).join('\n')
    );
  } else {
    console.log('✅ Appwrite configuration is complete');
  }
  
  return result;
}

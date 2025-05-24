'use client';
import { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'AAYSH BHARAT',
    siteEmail: '',
    phoneNumber: '',
    whatsapp: '',
    address: '',
    metaDescription: '',
    workingHours: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    googleMaps: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement settings update logic
    console.log('Settings updated:', settings);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              type="text"
              name="siteName"
              value={settings.siteName}
              onChange={handleChange}
              placeholder="Enter your business name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                name="siteEmail"
                value={settings.siteEmail}
                onChange={handleChange}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={settings.phoneNumber}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
            <input
              type="tel"
              name="whatsapp"
              value={settings.whatsapp}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              name="address"
              value={settings.address}
              onChange={handleChange}
              rows={3}
              placeholder="Enter your complete business address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea
              name="metaDescription"
              value={settings.metaDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Enter SEO meta description (150-160 characters recommended)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Working Hours</label>
            <input
              type="text"
              name="workingHours"
              value={settings.workingHours}
              onChange={handleChange}
              placeholder="e.g., Mon-Sat: 9AM-6PM, Sun: Closed"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Social Media & Location</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <input
              type="url"
              name="facebook"
              value={settings.facebook}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
              placeholder="https://facebook.com/your-page"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input
              type="url"
              name="instagram"
              value={settings.instagram}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
              placeholder="https://instagram.com/your-handle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Twitter</label>
            <input
              type="url"
              name="twitter"
              value={settings.twitter}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">YouTube</label>
            <input
              type="url"
              name="youtube"
              value={settings.youtube}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
              placeholder="https://youtube.com/@your-channel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Google Maps Link</label>
            <input
              type="url"
              name="googleMaps"
              value={settings.googleMaps}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-900"
              placeholder="https://maps.google.com/..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default Settings;

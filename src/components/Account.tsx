
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AccountProps {
  session: Session;
}

const Account: React.FC<AccountProps> = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { user } = session;
      
      if (!user) throw new Error('No user');

      setUsername(user.email || '');
      setFullName(user.user_metadata?.full_name || '');

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      
      const updates = {
        data: {
          full_name: fullName,
        },
      };

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      
    } catch (error) {
      alert('Error updating the data!');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="text"
            value={username}
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="text"
            value={fullName || ''}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => updateProfile()}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Update'}
          </button>
        </div>

        <div>
          <button
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Account;

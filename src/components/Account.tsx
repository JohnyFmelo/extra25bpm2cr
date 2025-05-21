
import React from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AccountProps {
  session: Session;
}

const Account: React.FC<AccountProps> = ({ session }) => {
  return (
    <div className="container mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="text"
            value={session.user?.email || ''}
            disabled
          />
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
};

export default Account;

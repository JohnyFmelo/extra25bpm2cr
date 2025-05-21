
import React from 'react';
import { Session } from '@supabase/supabase-js';

interface HomeProps {
  session: Session | null;
}

const Home: React.FC<HomeProps> = ({ session }) => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Home Page</h1>
      <p className="mb-4">Welcome to the TCO application</p>
      {session && (
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="font-medium">You are logged in as: {session.user?.email}</p>
        </div>
      )}
      <div className="mt-8 space-y-4">
        <a href="/tco/new" className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Create New TCO
        </a>
        <a href="/tco/meus" className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          My TCOs
        </a>
      </div>
    </div>
  );
}

export default Home;

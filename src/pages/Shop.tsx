
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Shop() {
  const { profile } = useAuth();

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Our Products</h1>
      {profile && (
        <p className="mb-6">Welcome, {profile.full_name || 'Valued Customer'}!</p>
      )}
      <p className="text-muted-foreground">
        Browse our selection of fresh fish and quality chicken. Products will be displayed here soon.
      </p>
    </div>
  );
}

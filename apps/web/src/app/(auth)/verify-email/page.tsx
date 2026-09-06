'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Verification token is missing.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await apiRequest('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Email verification failed. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-600">Verifying your email address...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-xl font-bold">
          ✓
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-sm text-gray-500 mt-1">Your email has been successfully verified.</p>
        </div>
        <Link
          href="/dashboard"
          className="block w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
        ✕
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
      <Link
        href="/login"
        className="block w-full py-2.5 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
      >
        Back to Sign In
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <Suspense fallback={<div className="text-center p-4 text-sm text-gray-400">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAuthToken } from '../services/api';
import { RefreshCw } from 'lucide-react';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setAuthToken(token);
      window.location.href = '/dashboard/schedules';
    } else {
      const errorMsg = searchParams.get('error') || 'OAuth authentication failed';
      navigate(`/login?error=${encodeURIComponent(errorMsg)}`);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center space-y-4">
      <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
      <h2 className="text-sm font-semibold tracking-wide font-mono">Completing OAuth authentication...</h2>
    </div>
  );
}

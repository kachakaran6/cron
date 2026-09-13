import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const errorMsg = searchParams.get('error');

    if (token) {
      loginWithToken(token)
        .then(() => {
          navigate('/dashboard/schedules', { replace: true });
        })
        .catch((err: any) => {
          navigate(`/login?error=${encodeURIComponent(err?.message || 'Failed to authenticate session')}`, { replace: true });
        });
    } else {
      navigate(`/login?error=${encodeURIComponent(errorMsg || 'OAuth authentication failed')}`, { replace: true });
    }
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center space-y-4">
      <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
      <h2 className="text-sm font-semibold tracking-wide font-mono">Completing OAuth authentication...</h2>
    </div>
  );
}

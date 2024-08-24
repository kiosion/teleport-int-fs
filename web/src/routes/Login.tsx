import React, { useMemo, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { API_URL, LOGIN_REDIRECT_PARAM } from '../lib/constants';
import { setLocalAuthState } from '../lib/utils';

const LoginRoute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const redirectUri = searchParams.get(LOGIN_REDIRECT_PARAM);

  const onFormSubmit = useMemo(
    () => async (e: React.FormEvent) => {
      e.preventDefault();

      if (!username || !password) {
        setError('Username and password are required');
        return;
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      }).catch((e) => {
        console.error(e);
        setError('Failed to log in');
      });

      if (!response) {
        return;
      }

      const data = await response.json().catch((e) => {
        console.error(e);
        setError('Failed to log in');
      });

      if (data?.status !== 'ok') {
        setError(data.error?.detail || 'Failed to log in');
      }

      setLocalAuthState(true);
      setError(undefined);
      navigate(
        redirectUri ? `/browse${decodeURIComponent(redirectUri)}` : '/browse',
      );
    },
    [username, password, redirectUri, navigate],
  );

  return (
    <div className="w-full h-full bg-stone-800 flex flex-row items-center justify-center">
      <div className="w-full max-w-96 h-fit flex flex-col bg-stone-900 rounded-lg px-8 pt-8 pb-6 gap-y-2 m-4">
        <h1 className="font-bold text-3xl text-stone-50">Login</h1>
        <form className="flex flex-col w-full mt-5" onSubmit={onFormSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border text-stone-50 border-stone-700 rounded-md py-2 px-4 bg-stone-950 focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:outline-none mb-4"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border text-stone-50 border-stone-700 rounded-md py-2 px-4 bg-stone-950 focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:outline-none"
          />
          {error && <p className="text-red-500 mt-6 mb-2">{error}</p>}
          <button
            type="submit"
            className="bg-lime-400 hover:bg-lime-300 rounded-md py-1.5 px-4 my-4">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginRoute;

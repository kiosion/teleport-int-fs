import React, { useCallback, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthProvider';
import { API_ENDPOINTS, API_ERRORS, API_URL } from '../lib/constants';
import { constructBrowseRedirectUrl } from '../lib/utils';

import type { APIResponse, UserSession } from '../types';

const LoginRoute = () => {
  const { sessionError, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const redirectURL = constructBrowseRedirectUrl({
    url: new URL(location.pathname + location.search, window.location.origin),
  });

  const onFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!username || !password) {
        setError('Username and password are required');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/${API_ENDPOINTS.LOGIN}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = (await response.json()) as APIResponse<UserSession>;

        if (data?.status !== 'ok') {
          if (data.error?.detail === API_ERRORS.INVALID_CREDENTIALS) {
            setError('Invalid username or password');
            return;
          }

          setError(data.error?.detail || 'Failed to log in');
          return;
        }

        login({
          username: data.data.username,
          expires: data.data.expires,
        });
        setError(undefined);
        navigate(redirectURL, { replace: true });
      } catch (e) {
        console.error('Failed to log in', e);
        setError('Failed to log in');
        return;
      }
    },
    [username, password, navigate, redirectURL],
  );

  return (
    <div
      className="m-4 flex h-fit w-full max-w-96 flex-col gap-y-2 rounded-lg bg-zinc-800 px-8 pb-6 pt-8"
      style={{
        animation: 'fadeIn 1s ease',
      }}
    >
      <h1 className="text-3xl font-bold text-zinc-50">Login</h1>
      <form
        className="mt-5 flex w-full flex-col"
        onSubmit={onFormSubmit}
        role="form"
      >
        <input
          type="text"
          placeholder="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="focus-ring mb-4 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-50"
          role="textbox"
        />
        <input
          type="password"
          placeholder="Password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-ring rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-50"
          role="textbox"
        />
        {(error || sessionError.current) && (
          <p className="mb-2 mt-6 text-red-400">
            {error ||
              sessionError.current?.detail ||
              sessionError.current?.title}
          </p>
        )}
        <button
          type="submit"
          className="focus-ring mb-4 mt-5 rounded-md bg-lime-400 px-4 py-1.5 transition-colors duration-500 hover:bg-lime-300 focus-visible:bg-lime-300"
          role="button"
        >
          Log In
        </button>
      </form>
    </div>
  );
};

export default LoginRoute;

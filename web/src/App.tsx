import React, { useEffect, useState } from 'react';

import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from 'react-router-dom';

import { LOGIN_REDIRECT_PARAM } from './lib/constants';
import {
  fetchFiles,
  getLocalAuthState,
  setLocalAuthState,
  validateAuth,
} from './lib/utils';
import BrowseRoute from './routes/Browse';
import LoginRoute from './routes/Login';

const App = () => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const syncAuth = async () => {
    const state = await validateAuth();

    setAuthenticated(state);
    setLoading(false);
  };

  useEffect(() => {
    syncAuth();
  }, []);

  useEffect(() => {
    setLocalAuthState(!!authenticated);
  }, [authenticated]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <RouterProvider
      router={createBrowserRouter([
        {
          path: '/',
          loader: async () => {
            throw redirect(getLocalAuthState() ? '/browse' : '/login');
          },
        },
        {
          path: '/login',
          loader: async () => {
            if (getLocalAuthState()) {
              throw redirect('/browse');
            }

            return {};
          },
          element: <LoginRoute />,
        },
        {
          path: 'browse?/*',
          loader: async ({ params }) => {
            const path = params['*'];

            if (!getLocalAuthState()) {
              throw redirect(
                path?.length
                  ? `/login?${LOGIN_REDIRECT_PARAM}=/${encodeURIComponent(path)}`
                  : '/login',
              );
            }

            return await fetchFiles(path || '');
          },
          element: <BrowseRoute />,
        },
      ])}
    />
  );
};

export default App;

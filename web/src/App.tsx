import React from 'react';

import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from 'react-router-dom';

import { ArrowPathIcon } from '@heroicons/react/20/solid';

import { useAuth } from './context/AuthProvider';
import {
  constructBrowseRedirectUrl,
  constructLoginRedirectUrl,
} from './lib/utils';
import BrowseRoute from './routes/Browse';
import LoginRoute from './routes/Login';

const App = () => {
  const { loading, isAuthed } = useAuth();

  if (loading) {
    return (
      <Wrapper>
        <div
          className="flex h-fit w-fit flex-row items-center justify-center gap-x-2 rounded-lg bg-zinc-800 px-14 py-10 text-zinc-50"
          style={{ animation: 'fadeOut 1000ms ease' }}
        >
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Loading
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <RouterProvider
        router={createBrowserRouter([
          {
            path: '/',
            loader: async () => {
              throw redirect(isAuthed() ? '/browse' : '/login');
            },
          },
          {
            path: '/login',
            loader: async ({ request }) => {
              if (!isAuthed()) {
                return null;
              }

              const redirectURL = constructBrowseRedirectUrl({
                url: new URL(request.url),
              });

              throw redirect(redirectURL);
            },
            element: <LoginRoute />,
          },
          {
            path: 'browse?/*',
            loader: async ({ request, params }) => {
              if (isAuthed()) {
                return null;
              }

              const redirectURL = constructLoginRedirectUrl({
                path: params['*'] || '',
                searchParams: new URL(request.url).searchParams,
              });

              throw redirect(redirectURL.toString());
            },
            element: <BrowseRoute />,
          },
        ])}
      />
    </Wrapper>
  );
};

const Wrapper = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center bg-zinc-700">
    {children}
  </div>
);

export default App;

import React from 'react';

import { useNavigate } from 'react-router-dom';

import { API_URL } from '../lib/constants';
import { setLocalAuthState } from '../lib/utils';
import Breadcrumbs from './Breadcrumbs';

const Navbar = ({ path }: { path: string }) => {
  const navigate = useNavigate();

  const logout = async () => {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      setLocalAuthState(false);
      navigate('/login');
    } else {
      const data = await response.json();
      console.error(
        'Failed to log out: ',
        data?.error?.detail || 'Unknown error',
      );
    }
  };

  return (
    <div className="w-full bg-zinc-900 rounded-xl py-3 px-4 flex flex-row items-center justify-between text-zinc-50">
      <div className="flex flex-row justify-start items-center gap-x-5 bg-zinc-800/50 rounded-full pl-2 pr-6 py-2">
        <HistoryButtons />
        <Breadcrumbs path={path} />
      </div>
      <div>
        <button
          className="bg-lime-400 hover:bg-lime-300 rounded-md py-1.5 px-4 text-zinc-950 text-sm"
          onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
};

const HistoryButtons = () => {
  const goBack = () => {
      window.history.back();
    },
    goForward = () => {
      window.history.forward();
    };

  return (
    <div className="flex flex-row justify-start items-center font-black text-xl bg-zinc-700/50 rounded-full">
      <button
        onClick={goBack}
        className="hover:bg-zinc-700 px-3 py-0.5 rounded-tl-full rounded-bl-full">
        &lt;
      </button>
      <button
        onClick={goForward}
        className="hover:bg-zinc-700 px-3 py-0.5 rounded-tr-full rounded-br-full">
        &gt;
      </button>
    </div>
  );
};

export default Navbar;

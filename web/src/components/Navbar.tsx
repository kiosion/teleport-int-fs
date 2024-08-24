import React from 'react';

import Breadcrumbs from './Breadcrumbs';
import LogoutButton from './NavBar/LogoutButton';
import SearchBar from './NavBar/SearchBar';

import type { APIError } from '../types';

const Navbar = ({ path, error }: { path: string; error?: APIError }) => {
  return (
    <div className="flex w-full flex-col flex-wrap justify-center gap-x-8 gap-y-4 rounded-xl bg-zinc-900 px-4 py-3 text-zinc-50 md:flex-row md:items-center md:justify-between">
      <div className="w-fit max-w-full rounded-full bg-zinc-800/50 py-2 pl-5 pr-6">
        <Breadcrumbs path={path} error={error} />
      </div>
      <div className="flex flex-grow items-center justify-end gap-x-4">
        <SearchBar />
        <LogoutButton />
      </div>
    </div>
  );
};

export default Navbar;

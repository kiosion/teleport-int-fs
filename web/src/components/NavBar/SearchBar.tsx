import React, { useEffect, useRef } from 'react';

import { useSearchParams } from 'react-router-dom';

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

import { SEARCH_PARAMS } from '../../lib/constants';

const SearchInput = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetFilter(e.target.value);
  };

  const debouncedSetFilter = (term: string) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      const params: Record<string, string> = {};

      if (term.trim()) {
        params[SEARCH_PARAMS.FILTER] = term.trim();
      }
      if (searchParams.get(SEARCH_PARAMS.SORT)) {
        params[SEARCH_PARAMS.SORT] = searchParams.get(SEARCH_PARAMS.SORT)!;
      }

      setSearchParams(params, { replace: true });
    }, 300);
  };

  useEffect(() => {
    inputRef.current &&
      (inputRef.current.value = searchParams.get(SEARCH_PARAMS.FILTER) || '');
    // only run on mount
  }, []);

  return (
    <div className="focus-ring relative h-fit flex-1 rounded-full bg-zinc-800/50 py-2 pl-11 pr-3 ring-offset-2 ring-offset-zinc-900 focus-within:ring-2 focus-within:ring-lime-300 lg:flex-none">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search"
        className="w-full bg-transparent text-sm text-zinc-50 focus:outline-none"
        onChange={handleChange}
        role="searchbox"
      />
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transform">
        <MagnifyingGlassIcon className="mt-px h-4 w-4 text-zinc-50" />
      </div>
    </div>
  );
};

export default SearchInput;

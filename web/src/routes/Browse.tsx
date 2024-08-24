import React, { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import FileList from '../components/FileList';
import Navbar from '../components/Navbar';
import { SEARCH_PARAMS, SORT_ORDERS, SORT_TYPES } from '../lib/constants';
import { useFetchFiles } from '../lib/hooks';
import { sortFiles } from '../lib/utils';

import type { SortOrder, SortType } from '../types';

const BrowseRoute = () => {
  const [searchParams] = useSearchParams();
  const { data, loading, currentPath } = useFetchFiles();
  const [debouncedLoading, setDebouncedLoading] = useState(loading);

  const sort = getSortState(searchParams);
  const filterTerm = getFilterState(searchParams);

  const items = useMemo(() => {
    const contents = data?.data?.contents ?? [];
    const filtered = filterTerm
      ? contents.filter((item) => item.name.toLowerCase().includes(filterTerm))
      : contents;
    const sorted = sort ? sortFiles(filtered, sort) : filtered;
    return sorted;
  }, [data?.data?.contents, filterTerm, sort]);

  // delay 'loading' so we don't show a spinner for very short requests
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedLoading(loading);
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [loading]);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-start gap-y-3 px-4 py-4 lg:px-12 lg:py-8"
      style={{ animation: 'fadeIn 1000ms ease' }}
    >
      <Navbar path={currentPath} error={data?.error} />
      <FileList
        items={items}
        sort={sort}
        path={currentPath}
        loading={debouncedLoading}
        error={data?.error}
      />
    </div>
  );
};

const getFilterState = (searchParams: URLSearchParams) => {
  const filterParam = searchParams.get(SEARCH_PARAMS.FILTER);
  if (!filterParam || !filterParam.trim()?.length) {
    return undefined;
  }

  const filter = filterParam.trim().toLowerCase();
  return filter;
};

const getSortState = (searchParams: URLSearchParams) => {
  const sortParam = searchParams.get(SEARCH_PARAMS.SORT);
  if (!sortParam) {
    return undefined;
  }

  const [type, dir] = sortParam.split(':') as [SortType, SortOrder];
  if (
    !Object.values(SORT_TYPES).includes(type as SORT_TYPES) ||
    !Object.values(SORT_ORDERS).includes(dir as SORT_ORDERS)
  ) {
    return undefined;
  }

  return { type, dir };
};

export default BrowseRoute;

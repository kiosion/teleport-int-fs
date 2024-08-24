import React from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/20/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { SEARCH_PARAMS, SORT_ORDERS } from '../lib/constants';
import File from './File';

import type { APIError, FileOrDir, SortOrder, SortType } from '../types';

const FileList = ({
  loading,
  items,
  path,
  sort,
  error,
}: {
  loading: boolean;
  items: FileOrDir[];
  path: string;
  sort?: {
    type: SortType;
    dir: SortOrder;
  };
  error?: APIError;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const setSort = (sort: { type: SortType; dir: SortOrder }) => {
    const params: Record<string, string> = {
      [SEARCH_PARAMS.SORT]: `${sort.type}:${sort.dir}`,
    };
    const filter = searchParams.get(SEARCH_PARAMS.FILTER);
    filter?.trim() && (params[SEARCH_PARAMS.FILTER] = filter);
    setSearchParams(params, { replace: true });
  };

  const isFiltered = searchParams.has(SEARCH_PARAMS.FILTER);

  return (
    <div className="relative h-full w-full overflow-y-scroll rounded-xl bg-zinc-900">
      <div className="fixed left-8 right-8 mt-5 flex flex-row gap-x-2 rounded-full bg-zinc-800/50 px-6 py-3 text-sm text-zinc-50 backdrop-blur-lg lg:left-16 lg:right-16">
        <div className="w-1/2 flex-shrink-0 text-left">
          <ColHeader type="name" sort={sort} setSort={setSort}>
            Name
          </ColHeader>
        </div>
        <div className="hidden w-1/4 text-left lg:block">
          <ColHeader type="modified" sort={sort} setSort={setSort}>
            Modified
          </ColHeader>
        </div>
        <div className="w-1/3 text-left lg:w-1/4">
          <ColHeader type="type" sort={sort} setSort={setSort}>
            Type
          </ColHeader>
        </div>
        <div className="w-1/3 text-left lg:w-1/4">
          <ColHeader type="size" sort={sort} setSort={setSort}>
            Size
          </ColHeader>
        </div>
      </div>
      <div className="mb-6 mt-20 w-full">
        <ListContents
          items={items}
          path={path}
          loading={loading}
          error={error}
          isFiltered={isFiltered}
        />
      </div>
    </div>
  );
};

const ListContents = ({
  items,
  path,
  loading,
  error,
  isFiltered,
}: {
  items: FileOrDir[];
  path: string;
  loading: boolean;
  isFiltered: boolean;
  error?: APIError;
}) => {
  if (loading) {
    return (
      <EmptyState>
        <ArrowPathIcon className="h-5 w-5 animate-spin" />
        Loading
      </EmptyState>
    );
  }

  if (error || !items.length) {
    const msg =
      error?.detail ||
      error?.title ||
      (isFiltered ? 'no results' : 'no contents');

    return (
      <EmptyState>
        <ExclamationTriangleIcon className="h-5 w-5" />
        {msg.charAt(0).toUpperCase() + msg.slice(1)}
      </EmptyState>
    );
  }

  return (
    <ul
      className="flex w-full flex-col"
      role="list"
      style={{ animation: 'fadeIn 500ms ease' }}
    >
      {items.map((item) => (
        <File key={item.name} item={item} path={path} />
      ))}
    </ul>
  );
};

const EmptyState = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="flex h-full w-full flex-row items-center justify-center gap-x-3 pt-8 text-zinc-50"
      style={{ animation: 'fadeIn 500ms ease' }}
    >
      {children}
    </div>
  );
};

const ColHeader = ({
  children,
  type,
  sort,
  setSort,
}: {
  children: React.ReactNode;
  type: SortType;
  setSort: (sort: { type: SortType; dir: SortOrder }) => void;
  sort?: {
    type: SortType;
    dir: SortOrder;
  };
}) => {
  const active = sort?.type === type;
  const direction =
    sort?.dir === SORT_ORDERS.ASCENDING
      ? SORT_ORDERS.ASCENDING
      : SORT_ORDERS.DESCENDING;

  return (
    <button
      onClick={() => {
        setSort({
          type,
          dir: active
            ? direction === SORT_ORDERS.ASCENDING
              ? SORT_ORDERS.DESCENDING
              : SORT_ORDERS.ASCENDING
            : direction,
        });
      }}
      className={`focus-ring -my-1 -ml-4 -mr-3 flex flex-row items-center gap-x-1 rounded-full py-1 pl-4 pr-3 transition-colors duration-75 ease-out hover:text-zinc-50 focus-visible:text-zinc-50 ${active ? 'bg-zinc-700/50 text-zinc-50' : 'text-zinc-300 hover:bg-zinc-700/25 focus-visible:bg-zinc-700/25'}`}
      role="button"
      data-active={active}
      data-direction={direction}
    >
      {children}
      {active ? (
        direction === SORT_ORDERS.ASCENDING ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )
      ) : (
        <ChevronUpDownIcon className="h-4 w-4" />
      )}
    </button>
  );
};

export default FileList;

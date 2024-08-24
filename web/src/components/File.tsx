import React from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';

import {
  bytesToHumanReadable,
  dateToHumanReadable,
  readableFiletype,
} from '../lib/utils';

import type { FileOrDir } from '../types';

const FileInner = ({ item }: { item: FileOrDir }) => {
  return (
    <>
      <div
        className="flex w-1/2 flex-shrink-0 flex-row items-center justify-start gap-x-4 text-left"
        title={item.name}
      >
        {item.type === 'file' ? (
          <DocumentIcon className="hidden h-5 w-5 flex-shrink-0 md:block" />
        ) : (
          <FolderIcon className="hidden h-5 w-5 flex-shrink-0 md:block" />
        )}
        <span className="line-clamp-2 block w-full overflow-ellipsis break-normal">
          {item.name}
        </span>
      </div>
      <div className="hidden w-1/4 text-left lg:block">
        {dateToHumanReadable(item.modified)}
      </div>
      <div className="w-1/3 text-left lg:w-1/4">
        {item.type === 'file' ? readableFiletype(item.name) : 'Folder'}
      </div>
      <div className="w-1/3 text-left lg:w-1/4">
        {item.type === 'file' ? bytesToHumanReadable(item.size) : '-'}
      </div>
    </>
  );
};

const File = ({ item, path }: { item: FileOrDir; path: string }) => {
  const [searchParams] = useSearchParams();

  if (item.type === 'file') {
    return (
      <li
        className="mx-4 flex flex-row items-center justify-start gap-x-2 rounded-lg px-6 py-4 text-sm text-zinc-300 transition-colors duration-75 ease-out hover:bg-zinc-800 hover:text-zinc-50 focus-visible:bg-zinc-800 focus-visible:text-zinc-50"
        role="listitem"
      >
        <FileInner item={item} />
      </li>
    );
  }

  const slug = path === '/' ? `/${item.name}` : `${path}/${item.name}`;
  const searchParamsStr = searchParams.toString();

  return (
    <li role="listitem">
      <Link
        className="mx-4 flex flex-row items-center justify-start gap-x-2 rounded-lg px-6 py-4 text-sm text-zinc-200 ring-lime-300 transition-colors duration-100 hover:bg-zinc-800 hover:text-zinc-50 focus:outline-none focus-visible:bg-zinc-800 focus-visible:text-zinc-50 focus-visible:ring-2"
        to={`/browse${slug}${searchParamsStr?.length ? `?${searchParamsStr}` : ''}`}
      >
        <FileInner item={item} />
      </Link>
    </li>
  );
};

export default File;

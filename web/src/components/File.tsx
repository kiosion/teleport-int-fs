import React from 'react';

import { Link } from 'react-router-dom';

import type { FileOrDir } from '../types';

const bytesToHumanReadable = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  if (bytes === 0) {
    return '0 B';
  }

  const i = Math.floor(Math.log2(bytes) / 10);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const File = ({ item, path }: { item: FileOrDir; path: string }) => {
  if (item.type === 'file') {
    return (
      <li className="flex flex-row gap-x-2 text-zinc-200 hover:text-zinc-50 rounded-lg mx-4 px-6 py-4 text-sm hover:bg-zinc-800">
        <div className="w-1/3 text-left">{item.name}</div>
        <div className="w-1/3 text-left">{item.type}</div>
        <div className="w-1/3 text-left">{bytesToHumanReadable(item.size)}</div>
      </li>
    );
  }

  return (
    <li className="text-zinc-200 hover:text-zinc-50 rounded-lg mx-4 text-sm hover:bg-zinc-800">
      <Link
        className="flex flex-row gap-x-2 py-4 px-6"
        to={`/browse${path}/${item.name}`}>
        <div className="w-1/3 text-left">{item.name}</div>
        <div className="w-1/3 text-left">{item.type}</div>
        <div className="w-1/3 text-left">{item.size} items</div>
      </Link>
    </li>
  );
};

export default File;

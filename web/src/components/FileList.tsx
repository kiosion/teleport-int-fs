import React from 'react';

import File from './File';

import type { FileOrDir } from '../types';

const FileList = ({ items, path }: { items: FileOrDir[]; path: string }) => {
  return (
    <div className="w-full h-full overflow-y-scroll rounded-xl bg-zinc-900">
      {/* col headers */}
      <div className="flex flex-row gap-x-2 text-zinc-50 bg-zinc-800/50 rounded-full mx-4 mt-5 px-6 py-3 text-sm">
        <div className="w-1/3 text-left">Name</div>
        <div className="w-1/3 text-left">Type</div>
        <div className="w-1/3 text-left">Size</div>
      </div>
      {items ? (
        <ul className="w-full flex flex-col mt-2">
          {items.map((item, idx) => (
            <File key={idx} item={item} path={path} />
          ))}
        </ul>
      ) : (
        <p className="text-zinc-50 text-center">No contents</p>
      )}
    </div>
  );
};
export default FileList;

import React, { useMemo } from 'react';

import { useLoaderData, useParams } from 'react-router-dom';

import FileList from '../components/FileList';
import Navbar from '../components/Navbar';

import type { FileOrDir } from '../types';

const BrowseRoute = () => {
  const params = useParams();

  const loaderData = useLoaderData() as {
    data?: FileOrDir;
    error?: {
      title: string;
      detail: string;
    };
  };

  const currentPath = useMemo(() => {
    let path = params['*'] || '';

    if (!path.startsWith('/')) {
      path = `/${path}`;
    }

    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    return path;
  }, [params]);

  return (
    <div className="w-full h-full bg-zinc-700 flex flex-col items-center justify-center">
      <div className="w-full h-full flex flex-col items-center justify-start py-4 lg:py-8 px-4 lg:px-12 gap-y-3">
        <Navbar path={currentPath} />
        {loaderData.error?.detail && <p>Error: {loaderData.error.detail}</p>}
        <FileList items={loaderData?.data?.contents ?? []} path={currentPath} />
      </div>
    </div>
  );
};

export default BrowseRoute;

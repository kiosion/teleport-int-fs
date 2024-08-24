import React from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { ChevronRightIcon } from '@heroicons/react/20/solid';

import { API_ERRORS } from '../lib/constants';

import type { APIError } from '../types';

const Breadcrumbs = ({ path, error }: { path: string; error?: APIError }) => {
  const parts = path.split('/').filter((part) => part.length);
  const [searchParams] = useSearchParams();
  const searchParamsStr = searchParams.toString();

  const validPath = error?.detail !== API_ERRORS.DIR_NOT_FOUND;

  return (
    <nav className="text-base text-zinc-200">
      <ul
        className="flex flex-row flex-wrap items-center justify-start gap-x-1 gap-y-1"
        aria-label="breadcrumbs"
      >
        <LinkSegment
          active={parts.length === 0}
          part="Home"
          to={`/browse${searchParamsStr?.length ? `?${searchParamsStr}` : ''}`}
        />
        {validPath &&
          parts.map((part, idx) => (
            <React.Fragment key={idx}>
              <span className="flex flex-row gap-x-1">
                {idx < parts.length && (
                  <li className="select-none">
                    <ChevronRightIcon className="mb-px inline-block h-5 w-5" />
                  </li>
                )}
                <LinkSegment
                  key={idx}
                  active={idx === parts.length - 1}
                  part={part}
                  to={`/browse/${parts.slice(0, idx + 1).join('/')}${searchParamsStr?.length ? `?${searchParamsStr}` : ''}`}
                />
              </span>
            </React.Fragment>
          ))}
      </ul>
    </nav>
  );
};

const LinkSegment = ({
  part,
  to,
  active,
}: {
  part: string;
  to: string;
  active: boolean;
}) => {
  if (active) {
    return (
      <li className="rounded-sm text-zinc-50 underline decoration-lime-300 decoration-2 underline-offset-4">
        <span className="h-full cursor-default py-1">{part}</span>
      </li>
    );
  }

  return (
    <li className="rounded-sm decoration-zinc-300 decoration-2 underline-offset-4 hover:text-zinc-50 hover:underline focus-visible:text-zinc-50 focus-visible:underline">
      <Link to={to} className="h-full py-1">
        {part}
      </Link>
    </li>
  );
};

export default Breadcrumbs;

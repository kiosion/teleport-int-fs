import React from 'react';

import { Link } from 'react-router-dom';

const Breadcrumbs = ({ path }: { path: string }) => {
  const parts = path.split('/').filter((part) => part.length);
  // const active = parts.pop() ?? 'Home';

  return (
    <nav>
      <ul className="flex gap-x-2">
        <li className="hover:text-lime-300">
          <Link to="/browse">Home</Link>
        </li>
        {parts.length > 0 && <li className="font-bold select-none">&gt;</li>}
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            <li key={idx} className="hover:text-lime-300">
              <Link to={`/browse/${parts.slice(0, idx + 1).join('/')}`}>
                {part}
              </Link>
            </li>
            {idx < parts.length - 1 && <li>&gt;</li>}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;

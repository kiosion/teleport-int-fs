import React, { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/20/solid';

import { useAuth } from '../../context/AuthProvider';
import { API_ENDPOINTS, API_URL } from '../../lib/constants';

const PADDING_X = 24;
const ICON_PADDING = 8;

const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [buttonWidth, setButtonWidth] = useState('auto');
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const textWidth = textRef.current.offsetWidth;
      if (isHovered) {
        setButtonWidth(`${textWidth + PADDING_X * 2 + ICON_PADDING}px`);
      } else {
        setButtonWidth(`${PADDING_X * 2}px`);
      }
    }
  }, [textRef.current, isHovered]);

  const onClick = async () => {
    const response = await fetch(`${API_URL}/${API_ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to log out: ', response.statusText);
      return;
    }

    logout();
    navigate('/login');
  };

  return (
    <button
      className="focus-ring flex flex-row items-center justify-start rounded-xl bg-lime-400 px-3.5 py-2.5 text-sm text-zinc-950 transition-all duration-500 ease-in-out hover:bg-lime-300 focus-visible:bg-lime-300 focus-visible:ring-2"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onFocus={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onBlur={() => setIsHovered(false)}
      title="Logout"
      style={{ width: buttonWidth }}
    >
      <ArrowLeftStartOnRectangleIcon className="h-4 w-4 flex-shrink-0" />
      <div
        className={`transition-max-width ml-2 block overflow-hidden ${isHovered ? 'max-w-full' : 'max-w-0'}`}
      >
        <span ref={textRef}>Logout</span>
      </div>
    </button>
  );
};

export default LogoutButton;

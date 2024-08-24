import { API_URL } from './constants';

export const getLocalAuthState = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

export const setLocalAuthState = (status: boolean) => {
  localStorage.setItem('isAuthenticated', status ? 'true' : 'false');
};

export const validateAuth = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/validate`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (e) {
    console.error('Failed to check authentication', e);
    return false;
  }
};

export const fetchFiles = async (path: string) => {
  const response = await fetch(
      `${API_URL}/files?path=${encodeURIComponent(path || '')}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ).catch((e) => {
      console.error('Failed to fetch files', e);
    }),
    json = await response?.json();

  if (json?.status === 'ok') {
    return { error: undefined, data: json.data };
  }

  if (json?.status === 'error') {
    return {
      error: json.error,
      data: {},
    };
  }

  return {
    error: 'Unknown error',
    data: {},
  };
};

import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthProvider';
import { API_ENDPOINTS, API_ERRORS, API_URL } from './constants';
import { constructLoginRedirectUrl } from './utils';

import type { APIResponse, FileOrDir } from '../types';

export const useFetchFiles = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { sessionError, isAuthed } = useAuth();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<
    Omit<APIResponse<FileOrDir>, 'status'> | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState<string | undefined>();

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

  const fetchFiles = async (
    path: string,
    signal: AbortSignal,
  ): Promise<Omit<APIResponse<FileOrDir>, 'status'>> => {
    try {
      const response = await fetch(`${API_URL}/${API_ENDPOINTS.FILES}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
        }),
        signal,
      });

      const json = (await response.json().catch((e) => {
        return {
          status: 'error',
          error: {
            title: 'Failed to serialize response',
            detail: e?.message ?? 'An unknown error occurred',
          },
        };
      })) as APIResponse<FileOrDir>;

      if (json.status !== 'ok') {
        if (signal.aborted) {
          return { error: undefined, data: undefined };
        }

        console.error('Failed to fetch files', json.error);

        return {
          error: json.error,
          data: undefined,
        };
      }

      return { error: undefined, data: json.data };
    } catch (e) {
      if (signal.aborted) {
        return { error: undefined, data: undefined };
      }

      console.error('Failed to fetch files', e);

      return {
        error: {
          title: 'Unknown error',
          detail: 'An unknown error occurred',
        },
        data: undefined,
      };
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchFilesData = async () => {
      if ((currentPath === prevPath && data?.data) || !isAuthed()) {
        loading && setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetchFiles(currentPath, signal);

        if (signal.aborted) {
          return;
        }

        if (
          response.error?.detail === API_ERRORS.AUTH_REQUIRED ||
          response.error?.detail === API_ERRORS.SESSION_EXPIRED
        ) {
          if (response.error?.detail === API_ERRORS.SESSION_EXPIRED) {
            sessionError.current = {
              title: 'Failed to fetch files',
              detail: 'Session expired',
            };
          }

          return navigate(
            constructLoginRedirectUrl({
              path: currentPath,
              searchParams,
            }),
          );
        }

        setData({ data: response.data, error: undefined });
        setPrevPath(currentPath);
      } catch (error) {
        if (signal.aborted) {
          return;
        }

        console.error('Failed to fetch files', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilesData();

    return () => {
      controller.abort();
    };
  }, [currentPath, prevPath, isAuthed, searchParams, navigate]);

  return { data, loading, currentPath };
};

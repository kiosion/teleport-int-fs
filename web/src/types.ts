import { API_ERRORS } from './lib/constants';

export type APIResponse<T> =
  | {
      status: 'ok';
      data: T;
      error: undefined;
    }
  | {
      status: 'error';
      data: undefined;
      error: APIError;
    };

export type APIError = {
  title: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  detail?: (typeof API_ERRORS)[keyof typeof API_ERRORS] | (string & {});
};

export type UserSession = {
  username: string;
  expires: number;
};

export type FileOrDir = {
  name: string;
  type: 'file' | 'dir';
  size: number; // Bytes
  modified: string; // Date string
  contents?: FileOrDir[];
};

export type SortType = 'name' | 'modified' | 'type' | 'size';

export type SortOrder = 'asc' | 'desc';

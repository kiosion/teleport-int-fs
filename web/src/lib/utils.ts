import {
  LOGIN_REDIRECT_PATH_PARAM,
  LOGIN_REDIRECT_SEARCH_PARAM,
  SORT_ORDERS,
  SORT_TYPES,
} from './constants';

import type { FileOrDir, SortOrder, SortType } from '../types';

export const constructLoginRedirectUrl = ({
  path,
  searchParams,
}: {
  path: string;
  searchParams?: URL['searchParams'];
}) => {
  const redirectURL = new URL('/login', window.location.origin);

  if (path.length) {
    redirectURL.searchParams.set(LOGIN_REDIRECT_PATH_PARAM, path);
  }
  if (searchParams) {
    const stringified = searchParams.toString();

    if (stringified.length) {
      redirectURL.searchParams.set(LOGIN_REDIRECT_SEARCH_PARAM, stringified);
    }
  }

  return `${redirectURL.pathname}${redirectURL.search}`;
};

export const constructBrowseRedirectUrl = ({ url }: { url: URL }) => {
  let targetUrl = '/browse';
  const redirectPath = url.searchParams.get(LOGIN_REDIRECT_PATH_PARAM);
  const redirectSearchParams = url.searchParams.get(
    LOGIN_REDIRECT_SEARCH_PARAM,
  );

  if (redirectPath) {
    targetUrl += `/${redirectPath}`;
  }
  if (redirectSearchParams) {
    targetUrl += `?${redirectSearchParams}`;
  }

  return targetUrl;
};

export const sortFiles = (
  items: FileOrDir[],
  sort: { type: SortType; dir: SortOrder },
) => {
  return [...items].sort((a, b) => {
    switch (sort.type) {
      case SORT_TYPES.NAME:
        return sort.dir === SORT_ORDERS.ASCENDING
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case SORT_TYPES.MODIFIED:
        return sort.dir === SORT_ORDERS.ASCENDING
          ? a.modified.localeCompare(b.modified)
          : b.modified.localeCompare(a.modified);
      case SORT_TYPES.TYPE:
        return sort.dir === SORT_ORDERS.ASCENDING
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      case SORT_TYPES.SIZE:
        // dirs should always be last since their 'size' is not defined
        if (a.type === 'dir' && b.type === 'dir') {
          return 0;
        } else if (a.type === 'dir') {
          return 1;
        } else if (b.type === 'dir') {
          return -1;
        } else {
          return sort.dir === SORT_ORDERS.ASCENDING
            ? a.size - b.size
            : b.size - a.size;
        }
    }

    return 0;
  });
};

export const bytesToHumanReadable = (bytes: number) => {
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];

  if (bytes === 0) {
    return '0 B';
  }

  const i = Math.floor(Math.log2(bytes) / 10);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const dateToHumanReadable = (date: string) => {
  const d = new Date(date),
    now = new Date(),
    diff = now.getTime() - d.getTime(),
    oneMinute = 1000 * 60,
    oneHour = oneMinute * 60,
    oneDay = oneHour * 24,
    oneWeek = oneDay * 7;

  if (diff < oneMinute) {
    return 'Just now';
  } else if (diff < oneHour) {
    return Math.floor(diff / oneMinute) > 1
      ? `${Math.floor(diff / oneMinute)} minutes ago`
      : '1 minute ago';
  } else if (diff < oneDay) {
    return Math.floor(diff / oneHour) > 1
      ? `${Math.floor(diff / oneHour)} hours ago`
      : '1 hour ago';
  } else if (diff < oneWeek) {
    return Math.floor(diff / oneDay) > 1
      ? `${Math.floor(diff / oneDay)} days ago`
      : '1 day ago';
  }

  return d.toLocaleDateString();
};

export const readableFiletype = (filename: string) => {
  const ext = filename.split('.').pop();
  let type = 'File';

  if (!ext) {
    return type;
  }

  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      type = 'JPEG Image';
      break;
    case 'png':
      type = 'PNG Image';
      break;
    case 'gif':
      type = 'GIF Image';
      break;
    case 'webp':
      type = 'WebP Image';
      break;
    case 'mp4':
      type = 'MP4 Video';
      break;
    case 'webm':
      type = 'WebM Video';
      break;
    case 'pdf':
      type = 'PDF Document';
      break;
    case 'doc':
    case 'docx':
      type = 'Word Document';
      break;
    case 'xls':
    case 'xlsx':
      type = 'Excel Document';
      break;
    case 'ppt':
    case 'pptx':
      type = 'PowerPoint Document';
      break;
    case 'txt':
      type = 'Text Document';
      break;
    case 'md':
      type = 'Markdown Document';
      break;
    case 'zip':
      type = 'ZIP Archive';
      break;
    case 'rar':
      type = 'RAR Archive';
      break;
    case '7z':
      type = '7z Archive';
      break;
    case 'tar':
      type = 'TAR Archive';
      break;
    case 'mp3':
      type = 'MP3 Audio';
      break;
    case 'flac':
      type = 'FLAC Audio';
      break;
    case 'wav':
      type = 'WAV Audio';
      break;
    case 'm4a':
      type = 'M4A Audio';
      break;
    case 'mkv':
      type = 'Matroska Video';
      break;
    case 'mov':
      type = 'MOV Video';
      break;
    case 'mpg':
    case 'mpeg':
      type = 'MPEG Video';
      break;
  }

  return type;
};

import type { FileOrDir } from '../src/types';
import type { Route } from '@playwright/test';

export const TEST_USER = {
  username: 'user',
  password: 'password123',
};

const MOCK_ROOT_DIR_CONTENTS = [
  {
    name: 'file1.txt',
    type: 'file',
    modified: new Date().toISOString(),
    size: 1024,
  },
  {
    name: 'file2.png',
    type: 'file',
    modified: new Date().toISOString(),
    size: 2048,
  },
  {
    name: 'dir2',
    type: 'dir',
    modified: new Date().toISOString(),
    size: 0,
  },
] satisfies FileOrDir[];

const MOCK_ROOT_DIR = {
  name: 'files',
  type: 'dir',
  modified: new Date().toISOString(),
  size: 0,
  contents: MOCK_ROOT_DIR_CONTENTS,
} satisfies FileOrDir;

const MOCK_DIR_2_CONTENTS = [
  {
    name: 'file3.txt',
    type: 'file',
    modified: new Date().toISOString(),
    size: 4096,
  },
] satisfies FileOrDir[];

const MOCK_DIR_2 = {
  name: 'dir2',
  type: 'dir',
  modified: new Date().toISOString(),
  size: 0,
  contents: MOCK_DIR_2_CONTENTS,
} satisfies FileOrDir;

export const mockFilesEndpoint = async (route: Route) => {
  const body = JSON.parse(route.request().postData() as string);

  switch (body.path) {
    case '':
    case '/':
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          data: MOCK_ROOT_DIR,
        }),
      });
      break;
    case '/dir2':
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          data: MOCK_DIR_2,
        }),
      });
      break;
  }
};

import { expect, test } from '@playwright/test';

import {
  LOGIN_REDIRECT_PATH_PARAM,
  LOGIN_REDIRECT_SEARCH_PARAM,
  SEARCH_PARAMS,
  SORT_ORDERS,
  SORT_TYPES,
} from '../src/lib/constants';
import { TEST_USER } from './utils';

test('can login and logout', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="username"]', TEST_USER.username);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  await page.waitForURL('/browse');

  const logoutButton = await page.waitForSelector('button:has-text("Logout")');
  await logoutButton.click();

  await page.waitForURL('/login');
});

test('redirects to login with persisted params', async ({ page }) => {
  await page.goto('/browse/test-dir');
  await page.waitForURL(`/login?${LOGIN_REDIRECT_PATH_PARAM}=test-dir`);
});

test('redirects to browse with persisted params', async ({ page }) => {
  await page.goto(
    `/login?${LOGIN_REDIRECT_PATH_PARAM}=test-dir&${LOGIN_REDIRECT_SEARCH_PARAM}=${encodeURIComponent(`${SEARCH_PARAMS.SORT}=${SORT_TYPES.NAME}:${SORT_ORDERS.ASCENDING}`)}`,
  );

  await page.fill('input[name="username"]', TEST_USER.username);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  const nameSortBtn = await page.waitForSelector('button:has-text("Name")');
  expect(await nameSortBtn.getAttribute('data-active')).toBe('true');
  expect(await nameSortBtn.getAttribute('data-direction')).toBe(
    SORT_ORDERS.ASCENDING,
  );
});

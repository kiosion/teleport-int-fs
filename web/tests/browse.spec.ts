import { expect, test } from '@playwright/test';

import { SEARCH_PARAMS, SORT_ORDERS, SORT_TYPES } from '../src/lib/constants';
import { mockFilesEndpoint, TEST_USER } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="username"]', TEST_USER.username);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // don't rely on contents from the server's files dir
  await page.route('**/api/v1/files', mockFilesEndpoint);

  await page.waitForURL('/browse');
  expect(await page.isVisible('p:has-text("No content")')).toBe(false);
});

test('can traverse directories', async ({ page }) => {
  const fileList = await page.waitForSelector('ul[role="list"]');

  expect(await fileList.isVisible()).toBe(true);

  const firstFile = await fileList.waitForSelector('a');
  const firstFileHref = await firstFile.getAttribute('href');

  expect(firstFileHref).toBeDefined();

  await firstFile.click();
  // URL should match the href of the first file
  await page.waitForURL(firstFileHref!);

  // Click 'Home' breadcrumb
  await page.click('a:has-text("Home")');
  await page.waitForURL('/browse');
});

test('can sort files', async ({ page }) => {
  const nameBtn = await page.waitForSelector('button:has-text("Name")');
  const modBtn = await page.waitForSelector('button:has-text("Modified")');
  const typeBtn = await page.waitForSelector('button:has-text("Type")');
  const sizeBtn = await page.waitForSelector('button:has-text("Size")');

  // Since asc/desc is toggled only when the same button is clicked twice,
  // this order looks weird but is what's expected.
  for (const { btn, type, dir } of [
    { btn: nameBtn, type: SORT_TYPES.NAME, dir: SORT_ORDERS.DESCENDING },
    { btn: nameBtn, type: SORT_TYPES.NAME, dir: SORT_ORDERS.ASCENDING },
    { btn: modBtn, type: SORT_TYPES.MODIFIED, dir: SORT_ORDERS.ASCENDING },
    { btn: modBtn, type: SORT_TYPES.MODIFIED, dir: SORT_ORDERS.DESCENDING },
    { btn: typeBtn, type: SORT_TYPES.TYPE, dir: SORT_ORDERS.DESCENDING },
    { btn: typeBtn, type: SORT_TYPES.TYPE, dir: SORT_ORDERS.ASCENDING },
    { btn: sizeBtn, type: SORT_TYPES.SIZE, dir: SORT_ORDERS.ASCENDING },
    { btn: sizeBtn, type: SORT_TYPES.SIZE, dir: SORT_ORDERS.DESCENDING },
  ]) {
    await btn.click();
    expect(await btn.getAttribute('data-active')).toBe('true');
    expect(await btn.getAttribute('data-direction')).toBe(dir);
    expect(page.url()).toContain(
      `${SEARCH_PARAMS.SORT}=${encodeURIComponent(type + ':' + dir)}`,
    );
  }
});

test('can filter files', async ({ page }) => {
  const fileList = await page.waitForSelector('ul[role="list"]');

  const listItems = await fileList.$$('li');

  const firstFileOrDir = listItems[0];
  const name = await firstFileOrDir.$eval('div', (el) => el.textContent);
  expect(name).toBeTruthy();

  await page.fill('input[placeholder="Search"]', name!);
  await page.waitForURL(
    `/browse?${SEARCH_PARAMS.FILTER}=${encodeURIComponent(name!)}`,
  );

  const filteredListItems = await fileList.$$('li');
  expect(filteredListItems.length).toBeLessThan(listItems.length);
});

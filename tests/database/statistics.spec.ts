import { press } from '@inline/__tests__/utils.js';
import { type Page, expect } from '@playwright/test';

import { type } from '../utils/actions/index.js';
import {
  enterPlaygroundRoom,
  getAddRow,
  initEmptyDatabaseState,
  waitNextFrame,
} from '../utils/actions/misc.js';
import { test } from '../utils/playwright.js';
import { moveToCenterOf } from './actions.js';

const addRow = async (page: Page, count: number = 1) => {
  await waitNextFrame(page);
  const addRow = getAddRow(page);
  for (let i = 0; i < count; i++) {
    await addRow.click();
  }
  await press(page, 'Escape');
  await waitNextFrame(page);
};
const pressKey = async (page: Page, key: string, count: number = 1) => {
  for (let i = 0; i < count; i++) {
    await waitNextFrame(page);
    await press(page, key);
  }
  await waitNextFrame(page);
};
const insertRightColumn = async (page: Page, index = 0) => {
  await waitNextFrame(page);
  await page.locator('affine-database-header-column').nth(index).click();
  await pressKey(page, 'ArrowDown', 3);
  await pressKey(page, 'Enter');
  await pressKey(page, 'Escape');
};
const changeColumnType = async (page: Page, column: number, name: string) => {
  await waitNextFrame(page);
  await page.locator('affine-database-header-column').nth(column).click();
  await pressKey(page, 'ArrowDown', 2);
  await pressKey(page, 'Enter');
  await type(page, name);
  await pressKey(page, 'ArrowDown');
  await pressKey(page, 'Enter');
};
const menuSelect = async (
  page: Page,
  selectors: Array<string | [string, number]>
) => {
  await waitNextFrame(page);
  for (const data of selectors) {
    const name = typeof data === 'string' ? data : data[0];
    const index = typeof data === 'string' ? 0 : data[1];
    await type(page, name);
    await pressKey(page, 'ArrowDown', index + 1);
    await pressKey(page, 'Enter');
  }
};
test.describe('title', () => {
  test('empty count', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);
    await addRow(page, 3);
    const statCell = page.locator('affine-database-column-stats-cell').nth(0);
    await moveToCenterOf(page, statCell);
    await statCell.click();
    await menuSelect(page, ['count', 'empty']);
    const value = statCell.locator('.value');
    expect((await value.textContent())?.trim()).toBe('3');
    await page.locator('affine-database-cell-container').nth(0).click();
    await pressKey(page, 'Enter');
    await type(page, 'asd');
    await pressKey(page, 'Escape');
    expect((await value.textContent())?.trim()).toBe('2');
  });
});

test.describe('rich-text', () => {
  test('empty count', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);
    await addRow(page, 3);
    await insertRightColumn(page);
    await changeColumnType(page, 1, 'text');
    const statCell = page.locator('affine-database-column-stats-cell').nth(1);
    await moveToCenterOf(page, statCell);
    await statCell.click();
    await menuSelect(page, ['count', 'empty']);
    const value = statCell.locator('.value');
    expect((await value.textContent())?.trim()).toBe('3');
    await page.locator('affine-database-cell-container').nth(1).click();
    await pressKey(page, 'Enter');
    await type(page, 'asd');
    await pressKey(page, 'Escape');
    expect((await value.textContent())?.trim()).toBe('2');
  });
});

test.describe('select', () => {
  test('empty count', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);
    await addRow(page, 3);
    await insertRightColumn(page);
    await changeColumnType(page, 1, 'select');
    const statCell = page.locator('affine-database-column-stats-cell').nth(1);
    await moveToCenterOf(page, statCell);
    await statCell.click();
    await menuSelect(page, ['count', 'empty']);
    const value = statCell.locator('.value');
    expect((await value.textContent())?.trim()).toBe('3');
    await page.locator('affine-database-cell-container').nth(1).click();
    await pressKey(page, 'Enter');
    await type(page, 'select');
    await pressKey(page, 'Enter');
    expect((await value.textContent())?.trim()).toBe('2');
  });
});
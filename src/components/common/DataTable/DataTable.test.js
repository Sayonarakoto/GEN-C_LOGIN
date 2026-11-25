/**
 * @file DataTable.test.js
 * @description Unit tests for DataTable sorting and pagination algorithms.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function resolveValue(obj, accessor) {
  if (!obj) return '';
  if (typeof accessor === 'function') return accessor(obj);
  if (typeof accessor !== 'string') return '';
  if (!accessor.includes('.')) return obj[accessor];
  return accessor.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function sortRecords(data, key, direction) {
  if (!key || !direction) return data;
  const modifier = direction === 'asc' ? 1 : -1;

  return [...data].sort((a, b) => {
    const aVal = resolveValue(a, key);
    const bVal = resolveValue(b, key);

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * modifier;
    }

    const aDate = Date.parse(aVal);
    const bDate = Date.parse(bVal);
    if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
      return (aDate - bDate) * modifier;
    }

    return String(aVal).localeCompare(String(bVal)) * modifier;
  });
}

describe('DataTable Logic', () => {
  const sampleData = [
    { _id: '1', reason: 'Bus breakdown', faculty: { fullName: 'Dr. Smith' }, date: '2026-11-20' },
    { _id: '2', reason: 'Medical appointment', faculty: { fullName: 'Prof. Adams' }, date: '2026-11-22' },
    { _id: '3', reason: 'Train delay', faculty: { fullName: 'Dr. Clark' }, date: '2026-11-21' },
  ];

  it('correctly resolves nested property paths', () => {
    assert.equal(resolveValue(sampleData[0], 'faculty.fullName'), 'Dr. Smith');
    assert.equal(resolveValue(sampleData[1], 'faculty.fullName'), 'Prof. Adams');
    assert.equal(resolveValue(sampleData[0], 'reason'), 'Bus breakdown');
  });

  it('sorts data ascending and descending by nested field', () => {
    const asc = sortRecords(sampleData, 'faculty.fullName', 'asc');
    assert.equal(asc[0].faculty.fullName, 'Dr. Clark');
    assert.equal(asc[1].faculty.fullName, 'Dr. Smith');
    assert.equal(asc[2].faculty.fullName, 'Prof. Adams');

    const desc = sortRecords(sampleData, 'faculty.fullName', 'desc');
    assert.equal(desc[0].faculty.fullName, 'Prof. Adams');
    assert.equal(desc[1].faculty.fullName, 'Dr. Smith');
    assert.equal(desc[2].faculty.fullName, 'Dr. Clark');
  });

  it('sorts data chronologically by date', () => {
    const ascDate = sortRecords(sampleData, 'date', 'asc');
    assert.equal(ascDate[0]._id, '1'); // 2026-11-20
    assert.equal(ascDate[1]._id, '3'); // 2026-11-21
    assert.equal(ascDate[2]._id, '2'); // 2026-11-22
  });

  it('slices data correctly for pagination', () => {
    const pageSize = 2;
    const page1 = sampleData.slice(0, pageSize);
    const page2 = sampleData.slice(pageSize, pageSize * 2);

    assert.equal(page1.length, 2);
    assert.equal(page2.length, 1);
    assert.equal(page1[0]._id, '1');
    assert.equal(page2[0]._id, '3');
  });
});

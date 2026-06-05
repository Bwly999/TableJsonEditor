import { describe, expect, it } from 'vitest';
import { flattenJSON } from './jsonHelper';
import { buildJsonExportData, getExcelExportRows } from './exportHelper';

describe('export helpers', () => {
  it('builds JSON exports from the full edited row set so all changes are preserved', () => {
    const originalJson = {
      items: [
        { id: 1, status: 'draft', owner: 'Ada' },
        { id: 2, status: 'draft', owner: 'Grace' },
      ],
    };

    const { rows } = flattenJSON(originalJson);
    const editedRows = rows.map((row, index) => ({
      ...row,
      status: `published-${index + 1}`,
      owner: index === 0 ? 'Lin' : row.owner,
    }));

    const exported = buildJsonExportData(originalJson, editedRows);

    expect(exported).toEqual({
      items: [
        { id: 1, status: 'published-1', owner: 'Lin' },
        { id: 2, status: 'published-2', owner: 'Grace' },
      ],
    });
  });

  it('does not mutate the original JSON source when building exports', () => {
    const originalJson = {
      items: [
        { id: 1, status: 'draft' },
        { id: 2, status: 'draft' },
      ],
    };

    const snapshot = JSON.parse(JSON.stringify(originalJson));
    const { rows } = flattenJSON(originalJson);
    const editedRows = rows.map((row, index) => ({
      ...row,
      status: `published-${index + 1}`,
    }));

    buildJsonExportData(originalJson, editedRows);

    expect(originalJson).toEqual(snapshot);
  });

  it('always returns the full row set for Excel exports', () => {
    const originalJson = {
      items: [
        { id: 1, status: 'draft' },
        { id: 2, status: 'published' },
      ],
    };

    const { rows } = flattenJSON(originalJson);
    const editedRows = rows.map((row, index) => ({
      ...row,
      status: index === 0 ? 'review' : 'approved',
    }));

    expect(getExcelExportRows(editedRows)).toBe(editedRows);
  });
});

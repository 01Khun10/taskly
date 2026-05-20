/**
 * Unit tests for the task service layer.
 * The database is mocked - these tests run without Postgres.
 */
const { validateTitle, listTasks, createTask, deleteTask } = require('../../src/taskService');

// Tiny mock DB client - replays a queue of canned responses
function mockDb(responses = []) {
  const calls = [];
  return {
    calls,
    query: jest.fn(async (sql, params) => {
      calls.push({ sql, params });
      if (responses.length === 0) {
        throw new Error('No more mock responses queued');
      }
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    }),
  };
}

describe('validateTitle', () => {
  test('accepts a normal title', () => {
    expect(validateTitle('Write report')).toBeNull();
  });

  test('rejects empty / whitespace-only', () => {
    expect(validateTitle('')).toMatch(/empty/i);
    expect(validateTitle('   ')).toMatch(/empty/i);
  });

  test('rejects non-string input', () => {
    expect(validateTitle(undefined)).toMatch(/string/i);
    expect(validateTitle(42)).toMatch(/string/i);
  });

  test('rejects titles longer than 255 chars', () => {
    expect(validateTitle('x'.repeat(256))).toMatch(/255/);
  });
});

describe('listTasks', () => {
  test('returns rows from the DB ordered query', async () => {
    const rows = [
      { id: 2, title: 'B', completed: false, created_at: '2026-05-15' },
      { id: 1, title: 'A', completed: false, created_at: '2026-05-14' },
    ];
    const db = mockDb([{ rows }]);
    const result = await listTasks(db);
    expect(result).toEqual(rows);
    expect(db.calls[0].sql).toMatch(/ORDER BY id DESC/);
  });
});

describe('createTask', () => {
  test('inserts a task and returns the created row', async () => {
    const created = { id: 5, title: 'Buy milk', completed: false, created_at: '2026-05-15' };
    const db = mockDb([{ rows: [created] }]);
    const result = await createTask(db, '  Buy milk  ');
    expect(result).toEqual(created);
    // The trimmed title should be passed to the SQL
    expect(db.calls[0].params).toEqual(['Buy milk']);
  });

  test('throws a 400 for an empty title and does not hit the DB', async () => {
    const db = mockDb([]);
    await expect(createTask(db, '')).rejects.toMatchObject({ status: 400 });
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('deleteTask', () => {
  test('returns the deleted id when a row is removed', async () => {
    const db = mockDb([{ rowCount: 1, rows: [{ id: 7 }] }]);
    const result = await deleteTask(db, '7');
    expect(result).toEqual({ id: 7 });
  });

  test('throws 404 when the task does not exist', async () => {
    const db = mockDb([{ rowCount: 0, rows: [] }]);
    await expect(deleteTask(db, '999')).rejects.toMatchObject({ status: 404 });
  });

  test('throws 400 for a non-numeric id', async () => {
    const db = mockDb([]);
    await expect(deleteTask(db, 'abc')).rejects.toMatchObject({ status: 400 });
  });
});

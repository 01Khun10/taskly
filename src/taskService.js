/**
 * Task service - business logic separated from Express routing
 * so it can be unit tested with a mock database client.
 */

function validateTitle(title) {
  if (typeof title !== 'string') return 'Title must be a string';
  const trimmed = title.trim();
  if (trimmed.length === 0) return 'Title cannot be empty';
  if (trimmed.length > 255) return 'Title cannot exceed 255 characters';
  return null;
}

async function listTasks(db) {
  const result = await db.query(
    'SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC'
  );
  return result.rows;
}

async function createTask(db, title) {
  const err = validateTitle(title);
  if (err) {
    const e = new Error(err);
    e.status = 400;
    throw e;
  }
  const result = await db.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, completed, created_at',
    [title.trim()]
  );
  return result.rows[0];
}

async function deleteTask(db, id) {
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    const e = new Error('Invalid task id');
    e.status = 400;
    throw e;
  }
  const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [numericId]);
  if (result.rowCount === 0) {
    const e = new Error('Task not found');
    e.status = 404;
    throw e;
  }
  return { id: numericId };
}

module.exports = { validateTitle, listTasks, createTask, deleteTask };

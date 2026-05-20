const express = require('express');
const path = require('path');
const { pool } = require('./db');
const { listTasks, createTask, deleteTask } = require('./taskService');

function buildApp(db = pool) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check (used by Jenkins to confirm deployment)
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // List tasks
  app.get('/api/tasks', async (req, res, next) => {
    try {
      const tasks = await listTasks(db);
      res.json(tasks);
    } catch (err) { next(err); }
  });

  // Create task
  app.post('/api/tasks', async (req, res, next) => {
    try {
      const task = await createTask(db, req.body && req.body.title);
      res.status(201).json(task);
    } catch (err) { next(err); }
  });

  // Delete task
  app.delete('/api/tasks/:id', async (req, res, next) => {
    try {
      await deleteTask(db, req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  });

  return app;
}

module.exports = { buildApp };

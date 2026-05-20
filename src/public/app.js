const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const emptyMsg = document.getElementById('empty-msg');

async function loadTasks() {
  const res = await fetch('/api/tasks');
  const tasks = await res.json();
  list.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.innerHTML = `
      <span class="title">${escapeHtml(t.title)}</span>
      <button class="delete-btn" data-id="${t.id}">Delete</button>
    `;
    list.appendChild(li);
  });
  emptyMsg.hidden = tasks.length > 0;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  input.value = '';
  loadTasks();
});

list.addEventListener('click', async (e) => {
  if (!e.target.matches('.delete-btn')) return;
  const id = e.target.dataset.id;
  await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  loadTasks();
});

loadTasks();

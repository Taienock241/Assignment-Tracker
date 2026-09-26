const defaultAssignments = [
  { id: 1, name: 'Read chapter 4 & take notes', course: 'Computer Architecture and Organization', due: '2026-09-28', priority: 'medium', completed: false },
  { id: 2, name: 'Problem set 06', course: 'Calculus II', due: '2026-09-29', priority: 'high', completed: false },
  { id: 3, name: 'Draft thesis statement', course: 'Literature', due: '2026-10-01', priority: 'low', completed: false },
  { id: 4, name: 'Lab report: enzyme activity', course: 'Microbiology', due: '2026-09-25', priority: 'high', completed: true }
];

let assignments = JSON.parse(localStorage.getItem('studyboard-assignments')) || defaultAssignments;
let currentFilter = 'all';
const today = new Date();
const dateKey = (date) => date.toISOString().slice(0, 10);
const todayKey = dateKey(today);

const elements = {
  list: document.querySelector('#assignmentList'),
  dialog: document.querySelector('#assignmentDialog'),
  form: document.querySelector('#assignmentForm'),
  name: document.querySelector('#assignmentName'),
  course: document.querySelector('#assignmentCourse'),
  due: document.querySelector('#assignmentDue'),
  priority: document.querySelector('#assignmentPriority')
};

document.querySelector('#todayLabel').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
elements.due.value = dateKey(new Date(today.getTime() + 86400000));

function save() { localStorage.setItem('studyboard-assignments', JSON.stringify(assignments)); }
function formatDue(date) {
  const due = new Date(`${date}T12:00:00`);
  if (date === todayKey) return 'Due today';
  if (date === dateKey(new Date(today.getTime() + 86400000))) return 'Due tomorrow';
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
function shownAssignments() {
  return assignments.filter((item) => {
    if (currentFilter === 'completed') return item.completed;
    if (currentFilter === 'today') return item.due === todayKey && !item.completed;
    if (currentFilter === 'upcoming') return item.due > todayKey && !item.completed;
    return true;
  }).sort((a, b) => a.completed - b.completed || a.due.localeCompare(b.due));
}
function renderList() {
  const visible = shownAssignments();
  elements.list.innerHTML = visible.length ? visible.map((item, index) => `
    <article class="assignment ${item.completed ? 'completed' : ''}" style="animation-delay:${index * 50}ms">
      <input class="assignment-check" type="checkbox" ${item.completed ? 'checked' : ''} data-action="complete" data-id="${item.id}" aria-label="Mark ${item.name} complete" />
      <div><div class="assignment-title"><span class="priority priority-${item.priority}"></span>${item.name}</div><div class="assignment-course">${item.course}</div></div>
      <div class="assignment-due ${item.due <= dateKey(new Date(today.getTime() + 86400000)) && !item.completed ? 'soon' : ''}">${formatDue(item.due)}</div>
      <button class="assignment-delete" type="button" data-action="delete" data-id="${item.id}" aria-label="Delete ${item.name}">×</button>
    </article>`).join('') : '<div class="empty-state"><strong>Nothing here yet</strong>Add an assignment or switch views to see more.</div>';
}
function renderStats() {
  const active = assignments.filter((item) => !item.completed);
  const completed = assignments.filter((item) => item.completed).length;
  const percent = assignments.length ? Math.round((completed / assignments.length) * 100) : 0;
  document.querySelector('#allCount').textContent = assignments.length;
  document.querySelector('#todayCount').textContent = active.filter((item) => item.due === todayKey).length;
  document.querySelector('#upcomingCount').textContent = active.filter((item) => item.due > todayKey).length;
  document.querySelector('#completedCount').textContent = completed;
  document.querySelector('#progressPercent').textContent = `${percent}%`;
  document.querySelector('#progressRing').style.setProperty('--progress', `${percent * 3.6}deg`);
  document.querySelector('#progressTitle').textContent = percent === 100 ? 'All caught up' : `${active.length} assignment${active.length === 1 ? '' : 's'} in motion`;
  document.querySelector('#progressDetail').textContent = percent === 100 ? 'Enjoy the breathing room' : `${completed} completed this week`;
}
function renderWeek() {
  const chart = document.querySelector('#weekChart');
  const days = Array.from({ length: 7 }, (_, index) => new Date(today.getTime() - (6 - index) * 86400000));
  chart.innerHTML = days.map((day) => { const key = dateKey(day); const count = assignments.filter((item) => item.due === key).length; return `<div class="day"><div class="bar ${key === todayKey ? 'active' : ''}" style="height:${Math.max(3, count * 25)}px"></div><small>${day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}</small></div>`; }).join('');
}
function render() { renderList(); renderStats(); renderWeek(); save(); }

document.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => { currentFilter = button.dataset.filter; document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('active', item === button)); document.querySelector('#sectionTitle').textContent = button.textContent.replace(/\d+/, '').trim(); renderList(); }));
document.querySelector('#addAssignmentButton').addEventListener('click', () => { elements.dialog.showModal(); elements.name.focus(); });
document.querySelector('#cancelButton').addEventListener('click', () => elements.dialog.close());
elements.form.addEventListener('submit', (event) => { event.preventDefault(); assignments.push({ id: Date.now(), name: elements.name.value.trim(), course: elements.course.value.trim(), due: elements.due.value, priority: elements.priority.value, completed: false }); elements.form.reset(); elements.due.value = dateKey(new Date(today.getTime() + 86400000)); elements.dialog.close(); render(); });
elements.list.addEventListener('change', (event) => { if (event.target.dataset.action === 'complete') { const item = assignments.find((assignment) => assignment.id === Number(event.target.dataset.id)); item.completed = event.target.checked; render(); } });
elements.list.addEventListener('click', (event) => { const button = event.target.closest('[data-action="delete"]'); if (button) { assignments = assignments.filter((item) => item.id !== Number(button.dataset.id)); render(); } });
render();

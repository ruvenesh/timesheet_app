// app.js

const SUPABASE_URL     = 'SUPABASE_URL'; //found in data api section in supabase dashboard project settings
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY'; // found in api keys section in supabase project settings

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  alert("Error: Supabase URL and Key are missing. Please update app.js");
}

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.endsWith('login.html') || path === '/') {
    handleLoginPage();
  } else if (path.endsWith('index.html')) {
    handleTimesheetPage();
  }
});


function handleLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  supabase.auth.onAuthStateChange((_, session) => {
    if (session) window.location.href = 'index.html';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(`Login Failed: ${error.message}`);
  });
}


// --- SECTION 4: TIMESHEET PAGE LOGIC ---
async function handleTimesheetPage() {
  const datePicker = document.getElementById('date-picker');
  const entriesContainer = document.getElementById('entries-container');
  const addProjectBtn = document.getElementById('add-project-btn');
  const saveBtn = document.getElementById('save-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const rowTemplate = document.getElementById('project-row-template');

  if (!datePicker) return;

  const { data: sessData, error: sessErr } = await supabase.auth.getSession();
  if (sessErr || !sessData.session) {
    window.location.href = 'login.html';
    return;
  }
  const currentUser = sessData.session.user;

  let activeProjects = [];

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, assignment_name, assignment_category, billability')
      .order('assignment_name');
    if (error) {
      alert(`Could not load projects: ${error.message}`);
      return;
    }
    activeProjects = data;
  }

  async function fetchEntriesForDate(date) {
    entriesContainer.innerHTML = '';
    const start = `${date}T00:00:00Z`;
    const end   = `${date}T23:59:59Z`;

    const { data, error } = await supabase
      .from('time_entries')
      .select('project_id, hours')
      .eq('user_id', currentUser.id)
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      alert(`Could not load entries: ${error.message}`);
      return;
    }
    if (data.length === 0) addEntryRow();
    else data.forEach(entry => addEntryRow(entry));
    updateTotal();
  }

  async function saveAllEntries() {
    const date = datePicker.value;
    if (!date) return alert('Please select a date.');

    const start = `${date}T00:00:00Z`;
    const end   = `${date}T23:59:59Z`;

    const { error: delErr } = await supabase
      .from('time_entries')
      .delete()
      .eq('user_id', currentUser.id)
      .gte('created_at', start)
      .lte('created_at', end);
    if (delErr) return alert(delErr.message);

    const toInsert = [];
    entriesContainer.querySelectorAll('.entry-row').forEach(row => {
      const pid = row.querySelector('.project-select').value;
      const hrs = parseFloat(row.querySelector('.hours-input').value) || 0;
      if (pid && hrs > 0) {
        toInsert.push({
          user_id: currentUser.id,
          project_id: parseInt(pid),
          hours: hrs
        });
      }
    });

    if (toInsert.length) {
      const { error: insErr } = await supabase
        .from('time_entries')
        .insert(toInsert);
      if (insErr) return alert(insErr.message);
    }

    alert('Timesheet saved!');
  }

  function addEntryRow(entry = {}) {
    const clone = rowTemplate.content.cloneNode(true);
    const sel = clone.querySelector('.project-select');
    const inp = clone.querySelector('.hours-input');

    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = '-- select project --';
    ph.disabled = true;
    ph.selected = true;
    sel.appendChild(ph);

    activeProjects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.assignment_name;
      sel.appendChild(opt);
    });

    if (entry.project_id) sel.value = entry.project_id;
    if (entry.hours) inp.value = entry.hours;
    entriesContainer.appendChild(clone);
  }

  function updateTotal() {
    let total = 0;
    entriesContainer.querySelectorAll('.hours-input').forEach(i => {
      total += parseFloat(i.value) || 0;
    });
    const span = document.getElementById('total-hours');
    span.textContent = total.toFixed(2);
    span.style.color = total >= 8 ? 'green' : 'red';
    document.getElementById('save-btn').disabled = total < 8;
  }

  datePicker.addEventListener('change', () => fetchEntriesForDate(datePicker.value));
  addProjectBtn.addEventListener('click', addEntryRow);
  saveBtn.addEventListener('click', saveAllEntries);
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
  entriesContainer.addEventListener('click', e => {
    if (e.target.classList.contains('delete-row-btn')) {
      e.target.closest('.entry-row').remove();
      updateTotal();
    }
  });
  entriesContainer.addEventListener('input', e => {
    if (e.target.classList.contains('hours-input')) updateTotal();
  });

  (async () => {
    datePicker.value = new Date().toISOString().split('T')[0];
    await fetchProjects();
    await fetchEntriesForDate(datePicker.value);
  })();
}

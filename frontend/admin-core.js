// Shared Admin Utilities
const BASE_URL = 'https://lms-gzty.onrender.com';

function getToken() {
  return localStorage.getItem('token');
}

function checkAdmin() {
  const token = getToken();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || user.role !== 'admin') {
    alert('Access Denied. Admins only.');
    window.location.href = 'index.html';
  }
}

function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'index.html';
  }
}

function isAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'admin';
}

// Request Wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const defaultHeaders = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) }
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    return data;
  } catch (err) {
    return { success: false, message: 'Network error or server down', data: null };
  }
}

// Toast System
function showToast(message, isSuccess = true) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.cssText = `
    padding: 15px 25px;
    background: ${isSuccess ? '#10b981' : '#ef4444'};
    color: white;
    font-weight: 600;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Render empty state
function renderEmptyState(tableBodyId, colSpan, message = "No data available") {
  const tbody = document.getElementById(tableBodyId);
  tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;padding:40px;color:#64748b;">📂 ${message}</td></tr>`;
}

// Render skeleton
function renderSkeleton(tableBodyId, colSpan, rows = 3) {
  const tbody = document.getElementById(tableBodyId);
  let html = '';
  for (let i = 0; i < rows; i++) {
    html += `<tr><td colspan="${colSpan}" style="padding:15px;"><div style="height:20px;background:#e2e8f0;border-radius:4px;animation:pulse 1.5s infinite;"></div></td></tr>`;
  }
  tbody.innerHTML = html;
}

// Inject standard css
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  th { background: #f8fafc; font-weight: 600; color: #475569; }
  .pagination { display: flex; gap: 5px; margin-top: 15px; justify-content: flex-end; }
  .pagination button { padding: 8px 12px; border: 1px solid #cbd5e1; background: white; border-radius: 4px; cursor: pointer; }
  .pagination button:disabled { background: #f1f5f9; cursor: not-allowed; }
`;
document.head.appendChild(style);

function buildPagination(page, totalPages, fetchFn) {
  const container = document.getElementById('pagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button ${page === 1 ? 'disabled' : ''} onclick="${fetchFn.name}(${page - 1})">Prev</button>`;
  html += `<span> Page ${page} of ${totalPages} </span>`;
  html += `<button ${page === totalPages ? 'disabled' : ''} onclick="${fetchFn.name}(${page + 1})">Next</button>`;

  container.innerHTML = html;
}

// Global click handler for Topbar Dropdowns (Profile & Notifications)
document.addEventListener('click', function(e) {
  // Handle Profile Dropdown
  const profile = e.target.closest('.user-profile');
  if (profile) {
    let dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'profile-dropdown';
      // Calculate position relative to the profile element
      const rect = profile.getBoundingClientRect();
      dropdown.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 10}px;
        right: ${window.innerWidth - rect.right}px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 8px 0;
        z-index: 1000;
        min-width: 160px;
        animation: slideDown 0.2s ease-out;
      `;
      dropdown.innerHTML = `
        <div style="padding: 8px 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 4px;">
          <div style="font-weight: 600; color: #0f172a;">Admin Account</div>
          <div style="font-size: 0.8rem; color: #64748b;">Manage system</div>
        </div>
        <a href="#" onclick="localStorage.clear(); window.location.href='index.html'" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; color: #ef4444; text-decoration: none; transition: background 0.2s;">
          <i class='bx bx-log-out'></i> Logout
        </a>
      `;
      document.body.appendChild(dropdown);
    } else {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      if (dropdown.style.display === 'block') {
        const rect = profile.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 10}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
      }
    }
  } else {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown && !e.target.closest('#profile-dropdown')) {
      dropdown.style.display = 'none';
    }
  }

  // Handle Notification Dropdown
  const bell = e.target.closest('.btn-icon');
  if (bell && bell.querySelector('.bx-bell')) {
    let notif = document.getElementById('notif-dropdown');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'notif-dropdown';
      const rect = bell.getBoundingClientRect();
      notif.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 10}px;
        right: ${window.innerWidth - rect.right}px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 0;
        z-index: 1000;
        min-width: 280px;
        animation: slideDown 0.2s ease-out;
      `;
      notif.innerHTML = `
        <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">
          Notifications
        </div>
        <div style="padding: 20px 16px; text-align: center; color: #64748b; font-size: 0.9rem;">
          <i class='bx bx-bell-off' style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          No new notifications
        </div>
      `;
      document.body.appendChild(notif);
    } else {
      notif.style.display = notif.style.display === 'none' ? 'block' : 'none';
      if (notif.style.display === 'block') {
        const rect = bell.getBoundingClientRect();
        notif.style.top = `${rect.bottom + 10}px`;
        notif.style.right = `${window.innerWidth - rect.right}px`;
      }
    }
  } else {
    const notif = document.getElementById('notif-dropdown');
    if (notif && !e.target.closest('#notif-dropdown')) {
      notif.style.display = 'none';
    }
  }
});

// Add slideDown animation to document
const animStyle = document.createElement('style');
animStyle.innerHTML = \`
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  #profile-dropdown a:hover { background: #fef2f2; }
\`;
document.head.appendChild(animStyle);

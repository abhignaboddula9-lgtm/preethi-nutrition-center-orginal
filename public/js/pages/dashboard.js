// Global fetch interceptor to handle session expiration (401/403)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch(...args);
  const url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');
  if ((response.status === 401 || response.status === 403) && !url.includes('/api/auth/')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('preethi_user_session');
    window.location.href = '/login';
  }
  return response;
};

document.addEventListener('DOMContentLoaded', () => {
  verifyAuth();
  initThemeToggle();
  initProfileModal();
  initWeightLogger();
  renderDashboard();
});

let currentUser = null;

/* --- 1. Authentication Verification --- */
function verifyAuth() {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    window.location.href = '/login';
    return;
  }

  currentUser = JSON.parse(userJson);

  // Set top right header badges
  const headerName = document.getElementById('headerUserName');
  const profileInitials = document.getElementById('profileInitials');
  
  if (headerName) headerName.innerText = currentUser.name;
  if (profileInitials) {
    profileInitials.innerText = getInitials(currentUser.name);
  }

  // Logout trigger
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    });
  }
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

/* --- 2. Theme Toggler --- */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (!themeToggleBtn) return;

  const htmlEl = document.documentElement;
  const icon = themeToggleBtn.querySelector('i');

  const savedTheme = localStorage.getItem('theme') || 'light';
  htmlEl.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (theme === 'light') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  }
}

/* --- 3. Profile Metric Edit Modal Toggles --- */
function initProfileModal() {
  const modal = document.getElementById('profileModal');
  const btnEdit = document.getElementById('btnEditProfile');
  const btnCancel = document.getElementById('btnCancelEdit');
  const editForm = document.getElementById('editProfileForm');

  if (!modal || !btnEdit || !btnCancel || !editForm) return;

  // Open modal
  btnEdit.addEventListener('click', () => {
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editHeight').value = currentUser.height || 0;
    modal.style.display = 'flex';
  });

  // Close modal
  btnCancel.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Handle Edit submission
  editForm.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const updatedPhone = document.getElementById('editPhone').value.trim();
    const updatedHeight = parseFloat(document.getElementById('editHeight').value) || 0;

    // Update locally cached user state
    currentUser.phone = updatedPhone;
    currentUser.height = updatedHeight;
    localStorage.setItem('user', JSON.stringify(currentUser));

    // Hide modal and alert user
    modal.style.display = 'none';
    showDashboardAlert('success', 'Profile height and contact details updated successfully!');
    
    // Re-render and recalculate BMI metrics
    renderDashboard();
  });
}

/* --- 4. Weight Tracker Input Logger --- */
function initWeightLogger() {
  const logForm = document.getElementById('weightLogForm');
  const logDateInput = document.getElementById('logDateVal');

  if (!logForm || !logDateInput) return;

  // Set default date picker to today's local date
  logDateInput.value = new Date().toISOString().split('T')[0];

  logForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const weight = parseFloat(document.getElementById('logWeightVal').value);
    const date = logDateInput.value;

    if (isNaN(weight) || weight <= 0 || !date) return;

    const userHeight = currentUser.height || 0;
    if (userHeight <= 0) {
      showDashboardAlert('error', 'Please click "Edit Profile Metrics" to log your starting height before tracking weight.');
      return;
    }

    // Compute log BMI
    const heightM = userHeight / 100;
    const bmi = weight / (heightM * heightM);

    // Retrieve previous logs or start fresh
    const historyKey = `weight_history_${currentUser.id}`;
    const logs = JSON.parse(localStorage.getItem(historyKey)) || [];

    // Push new log entry
    logs.push({
      id: Date.now().toString(),
      date,
      weight,
      bmi: parseFloat(bmi.toFixed(1))
    });

    // Sort by date descending
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Save history logs back to local storage
    localStorage.setItem(historyKey, JSON.stringify(logs));

    // Update currentUser weight to match latest entry
    if (logs.length > 0) {
      currentUser.weight = logs[0].weight;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }

    logForm.reset();
    logDateInput.value = new Date().toISOString().split('T')[0];

    showDashboardAlert('success', 'Weight entry logged and BMI score computed successfully!');
    renderDashboard();
  });
}

/* --- 5. Render/Refresh Dashboard Values --- */
function renderDashboard() {
  if (!currentUser) return;

  // Update profile details
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  const profileHeight = document.getElementById('profileHeight');
  const profileWeight = document.getElementById('profileWeight');

  if (profileName) profileName.innerText = currentUser.name;
  if (profileEmail) profileEmail.innerText = currentUser.email;
  if (profilePhone) profilePhone.innerText = currentUser.phone || 'Not Provided';
  if (profileHeight) profileHeight.innerText = `${currentUser.height || 0} cm`;
  if (profileWeight) profileWeight.innerText = `${currentUser.weight || 0} kg`;

  // Load Weight History logs
  const historyKey = `weight_history_${currentUser.id}`;
  const logs = JSON.parse(localStorage.getItem(historyKey)) || [];
  const tableBody = document.getElementById('logsTableBody');

  if (!tableBody) return;

  if (logs.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No logs recorded. Log your first weight above to start tracking.</td>
      </tr>
    `;
    resetBmiGauge();
  } else {
    tableBody.innerHTML = '';
    
    logs.forEach(log => {
      const row = document.createElement('tr');
      const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const rating = getBmiRating(log.bmi);

      row.innerHTML = `
        <td><strong>${formattedDate}</strong></td>
        <td>${log.weight} kg</td>
        <td>${log.bmi}</td>
        <td><span class="current-bmi-badge" style="background-color: ${rating.color}; margin: 0;">${rating.category}</span></td>
        <td>
          <button class="action-delete-btn" data-id="${log.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Delete Log Event trigger
    tableBody.querySelectorAll('.action-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        deleteLog(id);
      });
    });

    // Update BMI summaries card to reflect the latest weight log
    updateBmiGauge(logs[0].bmi);
  }
}

/* --- Delete Log Helper --- */
function deleteLog(id) {
  const historyKey = `weight_history_${currentUser.id}`;
  let logs = JSON.parse(localStorage.getItem(historyKey)) || [];
  
  logs = logs.filter(log => log.id !== id);
  localStorage.setItem(historyKey, JSON.stringify(logs));

  // Sync current profile weight to matching latest log, or default back to 0
  if (logs.length > 0) {
    currentUser.weight = logs[0].weight;
  } else {
    currentUser.weight = 0;
  }
  localStorage.setItem('user', JSON.stringify(currentUser));

  showDashboardAlert('success', 'Weight record removed successfully.');
  renderDashboard();
}

/* --- BMI rating evaluator helper --- */
function getBmiRating(bmi) {
  if (bmi < 18.5) {
    return { category: 'Underweight', color: '#60a5fa', advice: 'Your score indicates underweight. We recommend a caloric surplus and protein supplements.' };
  } else if (bmi >= 18.5 && bmi < 25) {
    return { category: 'Normal Weight', color: '#34d399', advice: 'Great job! You have a healthy weight. Keep up the clean nutrition plans and Zumba workouts.' };
  } else if (bmi >= 25 && bmi < 30) {
    return { category: 'Overweight', color: '#fbbf24', advice: 'You are in the overweight range. Our customized portion-control diet charts will help.' };
  } else {
    return { category: 'Obese', color: '#f87171', advice: 'Your score indicates Obesity. We recommend a certified dietary assessment and low-impact exercises.' };
  }
}

/* --- BMI Gauge GUI updates --- */
function updateBmiGauge(bmi) {
  const scoreEl = document.getElementById('currentBmiScore');
  const badgeEl = document.getElementById('currentBmiBadge');
  const adviceEl = document.getElementById('currentBmiAdvice');
  const indicator = document.getElementById('currentGaugeIndicator');

  if (!scoreEl || !badgeEl || !adviceEl || !indicator) return;

  const rating = getBmiRating(bmi);

  scoreEl.innerText = bmi.toFixed(1);
  badgeEl.innerText = rating.category;
  badgeEl.style.backgroundColor = rating.color;
  adviceEl.innerText = rating.advice;

  // Gauge bar slider percentage calculation: range 15 to 35
  const minBmi = 15;
  const maxBmi = 35;
  let pct = ((bmi - minBmi) / (maxBmi - minBmi)) * 100;
  pct = Math.min(100, Math.max(0, pct));
  
  indicator.style.left = `${pct}%`;
  indicator.style.borderColor = rating.color;
}

function resetBmiGauge() {
  const scoreEl = document.getElementById('currentBmiScore');
  const badgeEl = document.getElementById('currentBmiBadge');
  const adviceEl = document.getElementById('currentBmiAdvice');
  const indicator = document.getElementById('currentGaugeIndicator');

  if (scoreEl) scoreEl.innerText = '0.0';
  if (badgeEl) {
    badgeEl.innerText = 'No Data';
    badgeEl.style.backgroundColor = 'var(--border)';
  }
  if (adviceEl) adviceEl.innerText = 'Log weight parameters to calculate your BMI rating.';
  if (indicator) indicator.style.left = '0%';
}

/* --- Dashboard Alerts helper --- */
function showDashboardAlert(type, message) {
  const successEl = document.getElementById('dashboardSuccessAlert');
  const errorEl = document.getElementById('dashboardErrorAlert');

  if (type === 'success' && successEl) {
    successEl.innerText = message;
    successEl.style.display = 'flex';
    setTimeout(() => successEl.style.display = 'none', 4000);
  } else if (type === 'error' && errorEl) {
    errorEl.innerText = message;
    errorEl.style.display = 'flex';
    setTimeout(() => errorEl.style.display = 'none', 4000);
  }
}

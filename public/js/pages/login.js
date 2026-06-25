/* ==========================================
   PREETHI NUTRITION CENTER - LOGIN JS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initAuthNavigation();
  initAuthActions();
});

/* --- 1. Theme Toggler --- */
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

/* --- 2. Mobile Menu (Hamburger) --- */
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  
  if (!hamburgerBtn || !navMenu) return;

  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

/* --- 3. Panel Toggling Logic (Login vs Register vs Forgot) --- */
function initAuthNavigation() {
  const authWrapper = document.getElementById('authWrapper');
  const loginPanel = document.getElementById('loginPanel');
  const registerPanel = document.getElementById('registerPanel');
  const forgotPanel = document.getElementById('forgotPanel');
  
  // Triggers
  const toRegisterBtn = document.getElementById('toRegisterBtn');
  const toLoginBtn = document.getElementById('toLoginBtn');
  const mobileToRegister = document.getElementById('mobileToRegister');
  const mobileToLogin = document.getElementById('mobileToLogin');
  const forgotPassBtn = document.getElementById('forgotPassBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  const successBackToLoginBtn = document.getElementById('successBackToLoginBtn');

  if (!authWrapper) return;

  // Desktop Slider toggles
  if (toRegisterBtn) {
    toRegisterBtn.addEventListener('click', () => {
      authWrapper.classList.add('register-mode');
      // On desktop, we still show/hide elements after transition or keep display block
      loginPanel.style.display = 'none';
      registerPanel.style.display = 'block';
      forgotPanel.style.display = 'none';
    });
  }

  if (toLoginBtn) {
    toLoginBtn.addEventListener('click', () => {
      authWrapper.classList.remove('register-mode');
      loginPanel.style.display = 'block';
      registerPanel.style.display = 'none';
      forgotPanel.style.display = 'none';
    });
  }

  // Mobile Toggles
  if (mobileToRegister) {
    mobileToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginPanel.style.display = 'none';
      registerPanel.style.display = 'block';
      forgotPanel.style.display = 'none';
    });
  }

  if (mobileToLogin) {
    mobileToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      loginPanel.style.display = 'block';
      registerPanel.style.display = 'none';
      forgotPanel.style.display = 'none';
    });
  }

  // Forgot password triggers
  if (forgotPassBtn) {
    forgotPassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginPanel.style.display = 'none';
      registerPanel.style.display = 'none';
      forgotPanel.style.display = 'block';
      // Ensure forgot form is visible if previously mock submitted
      const forgotForm = document.getElementById('forgotForm');
      const forgotSuccessMsg = document.getElementById('forgotSuccessMsg');
      if (forgotForm) forgotForm.style.display = 'block';
      if (forgotSuccessMsg) forgotSuccessMsg.style.display = 'none';
    });
  }

  const navigateBackToLogin = (e) => {
    if (e) e.preventDefault();
    authWrapper.classList.remove('register-mode');
    loginPanel.style.display = 'block';
    registerPanel.style.display = 'none';
    forgotPanel.style.display = 'none';
  };

  if (backToLoginBtn) backToLoginBtn.addEventListener('click', navigateBackToLogin);
  if (successBackToLoginBtn) successBackToLoginBtn.addEventListener('click', navigateBackToLogin);
}

/* --- 4. Authenticators & Account Creators (API calls) --- */
function initAuthActions() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');

  // API Call: Client Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorAlert = document.getElementById('loginErrorMsg');

      errorAlert.style.display = 'none';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
          // Store token and user properties
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // Redirect based on user privilege role
          if (data.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        } else {
          showError(errorAlert, data.message || 'Authentication failed. Please check credentials.');
        }
      } catch (err) {
        showError(errorAlert, 'Server error. Please verify your connection and try again.');
        console.error('Login error:', err);
      }
    });
  }

  // API Call: Client Registration
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const phone = document.getElementById('regPhone').value.trim();
      const height = parseFloat(document.getElementById('regHeight').value) || 0;
      const weight = parseFloat(document.getElementById('regWeight').value) || 0;
      const errorAlert = document.getElementById('regErrorMsg');

      errorAlert.style.display = 'none';

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, password, phone, height, weight })
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/';
        } else {
          showError(errorAlert, data.message || 'Registration failed. Please check your data.');
        }
      } catch (err) {
        showError(errorAlert, 'Server error. Please verify your connection and try again.');
        console.error('Registration error:', err);
      }
    });
  }

  // Mock Request: Password Reset
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const successAlert = document.getElementById('forgotSuccessMsg');
      
      // Hide form and display success panel
      forgotForm.style.display = 'none';
      successAlert.style.display = 'block';
      
      forgotForm.reset();
    });
  }

  // --- Google Sign-In Actions ---
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleModalOverlay = document.getElementById('googleModalOverlay');
  const closeGoogleModal = document.getElementById('closeGoogleModal');
  const googleAccountList = document.querySelector('.google-account-list');
  const googleCustomForm = document.getElementById('googleCustomForm');
  const useCustomGoogle = document.getElementById('useCustomGoogle');
  const cancelCustomGoogle = document.getElementById('cancelCustomGoogle');

  if (googleLoginBtn && googleModalOverlay) {
    googleLoginBtn.addEventListener('click', () => {
      googleModalOverlay.style.display = 'flex';
      googleAccountList.style.display = 'flex';
      googleCustomForm.style.display = 'none';
    });

    closeGoogleModal.addEventListener('click', () => {
      googleModalOverlay.style.display = 'none';
    });

    googleModalOverlay.addEventListener('click', (e) => {
      if (e.target === googleModalOverlay) {
        googleModalOverlay.style.display = 'none';
      }
    });

    // Selecting pre-defined mock accounts
    googleAccountList.addEventListener('click', async (e) => {
      const accountItem = e.target.closest('.google-account-item:not(#useCustomGoogle)');
      if (!accountItem) return;

      const email = accountItem.dataset.email;
      const name = accountItem.dataset.name;

      await handleGoogleAuthSuccess(name, email);
    });

    // Selecting "Use another account"
    if (useCustomGoogle) {
      useCustomGoogle.addEventListener('click', () => {
        googleAccountList.style.display = 'none';
        googleCustomForm.style.display = 'block';
      });
    }

    if (cancelCustomGoogle) {
      cancelCustomGoogle.addEventListener('click', () => {
        googleCustomForm.style.display = 'none';
        googleAccountList.style.display = 'flex';
      });
    }

    // Custom Account Form submission
    if (googleCustomForm) {
      googleCustomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('gCustomName').value.trim();
        const email = document.getElementById('gCustomEmail').value.trim();

        if (name && email) {
          await handleGoogleAuthSuccess(name, email);
        }
      });
    }
  }

  async function handleGoogleAuthSuccess(name, email) {
    googleModalOverlay.style.display = 'none';
    
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('Successfully signed in with Google');
        
        if (data.user.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        alert(data.message || 'Google Sign-In failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Google Sign-In failed.');
    }
  }

  // Helper alert display
  function showError(element, message) {
    element.innerText = message;
    element.style.display = 'block';
    
    // Add quick shake animation class
    element.style.animation = 'none';
    element.offsetHeight; /* Trigger reflow */
    element.style.animation = 'shake 0.3s ease';
  }
}

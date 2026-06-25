/* ==========================================
   PREETHI NUTRITION CENTER - MAIN JS
   Premium Pink & Lavender Theme
   ========================================== */

document.addEventListener('DOMContentLoaded', async () => {
  initThemeToggle();
  await injectGlobalNavbarAndFooter();
  initScrollHeader();
});

/* --- 1. Force Light Theme --- */
function initThemeToggle() {
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.setItem('theme', 'light');
}

/* --- 2. Dynamic Global Navbar & Footer Injection --- */
async function injectGlobalNavbarAndFooter() {
  // ── Global override styles (Theme Adapted) ──────────────────────────────
  const overrideStyle = document.createElement('style');
  overrideStyle.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --bg: #FFF8FC;
      --bg-surface: #FFFFFF;
      --text: #2D2D2D;
      --text-muted: #4b5563;
      --primary: #E75480;
      --secondary: #C8A2C8;
      --primary-glow: rgba(231, 84, 128, 0.08);
      --secondary-glow: rgba(200, 162, 200, 0.08);
      --border: rgba(231, 84, 128, 0.10);
      --gradient-brand: linear-gradient(135deg, #E75480, #C86DD7);
    }

    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif !important;
      background-color: var(--bg) !important;
      color: var(--text) !important;
      margin: 0 !important;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Poppins', sans-serif !important;
    }

    /* ── Navbar ─────────────────────────── */
    .navbar-header {
      position: sticky !important;
      top: 0 !important;
      width: 100% !important;
      z-index: 1000 !important;
      background: var(--bg-surface) !important;
      border-bottom: 1px solid var(--border) !important;
      padding: 0 !important;
      box-shadow: 0 4px 24px var(--primary-glow) !important;
      height: auto !important;
    }
    .navbar-header.shrink {
      box-shadow: 0 2px 16px var(--primary-glow) !important;
    }

    .nav-container-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1240px;
      margin: 0 auto;
      padding: 14px 28px;
      gap: 24px;
    }

    /* ── Logo ───────────────────────────── */
    .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      flex-shrink: 0;
    }
    .logo-link .logo-img {
      height: 55px !important;
      width: auto !important;
      object-fit: contain !important;
      display: block !important;
      transition: transform 0.25s ease !important;
    }
    .logo-link:hover .logo-img { transform: scale(1.04); }

    /* ── Nav menu ───────────────────────── */
    .nav-menu-links {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
      flex-wrap: nowrap;
    }

    .nav-link-item {
      font-family: 'Poppins', sans-serif !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      color: var(--text-muted) !important;
      text-decoration: none !important;
      padding: 8px 12px !important;
      border-radius: 8px !important;
      position: relative !important;
      transition: color 0.2s ease, background-color 0.2s ease !important;
      white-space: nowrap !important;
      background: none !important;
      border: none !important;
      cursor: pointer !important;
    }
    .nav-link-item:hover {
      color: var(--secondary) !important;
      background-color: var(--secondary-glow) !important;
    }
    .nav-link-item.active {
      color: var(--primary) !important;
      background-color: var(--primary-glow) !important;
    }
    .nav-link-item.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 12px;
      right: 12px;
      height: 2px;
      background: var(--gradient-brand);
      border-radius: 2px;
    }

    /* ── Auth Buttons ───────────────────── */
    .nav-auth-area {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .btn-pink-gradient {
      background: var(--gradient-brand) !important;
      color: #FFFFFF !important;
      border: none !important;
      border-radius: 50px !important;
      font-family: 'Poppins', sans-serif !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
      padding: 10px 22px !important;
      cursor: pointer !important;
      text-decoration: none !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 7px !important;
      transition: box-shadow 0.25s ease, transform 0.25s ease !important;
      box-shadow: 0 4px 14px var(--primary-glow) !important;
      white-space: nowrap !important;
    }
    .btn-pink-gradient:hover {
      box-shadow: 0 6px 20px var(--primary-glow) !important;
      transform: translateY(-1px) !important;
    }

    .btn-logout-pink {
      background: none !important;
      border: none !important;
      cursor: pointer !important;
      padding: 8px !important;
      color: var(--primary) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      transition: background-color 0.2s ease !important;
    }
    .btn-logout-pink:hover {
      background-color: var(--primary-glow) !important;
    }

    /* ── Hamburger ──────────────────────── */
    .hamburger-btn {
      display: none !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      width: 26px !important;
      height: 20px !important;
      cursor: pointer !important;
      background: none !important;
      border: none !important;
      padding: 0 !important;
    }
    .hamburger-btn .bar {
      height: 2.5px !important;
      width: 100% !important;
      background: var(--gradient-brand) !important;
      border-radius: 10px !important;
      transition: all 0.3s ease !important;
    }
    .hamburger-btn.open .bar:nth-child(1) { transform: translateY(8.75px) rotate(45deg) !important; }
    .hamburger-btn.open .bar:nth-child(2) { opacity: 0 !important; }
    .hamburger-btn.open .bar:nth-child(3) { transform: translateY(-8.75px) rotate(-45deg) !important; }

    /* ── Mobile drawer ──────────────────── */
    .mobile-nav-drawer {
      display: none;
      position: fixed;
      top: 83px;
      left: 0;
      right: 0;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px 24px;
      flex-direction: column;
      gap: 4px;
      z-index: 999;
      box-shadow: 0 12px 32px var(--primary-glow);
      animation: slideDown 0.25s ease;
    }
    .mobile-nav-drawer.open { display: flex !important; }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .mobile-nav-drawer .nav-link-item {
      width: 100% !important;
      font-size: 1rem !important;
      padding: 12px 16px !important;
      border-radius: 10px !important;
    }
    .mobile-nav-drawer .btn-pink-gradient {
      margin-top: 10px !important;
      width: 100% !important;
      justify-content: center !important;
    }

    @media (max-width: 960px) {
      .hamburger-btn { display: flex !important; }
      .nav-menu-links { display: none !important; }
      .nav-auth-area-desktop { display: none !important; }
    }
    @media (min-width: 961px) {
      .mobile-nav-drawer { display: none !important; }
    }

    /* ── Global button overrides ────────── */
    .btn-primary, .btn-gradient, button.btn-primary {
      background: var(--gradient-brand) !important;
      color: #FFFFFF !important;
      border: none !important;
      border-radius: 50px !important;
    }
    .btn-secondary, button.btn-secondary {
      background: transparent !important;
      border: 2px solid var(--secondary) !important;
      color: var(--secondary) !important;
      border-radius: 50px !important;
    }
    .btn-secondary:hover {
      background: var(--secondary) !important;
      color: #FFFFFF !important;
    }
    .btn-outline {
      border: 2px solid var(--primary) !important;
      color: var(--primary) !important;
      border-radius: 50px !important;
      background: transparent !important;
    }
    .btn-outline:hover {
      background: var(--primary) !important;
      color: #FFFFFF !important;
    }

    /* ── Icon colors ────────────────────── */
    .icon-pink { color: var(--primary) !important; stroke: var(--primary) !important; }
    .icon-lavender { color: var(--secondary) !important; stroke: var(--secondary) !important; }

    /* ── Section & card polish ──────────── */
    .glass-panel, .glass-card {
      background: var(--bg-surface) !important;
      border: 1px solid var(--border) !important;
      border-radius: 20px !important;
      box-shadow: 0 8px 32px var(--primary-glow) !important;
    }

    /* ── Footer ─────────────────────────── */
    footer.footer {
      background: var(--gradient-brand) !important;
      color: #FFFFFF !important;
      border-top: none !important;
      padding: 80px 0 32px !important;
    }
    footer.footer p,
    footer.footer a,
    footer.footer span,
    footer.footer li {
      color: rgba(255,255,255,0.90) !important;
    }
    footer.footer a:hover { color: #FFFFFF !important; opacity: 1 !important; }
    footer.footer h4 { color: #FFFFFF !important; }
    footer.footer .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.20) !important;
      color: rgba(255,255,255,0.75) !important;
    }
    footer.footer .social-links a {
      border-color: rgba(255,255,255,0.25) !important;
      color: #FFFFFF !important;
      background: rgba(255,255,255,0.10) !important;
    }
    footer.footer .social-links a:hover {
      background: rgba(255,255,255,0.25) !important;
      border-color: #FFFFFF !important;
    }
    footer.footer svg, footer.footer i { stroke: rgba(255,255,255,0.90) !important; color: rgba(255,255,255,0.90) !important; }

    /* ── Active page highlight in footer ── */
    .section-sub { color: var(--primary) !important; }
    .section-title { color: var(--text) !important; }

    /* ── Logo fallback size fix for existing .logo markup ── */
    .logo img.logo-img {
      height: 55px !important;
      width: auto !important;
      object-fit: contain !important;
      display: block !important;
    }
  `;
  document.head.appendChild(overrideStyle);

  let config = {
    contactAddress: "Preethi Nutrition Center, Main Road, Block A, Bangalore, India",
    contactPhone: "+91 98765 43210",
    contactEmail: "info@preethinutrition.com",
    operatingHours: "Mon - Fri: 6:00 AM - 11:30 AM, 4:30 PM - 8:30 PM | Sat: 6:00 AM - 12:00 PM | Sun: Closed"
  };

  try {
    const res = await fetch('/api/content');
    const data = await res.json();
    if (data.success && data.data) {
      config = { ...config, ...data.data };
    }
  } catch(e) {
    console.warn("Could not load dynamic site config for footer, using default values.");
  }

  // ── Session ────────────────────────────────────────────────────────────────
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const reactSession = localStorage.getItem('preethi_user_session');
  let user = null;
  if (token && userJson) { try { user = JSON.parse(userJson); } catch(e) {} }
  else if (reactSession)  { try { user = JSON.parse(reactSession); } catch(e) {} }

  const dashHref = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login';
  const dashLabel = user ? (user.role === 'admin' ? 'Admin Panel' : 'My Account') : 'Portal Login';
  const mobileBtn = user
    ? `<a href="${dashHref}" class="btn-pink-gradient">${dashLabel}</a>`
    : `<a href="/login" class="btn-pink-gradient">Portal Login</a>`;

  const authButtons = user
    ? `<a href="${dashHref}" class="btn-pink-gradient" style="text-decoration:none;">${dashLabel}</a>
       <button id="navLogoutBtn" class="btn-logout-pink" title="Log Out">
         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E75480" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
       </button>`
    : `<a href="/login" class="btn-pink-gradient" style="text-decoration:none;">Portal Login</a>`;

  const navLinks = [
    ['/', 'Home'], ['/about', 'About'], ['/services', 'Services'],
    ['/diet', 'Diet Plans'], ['/zumba', 'Zumba'], ['/success', 'Success Stories'],
    ['/blog', 'Blog'], ['/contact', 'Contact']
  ];

  function normalize(p) {
    return p.replace(/\/$/, '').replace(/\.html$/, '').replace(/\/index$/, '') || '/';
  }
  const currentPath = normalize(window.location.pathname);

  const navLinkHTML = navLinks.map(([href, label]) => {
    const isActive = currentPath === normalize(href) || (normalize(href) !== '/' && currentPath.startsWith(normalize(href)));
    return `<a href="${href}" class="nav-link-item${isActive ? ' active' : ''}">${label}</a>`;
  }).join('');

  // ── Navbar markup ─────────────────────────────────────────────────────────
  const navbarHTML = `
    <div class="nav-container-inner">
      <a href="/" class="logo-link">
        <img src="/uploads/logo.jpg" alt="Preethi Nutrition Logo" class="logo-img">
      </a>

      <nav class="nav-menu-links" id="navMenuLinks">
        ${navLinkHTML}
      </nav>

      <div class="nav-auth-area nav-auth-area-desktop">
        ${authButtons}
      </div>

      <button class="hamburger-btn" id="hamburgerBtn" aria-label="Toggle menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
    </div>

    <div class="mobile-nav-drawer" id="mobileNavDrawer">
      ${navLinkHTML}
      ${mobileBtn}
    </div>
  `;

  // ── Find / create header ───────────────────────────────────────────────────
  let header = document.querySelector('header.navbar-header');
  if (!header) {
    header = document.createElement('header');
    header.className = 'navbar-header';
    document.body.prepend(header);
  }
  header.innerHTML = navbarHTML;

  // Hamburger toggle
  const hamburgerBtn = header.querySelector('#hamburgerBtn');
  const mobileDrawer  = document.getElementById('mobileNavDrawer');
  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburgerBtn.classList.toggle('open');
      mobileDrawer.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!mobileDrawer.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        hamburgerBtn.classList.remove('open');
        mobileDrawer.classList.remove('open');
      }
    });
  }

  // Logout
  const logoutBtn = header.querySelector('#navLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ['token','user','preethi_user_session'].forEach(k => localStorage.removeItem(k));
      window.location.href = '/';
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerHTML = `
    <div style="max-width:1240px;margin:0 auto;padding:0 28px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;margin-bottom:56px;">

        <!-- Brand -->
        <div style="display:flex;flex-direction:column;gap:18px;">
          <a href="/" style="display:inline-flex;align-items:center;text-decoration:none;">
            <img src="/uploads/logo.jpg" alt="Preethi Nutrition Logo"
                 style="height:55px;width:auto;object-fit:contain;filter:brightness(0) invert(1);opacity:0.95;">
          </a>
          <p style="font-size:0.9rem;line-height:1.7;margin:0;color:rgba(255,255,255,0.85);">
            Empowering you to live your healthiest life through science-backed nutrition, personalised diet plans, and energetic Zumba sessions.
          </p>
          <div style="display:flex;gap:12px;">
            <a href="#" aria-label="Instagram" style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;color:#fff;text-decoration:none;font-size:14px;transition:background 0.2s;"
               onmouseover="this.style.background='rgba(255,255,255,0.28)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" aria-label="Facebook" style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;color:#fff;text-decoration:none;font-size:14px;transition:background 0.2s;"
               onmouseover="this.style.background='rgba(255,255,255,0.28)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="WhatsApp" style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;color:#fff;text-decoration:none;font-size:14px;transition:background 0.2s;"
               onmouseover="this.style.background='rgba(255,255,255,0.28)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </a>
          </div>
        </div>

        <!-- Programs -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <h4 style="font-family:'Poppins',sans-serif;font-size:1rem;font-weight:700;color:#fff;margin:0;letter-spacing:0.5px;">Programs</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
            ${[['Weight Loss','/services'],['Weight Gain','/services'],['Zumba Classes','/zumba'],['Diet Consultation','/services'],['Meal Planning','/services']].map(([l,h])=>`<li><a href="${h}" style="color:rgba(255,255,255,0.85);text-decoration:none;font-size:0.9rem;font-weight:500;transition:color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">${l}</a></li>`).join('')}
          </ul>
        </div>

        <!-- Diet Plans -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <h4 style="font-family:'Poppins',sans-serif;font-size:1rem;font-weight:700;color:#fff;margin:0;letter-spacing:0.5px;">Diet Plans</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
            ${[["Women's Nutrition",'/diet'],["Men's Nutrition",'/diet'],["Children's Nutrition",'/diet'],["Senior Wellness",'/diet'],["Skin Health",'/diet']].map(([l,h])=>`<li><a href="${h}" style="color:rgba(255,255,255,0.85);text-decoration:none;font-size:0.9rem;font-weight:500;transition:color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">${l}</a></li>`).join('')}
          </ul>
        </div>

        <!-- Contact -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <h4 style="font-family:'Poppins',sans-serif;font-size:1rem;font-weight:700;color:#fff;margin:0;letter-spacing:0.5px;">Get In Touch</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">
            <li style="display:flex;align-items:flex-start;gap:10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style="font-size:0.875rem;color:rgba(255,255,255,0.85);line-height:1.5;">${config.contactAddress}</span>
            </li>
            <li style="display:flex;align-items:center;gap:10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span style="font-size:0.875rem;color:rgba(255,255,255,0.85);">${config.contactPhone}</span>
            </li>
            <li style="display:flex;align-items:center;gap:10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style="font-size:0.875rem;color:rgba(255,255,255,0.85);">${config.contactEmail}</span>
            </li>
            <li style="display:flex;align-items:flex-start;gap:10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style="font-size:0.875rem;color:rgba(255,255,255,0.85);line-height:1.5;">${config.operatingHours}</span>
            </li>
          </ul>
        </div>

      </div>

      <!-- Bottom bar -->
      <div style="border-top:1px solid rgba(255,255,255,0.20);padding-top:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
        <p style="font-size:0.82rem;color:rgba(255,255,255,0.72);margin:0;">
          &copy; ${new Date().getFullYear()} Preethi Nutrition Center. All rights reserved.
        </p>
        <div style="display:flex;gap:20px;">
          <a href="#" style="font-size:0.82rem;color:rgba(255,255,255,0.72);text-decoration:none;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.72)'">Privacy Policy</a>
          <a href="#" style="font-size:0.82rem;color:rgba(255,255,255,0.72);text-decoration:none;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.72)'">Terms of Service</a>
        </div>
      </div>
    </div>
  `;

  let footer = document.querySelector('footer.footer') || document.querySelector('footer');
  if (!footer && !window.location.pathname.includes('/admin')) {
    footer = document.createElement('footer');
    footer.className = 'footer';
    document.body.appendChild(footer);
  }
  if (footer) footer.innerHTML = footerHTML;
}

/* --- 3. Sticky scroll shrink --- */
function initScrollHeader() {
  const header = document.querySelector('.navbar-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('shrink', window.scrollY > 40);
  });
}

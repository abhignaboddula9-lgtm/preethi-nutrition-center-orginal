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
  verifyAdminAuth();
  initThemeToggle();
  initTabNavigation();
  initSettingsTab();
  initAppointmentsTab();
  initUsersTab();
  initMediaTab();
  initPostsTab();
  initProductsTab();
  initBlogsTab();
  initSuccessTab();
  initQueriesTab();
  loadDashboardStats();
  
  // Set current date
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    dateEl.innerText = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
});

/* --- 1. Verify Admin Authentication --- */
function verifyAdminAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || user.role !== 'admin') {
    // Redirect to admin login page
    window.location.href = '/login';
  } else {
    // Set profile name in sidebar
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl && user.name) {
      adminNameEl.innerText = user.name;
    }
  }

  // Logout handler
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

/* --- Get Authorization Header Helper --- */
function getHeaders(isMultipart = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
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

/* --- 3. Sidebar Tab Switching Navigation --- */
function initTabNavigation() {
  const sidebarNav = document.getElementById('sidebarNav');
  const tabBtns = sidebarNav.querySelectorAll('.nav-btn:not(.btn-logout)');
  const panels = document.querySelectorAll('.tab-panel');
  const tabTitleEl = document.getElementById('currentTabTitle');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');
      switchTab(tabTarget);
    });
  });

  // Shortcut buttons triggers
  document.addEventListener('click', (e) => {
    const shortcutBtn = e.target.closest('.shortcut-btn');
    if (shortcutBtn) {
      const target = shortcutBtn.getAttribute('data-target');
      switchTab(target);
    }
  });

  function switchTab(tabId) {
    // Set sidebar button active state
    tabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Set panel active state
    panels.forEach(panel => {
      if (panel.id === `${tabId}Panel`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Set Header Title
    if (tabTitleEl) {
      const btnMap = {
        overview: 'Overview Statistics',
        settings: 'Settings',
        appointments: 'Manage Appointments',
        users: 'User Management',
        media: 'Media Library',
        posts: 'Upload Feed Posts',
        products: 'Manage Products catalog',
        blogs: 'Manage Wellness Blogs',
        success: 'Manage Success Stories',
        queries: 'Contact Queries'
      };
      tabTitleEl.innerText = btnMap[tabId] || 'Dashboard';
    }

    // Trigger reload lists if needed
    if (tabId === 'overview') loadDashboardStats();
    if (tabId === 'appointments') loadAppointmentsList();
    if (tabId === 'users') loadUsersList();
    if (tabId === 'media') loadMediaList();
  }
}

/* --- Global Alerts Helpers --- */
function showAlert(type, message) {
  const successAlert = document.getElementById('globalSuccessAlert');
  const errorAlert = document.getElementById('globalErrorAlert');
  
  if (type === 'success') {
    successAlert.innerText = message;
    successAlert.style.display = 'flex';
    setTimeout(() => successAlert.style.display = 'none', 4000);
  } else {
    errorAlert.innerText = message;
    errorAlert.style.display = 'flex';
    setTimeout(() => errorAlert.style.display = 'none', 4000);
  }
}

/* --- 4. Site Configuration Manager Form Logic --- */
function initSettingsTab() {
  const settingsForm = document.getElementById('settingsForm');
  if (!settingsForm) return;

  const homeHeroTitle = document.getElementById('homeHeroTitle');
  const homeHeroSubtitle = document.getElementById('homeHeroSubtitle');
  const homeHeroImageFile = document.getElementById('homeHeroImageFile');
  
  const contactPhone = document.getElementById('contactPhone');
  const contactEmail = document.getElementById('contactEmail');
  const contactAddress = document.getElementById('contactAddress');
  const operatingHours = document.getElementById('operatingHours');

  const aboutHeroTitle = document.getElementById('aboutHeroTitle');
  const aboutHeroSubtitle = document.getElementById('aboutHeroSubtitle');
  const aboutMainContent = document.getElementById('aboutMainContent');
  const aboutMission = document.getElementById('aboutMission');
  const aboutVision = document.getElementById('aboutVision');
  const aboutExperienceYears = document.getElementById('aboutExperienceYears');

  // Load current values
  const loadConfigCurrent = async () => {
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      if (data.success && data.data) {
        const config = data.data;
        
        homeHeroTitle.value = config.homeHeroTitle || '';
        homeHeroSubtitle.value = config.homeHeroSubtitle || '';
        
        contactPhone.value = config.contactPhone || '';
        contactEmail.value = config.contactEmail || '';
        contactAddress.value = config.contactAddress || '';
        operatingHours.value = config.operatingHours || '';

        aboutHeroTitle.value = config.aboutHeroTitle || '';
        aboutHeroSubtitle.value = config.aboutHeroSubtitle || '';
        aboutMainContent.value = config.aboutMainContent || '';
        aboutMission.value = config.aboutMission || '';
        aboutVision.value = config.aboutVision || '';
        aboutExperienceYears.value = config.aboutExperienceYears || 15;
      }
    } catch (err) {
      console.error('Failed to load current WebConfig content:', err);
    }
  };

  loadConfigCurrent();

  // Handle Save
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('homeHeroTitle', homeHeroTitle.value);
    formData.append('homeHeroSubtitle', homeHeroSubtitle.value);
    if (homeHeroImageFile.files[0]) {
      formData.append('homeHeroImageFile', homeHeroImageFile.files[0]);
    }
    
    formData.append('contactPhone', contactPhone.value);
    formData.append('contactEmail', contactEmail.value);
    formData.append('contactAddress', contactAddress.value);
    formData.append('operatingHours', operatingHours.value);

    formData.append('aboutHeroTitle', aboutHeroTitle.value);
    formData.append('aboutHeroSubtitle', aboutHeroSubtitle.value);
    formData.append('aboutMainContent', aboutMainContent.value);
    formData.append('aboutMission', aboutMission.value);
    formData.append('aboutVision', aboutVision.value);
    formData.append('aboutExperienceYears', parseInt(aboutExperienceYears.value) || 15);

    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: getHeaders(true), // isMultipart = true (leaves Content-Type header unset)
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        showAlert('success', 'Global Site Configuration successfully updated!');
        loadConfigCurrent();
      } else {
        showAlert('error', data.message || 'Failed to update configuration.');
      }
    } catch (err) {
      showAlert('error', 'Server error. Failed to save configuration changes.');
      console.error('Config save error:', err);
    }
  });
}

/* --- 5. Upload Feed Posts Tab Logic --- */
function initPostsTab() {
  const postsForm = document.getElementById('postsForm');
  const postType = document.getElementById('postType');
  const standardMediaFields = document.getElementById('standardMediaFields');
  const transformationMediaFields = document.getElementById('transformationMediaFields');
  const postsListContainer = document.getElementById('postsListContainer');

  if (!postsForm || !postType) return;

  // Featured/Published toggle labels
  const featuredChk = document.getElementById('postFeatured');
  const publishedChk = document.getElementById('postPublished');
  if (featuredChk) featuredChk.addEventListener('change', () => {
    document.getElementById('postFeaturedLabel').textContent = featuredChk.checked ? '⭐ Featured' : 'Not Featured';
  });
  if (publishedChk) publishedChk.addEventListener('change', () => {
    document.getElementById('postPublishedLabel').textContent = publishedChk.checked ? 'Published' : 'Draft (Hidden)';
  });

  // Toggle form fields based on post type
  postType.addEventListener('change', (e) => {
    if (e.target.value === 'transformation') {
      standardMediaFields.style.display = 'none';
      transformationMediaFields.style.display = 'block';
    } else {
      standardMediaFields.style.display = 'block';
      transformationMediaFields.style.display = 'none';
    }
  });

  const catLabels = {
    'weight-loss': 'Weight Loss', 'weight-gain': 'Weight Gain',
    'nutrition-tips': 'Nutrition Tips', 'herbalife-products': 'Herbalife',
    'success-stories': 'Success Stories', 'zumba-classes': 'Zumba'
  };

  const loadPostsList = async () => {
    try {
      // Use admin endpoint to get ALL posts (including drafts)
      const response = await fetch('/api/admin/posts');
      const data = await response.json();

      postsListContainer.innerHTML = '';
      if (data.success && data.data && data.data.length > 0) {
        data.data.forEach(post => {
          const item = document.createElement('div');
          item.className = 'list-item';

          const title = post.title || (post.type === 'transformation' ? `Before/After: ${post.clientName || 'Client'}` : 'Feed Post');
          const captionExcerpt = post.caption ? (post.caption.substring(0, 45) + '...') : '';
          const cat = catLabels[post.category] || post.category || '';
          const featuredBadge = post.featured ? '<span style="background:#ffc107;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:50px;margin-left:6px;">⭐ Featured</span>' : '';
          const statusBadge = post.isPublished !== false
            ? '<span style="background:#10B981;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:50px;margin-left:6px;">Published</span>'
            : '<span style="background:#9CA3AF;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:50px;margin-left:6px;">Draft</span>';

          item.innerHTML = `
            <div class="item-info">
              <h4>${title}${featuredBadge}${statusBadge}</h4>
              <p style="color:#9CA3AF;font-size:0.78rem;">${cat} &bull; ${captionExcerpt}</p>
            </div>
            <div class="item-actions">
              <button class="action-icon-btn btn-edit" data-id="${post._id}"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="action-icon-btn btn-delete" data-id="${post._id}"><i class="fa-solid fa-trash"></i></button>
            </div>`;

          item.querySelector('.btn-edit').dataset.post = JSON.stringify(post);
          postsListContainer.appendChild(item);
        });
      } else {
        postsListContainer.innerHTML = '<p class="text-muted">No feed posts uploaded yet.</p>';
      }
    } catch (err) {
      postsListContainer.innerHTML = '<p class="text-muted">Failed to load posts catalog.</p>';
      console.error('Posts load error:', err);
    }
  };

  loadPostsList();

  // Submit Post Upload Form
  postsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('type', postType.value);
    formData.append('title', document.getElementById('postTitle')?.value || '');
    formData.append('category', document.getElementById('postCategory')?.value || 'nutrition-tips');
    formData.append('featured', document.getElementById('postFeatured')?.checked ? 'true' : 'false');
    formData.append('isPublished', document.getElementById('postPublished')?.checked !== false ? 'true' : 'false');
    formData.append('caption', document.getElementById('postCaption').value);

    if (postType.value === 'transformation') {
      formData.append('clientName', document.getElementById('postClientName').value);
      formData.append('clientDetails', document.getElementById('postClientDetails').value);
      const beforeImg = document.getElementById('postBeforeImage').files[0];
      const afterImg = document.getElementById('postAfterImage').files[0];
      if (beforeImg) formData.append('beforeImage', beforeImg);
      if (afterImg) formData.append('afterImage', afterImg);
    } else {
      const mediaFile = document.getElementById('postMedia').files[0];
      if (mediaFile) formData.append('mediaFile', mediaFile);
    }

    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        showAlert('success', 'Feed post successfully created and published!');
        postsForm.reset();
        if (document.getElementById('postFeatured')) document.getElementById('postFeatured').checked = false;
        if (document.getElementById('postPublished')) document.getElementById('postPublished').checked = true;
        if (document.getElementById('postFeaturedLabel')) document.getElementById('postFeaturedLabel').textContent = 'Not Featured';
        if (document.getElementById('postPublishedLabel')) document.getElementById('postPublishedLabel').textContent = 'Published';
        standardMediaFields.style.display = 'block';
        transformationMediaFields.style.display = 'none';
        loadPostsList();
      } else {
        showAlert('error', data.message || 'Failed to upload post.');
      }
    } catch (err) {
      showAlert('error', 'Server error. Failed to execute upload.');
      console.error('Post submit error:', err);
    }
  });

  // Edit Post Dialog Trigger — use data stored on button
  postsListContainer.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      let post;
      try { post = JSON.parse(editBtn.dataset.post); } catch(err) { return; }

      document.getElementById('editPostId').value = post._id;
      document.getElementById('editPostType').value = post.type;
      document.getElementById('editPostCaption').value = post.caption || '';
      if (document.getElementById('editPostTitle')) document.getElementById('editPostTitle').value = post.title || '';
      if (document.getElementById('editPostCategory')) document.getElementById('editPostCategory').value = post.category || 'nutrition-tips';
      if (document.getElementById('editPostFeatured')) document.getElementById('editPostFeatured').checked = !!post.featured;
      if (document.getElementById('editPostPublished')) document.getElementById('editPostPublished').checked = post.isPublished !== false;

      const editTransFields = document.getElementById('editTransformationFields');
      const editStdFields = document.getElementById('editStandardFields');

      if (post.type === 'transformation') {
        if (editTransFields) editTransFields.style.display = 'block';
        if (editStdFields) editStdFields.style.display = 'none';
        if (document.getElementById('editPostClientName')) document.getElementById('editPostClientName').value = post.clientName || '';
        if (document.getElementById('editPostClientDetails')) document.getElementById('editPostClientDetails').value = post.clientDetails || '';
      } else {
        if (editTransFields) editTransFields.style.display = 'none';
        if (editStdFields) editStdFields.style.display = 'block';
      }

      // Clear file fields
      ['editPostMedia','editPostBeforeImage','editPostAfterImage'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });

      document.getElementById('editPostModal').style.display = 'flex';
    }
  });

  // Close modal
  const editPostModal = document.getElementById('editPostModal');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
  const editPostForm = document.getElementById('editPostForm');

  const closeEditModal = () => { if (editPostModal) editPostModal.style.display = 'none'; };
  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
  if (cancelEditModalBtn) cancelEditModalBtn.addEventListener('click', closeEditModal);

  // Submit Edit Post Form
  if (editPostForm) {
    editPostForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id   = document.getElementById('editPostId').value;
      const type = document.getElementById('editPostType').value;

      const formData = new FormData();
      formData.append('type', type);
      formData.append('caption', document.getElementById('editPostCaption').value);
      if (document.getElementById('editPostTitle')) formData.append('title', document.getElementById('editPostTitle').value);
      if (document.getElementById('editPostCategory')) formData.append('category', document.getElementById('editPostCategory').value);
      if (document.getElementById('editPostFeatured')) formData.append('featured', document.getElementById('editPostFeatured').checked ? 'true' : 'false');
      if (document.getElementById('editPostPublished')) formData.append('isPublished', document.getElementById('editPostPublished').checked ? 'true' : 'false');

      if (type === 'transformation') {
        formData.append('clientName', document.getElementById('editPostClientName')?.value || '');
        formData.append('clientDetails', document.getElementById('editPostClientDetails')?.value || '');
        const beforeImg = document.getElementById('editPostBeforeImage')?.files[0];
        const afterImg  = document.getElementById('editPostAfterImage')?.files[0];
        if (beforeImg) formData.append('beforeImage', beforeImg);
        if (afterImg)  formData.append('afterImage', afterImg);
      } else {
        const mediaFile = document.getElementById('editPostMedia')?.files[0];
        if (mediaFile) formData.append('mediaFile', mediaFile);
      }

      try {
        const response = await fetch(`/api/admin/posts/${id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        const data = await response.json();

        if (data.success) {
          showAlert('success', 'Feed post updated successfully!');
          closeEditModal();
          loadPostsList();
        } else {
          showAlert('error', data.message || 'Failed to update post.');
        }
      } catch (err) {
        showAlert('error', 'Server error. Failed to save post updates.');
        console.error('Post edit error:', err);
      }
    });
  }

  // Delete Post
  postsListContainer.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this post?')) {
        try {
          const response = await fetch(`/api/admin/posts/${id}`, {
            method: 'DELETE', headers: getHeaders()
          });
          const data = await response.json();
          if (data.success) {
            showAlert('success', 'Post successfully deleted!');
            loadPostsList();
          } else {
            showAlert('error', data.message || 'Delete failed.');
          }
        } catch (err) { showAlert('error', 'Network error.'); }
      }
    }
  });
}

/* --- 6. Manage Products Tab Logic --- */
function initProductsTab() {
  const productsForm = document.getElementById('productsForm');
  const productsListContainer = document.getElementById('productsListContainer');
  const editIdInput = document.getElementById('editProductId');
  const submitBtn = document.getElementById('btnSubmitProduct');
  const cancelBtn = document.getElementById('btnCancelEditProduct');
  
  if (!productsForm) return;

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();

      productsListContainer.innerHTML = '';
      if (data.success && data.data && data.data.length > 0) {
        data.data.forEach(product => {
          const item = document.createElement('div');
          item.className = 'list-item';
          item.innerHTML = `
            <div class="item-info">
              <h4>${product.name}</h4>
              <p>₹${product.price || 0}</p>
            </div>
            <div class="item-actions">
              <button class="action-icon-btn btn-edit" data-id="${product._id}"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="action-icon-btn btn-delete" data-id="${product._id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          `;
          productsListContainer.appendChild(item);
        });
      } else {
        productsListContainer.innerHTML = '<p class="text-muted">No products cataloged yet.</p>';
      }
    } catch (err) {
      productsListContainer.innerHTML = '<p class="text-muted">Failed to load catalog.</p>';
    }
  };

  loadProducts();

  // Create or Update Product Submit
  productsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = editIdInput.value;
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('buyLink', document.getElementById('productBuyLink').value);
    formData.append('details', document.getElementById('productDetails').value);
    
    const file = document.getElementById('productImage').files[0];
    if (file) {
      formData.append('productImg', file);
    }

    const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products';
    const method = editId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: getHeaders(true),
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        showAlert('success', editId ? 'Product details updated!' : 'Product added successfully!');
        resetProductForm();
        loadProducts();
      } else {
        showAlert('error', data.message || 'Operation failed.');
      }
    } catch (err) {
      showAlert('error', 'Network error.');
    }
  });

  // Edit / Delete button triggers
  productsListContainer.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      try {
        // Fetch specific product detail
        const response = await fetch('/api/products');
        const data = await response.json();
        const p = data.data.find(item => item._id === id);

        if (p) {
          // Fill form for Edit Mode
          editIdInput.value = p._id;
          document.getElementById('productName').value = p.name;
          document.getElementById('productPrice').value = p.price || 0;
          document.getElementById('productBuyLink').value = p.buyLink;
          document.getElementById('productDetails').value = p.details;
          
          document.getElementById('productFormTitle').innerText = 'Modify Product Details';
          document.getElementById('productFormSubtitle').innerText = 'Make modifications to the listed product card';
          submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Product';
          cancelBtn.style.display = 'inline-flex';
          
          // Image file is not required when editing
          document.getElementById('productImage').required = false;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this product?')) {
        try {
          const response = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await response.json();
          if (data.success) {
            showAlert('success', 'Product deleted successfully.');
            loadProducts();
          } else {
            showAlert('error', data.message || 'Delete failed.');
          }
        } catch (err) {
          showAlert('error', 'Network error.');
        }
      }
    }
  });

  const resetProductForm = () => {
    productsForm.reset();
    editIdInput.value = '';
    document.getElementById('productFormTitle').innerText = 'Add Herbalife Product';
    document.getElementById('productFormSubtitle').innerText = 'List a new product in the store grid.';
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Add Product';
    cancelBtn.style.display = 'none';
  };

  cancelBtn.addEventListener('click', resetProductForm);
}

/* --- 7. Manage Blogs Tab Logic --- */
function initBlogsTab() {
  const blogsForm = document.getElementById('blogsForm');
  const blogsListContainer = document.getElementById('blogsListContainer');
  const editIdInput = document.getElementById('editBlogId');
  const submitBtn = document.getElementById('btnSubmitBlog');
  const cancelBtn = document.getElementById('btnCancelEditBlog');

  if (!blogsForm) return;

  const loadBlogs = async () => {
    try {
      const response = await fetch('/api/blogs');
      const data = await response.json();

      blogsListContainer.innerHTML = '';
      if (data.success && data.data && data.data.length > 0) {
        data.data.forEach(blog => {
          const item = document.createElement('div');
          item.className = 'list-item';
          item.innerHTML = `
            <div class="item-info">
              <h4>${blog.title}</h4>
              <p>${blog.category} | ${blog.readTime}</p>
            </div>
            <div class="item-actions">
              <button class="action-icon-btn btn-edit" data-id="${blog._id}"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="action-icon-btn btn-delete" data-id="${blog._id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          `;
          blogsListContainer.appendChild(item);
        });
      } else {
        blogsListContainer.innerHTML = '<p class="text-muted">No blogs published yet.</p>';
      }
    } catch (err) {
      blogsListContainer.innerHTML = '<p class="text-muted">Failed to load articles list.</p>';
    }
  };

  loadBlogs();

  // Create or Update Blog Submit
  blogsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = editIdInput.value;
    const body = {
      title: document.getElementById('blogTitle').value,
      category: document.getElementById('blogCategory').value,
      readTime: document.getElementById('blogReadTime').value,
      summary: document.getElementById('blogSummary').value,
      content: document.getElementById('blogContent').value
    };

    const url = editId ? `/api/admin/blogs/${editId}` : '/api/admin/blogs';
    const method = editId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (data.success) {
        showAlert('success', editId ? 'Blog article updated!' : 'Blog article published successfully!');
        resetBlogForm();
        loadBlogs();
      } else {
        showAlert('error', data.message || 'Operation failed.');
      }
    } catch (err) {
      showAlert('error', 'Network error.');
    }
  });

  // Edit / Delete buttons triggers
  blogsListContainer.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      try {
        const response = await fetch('/api/blogs');
        const data = await response.json();
        const b = data.data.find(item => item._id === id);

        if (b) {
          editIdInput.value = b._id;
          document.getElementById('blogTitle').value = b.title;
          document.getElementById('blogCategory').value = b.category;
          document.getElementById('blogReadTime').value = b.readTime;
          document.getElementById('blogSummary').value = b.summary;
          document.getElementById('blogContent').value = b.content;

          document.getElementById('blogFormTitle').innerText = 'Modify Blog Article';
          document.getElementById('blogFormSubtitle').innerText = 'Change contents and republish';
          submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Article';
          cancelBtn.style.display = 'inline-flex';
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this article?')) {
        try {
          const response = await fetch(`/api/admin/blogs/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await response.json();
          if (data.success) {
            showAlert('success', 'Blog article deleted.');
            loadBlogs();
          } else {
            showAlert('error', data.message || 'Delete failed.');
          }
        } catch (err) {
          showAlert('error', 'Network error.');
        }
      }
    }
  });

  const resetBlogForm = () => {
    blogsForm.reset();
    editIdInput.value = '';
    document.getElementById('blogFormTitle').innerText = 'Write Wellness Blog';
    document.getElementById('blogFormSubtitle').innerText = 'Post articles or healthy eating suggestions.';
    submitBtn.innerHTML = '<i class="fa-solid fa-feather"></i> Publish Blog';
    cancelBtn.style.display = 'none';
  };

  cancelBtn.addEventListener('click', resetBlogForm);
}

/* --- 8. Manage Success Stories Tab Logic --- */
function initSuccessTab() {
  const successForm = document.getElementById('successForm');
  const successListContainer = document.getElementById('successListContainer');
  
  if (!successForm) return;

  const loadSuccessList = async () => {
    try {
      const response = await fetch('/api/success');
      const data = await response.json();

      successListContainer.innerHTML = '';
      if (data.success && data.data && data.data.length > 0) {
        data.data.forEach(story => {
          const item = document.createElement('div');
          item.className = 'list-item';
          item.innerHTML = `
            <div class="item-info">
              <h4>${story.clientName}</h4>
              <p>${story.clientDetails}</p>
            </div>
            <div class="item-actions">
              <button class="action-icon-btn btn-delete" data-id="${story._id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          `;
          successListContainer.appendChild(item);
        });
      } else {
        successListContainer.innerHTML = '<p class="text-muted">No success stories registered yet.</p>';
      }
    } catch (err) {
      successListContainer.innerHTML = '<p class="text-muted">Failed to load stories.</p>';
    }
  };

  loadSuccessList();

  // Create Success Story (Multipart)
  successForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('clientName', document.getElementById('successClientName').value);
    formData.append('clientDetails', document.getElementById('successClientDetails').value);
    formData.append('testimonial', document.getElementById('successTestimonial').value);
    
    const beforeImg = document.getElementById('successBeforeImg').files[0];
    const afterImg = document.getElementById('successAfterImg').files[0];
    
    if (beforeImg) formData.append('successBefore', beforeImg);
    if (afterImg) formData.append('successAfter', afterImg);

    try {
      const response = await fetch('/api/admin/success', {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        showAlert('success', 'Success story registered successfully!');
        successForm.reset();
        loadSuccessList();
      } else {
        showAlert('error', data.message || 'Operation failed.');
      }
    } catch (err) {
      showAlert('error', 'Network error.');
    }
  });

  // Delete Success Story
  successListContainer.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this success story?')) {
        try {
          const response = await fetch(`/api/admin/success/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await response.json();
          if (data.success) {
            showAlert('success', 'Success story deleted.');
            loadSuccessList();
          } else {
            showAlert('error', data.message || 'Delete failed.');
          }
        } catch (err) {
          showAlert('error', 'Network error.');
        }
      }
    }
  });
}

/* --- 9. Load Dashboard Statistics counts --- */
async function loadDashboardStats() {
  const postsCount = document.getElementById('statPostsCount');
  const productsCount = document.getElementById('statProductsCount');
  const blogsCount = document.getElementById('statBlogsCount');
  const successCount = document.getElementById('statSuccessCount');
  const queriesCount = document.getElementById('statQueriesCount');

  try {
    // 1. Fetch Posts Total count
    const postsRes = await fetch('/api/posts');
    const postsData = await postsRes.json();
    if (postsData.success && postsData.data && postsCount) {
      postsCount.innerText = postsData.data.length;
    }

    // 2. Fetch Products
    const prodRes = await fetch('/api/products');
    const prodData = await prodRes.json();
    if (prodData.success && prodData.data && productsCount) {
      productsCount.innerText = prodData.data.length;
    }

    // 3. Fetch Blogs
    const blogsRes = await fetch('/api/blogs');
    const blogsData = await blogsRes.json();
    if (blogsData.success && blogsData.data && blogsCount) {
      blogsCount.innerText = blogsData.data.length;
    }

    // 4. Fetch Success Stories
    const succRes = await fetch('/api/success');
    const succData = await succRes.json();
    if (succData.success && succData.data && successCount) {
      successCount.innerText = succData.data.length;
    }

    // 5. Fetch Contact Queries
    const queriesRes = await fetch('/api/admin/contacts', {
      headers: getHeaders()
    });
    const queriesData = await queriesRes.json();
    if (Array.isArray(queriesData) && queriesCount) {
      queriesCount.innerText = queriesData.length;
    }

    // 6. Fetch Total Users
    const usersCount = document.getElementById('statUsersCount');
    if (usersCount) {
      const usersRes = await fetch('/api/admin/clients', { headers: getHeaders() });
      const usersData = await usersRes.json();
      if (Array.isArray(usersData)) {
        usersCount.innerText = usersData.length;
      }
    }

    // 7. Fetch Total Appointments
    const appointmentsCount = document.getElementById('statAppointmentsCount');
    if (appointmentsCount) {
      const apptsRes = await fetch('/api/admin/appointments', { headers: getHeaders() });
      const apptsData = await apptsRes.json();
      if (Array.isArray(apptsData)) {
        appointmentsCount.innerText = apptsData.length;
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard summary stats:', err);
  }
}

/* --- 10. Contact Queries Tab Logic --- */
function initQueriesTab() {
  const queriesTableBody = document.getElementById('queriesTableBody');
  const viewQueryModal = document.getElementById('viewQueryModal');
  const closeQueryModalBtn = document.getElementById('closeQueryModalBtn');
  const btnCloseQueryModal = document.getElementById('btnCloseQueryModal');
  const btnDeleteQuery = document.getElementById('btnDeleteQuery');
  const btnRespondQuery = document.getElementById('btnRespondQuery');

  if (!queriesTableBody) return;

  let currentQuery = null;

  const loadContactQueries = async () => {
    try {
      const response = await fetch('/api/admin/contacts', {
        headers: getHeaders()
      });
      const data = await response.json();

      queriesTableBody.innerHTML = '';
      if (Array.isArray(data) && data.length > 0) {
        // Sort queries by date or createdAt descending (newest first)
        const sortedQueries = data.sort((a, b) => {
          return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        });

        sortedQueries.forEach(query => {
          const tr = document.createElement('tr');
          const isResponded = query.responded === true;
          const statusBadge = isResponded
            ? '<span class="badge badge-responded"><i class="fa-solid fa-circle-check"></i> Responded</span>'
            : '<span class="badge badge-pending"><i class="fa-solid fa-circle-notch fa-spin"></i> Pending</span>';
          
          tr.innerHTML = `
            <td style="padding: 12px; font-weight: 600;">${escapeHtml(query.name)}</td>
            <td style="padding: 12px;">${escapeHtml(query.phone || 'N/A')}</td>
            <td style="padding: 12px;">${escapeHtml(query.email)}</td>
            <td style="padding: 12px;">${escapeHtml(query.date)}</td>
            <td style="padding: 12px;">${statusBadge}</td>
            <td style="padding: 12px; text-align: right;">
              <button class="btn btn-secondary btn-action-view" data-id="${query._id}" style="padding: 6px 12px; font-size: 13px;"><i class="fa-solid fa-eye"></i> View</button>
            </td>
          `;
          queriesTableBody.appendChild(tr);
        });
      } else {
        queriesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No contact queries found.</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      queriesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #ef4444;">Failed to load contact queries.</td></tr>`;
    }
  };

  // Escapes HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Load queries initially
  loadContactQueries();

  // Watch for tab switching to load queries
  const sidebarNav = document.getElementById('sidebarNav');
  const tabBtns = sidebarNav.querySelectorAll('.nav-btn:not(.btn-logout)');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('data-tab') === 'queries') {
        loadContactQueries();
      }
    });
  });

  // Also listen to shortcut button click if they trigger queries panel
  document.addEventListener('click', (e) => {
    const shortcutBtn = e.target.closest('.shortcut-btn');
    if (shortcutBtn && shortcutBtn.getAttribute('data-target') === 'queries') {
      loadContactQueries();
    }
  });

  // Open Query modal on view click
  queriesTableBody.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('.btn-action-view');
    if (viewBtn) {
      const id = viewBtn.getAttribute('data-id');
      try {
        const response = await fetch('/api/admin/contacts', {
          headers: getHeaders()
        });
        const queries = await response.json();
        currentQuery = queries.find(q => q._id === id);
        
        if (currentQuery) {
          document.getElementById('queryDetailName').innerText = currentQuery.name;
          document.getElementById('queryDetailPhone').innerText = currentQuery.phone || 'N/A';
          document.getElementById('queryDetailEmail').innerText = currentQuery.email;
          document.getElementById('queryDetailDate').innerText = currentQuery.date;
          
          const isResponded = currentQuery.responded === true;
          const badgeEl = document.getElementById('queryDetailStatus');
          if (isResponded) {
            badgeEl.className = 'badge badge-responded';
            badgeEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Responded';
            btnRespondQuery.style.display = 'none';
          } else {
            badgeEl.className = 'badge badge-pending';
            badgeEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Pending';
            btnRespondQuery.style.display = 'inline-flex';
          }
          
          document.getElementById('queryDetailMessage').innerText = currentQuery.message;
          viewQueryModal.style.display = 'flex';
        }
      } catch (err) {
        showAlert('error', 'Failed to retrieve query details.');
      }
    }
  });

  const closeModal = () => {
    viewQueryModal.style.display = 'none';
    currentQuery = null;
  };

  if (closeQueryModalBtn) closeQueryModalBtn.addEventListener('click', closeModal);
  if (btnCloseQueryModal) btnCloseQueryModal.addEventListener('click', closeModal);

  // Close modal when clicking outside
  viewQueryModal.addEventListener('click', (e) => {
    if (e.target === viewQueryModal) {
      closeModal();
    }
  });

  // Mark as Responded action
  btnRespondQuery.addEventListener('click', async () => {
    if (!currentQuery) return;
    try {
      const response = await fetch(`/api/admin/contacts/${currentQuery._id}/respond`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        showAlert('success', 'Query marked as responded successfully.');
        closeModal();
        loadContactQueries();
        loadDashboardStats();
      } else {
        showAlert('error', data.message || 'Operation failed.');
      }
    } catch (err) {
      showAlert('error', 'Network error.');
    }
  });

  // Delete Query action
  btnDeleteQuery.addEventListener('click', async () => {
    if (!currentQuery) return;
    if (confirm('Are you sure you want to delete this query?')) {
      try {
        const response = await fetch(`/api/admin/contacts/${currentQuery._id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        const data = await response.json();
        if (data.success) {
          showAlert('success', 'Query deleted successfully.');
          closeModal();
          loadContactQueries();
          loadDashboardStats();
        } else {
          showAlert('error', data.message || 'Delete failed.');
        }
      } catch (err) {
        showAlert('error', 'Network error.');
      }
    }
  });
}

/* --- 11. Appointments Tab Controller --- */
function initAppointmentsTab() {
  const rescheduleForm = document.getElementById('rescheduleForm');
  const rescheduleModal = document.getElementById('rescheduleModal');
  const closeRescheduleModalBtn = document.getElementById('closeRescheduleModalBtn');
  const cancelRescheduleModalBtn = document.getElementById('cancelRescheduleModalBtn');

  if (rescheduleForm) {
    rescheduleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('rescheduleApptId').value;
      const date = document.getElementById('rescheduleDate').value;
      const time = document.getElementById('rescheduleTime').value;
      const consultant = document.getElementById('rescheduleConsultant').value;

      try {
        const response = await fetch(`/api/admin/appointments/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ date, time, consultant })
        });
        const data = await response.json();
        if (data.success) {
          showAlert('success', 'Appointment rescheduled successfully!');
          rescheduleModal.style.display = 'none';
          loadAppointmentsList();
          loadDashboardStats();
        } else {
          showAlert('error', data.message || 'Reschedule failed.');
        }
      } catch (err) {
        showAlert('error', 'Network error.');
      }
    });
  }

  const closeModal = () => { if (rescheduleModal) rescheduleModal.style.display = 'none'; };
  if (closeRescheduleModalBtn) closeRescheduleModalBtn.addEventListener('click', closeModal);
  if (cancelRescheduleModalBtn) cancelRescheduleModalBtn.addEventListener('click', closeModal);

  // Expose status update and modal opening helper to global scope for button onclicks
  window.updateApptStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        showAlert('success', `Appointment ${status.toLowerCase()} successfully!`);
        loadAppointmentsList();
        loadDashboardStats();
      } else {
        showAlert('error', data.message || 'Status update failed.');
      }
    } catch (err) {
      showAlert('error', 'Network error.');
    }
  };

  window.openReschedule = (id, currentDate, currentTime, currentConsultant) => {
    document.getElementById('rescheduleApptId').value = id;
    document.getElementById('rescheduleDate').value = currentDate || '';
    document.getElementById('rescheduleTime').value = currentTime || '';
    document.getElementById('rescheduleConsultant').value = currentConsultant || '';
    rescheduleModal.style.display = 'flex';
  };
}

async function loadAppointmentsList() {
  const tableBody = document.getElementById('appointmentsTableBody');
  if (!tableBody) return;

  try {
    const response = await fetch('/api/admin/appointments', { headers: getHeaders() });
    const appts = await response.json();

    tableBody.innerHTML = '';
    if (Array.isArray(appts) && appts.length > 0) {
      appts.forEach(appt => {
        const tr = document.createElement('tr');
        const statusClass = `status-${appt.status.toLowerCase()}`;
        const actions = appt.status === 'Pending' ? `
          <button class="btn btn-gradient" style="padding: 6px 12px; font-size: 12px; background: #10b981; border: none; color: white;" onclick="updateApptStatus('${appt._id}', 'Approved')"><i class="fa-solid fa-check"></i> Approve</button>
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="openReschedule('${appt._id}', '${appt.date}', '${appt.time}', '${appt.consultant}')"><i class="fa-solid fa-clock"></i> Reschedule</button>
          <button class="btn" style="padding: 6px 12px; font-size: 12px; background: #ef4444; border: none; color: white;" onclick="updateApptStatus('${appt._id}', 'Cancelled')"><i class="fa-solid fa-xmark"></i> Cancel</button>
        ` : '—';

        tr.innerHTML = `
          <td style="padding: 12px; font-weight: 600;">${appt.customerName}</td>
          <td style="padding: 12px;">${appt.customerEmail}</td>
          <td style="padding: 12px;">${appt.service}</td>
          <td style="padding: 12px;">${appt.date}</td>
          <td style="padding: 12px;">${appt.time}</td>
          <td style="padding: 12px;">${appt.consultant}</td>
          <td style="padding: 12px;"><span class="status-pill ${statusClass}">${appt.status}</span></td>
          <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">${actions}</td>
        `;
        tableBody.appendChild(tr);
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No appointments booked yet.</td></tr>`;
    }
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #ef4444;">Failed to load appointments list.</td></tr>`;
  }
}

/* --- 12. User Management Tab Controller --- */
function initUsersTab() {
  window.toggleUserBlock = async (id, currentBlocked) => {
    const action = currentBlocked ? 'unblock' : 'block';
    if (confirm(`Are you sure you want to ${action} this client?`)) {
      try {
        const response = await fetch(`/api/admin/clients/${id}/${action}`, {
          method: 'POST',
          headers: getHeaders()
        });
        const data = await response.json();
        if (data.success) {
          showAlert('success', `User successfully ${action}ed!`);
          loadUsersList();
        } else {
          showAlert('error', data.message || 'Operation failed.');
        }
      } catch (err) {
        showAlert('error', 'Network error.');
      }
    }
  };

  window.deleteUser = async (id) => {
    if (confirm('Are you sure you want to permanently delete this client? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/clients/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        const data = await response.json();
        if (data.success) {
          showAlert('success', 'User deleted successfully.');
          loadUsersList();
          loadDashboardStats();
        } else {
          showAlert('error', data.message || 'Delete failed.');
        }
      } catch (err) {
        showAlert('error', 'Network error.');
      }
    }
  };
}

async function loadUsersList() {
  const tableBody = document.getElementById('usersTableBody');
  if (!tableBody) return;

  try {
    const response = await fetch('/api/admin/clients', { headers: getHeaders() });
    const users = await response.json();

    tableBody.innerHTML = '';
    if (Array.isArray(users) && users.length > 0) {
      users.forEach(user => {
        const tr = document.createElement('tr');
        const heightM = user.height / 100;
        const bmi = (user.height && user.weight) ? (user.weight / (heightM * heightM)).toFixed(1) : '—';
        const isBlocked = user.isBlocked === true;
        const statusBadge = isBlocked 
          ? '<span class="status-pill status-cancelled">Blocked</span>'
          : '<span class="status-pill status-approved">Active</span>';
        
        const blockBtnText = isBlocked ? '<i class="fa-solid fa-unlock"></i> Unblock' : '<i class="fa-solid fa-ban"></i> Block';
        const blockBtnColor = isBlocked ? '#10b981' : '#f59e0b';

        tr.innerHTML = `
          <td style="padding: 12px; font-weight: 600;">${user.name}</td>
          <td style="padding: 12px;">${user.email}</td>
          <td style="padding: 12px;">${user.phone || '—'}</td>
          <td style="padding: 12px;">${user.height ? user.height + ' cm' : '—'}</td>
          <td style="padding: 12px;">${user.weight ? user.weight + ' kg' : '—'}</td>
          <td style="padding: 12px; font-weight: bold;">${bmi}</td>
          <td style="padding: 12px;">${statusBadge}</td>
          <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn" style="padding: 6px 12px; font-size: 12px; background: ${blockBtnColor}; border: none; color: white;" onclick="toggleUserBlock('${user._id}', ${isBlocked})">${blockBtnText}</button>
            <button class="btn" style="padding: 6px 12px; font-size: 12px; background: #ef4444; border: none; color: white;" onclick="deleteUser('${user._id}')"><i class="fa-solid fa-trash"></i> Delete</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No client users registered yet.</td></tr>`;
    }
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #ef4444;">Failed to load users list.</td></tr>`;
  }
}

/* --- 13. Media Library Tab Controller --- */
function initMediaTab() {
  const mediaUploadForm = document.getElementById('mediaUploadForm');
  if (mediaUploadForm) {
    mediaUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('mediaLibraryFile');
      if (!fileInput.files[0]) return;

      const formData = new FormData();
      formData.append('mediaFile', fileInput.files[0]);

      try {
        const response = await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          showAlert('success', 'Media file uploaded successfully!');
          mediaUploadForm.reset();
          loadMediaList();
        } else {
          showAlert('error', data.message || 'Upload failed.');
        }
      } catch (err) {
        showAlert('error', 'Network error.');
      }
    });
  }

  window.deleteMediaFile = async (filename) => {
    if (confirm(`Are you sure you want to delete the file "${filename}"?`)) {
      try {
        const response = await fetch(`/api/admin/media/${filename}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        const data = await response.json();
        if (data.success) {
          showAlert('success', 'File deleted successfully.');
          loadMediaList();
        } else {
          showAlert('error', data.message || 'Delete failed.');
        }
      } catch (err) {
        showAlert('error', 'Network error.');
      }
    }
  };

  window.copyMediaUrl = (url) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      showAlert('success', 'Media URL copied to clipboard!');
    }).catch(() => {
      // Fallback
      const el = document.createElement('textarea');
      el.value = fullUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showAlert('success', 'Media URL copied to clipboard!');
    });
  };
}

async function loadMediaList() {
  const grid = document.getElementById('mediaLibraryGrid');
  if (!grid) return;

  try {
    const response = await fetch('/api/admin/media', { headers: getHeaders() });
    const mediaList = await response.json();

    grid.innerHTML = '';
    if (Array.isArray(mediaList) && mediaList.length > 0) {
      mediaList.forEach(file => {
        const card = document.createElement('div');
        card.className = 'media-card';

        const isVideo = file.name.match(/\.(mp4|mov|avi|webm)$/i);
        let previewHtml = '';
        if (isVideo) {
          previewHtml = `<video src="${file.url}" muted preload="metadata"></video>`;
        } else {
          previewHtml = `<img src="${file.url}" alt="${file.name}">`;
        }

        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

        card.innerHTML = `
          <div class="media-preview-container">
            ${previewHtml}
          </div>
          <div class="media-details">
            <span class="media-name" title="${file.name}">${file.name}</span>
            <span class="media-size">${sizeMB} MB</span>
          </div>
          <div class="media-actions">
            <button class="btn btn-secondary" onclick="copyMediaUrl('${file.url}')"><i class="fa-solid fa-copy"></i> URL</button>
            <button class="btn" style="background: #ef4444; border: none; color: white;" onclick="deleteMediaFile('${file.name}')"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        `;
        grid.appendChild(card);
      });
    } else {
      grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 24px;">No media files uploaded yet.</p>';
    }
  } catch (err) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 24px; color: #ef4444;">Failed to load media gallery.</p>';
  }
}

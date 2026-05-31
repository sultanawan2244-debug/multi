(function() {
  'use strict';

  const STORAGE_KEY = 'alitools_external_links';
  const ADMIN_USER = 'YWxpQDI2MDI4Ng==';
  const ADMIN_PASS = 'cmF6YUAyNjAyODZA';

  function getLinks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveLinks(links) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }

  window.adminLogin = function(e) {
    if (e) e.preventDefault();
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value;
    const errEl = document.getElementById('loginError');

    if (btoa(user) === ADMIN_USER && btoa(pass) === ADMIN_PASS) {
      sessionStorage.setItem('admin_logged_in', '1');
      document.getElementById('loginView').style.display = 'none';
      document.getElementById('dashboardView').style.display = '';
      renderLinks();
      errEl.style.display = 'none';
    } else {
      errEl.textContent = 'Invalid username or password';
      errEl.style.display = '';
    }
    return false;
  };

  window.adminLogout = function() {
    sessionStorage.removeItem('admin_logged_in');
    document.getElementById('loginView').style.display = '';
    document.getElementById('dashboardView').style.display = 'none';
  };

  window.addLink = function() {
    const nameEl = document.getElementById('linkName');
    const urlEl = document.getElementById('linkUrl');
    const errEl = document.getElementById('addError');
    const name = nameEl.value.trim();
    const url = urlEl.value.trim();

    if (!name || !url) {
      errEl.textContent = 'Please fill in both name and URL.';
      errEl.style.display = '';
      return;
    }

    try {
      new URL(url);
    } catch {
      errEl.textContent = 'Please enter a valid URL (include https://).';
      errEl.style.display = '';
      return;
    }

    const links = getLinks();
    links.push({ name: name, url: url, id: Date.now() });
    saveLinks(links);
    nameEl.value = '';
    urlEl.value = '';
    errEl.style.display = 'none';
    renderLinks();
  };

  window.deleteLink = function(id) {
    let links = getLinks();
    links = links.filter(function(l) { return l.id !== id; });
    saveLinks(links);
    renderLinks();
  };

  function renderLinks() {
    const container = document.getElementById('linksContainer');
    const links = getLinks();

    if (links.length === 0) {
      container.innerHTML = '<p class="empty-state">No links added yet.</p>';
      return;
    }

    var html = '<div class="link-table"><div class="link-table-header"><span>Name</span><span>URL</span><span>Action</span></div>';
    for (var i = 0; i < links.length; i++) {
      html += '<div class="link-table-row">';
      html += '<span class="link-name">' + escapeHtml(links[i].name) + '</span>';
      html += '<span class="link-url">' + escapeHtml(links[i].url) + '</span>';
      html += '<span><button class="btn btn-danger btn-sm" onclick="deleteLink(' + links[i].id + ')">Delete</button></span>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('admin_logged_in') === '1') {
      document.getElementById('loginView').style.display = 'none';
      document.getElementById('dashboardView').style.display = '';
      renderLinks();
    }
  });
})();

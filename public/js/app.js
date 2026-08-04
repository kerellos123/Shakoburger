(function () {
  if (!API.token()) {
    location.href = 'index.html';
    return;
  }

  const user = API.currentUser();
  if (user) {
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userAvatar').textContent = (user.full_name || '?').trim().charAt(0).toUpperCase();
  }

  document.getElementById('logoutBtn').addEventListener('click', () => API.logout());
  document.getElementById('langBtn').addEventListener('click', () => I18N.toggle());

  const TITLE_KEYS = {
    dashboard: 'dashboard_title',
    tickets: 'tickets_title',
    customers: 'customers_title',
    accounts: 'accounts_title',
    airlines: 'airlines_title',
    currencies: 'currencies_title',
    reports: 'reports_title',
  };

  function setActiveNav(route) {
    document.querySelectorAll('.nav-list a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-route') === route);
    });
  }

  async function router() {
    const hash = location.hash.replace('#/', '') || 'dashboard';
    const route = TITLE_KEYS[hash] ? hash : 'dashboard';
    setActiveNav(route);
    document.getElementById('pageTitle').textContent = I18N.t(TITLE_KEYS[route]);
    const content = document.getElementById('content');
    content.innerHTML = '<div class="spinner"></div>';
    const page = window.Pages && window.Pages[route];
    if (!page) {
      content.innerHTML = '<div class="empty-state">404</div>';
      return;
    }
    try {
      await page.render(content);
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><div class="ic">⚠️</div>${UI.esc(UI.errorMsg(err))}</div>`;
    }
  }

  window.onLangChange = () => {
    const hash = location.hash.replace('#/', '') || 'dashboard';
    const route = TITLE_KEYS[hash] ? hash : 'dashboard';
    document.getElementById('pageTitle').textContent = I18N.t(TITLE_KEYS[route]);
    router();
  };

  window.addEventListener('hashchange', router);
  document.addEventListener('DOMContentLoaded', router);
  if (document.readyState !== 'loading') router();
})();

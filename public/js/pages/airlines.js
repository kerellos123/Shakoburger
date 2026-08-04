window.Pages = window.Pages || {};

window.Pages.airlines = (function () {
  function openForm(item) {
    item = item || {};
    UI.openModal(`
      <div class="modal-head"><h3>${item.id ? I18N.t('edit') : I18N.t('new_airline')}</h3>
        <button class="modal-close" onclick="UI.closeModal()">&times;</button></div>
      <form id="airlineForm">
        <div class="field"><label data-i18n="code">${I18N.t('code')}</label>
          <input type="text" id="a_code" value="${UI.esc(item.code || '')}" ${item.id ? 'disabled' : ''} required></div>
        <div class="field"><label data-i18n="name_ar">${I18N.t('name_ar')}</label>
          <input type="text" id="a_name_ar" value="${UI.esc(item.name_ar || '')}" required></div>
        <div class="field"><label data-i18n="name_en">${I18N.t('name_en')}</label>
          <input type="text" id="a_name_en" value="${UI.esc(item.name_en || '')}" required></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="UI.closeModal()" data-i18n="cancel">${I18N.t('cancel')}</button>
          <button type="submit" class="btn btn-gold" data-i18n="save">${I18N.t('save')}</button>
        </div>
      </form>
    `);
    document.getElementById('airlineForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        code: document.getElementById('a_code').value.trim(),
        name_ar: document.getElementById('a_name_ar').value.trim(),
        name_en: document.getElementById('a_name_en').value.trim(),
      };
      try {
        if (item.id) await API.put(`/airlines/${item.id}`, payload);
        else await API.post('/airlines', payload);
        UI.closeModal();
        UI.toast(I18N.t('saved_ok'), 'ok');
        window.Pages.airlines.refresh();
      } catch (err) {
        UI.toast(UI.errorMsg(err), 'err');
      }
    });
  }

  async function renderTable() {
    const tbody = document.getElementById('airlinesTbody');
    const rows = await API.get('/airlines');
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${I18N.t('no_data')}</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((a) => `
      <tr>
        <td>${UI.esc(a.code)}</td>
        <td>${UI.esc(a.name_ar)}</td>
        <td>${UI.esc(a.name_en)}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" data-edit="${a.id}">${I18N.t('edit')}</button>
            <button class="btn btn-danger btn-sm" data-del="${a.id}">${I18N.t('delete')}</button>
          </div>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => {
      const a = rows.find((x) => String(x.id) === btn.getAttribute('data-edit'));
      openForm(a);
    }));
    tbody.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm(I18N.t('delete_confirm'))) return;
      try {
        await API.del(`/airlines/${btn.getAttribute('data-del')}`);
        renderTable();
      } catch (err) {
        UI.toast(UI.errorMsg(err), 'err');
      }
    }));
  }

  return {
    async render(el) {
      el.innerHTML = `
        <div class="card">
          <div class="toolbar">
            <div style="flex:1;"></div>
            <button class="btn btn-gold" id="newAirlineBtn" data-i18n="new_airline">${I18N.t('new_airline')}</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th data-i18n="code">${I18N.t('code')}</th>
                <th data-i18n="name_ar">${I18N.t('name_ar')}</th>
                <th data-i18n="name_en">${I18N.t('name_en')}</th>
                <th data-i18n="actions">${I18N.t('actions')}</th>
              </tr></thead>
              <tbody id="airlinesTbody"></tbody>
            </table>
          </div>
        </div>
      `;
      document.getElementById('newAirlineBtn').addEventListener('click', () => openForm(null));
      await renderTable();
    },
    refresh: renderTable,
  };
})();

window.Pages = window.Pages || {};

window.Pages.currencies = (function () {
  function openForm(item) {
    item = item || {};
    UI.openModal(`
      <div class="modal-head"><h3>${item.id ? I18N.t('update_rate') : I18N.t('new_currency')}</h3>
        <button class="modal-close" onclick="UI.closeModal()">&times;</button></div>
      <form id="currForm">
        <div class="grid-2">
          <div class="field"><label data-i18n="code">${I18N.t('code')}</label>
            <input type="text" id="c_code" value="${UI.esc(item.code || '')}" ${item.id ? 'disabled' : ''} required></div>
          <div class="field"><label data-i18n="symbol">${I18N.t('symbol')}</label>
            <input type="text" id="c_symbol" value="${UI.esc(item.symbol || '')}"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label data-i18n="name_ar">${I18N.t('name_ar')}</label>
            <input type="text" id="c_name_ar" value="${UI.esc(item.name_ar || '')}" required></div>
          <div class="field"><label data-i18n="name_en">${I18N.t('name_en')}</label>
            <input type="text" id="c_name_en" value="${UI.esc(item.name_en || '')}" required></div>
        </div>
        <div class="field"><label data-i18n="ex_rate">${I18N.t('ex_rate')}</label>
          <input type="number" step="0.0001" id="c_rate" value="${item.exchange_rate ?? 1}" ${item.is_base ? 'disabled' : ''} required></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="UI.closeModal()" data-i18n="cancel">${I18N.t('cancel')}</button>
          <button type="submit" class="btn btn-gold" data-i18n="save">${I18N.t('save')}</button>
        </div>
      </form>
    `);
    document.getElementById('currForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        code: document.getElementById('c_code').value.trim(),
        symbol: document.getElementById('c_symbol').value.trim(),
        name_ar: document.getElementById('c_name_ar').value.trim(),
        name_en: document.getElementById('c_name_en').value.trim(),
        exchange_rate: document.getElementById('c_rate').value,
      };
      try {
        if (item.id) await API.put(`/currencies/${item.id}`, payload);
        else await API.post('/currencies', payload);
        UI.closeModal();
        UI.toast(I18N.t('saved_ok'), 'ok');
        window.Pages.currencies.refresh();
      } catch (err) {
        UI.toast(UI.errorMsg(err), 'err');
      }
    });
  }

  async function renderTable() {
    const tbody = document.getElementById('currTbody');
    const rows = await API.get('/currencies');
    tbody.innerHTML = rows.map((c) => `
      <tr>
        <td>${UI.esc(c.code)} ${c.is_base ? `<span class="badge badge-gold">${I18N.t('base_currency')}</span>` : ''}</td>
        <td>${UI.esc(c.symbol)}</td>
        <td>${UI.esc(c.name_ar)}</td>
        <td>${UI.esc(c.name_en)}</td>
        <td class="right-num">${c.exchange_rate}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" data-edit="${c.id}">${I18N.t('edit')}</button>
            ${c.is_base ? '' : `<button class="btn btn-danger btn-sm" data-del="${c.id}">${I18N.t('delete')}</button>`}
          </div>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => {
      const c = rows.find((x) => String(x.id) === btn.getAttribute('data-edit'));
      openForm(c);
    }));
    tbody.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm(I18N.t('delete_confirm'))) return;
      try {
        await API.del(`/currencies/${btn.getAttribute('data-del')}`);
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
            <button class="btn btn-gold" id="newCurrBtn" data-i18n="new_currency">${I18N.t('new_currency')}</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th data-i18n="code">${I18N.t('code')}</th>
                <th data-i18n="symbol">${I18N.t('symbol')}</th>
                <th data-i18n="name_ar">${I18N.t('name_ar')}</th>
                <th data-i18n="name_en">${I18N.t('name_en')}</th>
                <th data-i18n="ex_rate">${I18N.t('ex_rate')}</th>
                <th data-i18n="actions">${I18N.t('actions')}</th>
              </tr></thead>
              <tbody id="currTbody"></tbody>
            </table>
          </div>
        </div>
      `;
      document.getElementById('newCurrBtn').addEventListener('click', () => openForm(null));
      await renderTable();
    },
    refresh: renderTable,
  };
})();

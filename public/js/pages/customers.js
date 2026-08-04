window.Pages = window.Pages || {};

window.Pages.customers = (function () {
  let currencies = [];

  function formHtml(c) {
    c = c || {};
    return `
      <form id="custForm">
        <div class="grid-2">
          <div class="field"><label data-i18n="name_ar">${I18N.t('name_ar')}</label>
            <input type="text" id="f_name_ar" value="${UI.esc(c.name_ar || '')}" required></div>
          <div class="field"><label data-i18n="name_en">${I18N.t('name_en')}</label>
            <input type="text" id="f_name_en" value="${UI.esc(c.name_en || '')}" required></div>
        </div>
        <div class="grid-2">
          <div class="field"><label data-i18n="phone">${I18N.t('phone')}</label>
            <input type="text" id="f_phone" value="${UI.esc(c.phone || '')}"></div>
          <div class="field"><label data-i18n="email">${I18N.t('email')}</label>
            <input type="email" id="f_email" value="${UI.esc(c.email || '')}"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label data-i18n="credit_limit">${I18N.t('credit_limit')}</label>
            <input type="number" step="0.01" id="f_credit" value="${c.credit_limit ?? 0}"></div>
          <div class="field"><label data-i18n="default_currency">${I18N.t('default_currency')}</label>
            <select id="f_curr"><option value="">-</option>${currencies.map((cu) => `<option value="${cu.id}" ${String(cu.id)===String(c.default_currency_id)?'selected':''}>${UI.esc(cu.code)} - ${UI.esc(UI.localizedName(cu))}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label data-i18n="notes">${I18N.t('notes')}</label>
          <textarea id="f_notes" rows="2">${UI.esc(c.notes || '')}</textarea></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="UI.closeModal()" data-i18n="cancel">${I18N.t('cancel')}</button>
          <button type="submit" class="btn btn-gold" data-i18n="save">${I18N.t('save')}</button>
        </div>
      </form>
    `;
  }

  function openForm(customer) {
    UI.openModal(`
      <div class="modal-head"><h3>${customer ? I18N.t('edit') : I18N.t('new_customer')}</h3>
        <button class="modal-close" onclick="UI.closeModal()">&times;</button></div>
      ${formHtml(customer)}
    `);
    document.getElementById('custForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name_ar: document.getElementById('f_name_ar').value.trim(),
        name_en: document.getElementById('f_name_en').value.trim(),
        phone: document.getElementById('f_phone').value.trim(),
        email: document.getElementById('f_email').value.trim(),
        credit_limit: document.getElementById('f_credit').value,
        default_currency_id: document.getElementById('f_curr').value || null,
        notes: document.getElementById('f_notes').value.trim(),
      };
      try {
        if (customer) await API.put(`/customers/${customer.id}`, payload);
        else await API.post('/customers', payload);
        UI.closeModal();
        UI.toast(I18N.t('saved_ok'), 'ok');
        window.Pages.customers.refresh();
      } catch (err) {
        UI.toast(UI.errorMsg(err), 'err');
      }
    });
  }

  async function openStatement(customer) {
    const data = await API.get(`/customers/${customer.id}/ledger`);
    const rows = data.entries.map((e) => `
      <tr>
        <td>${UI.esc(e.entry_date)}</td>
        <td>${UI.esc(e.voucher_no ? `${e.voucher_no} - ${e.pax_name}` : e.description)}</td>
        <td class="right-num">${e.entry_type === 'debit' ? UI.money(e.amount, e.currency_symbol) : ''}</td>
        <td class="right-num">${e.entry_type === 'credit' ? UI.money(e.amount, e.currency_symbol) : ''}</td>
      </tr>
    `).join('');
    const balances = data.balances.map((b) => `<span class="badge ${b.balance>0?'badge-red':'badge-green'}">${UI.money(b.balance, b.symbol)}</span>`).join(' ');
    UI.openModal(`
      <div class="modal-head"><h3>${I18N.t('statement_for')} - ${UI.esc(UI.localizedName(customer))}</h3>
        <button class="modal-close" onclick="UI.closeModal()">&times;</button></div>
      <div style="margin-bottom:12px;">${balances || `<span class="muted">${I18N.t('no_data')}</span>`}</div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th data-i18n="date">${I18N.t('date')}</th>
            <th data-i18n="description">${I18N.t('description')}</th>
            <th data-i18n="debit_short">${I18N.t('debit_short')}</th>
            <th data-i18n="credit_short">${I18N.t('credit_short')}</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="4" class="empty-state">${I18N.t('no_data')}</td></tr>`}</tbody>
        </table>
      </div>
    `);
  }

  async function renderTable() {
    const tbody = document.getElementById('custTbody');
    tbody.innerHTML = `<tr><td colspan="7"><div class="spinner"></div></td></tr>`;
    const q = document.getElementById('custSearch')?.value || '';
    const rows = await API.get(`/customers?q=${encodeURIComponent(q)}`);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${I18N.t('no_data')}</td></tr>`;
      return;
    }
    const withBalances = await Promise.all(rows.map(async (c) => {
      const full = await API.get(`/customers/${c.id}`);
      return full;
    }));
    tbody.innerHTML = withBalances.map((c) => `
      <tr>
        <td>${UI.esc(c.code)}</td>
        <td>${UI.esc(UI.localizedName(c))}</td>
        <td>${UI.esc(c.phone || '-')}</td>
        <td>${UI.esc(c.email || '-')}</td>
        <td>${(c.balances || []).map((b) => `<span class="badge ${b.balance>0?'badge-red':'badge-green'}">${UI.money(b.balance, b.symbol)}</span>`).join(' ') || '<span class="muted">-</span>'}</td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" data-stmt="${c.id}">${I18N.t('view_statement')}</button>
            <button class="btn btn-outline btn-sm" data-edit="${c.id}">${I18N.t('edit')}</button>
            <button class="btn btn-danger btn-sm" data-del="${c.id}">${I18N.t('delete')}</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-stmt]').forEach((btn) => btn.addEventListener('click', () => {
      const c = withBalances.find((x) => String(x.id) === btn.getAttribute('data-stmt'));
      openStatement(c);
    }));
    tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => {
      const c = withBalances.find((x) => String(x.id) === btn.getAttribute('data-edit'));
      openForm(c);
    }));
    tbody.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm(I18N.t('delete_confirm'))) return;
      try {
        await API.del(`/customers/${btn.getAttribute('data-del')}`);
        UI.toast(I18N.t('saved_ok'), 'ok');
        renderTable();
      } catch (err) {
        UI.toast(UI.errorMsg(err), 'err');
      }
    }));
  }

  return {
    async render(el) {
      currencies = await API.get('/currencies');
      el.innerHTML = `
        <div class="card">
          <div class="toolbar">
            <input class="search-input" id="custSearch" data-i18n-placeholder="search" placeholder="${I18N.t('search')}">
            <button class="btn btn-gold" id="newCustBtn" data-i18n="new_customer">${I18N.t('new_customer')}</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th data-i18n="customer_code">${I18N.t('customer_code')}</th>
                <th data-i18n="customer">${I18N.t('customer')}</th>
                <th data-i18n="phone">${I18N.t('phone')}</th>
                <th data-i18n="email">${I18N.t('email')}</th>
                <th data-i18n="balances">${I18N.t('balances')}</th>
                <th data-i18n="actions">${I18N.t('actions')}</th>
              </tr></thead>
              <tbody id="custTbody"></tbody>
            </table>
          </div>
        </div>
      `;
      document.getElementById('newCustBtn').addEventListener('click', () => openForm(null));
      document.getElementById('custSearch').addEventListener('input', UI.debounce(renderTable, 350));
      await renderTable();
    },
    refresh: renderTable,
  };
})();

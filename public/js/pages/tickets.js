window.Pages = window.Pages || {};

window.Pages.tickets = (function () {
  let airlines = [];
  let customers = [];
  let currencies = [];
  let currentFilters = {};

  function taxFieldsHtml(values = {}) {
    const fields = ['tax_sd', 'tax_yr', 'tax_yq', 'tax_xt', 'tax_qr', 'tax_eq', 'tax_jk', 'tax_ny'];
    const labels = { tax_sd: 'SD', tax_yr: 'YR', tax_yq: 'YQ', tax_xt: 'XT', tax_qr: 'QR', tax_eq: 'EQ', tax_jk: 'JK', tax_ny: 'NY' };
    return `
      <div class="field"><label>${I18N.t('taxes')}</label>
        <div class="grid-4" style="gap:8px;">
          ${fields.map((f) => `
            <div>
              <label style="font-size:0.7rem;">${labels[f]}</label>
              <input type="number" step="0.01" id="f_${f}" value="${values[f] ?? 0}">
            </div>`).join('')}
        </div>
      </div>`;
  }

  function optionsHtml(list, selectedId, labelFn) {
    return `<option value="">-</option>` + list.map((x) =>
      `<option value="${x.id}" ${String(x.id) === String(selectedId) ? 'selected' : ''}>${UI.esc(labelFn(x))}</option>`
    ).join('');
  }

  async function loadLookups() {
    [airlines, customers, currencies] = await Promise.all([
      API.get('/airlines'),
      API.get('/customers'),
      API.get('/currencies'),
    ]);
  }

  function airlineLabel(a) { return `${a.code} - ${UI.localizedName(a)}`; }
  function customerLabel(c) { return `${c.code} - ${UI.localizedName(c)}`; }
  function currencyLabel(c) { return `${c.code} - ${UI.localizedName(c)}`; }

  function formHtml(ticket) {
    const t = ticket || {};
    return `
      <form id="ticketForm">
        <div class="grid-3">
          <div class="field"><label data-i18n="ticket_date">${I18N.t('ticket_date')}</label>
            <input type="date" id="f_date" value="${t.ticket_date || new Date().toISOString().slice(0,10)}" required></div>
          <div class="field"><label data-i18n="airline">${I18N.t('airline')}</label>
            <select id="f_airline">${optionsHtml(airlines, t.airline_id, airlineLabel)}</select></div>
          <div class="field"><label data-i18n="customer">${I18N.t('customer')}</label>
            <select id="f_customer" required>${optionsHtml(customers, t.customer_id, customerLabel)}</select></div>
        </div>

        <div class="grid-3">
          <div class="field"><label data-i18n="pax_name">${I18N.t('pax_name')}</label>
            <input type="text" id="f_pax" value="${UI.esc(t.pax_name || '')}" required></div>
          <div class="field"><label data-i18n="tkt_no">${I18N.t('tkt_no')}</label>
            <input type="text" id="f_tktno" value="${UI.esc(t.tkt_no || '')}"></div>
          <div class="field"><label data-i18n="fare">${I18N.t('fare')}</label>
            <input type="number" step="0.01" id="f_fare" value="${t.fare ?? 0}" required></div>
        </div>

        <div class="grid-3">
          <div class="field"><label data-i18n="route">${I18N.t('route')}</label>
            <input type="text" id="f_route" placeholder="KRT-JED-KRT" value="${UI.esc(t.route || '')}"></div>
          <div class="field"><label data-i18n="class">${I18N.t('class')}</label>
            <input type="text" id="f_class" value="${UI.esc(t.class || '')}"></div>
          <div class="field"><label data-i18n="sign">${I18N.t('sign')}</label>
            <input type="text" id="f_sign" value="${UI.esc(t.sign || '')}"></div>
        </div>

        ${taxFieldsHtml(t)}

        <div class="grid-4">
          <div class="field"><label data-i18n="comm_percent">${I18N.t('comm_percent')}</label>
            <input type="number" step="0.01" id="f_commpct" value="${t.comm_percent ?? 0}"></div>
          <div class="field"><label data-i18n="comm_amount">${I18N.t('comm_amount')}</label>
            <input type="number" step="0.01" id="f_commamt" placeholder="auto" value="${t.id ? (t.comm_amount ?? '') : ''}"></div>
          <div class="field"><label data-i18n="dis_percent">${I18N.t('dis_percent')}</label>
            <input type="number" step="0.01" id="f_dispct" value="${t.discount_percent ?? 0}"></div>
          <div class="field"><label data-i18n="dis_amount">${I18N.t('dis_amount')}</label>
            <input type="number" step="0.01" id="f_disamt" placeholder="auto" value="${t.id ? (t.discount_amount ?? '') : ''}"></div>
        </div>

        <div class="grid-4">
          <div class="field"><label data-i18n="extra_percent">${I18N.t('extra_percent')}</label>
            <input type="number" step="0.01" id="f_extrapct" value="${t.extra_percent ?? 0}"></div>
          <div class="field"><label data-i18n="extra_comm">${I18N.t('extra_comm')}</label>
            <input type="number" step="0.01" id="f_extraamt" placeholder="auto" value="${t.id ? (t.extra_comm ?? '') : ''}"></div>
          <div class="field"><label data-i18n="currency">${I18N.t('currency')}</label>
            <select id="f_currency" required>${optionsHtml(currencies, t.currency_id || currencies.find(c=>c.is_base)?.id, currencyLabel)}</select></div>
          <div class="field"><label data-i18n="ex_rate">${I18N.t('ex_rate')}</label>
            <input type="number" step="0.0001" id="f_exrate" value="${t.ex_rate ?? ''}"></div>
        </div>

        <div class="grid-2">
          <div class="field"><label data-i18n="payment">${I18N.t('payment')}</label>
            <select id="f_payment">
              <option value="account" ${(!t.payment_method || t.payment_method==='account') ? 'selected':''} data-i18n="payment_account">${I18N.t('payment_account')}</option>
              <option value="cash" ${t.payment_method==='cash'?'selected':''} data-i18n="payment_cash">${I18N.t('payment_cash')}</option>
              <option value="bank" ${t.payment_method==='bank'?'selected':''} data-i18n="payment_bank">${I18N.t('payment_bank')}</option>
            </select></div>
          <div class="field"><label data-i18n="notes">${I18N.t('notes')}</label>
            <input type="text" id="f_notes" value="${UI.esc(t.notes || '')}"></div>
        </div>

        <div class="toolbar" style="margin-top:6px;">
          <label class="tag-toggle"><input type="checkbox" id="f_noniata" ${t.is_non_iata?'checked':''}><span data-i18n="non_iata">${I18N.t('non_iata')}</span></label>
          <label class="tag-toggle"><input type="checkbox" id="f_zerocomm" ${t.is_zero_comm?'checked':''}><span data-i18n="zero_comm">${I18N.t('zero_comm')}</span></label>
          <label class="tag-toggle"><input type="checkbox" id="f_bsp" ${t.is_bsp?'checked':''}><span data-i18n="bsp">${I18N.t('bsp')}</span></label>
          <label class="tag-toggle"><input type="checkbox" id="f_group" ${t.is_group?'checked':''}><span data-i18n="group">${I18N.t('group')}</span></label>
          <label class="tag-toggle"><input type="checkbox" id="f_broker" ${t.is_broker?'checked':''}><span data-i18n="broker">${I18N.t('broker')}</span></label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="UI.closeModal()" data-i18n="cancel">${I18N.t('cancel')}</button>
          <button type="submit" class="btn btn-gold" data-i18n="save">${I18N.t('save')}</button>
        </div>
      </form>
    `;
  }

  function collectForm() {
    return {
      ticket_date: document.getElementById('f_date').value,
      airline_id: document.getElementById('f_airline').value || null,
      customer_id: document.getElementById('f_customer').value,
      pax_name: document.getElementById('f_pax').value.trim(),
      tkt_no: document.getElementById('f_tktno').value.trim(),
      fare: document.getElementById('f_fare').value,
      route: document.getElementById('f_route').value.trim(),
      class: document.getElementById('f_class').value.trim(),
      sign: document.getElementById('f_sign').value.trim(),
      tax_sd: document.getElementById('f_tax_sd').value,
      tax_yr: document.getElementById('f_tax_yr').value,
      tax_yq: document.getElementById('f_tax_yq').value,
      tax_xt: document.getElementById('f_tax_xt').value,
      tax_qr: document.getElementById('f_tax_qr').value,
      tax_eq: document.getElementById('f_tax_eq').value,
      tax_jk: document.getElementById('f_tax_jk').value,
      tax_ny: document.getElementById('f_tax_ny').value,
      comm_percent: document.getElementById('f_commpct').value,
      comm_amount: document.getElementById('f_commamt').value,
      discount_percent: document.getElementById('f_dispct').value,
      discount_amount: document.getElementById('f_disamt').value,
      extra_percent: document.getElementById('f_extrapct').value,
      extra_comm: document.getElementById('f_extraamt').value,
      currency_id: document.getElementById('f_currency').value,
      ex_rate: document.getElementById('f_exrate').value,
      payment_method: document.getElementById('f_payment').value,
      notes: document.getElementById('f_notes').value.trim(),
      is_non_iata: document.getElementById('f_noniata').checked,
      is_zero_comm: document.getElementById('f_zerocomm').checked,
      is_bsp: document.getElementById('f_bsp').checked,
      is_group: document.getElementById('f_group').checked,
      is_broker: document.getElementById('f_broker').checked,
    };
  }

  function wireForm(ticketId) {
    const currSel = document.getElementById('f_currency');
    const exRate = document.getElementById('f_exrate');
    function syncRate() {
      const c = currencies.find((x) => String(x.id) === currSel.value);
      if (c && !exRate.value) exRate.value = c.exchange_rate;
    }
    currSel.addEventListener('change', () => {
      const c = currencies.find((x) => String(x.id) === currSel.value);
      if (c) exRate.value = c.exchange_rate;
    });
    if (!exRate.value) syncRate();

    document.getElementById('ticketForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        const payload = collectForm();
        if (ticketId) {
          await API.put(`/tickets/${ticketId}`, payload);
        } else {
          await API.post('/tickets', payload);
        }
        UI.closeModal();
        UI.toast(I18N.t('saved_ok'), 'ok');
        window.Pages.tickets.refresh();
      } catch (err) {
        UI.toast(UI.errorMsg(err), 'err');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function openForm(ticket) {
    const title = ticket ? I18N.t('edit') : I18N.t('new_ticket');
    UI.openModal(`
      <div class="modal-head"><h3>${title} ${ticket ? '#' + UI.esc(ticket.voucher_no) : ''}</h3>
        <button class="modal-close" onclick="UI.closeModal()">&times;</button></div>
      ${formHtml(ticket)}
    `);
    wireForm(ticket && ticket.id);
  }

  async function renderTable() {
    const tbody = document.getElementById('ticketsTbody');
    tbody.innerHTML = `<tr><td colspan="9"><div class="spinner"></div></td></tr>`;
    const params = new URLSearchParams();
    Object.entries(currentFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const rows = await API.get(`/tickets?${params.toString()}`);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">${I18N.t('no_data')}</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((t) => `
      <tr>
        <td>${UI.esc(t.voucher_no)}</td>
        <td>${UI.esc(t.ticket_date)}</td>
        <td>${UI.esc(UI.localizedName({ name_ar: t.airline_name_ar, name_en: t.airline_name_en }) || '-')}</td>
        <td>${UI.esc(UI.localizedName({ name_ar: t.customer_name_ar, name_en: t.customer_name_en }))}</td>
        <td>${UI.esc(t.pax_name)}</td>
        <td>${UI.esc(t.route || '-')}</td>
        <td class="right-num">${UI.money(t.total, t.currency_symbol)}</td>
        <td>${t.status === 'issued' ? `<span class="badge badge-green">${I18N.t('status_issued')}</span>` : `<span class="badge badge-red">${I18N.t('status_voided')}</span>`}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" data-edit="${t.id}" ${t.status==='voided'?'disabled':''}>${I18N.t('edit')}</button>
            <button class="btn btn-danger btn-sm" data-void="${t.id}" ${t.status==='voided'?'disabled':''}>${I18N.t('void')}</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ticket = await API.get(`/tickets/${btn.getAttribute('data-edit')}`);
        openForm(ticket);
      });
    });
    tbody.querySelectorAll('[data-void]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(I18N.t('void_confirm'))) return;
        try {
          await API.post(`/tickets/${btn.getAttribute('data-void')}/void`, {});
          UI.toast(I18N.t('saved_ok'), 'ok');
          renderTable();
        } catch (err) {
          UI.toast(UI.errorMsg(err), 'err');
        }
      });
    });
  }

  return {
    async render(el) {
      await loadLookups();
      currentFilters = {};
      el.innerHTML = `
        <div class="card">
          <div class="toolbar">
            <input class="search-input" id="ticketSearch" data-i18n-placeholder="search" placeholder="${I18N.t('search')}">
            <input type="date" id="filterFrom" title="${I18N.t('from_date')}">
            <input type="date" id="filterTo" title="${I18N.t('to_date')}">
            <button class="btn btn-outline btn-sm" id="filterBtn" data-i18n="filter">${I18N.t('filter')}</button>
            <button class="btn btn-outline btn-sm" id="resetBtn" data-i18n="reset">${I18N.t('reset')}</button>
            <button class="btn btn-gold" id="newTicketBtn" data-i18n="new_ticket">${I18N.t('new_ticket')}</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th data-i18n="voucher_no">${I18N.t('voucher_no')}</th>
                <th data-i18n="ticket_date">${I18N.t('ticket_date')}</th>
                <th data-i18n="airline">${I18N.t('airline')}</th>
                <th data-i18n="customer">${I18N.t('customer')}</th>
                <th data-i18n="pax_name">${I18N.t('pax_name')}</th>
                <th data-i18n="route">${I18N.t('route')}</th>
                <th data-i18n="total">${I18N.t('total')}</th>
                <th data-i18n="status">${I18N.t('status')}</th>
                <th data-i18n="actions">${I18N.t('actions')}</th>
              </tr></thead>
              <tbody id="ticketsTbody"></tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('newTicketBtn').addEventListener('click', () => openForm(null));
      document.getElementById('filterBtn').addEventListener('click', () => {
        currentFilters = {
          q: document.getElementById('ticketSearch').value,
          from: document.getElementById('filterFrom').value,
          to: document.getElementById('filterTo').value,
        };
        renderTable();
      });
      document.getElementById('resetBtn').addEventListener('click', () => {
        document.getElementById('ticketSearch').value = '';
        document.getElementById('filterFrom').value = '';
        document.getElementById('filterTo').value = '';
        currentFilters = {};
        renderTable();
      });
      document.getElementById('ticketSearch').addEventListener('input', UI.debounce(() => {
        currentFilters.q = document.getElementById('ticketSearch').value;
        renderTable();
      }, 350));

      await renderTable();
    },
    refresh: renderTable,
  };
})();

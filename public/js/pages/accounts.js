window.Pages = window.Pages || {};

window.Pages.accounts = (function () {
  let customers = [];
  let currencies = [];
  let selectedCustomerId = null;

  function paymentFormHtml() {
    return `
      <form id="paymentForm">
        <div class="grid-2">
          <div class="field"><label data-i18n="entry_type">${I18N.t('entry_type')}</label>
            <select id="p_type">
              <option value="credit" data-i18n="credit">${I18N.t('credit')}</option>
              <option value="debit" data-i18n="debit">${I18N.t('debit')}</option>
            </select></div>
          <div class="field"><label data-i18n="date">${I18N.t('date')}</label>
            <input type="date" id="p_date" value="${new Date().toISOString().slice(0,10)}"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label data-i18n="amount">${I18N.t('amount')}</label>
            <input type="number" step="0.01" id="p_amount" required></div>
          <div class="field"><label data-i18n="currency">${I18N.t('currency')}</label>
            <select id="p_currency">${currencies.map((c) => `<option value="${c.id}" data-rate="${c.exchange_rate}" ${c.is_base?'selected':''}>${UI.esc(c.code)}</option>`).join('')}</select></div>
        </div>
        <div class="grid-2">
          <div class="field"><label data-i18n="ex_rate">${I18N.t('ex_rate')}</label>
            <input type="number" step="0.0001" id="p_exrate" value="1"></div>
          <div class="field"><label data-i18n="payment">${I18N.t('payment')}</label>
            <select id="p_method">
              <option value="cash" data-i18n="payment_cash">${I18N.t('payment_cash')}</option>
              <option value="bank" data-i18n="payment_bank">${I18N.t('payment_bank')}</option>
            </select></div>
        </div>
        <div class="field"><label data-i18n="description">${I18N.t('description')}</label>
          <input type="text" id="p_desc"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="UI.closeModal()" data-i18n="cancel">${I18N.t('cancel')}</button>
          <button type="submit" class="btn btn-gold" data-i18n="save">${I18N.t('save')}</button>
        </div>
      </form>
    `;
  }

  function openPaymentForm() {
    UI.openModal(`
      <div class="modal-head"><h3 data-i18n="record_payment">${I18N.t('record_payment')}</h3>
        <button class="modal-close" onclick="UI.closeModal()">&times;</button></div>
      ${paymentFormHtml()}
    `);
    const currSel = document.getElementById('p_currency');
    const rateInput = document.getElementById('p_exrate');
    const syncRate = () => { rateInput.value = currSel.selectedOptions[0].getAttribute('data-rate'); };
    currSel.addEventListener('change', syncRate);
    syncRate();

    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.post('/accounts/payments', {
          customer_id: selectedCustomerId,
          entry_type: document.getElementById('p_type').value,
          entry_date: document.getElementById('p_date').value,
          amount: document.getElementById('p_amount').value,
          currency_id: currSel.value,
          ex_rate: rateInput.value,
          payment_method: document.getElementById('p_method').value,
          description: document.getElementById('p_desc').value.trim(),
        });
        UI.closeModal();
        UI.toast(I18N.t('saved_ok'), 'ok');
        loadStatement(selectedCustomerId);
      } catch (err) {
        UI.toast(UI.errorMsg(err), 'err');
      }
    });
  }

  async function loadStatement(customerId) {
    selectedCustomerId = customerId;
    const box = document.getElementById('stmtBox');
    if (!customerId) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="spinner"></div>';
    const data = await API.get(`/customers/${customerId}/ledger`);
    const balances = data.balances.map((b) => `<span class="badge ${b.balance>0?'badge-red':'badge-green'}">${UI.money(b.balance, b.symbol)}</span>`).join(' ') || `<span class="muted">${I18N.t('no_data')}</span>`;
    const rows = data.entries.map((e) => `
      <tr>
        <td>${UI.esc(e.entry_date)}</td>
        <td>${UI.esc(e.voucher_no ? `${e.voucher_no} - ${e.pax_name}` : e.description)}</td>
        <td>${UI.esc(e.currency_code)}</td>
        <td class="right-num">${e.entry_type === 'debit' ? UI.money(e.amount) : ''}</td>
        <td class="right-num">${e.entry_type === 'credit' ? UI.money(e.amount) : ''}</td>
      </tr>
    `).join('');
    box.innerHTML = `
      <div class="card-head">
        <h2>${I18N.t('statement_for')} - ${UI.esc(UI.localizedName(data.customer))}</h2>
        <button class="btn btn-gold btn-sm" id="payBtn" data-i18n="record_payment">${I18N.t('record_payment')}</button>
      </div>
      <div style="margin-bottom:12px;">${balances}</div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th data-i18n="date">${I18N.t('date')}</th>
            <th data-i18n="description">${I18N.t('description')}</th>
            <th data-i18n="currency">${I18N.t('currency')}</th>
            <th data-i18n="debit_short">${I18N.t('debit_short')}</th>
            <th data-i18n="credit_short">${I18N.t('credit_short')}</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="5" class="empty-state">${I18N.t('no_data')}</td></tr>`}</tbody>
        </table>
      </div>
    `;
    document.getElementById('payBtn').addEventListener('click', openPaymentForm);
  }

  return {
    async render(el) {
      [customers, currencies] = await Promise.all([API.get('/customers'), API.get('/currencies')]);
      el.innerHTML = `
        <div class="card">
          <div class="field" style="max-width:400px;">
            <label data-i18n="select_customer">${I18N.t('select_customer')}</label>
            <select id="custSelect">
              <option value="">-</option>
              ${customers.map((c) => `<option value="${c.id}">${UI.esc(c.code)} - ${UI.esc(UI.localizedName(c))}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card" id="stmtBox"></div>
      `;
      document.getElementById('custSelect').addEventListener('change', (e) => loadStatement(e.target.value));
    },
    refresh() { if (selectedCustomerId) loadStatement(selectedCustomerId); },
  };
})();

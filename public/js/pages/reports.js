window.Pages = window.Pages || {};

window.Pages.reports = (function () {
  let airlines = [];
  let customers = [];
  let currencies = [];

  async function generate() {
    const params = new URLSearchParams();
    const from = document.getElementById('r_from').value;
    const to = document.getElementById('r_to').value;
    const airline = document.getElementById('r_airline').value;
    const customer = document.getElementById('r_customer').value;
    const currency = document.getElementById('r_currency').value;
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (airline) params.set('airline_id', airline);
    if (customer) params.set('customer_id', customer);
    if (currency) params.set('currency_id', currency);

    const box = document.getElementById('reportResults');
    box.innerHTML = '<div class="spinner"></div>';
    const data = await API.get(`/reports/sales?${params.toString()}`);

    const totalsHtml = data.totalsByCurrency.map((t) => `
      <div class="kpi-card">
        <div class="kpi-label">${UI.esc(t.code)}</div>
        <div class="kpi-value" style="font-size:1.1rem;">${UI.money(t.total_sales, t.symbol)}</div>
        <div class="muted" style="font-size:0.75rem; margin-top:4px;">${I18N.t('ticket_count')}: ${t.ticket_count} · ${I18N.t('total_income')}: ${UI.money(t.total_income)}</div>
      </div>
    `).join('') || `<span class="muted">${I18N.t('no_data')}</span>`;

    const rows = data.rows.map((t) => `
      <tr>
        <td>${UI.esc(t.voucher_no)}</td>
        <td>${UI.esc(t.ticket_date)}</td>
        <td>${UI.esc(UI.localizedName({ name_ar: t.airline_name_ar, name_en: t.airline_name_en }) || '-')}</td>
        <td>${UI.esc(UI.localizedName({ name_ar: t.customer_name_ar, name_en: t.customer_name_en }))}</td>
        <td>${UI.esc(t.pax_name)}</td>
        <td class="right-num">${UI.money(t.fare)}</td>
        <td class="right-num">${UI.money(t.total, t.currency_symbol)}</td>
        <td class="right-num">${UI.money(t.income)}</td>
      </tr>
    `).join('');

    box.innerHTML = `
      <div class="kpi-grid">${totalsHtml}</div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th data-i18n="voucher_no">${I18N.t('voucher_no')}</th>
            <th data-i18n="ticket_date">${I18N.t('ticket_date')}</th>
            <th data-i18n="airline">${I18N.t('airline')}</th>
            <th data-i18n="customer">${I18N.t('customer')}</th>
            <th data-i18n="pax_name">${I18N.t('pax_name')}</th>
            <th data-i18n="fare">${I18N.t('fare')}</th>
            <th data-i18n="total">${I18N.t('total')}</th>
            <th data-i18n="income">${I18N.t('income')}</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="8" class="empty-state">${I18N.t('no_data')}</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }

  return {
    async render(el) {
      [airlines, customers, currencies] = await Promise.all([
        API.get('/airlines'), API.get('/customers'), API.get('/currencies'),
      ]);
      el.innerHTML = `
        <div class="card">
          <div class="card-head"><h2 data-i18n="sales_report">${I18N.t('sales_report')}</h2></div>
          <div class="grid-4">
            <div class="field"><label data-i18n="from_date">${I18N.t('from_date')}</label><input type="date" id="r_from"></div>
            <div class="field"><label data-i18n="to_date">${I18N.t('to_date')}</label><input type="date" id="r_to"></div>
            <div class="field"><label data-i18n="airline">${I18N.t('airline')}</label>
              <select id="r_airline"><option value="">${I18N.t('all')}</option>${airlines.map((a)=>`<option value="${a.id}">${UI.esc(a.code)} - ${UI.esc(UI.localizedName(a))}</option>`).join('')}</select></div>
            <div class="field"><label data-i18n="customer">${I18N.t('customer')}</label>
              <select id="r_customer"><option value="">${I18N.t('all')}</option>${customers.map((c)=>`<option value="${c.id}">${UI.esc(c.code)} - ${UI.esc(UI.localizedName(c))}</option>`).join('')}</select></div>
          </div>
          <div class="grid-4">
            <div class="field"><label data-i18n="currency">${I18N.t('currency')}</label>
              <select id="r_currency"><option value="">${I18N.t('all')}</option>${currencies.map((c)=>`<option value="${c.id}">${UI.esc(c.code)}</option>`).join('')}</select></div>
          </div>
          <button class="btn btn-gold" id="genBtn" data-i18n="generate">${I18N.t('generate')}</button>
        </div>
        <div class="card" id="reportResults"></div>
      `;
      document.getElementById('genBtn').addEventListener('click', generate);
      await generate();
    },
  };
})();

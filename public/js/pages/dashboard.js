window.Pages = window.Pages || {};

window.Pages.dashboard = {
  async render(el) {
    const data = await API.get('/dashboard/summary');

    const monthTotal = data.monthByCurrency.map((m) =>
      `<div>${UI.money(m.total_sales, m.symbol)} <span class="muted">(${m.ticket_count})</span></div>`
    ).join('') || `<span class="muted">${I18N.t('no_data')}</span>`;

    const outstandingRows = data.outstandingByCurrency.map((o) => `
      <tr>
        <td>${UI.esc(o.code)}</td>
        <td class="right-num ${o.balance > 0 ? 'text-neg' : 'text-pos'}">${UI.money(o.balance, o.symbol)}</td>
      </tr>
    `).join('');

    const recentRows = data.recentTickets.map((t) => `
      <tr>
        <td>${UI.esc(t.voucher_no)}</td>
        <td>${UI.esc(t.ticket_date)}</td>
        <td>${UI.esc(t.pax_name)}</td>
        <td>${UI.esc(UI.localizedName({ name_ar: t.customer_name_ar, name_en: t.customer_name_en }))}</td>
        <td class="right-num">${UI.money(t.total, t.currency_symbol)}</td>
        <td>${t.status === 'issued' ? `<span class="badge badge-green" data-i18n="status_issued">${I18N.t('status_issued')}</span>` : `<span class="badge badge-red" data-i18n="status_voided">${I18N.t('status_voided')}</span>`}</td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card gold">
          <div class="kpi-label" data-i18n="today_tickets">${I18N.t('today_tickets')}</div>
          <div class="kpi-value">${data.todayTickets}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label" data-i18n="total_tickets">${I18N.t('total_tickets')}</div>
          <div class="kpi-value">${data.ticketCount}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label" data-i18n="total_customers">${I18N.t('total_customers')}</div>
          <div class="kpi-value">${data.customerCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label" data-i18n="month_sales">${I18N.t('month_sales')}</div>
          <div class="kpi-value" style="font-size:1rem;">${monthTotal}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h2 data-i18n="recent_tickets">${I18N.t('recent_tickets')}</h2></div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th data-i18n="voucher_no">${I18N.t('voucher_no')}</th>
                <th data-i18n="ticket_date">${I18N.t('ticket_date')}</th>
                <th data-i18n="pax_name">${I18N.t('pax_name')}</th>
                <th data-i18n="customer">${I18N.t('customer')}</th>
                <th data-i18n="total">${I18N.t('total')}</th>
                <th data-i18n="status">${I18N.t('status')}</th>
              </tr></thead>
              <tbody>${recentRows || `<tr><td colspan="6" class="empty-state">${I18N.t('no_data')}</td></tr>`}</tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2 data-i18n="outstanding_balances">${I18N.t('outstanding_balances')}</h2></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th data-i18n="currency">${I18N.t('currency')}</th><th data-i18n="balance">${I18N.t('balance')}</th></tr></thead>
              <tbody>${outstandingRows || `<tr><td colspan="2" class="empty-state">${I18N.t('no_data')}</td></tr>`}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },
};

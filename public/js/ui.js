const UI = {
  toast(message, type = 'ok') {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },

  errorMsg(err) {
    return err && err.message ? err.message : I18N.t('error_generic');
  },

  openModal(innerHtml) {
    document.getElementById('modalBox').innerHTML = innerHtml;
    document.getElementById('modalOverlay').classList.add('show');
    I18N.apply();
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('modalBox').innerHTML = '';
  },

  esc(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  },

  money(amount, symbol) {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return symbol ? `${formatted} ${symbol}` : formatted;
  },

  debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  },

  localizedName(obj, prefix = 'name') {
    if (!obj) return '';
    return I18N.lang === 'ar' ? (obj[`${prefix}_ar`] ?? '') : (obj[`${prefix}_en`] ?? '');
  },
};

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'modalOverlay') UI.closeModal();
});

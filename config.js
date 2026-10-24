// ============================================================
// CONFIGURAÇÃO DO APP — altere só a linha API_URL
// Cole aqui a URL do "App da Web" gerada no Google Apps Script
// (termina em /exec). Ex.: https://script.google.com/macros/s/AKfy.../exec
// ============================================================
self.APP_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxEIadHS8QwljEUHdOzPx0S2fQEqGiQIR6rQAa7zFAL8Or70Bjg5gG6cXtHe27jKhDL/exec',

  // Usado só até o app baixar a configuração da planilha (aba Config)
  POSTOS_PADRAO: [
    { posto: 'Escada BR', bicos: [{ n: '50', d: 'ARLA' }, { n: '55', d: 'ARLA' }, { n: '60', d: 'ARLA' }, { n: '61', d: 'ARLA' }, { n: '62', d: 'ARLA' }] },
    { posto: 'Abasteça',  bicos: [{ n: '21', d: 'ARLA' }, { n: '22', d: 'ARLA' }, { n: '23', d: 'ARLA' }] },
    { posto: 'Caruaru',   bicos: [{ n: '36', d: 'ARLA' }, { n: '37', d: 'ARLA' }, { n: '38', d: 'ARLA' }, { n: '39', d: 'ARLA' }, { n: '40', d: 'ARLA' }] },
    { posto: 'Distrito',  bicos: [{ n: '46', d: 'ARLA' }, { n: '47', d: 'ARLA' }, { n: '50', d: 'ARLA' }, { n: '48', d: 'Mobil a granel' }, { n: '49', d: 'Lubrax a granel' }] },
    { posto: 'Xexéu',     bicos: [{ n: '17', d: 'ARLA' }] },
    { posto: 'Malis',     bicos: [{ n: '34', d: 'ARLA' }] },
    { posto: 'Cambona',   bicos: [{ n: '30', d: 'ARLA' }] }
  ],
  TURNOS_PADRAO: ['00h', '06h', '12h', '18h']
};

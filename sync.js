// Fila offline (IndexedDB) + envio ao servidor. Usado pela página e pelo service worker.
(function (g) {
  const DB = 'encerrante-arla', STORE = 'fila', VER = 1;

  function abrir() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, VER);
      r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function tx(modo, fn) {
    const db = await abrir();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, modo), st = t.objectStore(STORE);
      let out; Promise.resolve(fn(st)).then(v => { out = v; });
      t.oncomplete = () => { db.close(); res(out); };
      t.onerror = () => { db.close(); rej(t.error); };
    });
  }
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  const Fila = {
    salvar: item => tx('readwrite', st => req(st.put(item))),
    listar: () => tx('readonly', st => req(st.getAll())),
    remover: id => tx('readwrite', st => req(st.delete(id))),
    async pendentes() { return (await Fila.listar()).filter(i => i.status !== 'enviado'); }
  };

  let rodando = false;
  async function enviarUm(item, url) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const to = ctrl ? setTimeout(() => ctrl.abort(), 90000) : null;
    try {
      // text/plain evita "preflight" CORS no Apps Script
      const r = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'registrar', pin: item.pin, registro: item.payload }), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctrl ? ctrl.signal : undefined });
      const txt = await r.text();
      let j; try { j = JSON.parse(txt); } catch (e) { throw new Error('Resposta inválida do servidor (HTTP ' + r.status + ')'); }
      if (!j.ok) { const e = new Error(j.erro || 'Erro no servidor'); e.definitivo = !!j.definitivo; throw e; }
      return j;
    } finally { if (to) clearTimeout(to); }
  }

  async function sincronizar(opts) {
    opts = opts || {};
    const url = (g.APP_CONFIG || {}).API_URL;
    if (!url || url.indexOf('http') !== 0) return { enviados: 0, erro: 'URL do servidor não configurada' };
    if (rodando) return { enviados: 0, ocupado: true };
    rodando = true;
    let enviados = 0, ultimoErro = null;
    try {
      const lista = (await Fila.pendentes()).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
      for (const item of lista) {
        try {
          const resp = await enviarUm(item, url);
          item.status = 'enviado';
          item.enviadoEm = new Date().toISOString();
          item.resposta = { alertas: resp.alertas || [], duplicado: !!resp.duplicado };
          item.erro = null;
          // libera espaço: remove as fotos depois de enviado
          item.payload.fotosFita = []; item.payload.anexos = [];
          item.payload.bicos.forEach(b => { b.foto = null; });
          await Fila.salvar(item);
          enviados++;
          if (opts.aoEnviar) opts.aoEnviar(item);
        } catch (e) {
          item.tentativas = (item.tentativas || 0) + 1;
          item.status = e.definitivo ? 'recusado' : 'pendente';
          item.erro = (e && e.name === 'AbortError') ? 'Tempo esgotado (sinal fraco)' : String(e && e.message || e);
          await Fila.salvar(item);
          ultimoErro = item.erro;
          if (!e.definitivo) break; // sem conexão: tenta de novo depois
        }
      }
      // mantém só os 40 últimos enviados no histórico
      const env = (await Fila.listar()).filter(i => i.status === 'enviado').sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
      for (const i of env.slice(40)) await Fila.remover(i.id);
    } finally { rodando = false; }
    return { enviados, erro: ultimoErro };
  }

  g.Fila = Fila;
  g.sincronizarFila = sincronizar;
})(self);

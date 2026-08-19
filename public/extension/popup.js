
document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('syncBtn');
  const openLmntBtn = document.getElementById('openLmntBtn');
  const targetUrlInput = document.getElementById('targetUrl');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const logBox = document.getElementById('logBox');

  function log(msg, isError = false) {
    const time = new Date().toLocaleTimeString();
    logBox.innerHTML = `<span style="color: ${isError ? '#f87171' : '#34d399'}">[${time}]</span> ${msg}<br>` + logBox.innerHTML;
  }

  function setStatus(text, type = 'ready') {
    statusText.innerText = text;
    statusDot.className = 'status-dot';
    if (type === 'active') statusDot.classList.add('active');
    if (type === 'error') statusDot.classList.add('error');
  }

  openLmntBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://app.lmnt.com' });
  });

  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    setStatus('Buscando cookies e sessão do LMNT...', 'ready');
    log('Iniciando varredura em app.lmnt.com...');

    try {
      // 1. Obter cookies de app.lmnt.com
      const cookies = await chrome.cookies.getAll({ domain: 'lmnt.com' });
      log(`Encontrados ${cookies.length} cookies em lmnt.com`);

      let cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      // Procura por token em cookies conhecidos (auth, session, supabase token, etc)
      let sessionToken = '';
      const authCookie = cookies.find(c => c.name.includes('token') || c.name.includes('session') || c.name.includes('auth') || c.name.includes('sb-'));
      if (authCookie) {
        sessionToken = authCookie.value;
      }

      // Se nenhum token achado no cookie, tenta ler local storage de aba aberta do LMNT
      const tabs = await chrome.tabs.query({ url: '*://app.lmnt.com/*' });
      if (tabs.length > 0) {
        log('Injetando extrator na aba do LMNT...');
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              let token = '';
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('token') || key.includes('auth') || key.includes('session') || key.includes('supabase'))) {
                  token = localStorage.getItem(key);
                  break;
                }
              }
              return { token, storage: { ...localStorage } };
            }
          });
          if (results && results[0] && results[0].result?.token) {
            sessionToken = results[0].result.token;
            log('Token extraído com sucesso do LocalStorage da aba ativa!');
          }
        } catch (scriptErr) {
          log('Aviso: Leitura de script: ' + scriptErr.message);
        }
      }

      const targetEndpoint = targetUrlInput.value.trim() || 'http://localhost:3000/api/admin/lmnt-session';
      log(`Enviando dados para ${targetEndpoint}...`);

      const payload = {
        token: sessionToken || 'session-extracted-' + Date.now(),
        cookie: cookieString,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setStatus('Sessão Sincronizada com Sucesso!', 'active');
        log('Sucesso! O AuraVoice já está configurado para usar o Bypass do Playground!');
      } else {
        throw new Error(data.error || 'Erro ao sincronizar no servidor');
      }

    } catch (err) {
      setStatus('Erro na sincronização', 'error');
      log('Falha: ' + err.message, true);
    } finally {
      syncBtn.disabled = false;
    }
  });
});

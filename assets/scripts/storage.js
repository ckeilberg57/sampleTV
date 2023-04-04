function checkStorage() {
  let pexSettings = localStorage.getItem('pexSettings') || null;

  if (!pexSettings) {
    localStorage.setItem('pexSettings', '{}');
    pexSettings = {};
  }

  try {
    pexSettings = JSON.parse(pexSettings);
  } catch {
    console.error('Could not parse settings, using default configuration');
    pexSettings = {};
    localStorage.setItem('pexSettings', JSON.stringify(pexSettings));
    setStorage('maxCallRate', 2464);
    setStorage('maxCallDuration', 0);
    setStorage('deviceName', 'pexme.demo');
    setStorage('server', '');
    setStorage('logoURL', '');
    setStorage('backgroundUrl', '');
  }

  return pexSettings;
}

function getStorage(key = null) {
  let pexSettings = checkStorage();
  return pexSettings[key];
}

function setStorage(key, value) {
  let pexSettings = checkStorage();
  pexSettings[key] = value;
  debugLog('Saving', pexSettings);
  localStorage.setItem('pexSettings', JSON.stringify(pexSettings));
}

debugLog('Init pexSettings');
checkStorage();

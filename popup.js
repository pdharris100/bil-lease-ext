document.addEventListener('DOMContentLoaded', function () {
  const nyprisEl = document.querySelector('#nypris');
  const nyprisPlusExtrasEl = document.querySelector('#nyprisPlusExtras');
  const restvaerdiEl = document.querySelector('#restvaerdi');
  const firstTaxTierEl = document.querySelector('#firstTaxTier');
  const secondTaxTierEl = document.querySelector('#secondTaxTier');
  const thirdTaxTierEl = document.querySelector('#thirdTaxTier');
  const totalAfgiftEl = document.querySelector('#totalAfgift');
  const bundfradragEl = document.querySelector('#bundfradrag');
  const indfasningEl = document.querySelector('#indfasning');
  const evFradragEl = document.querySelector('#evFradrag');
  const breakEvenPriceEl = document.querySelector('#breakEvenPrice');
  const statusEl = document.querySelector('#status');

  const setText = (el, value) => {
    if (!el) return;
    el.textContent = value;
  };

  const formatDkk = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '–';
    return value.toLocaleString('da-DK') + ' kr.';
  };

  const showStatus = (message) => {
    setText(statusEl, message ?? '');
  };

  showStatus('');

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tabId = tabs?.[0]?.id;
    if (!tabId) {
      showStatus('No active tab.');
      return;
    }

    chrome.tabs.sendMessage(tabId, { action: 'getDetails' }, function (response) {
      if (chrome.runtime.lastError) {
        setText(nyprisEl, '–');
        setText(nyprisPlusExtrasEl, '–');
        setText(restvaerdiEl, '–');
        setText(firstTaxTierEl, '–');
        setText(secondTaxTierEl, '–');
        setText(thirdTaxTierEl, '–');
        setText(totalAfgiftEl, '–');
        setText(bundfradragEl, '–');
        setText(indfasningEl, '–');
        setText(evFradragEl, '–');
        setText(breakEvenPriceEl, '–');
        showStatus('Open a Bilbasen car page.');
        return;
      }

      const nypris = response?.nypris;
      const restvaerdi = response?.restvaerdi;
      const nyprisPlusExtras =
        typeof nypris === 'number' && Number.isFinite(nypris) ? Math.round(nypris * 1.1) : null;

      const totalPris =
        typeof nyprisPlusExtras === 'number' && Number.isFinite(nyprisPlusExtras)
          ? nyprisPlusExtras
          : typeof nypris === 'number' && Number.isFinite(nypris)
            ? nypris
            : null;

      const firstTaxTier =
        typeof totalPris === 'number' &&
        Number.isFinite(totalPris) &&
        totalPris > 0 &&
        typeof restvaerdi === 'number' &&
        Number.isFinite(restvaerdi)
          ? Math.round(Math.min(totalPris, 76400) * 0.25 * ((restvaerdi * 1.25) / totalPris))
          : null;

      const secondTierBase =
        typeof totalPris === 'number' && Number.isFinite(totalPris)
          ? Math.min(237400 - 76400, Math.max(0, totalPris - 76400))
          : null;

      const secondTaxTier =
        typeof totalPris === 'number' &&
        Number.isFinite(totalPris) &&
        totalPris > 0 &&
        typeof restvaerdi === 'number' &&
        Number.isFinite(restvaerdi) &&
        typeof secondTierBase === 'number' &&
        Number.isFinite(secondTierBase)
          ? Math.round(secondTierBase * 0.85 * ((restvaerdi * 1.25) / totalPris))
          : null;

      const thirdTierBase =
        typeof totalPris === 'number' && Number.isFinite(totalPris) ? Math.max(0, totalPris - 237400) : null;

      const thirdTaxTier =
        typeof totalPris === 'number' &&
        Number.isFinite(totalPris) &&
        totalPris > 0 &&
        typeof restvaerdi === 'number' &&
        Number.isFinite(restvaerdi) &&
        typeof thirdTierBase === 'number' &&
        Number.isFinite(thirdTierBase)
          ? Math.round(thirdTierBase * 1.5 * ((restvaerdi * 1.25) / totalPris))
          : null;

      const totalAfgift =
        typeof firstTaxTier === 'number' &&
        Number.isFinite(firstTaxTier) &&
        typeof secondTaxTier === 'number' &&
        Number.isFinite(secondTaxTier) &&
        typeof thirdTaxTier === 'number' &&
        Number.isFinite(thirdTaxTier)
          ? Math.round(firstTaxTier + secondTaxTier + thirdTaxTier)
          : null;

      const bundfradrag =
        typeof totalAfgift === 'number' &&
        Number.isFinite(totalAfgift) &&
        typeof totalPris === 'number' &&
        Number.isFinite(totalPris) &&
        totalPris > 0 &&
        typeof restvaerdi === 'number' &&
        Number.isFinite(restvaerdi)
          ? Math.round(totalAfgift - 25500 * ((restvaerdi * 1.25) / totalPris))
          : null;

      const indfasning =
        typeof bundfradrag === 'number' && Number.isFinite(bundfradrag) ? Math.round(bundfradrag * 0.48) : null;

      const evFradrag =
        typeof indfasning === 'number' &&
        Number.isFinite(indfasning) &&
        typeof totalPris === 'number' &&
        Number.isFinite(totalPris) &&
        totalPris > 0 &&
        typeof restvaerdi === 'number' &&
        Number.isFinite(restvaerdi)
          ? Math.round(indfasning - 152200 * ((restvaerdi * 1.25) / totalPris))
          : null;

      const breakEvenPrice =
        typeof evFradrag === 'number' &&
        Number.isFinite(evFradrag) &&
        typeof restvaerdi === 'number' &&
        Number.isFinite(restvaerdi)
          ? Math.round(restvaerdi * 1.25 + evFradrag)
          : null;

      setText(nyprisEl, formatDkk(nypris));
      setText(nyprisPlusExtrasEl, formatDkk(nyprisPlusExtras));
      setText(restvaerdiEl, formatDkk(restvaerdi));
      setText(firstTaxTierEl, formatDkk(firstTaxTier));
      setText(secondTaxTierEl, formatDkk(secondTaxTier));
      setText(thirdTaxTierEl, formatDkk(thirdTaxTier));
      setText(totalAfgiftEl, formatDkk(totalAfgift));
      setText(bundfradragEl, formatDkk(bundfradrag));
      setText(indfasningEl, formatDkk(indfasning));
      setText(evFradragEl, formatDkk(evFradrag));
      setText(breakEvenPriceEl, formatDkk(breakEvenPrice));

      const nyprisOk = typeof nypris === 'number' && Number.isFinite(nypris);
      const restOk = typeof restvaerdi === 'number' && Number.isFinite(restvaerdi);
      if (!nyprisOk && !restOk) {
        showStatus('Nypris/Restværdi not found on this page.');
      } else {
        showStatus('');
      }
    });
  });
});






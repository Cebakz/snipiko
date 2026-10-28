(() => {
  'use strict';
  const PUBLISHER = 'ca-pub-6560596157943658';
  const EXPECTED_ORIGIN = 'https://cebakz.github.io';
  const EXPECTED_PATHS = ['/snipiko/consent-qa-paused/', '/snipiko/consent-qa-paused/index.html'];
  const TAG_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUBLISHER;
  const $ = id => document.getElementById(id);
  const state = {
    qa: 'consent-paused-2026-10-28', publisher: PUBLISHER, expectedMessage: 'Snitrix — European consent',
    pageAllowed: false, forcedPreview: false, tagRequested: false, tagLoaded: false,
    adBreakTest: null, adRequestsPaused: 1, placementsRequestedByThisPage: 0,
    apiReady: false, consentDataReady: false, tcf: null, events: [],
    visualMessageVerified: null, acceptanceOrRefusalVerified: null,
    siteApprovalVerified: false, gamePrivacyReadyChanged: false
  };
  let listenerInstalled = false;
  let timer;
  function render() { $('diagnostics').textContent = JSON.stringify(state, null, 2); }
  function note(name) {
    state.events.push({ atUtc: new Date().toISOString(), event: name });
    if (state.events.length > 24) state.events.shift();
    render();
  }
  function status(value) { $('status').textContent = value; }
  function countConsents(values) {
    if (!values || typeof values !== 'object') return null;
    const entries = Object.values(values).filter(v => typeof v === 'boolean');
    return { reported: entries.length, consentTrue: entries.filter(Boolean).length, consentFalse: entries.filter(v => !v).length };
  }
  function listen() {
    if (listenerInstalled || typeof window.__tcfapi !== 'function') return;
    listenerInstalled = true;
    try {
      window.__tcfapi('addEventListener', 0, (data, success) => {
        if (!success || !data) { note('tcf_callback_unavailable'); return; }
        state.tcf = {
          cmpStatus: typeof data.cmpStatus === 'string' ? data.cmpStatus : null,
          eventStatus: typeof data.eventStatus === 'string' ? data.eventStatus : null,
          gdprApplies: typeof data.gdprApplies === 'boolean' ? data.gdprApplies : null,
          purposeConsentCounts: countConsents(data.purpose?.consents),
          vendorConsentCounts: countConsents(data.vendor?.consents)
        };
        status('Retorno TCF observado. Confira manualmente a mensagem e a escolha; isto não significa aceite nem aprovação.');
        note('tcf_callback_received');
      });
    } catch {
      listenerInstalled = false;
      status('A API TCF não pôde ser consultada. Validação pendente.');
      note('tcf_listener_error');
    }
  }
  const page = new URL(window.location.href);
  state.pageAllowed = page.origin === EXPECTED_ORIGIN && EXPECTED_PATHS.includes(page.pathname);
  state.forcedPreview = page.searchParams.get('fc') === 'alwaysshow' && page.searchParams.get('fctype') === 'gdpr';
  $('preview-link').href = './?fc=alwaysshow&fctype=gdpr';
  $('normal-link').href = './';
  render();
  if (!state.pageAllowed) {
    status('Prévia local: a tag Google está bloqueada nesta origem. Use o caminho publicado e aprovado para validar a mensagem real.');
    note('origin_or_path_not_allowed_no_google_tag');
    return;
  }
  if (document.getElementById('snitrix-consent-qa-google')) {
    status('Tag já presente. Nenhuma segunda tag foi inserida; revisão pendente.');
    note('existing_tag_not_duplicated');
    return;
  }
  // Google documented asynchronous AdSense pause. Never set this to0 here.
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.pauseAdRequests = 1;
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push({ CONSENT_API_READY: () => {
    state.apiReady = true;
    clearTimeout(timer);
    $('reopen').disabled = typeof window.googlefc.showRevocationMessage !== 'function';
    status('API de consentimento disponível. Confira a mensagem Google e registre a escolha observada.');
    note('consent_api_ready');
    listen();
  } });
  window.googlefc.callbackQueue.push({ CONSENT_DATA_READY: () => {
    state.consentDataReady = true;
    note('consent_data_ready_not_an_acceptance_receipt');
    listen();
  } });
  $('reopen').addEventListener('click', () => {
    if (!state.apiReady || typeof window.googlefc.showRevocationMessage !== 'function') return;
    status('Reabertura solicitada ao Google. Confira se a mensagem real reaparece.');
    note('revocation_requested_may_clear_cmp_record');
    window.googlefc.callbackQueue.push({ CONSENT_API_READY: () => window.googlefc.showRevocationMessage() });
  });
  const script = document.createElement('script');
  script.id = 'snitrix-consent-qa-google';
  script.async = true;
  script.crossOrigin = 'anonymous';
  // CMP-only experiment: normal asynchronous tag, all ad requests paused above.
  script.src = TAG_URL;
  script.onload = () => { state.tagLoaded = true; note('adsense_paused_tag_loaded_not_cmp_validation'); };
  script.onerror = () => {
    clearTimeout(timer);
    status('Falha ao carregar a tag Google. Validação pendente; conferir rede, bloqueadores e configuração publicada.');
    note('google_tag_load_error');
  };
  timer = setTimeout(() => {
    if (!state.apiReady) {
      status('Sem callback de consentimento até agora. Validação pendente; carregar a tag não prova que a mensagem foi publicada para este caminho.');
      note('no_cmp_callback_after_25_seconds_pending');
    }
  }, 25_000);
  state.tagRequested = true;
  status('Carregando tag com solicitações de anúncios permanentemente pausadas. Aguardando a mensagem Google e callbacks de consentimento.');
  note('google_tag_requested_adrequests_paused_no_placements');
  document.head.append(script);
})();

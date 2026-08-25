/**
 * MessToCal - Main Application Controller
 * Handles UI interactions, live updates, PWA, Google Translate & Clipboard
 */

(function() {
  // Application State
  let currentEvent = null;
  let qrCodeInstance = null;
  let deferredInstallPrompt = null;

  // Exemples Génériques Anonymes
  const PRESET_EXAMPLES = {
    bbq: `Alex Dupont
Salut tout le monde ! On organise un dîner BBQ pour la fête à Thomas le samedi 18 juillet vers 12h30. Ça se passera dans la cour à la maison avec le beau temps ☀️. Apportez vos consommations (BYOB) ! On s'occupe des grillades et du gâteau 🎂. Réservez votre samedi !`,

    souper: `Bonjour à tous ! Le vendredi 14 novembre pour 18h00, je vous invite pour le souper d'anniversaire de Sophie. On va se commander du resto et partager le repas tranquillement chez nous à la maison. Faites-moi savoir si vous serez là !`,

    soiree: `Soirée Jeux & Retrouvailles !
Date : Samedi 24 octobre à 19h30
Lieu : 123 rue des Érables, Montréal
Lien de l'événement : https://fb.me/e/4PdUxDILi
Thème : Soirée rétro années 80 ✨
Chacun apporte un petit plat à partager (potluck) et ses boissons. Au plaisir de vous voir !`
  };

  // DOM Elements
  const rawInput = document.getElementById('raw-input');
  const btnParse = document.getElementById('btn-parse');
  const btnClear = document.getElementById('btn-clear');
  const btnPaste = document.getElementById('btn-paste');
  const themeToggle = document.getElementById('theme-toggle');
  const btnInstallPwa = document.getElementById('btn-install-pwa');

  // Form Fields
  const eventTitleInput = document.getElementById('event-title');
  const eventOrganizerInput = document.getElementById('event-organizer');
  const eventStartDateInput = document.getElementById('event-start-date');
  const eventStartTimeInput = document.getElementById('event-start-time');
  const eventEndDateInput = document.getElementById('event-end-date');
  const eventEndTimeInput = document.getElementById('event-end-time');
  const eventLocationInput = document.getElementById('event-location');
  const eventThemeInput = document.getElementById('event-theme');
  const eventFoodInput = document.getElementById('event-food');
  const eventGiftListInput = document.getElementById('event-giftlist');
  const eventNotesInput = document.getElementById('event-notes');

  // Export Buttons
  const btnGoogle = document.getElementById('btn-google-cal');
  const btnOutlook = document.getElementById('btn-outlook-cal');
  const btnYahoo = document.getElementById('btn-yahoo-cal');
  const btnIcs = document.getElementById('btn-ics-download');
  const btnShareMessenger = document.getElementById('btn-share-messenger');
  const btnShowQr = document.getElementById('btn-show-qr');
  const btnCopyShareLink = document.getElementById('btn-copy-share-link');

  // Feedback & UI elements
  const countdownEl = document.getElementById('event-countdown');
  const snackbar = document.getElementById('m3-snackbar');
  const snackbarText = document.getElementById('snackbar-text');
  const qrModal = document.getElementById('qr-modal');
  const qrCloseBtn = document.getElementById('qr-close-btn');

  // Card Template Modal Elements
  const cardModal = document.getElementById('card-modal');
  const cardModalClose = document.getElementById('card-modal-close');
  const cardCanvasWrapper = document.getElementById('card-canvas-wrapper');
  const btnModalDownloadPng = document.getElementById('btn-modal-download-png');
  const btnUploadCustomCardBg = document.getElementById('btn-upload-custom-card-bg');
  const inputCustomCardBg = document.getElementById('input-custom-card-bg');
  const btnImportImgText = document.getElementById('btn-import-img-text');
  const inputMsgImage = document.getElementById('input-msg-image');
  let selectedTemplateId = 'confetti';
  let customCardBgSrc = null;
  let customGlassOptions = { glassOpacity: 0.28, tintColor: 'white' };

  // Guest Banner Elements
  const guestBanner = document.getElementById('guest-banner');
  const guestTitle = document.getElementById('guest-title');
  const guestSubtitle = document.getElementById('guest-subtitle');
  const guestGoogleCal = document.getElementById('guest-google-cal');
  const guestIcsDownload = document.getElementById('guest-ics-download');
  const guestOutlookCal = document.getElementById('guest-outlook-cal');
  const guestYahooCal = document.getElementById('guest-yahoo-cal');

  // Initialize App
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    checkCookiesAndStorage();
    setupTheme();
    setupSimpleMode();
    setupServiceWorker();
    setupEventListeners();
    setupPresets();
    setupSmartTools();
    setupHostProfile();
    setupPinSecurity();

    // 1. Check if event is ENCRYPTED with PIN (Zero-Server client-side crypto)
    const encParams = typeof CryptoVault !== 'undefined' ? CryptoVault.parseEncryptedParams() : null;
    if (encParams) {
      openPinLockModal(encParams);
      return;
    }

    // 2. Check if event is embedded in URL Hash (Standard share link)
    const sharedEvent = CalendarGenerator.parseShareUrl();
    if (sharedEvent) {
      currentEvent = sharedEvent;
      populateForm(currentEvent);
      setupGuestBanner(currentEvent);
      showSnackbar("Événement scanné / partagé chargé avec succès !");
    } else {
      // Zone de saisie vide par défaut au démarrage
      rawInput.value = '';
      resetBadges();
      currentEvent = {
        title: '',
        organizer: '',
        startDate: '',
        startTime: '12:00',
        endDate: '',
        endTime: '18:00',
        location: '',
        theme: '',
        foodInfo: '',
        giftListUrl: '',
        notes: ''
      };
      populateForm(currentEvent);
    }
  }

  /**
   * Sets up Guest Mode banner when accessed via QR code or share URL
   */
  function setupGuestBanner(event) {
    if (!guestBanner) return;
    guestBanner.style.display = 'block';
    if (guestTitle) guestTitle.textContent = event.title || 'Invitation';
    if (guestSubtitle) {
      const dateText = CalendarGenerator.formatDateFrench(event.startDate);
      guestSubtitle.textContent = `📅 ${dateText} de ${event.startTime} à ${event.endTime} ${event.location ? '• 📍 ' + event.location : ''}`;
    }

    // 3D Interactive Envelope Rendering with Confetti on Open
    const envMount = document.getElementById('envelope-3d-mount');
    if (envMount && typeof Envelope3D !== 'undefined') {
      Envelope3D.renderEnvelope(envMount, event, () => {
        if (typeof confetti === 'function') {
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
        }
        showSnackbar("🎉 Invitation ouverte ! Cliquez sur votre agenda préféré.");
      });
    }

    // GiftList button for guest
    const guestGiftListBtn = document.getElementById('guest-giftlist-btn');
    if (guestGiftListBtn) {
      if (event.giftListUrl) {
        guestGiftListBtn.href = event.giftListUrl.startsWith('http') ? event.giftListUrl : `https://${event.giftListUrl}`;
        guestGiftListBtn.style.display = 'inline-flex';
      } else {
        guestGiftListBtn.style.display = 'none';
      }
    }

    // Web Push Notification for Guest
    const btnGuestWebPush = document.getElementById('btn-guest-web-push');
    btnGuestWebPush?.addEventListener('click', async () => {
      if (typeof SmartTools !== 'undefined') {
        const res = await SmartTools.requestWebPushReminder(event);
        if (res.granted) {
          showSnackbar("🔔 Rappel Web Push activé 24h avant l'événement !");
        } else {
          showSnackbar("Veuillez autoriser les notifications dans votre navigateur.");
        }
      }
    });

    // Guest Uber direct booking
    const btnGuestUber = document.getElementById('btn-guest-uber');
    btnGuestUber?.addEventListener('click', () => {
      const loc = event.location || '';
      window.open(SmartTools.getUberUrl(loc), '_blank');
    });

    if (guestGoogleCal) {
      guestGoogleCal.href = CalendarGenerator.getGoogleCalendarUrl(event);
    }
    if (guestOutlookCal) {
      guestOutlookCal.href = CalendarGenerator.getOutlookUrl(event);
    }
    if (guestYahooCal) {
      guestYahooCal.href = CalendarGenerator.getYahooCalendarUrl(event);
    }
    if (guestIcsDownload) {
      guestIcsDownload.onclick = () => CalendarGenerator.downloadIcs(event);
    }

    // Scroll smoothly to guest banner
    guestBanner.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Theme toggler (Light/Dark mode)
   */
  function setupTheme() {
    const savedTheme = localStorage.getItem('messtocal-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
      localStorage.setItem('messtocal-theme', next);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = themeToggle.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  }

  /**
  /**
   * Cookie & LocalStorage Availability Verification
   */
  function checkCookiesAndStorage() {
    let storageAvailable = true;
    try {
      if (typeof navigator.cookieEnabled !== 'undefined' && !navigator.cookieEnabled) {
        storageAvailable = false;
      }
      const testKey = '__test_messtocal__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
    } catch (e) {
      storageAvailable = false;
    }

    if (!storageAvailable) {
      const banner = document.getElementById('cookie-warning-banner');
      if (banner) banner.style.display = 'block';
    }
  }

  /**
   * Mode Simple (Senior & Personnes Âgées) Toggler & URL Routing
   */
  function setupSimpleMode() {
    const btnSimple = document.getElementById('btn-toggle-simple-mode');
    const labelSimple = document.getElementById('simple-mode-label');
    const btnShareSenior = document.getElementById('btn-share-senior-url');

    // Check URL parameters, path, or hash for /senior, ?mode=senior, or #senior
    const urlParams = new URLSearchParams(window.location.search);
    const hasSeniorUrl = window.location.pathname.toLowerCase().includes('/senior') || 
                          urlParams.get('mode') === 'senior' || 
                          window.location.hash.toLowerCase().includes('senior');

    let savedSimple = false;
    try {
      savedSimple = localStorage.getItem('messtocal-simple-mode') === 'true';
    } catch(e) {}

    const isSimple = hasSeniorUrl || savedSimple;

    function applySimpleState(active) {
      if (active) {
        document.body.classList.add('mode-simple');
        if (labelSimple) labelSimple.textContent = 'Mode Complet (Pro)';
        if (btnSimple) {
          btnSimple.style.background = '#dcfce7';
          btnSimple.style.color = '#15803d';
          btnSimple.style.borderColor = '#4ade80';
        }
        if (btnShareSenior) btnShareSenior.style.display = 'inline-flex';
      } else {
        document.body.classList.remove('mode-simple');
        if (labelSimple) labelSimple.textContent = 'Mode Simple (Senior)';
        if (btnSimple) {
          btnSimple.style.background = '#e0f2fe';
          btnSimple.style.color = '#0369a1';
          btnSimple.style.borderColor = '#38bdf8';
        }
        if (btnShareSenior) btnShareSenior.style.display = 'none';
      }
    }

    applySimpleState(isSimple);

    btnSimple?.addEventListener('click', () => {
      const currentlySimple = !document.body.classList.contains('mode-simple');
      applySimpleState(currentlySimple);
      try {
        localStorage.setItem('messtocal-simple-mode', currentlySimple ? 'true' : 'false');
      } catch(e){}

      if (currentlySimple) {
        showSnackbar("👓 Mode Simple activé : gros boutons et vue épurée !");
      } else {
        showSnackbar("✨ Mode Complet (Pro) activé avec tous les outils !");
      }
    });

    btnShareSenior?.addEventListener('click', async () => {
      let baseUrl = window.location.href.split('?')[0].split('#')[0];
      if (!baseUrl.endsWith('.html') && !baseUrl.endsWith('/')) {
        baseUrl += '/';
      }
      if (baseUrl.endsWith('/')) {
        baseUrl += 'index.html';
      }
      const seniorUrl = `${baseUrl}?mode=senior`;
      await copyToClipboard(seniorUrl);
      showSnackbar("🔗 Lien direct Mode Senior copié ! Prêt à envoyer.");
    });

    // Top Suggestion Banner Interactions
    const bannerPrompt = document.getElementById('simple-mode-prompt-banner');
    const btnBannerActivate = document.getElementById('btn-banner-activate-simple');
    const btnBannerDismiss = document.getElementById('btn-banner-dismiss-simple');

    try {
      if (localStorage.getItem('messtocal-dismiss-prompt') === 'true' && bannerPrompt) {
        bannerPrompt.style.display = 'none';
      }
    } catch(e){}

    btnBannerActivate?.addEventListener('click', () => {
      applySimpleState(true);
      try {
        localStorage.setItem('messtocal-simple-mode', 'true');
      } catch(e){}
      showSnackbar("👓 Mode Simple activé : vue grand format et épurée !");
    });

    btnBannerDismiss?.addEventListener('click', () => {
      if (bannerPrompt) bannerPrompt.style.display = 'none';
      try {
        localStorage.setItem('messtocal-dismiss-prompt', 'true');
      } catch(e){}
    });
  }

  /**
   * PWA Service Worker Registration
   */
  function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          reg.update();
        }).catch((err) => {
          console.log('SW registration note:', err);
        });
      });
    }

    // PWA Install Prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (btnInstallPwa) {
        btnInstallPwa.style.display = 'inline-flex';
      }
    });

    if (btnInstallPwa) {
      btnInstallPwa.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          btnInstallPwa.style.display = 'none';
        }
        deferredInstallPrompt = null;
      });
    }
  }

  /**
   * Preset Chips Handlers
   */
  function setupPresets() {
    document.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const presetKey = chip.getAttribute('data-preset');
        if (PRESET_EXAMPLES[presetKey]) {
          rawInput.value = PRESET_EXAMPLES[presetKey];
          runParser();
          showSnackbar(`Exemple "${chip.textContent.trim()}" chargé !`);
        }
      });
    });
  }

  /**
   * Main Event Listeners
   */
  function setupEventListeners() {
    // Parse button
    btnParse.addEventListener('click', runParser);

    // Paste button
    if (btnPaste) {
      btnPaste.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            rawInput.value = text;
            runParser();
            showSnackbar("Texte collé et analysé !");
          }
        } catch (e) {
          rawInput.focus();
          showSnackbar("Veuillez coller le texte directement dans la zone de saisie.");
        }
      });
    }

    // Clear button
    btnClear.addEventListener('click', () => {
      rawInput.value = '';
      currentEvent = {
        title: '',
        organizer: '',
        startDate: '',
        startTime: '12:00',
        endDate: '',
        endTime: '18:00',
        location: '',
        theme: '',
        foodInfo: '',
        giftListUrl: '',
        notes: ''
      };
      populateForm(currentEvent);
      resetBadges();
      rawInput.focus();
      showSnackbar("Saisie effacée.");
    });

    // Form inputs live changes
    const inputs = [
      eventTitleInput, eventOrganizerInput, eventStartDateInput, eventStartTimeInput,
      eventEndDateInput, eventEndTimeInput, eventLocationInput, eventThemeInput,
      eventFoodInput, eventGiftListInput, eventNotesInput
    ];

    inputs.forEach((input) => {
      input?.addEventListener('input', syncCurrentEventFromForm);
    });

    // Real-Time Input typing / live listening updater
    rawInput.addEventListener('input', () => {
      if (!rawInput.value.trim()) {
        resetBadges();
        currentEvent = {
          title: '',
          organizer: '',
          startDate: '',
          startTime: '12:00',
          endDate: '',
          endTime: '18:00',
          location: '',
          theme: '',
          foodInfo: '',
          giftListUrl: '',
          notes: ''
        };
        populateForm(currentEvent);
      } else {
        runRealTimeDetection(rawInput.value);
        currentEvent = EventParser.parse(rawInput.value);
        populateForm(currentEvent);
      }
    });

    // Setup Voice Dictation & Audio Note
    setupVoiceDictation();

    // Calendar Export Buttons with Validation & Confetti
    btnGoogle.addEventListener('click', (e) => {
      e.preventDefault();
      syncCurrentEventFromForm();
      if (!currentEvent.startDate) {
        showSnackbar("⚠️ Veuillez d'abord indiquer ou dicter la date de l'événement.");
        eventStartDateInput.focus();
        return;
      }
      const url = CalendarGenerator.getGoogleCalendarUrl(currentEvent);
      window.open(url, '_blank', 'noopener,noreferrer');
      if (typeof confetti === 'function') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
      showSnackbar("Ouverture de Google Calendar...");
    });

    btnOutlook.addEventListener('click', (e) => {
      e.preventDefault();
      syncCurrentEventFromForm();
      if (!currentEvent.startDate) {
        showSnackbar("⚠️ Veuillez d'abord indiquer ou dicter la date de l'événement.");
        eventStartDateInput.focus();
        return;
      }
      const url = CalendarGenerator.getOutlookUrl(currentEvent);
      window.open(url, '_blank', 'noopener,noreferrer');
      if (typeof confetti === 'function') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
      showSnackbar("Ouverture de Outlook Calendar...");
    });

    btnYahoo.addEventListener('click', (e) => {
      e.preventDefault();
      syncCurrentEventFromForm();
      if (!currentEvent.startDate) {
        showSnackbar("⚠️ Veuillez d'abord indiquer ou dicter la date de l'événement.");
        eventStartDateInput.focus();
        return;
      }
      const url = CalendarGenerator.getYahooCalendarUrl(currentEvent);
      window.open(url, '_blank', 'noopener,noreferrer');
      if (typeof confetti === 'function') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
      showSnackbar("Ouverture de Yahoo Calendar...");
    });

    btnIcs.addEventListener('click', (e) => {
      e.preventDefault();
      syncCurrentEventFromForm();
      if (!currentEvent.startDate) {
        showSnackbar("⚠️ Veuillez d'abord indiquer ou dicter la date de l'événement.");
        eventStartDateInput.focus();
        return;
      }
      CalendarGenerator.downloadIcs(currentEvent);
      if (typeof confetti === 'function') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
      }
      showSnackbar("Fichier .ics téléchargé (Apple / Android / PC) !");
    });

    // Share & Messenger Formats Modal & Actions
    const shareMessageModal = document.getElementById('share-message-modal');
    const shareMessageClose = document.getElementById('share-message-close');
    const shareMessagePreview = document.getElementById('share-message-preview');
    const btnShareModalMessenger = document.getElementById('btn-share-modal-messenger');
    const btnShareModalSms = document.getElementById('btn-share-modal-sms');
    const btnShareModalWhatsapp = document.getElementById('btn-share-modal-whatsapp');
    const btnShareModalCopy = document.getElementById('btn-share-modal-copy');

    btnShareMessenger.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const msgText = CalendarGenerator.generateMessengerText(currentEvent);

      if (shareMessagePreview) {
        shareMessagePreview.value = msgText;
      }
      shareMessageModal?.classList.add('open');
      await copyToClipboard(msgText);
      showSnackbar("💬 Message propre copié ! Choisissez votre moyen d'envoi.");
    });

    shareMessageClose?.addEventListener('click', () => {
      shareMessageModal?.classList.remove('open');
    });

    shareMessageModal?.addEventListener('click', (e) => {
      if (e.target === shareMessageModal) shareMessageModal.classList.remove('open');
    });

    btnShareModalMessenger?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const msgText = CalendarGenerator.generateMessengerText(currentEvent);
      await copyToClipboard(msgText);
      window.open('https://www.messenger.com/', '_blank');
      showSnackbar("Message copié ! Collez-le dans votre conversation Messenger.");
    });

    btnShareModalSms?.addEventListener('click', () => {
      syncCurrentEventFromForm();
      const msgText = CalendarGenerator.generateMessengerText(currentEvent);
      window.location.href = `sms:?&body=${encodeURIComponent(msgText)}`;
    });

    btnShareModalWhatsapp?.addEventListener('click', () => {
      syncCurrentEventFromForm();
      const msgText = CalendarGenerator.generateMessengerText(currentEvent);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msgText)}`, '_blank');
    });

    btnShareModalCopy?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const msgText = CalendarGenerator.generateMessengerText(currentEvent);
      await copyToClipboard(msgText);
      showSnackbar("📋 Message complet copié dans le presse-papier !");
    });

    btnCopyShareLink.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const cbPin = document.getElementById('cb-enable-pin');
      const pinInput = document.getElementById('input-event-pin');

      if (cbPin && cbPin.checked) {
        const pin = pinInput ? pinInput.value.trim() : '';
        if (!pin || pin.length < 4) {
          showSnackbar("⚠️ Veuillez entrer un code PIN à 4 chiffres.");
          pinInput?.focus();
          return;
        }
        const encUrl = await CryptoVault.generateEncryptedShareUrl(currentEvent, pin);
        await copyToClipboard(encUrl);
        showSnackbar("🔒 Lien d'événement CHIFFRÉ avec PIN copié !");
      } else {
        const shareUrl = CalendarGenerator.generateShareUrl(currentEvent);
        await copyToClipboard(shareUrl);
        showSnackbar("Lien d'événement copié dans le presse-papier !");
      }
    });

    // QR Code Modal
    btnShowQr.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      await openQrModal();
    });

    qrCloseBtn.addEventListener('click', () => {
      qrModal.classList.remove('open');
    });

    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) {
        qrModal.classList.remove('open');
      }
    });

    // Invitation Card PNG Modal & 5 Templates Selector + Custom Photo
    document.getElementById('btn-download-card')?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      openCardModal();
    });

    // Template Selector Buttons
    document.querySelectorAll('.template-btn:not(#btn-upload-custom-card-bg)').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTemplateId = btn.getAttribute('data-template') || 'confetti';
        customCardBgSrc = null; // reset custom photo to use preset
        await refreshCardPreview();
      });
    });

    // Custom Photo Upload for Invitation Card
    btnUploadCustomCardBg?.addEventListener('click', () => {
      inputCustomCardBg?.click();
    });

    inputCustomCardBg?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          customCardBgSrc = event.target.result;
          document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
          btnUploadCustomCardBg?.classList.add('active');
          await refreshCardPreview();
          showSnackbar("Photo importée avec succès comme arrière-plan !");
        };
        reader.readAsDataURL(file);
      }
    });

    // Custom Image & Screenshot OCR Import in Main Textarea Toolbar
    btnImportImgText?.addEventListener('click', () => {
      inputMsgImage?.click();
    });

    inputMsgImage?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        showSnackbar("📸 Analyse de votre capture d'écran en cours...");
        const reader = new FileReader();
        reader.onload = async (event) => {
          customCardBgSrc = event.target.result;
        };
        reader.readAsDataURL(file);

        if (typeof OcrEngine !== 'undefined') {
          try {
            const extractedText = await OcrEngine.recognizeImage(file);
            if (extractedText && extractedText.trim().length > 10) {
              rawInput.value = extractedText.trim();
              runParser();
              showSnackbar("📸 Texte de la capture extrait & analysé automatiquement !");
              return;
            }
          } catch (err) {
            console.warn("OCR fallback note:", err);
          }
        }
        showSnackbar(`Image "${file.name}" importée pour votre affiche personnalisée !`);
      }
    });

    // Live Glassmorphism Customizer Controls
    const sliderGlassOpacity = document.getElementById('slider-glass-opacity');
    const tintBtns = document.querySelectorAll('.tint-btn');
    let customGlassOptions = { glassOpacity: 0.28, tintColor: 'white' };

    sliderGlassOpacity?.addEventListener('input', async (e) => {
      customGlassOptions.glassOpacity = parseFloat(e.target.value);
      await refreshCardPreview();
    });

    tintBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        tintBtns.forEach(b => b.style.border = '1px solid rgba(0,0,0,0.2)');
        btn.style.border = '2px solid var(--md-sys-color-primary)';
        customGlassOptions.tintColor = btn.getAttribute('data-tint') || 'white';
        await refreshCardPreview();
      });
    });

    // 3D Envelope Interactive Test Modal
    const btnTestEnvelope = document.getElementById('btn-test-envelope');
    const envelopeModal = document.getElementById('envelope-modal');
    const envelopeModalClose = document.getElementById('envelope-modal-close');
    const envelopeModalMount = document.getElementById('envelope-modal-mount');

    btnTestEnvelope?.addEventListener('click', () => {
      syncCurrentEventFromForm();
      if (!envelopeModal || !envelopeModalMount) return;
      envelopeModal.classList.add('open');
      Envelope3D.renderEnvelope(envelopeModalMount, currentEvent, () => {
        if (typeof confetti === 'function') {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      });
    });

    envelopeModalClose?.addEventListener('click', () => {
      envelopeModal.classList.remove('open');
    });

    envelopeModal?.addEventListener('click', (e) => {
      if (e.target === envelopeModal) {
        envelopeModal.classList.remove('open');
      }
    });

    // Download button inside modal
    btnModalDownloadPng?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      if (typeof CardGenerator !== 'undefined') {
        showSnackbar("Génération de l'affiche PNG en cours...");
        await CardGenerator.downloadCard(currentEvent, selectedTemplateId, customCardBgSrc, customGlassOptions);
        if (typeof confetti === 'function') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
        }
        showSnackbar("Affiche d'invitation PNG téléchargée !");
      }
    });

    // Card Modal Close
    cardModalClose?.addEventListener('click', () => {
      cardModal.classList.remove('open');
    });

    cardModal?.addEventListener('click', (e) => {
      if (e.target === cardModal) {
        cardModal.classList.remove('open');
      }
    });

    // Navigation GPS & Weather Helpers
    document.getElementById('nav-google')?.addEventListener('click', () => {
      const loc = eventLocationInput.value || currentEvent.title || 'Montreal';
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
    });

    document.getElementById('nav-waze')?.addEventListener('click', () => {
      const loc = eventLocationInput.value || currentEvent.title || 'Montreal';
      window.open(`https://waze.com/ul?q=${encodeURIComponent(loc)}`, '_blank');
    });

    document.getElementById('nav-apple')?.addEventListener('click', () => {
      const loc = eventLocationInput.value || currentEvent.title || 'Montreal';
      window.open(`https://maps.apple.com/?q=${encodeURIComponent(loc)}`, '_blank');
    });

    document.getElementById('nav-weather')?.addEventListener('click', () => {
      const loc = eventLocationInput.value || 'Montreal';
      const date = eventStartDateInput.value || '';
      window.open(`https://www.google.com/search?q=meteo+${encodeURIComponent(loc)}+${encodeURIComponent(date)}`, '_blank');
    });

    // Potluck Organizer Generator
    document.getElementById('btn-copy-potluck')?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      let potluckMsg = `📋 *Organisation / Ce qu'on apporte pour : ${currentEvent.title}*\n\n`;
      potluckMsg += `📅 *Date :* ${CalendarGenerator.formatDateFrench(currentEvent.startDate)}\n\n`;
      potluckMsg += `Indiquez votre nom à côté de ce que vous apportez :\n`;
      potluckMsg += `🥤 Boissons / Jus / Glace : [ ]\n`;
      potluckMsg += `🥗 Entrées / Salades / Trempettes : [ ]\n`;
      potluckMsg += `🍟 Croustilles / Grignotines : [ ]\n`;
      potluckMsg += `🍖 Plat principal / Viandes / BBQ : [ ]\n`;
      potluckMsg += `🎂 Dessert / Gâteau : [ ]\n`;
      potluckMsg += `🍽️ Assiettes & Verres jetables : [ ]\n\n`;
      potluckMsg += `_Répondez à ce message pour réserver votre apport !_`;

      await copyToClipboard(potluckMsg);
      showSnackbar("Liste de Potluck copiée ! Prête à coller dans Messenger.");
    });

    // Location Helper Chips
    document.getElementById('loc-gps')?.addEventListener('click', requestUserGpsLocation);
    document.getElementById('loc-home')?.addEventListener('click', () => {
      eventLocationInput.value = "À la maison / Chez nous";
      syncCurrentEventFromForm();
      showSnackbar("Lieu défini : À la maison");
    });
    document.getElementById('loc-maps')?.addEventListener('click', () => {
      const q = encodeURIComponent(eventLocationInput.value || currentEvent.title || 'restaurant');
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
    });
  }

  /**
   * Setup Web Speech API Voice Dictation & Audio Note Import
   */
  let speechRecognizer = null;
  let isRecordingVoice = false;
  let baseInputBeforeVoice = '';
  let finalSpokenTranscript = '';

  function setupVoiceDictation() {
    const btnVoice = document.getElementById('btn-voice-dictation');
    const micIcon = document.getElementById('mic-icon');
    const micLabel = document.getElementById('mic-label');
    const btnImportAudio = document.getElementById('btn-import-audio');
    const inputAudioFile = document.getElementById('input-audio-file');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      speechRecognizer = new SpeechRecognition();
      speechRecognizer.continuous = true;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = 'fr-CA'; // French default with fallback

      speechRecognizer.onstart = () => {
        baseInputBeforeVoice = rawInput.value.trim();
        finalSpokenTranscript = '';
      };

      speechRecognizer.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSpokenTranscript += (finalSpokenTranscript ? ' ' : '') + event.results[i][0].transcript.trim();
          } else {
            interimTranscript += ' ' + event.results[i][0].transcript;
          }
        }

        const fullSpoken = (finalSpokenTranscript + ' ' + interimTranscript).trim();
        if (fullSpoken) {
          rawInput.value = (baseInputBeforeVoice + (baseInputBeforeVoice ? ' ' : '') + fullSpoken).replace(/\s+/g, ' ').trim();
          runRealTimeDetection(rawInput.value);
          currentEvent = EventParser.parse(rawInput.value);
          populateForm(currentEvent);
        }
      };

      speechRecognizer.onerror = (event) => {
        console.warn('Speech error:', event.error);
        if (event.error === 'not-allowed') {
          showSnackbar("Accès au microphone refusé. Autorisez le micro pour dicter.");
          stopRecording();
        }
      };

      speechRecognizer.onend = () => {
        if (isRecordingVoice) {
          // Reconnect seamlessly to allow continuous dictation
          try {
            speechRecognizer.start();
          } catch (e) {
            stopRecording();
          }
        }
      };
    }

    btnVoice?.addEventListener('click', () => {
      if (!SpeechRecognition) {
        showSnackbar("La dictée vocale n'est pas supportée par votre navigateur (essayez sur Chrome).");
        return;
      }

      if (!isRecordingVoice) {
        startRecording();
      } else {
        stopRecording();
      }
    });

    function startRecording() {
      try {
        baseInputBeforeVoice = rawInput.value.trim();
        finalSpokenTranscript = '';
        speechRecognizer.start();
        isRecordingVoice = true;
        btnVoice.classList.add('recording-active');
        if (micIcon) micIcon.textContent = 'mic_off';
        if (micLabel) micLabel.textContent = 'Écoute en direct... Parlez !';
        showSnackbar("🎙️ Micro activé : parlez normalement, la détection s'allume en vert !");
      } catch (err) {
        console.warn(err);
      }
    }

    function stopRecording() {
      isRecordingVoice = false;
      try { speechRecognizer.stop(); } catch (e) {}
      btnVoice?.classList.remove('recording-active');
      if (micIcon) micIcon.textContent = 'mic';
      if (micLabel) micLabel.textContent = 'Dictée Vocale en Direct';
      showSnackbar("Dictée terminée.");
    }

    // Audio File Import & In-Browser Player
    const audioPlayerContainer = document.getElementById('audio-player-container');
    const audioVoiceNotePlayer = document.getElementById('audio-voice-note-player');

    btnImportAudio?.addEventListener('click', () => {
      inputAudioFile?.click();
    });

    inputAudioFile?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const audioUrl = URL.createObjectURL(file);
        if (audioVoiceNotePlayer && audioPlayerContainer) {
          audioVoiceNotePlayer.src = audioUrl;
          audioPlayerContainer.style.display = 'block';
          audioVoiceNotePlayer.play().catch(() => {});
        }
        showSnackbar(`🎵 Note vocale "${file.name}" chargée ! Vous pouvez l'écouter en dictant.`);
      }
    });
  }

  /**
   * Real-time Detection Checklist Updater
   * Dynamically turns badges GREEN when info is detected in real time!
   */
  function runRealTimeDetection(text) {
    if (!text || !text.trim()) {
      resetBadges();
      return;
    }

    const parsed = EventParser.parse(text);
    if (!parsed) return;

    let score = 0;

    // 1. Title
    const hasTitle = parsed.confidence && parsed.confidence.title && parsed.title && parsed.title !== 'Événement / Rassemblement';
    updateBadge('badge-title', hasTitle);
    if (hasTitle) score++;

    // 2. Date
    const hasDate = parsed.confidence && parsed.confidence.date;
    updateBadge('badge-date', hasDate);
    if (hasDate) score++;

    // 3. Time
    const hasTime = parsed.confidence && parsed.confidence.time;
    updateBadge('badge-time', hasTime);
    if (hasTime) score++;

    // 4. Location
    const hasLocation = parsed.confidence && parsed.confidence.location && parsed.location;
    updateBadge('badge-location', hasLocation);
    if (hasLocation) score++;

    // 5. Organizer
    const hasOrganizer = !!parsed.organizer;
    updateBadge('badge-organizer', hasOrganizer);
    if (hasOrganizer) score++;

    // 6. Theme / Details
    const hasDetails = !!(parsed.theme || parsed.foodInfo);
    updateBadge('badge-details', hasDetails);
    if (hasDetails) score++;

    // Score element
    const scoreEl = document.getElementById('detection-score');
    if (scoreEl) scoreEl.textContent = `${score}/6`;

    // Dynamic Guidance Hint
    const hintText = document.getElementById('hint-text');
    const hintContainer = document.getElementById('detection-feedback-hint');
    if (hintText && hintContainer) {
      if (score >= 5) {
        hintText.textContent = "🎉 Excellent ! Toutes les informations majeures sont détectées et prêtes.";
        hintContainer.classList.add('complete');
      } else {
        hintContainer.classList.remove('complete');
        const missing = [];
        if (!hasDate) missing.push("Date");
        if (!hasTime) missing.push("Heure");
        if (!hasLocation) missing.push("Lieu");
        if (!hasTitle) missing.push("Titre");
        if (!hasOrganizer) missing.push("Hôte");
        hintText.textContent = `💡 Il vous manque : ${missing.join(', ')}. Dites ou écrivez ces détails !`;
      }
    }
  }

  function updateBadge(badgeId, isDetected) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    if (isDetected) {
      badge.classList.add('detected');
    } else {
      badge.classList.remove('detected');
    }
  }

  function resetBadges() {
    ['badge-title', 'badge-date', 'badge-time', 'badge-location', 'badge-organizer', 'badge-details'].forEach(id => {
      updateBadge(id, false);
    });
    const scoreEl = document.getElementById('detection-score');
    if (scoreEl) scoreEl.textContent = '0/6';
    const hintText = document.getElementById('hint-text');
    if (hintText) hintText.textContent = 'Collez votre texte ou parlez au micro pour analyser en direct.';
  }

  /**
   * Parses raw textarea input and updates the form
   */
  function runParser() {
    const text = rawInput.value;
    if (!text.trim()) {
      showSnackbar("Veuillez entrer ou coller un message.");
      resetBadges();
      return;
    }

    currentEvent = EventParser.parse(text);
    populateForm(currentEvent);
    runRealTimeDetection(text);
    showSnackbar("Message analysé et réorganisé avec succès !");
  }

  /**
   * Fills form fields with parsed event data
   */
  function populateForm(event) {
    if (!event) return;

    eventTitleInput.value = event.title || '';
    eventOrganizerInput.value = event.organizer || '';
    eventStartDateInput.value = event.startDate || '';
    eventStartTimeInput.value = event.startTime || '12:00';
    eventEndDateInput.value = event.endDate || event.startDate || '';
    eventEndTimeInput.value = event.endTime || '18:00';
    eventLocationInput.value = event.location || '';
    eventThemeInput.value = event.theme || '';
    eventFoodInput.value = event.foodInfo || '';
    if (eventGiftListInput) eventGiftListInput.value = event.giftListUrl || '';
    eventNotesInput.value = event.notes || '';

    updateCountdown(event.startDate, event.startTime);
    updateSmartToolsPreviews(event);
  }

  /**
   * Reads back any manual edits from the form into currentEvent
   */
  function syncCurrentEventFromForm() {
    if (!currentEvent) currentEvent = {};

    currentEvent.title = eventTitleInput.value.trim() || 'Événement';
    currentEvent.organizer = eventOrganizerInput.value.trim();
    currentEvent.startDate = eventStartDateInput.value;
    currentEvent.startTime = eventStartTimeInput.value;
    currentEvent.endDate = eventEndDateInput.value || eventStartDateInput.value;
    currentEvent.endTime = eventEndTimeInput.value;
    currentEvent.location = eventLocationInput.value.trim();
    currentEvent.theme = eventThemeInput.value.trim();
    currentEvent.foodInfo = eventFoodInput.value.trim();
    if (eventGiftListInput) currentEvent.giftListUrl = eventGiftListInput.value.trim();
    currentEvent.notes = eventNotesInput.value.trim();

    updateCountdown(currentEvent.startDate, currentEvent.startTime);
  }

  /**
   * Updates the countdown badge (e.g. "Dans 45 jours", "Aujourd'hui", etc.)
   */
  function updateCountdown(dateStr, timeStr) {
    if (!dateStr) {
      countdownEl.textContent = "Date à préciser";
      return;
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const [h, min] = (timeStr || '12:00').split(':').map(Number);
    const target = new Date(y, m - 1, d, h, min);
    const now = new Date();

    const diffMs = target - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      countdownEl.textContent = `⏳ Dans ${diffDays} jours`;
    } else if (diffDays === 1) {
      countdownEl.textContent = `⏳ Demain !`;
    } else if (diffDays === 0) {
      countdownEl.textContent = `🎉 C'est aujourd'hui !`;
    } else {
      countdownEl.textContent = `Événement passé (${Math.abs(diffDays)} jours)`;
    }
  }

  /**
   * Request GPS Location via Browser Geolocation API & Reverse Geocode to real clean address
   */
  function requestUserGpsLocation() {
    if (!navigator.geolocation) {
      showSnackbar("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    showSnackbar("Recherche de votre adresse via GPS...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);

        // Try reverse geocoding via OpenStreetMap free reverse API to get actual street name and city!
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await resp.json();
          if (data && data.address) {
            const addr = data.address;
            const road = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || '';
            const num = addr.house_number || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
            const postal = addr.postcode || '';

            const streetPart = num ? `${num} ${road}` : road;
            let cleanAddr = [streetPart, city, postal].filter(Boolean).join(', ');
            if (!cleanAddr && data.display_name) {
              cleanAddr = data.display_name.split(',').slice(0, 3).join(',');
            }

            if (cleanAddr) {
              eventLocationInput.value = cleanAddr;
              syncCurrentEventFromForm();
              showSnackbar(`📍 Adresse détectée : ${cleanAddr}`);
              return;
            }
          }
        } catch (e) {
          // Fallback if offline or network error
        }

        // Clean coordinates fallback without any 'Position GPS:' prefix
        eventLocationInput.value = `${lat}, ${lng}`;
        syncCurrentEventFromForm();
        showSnackbar(`📍 Coordonnées GPS ajoutées : ${lat}, ${lng}`);
      },
      (err) => {
        showSnackbar("Impossible d'accéder à la position GPS. Vous pouvez taper l'adresse manuellement.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  /**
   * Opens the Card Template Modal and renders the initial canvas preview
   */
  async function openCardModal() {
    if (!cardModal || !cardCanvasWrapper) return;
    cardModal.classList.add('open');
    await refreshCardPreview();
  }

  /**
   * Refreshes the canvas card preview with the selected template and QR code
   */
  async function refreshCardPreview() {
    if (!cardCanvasWrapper || typeof CardGenerator === 'undefined') return;
    cardCanvasWrapper.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--md-sys-color-primary);">Chargement de votre affiche...</div>';

    const canvas = await CardGenerator.renderCard(currentEvent, selectedTemplateId, customCardBgSrc, customGlassOptions);
    cardCanvasWrapper.innerHTML = '';
    cardCanvasWrapper.appendChild(canvas);
  }

  /**
   * Renders the QR Code modal for quick mobile scanning (supports Encrypted PIN URL)
   */
  async function openQrModal() {
    const qrContainer = document.getElementById('qrcode-container');
    qrContainer.innerHTML = '';

    const cbPin = document.getElementById('cb-enable-pin');
    const pinInput = document.getElementById('input-event-pin');
    let shareUrl = '';

    if (cbPin && cbPin.checked) {
      const pin = pinInput ? pinInput.value.trim() : '';
      if (!pin || pin.length < 4) {
        showSnackbar("⚠️ Veuillez entrer un code PIN à 4 chiffres pour chiffrer le QR code.");
        pinInput?.focus();
        return;
      }
      shareUrl = await CryptoVault.generateEncryptedShareUrl(currentEvent, pin);
      showSnackbar("🔒 QR Code chiffré par PIN généré !");
    } else {
      shareUrl = CalendarGenerator.generateShareUrl(currentEvent);
    }

    qrCodeInstance = new QRCode(qrContainer, {
      text: shareUrl,
      width: 220,
      height: 220,
      colorDark: '#0b57d0',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    qrModal.classList.add('open');
  }

  /**
   * Setup Local Host Profile Management (Saved 100% in browser LocalStorage)
   */
  function setupHostProfile() {
    const btnOpenProfileModal = document.getElementById('btn-open-profile-modal');
    const profileModal = document.getElementById('profile-modal');
    const profileModalClose = document.getElementById('profile-modal-close');
    const btnSaveHostProfile = document.getElementById('btn-save-host-profile');
    const profileHostName = document.getElementById('profile-host-name');
    const profileHostAddress = document.getElementById('profile-host-address');
    const profileHostAccess = document.getElementById('profile-host-access');
    const locSavedHome = document.getElementById('loc-saved-home');

    // Load existing profile from localStorage
    const saved = CryptoVault.getHostProfile();
    if (saved) {
      if (profileHostName) profileHostName.value = saved.name || '';
      if (profileHostAddress) profileHostAddress.value = saved.address || '';
      if (profileHostAccess) profileHostAccess.value = saved.access || '';
    }

    btnOpenProfileModal?.addEventListener('click', () => {
      const currentSaved = CryptoVault.getHostProfile();
      if (currentSaved) {
        if (profileHostName) profileHostName.value = currentSaved.name || '';
        if (profileHostAddress) profileHostAddress.value = currentSaved.address || '';
        if (profileHostAccess) profileHostAccess.value = currentSaved.access || '';
      }
      profileModal?.classList.add('open');
    });

    profileModalClose?.addEventListener('click', () => {
      profileModal?.classList.remove('open');
    });

    profileModal?.addEventListener('click', (e) => {
      if (e.target === profileModal) profileModal.classList.remove('open');
    });

    btnSaveHostProfile?.addEventListener('click', () => {
      const profile = {
        name: profileHostName?.value.trim() || '',
        address: profileHostAddress?.value.trim() || '',
        access: profileHostAccess?.value.trim() || ''
      };
      CryptoVault.saveHostProfile(profile);
      profileModal?.classList.remove('open');
      showSnackbar("⭐ Profil hôte sauvegardé localement dans votre navigateur !");
    });

    // Helper button: Apply saved address in 1 click
    locSavedHome?.addEventListener('click', () => {
      const p = CryptoVault.getHostProfile();
      if (p && p.address) {
        eventLocationInput.value = p.address;
        if (p.name && !eventOrganizerInput.value) {
          eventOrganizerInput.value = p.name;
        }
        syncCurrentEventFromForm();
        showSnackbar(`⭐ Adresse enregistrée appliquée : ${p.address}`);
      } else {
        showSnackbar("Aucune adresse enregistrée. Cliquez sur l'icône Profil en haut pour l'ajouter !");
        profileModal?.classList.add('open');
      }
    });

    // GiftList QR Code Modal Handlers
    const btnGiftlistQr = document.getElementById('btn-giftlist-qr');
    const giftlistQrModal = document.getElementById('giftlist-qr-modal');
    const giftlistQrClose = document.getElementById('giftlist-qr-close');
    const giftlistQrContainer = document.getElementById('giftlist-qrcode-container');
    const giftlistUrlDisplay = document.getElementById('giftlist-url-display');
    const btnCopyGiftlistUrl = document.getElementById('btn-copy-giftlist-url');

    btnGiftlistQr?.addEventListener('click', () => {
      syncCurrentEventFromForm();
      const giftUrl = eventGiftListInput?.value.trim() || currentEvent?.giftListUrl;
      if (!giftUrl) {
        showSnackbar("Veuillez d'abord coller le lien de votre GiftList ou cagnotte.");
        eventGiftListInput?.focus();
        return;
      }

      if (giftlistQrContainer) {
        giftlistQrContainer.innerHTML = '';
        new QRCode(giftlistQrContainer, {
          text: giftUrl,
          width: 200,
          height: 200,
          colorDark: '#d97706',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      }

      if (giftlistUrlDisplay) giftlistUrlDisplay.textContent = giftUrl;
      giftlistQrModal?.classList.add('open');
    });

    giftlistQrClose?.addEventListener('click', () => {
      giftlistQrModal?.classList.remove('open');
    });

    giftlistQrModal?.addEventListener('click', (e) => {
      if (e.target === giftlistQrModal) giftlistQrModal.classList.remove('open');
    });

    btnCopyGiftlistUrl?.addEventListener('click', async () => {
      const giftUrl = eventGiftListInput?.value.trim() || currentEvent?.giftListUrl;
      if (giftUrl) {
        await copyToClipboard(giftUrl);
        showSnackbar("Lien GiftList copié !");
      }
    });
  }

  /**
   * Setup Zero-Server PIN 4-Digit Security & Decryption Keypad
   */
  function setupPinSecurity() {
    const cbPin = document.getElementById('cb-enable-pin');
    const inputPin = document.getElementById('input-event-pin');
    const pinHint = document.getElementById('pin-security-hint');

    cbPin?.addEventListener('change', () => {
      if (cbPin.checked) {
        if (inputPin) inputPin.style.display = 'block';
        if (pinHint) pinHint.style.display = 'block';
        inputPin?.focus();
      } else {
        if (inputPin) inputPin.style.display = 'none';
        if (pinHint) pinHint.style.display = 'none';
      }
    });

    // Auto-advance for 4-digit PIN lock screen input boxes
    const pinBoxes = [
      document.getElementById('pin-input-1'),
      document.getElementById('pin-input-2'),
      document.getElementById('pin-input-3'),
      document.getElementById('pin-input-4')
    ];

    pinBoxes.forEach((box, index) => {
      box?.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < 3) {
          pinBoxes[index + 1]?.focus();
        }
      });

      box?.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          pinBoxes[index - 1]?.focus();
        }
        if (e.key === 'Enter') {
          document.getElementById('btn-submit-pin')?.click();
        }
      });
    });
  }

  /**
   * Opens PIN Lock Modal when an encrypted URL is detected
   */
  function openPinLockModal(encParams) {
    const pinModal = document.getElementById('pin-lock-modal');
    const btnSubmit = document.getElementById('btn-submit-pin');
    const pinError = document.getElementById('pin-error-msg');
    const pinBoxes = [
      document.getElementById('pin-input-1'),
      document.getElementById('pin-input-2'),
      document.getElementById('pin-input-3'),
      document.getElementById('pin-input-4')
    ];

    if (!pinModal) return;
    pinModal.classList.add('open');
    pinBoxes[0]?.focus();

    btnSubmit?.addEventListener('click', async () => {
      const pin = pinBoxes.map(b => b?.value || '').join('');
      if (pin.length < 4) {
        if (pinError) {
          pinError.textContent = "Veuillez entrer les 4 chiffres du code PIN.";
          pinError.style.display = 'block';
        }
        return;
      }

      try {
        const decrypted = await CryptoVault.decryptEvent(encParams.c, encParams.s, encParams.iv, pin);
        pinModal.classList.remove('open');
        currentEvent = decrypted;
        populateForm(currentEvent);
        setupGuestBanner(currentEvent);
        if (typeof confetti === 'function') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
        showSnackbar("🔓 Événement déverrouillé avec succès !");
      } catch (err) {
        if (pinError) {
          pinError.textContent = "❌ Code PIN incorrect. Veuillez réessayer.";
          pinError.style.display = 'block';
        }
        pinBoxes.forEach(b => { if (b) b.value = ''; });
        pinBoxes[0]?.focus();
      }
    });
  }

  /**
   * Universal Clipboard copy helper with multiple fallbacks
   */
  async function copyToClipboard(text) {
    if (!text) return false;

    // Method 1: Async Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fallback to Method 2
      }
    }

    // Method 2: Hidden textarea selection + execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (err) {
      console.warn('Clipboard copy error', err);
      return false;
    }
  }

  /**
   * Smart Tools Suite Event Handlers and Live Calculators
   */
  function setupSmartTools() {
    const calcAdults = document.getElementById('calc-adults');
    const calcKids = document.getElementById('calc-kids');
    const btnApplyAllergies = document.getElementById('btn-apply-allergies');
    const btnCreateCagnotte = document.getElementById('btn-create-cagnotte');
    const btnReplyAccept = document.getElementById('btn-reply-accept');
    const btnReplyDecline = document.getElementById('btn-reply-decline');
    const btnReplyLate = document.getElementById('btn-reply-late');
    const btnExportPlacecards = document.getElementById('btn-export-placecards');
    const btnExportJson = document.getElementById('btn-export-json');

    // 1. Live Food & Drinks calculation
    function refreshFoodCalc() {
      const adults = parseInt(calcAdults?.value || '10', 10);
      const kids = parseInt(calcKids?.value || '2', 10);
      const res = SmartTools.calculateFoodAndDrinks(adults, kids, currentEvent?.startTime?.startsWith('12') ? 'midi' : 'soiree');

      const calcResults = document.getElementById('calc-results');
      if (calcResults) {
        calcResults.innerHTML = `
          🍕 <strong>${res.pizza} grandes pizzas</strong> (ou ~${res.bbqMeatKg} kg de viande BBQ)<br>
          🍺 <strong>${res.beersWine} bières / consommations</strong> (adultes)<br>
          🥤 <strong>${res.softDrinksLiters} L de boissons gazeuses / eau / jus</strong><br>
          🧊 <strong>${res.iceBags} sac(s) de glace</strong> & 🍟 <strong>${res.chipsBags} sacs de croustilles</strong><br>
          🎂 <strong>Gâteau : ${res.cakePortions} portions</strong>
        `;
      }
    }

    calcAdults?.addEventListener('input', refreshFoodCalc);
    calcKids?.addEventListener('input', refreshFoodCalc);
    refreshFoodCalc();

    // 2. Allergies Checklist Appender
    btnApplyAllergies?.addEventListener('click', () => {
      const checked = Array.from(document.querySelectorAll('.allergy-cb:checked')).map(cb => cb.value);
      if (checked.length === 0) {
        showSnackbar("Veuillez cocher au moins une restriction alimentaire.");
        return;
      }
      const allergyText = `Options alimentaires prévues : ${checked.join(', ')}`;
      if (eventFoodInput.value) {
        eventFoodInput.value += ` • ${allergyText}`;
      } else {
        eventFoodInput.value = allergyText;
      }
      syncCurrentEventFromForm();
      showSnackbar("Allergies ajoutées aux consignes de l'événement !");
    });

    // 3. Gift Ideas / Cagnotte
    btnCreateCagnotte?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const cagnotteMsg = `🎁 *Cadeau commun / Cagnotte pour : ${currentEvent.title}*\n\nPour ceux qui souhaitent participer au cadeau commun, vous pouvez faire un virement Interac ou PayPal !\nIndiquez votre nom pour qu'on signe la carte tous ensemble ! 😊`;
      await copyToClipboard(cagnotteMsg);
      showSnackbar("Message de cagnotte copié dans le presse-papier !");
    });

    // 4. Quick Auto-Replies
    btnReplyAccept?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const rep = SmartTools.getAutoReplies(currentEvent);
      await copyToClipboard(rep.accept);
      showSnackbar("Réponse positive copiée ! Collez-la dans Messenger.");
    });

    btnReplyDecline?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const rep = SmartTools.getAutoReplies(currentEvent);
      await copyToClipboard(rep.decline);
      showSnackbar("Réponse de déclinaison polie copiée !");
    });

    btnReplyLate?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const rep = SmartTools.getAutoReplies(currentEvent);
      await copyToClipboard(rep.late);
      showSnackbar("Message de retard copié !");
    });

    // 5. Multi-Format Exports
    btnExportPlacecards?.addEventListener('click', () => {
      syncCurrentEventFromForm();
      SmartTools.printPlaceCards(currentEvent);
    });

    btnExportJson?.addEventListener('click', () => {
      syncCurrentEventFromForm();
      SmartTools.exportJson(currentEvent);
      showSnackbar("Fichier JSON téléchargé !");
    });

    // 6. Live Route Share
    const btnLiveRoute = document.getElementById('btn-live-route');
    btnLiveRoute?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const msg = SmartTools.getLiveRouteShareMessage(currentEvent);
      await copyToClipboard(msg);
      showSnackbar("🚗 Message de trajet en direct copié ! Prêt à envoyer.");
    });

    // 7. HTML Email Modal
    const btnOpenEmailModal = document.getElementById('btn-open-email-modal');
    const emailModal = document.getElementById('email-modal');
    const emailModalClose = document.getElementById('email-modal-close');
    const emailPreviewContainer = document.getElementById('email-preview-container');
    const btnCopyEmailHtml = document.getElementById('btn-copy-email-html');

    btnOpenEmailModal?.addEventListener('click', () => {
      syncCurrentEventFromForm();
      const htmlCode = SmartTools.generateHtmlEmail(currentEvent);
      if (emailPreviewContainer) {
        emailPreviewContainer.innerHTML = htmlCode;
      }
      emailModal?.classList.add('open');
    });

    emailModalClose?.addEventListener('click', () => {
      emailModal?.classList.remove('open');
    });

    emailModal?.addEventListener('click', (e) => {
      if (e.target === emailModal) emailModal.classList.remove('open');
    });

    btnCopyEmailHtml?.addEventListener('click', async () => {
      syncCurrentEventFromForm();
      const htmlCode = SmartTools.generateHtmlEmail(currentEvent);
      await copyToClipboard(htmlCode);
      showSnackbar("Code HTML du courriel copié dans le presse-papier !");
    });

    // 8. Mobile Widget Modal
    const btnOpenWidgetModal = document.getElementById('btn-open-widget-modal');
    const widgetModal = document.getElementById('widget-modal');
    const widgetModalClose = document.getElementById('widget-modal-close');
    const widgetModalOk = document.getElementById('widget-modal-ok');

    btnOpenWidgetModal?.addEventListener('click', () => {
      widgetModal?.classList.add('open');
    });

    widgetModalClose?.addEventListener('click', () => {
      widgetModal?.classList.remove('open');
    });

    widgetModalOk?.addEventListener('click', () => {
      widgetModal?.classList.remove('open');
    });

    widgetModal?.addEventListener('click', (e) => {
      if (e.target === widgetModal) widgetModal.classList.remove('open');
    });

    // 9. VIP Access & Door Code Copy Button
    const btnCopyAccessCode = document.getElementById('btn-copy-access-code');
    btnCopyAccessCode?.addEventListener('click', async () => {
      const codeText = document.getElementById('vip-access-text')?.textContent || '';
      await copyToClipboard(codeText);
      showSnackbar("Code d'accès & Stationnement copiés !");
    });
  }

  /**
   * Updates dynamic suggestions (Gift ideas, Dress code, VIP Access) when an event is parsed
   */
  function updateSmartToolsPreviews(event) {
    if (!event || typeof SmartTools === 'undefined') return;

    // VIP Access & Parking Display
    const vipBanner = document.getElementById('vip-access-banner');
    const vipText = document.getElementById('vip-access-text');
    if (vipBanner && vipText) {
      const accessDetails = [event.accessCode, event.parkingInfo].filter(Boolean).join(' • ');
      if (accessDetails) {
        vipText.textContent = accessDetails;
        vipBanner.style.display = 'flex';
      } else {
        vipBanner.style.display = 'none';
      }
    }

    // Gift ideas list
    const giftListEl = document.getElementById('gift-ideas-list');
    if (giftListEl) {
      const ideas = SmartTools.getGiftIdeas(event);
      giftListEl.innerHTML = ideas.map(idea => `<div>${idea}</div>`).join('');
    }

    // Dress code preview
    const dressEl = document.getElementById('dress-code-preview');
    if (dressEl) {
      const dress = SmartTools.getDressCodeInfo((event.theme || '') + ' ' + (event.title || '') + ' ' + (event.notes || ''));
      dressEl.innerHTML = `
        <strong>${dress.label}</strong><br>
        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">${dress.tips}</span>
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          ${dress.colors.map(c => `<div style="width: 20px; height: 20px; border-radius: 50%; background: ${c}; border: 1px solid rgba(0,0,0,0.2);"></div>`).join('')}
        </div>
      `;
    }
  }

  /**
   * Displays an M3 snackbar toast feedback
   */
  let snackbarTimeout = null;
  function showSnackbar(message) {
    if (!snackbar || !snackbarText) return;
    snackbarText.textContent = message;
    snackbar.classList.add('show');

    if (snackbarTimeout) clearTimeout(snackbarTimeout);
    snackbarTimeout = setTimeout(() => {
      snackbar.classList.remove('show');
    }, 3200);
  }

})();

// Global Google Translate Init Function
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'fr',
    includedLanguages: 'fr,en,es,pt,it,de,ar,zh-CN,ht',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay: false
  }, 'google_translate_element');
}

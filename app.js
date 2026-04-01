/* ===========================
   ECOTAG — app.js
   Logique principale du site
   =========================== */

'use strict';

// ==============================
// BASE DE DONNÉES DEMO
// (Remplacer par une vraie API)
// ==============================

const productDatabase = {
  '3614273319645': {
    brand: 'L\'Oréal',
    name: 'T-shirt Basique Coton',
    score: 72,
    co2: '3.2',
    water: '2700',
    chemicals: 'Faible',
    recyclable: 'Oui (85%)',
    materials: 'Coton biologique (80%), Polyester recyclé (20%)',
    production: 'Fabriqué en Inde, atelier certifié GOTS, conditions équitables.',
    transport: 'Transport maritime depuis l\'Inde (12 000 km), émissions limitées.',
    certifications: 'GOTS, OEKO-TEX Standard 100, Fair Trade',
    tips: [
      'Lavez à 30°C pour économiser jusqu\'à 40% d\'énergie.',
      'Séchez à l\'air libre pour prolonger la durée de vie du tissu.',
      'Donnez ou recyclez ce vêtement en fin de vie via un point de collecte.',
      'Préférez le lavage à froid pour réduire votre empreinte carbone.',
    ],
  },
  '5000193009888': {
    brand: 'Fast Fashion Co.',
    name: 'Robe Polyester Imprimée',
    score: 24,
    co2: '18.7',
    water: '9200',
    chemicals: 'Élevé',
    recyclable: 'Non (12%)',
    materials: 'Polyester vierge (100%)',
    production: 'Fabriqué au Bangladesh, données conditions de fabrication insuffisantes.',
    transport: 'Transport aérien depuis Bangladesh (8 000 km), fort impact CO₂.',
    certifications: 'Aucune certification environnementale détectée.',
    tips: [
      'Évitez si possible ce type de vêtement à fort impact environnemental.',
      'Si acheté, portez-le le plus longtemps possible.',
      'Explorez des alternatives en matières naturelles ou recyclées.',
      'Revendez plutôt que de jeter pour prolonger le cycle de vie.',
    ],
  },
  '8710447282335': {
    brand: 'Patagonia',
    name: 'Veste Polaire Synchilla',
    score: 91,
    co2: '1.8',
    water: '410',
    chemicals: 'Très faible',
    recyclable: 'Oui (100%)',
    materials: 'Polyester 100% recyclé (bouteilles PET récupérées)',
    production: 'Fabriqué aux USA et au Portugal, normes sociales et environnementales strictes.',
    transport: 'Transport terrestre et maritime optimisé depuis l\'Europe.',
    certifications: 'bluesign®, Fair Trade, Responsible Down Standard, B Corp',
    tips: [
      'Ce produit est parmi les meilleurs de sa catégorie en termes d\'impact. Excellent choix !',
      'Profitez du programme "Worn Wear" de Patagonia pour les réparations gratuites.',
      'Retournez-le à Patagonia en fin de vie pour recyclage complet.',
      'Lavez avec un filtre à microfibres pour protéger les océans.',
    ],
  },
};

// Score généré aléatoirement pour codes inconnus (simulation IA)
function generateFakeProduct(barcode) {
  const brands = ['EcoWear', 'GreenThreads', 'NatureFit', 'BioCotton', 'ReStyle'];
  const products = ['Jean Slim', 'Pull Col Roulé', 'Chemise Lin', 'Short Sport', 'Veste Légère'];
  const score = Math.floor(Math.random() * 80) + 10;
  const co2 = (Math.random() * 15 + 0.5).toFixed(1);
  const water = Math.floor(Math.random() * 8000 + 300).toString();

  return {
    brand: brands[Math.floor(Math.random() * brands.length)],
    name: products[Math.floor(Math.random() * products.length)],
    score,
    co2,
    water,
    chemicals: score > 70 ? 'Faible' : score > 40 ? 'Modéré' : 'Élevé',
    recyclable: score > 60 ? 'Oui (' + Math.floor(Math.random() * 40 + 50) + '%)' : 'Partiel',
    materials: 'Données partielles disponibles (source : base ouverte)',
    production: 'Données de production en cours de vérification.',
    transport: 'Données transport non disponibles pour ce produit.',
    certifications: score > 70 ? 'OEKO-TEX Standard 100' : 'Aucune certification détectée.',
    tips: [
      'Lavez à basse température pour réduire votre consommation d\'énergie.',
      'Séchez à l\'air libre plutôt qu\'en machine.',
      'Donnez ou revendez ce vêtement plutôt que de le jeter.',
    ],
  };
}

// ==============================
// ÉTAT DE L'APPLICATION
// ==============================
let currentTab = 'manual';
let codeReader = null;
let isCameraActive = false;

// ==============================
// INIT UNIQUE (un seul DOMContentLoaded)
// ==============================
document.addEventListener('DOMContentLoaded', () => {

  // --- Hamburger menu ---
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) {
        const isVisible = navLinks.style.display === 'flex';
        navLinks.style.display = isVisible ? 'none' : 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '70px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'rgba(248,244,238,0.98)';
        navLinks.style.padding = '20px 24px';
        navLinks.style.zIndex = '99';
        navLinks.style.borderBottom = '1px solid rgba(82,183,136,0.2)';
      }
    });
  }

  // --- Input : chiffres uniquement ---
  const input = document.getElementById('barcode-input');
  if (input) {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^\d]/g, '');
    });
  }

  // --- QR Code pour l'onglet téléphone ---
  initQRCode();

  // --- Animations au scroll ---
  initScrollAnimations();

  // --- Expose les fonctions pour les onclick HTML ---
  window.switchTab    = switchTab;
  window.setExample   = setExample;
  window.analyzeBarcode = analyzeBarcode;
  window.resetScan    = resetScan;
  window.shareResult  = shareResult;
  window.startCamera  = startCamera;
  window.stopCamera   = stopCamera;
});

// ==============================
// QR CODE — CORRECTION BUG
// Génère le QR code pointant vers
// la page actuelle (fonctionne en
// local ET en ligne)
// ==============================
function initQRCode() {
  const qrContainer = document.getElementById('qrcode');
  if (!qrContainer) return;

  // Vide le conteneur au cas où
  qrContainer.innerHTML = '';

  // URL cible : la page courante (fonctionne partout)
  const targetUrl = window.location.href.split('#')[0];

  if (typeof QRCode === 'undefined') {
    qrContainer.innerHTML = '<p style="color:#e07a5f;font-size:.85rem;">QR Code non disponible (lib non chargée)</p>';
    return;
  }

  new QRCode(qrContainer, {
    text: targetUrl,
    width: 180,
    height: 180,
    colorDark: '#1a3c2b',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
}

// ==============================
// TABS
// ==============================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('content-' + tab).classList.add('active');

  // Arrête la caméra si on quitte l'onglet caméra
  if (tab !== 'camera' && isCameraActive) {
    stopCamera();
  }

  hideAllPanels();
}

// ==============================
// EXEMPLES RAPIDES
// ==============================
function setExample(code) {
  const input = document.getElementById('barcode-input');
  if (input) {
    input.value = code;
    input.focus();
  }
}

// ==============================
// ANALYSE CODE-BARRES
// ==============================
function analyzeBarcode(barcode) {
  const code = barcode || document.getElementById('barcode-input')?.value?.trim();

  if (!code) {
    showError('Veuillez entrer un code-barres valide.');
    return;
  }

  if (!/^\d{8,14}$/.test(code)) {
    showError('Format invalide. Le code doit contenir entre 8 et 14 chiffres.');
    return;
  }

  hideAllPanels();
  showLoading();

  setTimeout(() => {
    const product = productDatabase[code] || generateFakeProduct(code);
    hideLoading();
    showResult(product, code);
  }, 1800);
}

// ==============================
// AFFICHAGE RÉSULTAT
// ==============================
function showResult(product, barcode) {
  document.getElementById('result-brand').textContent = product.brand || '—';
  document.getElementById('result-name').textContent = product.name || '—';
  document.getElementById('result-barcode-tag').textContent = '📦 ' + barcode;

  document.getElementById('val-co2').textContent = product.co2 + ' kg';
  document.getElementById('val-water').textContent = Number(product.water).toLocaleString('fr-FR');
  document.getElementById('val-chemicals').textContent = product.chemicals;
  document.getElementById('val-recyclable').textContent = product.recyclable;

  document.getElementById('detail-materials').textContent = product.materials;
  document.getElementById('detail-production').textContent = product.production;
  document.getElementById('detail-transport').textContent = product.transport;
  document.getElementById('detail-certs').textContent = product.certifications;

  const tipsList = document.getElementById('result-tips-list');
  tipsList.innerHTML = product.tips.map(tip => `<li>${tip}</li>`).join('');

  animateScore(product.score);
  setEcoBadge(product.score);

  document.getElementById('result-panel').classList.remove('hidden');

  setTimeout(() => {
    document.getElementById('result-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function animateScore(score) {
  const circle = document.getElementById('score-circle');
  const numberEl = document.getElementById('score-number');
  const circumference = 2 * Math.PI * 50;

  let color;
  if (score >= 75) color = '#2d6a4f';
  else if (score >= 50) color = '#52b788';
  else if (score >= 30) color = '#e9c46a';
  else color = '#e07a5f';

  circle.style.stroke = color;
  const offset = circumference - (score / 100) * circumference;
  requestAnimationFrame(() => { circle.style.strokeDashoffset = offset; });

  let current = 0;
  const duration = 1200;
  const startTime = performance.now();

  function updateNumber(timestamp) {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * score);
    numberEl.textContent = current;
    if (progress < 1) requestAnimationFrame(updateNumber);
  }
  requestAnimationFrame(updateNumber);
}

function setEcoBadge(score) {
  const badge = document.getElementById('eco-badge');
  badge.className = 'eco-badge';

  if (score >= 75) {
    badge.textContent = '🌿 Excellent — Produit très éco-responsable';
    badge.classList.add('excellent');
  } else if (score >= 50) {
    badge.textContent = '✅ Bon — Impact environnemental modéré';
    badge.classList.add('good');
  } else if (score >= 30) {
    badge.textContent = '⚠️ Moyen — Impact significatif à considérer';
    badge.classList.add('average');
  } else {
    badge.textContent = '🚨 Mauvais — Fort impact environnemental';
    badge.classList.add('poor');
  }
}

// ==============================
// RESET
// ==============================
function resetScan() {
  hideAllPanels();
  const input = document.getElementById('barcode-input');
  if (input) input.value = '';

  const circle = document.getElementById('score-circle');
  if (circle) circle.style.strokeDashoffset = '314';
  const scoreNumber = document.getElementById('score-number');
  if (scoreNumber) scoreNumber.textContent = '0';

  document.getElementById('scanner').scrollIntoView({ behavior: 'smooth' });
}

// ==============================
// SHARE
// ==============================
function shareResult() {
  const score = document.getElementById('score-number')?.textContent || '?';
  const name = document.getElementById('result-name')?.textContent || 'ce produit';
  const brand = document.getElementById('result-brand')?.textContent || '';

  const text = `🌿 EcoTag — Score éco-responsable de ${brand} ${name} : ${score}/100\nScannez vos vêtements sur EcoTag !`;

  if (navigator.share) {
    navigator.share({ title: 'EcoTag', text }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Résultat copié dans le presse-papiers !');
    });
  } else {
    alert(text);
  }
}

// ==============================
// TOAST
// ==============================
function showToast(message) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #1a3c2b; color: #fff; padding: 12px 24px;
    border-radius: 50px; font-size: 0.9rem; font-weight: 500;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2); z-index: 9999;
    font-family: 'DM Sans', sans-serif;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==============================
// PANEL HELPERS
// ==============================
function hideAllPanels() {
  document.getElementById('result-panel')?.classList.add('hidden');
  document.getElementById('loading-panel')?.classList.add('hidden');
  document.getElementById('error-panel')?.classList.add('hidden');
}

function showLoading() {
  document.getElementById('loading-panel')?.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-panel')?.classList.add('hidden');
}

function showError(message) {
  hideAllPanels();
  const errorText = document.getElementById('error-text');
  if (errorText) errorText.textContent = message;
  document.getElementById('error-panel')?.classList.remove('hidden');
}

// ==============================
// CAMÉRA — CORRECTION BUG
// ZXing UMD expose l'objet sous
// window.ZXing avec une API stable
// ==============================
async function startCamera() {
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const btnStart          = document.getElementById('btn-start-scan');
  const btnStop           = document.getElementById('btn-stop-scan');
  const statusEl          = document.getElementById('camera-status');
  const camScanline       = document.getElementById('cam-scanline');
  const cameraTip         = document.querySelector('.camera-tip');

  // Vérifie que ZXing est bien chargé (UMD expose window.ZXing)
  if (typeof window.ZXing === 'undefined' || typeof window.ZXing.BrowserMultiFormatReader === 'undefined') {
    showError('La bibliothèque de scan est introuvable. Vérifiez votre connexion internet et rechargez la page.');
    return;
  }

  // Vérifie que le navigateur supporte getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError('Votre navigateur ne supporte pas l\'accès à la caméra. Essayez Chrome ou Firefox.');
    return;
  }

  try {
    statusEl.textContent = 'Demande d\'accès à la caméra…';

    // Demande d'accès à la caméra
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });

    const video = document.getElementById('video-feed');
    video.srcObject = stream;
    await video.play();

    // UI : affiche le flux, masque le placeholder
    if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
    if (camScanline) camScanline.style.display = 'block';
    if (cameraTip) cameraTip.style.display = 'block';

    btnStart.classList.add('hidden');
    btnStop.classList.remove('hidden');
    isCameraActive = true;
    statusEl.textContent = '📷 Caméra active — pointez vers le code-barres';

    // Lance ZXing sur le flux vidéo
    codeReader = new window.ZXing.BrowserMultiFormatReader();

    codeReader.decodeFromStream(stream, video, (result, err) => {
      if (result) {
        const code = result.getText();
        statusEl.textContent = `✅ Code détecté : ${code}`;
        stopCamera();
        switchTab('manual');
        document.getElementById('barcode-input').value = code;
        analyzeBarcode(code);
      }
      // Les erreurs "no barcode in frame" sont normales, on les ignore
    });

  } catch (err) {
    isCameraActive = false;
    statusEl.textContent = '';
    if (err.name === 'NotAllowedError') {
      showError('Accès à la caméra refusé. Autorisez l\'accès dans les paramètres de votre navigateur.');
    } else if (err.name === 'NotFoundError') {
      showError('Aucune caméra détectée sur cet appareil.');
    } else {
      showError('Erreur caméra : ' + err.message);
    }
  }
}

function stopCamera() {
  const video           = document.getElementById('video-feed');
  const btnStart        = document.getElementById('btn-start-scan');
  const btnStop         = document.getElementById('btn-stop-scan');
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const camScanline     = document.getElementById('cam-scanline');
  const cameraTip       = document.querySelector('.camera-tip');
  const statusEl        = document.getElementById('camera-status');

  // Arrête le flux vidéo
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }

  // Réinitialise ZXing
  if (codeReader) {
    try { codeReader.reset(); } catch (e) {}
    codeReader = null;
  }

  isCameraActive = false;

  // Restaure l'UI
  if (cameraPlaceholder) cameraPlaceholder.style.display = '';
  if (camScanline) camScanline.style.display = 'none';
  if (cameraTip) cameraTip.style.display = 'none';
  btnStart?.classList.remove('hidden');
  btnStop?.classList.add('hidden');
  if (statusEl) statusEl.textContent = '';
}

// ==============================
// RACCOURCI CLAVIER — Entrée
// ==============================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement?.id === 'barcode-input') {
    analyzeBarcode();
  }
});

// ==============================
// ANIMATIONS SCROLL
// ==============================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  const elements = document.querySelectorAll('.step-card, .metric-card, .about-fact, .floating-card');
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
    observer.observe(el);
  });
}

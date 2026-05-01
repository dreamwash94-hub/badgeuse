// ═══ DATA ═══════════════════════════════════════════════════════
var TECHS = JSON.parse(localStorage.getItem('dw_techs_cache')||'null') || [
  {nom:"Sunam Uddin",code:"1001",centre:"Aeroville A",color:"#60A5FA"},
  {nom:"Abdeldjalil Boucedra",code:"1002",centre:"Aeroville A",color:"#A78BFA"},
  {nom:"Mohammed El Amin Kechiouch",code:"1003",centre:"Aeroville A",color:"#F87171"},
  {nom:"Khalid Faris",code:"1004",centre:"Aeroville A",color:"#34D399"},
  {nom:"Ayoub Belaissaoui",code:"1005",centre:"Aeroville A",color:"#22D3EE"},
  {nom:"Siraj Uddin",code:"1006",centre:"Aeroville A",color:"#FBBF24"},
  {nom:"Chabane Messaoudene",code:"1007",centre:"Aeroville A",color:"#C084FC"},
  {nom:"Sodrul Islam Sepul",code:"1008",centre:"Aeroville A",color:"#FB923C"},
  {nom:"Khyal Baz Ahmadzai",code:"1009",centre:"Aeroville A",color:"#F472B6"},
  {nom:"Redwane Leulmi",code:"1010",centre:"Aeroville A",color:"#60A5FA"},
  {nom:"Mourad Bendjeddou",code:"1011",centre:"Aeroville A",color:"#A78BFA"},
  {nom:"Nahidul Islam Shakil",code:"1012",centre:"Aeroville A",color:"#F87171"},
  {nom:"Iqbal Hussain",code:"1013",centre:"Aeroville A",color:"#34D399"},
  {nom:"Hakima Faris",code:"1014",centre:"Aeroville A",color:"#22D3EE"},
  {nom:"Hanif Kotoal",code:"1015",centre:"Aeroville A",color:"#FBBF24"},
  {nom:"Sujon Miah",code:"1016",centre:"Aeroville A",color:"#C084FC"},
  {nom:"Shahriar Islam Shawon",code:"1017",centre:"Aeroville A",color:"#FB923C"},
  {nom:"Tarik Yousfi",code:"1018",centre:"Aeroville A",color:"#F472B6"},
  {nom:"Mackan Camara",code:"1019",centre:"Aeroville A",color:"#60A5FA"},
  {nom:"Faris Meziane Mohamed",code:"1020",centre:"Aeroville A",color:"#A78BFA"},
  {nom:"Iqbal Naqash",code:"1021",centre:"Aeroville A",color:"#F87171"},
  {nom:"Ahmadul Hassan",code:"1022",centre:"Aeroville A",color:"#34D399"},
];
const ADMIN_CODE = "9999";
let foundTech = null, currentCentre = localStorage.getItem('dw_centre') || "Aeroville A";
let badgeLog = JSON.parse(localStorage.getItem('dw_log')||'[]'), countdownTimer = null;
let currentBadgeType = 'arrivee';

// ═══ PWA ════════════════════════════════════════════════════════
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  document.getElementById('install-banner').style.display = 'flex';
});
function installApp() {
  if(deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; document.getElementById('install-banner').style.display = 'none'; });
  }
}
window.addEventListener('appinstalled', () => { document.getElementById('install-banner').style.display = 'none'; });
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if(isIOS && !window.navigator.standalone) document.getElementById('ios-tip').style.display = 'flex';

// ═══ CLOCK ══════════════════════════════════════════════════════
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');
  const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  document.getElementById('datedisp').textContent = `${jours[now.getDay()]} ${now.getDate()} ${mois[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000); updateClock();

// ═══ BADGE TYPE ══════════════════════════════════════════════════
function getTodayStr() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
}

function detectBadgeType(nom) {
  const today = getTodayStr();
  const todayEntries = badgeLog.filter(l => l.date === today && l.nom === nom);
  if (todayEntries.length === 0) return 'arrivee';
  return todayEntries[0].type === 'arrivee' ? 'depart' : 'arrivee';
}

function toggleBadgeType() {
  currentBadgeType = currentBadgeType === 'arrivee' ? 'depart' : 'arrivee';
  updateConfirmUI();
}

function updateConfirmUI() {
  const btn = document.getElementById('btn-badge-action');
  const toggle = document.getElementById('btn-toggle-type');
  if (currentBadgeType === 'arrivee') {
    btn.textContent = '✅ Arrivée';
    btn.className = 'btn-badge arrivee';
    toggle.textContent = 'Pointer un départ à la place';
  } else {
    btn.textContent = '🚪 Départ';
    btn.className = 'btn-badge depart';
    toggle.textContent = 'Pointer une arrivée à la place';
  }
}

// ═══ CENTRE ══════════════════════════════════════════════════════
function setCentreHeader() { document.getElementById('centre-header').textContent = '📍 ' + currentCentre; }
function saveCentre() { currentCentre = document.getElementById('centre-select-admin').value; localStorage.setItem('dw_centre', currentCentre); setCentreHeader(); show('v-admin'); }
function goAdminConfig() { document.getElementById('centre-select-admin').value = currentCentre; renderCodesList(); show('v-admin-config'); }

// ═══ SYNC ════════════════════════════════════════════════════════
async function syncTechsFromPortail() {
  const el = document.getElementById('sync-status');
  if(el) { el.textContent = '⏳ Synchronisation…'; el.style.color = 'rgba(255,255,255,0.6)'; }
  try {
    if(!window.loadTechsFromFirebase) { if(el) { el.textContent = '⚠️ Firebase pas prêt'; el.style.color = '#FBBF24'; } return; }
    const fb = await window.loadTechsFromFirebase();
    if(fb && fb.length > 0) {
      TECHS = fb.filter(t => !t.statut || t.statut === 'actif').map(t => ({nom:t.nom, code:t.code||'0000', centre:t.centre||'Aeroville A', color:t.color||'#60A5FA', poste:t.poste||''}));
      localStorage.setItem('dw_techs_cache', JSON.stringify(TECHS));
      localStorage.setItem('dw_techs_sync', new Date().toLocaleString('fr-FR'));
      if(el) { el.textContent = `✅ ${TECHS.length} techniciens synchronisés !`; el.style.color = '#4ADE80'; }
      renderCodesList(); initKeypads();
    } else { if(el) { el.textContent = '⚠️ Aucun technicien trouvé'; el.style.color = '#FBBF24'; } }
  } catch(e) { if(el) { el.textContent = '❌ Erreur : ' + e.message; el.style.color = '#F87171'; } }
}

function renderCodesList() {
  const cl = document.getElementById('codes-list');
  const cntEl = document.getElementById('techs-count-lbl');
  const syncEl = document.getElementById('last-sync-lbl');
  if(cntEl) cntEl.textContent = TECHS.length + ' techniciens';
  if(syncEl) syncEl.textContent = 'Dernière sync : ' + (localStorage.getItem('dw_techs_sync') || 'Jamais');
  if(!cl) return;
  cl.innerHTML = TECHS.map(t => `
    <div class="tech-row-cfg">
      <div style="width:28px;height:28px;border-radius:50%;background:${t.color}33;color:${t.color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0;">${t.nom.charAt(0)}</div>
      <div style="flex:1;min-width:0;"><div class="tech-row-name">${t.nom}</div><div class="tech-row-centre">${t.centre}${t.poste?' · '+t.poste:''}</div></div>
      <div class="tech-row-code">${t.code}</div>
    </div>`).join('');
}

// ═══ KEYPAD ══════════════════════════════════════════════════════
const KL = {'2':'ABC','3':'DEF','4':'GHI','5':'JKL','6':'MNO','7':'PQRS','8':'TUV','9':'WXYZ'};

function buildKeypad(containerId, dotsId, onComplete) {
  const kp = document.getElementById(containerId);
  kp.innerHTML = ''; let code = '';
  function updateDots(state='normal') {
    document.querySelectorAll(`#${dotsId} .dot`).forEach((d, i) => {
      d.className = 'dot';
      if(state === 'error') d.classList.add('err');
      else if(state === 'ok') d.classList.add('ok');
      else if(i < code.length) d.classList.add('on');
    });
  }
  function addDigit(d) { if(code.length >= 4) return; code += d; updateDots(); if(code.length === 4) setTimeout(() => { onComplete(code, updateDots, () => { code = ''; updateDots(); }); }, 150); }
  function delDigit() { code = code.slice(0,-1); updateDots(); }
  ['1','2','3','4','5','6','7','8','9','','0','⌫'].forEach(k => {
    const btn = document.createElement('button');
    if(k === '') { btn.className = 'key empty'; kp.appendChild(btn); return; }
    btn.className = 'key' + (k === '⌫' ? ' del' : '');
    btn.innerHTML = k === '⌫' ? '⌫' : k + (KL[k] ? `<span class="key-sub">${KL[k]}</span>` : '');
    btn.addEventListener('click', () => k === '⌫' ? delDigit() : addDigit(k));
    kp.appendChild(btn);
  });
  updateDots();
}

function initKeypads() {
  buildKeypad('keypad', 'dots', (code, updateDots, resetCode) => {
    if(code === ADMIN_CODE) { updateDots('ok'); setTimeout(() => { resetCode(); show('v-admin-code'); }, 400); return; }
    const tech = TECHS.find(t => t.code === code);
    if(tech) { updateDots('ok'); foundTech = tech; setTimeout(() => showConfirm(), 400); }
    else { updateDots('error'); setTimeout(() => { resetCode(); }, 900); setTimeout(() => show('v-error'), 1100); }
  });
  buildKeypad('keypad-admin', 'dots-admin', (code, updateDots, resetCode) => {
    if(code === ADMIN_CODE) { updateDots('ok'); setTimeout(() => { resetCode(); showAdmin(); }, 400); }
    else { updateDots('error'); setTimeout(() => resetCode(), 900); }
  });
}

// ═══ QR SCANNER ══════════════════════════════════════════════════
let qrStream = null, qrAnimFrame = null, capturedPhoto = null, qrLocked = false;

async function startQR() {
  show('v-qr');
  qrLocked = false;
  document.getElementById('qr-status').textContent = '⏳ Accès à la caméra…';
  document.getElementById('qr-overlay').style.display = 'none';
  try {
    qrStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('qr-video');
    video.srcObject = qrStream;
    await video.play();
    document.getElementById('qr-status').textContent = 'Présentez votre QR code devant la caméra';
    qrAnimFrame = requestAnimationFrame(qrTick);
  } catch(e) {
    document.getElementById('qr-status').textContent = '❌ Caméra inaccessible — utilisez le code PIN';
    setTimeout(() => { stopQR(); show('v-code'); }, 2500);
  }
}

function qrTick() {
  if (qrLocked) return;
  const video = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-canvas');
  if (!qrStream || video.readyState !== video.HAVE_ENOUGH_DATA) { qrAnimFrame = requestAnimationFrame(qrTick); return; }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
  if (code) {
    onQRDetected(code.data);
  } else {
    qrAnimFrame = requestAnimationFrame(qrTick);
  }
}

function onQRDetected(data) {
  const tech = TECHS.find(t => t.code === data);
  if (!tech) {
    document.getElementById('qr-status').textContent = '❌ Code non reconnu, réessayez';
    setTimeout(() => {
      if (!qrLocked) {
        document.getElementById('qr-status').textContent = 'Présentez votre QR code devant la caméra';
        qrAnimFrame = requestAnimationFrame(qrTick);
      }
    }, 1500);
    return;
  }
  qrLocked = true;
  foundTech = tech;
  document.getElementById('qr-ok-name').textContent = tech.nom;
  document.getElementById('qr-overlay').style.display = 'flex';
  // Laisser le tech baisser son téléphone, puis prendre la photo
  setTimeout(() => {
    capturePhoto();
    stopQR();
    showConfirm();
  }, 1800);
}

function capturePhoto() {
  const video = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-canvas');
  const maxW = 360;
  const scale = Math.min(1, maxW / (video.videoWidth || maxW));
  canvas.width = (video.videoWidth || maxW) * scale;
  canvas.height = (video.videoHeight || maxW) * scale;
  const ctx = canvas.getContext('2d');
  // Miroir horizontal (caméra frontale)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.65);
}

function stopQR() {
  qrLocked = true;
  if (qrAnimFrame) cancelAnimationFrame(qrAnimFrame);
  if (qrStream) { qrStream.getTracks().forEach(t => t.stop()); qrStream = null; }
  document.getElementById('qr-overlay').style.display = 'none';
}

// ═══ CONFIRM ════════════════════════════════════════════════════
function showConfirm() {
  currentBadgeType = detectBadgeType(foundTech.nom);
  document.getElementById('confirm-initial').textContent = foundTech.nom.charAt(0);
  document.getElementById('confirm-name').textContent = foundTech.nom;
  document.getElementById('confirm-poste').textContent = foundTech.poste || 'Laveur Automobile';
  document.getElementById('confirm-centre-pill').textContent = '📍 ' + currentCentre + (foundTech.centre !== currentCentre ? ' · ⚡ Mobile' : '');
  // Photo capturée via QR
  const photo = document.getElementById('confirm-photo');
  const initial = document.getElementById('confirm-initial');
  if (capturedPhoto) {
    photo.src = capturedPhoto;
    photo.style.display = 'block';
    initial.style.display = 'none';
  } else {
    photo.style.display = 'none';
    initial.style.display = '';
  }
  updateConfirmUI();
  show('v-confirm');
}

// ═══ BADGE ══════════════════════════════════════════════════════
async function badge() {
  const now = new Date();
  const timeStr = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2,'0')).join(':');
  const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const entry = {nom:foundTech.nom, centreHabituel:foundTech.centre, centreBadge:currentCentre, color:foundTech.color, time:timeStr, date:dateStr, timestamp:now.getTime(), type:currentBadgeType};
  badgeLog.unshift(entry); if(badgeLog.length > 200) badgeLog = badgeLog.slice(0,200);
  localStorage.setItem('dw_log', JSON.stringify(badgeLog));
  try { if(window._db && window._firebase) { const {collection, addDoc} = window._firebase; await addDoc(collection(window._db,'badgeages'), entry); } } catch(e) {}
  const typePill = document.getElementById('sc-type');
  typePill.textContent = currentBadgeType === 'arrivee' ? '🟢 Arrivée' : '🔴 Départ';
  typePill.className = 'sc-type-pill ' + currentBadgeType;
  document.getElementById('sc-name').textContent = foundTech.nom;
  document.getElementById('sc-centre').textContent = '📍 ' + currentCentre;
  document.getElementById('sc-time').textContent = timeStr;
  document.getElementById('sc-cra').textContent = foundTech.centre !== currentCentre
    ? `Présence à ${currentCentre} enregistrée ✓`
    : `${currentBadgeType === 'arrivee' ? 'Arrivée' : 'Départ'} du ${dateStr} enregistré ✓`;
  show('v-success'); startCountdown();
}

// ═══ COUNTDOWN ══════════════════════════════════════════════════
function startCountdown() {
  if(countdownTimer) clearInterval(countdownTimer);
  let s = 6;
  const fill = document.getElementById('prog-fill');
  const txt = document.getElementById('prog-txt');
  fill.style.transition = 'none'; fill.style.width = '100%';
  setTimeout(() => { fill.style.transition = 'width 1s linear'; fill.style.width = '0%'; }, 50);
  txt.textContent = `Retour dans ${s}s…`;
  countdownTimer = setInterval(() => { s--; txt.textContent = `Retour dans ${s}s…`; if(s <= 0) { clearInterval(countdownTimer); reset(); } }, 1000);
}

// ═══ ADMIN ══════════════════════════════════════════════════════
async function showAdmin() {
  show('v-admin');
  const today = getTodayStr();
  document.getElementById('admin-date-lbl').textContent = today;
  let tl = badgeLog.filter(l => l.date === today);
  try {
    if(window._db && window._firebase) {
      const {collection, getDocs, query, where} = window._firebase;
      const q = query(collection(window._db,'badgeages'), where('date','==',today));
      const snap = await getDocs(q);
      const fb = []; snap.forEach(d => fb.push(d.data()));
      if(fb.length > 0) tl = fb.sort((a,b) => b.timestamp - a.timestamp);
    }
  } catch(e) {}

  // Grouper par technicien
  const techMap = {};
  tl.forEach(e => { if(!techMap[e.nom]) techMap[e.nom] = []; techMap[e.nom].push(e); });

  const summaries = Object.values(techMap).map(entries => {
    const last = entries[0];
    const isOnSite = !last.type || last.type === 'arrivee';
    const arrivals = entries.filter(e => !e.type || e.type === 'arrivee');
    const departures = entries.filter(e => e.type === 'depart');
    const firstArrival = arrivals[arrivals.length - 1];
    const lastDeparture = departures[0];
    let duration = '';
    if(firstArrival && lastDeparture) {
      const diff = lastDeparture.timestamp - firstArrival.timestamp;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      duration = h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m}min`;
    }
    return { nom:last.nom, color:last.color||'#60A5FA', centreBadge:last.centreBadge,
      centreHabituel:last.centreHabituel, isMobile:last.centreBadge!==last.centreHabituel,
      isOnSite, arrivalTime:firstArrival?.time||null, departureTime:lastDeparture?.time||null, duration };
  });

  const onSite = summaries.filter(t => t.isOnSite);
  const departed = summaries.filter(t => !t.isOnSite);
  const centres = [...new Set(tl.map(l => l.centreBadge))];

  document.getElementById('adm-present').textContent = onSite.length;
  document.getElementById('adm-total').textContent = departed.length;
  document.getElementById('adm-centres').textContent = centres.length;

  function renderCard(t) {
    const mobile = t.isMobile ? '<span class="mobile-pill">⚡ Mobile</span>' : '';
    const depSpan = t.isOnSite
      ? '<span class="time-depart en-cours">en cours…</span>'
      : `<span class="time-depart">🔴 ${t.departureTime}</span>`;
    const dur = t.duration ? `<span class="time-duration">${t.duration}</span>` : '';
    return `<div class="tech-presence-card${t.isOnSite?' on-site':''}">
      <div class="log-av" style="background:${t.color}33;color:${t.color};">${t.nom.charAt(0)}</div>
      <div class="tech-presence-info">
        <div class="tech-presence-name">${t.nom}${mobile?' '+mobile:''}</div>
        <div class="tech-presence-times">
          <span class="time-arrivee">🟢 ${t.arrivalTime||'—'}</span>
          <span class="time-arrow">→</span>
          ${depSpan}${dur?' '+dur:''}
        </div>
      </div>
    </div>`;
  }

  const log = document.getElementById('adm-log');
  if(tl.length === 0) {
    log.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px;font-size:15px;">Aucun badgeage aujourd\'hui</div>';
    return;
  }
  log.innerHTML =
    (onSite.length > 0 ? `<div class="presence-section-title">🟢 Sur site · ${onSite.length}</div><div class="presence-grid">${onSite.map(renderCard).join('')}</div>` : '') +
    (departed.length > 0 ? `<div class="presence-section-title" style="margin-top:${onSite.length>0?'8px':'0'};">🔴 Partis · ${departed.length}</div><div class="presence-grid">${departed.map(renderCard).join('')}</div>` : '');
}

// ═══ UTILS ══════════════════════════════════════════════════════
function show(id) { document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function reset() { if(countdownTimer) clearInterval(countdownTimer); foundTech = null; capturedPhoto = null; stopQR(); initKeypads(); show('v-code'); }

// ═══ INIT ═══════════════════════════════════════════════════════
setCentreHeader();
initKeypads();
setTimeout(async () => { await syncTechsFromPortail(); initKeypads(); }, 2500);

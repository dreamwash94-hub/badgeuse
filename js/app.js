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

// ═══ CONFIRM ════════════════════════════════════════════════════
function showConfirm() {
  document.getElementById('confirm-initial').textContent = foundTech.nom.charAt(0);
  document.getElementById('confirm-name').textContent = foundTech.nom;
  document.getElementById('confirm-poste').textContent = foundTech.poste || 'Laveur Automobile';
  document.getElementById('confirm-centre-pill').textContent = '📍 ' + currentCentre + (foundTech.centre !== currentCentre ? ' · ⚡ Mobile' : '');
  show('v-confirm');
}

// ═══ BADGE ══════════════════════════════════════════════════════
async function badge() {
  const now = new Date();
  const timeStr = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2,'0')).join(':');
  const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const entry = {nom:foundTech.nom, centreHabituel:foundTech.centre, centreBadge:currentCentre, color:foundTech.color, time:timeStr, date:dateStr, timestamp:now.getTime()};
  badgeLog.unshift(entry); if(badgeLog.length > 200) badgeLog = badgeLog.slice(0,200);
  localStorage.setItem('dw_log', JSON.stringify(badgeLog));
  try { if(window._db && window._firebase) { const {collection, addDoc} = window._firebase; await addDoc(collection(window._db,'badgeages'), entry); } } catch(e) {}
  document.getElementById('sc-name').textContent = foundTech.nom;
  document.getElementById('sc-centre').textContent = '📍 ' + currentCentre;
  document.getElementById('sc-time').textContent = timeStr;
  document.getElementById('sc-cra').textContent = foundTech.centre !== currentCentre
    ? `Présence à ${currentCentre} enregistrée ✓`
    : `Présence du ${dateStr} enregistrée ✓`;
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
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  document.getElementById('admin-date-lbl').textContent = dateStr;
  let tl = badgeLog.filter(l => l.date === dateStr);
  try {
    if(window._db && window._firebase) {
      const {collection, getDocs, query, where} = window._firebase;
      const q = query(collection(window._db,'badgeages'), where('date','==',dateStr));
      const snap = await getDocs(q);
      const fb = []; snap.forEach(d => fb.push(d.data()));
      if(fb.length > 0) tl = fb.sort((a,b) => b.timestamp - a.timestamp);
    }
  } catch(e) {}
  const uniq = [...new Set(tl.map(l => l.nom))];
  const centres = [...new Set(tl.map(l => l.centreBadge))];
  document.getElementById('adm-present').textContent = uniq.length;
  document.getElementById('adm-total').textContent = tl.length;
  document.getElementById('adm-centres').textContent = centres.length;
  const log = document.getElementById('adm-log');
  log.innerHTML = tl.length === 0
    ? '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.3);padding:40px;font-size:15px;">Aucun badgeage aujourd\'hui</div>'
    : tl.map(l => `<div class="log-card"><div class="log-av">${l.nom.charAt(0)}</div><div><div class="log-name">${l.nom}</div><div class="log-info">📍 ${l.centreBadge}${l.centreBadge!==l.centreHabituel?' <span class="mobile-pill">⚡ Mobile</span>':''}</div></div><div class="log-time">${l.time}</div></div>`).join('');
}

// ═══ UTILS ══════════════════════════════════════════════════════
function show(id) { document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function reset() { if(countdownTimer) clearInterval(countdownTimer); foundTech = null; initKeypads(); show('v-code'); }

// ═══ INIT ═══════════════════════════════════════════════════════
setCentreHeader();
initKeypads();
setTimeout(async () => { await syncTechsFromPortail(); initKeypads(); }, 2500);

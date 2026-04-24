import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:"AIzaSyCSZqfL3G-DK0VzNmptblT7F_kgq5R4Oww",
  authDomain:"dreamwash-d4a2c.firebaseapp.com",
  projectId:"dreamwash-d4a2c",
  storageBucket:"dreamwash-d4a2c.firebasestorage.app",
  messagingSenderId:"294836515742",
  appId:"1:294836515742:web:3fdbe1b28db8f97b7cdc8f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window._db = db;
window._firebase = { collection, addDoc, getDocs, query, where, doc, getDoc };
window._firebaseReady = true;

window.loadTechsFromFirebase = async function() {
  try {
    const snap = await getDoc(doc(db,'portail','techs'));
    if(snap.exists()){const t=JSON.parse(snap.data().data);if(t?.length)return t;}
  } catch(e){}
  return null;
};

// Listener temps réel — mise à jour automatique de la liste des techniciens
let _techListenerReady = false;
onSnapshot(doc(db,'portail','techs'), (snap) => {
  if (!_techListenerReady) { _techListenerReady = true; return; }
  if (!snap.exists()) return;
  try {
    const fbTechs = JSON.parse(snap.data().data);
    if (fbTechs?.length > 0 && typeof window.TECHS !== 'undefined') {
      window.TECHS = fbTechs
        .filter(t => !t.statut || t.statut === 'actif')
        .map(t => ({nom:t.nom, code:t.code||'0000', centre:t.centre||'Aeroville A', color:t.color||'#60A5FA', poste:t.poste||''}));
      localStorage.setItem('dw_techs_cache', JSON.stringify(window.TECHS));
      if (typeof window.initKeypads === 'function') window.initKeypads();
      console.log('🔴 Techniciens mis à jour en temps réel:', window.TECHS.length);
    }
  } catch(e) {}
});

console.log('🔥 Firebase connecté ✅');

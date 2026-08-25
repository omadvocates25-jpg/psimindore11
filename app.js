
// ================= FIREBASE (Firestore only, no Auth) =================
const firebaseConfig = {
  apiKey: "AIzaSyDIl4Esxj4_sS3aV-OA9JAKl3cE9noZGmA",
  authDomain: "psim-2b211.firebaseapp.com",
  projectId: "psim-2b211",
  storageBucket: "psim-2b211.firebasestorage.app",
  messagingSenderId: "122332923549",
  appId: "1:122332923549:web:34af642c4f6e01241b3674"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ================= CONSTANTS =================
const ADMIN_PHONE = "8103179376"; // Super Admin ka number - OTP login se auto-admin
const CONTACT_PHONE = "81031-79376";
const ADMIN_CONTACTS = ["8103179376"];
const REFERENCE_REGISTER_URL = "https://asia-south1-psim-2b211.cloudfunctions.net/referenceRegister";
const GEOCODE_VILLAGE_URL = "https://asia-south1-psim-2b211.cloudfunctions.net/geocodeVillage";
const DEFAULT_OBJECTIVE_TEXT = "क्या आपको पता है, पाटीदार समाज की अपनी एक App है — जिसमें हम सब आपस में जुड़ सकते हैं, अपने व्यापार को आगे बढ़ा सकते हैं और समाज के अलग-अलग लोगों को जान सकते हैं। सबसे बड़ी बात — हर पाटीदार को अपने ही पाटीदार भाई से व्यापार मिले, यही हमारा सबसे बड़ा उद्देश्य है।\n\nआपको कोई भी काम हो, छोटा हो या बड़ा — फ्रिज-कूलर ठीक करवाना हो या किसी डॉक्टर की जरूरत हो — आप सीधे इस App में search करके सीधे call कर सकते हैं। आखिर, अपने पाटीदार भाई पर भरोसा तो है ही! 🙏";
const DEFAULT_INVITE_MSG = "🙏 क्या आपको पता है? पाटीदार समाज की अपनी App है जिसमें हम सब आपस में जुड़ सकते हैं और अपने व्यापार को बढ़ा सकते हैं। कोई भी काम हो — छोटा या बड़ा, फ्रिज-कूलर ठीक करवाना हो या डॉक्टर चाहिए — अपने पाटीदार भाई से सीधे जुड़ो। अभी Register करो 👇";
function T(key, fallback){ return (siteMeta.texts && siteMeta.texts[key]) || fallback; }
const MP_DISTRICTS = ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad (Narmadapuram)","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Maihar","Mandla","Mandsaur","Mauganj","Morena","Narsinghpur","Neemuch","Niwari","Pandhurna","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha","Other (MP से बाहर)"];
const STATES = ["Madhya Pradesh","Maharashtra","Gujarat","Rajasthan","Uttar Pradesh","Chhattisgarh","Delhi","Punjab","Haryana","Bihar","Karnataka","Tamil Nadu","Telangana","Andhra Pradesh","West Bengal","Odisha","Jharkhand","Assam","Kerala","Goa","Himachal Pradesh","Uttarakhand","Jammu & Kashmir","Other / विदेश"];
const RELATIONS = ["पिता / Father","माता / Mother","भाई / Brother","बहन / Sister","बेटा / Son","बेटी / Daughter","पति / Husband","पत्नी / Wife","चाचा / Uncle","मामा / Mama","दादा / Grandfather","अन्य / Other"];
// Business Type अब Profession को भी cover करता है (मर्ज कर दिया गया) — इसीलिए list बड़ी है
const BUSINESS_TYPES = ["Kirana/General Store","Restaurant/Food","Textiles/Garments","Agriculture/Farming","Real Estate/Property","Construction/Builder","Transport/Logistics","Medical/Pharmacy","Education/Coaching","Electronics/Mobile","Jewellery","Hardware/Building Material","Automobile/Garage","Beauty/Salon","Legal/CA/Consultant","Import-Export/Trading","Manufacturing/Factory",
"Doctor","Advocate / वकील","CA / Accountant","Teacher / Coaching","Engineer","Government Job","Farmer / किसान","Carpenter / बढ़ई","Plumber","Electrician","Mason / राजमिस्त्री","Tailor / दर्जी","Barber / नाई","Cook / Caterer","Driver","Medical Shop","Electric Shop","Mobile Shop","Sabji / Fruit Vendor","Dairy / दूध डेयरी","Jeweller / सुनार","Cloth Shop / कपड़ा","Footwear Shop","Property Dealer","Tractor / Machinery","Painter","Welder / Fabricator","Photographer / Videographer","Tent House / Event","Computer / IT Work","Gym / Fitness Trainer",
"Other"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

// ================= STATE =================
let currentUser = ''; // logged-in user ka 10-digit phone
let _authResolved = false; // Firebase persisted-session check poora hone tak true nahi hota
let currentPage = 'home';
let editingId = null;
let selectedNewsId = '';
let randIdx = 0, randOrder = [];
let searchQ = '', searchBy = 'name';
let adminTab = 'members';
let showAddForm=false, showItemForm=false, showPratForm=false, showJobForm=false, showRelForm=false, showFriendForm=false, showGarbaForm=false, showPropForm=false, showManageProp=false;
let showDharamshalaForm=false, dharamshalaKind='village', showHospitalForm=false, hospitalKind='niji', showStudentNeedForm=false, studentNeedKind='tiffin', showStudentRegForm=false;
let regStep = 0;
let regMode = 'otp'; // 'otp' | 'reference' — Register page pe chuna gaya tareeka
let showRegModeChooser = true;
let aiChatHistory = []; // [{role:'user'|'ai', text}] — session-only, kahin save nahi hota
let aiThinking = false;
let relSearchQ = '';
let friendSearchQ = '';
let whomQuery = '';

let membersData=[], eventsData=[], newsData=[], photosData=[], oldItems=[], pratibhaData=[], jobsData=[], shaadiData=[], relativesData=[], friendsData=[], committeeData=[], garbaRegs=[], garbaTeam=[], garbaCoords=[], cricketData=[], propertyData=[], bloodData=[], suggestionsData=[], teamJoinData=[], labhData=[], villageLeadsData=[], dharamshalaData=[], hospitalsData=[], studentNeedsData=[], studentsData=[], bloodSosData=[], obituariesData=[], villageInfoData=[], referralPreapprovalsData=[];
let siteMeta = { ticker:'', aboutUs:'', fb:'', insta:'', youtube:'', committee:'', expiryDays:30, propertyValidityDays:365, propertyFeeRent:'500', propertyFeeWanted:'11', razorpayPropRent:'', razorpayPropWanted:'', shaadiFee:'500', shaadiValidityDays:180, razorpayShaadi:'', jobsFeeSeeker:'11', razorpayJobsSeeker:'', bizPromoFee:'300', bizPromoValidityDays:365, razorpayBizPromo:'', olxExtraItemFee:'100', razorpayOlxExtra:'', olxPromoFee:'100', razorpayOlxPromo:'', blocked:[], garbaFormOpen:true, ads:[{},{},{},{},{}], subAdmins:[], texts:{} };

function isSuperAdmin(){ return currentUser === ADMIN_PHONE || localStorage.getItem('psim_admin_ok') === 'true'; }
function subAdminInfo(){ if(!currentUser) return null; return (siteMeta.subAdmins||[]).find(s => fmtPhone(s.phone) === currentUser) || null; }
function isAdmin(){ return isSuperAdmin() || !!subAdminInfo(); }
function allowedTabs(){ if(isSuperAdmin()) return null; const s=subAdminInfo(); return s ? (s.tabs||[]) : []; }
function myMember(){ return membersData.find(m => m.phone === currentUser); }
function approvedMembers(){ return membersData.filter(m => m.status === 'approved'); }
function isPublicProfile(m){ return !(m.gender && m.gender.indexOf('Female')===0 && m.privacy && m.privacy.indexOf('Secret')===0); }
function publicMembers(){ return approvedMembers().filter(isPublicProfile); }
function findApprovedByPhone(ph){ return approvedMembers().find(m => m.phone === fmtPhone(ph)); }

// ================= REFERRAL (किसके माध्यम से जुड़े — karyakarta credit) =================
function referrerSelectHTML(fieldId){
 const mems = approvedMembers().slice().sort((a,b) => (a.name+a.surname).localeCompare(b.name+b.surname));
 return '<div><label class="text-xs font-bold">🎗️ किसके माध्यम से जुड़े? (Optional)</label>'+
  '<select id="'+fieldId+'" class="w-full px-3 py-2 border-2 rounded"><option value="">कोई नहीं / Self</option>'+
  mems.map(m => '<option value="'+esc(m.phone)+'">'+esc(m.name+' '+m.surname)+' ('+esc(m.phone)+')</option>').join('')+
  '</select></div>';
}
function referrerNameOf(phone){
 if(!phone) return '';
 const m = findApprovedByPhone(phone);
 return m ? (m.name+' '+m.surname) : phone;
}
const JOB_SEEKER_KINDS = ['lena', 'freelance_lena']; // इनके लिए ही fee लगता है, "देना है" वाले हमेशा free
function feeForProperty(p){ return parseFloat(p.type==='rent' ? siteMeta.propertyFeeRent : siteMeta.propertyFeeWanted)||0; }
function feeForJob(j){ return JOB_SEEKER_KINDS.includes(j.kind) ? (parseFloat(siteMeta.jobsFeeSeeker)||0) : 0; }
function feeForOldItem(o){
 let f = 0;
 if(o.extraFee) f += parseFloat(siteMeta.olxExtraItemFee)||0; // पहली listing free, अगली पर fee
 if(o.promoted) f += parseFloat(siteMeta.olxPromoFee)||0;
 return f;
}
function computeReferralLeaderboard(){
 const rows = [];
 const push = (list, feeKey) => {
  const fee = parseFloat(siteMeta[feeKey])||0;
  (list||[]).forEach(item => { if(item.referredBy) rows.push({phone:item.referredBy, amount:fee}); });
 };
 propertyData.filter(p=>p.status==='approved').forEach(p => { if(p.referredBy) rows.push({phone:p.referredBy, amount:feeForProperty(p)}); });
 jobsData.filter(j=>j.status==='approved').forEach(j => { if(j.referredBy) rows.push({phone:j.referredBy, amount:feeForJob(j)}); });
 oldItems.filter(o=>o.status==='approved').forEach(o => { if(o.referredBy) rows.push({phone:o.referredBy, amount:feeForOldItem(o)}); });
 push(shaadiData.filter(s=>s.status==='approved'), 'shaadiFee');
 membersData.filter(m=>m.biz_promo_status==='active').forEach(m => {
  if(m.biz_promo_referredBy) rows.push({phone:m.biz_promo_referredBy, amount:parseFloat(siteMeta.bizPromoFee)||0});
 });
 const byPhone = {};
 rows.forEach(r => {
  if(!byPhone[r.phone]) byPhone[r.phone] = {phone:r.phone, count:0, amount:0};
  byPhone[r.phone].count++; byPhone[r.phone].amount += r.amount;
 });
 return Object.values(byPhone).sort((a,b) => b.count-a.count || b.amount-a.amount);
}

// ================= लाभ (business trust-endorsement, ₹1 = 1 discount credit) =================
const LABH_DAILY_LIMIT = 10;
const LABH_INACTIVE_DAYS = 30;
function isLabhActive(l){
 const giver = membersData.find(m => m.phone===l.fromPhone);
 if(!giver) return false; // giver ka account हटाया जा चुका — count नहीं होगा
 const cutoff = new Date(Date.now() - LABH_INACTIVE_DAYS*86400000).toISOString().slice(0,10);
 return (giver.lastActiveAt||giver.createdAt||'0000-00-00') >= cutoff; // 30 दिन inactive => expire
}
function labhReceivedBy(phone){ return labhData.filter(l => l.toPhone===phone); }
function labhActiveReceivedBy(phone){ return labhReceivedBy(phone).filter(isLabhActive); }
function labhGivenToday(phone){ return labhData.filter(l => l.fromPhone===phone && l.createdAt===today()).length; }
function labhReceivedToday(phone){ return labhData.filter(l => l.toPhone===phone && l.createdAt===today()).length; }
function hasGivenLabh(fromPhone, toPhone){ return labhData.some(l => l.fromPhone===fromPhone && l.toPhone===toPhone); }
async function giveLabh(toId, toPhone, toName){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('लाभ देने के लिए पहले Community member बनो।'); return; }
 if(me.phone===toPhone){ alert('❌ खुद को लाभ नहीं दे सकते'); return; }
 if(hasGivenLabh(me.phone, toPhone)){ alert('❌ आप पहले ही इस Business को लाभ दे चुके हो — एक बार ही दे सकते हो'); return; }
 if(labhGivenToday(me.phone) >= LABH_DAILY_LIMIT){ alert('⏰ आज आपकी 10 लाभ देने की limit पूरी हो गई — कल फिर दे सकते हो'); return; }
 if(labhReceivedToday(toPhone) >= LABH_DAILY_LIMIT){ alert('⏰ आज इस Business की 10 लाभ लेने की limit पूरी हो गई — कल कोशिश करो'); return; }
 busy(true);
 await db.collection('labh').add({fromPhone:me.phone, fromName:me.name+' '+me.surname, toPhone, toId, toName, createdAt:today()});
 busy(false);
 alert('✅ धन्यवाद! आपने '+toName+' को लाभ दिया।');
 renderApp();
}
async function approveBizPromo(id){
 const until = new Date(Date.now() + (siteMeta.bizPromoValidityDays||365)*86400000).toISOString().slice(0,10);
 busy(true);
 await db.collection('members').doc(id).update({biz_promo_status:'active', biz_promo_until:until});
 busy(false); renderApp();
}
async function rejectBizPromo(id){
 busy(true);
 await db.collection('members').doc(id).update({biz_promo_status:'none'});
 busy(false); renderApp();
}
function esc(s){ return String(s==null?'':s).replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function distOf(m, w){ const d=m[w+'_district']||'', o=m[w+'_district_other']||''; if(d==='Other (MP से बाहर)') return o||'Other'; return o&&!d?o:d; }
function profOf(m){ const p=m.business_type||'', o=m.business_type_other||''; if(p==='Other') return o||p; return p; }
function today(){ return new Date().toISOString().slice(0,10); }
function daysAgo(dateStr){ if(!dateStr) return 99999; return Math.floor((Date.now()-new Date(dateStr).getTime())/86400000); }
function randCode(){ return String(Math.floor(1000+Math.random()*9000)); }
function fmtName(s){ return (s||'').trim().replace(/\s+/g,' ').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()); }
function fmtPhone(s){ return (s||'').replace(/[^0-9]/g,'').slice(0,10); }
function phoneFromFirebase(fbPhone){ return (fbPhone||'').replace(/[^0-9]/g,'').slice(-10); } // "+919876543210" -> "9876543210"

// ================= BILINGUAL NAME (English + हिंदी) — दो अलग boxes भरो, हर जगह अपने आप "English (हिंदी)" format में दिखेगा =================
function bilingualHTML(en, hi){
 en=(en||'').trim(); hi=(hi||'').trim();
 if(en && hi) return esc(en)+' <span class="text-gray-500 font-normal">('+esc(hi)+')</span>';
 return esc(en || hi || '-');
}
// ================= EN↔HI शब्दकोश (community dictionary) — पहले किसी ने जो नाम दोनों भाषा में भरा हो, वो अगली बार अपने आप आ जाए =================
let translitData = [];
function translitLookup(text, dir){
 // dir: 'en2hi' या 'hi2en'
 const key = (text||'').trim().toLowerCase();
 if(!key) return '';
 const hit = dir==='en2hi' ? translitData.find(t=>(t.en||'').toLowerCase()===key) : translitData.find(t=>(t.hi||'')===text.trim());
 return hit ? (dir==='en2hi' ? hit.hi : hit.en) : '';
}
async function saveTranslitPair(en, hi){
 en=(en||'').trim(); hi=(hi||'').trim();
 if(!en || !hi) return; // दोनों भरे हों तभी worth-saving pair है
 const key = en.toLowerCase();
 const existing = translitData.find(t=>(t.en||'').toLowerCase()===key);
 if(existing && existing.hi===hi) return; // पहले से यही pair मौजूद है
 try{ await db.collection('translit_pairs').add({en:key, hi, createdAt:today()}); }catch(e){}
}
function autofillBilingual(prefix){
 const enEl = document.getElementById(prefix+'_en'), hiEl = document.getElementById(prefix+'_hi');
 if(!enEl || !hiEl) return;
 if(enEl.value.trim() && !hiEl.value.trim()){ const hi = translitLookup(enEl.value, 'en2hi'); if(hi) hiEl.value = hi; }
 else if(hiEl.value.trim() && !enEl.value.trim()){ const en = translitLookup(hiEl.value, 'hi2en'); if(en) enEl.value = fmtName(en); }
}
function bilingualInputsHTML(prefix, label){
 return '<div><label class="text-xs font-bold">'+(label||'Name')+' *</label><div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">'+
  '<input id="'+prefix+'_en" placeholder="Name (English)" onblur="autofillBilingual(\''+prefix+'\')" class="px-3 py-2 border-2 rounded">'+
  '<input id="'+prefix+'_hi" placeholder="नाम (हिंदी)" onblur="autofillBilingual(\''+prefix+'\')" class="px-3 py-2 border-2 rounded">'+
  '</div><p class="text-[10px] text-gray-400 mt-1">💡 दोनों भाषा में भरो — अगर कोई पहले भर चुका है तो अपने आप आ जाएगा</p></div>';
}
function readBilingual(prefix){
 return { name_en: fmtName(document.getElementById(prefix+'_en').value), name_hi: document.getElementById(prefix+'_hi').value.trim() };
}

// ================= ADMIN LOGIN (Phone OTP only — Admin/Sub-admin numbers auto-recognized) =================
function askAdminLogin(){
 if(isAdmin()){
  const at = allowedTabs();
  if(at && at.length) adminTab = at.includes(adminTab) ? adminTab : at[0];
  location.hash='admin'; return;
 }
 openAdminLoginModal();
}
// ===== ADMIN LOGIN MODAL (phone + OTP — Admin/Sub-admin numbers auto-recognized) =====
let _adminConfirmation = null, _adminRecaptcha = null;
function ensureAdminRecaptcha(){
 if(!_adminRecaptcha){
  _adminRecaptcha = new firebase.auth.RecaptchaVerifier('recaptcha-container-adminlogin', { size: 'invisible' });
 }
 return _adminRecaptcha;
}
function openAdminLoginModal(){
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6">'+
  '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-blue-800">🏛️ Admin Login</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
  '<p class="text-xs text-gray-500 mb-3">Admin/Sub-admin Mobile Number डालो — OTP से सीधे Admin Panel खुलेगा</p>'+
  '<div class="flex items-center border-2 border-blue-300 rounded overflow-hidden mb-3"><span class="bg-blue-100 px-3 py-2 font-bold text-blue-700 text-sm">+91</span><input type="tel" id="al_phone" maxlength="10" inputmode="numeric" placeholder="Mobile Number" class="flex-1 px-3 py-2 outline-none"></div>'+
  '<button onclick="sendAdminLoginOtp()" id="alOtpSendBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">📲 OTP भेजो</button>'+
  '<div id="alOtpBox" class="hidden mt-3"><input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" oninput="this.value=this.value.replace(/[^0-9]/g,\'\'); if(this.value.length===6) verifyAdminLoginOtp();" id="alOtpCode" maxlength="6" placeholder="OTP डालें" class="w-full px-3 py-2 border-2 border-blue-300 rounded mb-2 text-center text-2xl font-bold tracking-widest"><button onclick="verifyAdminLoginOtp()" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">✅ Login करो</button><div id="alResendArea" class="mt-2 text-center"></div></div>'+
  '<div id="recaptcha-container-adminlogin" class="mt-2 flex justify-center"></div>'+
  '</div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
async function sendAdminLoginOtp(){
 const phone = fmtPhone(document.getElementById('al_phone').value);
 if(phone.length!==10){ alert('❌ सही 10 अंकों का Mobile Number भरो'); return; }
 if((siteMeta.blocked||[]).includes(phone)){ alert('🚫 यह number block है। Admin से contact: '+CONTACT_PHONE); return; }
 const btn = document.getElementById('alOtpSendBtn');
 btn.disabled = true; btn.textContent = '📲 OTP भेज रहे हैं...';
 try{
  _adminConfirmation = await auth.signInWithPhoneNumber('+91'+phone, ensureAdminRecaptcha());
  document.getElementById('alOtpBox').classList.remove('hidden');
  tryWebOtpAutofillInto('alOtpCode', verifyAdminLoginOtp);
  startOtpResendCooldown('admin', 'alResendArea', 30, 'sendAdminLoginOtp');
 } catch(err){
  alert('❌ OTP भेजने में समस्या: '+err.message);
 }
 btn.disabled = false; btn.textContent = '📲 OTP भेजो';
}
async function verifyAdminLoginOtp(){
 const code = document.getElementById('alOtpCode').value.trim();
 if(code.length!==6){ alert('❌ 6 अंकों का OTP डालो'); return; }
 if(!_adminConfirmation){ alert('❌ पहले OTP भेजो'); return; }
 let verifiedPhone;
 try{ const res = await _adminConfirmation.confirm(code); verifiedPhone = phoneFromFirebase(res.user.phoneNumber); }
 catch(e){ alert('❌ गलत OTP - दोबारा देखो'); return; }
 _adminConfirmation = null;
 currentUser = verifiedPhone;
 localStorage.setItem('psLastPhone', verifiedPhone);
 closeBizForce();
 if(isAdmin()){
  const at = allowedTabs();
  if(at && at.length) adminTab = at.includes(adminTab) ? adminTab : at[0];
  location.hash = 'admin';
 } else {
  alert('❌ यह number Admin/Sub-admin नहीं है।\nआप सामान्य member की तरह login हो गए।');
  goPage('community');
 }
}
function doLogout(){
 if(!confirm('Logout करें? (दोबारा OTP लगेगा)')) return;
 localStorage.removeItem('psim_admin_ok');
 auth.signOut();
 location.hash='home';
}

// ================= LOADING / REALTIME =================
function busy(on){ document.getElementById('loadingBar').classList.toggle('hidden', !on); }
let _lastTypeTs = 0;
document.addEventListener('keydown', e => {
 const t = e.target;
 if(t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA')) _lastTypeTs = Date.now();
});
function safeRerender(){
 const ae = document.activeElement;
 const isTextField = ae && ((ae.tagName==='INPUT' && ae.type!=='checkbox' && ae.type!=='radio') || ae.tagName==='TEXTAREA');
 // Sirf tab roko jab user text likh raha ho (last 2.5 sec me keystroke) - buttons/selects kabhi block nahi
 if(isTextField && (Date.now() - _lastTypeTs) < 2500) return;
 renderApp();
}
let _listenersOn = false;
function setupRealtimeListeners(){
 if(_listenersOn) return; _listenersOn = true;
 const watch = (col, setter) => db.collection(col).onSnapshot(snap => {
  setter(snap.docs.map(d => Object.assign({id:d.id}, d.data())));
  safeRerender();
 }, err => console.error(col, err));
 watch('members', d => membersData = d);
 watch('events', d => eventsData = d.sort((a,b)=>(a.date||'').localeCompare(b.date||'')));
 watch('news', d => newsData = d.sort((a,b)=>(b.date||'').localeCompare(a.date||'')));
 watch('photos', d => photosData = d);
 watch('olditems', d => oldItems = d);
 watch('pratibha', d => pratibhaData = d);
 watch('jobs', d => jobsData = d);
 watch('shaadi', d => shaadiData = d);
 watch('relatives', d => relativesData = d);
 watch('friends', d => friendsData = d);
 watch('suggestions', d => suggestionsData = d);
 watch('team_join', d => teamJoinData = d);
 watch('committee', d => committeeData = d);
 watch('garba_regs', d => garbaRegs = d);
 watch('garba_team', d => garbaTeam = d);
 watch('garba_coords', d => garbaCoords = d);
 watch('cricket', d => cricketData = d);
 watch('property', d => propertyData = d);
 watch('blood', d => bloodData = d);
 watch('labh', d => labhData = d);
 watch('village_leads', d => villageLeadsData = d);
 watch('dharamshala', d => dharamshalaData = d);
 watch('hospitals', d => hospitalsData = d);
 watch('student_needs', d => studentNeedsData = d);
 watch('students', d => studentsData = d);
 watch('blood_sos', d => bloodSosData = d);
 watch('obituaries', d => obituariesData = d.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')));
 watch('translit_pairs', d => translitData = d);
 watch('village_info', d => villageInfoData = d);
 watch('referral_preapprovals', d => referralPreapprovalsData = d);
 db.collection('meta').doc('site').onSnapshot(doc => {
  if(doc.exists) siteMeta = Object.assign(siteMeta, doc.data());
  if(!siteMeta.ads || siteMeta.ads.length<5) siteMeta.ads = [{},{},{},{},{}];
  safeRerender();
 });
 busy(false);
 route();
}
async function saveMeta(){ await db.collection('meta').doc('site').set(siteMeta); }

// ================= ROUTING (login-gated) =================
// बिना login दिखने वाले pages — Home/News/Pratibha/Events/Gallery + Rozgaar व OLX (सिर्फ browsing) खुले हैं
// बाकी सब (Community, Business, Garba, Cricket, Blood, Property, Shaadi) के लिए पहले Community member बनना जरूरी है
const OPEN_PAGES = ['home','news','register','events','gallery','pratibha','rozgaar','olditems','suggestions','obituaries'];
const LOCKED_PAGES = ['community','business','garba','cricket','blood','property','shaadi','dharamshala','hospitals','students','meregaanv','patidarai'];
function goPage(p){
 if(!currentUser && LOCKED_PAGES.includes(p)){
  showRegisterPrompt('यह सुविधा सिर्फ रजिस्टर्ड सदस्यों के लिए है — Community से जुड़ने के लिए Register करो।');
  return;
 }
 location.hash = p;
}
let _lastActiveStamped = false;
function stampLastActiveIfNeeded(){
 if(_lastActiveStamped || !currentUser) return;
 const me = membersData.find(m => m.phone===currentUser);
 if(!me) return; // members अभी load नहीं हुए — अगले route() पर फिर try होगा
 _lastActiveStamped = true;
 if(me.lastActiveAt !== today()) db.collection('members').doc(me.id).update({lastActiveAt: today()}).catch(()=>{});
}
function route(){
 stampLastActiveIfNeeded();
 let h = (location.hash||'#home').replace('#','');
 if(h.startsWith('news/')){ selectedNewsId = h.split('/')[1]; h = 'news'; }
 if(h==='admin' && !isAdmin()){ h='home'; }
 else if(_authResolved && !currentUser && !OPEN_PAGES.includes(h) && h!=='admin' && h!==''){ h='home'; }
 currentPage = h || 'home';
 updateUI(); window.scrollTo(0,0);
}
window.onhashchange = route;
function shareWA(text){ window.open('https://wa.me/?text='+encodeURIComponent(text), '_blank'); }
function pageLink(p){ return location.origin + location.pathname + '#' + p; }
function openObjectivePopup(){
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6">'+
  '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-orange-700">🎯 हमारा उद्देश्य</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
  '<p class="text-gray-700 leading-relaxed whitespace-pre-line">'+esc(T('objective', DEFAULT_OBJECTIVE_TEXT))+'</p>'+
  '<button onclick="closeBizForce(); startRegister();" class="w-full mt-5 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold">📝 अभी Register करो</button>'+
  '</div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
function shareInvite(){ shareWA(T('inviteMsg', DEFAULT_INVITE_MSG) + '\n' + pageLink('register')); }

// ================= CLOUDINARY =================
let _cloudTarget = null;
const cloudWidget = cloudinary.createUploadWidget(
 { cloudName: 'k6q1hoit', uploadPreset: 'psimindore' },
 function(error, result){
  if(!error && result && result.event === 'success'){
   const url = result.info.secure_url;
   if(_cloudTarget){
    const el = document.getElementById(_cloudTarget);
    if(el) el.value = url;
    const prev = document.getElementById(_cloudTarget + '_prev');
    if(prev){ prev.src = url; prev.classList.remove('hidden'); }
   }
  }
 });
function openCloudUpload(fieldId){ _cloudTarget = fieldId; cloudWidget.open(); }

// ================= REGISTER-NOW PROMPT (shown wherever a guest hits a members-only feature) =================
function showRegisterPrompt(msg){
 const m = document.getElementById('registerPromptMsg');
 if(m) m.textContent = msg || 'यह सुविधा सिर्फ रजिस्टर्ड सदस्यों के लिए है — जुड़ने में सिर्फ एक मिनट लगता है।';
 document.getElementById('registerPromptModal').classList.remove('hidden');
}
function closeRegisterPrompt(){ document.getElementById('registerPromptModal').classList.add('hidden'); }

// ================= OPTIONAL FIELDS MODAL =================
function openOptionalFieldsModal(){
 const modal = document.getElementById('optionalFieldsModal');
 const content = document.getElementById('optionalFieldsContent');
 content.innerHTML = grpFields(OPTIONAL_FIELDS[0].keys).map(f => fieldHTML('reg_', f, draftGet(f[0]))).join('');
 modal.classList.remove('hidden');
 document.body.style.overflow = 'hidden';
}
function closeOptionalFieldsModal(){
 document.getElementById('optionalFieldsModal').classList.add('hidden');
 document.body.style.overflow = 'auto';
}
function saveOptionalFieldsAndClose(){
 grpFields(OPTIONAL_FIELDS[0].keys).forEach(f => {
  const el = document.getElementById('reg_'+f[0]);
  if(el) draftSet(f[0], el.value);
 });
 closeOptionalFieldsModal();
 renderApp();
}

function startRegister(){
 if(currentUser && myMember()){ alert('✅ आप पहले से registered हैं! आपकी profile Community page पर है।'); goPage('community'); return; }
 regStep = 0;
 regMode = 'otp'; showRegModeChooser = true;
 if(!draftGet('phone')){
  const saved = localStorage.getItem('psLastPhone');
  if(saved) draftSet('phone', saved);
 }
 goPage('register');
}
auth.onAuthStateChanged(user => {
 _authResolved = true;
 if(user){
  const ph = phoneFromFirebase(user.phoneNumber);
  if((siteMeta.blocked||[]).includes(ph)){ alert('🚫 आपका number block है।'); auth.signOut(); return; }
  currentUser = ph;
 } else {
  currentUser = '';
 }
 route();
});

// ================= RAZORPAY BUTTON (dynamic mount - script tags don't run via innerHTML) =================
function mountRazorpayButton(buttonId, containerId){
 const box = document.getElementById(containerId||'razorpayBtnContainer');
 if(!box || !buttonId) return;
 box.innerHTML = '';
 const form = document.createElement('form');
 const s = document.createElement('script');
 s.src = 'https://checkout.razorpay.com/v1/payment-button.js';
 s.setAttribute('data-payment_button_id', buttonId);
 s.async = true;
 form.appendChild(s);
 box.appendChild(form);
}

// ================= MEMBER FIELDS =================
const MEMBER_FIELDS = [
 ['name','First Name / नाम *','text'],['surname','Surname / उपनाम *','text'],
 ['phone','Mobile Number / मोबाइल *','tel'],['email','Email (optional)','email'],
 ['gender','Gender / लिंग','gender'],
 ['privacy','Profile Privacy / गोपनीयता','privacy'],
 ['age','Age / उम्र','text'],
 ['profile_pic','आपकी Photo 📷','photo'],
 ['work_details','अपने काम की details','textarea'],
 ['marital_status','Marital Status','select',['Married / विवाहित','Unmarried / अविवाहित']],
 ['blood_group','Blood Group / ब्लड ग्रुप','select',BLOOD_GROUPS],
 ['blood_donor','रक्तदान के लिए तैयार? / Willing to Donate?','select',['हाँ / Yes','नहीं / No']],
 ['home_village','Village / गाँव','text'],['home_tehsil','Tehsil / तहसील','text'],
 ['home_district','District (MP) / जिला','select',MP_DISTRICTS],
 ['home_district_other','District - अगर MP से बाहर','text'],
 ['home_state','State / राज्य','select',STATES],
 ['home_pincode','Pincode','text'],['home_police_station','Police Station / थाना','text'],
 ['present_address','Full Address / पूरा पता','text'],['present_city','City / शहर','text'],
 ['present_tehsil','Tehsil / तहसील','text'],
 ['present_district','District (MP) / जिला','select',MP_DISTRICTS],
 ['present_district_other','District - अगर MP से बाहर','text'],
 ['present_state','State / राज्य','select',STATES],
 ['present_pincode','Pincode','text'],['present_police_station','Police Station / थाना','text'],
 ['business_name','Business Name','text'],
 ['business_type','Business Type','select',BUSINESS_TYPES],
 ['business_type_other','Type - Other (खुद लिखो)','text'],
 ['business_place','Business Address','text'],
 ['business_phone','Business Contact','tel'],
 ['business_gmap','Google Business/Maps Link 📍','text'],
 ['business_pic1','Business Photo 📷','photo'],
 ['business_details','Business Details','textarea']
];
const STEP_GROUPS = [
 {title:'📝 बेसिक जानकारी / Basic Info', color:'blue', keys:['name','surname','phone','email','gender','privacy','home_village','home_district','present_city']},
 {title:'🏪 क्या आपका भी व्यापार है? / Do You Have a Business?', color:'yellow', keys:['has_business','business_name','business_type','business_place','business_phone','business_pic1','business_details']},
 {title:'🔐 सत्यापन / Verification', color:'green', keys:['otp_verify']}
];

const OPTIONAL_FIELDS = [
 {title:'👤 और जानकारी / More Details', color:'purple', keys:['profile_pic','age','marital_status','work_details','blood_group','blood_donor','home_tehsil','home_pincode','home_police_station','present_address','present_tehsil','present_pincode','present_police_station']}
];

function fieldHTML(prefix, f, val){
 val = val || '';
 const fid = prefix + f[0];
 // Registration form में हर field type करते ही draft में save — कहीं भी navigate कर दो, data नहीं उड़ेगा
 const onInputSave = prefix==='reg_' ? " oninput=\"draftSet('"+f[0]+"',this.value)\"" : '';
 const onChangeSave = prefix==='reg_' ? " draftSet('"+f[0]+"',this.value);" : '';
 if(f[2] === 'photo'){
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label>'+
   '<input type="hidden" id="'+fid+'" value="'+esc(val)+'">'+
   '<button type="button" onclick="openCloudUpload(\''+fid+'\')" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload Photo</button>'+
   '<img id="'+fid+'_prev" src="'+esc(val)+'" class="'+(val?'':'hidden ')+'mt-2 h-20 w-full object-cover rounded border-2 border-gray-300"></div>';
 }
 if(f[2] === 'textarea'){
  return '<div class="md:col-span-2 lg:col-span-3"><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><textarea id="'+fid+'" rows="2"'+onInputSave+' class="w-full px-3 py-2 border-2 border-gray-300 rounded">'+String(val).replace(/</g,'&lt;')+'</textarea></div>';
 }
 if(f[2] === 'gender'){
  const opts = ['Male / पुरुष','Female / महिला','Other / अन्य'].map(o=>'<option '+(o===val?'selected':'')+'>'+o+'</option>').join('');
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+' *</label><select id="'+fid+'" onchange="togglePrivacyBox(this.value,\''+prefix+'\');'+onChangeSave+'" class="w-full px-3 py-2 border-2 border-gray-300 rounded"><option value="">--Select--</option>'+opts+'</select></div>';
 }
 if(f[2] === 'privacy'){
  return '<div id="'+prefix+'privacyBox" class="hidden md:col-span-2 bg-red-50 border-2 border-red-400 rounded-lg p-4 mt-1">'+
   '<label class="text-sm font-bold text-red-700 flex items-center gap-1">🔒 आपकी Privacy, आपकी पसंद *</label>'+
   '<p class="text-xs text-red-600 mt-1 mb-2">आपकी सुरक्षा हमारे लिए ज़रूरी है — कृपया चुनें कि आपकी प्रोफाइल सबको दिखाई दे, या सिर्फ PSIM Team को।</p>'+
   '<select id="'+fid+'" onchange="'+onChangeSave+'" class="w-full px-3 py-2 border-2 border-red-300 rounded bg-white font-bold text-red-800">'+
   '<option value="">-- चुनें / Please Select --</option>'+
   '<option value="Public / सबको दिखे" '+(val==='Public / सबको दिखे'?'selected':'')+'>👁️ मेरी प्रोफाइल सबको दिखे / Public</option>'+
   '<option value="Secret / सिर्फ PSIM Team को" '+(val==='Secret / सिर्फ PSIM Team को'?'selected':'')+'>🔒 सिर्फ PSIM Team को दिखे / Secret</option>'+
   '</select>'+
   '<p class="text-[11px] text-red-500 mt-1">"Secret" चुनने पर भी आपको समाज की सारी सुविधाएँ मिलती रहेंगी — बस आपकी प्रोफाइल सार्वजनिक Community list में नहीं दिखेगी।</p></div>';
 }
 if(f[2] === 'select'){
  let src = f[3];
  if(f[0]==='business_type'){
   const extras = [...new Set(membersData.map(m=>m.business_type_other).filter(v=>v&&v.trim()))];
   src = f[3].concat(extras.filter(e=>!f[3].includes(e)));
  }
  if(f[0]==='business_type'){
   // टाइप करके खोजो (जैसे "Dr" लिखते ही "Doctor" जैसे matching options ऊपर दिखेंगे) — या नीचे तीर दबाकर पूरी list भी देख सकते हो
   return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+' / Profession 🔍</label>'+
    '<input type="text" id="'+fid+'" list="'+fid+'_dl" value="'+esc(val)+'"'+onInputSave+' placeholder="टाइप करो या नीचे तीर से पूरी list देखो..." class="w-full px-3 py-2 border-2 border-gray-300 rounded">'+
    '<datalist id="'+fid+'_dl">'+src.map(o=>'<option value="'+esc(o)+'">').join('')+'</datalist></div>';
  }
  const opts = src.map(o => '<option '+(o===val?'selected':'')+'>'+o+'</option>').join('');
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><select id="'+fid+'" onchange="'+onChangeSave+'" class="w-full px-3 py-2 border-2 border-gray-300 rounded"><option value="">--Select--</option>'+opts+'</select></div>';
 }
 if(f[0]==='phone' && prefix==='reg_' && currentUser){
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+' (आपका login number - automatic)</label><input type="tel" id="'+fid+'" value="'+esc(currentUser)+'" readonly class="w-full px-3 py-2 border-2 border-gray-300 rounded bg-gray-100 text-gray-600"></div>';
 }
 if(f[0]==='phone' && prefix==='edit_'){
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+' (बदला नहीं जा सकता)</label><input type="tel" id="'+fid+'" value="'+esc(val)+'" readonly class="w-full px-3 py-2 border-2 border-gray-300 rounded bg-gray-100 text-gray-600"></div>';
 }
 if(f[0]==='phone' && prefix==='reg_'){
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><div class="flex items-center border-2 border-gray-300 rounded overflow-hidden"><span class="bg-gray-100 px-3 py-2 font-bold text-gray-600 text-sm">+91</span><input type="tel" id="'+fid+'" maxlength="10" value="'+esc(val)+'"'+onInputSave+' class="flex-1 px-3 py-2 outline-none"></div></div>';
 }
 let listAttr='';
 if(f[0].includes('village')) listAttr=' list="dl_villages"';
 else if(f[0].includes('tehsil')) listAttr=' list="dl_tehsils"';
 else if(f[0].includes('city')) listAttr=' list="dl_cities"';
 else if(f[0].includes('police')) listAttr=' list="dl_police"';
 return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><input type="'+f[2]+'" id="'+fid+'"'+listAttr+' value="'+esc(val)+'"'+onInputSave+' class="w-full px-3 py-2 border-2 border-gray-300 rounded"></div>';
}
function togglePrivacyBox(val, prefix){
 const box = document.getElementById(prefix+'privacyBox');
 if(box) box.classList.toggle('hidden', !(val && val.indexOf('Female')===0));
}
function grpFields(keys){ return MEMBER_FIELDS.filter(f => keys.includes(f[0])); }

function memberFormHTML(prefix, m){
 m = m || {};
 return STEP_GROUPS.map(g =>
  '<div class="mt-5 bg-'+g.color+'-50 border-2 border-'+g.color+'-400 rounded-lg p-5">'+
  '<h4 class="text-lg font-bold text-'+g.color+'-800 mb-3">'+g.title+'</h4>'+
  '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'+grpFields(g.keys).map(f => fieldHTML(prefix, f, m[f[0]])).join('')+'</div></div>'
 ).join('');
}

function stepFormHTML(m){
 m = m || {};
 const g = STEP_GROUPS[regStep];
 let h = '';
 if(!currentUser) h += '<button type="button" onclick="showRegModeChooser=true; renderApp();" class="text-xs text-gray-400 hover:text-gray-600 mb-2">← register का तरीका बदलो</button>';
 h += '<div class="flex justify-center gap-2 mb-4">';
 STEP_GROUPS.forEach((s,i) => { h += '<div class="h-2 w-10 rounded '+(i<=regStep?'bg-blue-600':'bg-gray-300')+'"></div>'; });
 h += '</div>';
 h += '<p class="text-center text-sm text-gray-500 mb-3">Step '+(regStep+1)+' / 3</p>';
 h += '<div class="bg-'+g.color+'-50 border-2 border-'+g.color+'-400 rounded-lg p-5">';
 h += '<h4 class="text-lg font-bold text-'+g.color+'-800 mb-3">'+g.title+'</h4>';
 if(regStep===0){
  h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+grpFields(g.keys).map(f => fieldHTML('reg_', f, draftGet(f[0], m[f[0]]))).join('')+'</div>';
  h += '<div class="mt-6 pt-4 border-t-2 border-blue-300">';
  h += '<button type="button" onclick="openOptionalFieldsModal()" class="text-sm font-bold text-blue-600 hover:text-blue-800 mb-3">➕ और जानकारी (Optional) / More Details</button>';
  h += '</div>';
 } else if(regStep===1){
  h += '<label class="flex items-center gap-2 mb-4 text-sm font-bold cursor-pointer"><input type="checkbox" id="reg_has_business" onchange="document.getElementById(\'bizFields\').classList.toggle(\'hidden\')"> हाँ, मेरे पास व्यापार/सेवा है</label>';
  h += '<div id="bizFields" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4">'+grpFields(['business_name','business_type','business_place','business_phone','business_pic1','business_details']).map(f => fieldHTML('reg_', f, draftGet(f[0], m[f[0]]))).join('')+'</div>';
 } else if(regStep===2){
  if(currentUser){
   h += '<p class="text-center mb-4">आपकी सभी जानकारी दर्ज हो गई है। आप पहले से 📱 '+esc(currentUser)+' से login हो (verified) — सीधे submit करो।</p>';
   h += '<button onclick="submitSelfRegistration()" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg">✅ पूरा हुआ / Submit</button>';
  } else if(regMode==='reference'){
   h += '<p class="text-center mb-4">आपकी सभी जानकारी दर्ज हो गई है। अगर किसी member ने आपको पहले से approve कर रखा है तो आप तुरंत बिना OTP के जुड़ जाओगे — वरना आपका request Admin approval के लिए waiting में चला जाएगा।</p>';
   h += '<button onclick="submitReferenceRegister()" id="refRegSubmitBtn" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg">✅ Submit करो (बिना OTP)</button>';
  } else {
   h += '<p class="text-center mb-4">आपकी सभी जानकारी दर्ज हो गई है।</p>';
   h += '<button onclick="sendRegOtp()" id="regOtpSendBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">📲 OTP भेजो</button>';
   h += '<div id="regOtpBox" class="hidden mt-4"><input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" oninput="this.value=this.value.replace(/[^0-9]/g,\'\'); if(this.value.length===6) verifyRegOtp();" id="regOtpCode" maxlength="6" placeholder="OTP डालें (SMS से auto-fill होगा)" class="w-full px-3 py-2 border-2 border-gray-300 rounded mb-2 text-center text-2xl font-bold tracking-widest"><button onclick="verifyRegOtp()" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">✅ सत्यापित करें</button><div id="regResendArea" class="mt-2 text-center"></div></div>';
   h += '<div id="recaptcha-container-reg" class="mt-3"></div>';
  }
 }
 h += '</div>';
 h += '<div class="flex justify-between mt-5">';
 h += regStep>0 ? '<button onclick="stepPrev()" class="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold">← पीछे</button>' : '<span></span>';
 h += regStep<2 ? '<button onclick="stepNext()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">आगे बढ़ें →</button>' :
  '<button onclick="submitSelfRegistration()" class="hidden bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg">✅ पूरा हुआ</button>';
 h += '</div>';
 return h;
}
function stepSaveCurrent(){
 grpFields(STEP_GROUPS[regStep].keys).forEach(f => {
  const el = document.getElementById('reg_'+f[0]);
  if(el) draftSet(f[0], el.value);
 });
 if(regStep===0){
  grpFields(OPTIONAL_FIELDS[0].keys).forEach(f => {
   const el = document.getElementById('reg_'+f[0]);
   if(el) draftSet(f[0], el.value);
  });
 }
}
function stepNext(){
 stepSaveCurrent();
 if(regStep===0){
  if(!draftGet('name')||!draftGet('surname')||!draftGet('home_village')||!draftGet('home_district')||!draftGet('present_city')){ alert('❌ नाम, Surname, गाँव, जिला, और शहर सब भरो'); return; }
  if(!currentUser && fmtPhone(draftGet('phone')).length!==10){ alert('❌ सही 10 अंकों का Mobile Number भरो'); return; }
  if(!draftGet('gender')){ alert('❌ कृपया Gender चुनें'); return; }
  if(draftGet('gender').indexOf('Female')===0 && !draftGet('privacy')){ alert('❌ कृपया अपनी Profile Privacy चुनें — Public या Secret'); return; }
 }
 regStep++; renderApp();
}
function stepPrev(){ stepSaveCurrent(); regStep--; renderApp(); }
function copyHomeAddr(cb){
 if(cb.checked){
  ['tehsil','district','district_other','state','pincode','police_station'].forEach(k=>{
   const el = document.getElementById('reg_present_'+k);
   if(el) el.value = draftGet('home_'+k) || '';
  });
 }
}

// ================= DRAFT AUTO-SAVE =================
let _draft = JSON.parse(localStorage.getItem('psDraft')||'{}');
function draftSet(k,v){ _draft[k]=v; localStorage.setItem('psDraft', JSON.stringify(_draft)); }
function draftGet(k, fallback){ return _draft[k]!==undefined && _draft[k]!=='' ? _draft[k] : (fallback||''); }
function draftClear(){ _draft={}; localStorage.removeItem('psDraft'); }
document.addEventListener('input', e => {
 if(e.target.id && e.target.id.startsWith('reg_')) draftSet(e.target.id.replace('reg_',''), e.target.value);
});

function readMemberForm(prefix){
 const obj = {};
 MEMBER_FIELDS.forEach(f => { const el = document.getElementById(prefix+f[0]); obj[f[0]] = el ? (el.value||'').trim() : ''; });
 obj.name = fmtName(obj.name); obj.surname = fmtName(obj.surname);
 obj.home_village = fmtName(obj.home_village); obj.present_city = fmtName(obj.present_city);
 obj.phone = fmtPhone(obj.phone); obj.business_phone = fmtPhone(obj.business_phone);
 return obj;
}

// ===== EDIT MY PROFILE (member self-service, re-approval required) =====
function openEditProfile(){
 const me = myMember(); if(!me) return;
 const box = document.getElementById('bizModalBox');
 let h = '<div class="p-6">';
 h += '<div class="flex justify-between items-center mb-4"><h3 class="text-2xl font-bold text-blue-800">✏️ अपनी Profile Edit करो</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>';
 h += STEP_GROUPS.slice(0,2).map(g =>
  '<div class="mt-3 bg-'+g.color+'-50 border-2 border-'+g.color+'-400 rounded-lg p-4">'+
  '<h4 class="text-md font-bold text-'+g.color+'-800 mb-3">'+g.title+'</h4>'+
  '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+grpFields(g.keys).map(f => fieldHTML('edit_', f, me[f[0]])).join('')+'</div></div>'
 ).join('');
 const optFields = grpFields(OPTIONAL_FIELDS[0].keys);
 if(optFields.length) h += '<div class="mt-3 bg-purple-50 border-2 border-purple-400 rounded-lg p-4"><h4 class="text-md font-bold text-purple-800 mb-3">👤 और जानकारी</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+optFields.map(f=>fieldHTML('edit_', f, me[f[0]])).join('')+'</div></div>';
 h += '<button onclick="saveMyProfile()" class="mt-5 w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg">✅ SAVE — Update करो</button>';
 h += '<p class="text-xs text-gray-400 mt-2 text-center">⚠️ Save करने पर आपकी profile दोबारा Admin approval में जाएगी</p>';
 h += '</div>';
 box.innerHTML = h;
 document.getElementById('bizModal').classList.remove('hidden');
 setTimeout(()=>{
  document.querySelectorAll('select[id$="gender"]').forEach(sel=>{ const prefix = sel.id.slice(0,-6); togglePrivacyBox(sel.value, prefix); });
 },30);
}
async function saveMyProfile(){
 const me = myMember(); if(!me) return;
 const d = readMemberForm('edit_');
 if(!d.name || !d.surname){ alert('❌ Name और Surname दोनों भरो'); return; }
 d.phone = me.phone;
 d.status = 'pending';
 busy(true);
 await db.collection('members').doc(me.id).update(d);
 busy(false);
 closeBizForce();
 alert('✅ आपकी details update हो गईं! दोबारा Admin approval के बाद फिर से live होंगी।');
 renderApp();
}

// ===== JOIN US → "TEAM से जुड़ें" (सिर्फ registered members) =====
function joinUsClick(){
 const me = myMember();
 if(currentUser && me && me.status==='approved'){ openJoinTeamPrompt(); return; }
 goPage('community');
}
function openJoinTeamPrompt(){
 const me = myMember(); if(!me) return;
 if(teamJoinData.find(t=>t.phone===me.phone)){
  alert('✅ आप पहले से टीम से जुड़ चुके हो! धन्यवाद 🙏');
  return;
 }
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6 text-center">'+
  '<p class="text-4xl mb-3">🤝</p>'+
  '<h3 class="text-xl font-bold mb-4">क्या आप पाटीदार समाज इंदौर महानगर की टीम से जुड़ना चाहते हैं?</h3>'+
  '<button onclick="confirmJoinTeam()" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg">✅ हाँ, जुड़ना है</button>'+
  '<button onclick="closeBizForce()" class="w-full mt-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold">वापस जाएं / Go Back</button>'+
  '</div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
async function confirmJoinTeam(){
 const me = myMember(); if(!me) return;
 busy(true);
 await db.collection('team_join').add({name:me.name+' '+me.surname, phone:me.phone, createdAt:today()});
 busy(false);
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6 text-center">'+
  '<p class="text-4xl mb-3">🙏</p>'+
  '<h3 class="text-xl font-bold mb-2">Thank you, '+esc(me.name)+'!</h3>'+
  '<p class="text-gray-600 mb-4">आपका नाम टीम के पास चला गया है।</p>'+
  '<button onclick="closeBizForce()" class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold">वापस जाएं / Go Back</button>'+
  '</div>';
}

// ===== SWIPE / DISCOVER — full-screen, auto-rotating profile carousel (Community + Business) =====
let swipeMode = null; // 'community' | 'business'
let swipeParentMode = null;
let swipeList = [];
let swipeIndex = 0;
let swipeTimer = null;
let swipeAutoOn = true;
function rebuildSwipeList(){
 swipeList = swipeMode==='business' ? allBusinesses() : publicMembers();
 if(swipeIndex>=swipeList.length) swipeIndex=0;
}
function openSwipeView(mode){
 if(!currentUser){ showRegisterPrompt('Profiles घुमा कर देखने के लिए पहले Register करो।'); return; }
 swipeMode = mode; swipeParentMode = null; swipeIndex = 0; swipeAutoOn = true;
 rebuildSwipeList();
 document.getElementById('swipeOverlay').classList.remove('hidden');
 renderSwipeCard();
 startSwipeAuto();
}
function closeSwipeView(){
 stopSwipeAuto();
 document.getElementById('swipeOverlay').classList.add('hidden');
 swipeMode=null; swipeParentMode=null; swipeList=[]; swipeIndex=0;
}
function swipeGoBack(){
 if(swipeParentMode){
  swipeMode = swipeParentMode; swipeParentMode = null; swipeIndex = 0;
  rebuildSwipeList(); renderSwipeCard(); startSwipeAuto();
 } else closeSwipeView();
}
function swipeNext(){ if(!swipeList.length) return; swipeIndex=(swipeIndex+1)%swipeList.length; renderSwipeCard(); }
function swipePrev(){ if(!swipeList.length) return; swipeIndex=(swipeIndex-1+swipeList.length)%swipeList.length; renderSwipeCard(); }
function swipeManualNav(dir){ stopSwipeAuto(); if(dir>0) swipeNext(); else swipePrev(); startSwipeAuto(); }
function startSwipeAuto(){ stopSwipeAuto(); if(swipeAutoOn) swipeTimer = setInterval(swipeNext, 4500); updateSwipeAutoBtn(); }
function stopSwipeAuto(){ if(swipeTimer) clearInterval(swipeTimer); swipeTimer=null; }
function swipeToggleAuto(){ swipeAutoOn=!swipeAutoOn; if(swipeAutoOn) startSwipeAuto(); else stopSwipeAuto(); updateSwipeAutoBtn(); }
function updateSwipeAutoBtn(){ const b=document.getElementById('swipeAutoBtn'); if(b) b.textContent = swipeAutoOn?'⏸️':'▶️'; }
function swipeToBusiness(memberId){
 swipeParentMode = swipeMode; swipeMode = 'business';
 rebuildSwipeList();
 const idx = swipeList.findIndex(b=>b.id===memberId);
 swipeIndex = idx>=0?idx:0;
 renderSwipeCard(); startSwipeAuto();
}
function renderSwipeCard(){
 const box = document.getElementById('swipeCardBox');
 const counter = document.getElementById('swipeCounter');
 if(!box) return;
 if(!swipeList.length){
  box.innerHTML = '<p class="text-gray-400 text-lg">अभी कोई profile उपलब्ध नहीं है</p>';
  if(counter) counter.textContent='';
  return;
 }
 if(counter) counter.textContent = (swipeIndex+1)+' / '+swipeList.length+(swipeMode==='business'?' 🏪 Businesses':' 👥 Community');
 if(swipeMode==='business'){
  const b = swipeList[swipeIndex];
  box.innerHTML = '<div class="max-w-md w-full bg-white border-2 border-yellow-300 rounded-2xl shadow-xl overflow-hidden">'+
   (b.pic?'<img src="'+b.pic+'" class="w-full h-64 object-cover">':'<div class="w-full h-40 bg-yellow-100 flex items-center justify-center text-6xl">🏪</div>')+
   '<div class="p-6 text-center">'+
   '<p class="text-2xl font-bold text-yellow-700">'+esc(b.name)+'</p>'+
   '<p class="inline-block bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold mt-2">'+esc(b.type)+'</p>'+
   '<div class="mt-4 space-y-1 text-gray-700 text-left">'+
   '<p>👤 '+esc(b.owner)+'</p>'+
   (b.place?'<p>📍 '+esc(b.place)+'</p>':'')+
   '<p>📱 '+esc(b.phone)+'</p></div>'+
   (b.description?'<p class="text-sm text-gray-600 mt-3 bg-gray-50 rounded p-3">'+esc(b.description)+'</p>':'')+
   '<div class="grid grid-cols-2 gap-2 mt-5">'+
   '<a href="tel:'+esc(b.phone)+'" class="bg-green-600 text-white px-4 py-3 rounded-lg font-bold">📞 Call</a>'+
   '<a href="https://wa.me/91'+esc(b.phone)+'" target="_blank" class="bg-green-500 text-white px-4 py-3 rounded-lg font-bold">💬 WhatsApp</a>'+
   '</div></div></div>';
 } else {
  const m = swipeList[swipeIndex];
  const rels = relOf(m), frs = friendsOf(m);
  box.innerHTML = '<div class="max-w-md w-full bg-white border-2 border-blue-300 rounded-2xl shadow-xl overflow-hidden">'+
   (m.profile_pic?'<img src="'+m.profile_pic+'" class="w-full h-64 object-cover">':'<div class="w-full h-40 bg-blue-100 flex items-center justify-center text-6xl">👤</div>')+
   '<div class="p-6 text-center">'+
   '<p class="text-2xl font-bold text-blue-800">'+esc(m.name)+' '+esc(m.surname)+'</p>'+
   (profOf(m)?'<p class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mt-2">'+esc(profOf(m))+'</p>':'')+
   '<div class="mt-4 space-y-1 text-gray-700 text-sm text-left">'+
   '<p>📱 '+esc(m.phone)+'</p>'+
   '<p>🏡 गाँव: '+esc(m.home_village||'-')+', '+esc(distOf(m,'home')||'-')+'</p>'+
   '<p>📍 वर्तमान: '+esc(m.present_city||'-')+', '+esc(distOf(m,'present')||'-')+'</p>'+
   (m.blood_group?'<p>🩸 Blood Group: <b class="text-red-600">'+esc(m.blood_group)+'</b></p>':'')+
   '</div>'+
   (frs.length?'<p class="text-xs text-gray-500 mt-3">🙋 मित्र: '+frs.map(esc).join(', ')+'</p>':'')+
   (rels.length?'<p class="text-xs text-gray-500 mt-1">👨‍👩‍👧 रिश्तेदार: '+rels.map(esc).join(', ')+'</p>':'')+
   (m.business_name?'<button onclick="swipeToBusiness(\''+m.id+'\')" class="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-3 rounded-lg font-bold mt-4">🏪 इनका Business देखें: '+esc(m.business_name)+'</button>':'')+
   (currentUser && currentUser!==m.phone ? '<div class="flex gap-2 mt-3"><button onclick="sendFriendRequest(\''+m.id+'\')" class="flex-1 bg-purple-100 text-purple-700 border border-purple-300 px-3 py-2 rounded-lg text-xs font-bold">➕ मित्र</button><button onclick="openRelPicker(\''+m.id+'\')" class="flex-1 bg-indigo-100 text-indigo-700 border border-indigo-300 px-3 py-2 rounded-lg text-xs font-bold">👨‍👩‍👧 रिश्तेदार</button></div>' : '')+
   '</div></div>';
 }
}
let _swipeTouchStartX = null;
document.addEventListener('touchstart', e => {
 const ov = document.getElementById('swipeOverlay');
 if(!ov || ov.classList.contains('hidden')) return;
 _swipeTouchStartX = e.touches[0].clientX;
});
document.addEventListener('touchend', e => {
 if(_swipeTouchStartX===null) return;
 const dx = e.changedTouches[0].clientX - _swipeTouchStartX;
 _swipeTouchStartX = null;
 if(Math.abs(dx) < 50) return;
 if(dx < 0) swipeManualNav(1); else swipeManualNav(-1);
});

let _regConfirmation = null;
let _regRecaptcha = null;
function ensureRegRecaptcha(){
 if(!_regRecaptcha){
  _regRecaptcha = new firebase.auth.RecaptchaVerifier('recaptcha-container-reg', { size: 'invisible' });
 }
 return _regRecaptcha;
}
// SMS aate hi Android Chrome par bina type kiye OTP auto-fill + auto-verify (support na ho to chup-chaap skip)
function tryWebOtpAutofillInto(inputId, verifyFn){
 if(!('OTPCredential' in window)) return;
 const ac = new AbortController();
 setTimeout(()=>ac.abort(), 60000);
 navigator.credentials.get({ otp: { transport:['sms'] }, signal: ac.signal }).then(otp => {
  const code = (otp.code||'').replace(/[^0-9]/g,'');
  const el = document.getElementById(inputId);
  if(el && code.length===6){ el.value = code; verifyFn(); }
 }).catch(()=>{});
}
function tryWebOtpAutofill(){ tryWebOtpAutofillInto('regOtpCode', verifyRegOtp); }
// OTP नहीं मिला? आसान/बड़ा "Resend OTP" — बार-बार तेज़ी से click से Firebase abuse-warning ना आए इसलिए हल्का सा cooldown
let _otpResendTimers = {};
function startOtpResendCooldown(key, elId, seconds, resendFn){
 const el = document.getElementById(elId);
 if(!el) return;
 let remaining = seconds;
 const render = () => {
  el.innerHTML = remaining>0
   ? '<span class="text-xs text-gray-400">OTP नहीं मिला? '+remaining+'s में दोबारा भेज सकते हो</span>'
   : '<button onclick="'+resendFn+'()" class="text-sm font-bold text-blue-600 underline">🔄 OTP दोबारा भेजो / Resend OTP</button>';
 };
 render();
 if(_otpResendTimers[key]) clearInterval(_otpResendTimers[key]);
 _otpResendTimers[key] = setInterval(()=>{
  remaining--;
  if(remaining<=0) clearInterval(_otpResendTimers[key]);
  render();
 }, 1000);
}
// ===== QUICK LOGIN (पहले से Member हो? सिर्फ Phone + OTP — पूरा form दोबारा नहीं भरना) =====
let quickLoginPhone = localStorage.getItem('psLastPhone') || '';
let showQuickLoginBox = false;
function toggleQuickLoginBox(){ showQuickLoginBox = !showQuickLoginBox; renderApp(); }
let _quickConfirmation = null, _quickRecaptcha = null;
function ensureQuickRecaptcha(){
 if(!_quickRecaptcha){
  _quickRecaptcha = new firebase.auth.RecaptchaVerifier('recaptcha-container-quicklogin', { size: 'invisible' });
 }
 return _quickRecaptcha;
}
async function sendQuickLoginOtp(){
 const phone = fmtPhone(document.getElementById('ql_phone').value);
 if(phone.length!==10){ alert('❌ सही 10 अंकों का Mobile Number भरो'); return; }
 if((siteMeta.blocked||[]).includes(phone)){ alert('🚫 यह number block है। Admin से contact: '+CONTACT_PHONE); return; }
 quickLoginPhone = phone;
 const btn = document.getElementById('qlOtpSendBtn');
 btn.disabled = true; btn.textContent = '📲 OTP भेज रहे हैं...';
 try{
  _quickConfirmation = await auth.signInWithPhoneNumber('+91'+phone, ensureQuickRecaptcha());
  document.getElementById('qlOtpBox').classList.remove('hidden');
  tryWebOtpAutofillInto('qlOtpCode', verifyQuickLoginOtp);
  startOtpResendCooldown('quicklogin', 'qlResendArea', 30, 'sendQuickLoginOtp');
 } catch(err){
  alert('❌ OTP भेजने में समस्या: '+err.message);
 }
 btn.disabled = false; btn.textContent = '📲 OTP भेजो';
}
async function verifyQuickLoginOtp(){
 const code = document.getElementById('qlOtpCode').value.trim();
 if(code.length!==6){ alert('❌ 6 अंकों का OTP डालो'); return; }
 if(!_quickConfirmation){ alert('❌ पहले OTP भेजो'); return; }
 let verifiedPhone;
 try{ const res = await _quickConfirmation.confirm(code); verifiedPhone = phoneFromFirebase(res.user.phoneNumber); }
 catch(e){ alert('❌ गलत OTP - दोबारा देखो'); return; }
 _quickConfirmation = null;
 currentUser = verifiedPhone;
 localStorage.setItem('psLastPhone', verifiedPhone);
 const existing = membersData.find(m => m.phone === verifiedPhone);
 if(existing){
  alert('✅ वापसी पर स्वागत है, '+esc(existing.name)+'! आप login हो गए।');
  goPage('community');
  return;
 }
 draftSet('phone', verifiedPhone);
 alert('ℹ️ यह number अभी तक registered नहीं है — नीचे नया registration form भरो, phone already verified है तो OTP दोबारा नहीं माँगेगा।');
 renderApp();
}
async function sendRegOtp(){
 const phone = fmtPhone(draftGet('phone'));
 if(phone.length!==10){ alert('❌ सही 10 अंकों का Mobile Number भरो'); return; }
 if((siteMeta.blocked||[]).includes(phone)){ alert('🚫 यह number block है। Admin से contact: '+CONTACT_PHONE); return; }
 const btn = document.getElementById('regOtpSendBtn');
 btn.disabled = true; btn.textContent = '📲 OTP भेज रहे हैं...';
 try{
  _regConfirmation = await auth.signInWithPhoneNumber('+91'+phone, ensureRegRecaptcha());
  document.getElementById('regOtpBox').classList.remove('hidden');
  tryWebOtpAutofill();
  startOtpResendCooldown('reg', 'regResendArea', 30, 'sendRegOtp');
 } catch(err){
  alert('❌ OTP भेजने में समस्या: '+err.message);
 }
 btn.disabled = false; btn.textContent = '📲 OTP भेजो';
}
async function verifyRegOtp(){
 const code = document.getElementById('regOtpCode').value.trim();
 if(code.length!==6){ alert('❌ 6 अंकों का OTP डालो'); return; }
 if(!_regConfirmation){ alert('❌ पहले OTP भेजो'); return; }
 let verifiedPhone;
 try{ const res = await _regConfirmation.confirm(code); verifiedPhone = phoneFromFirebase(res.user.phoneNumber); }
 catch(e){ alert('❌ गलत OTP - दोबारा देखो'); return; }
 _regConfirmation = null;
 currentUser = verifiedPhone; // Firebase का onAuthStateChanged थोड़ी देर से फायर होता है — यहीं तुरंत set कर दो ताकि आगे का redirect सही चले
 localStorage.setItem('psLastPhone', verifiedPhone); // अगली बार number auto-fill हो जाए
 const existing = membersData.find(m => m.phone === verifiedPhone);
 if(existing){
  draftClear(); regStep=0;
  alert('✅ वापसी पर स्वागत है, '+esc(existing.name)+'! आप पहले से registered हो — आपकी profile Community page पर मिलेगी।');
  goPage('community');
  return;
 }
 await submitSelfRegistration();
}
async function submitSelfRegistration(){
 stepSaveCurrent();
 const d = {};
 MEMBER_FIELDS.forEach(f => { d[f[0]] = draftGet(f[0]) || ''; });
 d.name=fmtName(d.name); d.surname=fmtName(d.surname);
 d.home_village=fmtName(d.home_village); d.present_city=fmtName(d.present_city);
 d.phone = fmtPhone(d.phone) || currentUser;
 if(!d.name || !d.surname){ alert('❌ Name और Surname दोनों भरो'); return; }
 if(!d.phone){ alert('❌ Mobile Number जरूरी है'); return; }
 if(membersData.find(m => m.phone === d.phone)){ alert('❌ आप पहले से registered हो!'); return; }
 d.status='pending'; d.createdAt=today(); d.phoneVerified=true;
 busy(true);
 await db.collection('members').add(d);
 busy(false);
 draftClear(); regStep=0; _regConfirmation=null;
 alert('✅ स्वागत है, '+fmtName(d.name)+'!\\n\\nआप समुदाय में जुड़ गए हैं। admin approval के बाद आपका profile live हो जाएगा।');
 goPage('community');
}
// ---- Reference से Register (बिना OTP) — server-side Cloud Function check karta hai ki koi member
// pehle se yeh phone pre-approve kar chuka hai; agar haan to seedha login (custom token), warna pending ----
async function submitReferenceRegister(){
 stepSaveCurrent();
 const d = {};
 MEMBER_FIELDS.forEach(f => { d[f[0]] = draftGet(f[0]) || ''; });
 d.name=fmtName(d.name); d.surname=fmtName(d.surname);
 d.home_village=fmtName(d.home_village); d.present_city=fmtName(d.present_city);
 d.phone = fmtPhone(d.phone);
 if(!d.name || !d.surname){ alert('❌ Name और Surname दोनों भरो'); return; }
 if(d.phone.length!==10){ alert('❌ सही 10 अंकों का Mobile Number भरो'); return; }
 if(membersData.find(m => m.phone === d.phone)){ alert('❌ यह number पहले से registered है!'); return; }
 const btn = document.getElementById('refRegSubmitBtn');
 if(btn){ btn.disabled = true; btn.textContent = '⏳ भेज रहे हैं...'; }
 busy(true);
 try{
  const resp = await fetch(REFERENCE_REGISTER_URL, {
   method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(d)
  });
  const out = await resp.json().catch(()=>({}));
  busy(false);
  if(!resp.ok){
   alert('❌ '+(out.error==='already_registered' ? 'यह number पहले से registered है!' : 'कुछ गड़बड़ हुई, दोबारा try करो।'));
   if(btn){ btn.disabled=false; btn.textContent='✅ Submit करो (बिना OTP)'; }
   return;
  }
  draftClear(); regStep=0; showRegModeChooser=true; _regConfirmation=null;
  localStorage.setItem('psLastPhone', d.phone);
  if(out.approved && out.token){
   await auth.signInWithCustomToken(out.token);
   currentUser = d.phone; // Firebase का onAuthStateChanged थोड़ी देर से फायर होता है — यहीं तुरंत set कर दो ताकि आगे का redirect सही चले
   alert('✅ स्वागत है, '+fmtName(d.name)+'! आपको approve कर दिया गया है — आप तुरंत जुड़ गए हो।');
   goPage('community');
  } else {
   alert('✅ स्वागत है, '+fmtName(d.name)+'!\\n\\nआपका request अभी Admin approval के waiting में है।');
   goPage('home');
  }
 } catch(e){
  busy(false);
  if(btn){ btn.disabled=false; btn.textContent='✅ Submit करो (बिना OTP)'; }
  alert('❌ Network error, दोबारा try करो: '+e.message);
 }
}
function buildDatalists(){
 const uniq = a => [...new Set(a.filter(v=>v&&v.trim()))].sort();
 const mk = (id, items) => '<datalist id="'+id+'">'+items.map(v=>'<option value="'+esc(v)+'">').join('')+'</datalist>';
 let box = document.getElementById('datalistBox');
 if(!box){ box=document.createElement('div'); box.id='datalistBox'; document.body.appendChild(box); }
 box.innerHTML = mk('dl_villages', uniq(membersData.map(m=>m.home_village)))+
  mk('dl_tehsils', uniq(membersData.flatMap(m=>[m.home_tehsil,m.present_tehsil])))+
  mk('dl_cities', uniq(membersData.map(m=>m.present_city)))+
  mk('dl_police', uniq(membersData.flatMap(m=>[m.home_police_station,m.present_police_station])));
}

// ================= AD SLOTS =================
function adBanner(idx){
 const ad = (siteMeta.ads && siteMeta.ads[idx]) || {};
 if(!ad.on || !ad.img) return '';
 const inner = '<img src="'+ad.img+'" class="w-full h-24 md:h-32 object-cover rounded-lg">';
 return '<div class="mb-6"><p class="text-[10px] text-gray-400 mb-1">Advertisement / विज्ञापन</p>'+
  (ad.link ? '<a href="'+esc(ad.link)+'" target="_blank">'+inner+'</a>' : inner)+'</div>';
}

// ================= SEARCH SYNONYMS/SHORTCUTS — लोग जो भी छोटा/टूटा-फूटा टाइप करें, सही चीज़ मिल जाए =================
const SEARCH_SYNONYMS = {
 'dr':'doctor', 'doc':'doctor', 'adv':'advocate lawyer', 'lawyer':'advocate legal',
 'ca':'accountant', 'cs':'accountant', 'eng':'engineer', 'engg':'engineer',
 'govt':'government', 'sarkari':'government job', 'kisan':'farmer agriculture',
 'elec':'electrician electronics', 'electric':'electrician electronics',
 'plum':'plumber', 'carp':'carpenter', 'mistri':'mason carpenter',
 'raj':'mason', 'darji':'tailor', 'nai':'barber salon',
 'cook':'cook caterer restaurant food', 'catering':'cook caterer food',
 'med':'medical pharmacy', 'medicine':'medical pharmacy', 'pharma':'medical pharmacy',
 'mobile':'mobile electronics', 'phone':'mobile electronics',
 'photo':'photographer', 'video':'videographer', 'camera':'photographer videographer',
 'comp':'computer it', 'computer':'computer it', 'it':'computer it work',
 'gym':'fitness gym trainer', 'fitness':'gym fitness trainer',
 'property':'property dealer real estate', 'dealer':'property dealer',
 'kirana':'kirana general store', 'grocery':'kirana general store',
 'sabji':'vegetable fruit sabji', 'fruit':'sabji fruit vendor',
 'jewel':'jewellery jeweller', 'sona':'jewellery jeweller',
 'cloth':'textiles garments cloth', 'kapda':'textiles garments cloth',
 'shoe':'footwear', 'chappal':'footwear',
 'weld':'welder fabricator', 'tent':'tent house event',
 'dairy':'dairy milk', 'doodh':'dairy milk',
 'restaurant':'restaurant food hotel', 'hotel':'restaurant food hotel',
 'legal':'legal advocate ca consultant', 'consultant':'legal consultant',
 'teacher':'teacher coaching education', 'coach':'coaching teacher education tuition',
 'tuition':'teacher coaching education', 'school':'teacher education coaching',
 'transport':'transport logistics driver', 'logistics':'transport logistics',
 'construction':'construction builder', 'builder':'construction builder real estate',
 'beauty':'beauty salon', 'parlour':'beauty salon', 'salon':'beauty salon',
 'import':'import export trading', 'export':'import export trading',
 'factory':'manufacturing factory', 'manufacturing':'manufacturing factory',
 'auto':'automobile garage', 'garage':'automobile garage', 'mechanic':'automobile garage',
 'tractor':'tractor machinery', 'machine':'tractor machinery',
 'paint':'painter', 'farm':'farmer agriculture किसान',
 // ---- रोज़मर्रा की ज़रूरत/तकलीफ़ बोलने पर सही business मिले (जैसे "bhukh lagi" → खाना/restaurant) ----
 'bhukh':'food restaurant hotel caterer khana', 'bhookh':'food restaurant hotel caterer khana',
 'khana':'food restaurant hotel caterer', 'nashta':'restaurant hotel food', 'bhoj':'caterer food restaurant',
 'pyaas':'water cold drink', 'pani':'water',
 'bimar':'doctor medical hospital clinic', 'ilaj':'doctor medical hospital clinic', 'dawai':'medical pharmacy doctor',
 'ghar banwana':'construction builder', 'makan banwana':'construction builder',
 'naukri':'job government employment', 'kaam chahiye':'job employment',
 'paisa chahiye':'loan finance banking', 'loan':'loan finance banking', 'udhar':'loan finance banking',
 'padhna':'teacher coaching education tuition', 'padhai':'teacher coaching education tuition',
 'safai':'cleaning housekeeping', 'rishta':'shaadi marriage matrimony vivah', 'shaadi karni':'shaadi marriage matrimony',
 'ghumna':'travel tour transport', 'yatra':'travel tour transport',
 'xerox':'printing xerox stationery', 'print':'printing xerox stationery'
};
function expandSynonyms(q){
 let extra = '';
 Object.keys(SEARCH_SYNONYMS).forEach(k=>{ if(q.includes(k)) extra += ' '+SEARCH_SYNONYMS[k]; });
 return q + extra;
}

// ================= "आपको कौन चाहिए?" — Business/Profession टाइप-सर्च (व्यापार + पेशा दोनों merge) =================
function whomBoxHTML(){
 let h = '<div class="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6 mb-6 text-center">';
 h += '<p class="text-2xl font-bold mb-1">🔍 आपको कौन चाहिए? / Whom do you need?</p>';
 h += '<p class="text-orange-100 mb-4">टाइप करो (जैसे: Dr, Electrician...) या तीर 🔽 दबाकर पूरी list देखो</p>';
 h += '<input type="text" list="dl_whomTypes" id="whomInput" oninput="doWhomSearch(this.value)" value="'+esc(whomQuery)+'" placeholder="जैसे: Doctor, Electrician, वकील..." class="w-full max-w-md mx-auto block px-4 py-3 rounded-lg text-gray-800 font-bold">';
 h += '<datalist id="dl_whomTypes">'+BUSINESS_TYPES.map(o=>'<option value="'+esc(o)+'">').join('')+'</datalist>';
 h += '<div id="whomResults" class="mt-4">'+whomResultsHTML()+'</div>';
 h += '</div>';
 return h;
}
function whomResultsHTML(){
 if(!whomQuery.trim()) return '';
 const q = expandSynonyms(whomQuery.trim().toLowerCase());
 const qWords = q.split(/\s+/).filter(Boolean);
 const scored = allBusinesses().map(b=>{
  const hay = (b.type+' '+b.name+' '+b.owner).toLowerCase();
  let score = 0;
  if(hay.includes(q)) score += 10;
  qWords.forEach(w=>{ if(hay.includes(w)) score += 1; });
  return {b, score};
 }).filter(x=>x.score>0).sort((a,b)=>(b.b.promoted?1:0)-(a.b.promoted?1:0) || b.score-a.score).slice(0,10);
 if(!scored.length) return '<p class="text-white text-sm">कोई match नहीं मिला</p>';
 return '<div class="flex gap-3 overflow-x-auto pb-2 noscroll justify-start md:justify-center">'+scored.map(x=>bizMiniCard(x.b)).join('')+'</div>';
}
function doWhomSearch(v){ whomQuery=v; const el=document.getElementById('whomResults'); if(el) el.innerHTML=whomResultsHTML(); }

// ================= गाँव/तहसील (guest भी बिना OTP/register भर सके — हमें community के फैलाव का अंदाज़ा मिले) =================
let vlOutsideMP = false;
function setVLOutsideMP(v){ vlOutsideMP = (v === 'OUTSIDE_MP'); renderApp(); }
function villageLeadBoxHTML(){
 if(localStorage.getItem('psim_village_lead_done')==='true') return '';
 let h = '<div class="bg-white border-2 border-teal-400 rounded-xl shadow-lg p-5 mb-4">'+
  '<p class="font-bold text-teal-800 mb-3">'+(!vlOutsideMP?'<span onclick="setVLOutsideMP(\'OUTSIDE_MP\')" class="text-xs bg-teal-100 hover:bg-teal-200 text-teal-700 px-2 py-0.5 rounded-full cursor-pointer mr-2 font-normal align-middle">🌍 MP से बाहर?</span>':'')+'📍 आपका गाँव/तहसील कौन सा है?</p>'+
  '<div class="grid grid-cols-1 md:grid-cols-4 gap-2">';
 if(vlOutsideMP){
  h += '<select id="vl_district" onchange="setVLOutsideMP(this.value)" class="px-3 py-2 border-2 rounded"><option value="OUTSIDE_MP" selected>🌍 MP से बाहर / Outside MP</option>'+MP_DISTRICTS.map(d=>'<option>'+d+'</option>').join('')+'</select>'+
  '<input id="vl_state" list="dl_vlstates" placeholder="राज्य / State खोजो..." class="px-3 py-2 border-2 rounded md:col-span-2">'+
  '<datalist id="dl_vlstates">'+STATES.filter(s=>s!=='Madhya Pradesh').map(s=>'<option value="'+esc(s)+'">').join('')+'</datalist>'+
  '<button onclick="submitVillageLead()" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-bold">✅ बताओ</button>'+
  '<textarea id="vl_notes" rows="2" placeholder="और details बताओ (शहर, इलाका, कुछ भी...)" class="px-3 py-2 border-2 rounded md:col-span-4"></textarea>';
 } else {
  h += '<div><input id="vl_village" list="dl_villages" oninput="vlAutofillHi(\'village\')" placeholder="गाँव / Village" class="px-3 py-2 border-2 rounded w-full">'+
  '<input type="hidden" id="vl_village_hi"><p id="vl_village_hi_hint" class="text-[10px] text-teal-600 mt-0.5 hidden"></p></div>'+
  '<div><input id="vl_tehsil" list="dl_tehsils" oninput="vlAutofillHi(\'tehsil\')" placeholder="तहसील / Tehsil" class="px-3 py-2 border-2 rounded w-full">'+
  '<input type="hidden" id="vl_tehsil_hi"><p id="vl_tehsil_hi_hint" class="text-[10px] text-teal-600 mt-0.5 hidden"></p></div>'+
  '<select id="vl_district" onchange="setVLOutsideMP(this.value)" class="px-3 py-2 border-2 rounded"><option value="">जिला / District</option><option value="OUTSIDE_MP">🌍 MP से बाहर / Outside MP</option>'+MP_DISTRICTS.map(d=>'<option>'+d+'</option>').join('')+'</select>'+
  '<button onclick="submitVillageLead()" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-bold">✅ बताओ</button>';
 }
 h += '</div></div>';
 return h;
}
function vlAutofillHi(field){
 const inp = document.getElementById('vl_'+field);
 const hiddenHi = document.getElementById('vl_'+field+'_hi');
 const hint = document.getElementById('vl_'+field+'_hi_hint');
 if(!inp || !hiddenHi || !hint) return;
 const hi = translitLookup(inp.value, 'en2hi');
 if(hi){ hiddenHi.value = hi; hint.textContent = '✓ '+hi; hint.classList.remove('hidden'); }
 else { hiddenHi.value = ''; hint.classList.add('hidden'); }
}
async function submitVillageLead(){
 if(vlOutsideMP){
  const state = document.getElementById('vl_state').value.trim();
  const notes = document.getElementById('vl_notes').value.trim();
  if(!state){ alert('❌ राज्य खोजकर चुनो'); return; }
  busy(true);
  await db.collection('village_leads').add({ village:'', tehsil:'', district:'MP से बाहर', state, notes, createdAt: today() });
  busy(false);
  localStorage.setItem('psim_village_lead_done', 'true');
  alert('✅ धन्यवाद! जानकारी मिल गई।');
  vlOutsideMP = false;
  renderApp();
  return;
 }
 const village = fmtName(document.getElementById('vl_village').value);
 const village_hi = document.getElementById('vl_village_hi').value;
 const tehsil = fmtName(document.getElementById('vl_tehsil').value);
 const tehsil_hi = document.getElementById('vl_tehsil_hi').value;
 const district = document.getElementById('vl_district').value;
 if(!village && !tehsil && !district){ alert('❌ गाँव, तहसील या जिला में से कम से कम एक भरो'); return; }
 busy(true);
 await db.collection('village_leads').add({ village, village_hi, tehsil, tehsil_hi, district, createdAt: today() });
 busy(false);
 localStorage.setItem('psim_village_lead_done', 'true');
 alert('✅ धन्यवाद! जानकारी मिल गई।');
 renderApp();
}

// ================= HOME =================
function portalTile(p){
 const locked = LOCKED_PAGES.includes(p[0]);
 const ring = locked ? 'ring-2 ring-offset-1 ring-amber-400' : 'ring-2 ring-offset-1 ring-emerald-400';
 const badge = locked ?
  '<span class="absolute top-1.5 right-1.5 bg-slate-900 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-400">🔒</span>' :
  '<span class="absolute top-1.5 right-1.5 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">🔓</span>';
 return '<div class="relative bg-gradient-to-br from-'+p[1]+'-500 to-'+p[1]+'-600 text-white rounded-2xl p-3 md:p-4 text-center cursor-pointer shadow-md hover:shadow-2xl transform hover:scale-105 transition-all '+ring+'" onclick="goPage(\''+p[0]+'\')">'+badge+'<div class="h-10 w-10 md:h-12 md:w-12 mx-auto mb-1.5 rounded-full bg-white/25 flex items-center justify-center text-xl md:text-2xl">'+p[2]+'</div><p class="font-bold text-[11px] md:text-xs leading-tight">'+p[3]+'</p><p class="text-[9px] md:text-[10px] mt-1 text-'+p[1]+'-100">'+p[4]+'</p></div>';
}
function promoBizCardHTML(b){
 return '<div onclick="openBiz(\''+b.id+'\')" class="w-60 shrink-0 rounded-2xl overflow-hidden shadow-xl cursor-pointer transform hover:scale-105 transition-all border-2 border-amber-500" style="background:linear-gradient(160deg,#FFF3C4,#F5B92B);">'+
  (b.pic?'<img src="'+b.pic+'" class="w-full h-28 object-cover">':'<div class="w-full h-20 flex items-center justify-center text-4xl">🏪</div>')+
  '<div class="p-3"><span class="inline-block bg-white/80 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">🚀 BUSINESS</span>'+
  '<p class="font-bold text-amber-950 text-sm truncate">'+esc(b.name)+'</p><p class="text-[11px] text-amber-900 truncate">'+esc(b.type)+'</p></div></div>';
}
function promoOlxCardHTML(o){
 return '<div onclick="goPage(\'olditems\')" class="w-60 shrink-0 rounded-2xl overflow-hidden shadow-xl cursor-pointer transform hover:scale-105 transition-all border-2 border-amber-500" style="background:linear-gradient(160deg,#FFF3C4,#F5B92B);">'+
  (o.pic?'<img src="'+o.pic+'" class="w-full h-28 object-cover">':'<div class="w-full h-20 flex items-center justify-center text-4xl">🛒</div>')+
  '<div class="p-3"><span class="inline-block bg-white/80 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">🚀 OLX</span>'+
  '<p class="font-bold text-amber-950 text-sm truncate">'+esc(o.title)+'</p><p class="text-sm font-bold text-amber-900">₹'+esc(o.price)+'</p></div></div>';
}
function promotedCarouselHTML(){
 const promoBiz = allBusinesses().filter(b => b.promoted);
 const promoItems = activeOldItems().filter(o => o.promoted);
 let combined = promoBiz.map(b => ({kind:'biz', d:b})).concat(promoItems.map(o => ({kind:'olx', d:o})));
 if(!combined.length) return '';
 combined = combined.sort(() => Math.random()-0.5);
 const cards = combined.map(e => e.kind==='biz' ? promoBizCardHTML(e.d) : promoOlxCardHTML(e.d)).join('');
 return '<div class="mb-6"><h3 class="text-lg md:text-xl font-bold mb-3 flex items-center gap-2"><span>🌟</span><span>Featured — पाटीदार बंधुओं की खास पेशकश</span></h3>'+
  '<div class="flex gap-4 overflow-x-auto pb-3 noscroll">'+cards+'</div></div>';
}
function renderHome(){
 let h = '';
 const activeSOSHome = activeBloodSOS();
 if(activeSOSHome.length){
  h += '<div class="bg-red-600 text-white rounded-xl shadow-lg p-4 mb-5 cursor-pointer animate-pulse" onclick="goPage(\'blood\')"><p class="font-bold text-center">🆘 URGENT: '+activeSOSHome.map(s=>esc(s.bloodGroup)).join(', ')+' Blood चाहिए — '+activeSOSHome.length+' active request'+(activeSOSHome.length>1?'s':'')+' — यहाँ click करो 👆</p></div>';
 }
 const recentObit = recentObituaries(14);
 if(recentObit.length){
  h += '<div class="bg-gray-800 text-white rounded-xl shadow-lg p-4 mb-5 cursor-pointer" onclick="goPage(\'obituaries\')"><p class="font-bold text-center">🕯️ शोक समाचार — '+recentObit.map(o=>esc(o.name)).join(', ')+' — श्रद्धांजलि के लिए यहाँ click करो</p></div>';
 }
 h += '<div class="text-center mb-5"><h2 class="text-3xl md:text-5xl font-bold">🙏 पाटीदार परिवार में आपका स्वागत है</h2><p class="text-lg text-gray-500">Welcome to Patidar Family</p></div>';
 h += patidarAIHomeHeroHTML();
 h += promotedCarouselHTML();
 if(!currentUser){
  h += '<div class="grid grid-cols-4 gap-3 mb-2">';
  h += '<div class="col-span-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl p-6 md:p-8 text-center cursor-pointer shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all flex items-center justify-center" onclick="startRegister()"><p class="text-xl md:text-3xl font-bold">📝 Register Now</p></div>';
  h += '<div class="col-span-1 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl p-3 md:p-6 text-center cursor-pointer shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all flex items-center justify-center" onclick="toggleQuickLoginBox()"><p class="text-xs md:text-lg font-bold">🔑 Already Member</p></div>';
  h += '</div>';
  if(showQuickLoginBox) h += quickLoginBoxHTML();
  h += '<p class="text-center text-gray-300 text-xs mb-4">•</p>';
  h += villageLeadBoxHTML();
 }
 h += '<div class="bg-gradient-to-r from-blue-900 via-indigo-800 to-orange-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6"><div class="flex flex-col md:flex-row items-center gap-5 md:gap-8"><img src="data:image/webp;base64,UklGRoIgAABXRUJQVlA4IHYgAAAwjQCdASrVABgBPjEYiUOiIaETmZV8IAMEsrdwuJiEDA/pvWNzn5V/Oflv7NHKvcV828ZcNJZXl/dKf8L7xvnX6Y/7D5sXTj8yH7hfs77snpC/tHqAf2L/YdcD+5PsO+XV+7Hw0f17/o/uR7WmqPzIOP/67w1/Ivqf83/d/2s5i3nv9P/2PQ3+X/gr85+af5jfOn/O8wfWP6in5h/Tv85+UnIwzd+pB3T/w35Tf5b9zPc5/svyk9+fsn/xPcE/nn9d/yX9q/dD/De075LPnH6yfgB9iH9P/s3+q/yP7Uf1z5G/+L/Kfu57SPp3/n/6X90P8j9h38p/oX+Z/t/+X/4/+D////V+7v2Sfu17J/6xff+ZxE4TCUwkmKEThGXjEvxokqkEThL1K/2jO1PCP/GmUFU3UpLC5C5w2EghmlMIYO+s9U9N/UeGvoDUyKgH6DjhiQneTT8qUWEXEd3DoH7hVmS/OrX/QLuiBGIj9JfLQabbz0kxOyhBgtgwX1CTQbFXrDjWHYXVWxpp8hbaGv8q4TO/r0wn/VyMhYJC0rpEmwFQ+i9+yXM0VqDQTePz2SFT0R6XwDJzfOmRTz/O/aYRfEspVIHkPFJhpA/EnUj2auDXEHxABhJifyLnxCnQMgU99yQoJ7rI/pyTODnpu419TJtarp3Cyf3q/t55qS0Bvuaji2UUsAQdv1gMwbcDEh9F8FG37hVHH+wJguswrxxxJ4prhTFpSMPSelEjlInpZUirSMQqGOg/n/k3gOmrKU8QAF92e3Vq0uPq7W2jwqSbblNVAvEZktriySl3iliT/cy9sCi3XuQBxs6rfDmTlzB+zT0kxOzPUz2qFhUJ/tV5gKzZiwbikOrvbuC+P4cSbD8zWiw+3sbgHCpRB2Nppwklpp6CRr7PO1wWVglv3TxjwSXcyyHqZ74aR7Smx1t8Yki47FCVit/JfRaMOQ6wkDPLaSvur1MUjiMaf96XDE4bi0uYYPSebcAv0MB34RThCOZp8r+xjiuASgzkyv+5BQ1f0qG1O8G8ftgrJELzQl9tOrHwX2vJQ9GACrvTsNXmh9Ibts998q7V19UTnJ6epEYD569RnXIzvLQNTZSf9oCrZXMXtfJ73b8i8Jd/sExfhfJWiBBTp1eZmWRazKeOJ5OUfVmUsyy0zqVlGJLZ45lJ2cP0XQcUA9y8tcAX3TWIp3CL70ki88CGYo2Ey04cuXjLk2vNEMDa8A2aQfPtbcbhxGC2MATmUfI908rRg4irNZmBH8vaSYCE/nCgCcCiv8k6bf0OyGb74ykKs4Y7jTSOb4LVeA75EwJGS0ey3Xpgp6UyJGdjLcZlpfZU+6VxBzjqei+H+ZZIQjpbxc8fJ01pchPOHeQffYPQM2414673vKzdnvOofjnM6eV7SbvIr5NoV8Y8sUxRec1Z4+8WHrKx1fWPE54wf40iVdWtjvdM8q6ET8wT8m1y82lVvNBXRxboetYovHrPdv66wVWT/tuseUxDC184edSLOzic2AsvaEgAAP7/xYYAKZdk71b7nhKOYBsxNug4tJj/eNWX8C9QA/+jjQTKlIMZqXN5wY88QA/CqUZqdRwfLBWslM5M+GpGZN1GFkb5p373b5NhCwiLrq7SQHvl18fjxtfoVfNRwmo83xVYT7FM1LImMBY5ay+xfY58yWhILXVFuypQdnCLWapvv/iOv83VVXdH6E+gu19UWt0/yyC2hoRiHAnb3V8PHs4f6FLkuASVuCXUI4dP/dpCR+fItXAOLzMGKCHkJqLczfHahFGIbIO6HzAkEE0mqHibPtTOTE605xHI1jZOhBNjw+Gd1AtkBZjWPaqBOmJbIFUm6HEqHbSt20mMu1CmHFh+meI4Wl6XKwWRhOb6rC2EIWeF/Fc3bccFdZ4+Wvql2PhymNePI8E0MTgXoqdYfFKRH09HiCPU2fzxOLbO+yn9OJdQvkQosBetC8w9l4B3srrqVzK7KkD9K8OcTAAFpaBapyBws75Q9NVaacRX2bxPD6v/YYUYWgoesd1gA8J3BPGhE00o/aKbjoMuxg8e6PQLiKFuh4dCufOvTyHPgkHVIKeDyVK5iYxs3HfUXmSkaWXlunB0AcOu/YEb1Gan+f0s/a6z/LjQJvPjUqVgCKnfz5KjQxyzBRheYWU7hzoRIpaTL2b3HdTjkr/hWHHigjQFE7xuSBVjk1XCgHUovoqjlpmn+r3nDtLWdXJyLJqENObGv/fAANJzxQBizMV8TpnucspD92wrYvT1NIB8biYssESGbOc3ORr0CwjIib05QbaWrUNMARCsRH81qohgXS8N849Z1y3LB0p4Tv/RYnejlbwRtM8621di8ZJNN1lkKO0j9+2oUeKBODIVovOSTBIrUKrtwoEfBuUqkGJ4v/AwLqTmxOcbE+qpm7MpNGBrSN8pumihWThGK28hor/bMzqOgs6eLandy0LaNfwsgU96zHl9cydOV4vlsEUepJIKCwxb9oaf+FDATuqKIsFNOaNekCt/JBTuUKNoJNL24azuCIw/v0uF2c91gS04uYcVwyhZlHBYCiN00S8oc37BRKTITjAsHL4xq/n5h+ZOcmVYkvSxlXvB8G/oS8ilcKhluUthD2vamtFxkHJ3NejMXNUxclbHF3z/4AfdR7teDz1VNxjAAK5rjpvr10ql5nXHkj5+3M0pTLzxVmkwoKgxJ7IIuRjRAL0BthF8ozmpblG5BuRMnzDYKjBPqlp8kch53vjrI9BsF2IfCdPLGyKbJ6dV8Hf3xMcJ4Y4pftb70n/fTVHv3SOqDrbRy7GmXTh9+MOMnhsOovBFsiFfwxpcMv1PUgzzh2l7NOE+toysE/0L5LamfLWrMXckBZmFJ5+RBahfJkTUR/gnE/xX4lRmia16YwB+dzSs6NBOz8LVXtTkUcBre1zj+Eg7jMsBZVqY0T9oVisdPRTCydvVeihYwFEsp+cCe3WZujAzAoOpOlvTdSgNYoQhB30iRt63dmFEQfO6L8oo/WBPe5F92zQVKuaad99y6wJEdbLM1ahggUIK6DBqIabaHoOJZuzdDIldvlAA7UF1A+XLPK/zG25QC3APuXGNnqk8i0ZH5kpjPP5xJ7iVXRC4SKachZOd7PzmiFMlKHLZ/kHscizwKFJYqrkeYX9aeaaSxSIYtelszlwNmQMOxshdFIIbNwZZH7xieVtJz4MMdUOe9s2X8OpZBmPEJRmx/57q6qPRqp5zaxqEcTRh0axn756BX5+GaChJ9rDAU4fD9xTQtlSHNyiUuRyoKQbKVbAolau/upk9NcFTwyiBLAD1HlUSZIJQPSeyIQ5Zm8CDhAzDCs+lO16ug0+0oCTOdPcddVR/j3Kj3O5MFm5Dva8DkvYP4tyGDglFOQc5SpzF6Zwq9NEO/paMlXBgj81aWbbGhlV2KNOu1RvxBWAkK7Y+0by0xR2HBZCMygOY7oE/VIHl8jGgjmHBbqrUqTsQOzjjLe5Bm7xIzX2AiXLIB4YB2KykhQqHyAboZ+3jOxfaIsgQ1Kb3fKrMBareO6Ez55AgaFlDviKATtHXNQDuhbRGuv3KDMaS+1aFUq6bgZP6NrlKund7TPi3B/Ap0V+ydIoe8up8XK+J95yoitB0aJ4A0xAtlgqimVcwz1+58jyrX+8p3KmDhHCBJUVbCjQ149hUL2Iho8E02SN+3AuDt85/skNKUEMGUX1zdEfWjSwDcdHP7x3Fi5+ik+UuWEfCI6eRblOIAgeXtNzJXgAd270XrSR8AhSYyqc/bHq0ZU9Ew49mXE78Rjm41SvzMmbE5p8hWkA3HFHH/n5IXokSIprFlEjsVmCHBBXxw6/PxyKQUm+p5Id7wUjLUV0Vw/5P7q48vQS8ylT2bJhQsi9DIDORyOdT3xmC4zLxr3+UIfrYk556qDy0Hx/pRDu5BIjJ0IDXr22vxXJhzjkWiBTK6le+2f2OKQaCuvqfpMb/Un0Bxy53HEggLmAaf8JK8zdwbo+rhsMJGdAqeuzuN5msGjxLCVu5W0V8trAyBaswj5b56N92bi/2Q8AQB4aj8q7TOBfeoURCcrYOXbDXjDoVeAxzKZfwUfFVGvqpwf/w6JUrGDv1RhCB+03hyTUqzDxH76mbTPjsEAd4KHZ+CBCzmRs8bP/KbH7kYdDJVtLDADkULRfk5LidZDu0upoP3J8vYqqv6iHJIDqXlc0W2F7IEgGQ/OqhiualUBjNVhs2rrNGtpGKPCPb1qpeTz73oBHcy3GohpO7VaduE5W5+ib/dJQ5pjyvdo4gqz3SD+GAy7HTTEf4Jht1VXI0vV0xmtoXP6crA1+QzGLp/I9Cl+oXUhpQgzef+Foa9cID/H/CCKgD7uiT91/P/j5Zd+zLzqaRFt/QiMueU4QbpVUnvyZohe3edQ4ERg6ahtXEckl5lqhJrDQzVaX13ohy71Y3rcz6D2cdYChj5aGbQ6g61WWfTl8NEGDPFbu7MiDwkiDtYRP267T2a8YxvaSjv2WjmgWOx87cAtNRPIF4S4VfRVR4rEQPnKRMpuoCiU/suoX4EnOLZXpV2pEYmVNM9fCMzPwoKwp41DSlS3Qoi9E5Rd4BjLaT26Gs3cXHo2HI8GWLNKf1NiplOtj6Ggwxp1d3guQs5vu0/GMkcvWPzKAdRUNNra9mDwu6VWb9JoBVfoOT72n2p8V8yL62FNkTluu/COpU1ndptu6rqDrZnIVJRfvHnkexEdeM9N/xKYoljPmSkJk/n5QO7WEsN7A/dz/qYXpeYsy3zuNxpGv/kCHr2ZsrdhV+UG6FKfeKcj1FzDTeRBN6dmcpaJ25+o0f2thHezpWwjzfPDZK6rfWJ0hPlNNdBbtZV6HR+ZlRLPSJPlujZLC1oWBRR0UftpeV8RN7Xa4E0Sb6rXIniqyi5fuOLMRWmTaINZrKvoZL+zGN8sFqtlbc2YRdpoQxk3+h65M8y9YWG3RN1G5A3AMCheDblV02/U4M/x/UGI9tHy2QLPSFF8Wom8VmIdCJ+oRwdbVJkkPD1KH3X+fdvoQcARmBLinNvpBCRMt2d/CnHufzCK0rjdQxDoZovG8zYRX5hJJKEM7YQnI0HP4h/6y033j3XC51Oh4TSoiNRVPE35ju5I10ggAd++XGSV9XaNIO7WMRQXdLucHg6zm5Qoz0L1waIGuLiGH+pLVXyd0TlpmJ09zNK8lpiOZ6Esai0JhsvWoOmDd8SVgeO0uClezn/XrThAiM7CUj8YcvVNQDf4SHzMzuCUu0r9GLlibTr3NK4SjyViHWBatXbsWxqk5bXU4cXRvloAiXL6DO4R1Vo5Gybc71ufMtpt9nHhMIqu4ax/42zk0r4Ly3RoxR5SkNWCwOPoIjFiQ0Je2DX+AiLTvN0lXLDdu+4OF0qhMQQ4SJJn7ku3zUjiWh6JCEO0REUaLU99cbI+QIEiCrZGwJ/wS4vEcdWU7KzQGCaXNrbT1NSpEsBD6f1YY789Ov5OA1g75x90/yO8a/gGt3qJyqLyk0zgfqhr3Czasy1wGM6WXzVL1967GAOC6ZGoGP0zyXOQy8ZzVIK4DfvtbP+QVblBA1zangRv/MoFONStiWrsS4mx+3+9hq3pGpaFNH+Icvm23A2GKYFpb/AiSX7qO4vABhcXAYNqqRuKl//VK+cWfeo02bg4qAZh+z51xBlvczEeiyM9XmR3GmnQyvP6TJP8V5xzQYMMJLjSRWMwF/2kH+M8oJJP0k8Zk4pvgeVfswnw2KGqY8BF6xi5t+fNK3ZBkey1YCVcX7BDYl2joYT9XcJlP1XptHhqpHP1zUxDWUKF9gZDe6c97XqqEOComWSZMVa4U4FoDuxSHDHXIDM3dLpfR2icJlegoIT8KSuQMjB2/Qpzju0kz4wKpd84SjgD9H+g+FO7ADTIW/AFVgviJkPaU0d+5rl8CosWgi+yAJfmuYRNMy3URy4KrcLlujRBSZbd6CavdguG6u6byoFTWAFwAzAWf0BBedFqVbwyrpuTksayGS4mGsA1OA07DnZJ6BBLmOIZk3f4EUmPhvQgWfcRU9xKn/InYK1cHDtM6O8DPvTozXI3WP2WSbYKObeX1qyEKDRjJNsOwci6V4iFLSLHvNuUBfGUzycZICSg5XXvC09kmkApgSXRd1ueIGUbKm/xTLV7QhbtRULc19JWZ6pdXG7KszIJtraOpTvw2zQiZHFmacNxKLA1KVGrVQy2JaBPEU+jmIl+sXJt0hKXbSFu0EYwPZbPWst0QpDyUNrrAxu8+MAzDN2zgks2FS6VXx0kEQ6YDX7RvbMTCQ0wW/ZutGu7AEMRRIlMVrKAHGQmJLxDZFpP3h7EDEBaHtdGd/ndKO/1Jgykimr3zdQlIlUGS4Iq1/mjq4PPnkYKbewPzTdp5f+DQWDNl2ka/UvoY6mZfR39VsLYjKAv+CopSp5Uabye+upmNLN+AUE03H4yDTzdIVafd4EmT+jQurfwCw00VXb4f/J36H8m9l82EToDj+4jVtBMss/57qiyhWz9JhHCo0tRritP/J8CfV7gKjhUJ1Z6rg+TlkGMIotdq8bUeaHFVxVOisRZOp0NsPDO6TTWaLVYijQDKALQNToCAHLi0Ny+Z+wAgESuF5Rp9kPnW2QuwKCnDoDAi5/zrrqs388glrhUv3qUN2hTO6GnHS+mcOU/wghzLdz6a5paZBmAzTYOdgJT2OAB2085LnwBK6BCy3fczYgmZLzZCMS/JvPDAISv6134btXblND/7egFmcenr+kdgsZFKwncP3weClBD2V2WIhrelJx4DKSIYcw5D92ga8HvtIgpRwNzbFrK7ycSllKGYYBORI2Y1oWCxBX+uQlN2E9qDk0QxwqZKHO1ne9rsBC3TSOwfKpsOO48kgJp+KT2tw7QtVw+UWVh/PV+iPGXzEZPlVhI8hgTPklBu6ar0sf2R5Im/ejGEMnZ5FJJzVpPkULiHOf/yqaHg/yUI9ZBU9d6q3AWSOpkE6G/ig5/0KBroLTuECrhvSZbPqu3clKrvZkDeSriAFA3K/EJxQsEH5OEahgA5N7u3t7qyvXznC38etGRrGbNJF2qdbhXe01ZxSIkofePdJQ2RnHWoHRr10+7kkoPi5ov+a8Jdvr3qJTWDFGk353acSqGIKFgcZrGo5FJEX80yHCVpAomft0el/1d9yvgxUVbIUVUId+PXMpzWdw22DHmSL6646p0hHyPkfGsM/ttl5WgIW6QgLHM1GLmd8E62Pnem1EKSUl4ld5/vIf/tslxx728QxDMpSZQMoGA6/USOZCRZKj2P5jEO3/QLMJ7ddCN0h0zcXyG9GEY21eX5jd5j2A8JAtY0KScST+QvZaj5P+1NV8wtVVqihrE7dr5AFNTvq4qcT8bbjAjQACHRv+xw5V/WKeLs2/dIWeX+xhq0i9Bjji8kqJom7tztKouSngmIdO68KAxHdez2Fho1pVxcNHVwlLApj+3FkyIWxvudfXPjwLYLHMmT6a853XP04df6YVTFgAPD/MRNt55acW0wOS1HGA9dvtdsZKjmxM1Bd72U/YgQERmJX7Scas8Kc0SV8++FCvN8W2/8uCehYlvpeAydpfA4TA4AiuoUvFnF1ILUjCkMWHEmKdGYg4BqfqidIgEZNL8dClZQ19Fj9lckScz7KvGvL3YeIzVQBCNkybTkA/gVBrzfAO3QJM3cgdALZtLY30PMT3EPC50drBEb1fXSfLXzKVEHngfXgLTlmpazJxTQixRShytzJphYklRPpp4bDDq9B5mkqvBJG1i9TUGMtWd79/KI0XPLpIRexBdq1G3OXW2qYb70QqbzFA1eKYlYKxDKuEnXHTPXoul/BF2O2ogWourGFJb1dxPKHEqswQZ1vCOK/7ahnt+kM3WQXU3jr5DEQZBUEM/p0VW+hcv3S4S2LK+6b68JYHx7W8wlQToQwRLmSP7LoGvg848Wx2fqiVX0QUvDq/NKscdfMc9y6lZ09qKAonmEm+zDdDr/UKox2sIzabW8flZsSNOLoUJ/NAKAqf7v03MseRaDIi1ADY3oeKIP/gHg/2e4/PmVlqmpWj5BeeY+bt/ivPP8Mz7WpVqMbHaL3F6UXsgafVwka0UuypYoGG0U+cnUwRra5lNMKy+cizsExDSsQDucM8oAMKi+TtT6lJaepNHVE4gUZGD7YP8f3mvwJPHgpYbR6ur6dpS0C7U3RilwkTp216HM7m6cvWp8bXEztZ69QyDtKfztJlesp0WdEXHXROvrCZKonNNPkCSpUrBAva/7oDlmSypEjnHfBog4v+b8hbAgs0E+UaTmaIyj70ZmOpI5LvcoI0SreSLiqZDWeb1Pi+NM7znQjiH4xoosKilznTW+e7YVy35lYplwF99vq1EP0xxeiwjZEKFyTSOYfTCbpaSnO9S8WhsfzvA4iaYRwK2PenLw8FnTJ70BBIq84/iaXBodNaTtzgrfjXjEnXXfjx2tibR0ttzPGaqoAE5ywewlcU1M185RK1VcVzujH3eknbPkNMF5A82uzYfrScBk8uijqBlwCLoie4NqER4B1Mk48RUUFK3eAXi6rdZw1MEt8HjqAJzrvChJSmpTNm3kZLOBecYaMdlmpAL88oRP1VpHQ5pqjlJ2BLB1T0zqxH/5nP/0PZHKHLV+MInFo1klingIeMWGTc5Pcos3B/lZI8F0UWoo+gm4jRuN4435fQ9x0op9j4TYdXSRpICRLYG8hxA/yReLcrdZeGDQKHzGAexlxEF/huGWRiq9tBPZdl5evTsNXF90XoVfUC3uWmK3C85sDevzUFBNPWVGLkNoL1kQR7luNktgPXlClSElqLa7RRNbdVWThcAbU6r+XIKXeSPTJA/k9Bo2hSoB56woeYjLI42jgBMdrb/ju18B/Qo2mxK4HA/X/gWA4IPqWcbVr9Qzr5OSStrv6VF4SI1lEchwl0F4e/KGEiMgBcKXxERhmxbIYSrpks/NbBqi0uj6d6JOWK68L4Pcio1Mxes3Y+uPpzbgg6ijo6XbjMfhh/DUGYg2ZERchUebDJt+2hDEYiGttVWy9IJDjTXymM/zoxFEIV6VV2q2T6z65mqQD4a0yOswMHWsEU84OaKPUixd+4YA3qMtrYvMFLqypKTmI+/paqPjBv4gz4pS8yLC5/Jll1EtMKmpXIEcYSeawRCrvD8xKKjNTTs4NRE2p2n8jOlUh5d/45JYIRK3YOf1LhWP5ZTaQCI4M2+rfW/BYDc69v26gxhrZ/0cND4o6qQA40R7PfeZkHQB86FlLIqgXrnl+87ZWAgm8BIabWqujosAKkNx5R2YRP2vICOqqkIGsc2n4xIRi4yHtp6R5dX1YfBGTchho2lXXoujfa/rKd4QThDMITy0Ct+UPS69n/vSfYOqZfXvRAaz+o2hlE8Nfxp7GvRLAozCPdVcZItIMShVVa3hSJITbHnp9uOSEpiYbbBt9I2Cb6QR3/ddClCO3EJBndMJ32KH/Hy5jM7Qpkrb240+R59rBkioye8rpdmtS6jqXHdWd7rMKJdAq66oTvc/3s9LUrCdeXwlk6wf+tU8kUtkQaHwnmw5x7Wnmw4XVudf9OWsXIBSO8mDV3IpYpm0L7EiJO538Eix/lh3ElseOogQA9+T3/41aJrEciY97NFN5IA6MTO+uhlcmAcIOFH/5JtUvrM15WI8xtZwE1MCaU6zt8pDNZi1T/9PP7j7NV4rZwds9uG+s3fvefz3tCHxAGOAone5n3Ecr1ZcuENT1Sp/v7VXIPqWDW6KNxXPnb1VOpceODiI+dxYDN2X5W0KotvHlf/QY7S7qlXhMCr1zVMV7dJj+UqPBhN5crx4TBiFbpN/eI/3Tl23BXDpZ67GNDeI/HL+RxmWoTbjx2xvKTYCBurohPNigFZP7/dncJBAU/1JTfkZuno4eRBDJzEAyyKNyOhfqhXabbsPy1yuFh31i2U3kjriE9Gnhq+/6CKxwTcFs9Y8FO/TJdYDVl3U+QHtpsNh2iYUKvWrOl5b+Bqc7jffwON6q7lMH96+C58nT3mx5KMrYwBoduGOK/dfX17HHxh0XECnpFUn5aLQoOPHZCnk1SdG1lSmJo0h7xLm/IYTTWx+Vcap20LuD+gz+Fb0q2ewNE1+UYgMB1yHQBwAlSntBmG5Kr+vN/+ORz/kbaJ83v6bj/Qa1mwWAeLlOOAJlg1v6wi34JAHfU1EZhOBvE9Dr979BjgmhToJcjFZSXmqaj+IyhGblNPTNqK1ub+CDthmFKosfO22r769sqV3uwi7OqLgAXkO4YUw37+8+chO+BSyHsmS9KaCW+ghIFpYuO+JFdgNttLeuVtoM7vTIgpgAGh5vOwaHzC9hjNN6ZmzqEnKJxprNgRcWhbn0C+cMMDO4A6Uc3ul3W6W/QqmYPvqo8JfGvHmuBO5ADkC9jADxV0r2JE7gzagHB0kUN5UyOO4OY4T4YFtxjKtpRxU6a/M6K2+6vHMae3+NeZRLxaNtBKuR4I9yEtG8JkDAJkX213GbwVlJFEIcxh6N5fQTjhgKICy85N/rF1wl7eD5QtU6rIpV8cDsSOEDQUvywT8gjraoJDtz5cYNi84ot8siyOqohQ/d66j/itfw3MiN6CnBoMlA8jD2cno40r4yen6/GcUBuwjBVVTqJftNQ094lMphuZfnIIXNZvElAS2c9fexoMP+d8v6Hwwd7BeQbC+vleL27OgJe84ZZZ/qL6vbLy3BeXr7XcH7/SNrRv9WTCCgGtSIaLlr45IJEu9k7TFRPPrOw4k4rH0JwlU/kQX6t6Hwtsxs8F4P+/aDTIh/yti7ccrWGu8vux2RhAykkN22Ap+XGEsCQhK4OmpZfIJyDoRufN0G7FEfutFdiZUyC6aXiGoELzAaMi2aaOjhxEC9dAswZ2b8XMpL8yUIeFvOLYM5k8aV/UOJqWC/e1p0KY3jv77n9H5hb5otlCvY388a5R2jtSjvtubdwUe0PoEzpiCJlMMfqs92ENif58ii8i4x93o3vk1mx7ZTP3tSdGFLNZITnxECj/io4+yXLJOjqCrWd8GmNEfK1bdyF3aC7Y3Q8W+tY7H5STQqBijZWgDEOhnVRB1pJ524P6a8QB9Clvv/2DF8ejran/cu+IAAAAA" class="h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-yellow-400 shadow-2xl object-cover flex-shrink-0"><div class="text-center md:text-left"><p class="text-xs md:text-sm uppercase tracking-widest text-yellow-300 font-bold mb-1">हमारे आदर्श / Our Inspiration</p><h3 class="text-2xl md:text-3xl font-bold text-white mb-1">सरदार वल्लभभाई पटेल</h3><p class="text-blue-100 text-sm md:text-base">लौह पुरुष — Iron Man of India</p></div></div></div>';

 if(!currentUser){
  h += '<div class="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-400 rounded-xl shadow-lg p-5 mb-4 text-center cursor-pointer" onclick="openObjectivePopup()">';
  h += '<p class="text-lg font-bold text-orange-800 mb-1">🎯 हमारा उद्देश्य</p>';
  h += '<p class="text-sm text-gray-700">'+esc(T('objective', DEFAULT_OBJECTIVE_TEXT)).slice(0,110)+'...</p>';
  h += '<p class="text-xs font-bold text-orange-600 mt-2">👆 पूरा पढ़ो / Read More</p>';
  h += '</div>';
  h += '<div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-5 mb-6 text-center text-white">';
  h += '<p class="font-bold mb-3">📲 अपने पाटीदार भाई-बहनों को जोड़ो</p>';
  h += '<button onclick="shareInvite()" class="bg-white text-green-700 px-6 py-3 rounded-lg font-bold">💬 WhatsApp पर Invite भेजो</button>';
  h += '</div>';
 }

 h += whomBoxHTML();

 h += adBanner(0);

 const portals = [
  ['community','blue','👥','COMMUNITY<br>समुदाय', publicMembers().length+' Members'],
  ['business','yellow','🏪','BUSINESS<br>व्यापार', allBusinesses().length+' Listed'],
  ['garba','pink','🪩','GARBA<br>नवरात्रि', garbaRegs.filter(g=>g.status==='approved').length+' Registered'],
  ['cricket','green','🏏','CRICKET<br>क्रिकेट', cricketData.length+' Interested'],
  ['blood','red','🩸','BLOOD<br>रक्तदान', publicMembers().filter(m=>m.blood_donor&&m.blood_donor.indexOf('हाँ')===0).length+' Donors'],
  ['property','purple','🏠','मकान-किरायेदार<br>Property', activeProperties().length+' Listings'],
  ['shaadi','rose','💍','SHAADI<br>विवाह', shaadiData.filter(s=>s.status==='approved').length+' Profiles'],
  ['rozgaar','teal','💼','ROZGAAR<br>रोज़गार', jobsData.filter(j=>j.status==='approved').length+' Jobs'],
  ['olditems','indigo','🛒','अपना OLX<br>Old Items', activeOldItems().length+' Items'],
  ['news','amber','📰','NEWS<br>समाचार', newsData.filter(n=>n.status!=='pending').length+' Updates'],
  ['pratibha','cyan','🏆','प्रतिभा परिचय<br>Talents', pratibhaData.filter(p=>p.status==='approved').length+' Stars'],
  ['events','lime','📅','EVENTS<br>कार्यक्रम', eventsData.length+' Events'],
  ['dharamshala','orange','🛕','मेरी धर्मशाला<br>Dharamshala', dharamshalaData.filter(d=>d.status==='approved').length+' Listed'],
  ['hospitals','sky','🏥','पाटीदार अस्पताल<br>Hospitals', hospitalsData.filter(h=>h.status==='approved').length+' Listed'],
  ['students','fuchsia','🎓','STUDENT<br>इंदौर', studentNeedsData.filter(s=>s.status==='approved').length+' Listings'],
  ['obituaries','gray','🕯️','शोक समाचार<br>Obituaries', obituariesData.length+' Notices'],
  ['meregaanv','emerald','🏡','मेरे गाँव<br>ले चलो', uniqueVillageCount()+' Villages'],
  ['patidarai','violet','👨‍🌾','Patidar AI<br>पूछो', 'सवाल पूछो']
 ];
 h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">'+portals.slice(0,4).map(portalTile).join('')+'</div>';

 h += adBanner(1);

 h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">'+portals.slice(4,8).map(portalTile).join('')+'</div>';

 h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">'+portals.slice(8,12).map(portalTile).join('')+'</div>';

 h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">'+portals.slice(12,18).map(portalTile).join('')+'</div>';

 h += '<div class="bg-white rounded-xl shadow-lg p-6 mb-8"><h3 class="text-2xl font-bold mb-1 text-center">🎲 जानो अपने साथियों को / Know Your Community</h3><p class="text-center text-gray-500 text-sm mb-4">Random member profiles देखो</p><div id="randProfileBox"></div></div>';

 // 🏪 BUSINESS SPOTLIGHT (random - हर बार अलग | बिना search किए भी दिखे)
 const biz = allBusinesses();
 if(biz.length){
  const shuffled = shufflePromotedFirst(biz).slice(0,6);
  h += '<div class="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-lg p-6 mb-8">';
  h += '<h3 class="text-2xl font-bold mb-1 text-center">🏪 पाटीदार बंधुओं के व्यापार / Business Spotlight</h3>';
  h += '<p class="text-center text-gray-500 text-sm mb-4">हर बार अलग-अलग businesses — card पर click करो, पूरी details + Call/WhatsApp मिलेगा</p>';
  h += '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
  shuffled.forEach(b => {
   h += '<div onclick="openBiz(\''+b.id+'\')" class="relative border-2 rounded-lg overflow-hidden shadow cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all '+(b.promoted?'border-amber-500':'bg-white border-yellow-300')+'" '+(b.promoted?'style="background:linear-gradient(160deg,#FEF3C7,#FDE68A);"':'')+'>'+
   (b.promoted?'<span class="absolute top-1.5 left-1.5 z-10 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">🚀</span>':'')+
   (b.pic?'<img src="'+b.pic+'" class="w-full h-32 object-cover">':'<div class="w-full h-20 bg-yellow-100 flex items-center justify-center text-4xl">🏪</div>')+
   '<div class="p-3"><p class="font-bold text-yellow-900 text-sm truncate">'+esc(b.name)+'</p>'+
   '<p class="text-[10px] bg-yellow-200 inline-block px-2 py-0.5 rounded font-bold mt-1">'+esc(b.type)+'</p>'+
   '<p class="text-[11px] text-gray-600 mt-1 truncate">👤 '+esc(b.owner)+'</p>'+
   (b.place?'<p class="text-[11px] text-gray-500 truncate">📍 '+esc(b.place)+'</p>':'')+'</div></div>';
  });
  h += '</div>';
  h += '<div class="text-center mt-4"><button onclick="goPage(\'business\')" class="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold">सभी Business देखो →</button></div>';
  h += '<p class="text-center text-xs text-gray-500 mt-3">💡 Community में अपना business भरो — यहाँ अपने आप दिखने लगेगा (free)</p>';
  h += '</div>';
 }

 h += adBanner(2);

 if(eventsData.length){
  h += '<div class="bg-white rounded-lg shadow-lg p-6 mb-8"><h3 class="text-2xl font-bold mb-4">📅 Upcoming Events / आगामी कार्यक्रम</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4">'+
  eventsData.slice(0,3).map(e => '<div class="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-5"><p class="font-bold text-green-700">'+esc(e.title)+'</p><p class="text-sm text-gray-600 mt-1">📅 '+e.date+' 🕐 '+(e.time||'')+'</p><p class="text-sm text-gray-600">📍 '+esc(e.location)+'</p></div>').join('')+'</div></div>';
 }

 h += adBanner(3);

 const visibleNews = newsData.filter(n=>n.status!=='pending');
 if(visibleNews.length){
  h += '<div class="bg-white rounded-lg shadow-lg p-6 mb-8"><h3 class="text-2xl font-bold mb-4">📰 Latest News / ताज़ा समाचार</h3><div class="space-y-3">'+
  visibleNews.slice(0,3).map(n => '<div class="bg-red-50 border-l-4 border-red-500 rounded p-4"><p class="font-bold text-red-700">'+esc(n.title)+'</p><p class="text-xs text-gray-500">📅 '+n.date+'</p><p class="text-sm text-gray-700 mt-1">'+esc(n.content).slice(0,150)+'...</p></div>').join('')+
  '</div><button onclick="goPage(\'news\')" class="mt-4 text-red-600 font-bold">सभी news देखो →</button></div>';
 }

 h += '<div class="bg-white rounded-lg shadow-lg p-6 mb-8"><h3 class="text-2xl font-bold mb-3">ℹ️ About Us / हमारे बारे में</h3><p class="text-gray-700 whitespace-pre-line">'+esc(siteMeta.aboutUs || 'पाटीदार समाज इंदौर महानगर - समाज की सेवा है हमारा लक्ष्य। हमारा उद्देश्य समाज के सभी सदस्यों को एक मंच पर जोड़ना है।')+'</p></div>';

 if(committeeData.length){
  h += '<div class="bg-white rounded-lg shadow-lg p-6 mb-8"><h3 class="text-2xl font-bold mb-4">🙏 हमारी समिति / Our Committee</h3><div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
  committeeData.map(c => '<div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">'+
   (c.pic?'<img src="'+c.pic+'" class="h-20 w-20 object-cover rounded-full border-2 border-blue-300 mx-auto mb-2">':'<p class="text-4xl mb-2">🙏</p>')+
   '<p class="font-bold text-blue-800">'+esc(c.name)+'</p><p class="text-sm bg-blue-200 inline-block px-2 py-0.5 rounded-full mt-1 font-bold">'+esc(c.post)+'</p>'+
   (c.details?'<p class="text-xs text-gray-600 mt-2">'+esc(c.details)+'</p>':'')+
  '</div>').join('')+'</div></div>';
 }

 h += adBanner(4);

 h += '<div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-lg p-4 text-center mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">'+
 '<p class="font-bold text-base">🤝 JOIN US — PSIM के सक्रिय सदस्य बनें</p>'+
 '<button onclick="joinUsClick()" class="bg-white text-green-700 px-5 py-2 rounded-lg font-bold text-sm hover:bg-green-50">➕ अभी जुड़ें</button></div>';

 h += '<div class="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg shadow-lg p-4 text-center">'+
 '<p class="font-bold mb-2">📞 CONTACT US / पाटीदार समाज इंदौर महानगर</p>'+
 '<div class="flex justify-center gap-3 max-w-xs mx-auto">'+
 '<a href="tel:'+ADMIN_CONTACTS[0]+'" class="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 flex items-center gap-2 font-bold text-sm">📞 '+ADMIN_CONTACTS[0]+'</a>'+
 '<a href="https://wa.me/91'+ADMIN_CONTACTS[0]+'" target="_blank" class="bg-green-500 hover:bg-green-600 rounded-lg px-4 py-2 flex items-center gap-2 font-bold text-sm">💬 WhatsApp</a>'+
 '</div></div>';
 return h;
}

// ================= RANDOM PROFILES =================
function shuffleRand(){
 randOrder = publicMembers().map((m,i)=>i);
 for(let i=randOrder.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [randOrder[i],randOrder[j]]=[randOrder[j],randOrder[i]]; }
 randIdx = 0;
}
function randNext(){ randIdx=(randIdx+1)%randOrder.length; renderRandProfile(); }
function randPrev(){ randIdx=(randIdx-1+randOrder.length)%randOrder.length; renderRandProfile(); }
function relOf(m){
 const rels = relativesData.filter(r => r.status==='approved' && (r.fromPhone===m.phone || r.toPhone===m.phone));
 return rels.map(r => r.fromPhone===m.phone ? (r.toName+' ('+r.relation.split('/')[0].trim()+')') : (r.fromName+' ('+r.relation.split('/')[0].trim()+')'));
}
function friendsOf(m){
 const frs = friendsData.filter(f => f.status==='approved' && (f.fromPhone===m.phone || f.toPhone===m.phone));
 return frs.map(f => f.fromPhone===m.phone ? f.toName : f.fromName);
}
function renderRandProfile(){
 const box = document.getElementById('randProfileBox'); if(!box) return;
 if(!currentUser){ box.innerHTML='<div class="text-center py-6"><p class="text-5xl mb-3">🔒</p><p class="font-bold text-gray-600">Profiles देखने के लिए पहले Register करो</p><button onclick="showRegisterPrompt(\'Business profiles देखने के लिए पहले Register करो।\')" class="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">📝 REGISTER करो</button></div>'; return; }
 const mems = publicMembers();
 if(!mems.length){ box.innerHTML='<p class="text-center text-gray-400 py-6">अभी members नहीं हैं</p>'; return; }
 if(!randOrder.length || randOrder.length!==mems.length) shuffleRand();
 const m = mems[randOrder[randIdx]];
 const rels = relOf(m);
 box.innerHTML = '<div class="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-xl p-6 text-center">'+
  (m.profile_pic?'<img src="'+m.profile_pic+'" class="h-24 w-24 object-cover rounded-full border-4 border-blue-300 mx-auto mb-2">':'<p class="text-4xl mb-2">👤</p>')+
  '<p class="text-2xl font-bold text-blue-800">'+esc(m.name)+' '+esc(m.surname)+'</p>'+
  '<p class="text-sm bg-blue-200 inline-block px-3 py-1 rounded-full mt-2 font-bold">'+esc(profOf(m)||'Member')+'</p>'+
  '<div class="mt-4 text-sm text-gray-700 space-y-1">'+
  '<p>📱 '+esc(m.phone)+'</p>'+
  '<p>🏡 '+esc(m.home_village||'-')+', '+esc(distOf(m,'home')||'-')+'</p>'+
  '<p>📍 '+esc(m.present_city||'-')+', '+esc(distOf(m,'present')||'-')+'</p>'+
  (m.work_details?'<p class="bg-white rounded p-2 mt-2 text-xs">'+esc(m.work_details)+'</p>':'')+
  (rels.length?'<p class="text-xs mt-2">👨‍👩‍👧‍👦 '+rels.join(', ')+'</p>':'')+
  '</div>'+
  '<div class="flex justify-center gap-4 mt-5">'+
  '<button onclick="randPrev()" class="bg-gray-600 text-white px-5 py-2 rounded-lg font-bold">⬅️ Previous</button>'+
  '<button onclick="randNext()" class="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold">Next ➡️</button>'+
  '</div><p class="text-xs text-gray-400 mt-2">'+(randIdx+1)+' / '+mems.length+'</p></div>';
}

// ================= PROFESSION PAGE =================
// ================= COMMUNITY (members directory — login required) =================
function setSearch(by){ searchBy=by; renderApp(); }
function doSearch(v){ searchQ=v.toLowerCase(); renderMemberGrid(); }
function memberCard(m){
 const rels = relOf(m);
 return '<div class="w-72 shrink-0 bg-white border-2 border-blue-300 rounded-lg p-5 shadow-md hover:shadow-lg">'+
 (m.profile_pic?'<img src="'+m.profile_pic+'" class="h-24 w-24 object-cover rounded-full border-2 border-blue-300 mb-3">':'')+
 '<p class="font-bold text-xl text-blue-700">'+esc(m.name)+' '+esc(m.surname)+'</p>'+
 '<p class="text-xs bg-blue-100 inline-block px-2 py-1 rounded mt-1">'+esc(profOf(m)||'')+'</p>'+
 '<div class="mt-3 space-y-1 text-sm text-gray-700">'+
 '<p>📱 '+esc(m.phone)+'</p>'+
 '<p>🏡 गाँव: '+esc(m.home_village||'-')+', '+esc(distOf(m,'home')||'-')+(m.home_state&&m.home_state!=='Madhya Pradesh'?' ('+esc(m.home_state)+')':'')+'</p>'+
 '<p>📍 Present: '+esc(m.present_city||'-')+', '+esc(distOf(m,'present')||'-')+(m.present_state&&m.present_state!=='Madhya Pradesh'?' ('+esc(m.present_state)+')':'')+'</p>'+
 (m.marital_status?'<p>💍 '+esc(m.marital_status)+' | Age: '+esc(m.age||'-')+'</p>':'')+
 (m.blood_group?'<p>🩸 Blood Group: <b class="text-red-600">'+esc(m.blood_group)+'</b>'+((m.blood_donor||'').indexOf('हाँ')===0?' <span class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">रक्तदाता ✅</span>':'')+'</p>':'')+
 (rels.length?'<p class="bg-indigo-50 rounded p-2 mt-2 text-xs">👨‍👩‍👧‍👦 <b>परिवार:</b> '+rels.join(', ')+'</p>':'')+
 '</div>'+
 (m.business_name?'<button onclick="openBiz(\''+m.id+'\')" class="mt-3 w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold">🏪 इनका Business देखें: '+esc(m.business_name)+'</button>':'')+
 (currentUser && currentUser!==m.phone ?
  '<div class="mt-3 flex gap-2 flex-wrap">'+
  '<button onclick="sendFriendRequest(\''+m.id+'\')" class="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold">➕ मित्र</button>'+
  '<button onclick="openRelPicker(\''+m.id+'\')" class="bg-indigo-100 text-indigo-700 border border-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold">👨‍👩‍👧 रिश्तेदार</button>'+
  '<button onclick="openMemberProfile(\''+m.id+'\')" class="bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold">👁️ पूरी प्रोफाइल</button>'+
  '</div>' :
  '<div class="mt-3"><button onclick="openMemberProfile(\''+m.id+'\')" class="bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold">👁️ पूरी प्रोफाइल</button></div>')+
 '</div>';
}
function renderMemberGrid(){
 const el = document.getElementById('memberGrid'); if(!el) return;
 const approved = publicMembers();
 const filtered = !searchQ ? approved : approved.filter(m => {
  if(searchBy==='name') return (m.name+' '+m.surname).toLowerCase().includes(searchQ);
  if(searchBy==='phone') return (m.phone||'').includes(searchQ);
  if(searchBy==='village') return (m.home_village||'').toLowerCase().includes(searchQ);
  if(searchBy==='district') return (distOf(m,'home')+' '+distOf(m,'present')).toLowerCase().includes(searchQ);
  if(searchBy==='state') return ((m.home_state||'')+' '+(m.present_state||'')).toLowerCase().includes(searchQ);
  return true;
 });
 el.innerHTML = filtered.length ? '<div class="flex gap-5 overflow-x-auto pb-3 noscroll">'+filtered.map(memberCard).join('')+'</div>' : '<p class="text-gray-500 text-lg text-center py-8">कोई member नहीं मिला</p>';
 const cnt = document.getElementById('memberCount'); if(cnt) cnt.textContent = filtered.length;
}

// ===== RELATIVES + FRIENDS (peer-approval - logged-in users) =====
function toggleRelForm(){ showRelForm=!showRelForm; renderApp(); }
function toggleFriendForm(){ showFriendForm=!showFriendForm; renderApp(); }
async function sendRelRequest(toId){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('रिश्तेदार जोड़ने के लिए पहले Community में register होना जरूरी है। Admin approval के बाद यह feature unlock होगा।'); return; }
 const to = membersData.find(m=>m.id===toId); if(!to) return;
 const relation = document.getElementById('relSel_'+toId).value;
 if(!relation){ alert('❌ रिश्ता चुनो'); return; }
 if(relativesData.find(r => (r.fromPhone===me.phone&&r.toPhone===to.phone)||(r.fromPhone===to.phone&&r.toPhone===me.phone))){ alert('❌ Request पहले से है!'); return; }
 busy(true);
 await db.collection('relatives').add({fromPhone:me.phone, fromName:me.name+' '+me.surname, toPhone:to.phone, toName:to.name+' '+to.surname, relation:relation, status:'pending', createdAt:today()});
 alert('✅ Request भेज दी! '+to.name+' के approve करने पर दोनों profile में दिखेगा।'); showRelForm=false; relSearchQ=''; busy(false); renderApp();
}
async function respondRel(id, accept){
 busy(true);
 if(accept) await db.collection('relatives').doc(id).update({status:'approved'});
 else await db.collection('relatives').doc(id).delete();
 busy(false); renderApp();
}
async function sendFriendRequest(toId){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('मित्र जोड़ने के लिए पहले Community में register होना जरूरी है। Admin approval के बाद यह feature unlock होगा।'); return; }
 const to = membersData.find(m=>m.id===toId); if(!to) return;
 if(to.phone===me.phone) return;
 if(friendsData.find(f => (f.fromPhone===me.phone&&f.toPhone===to.phone)||(f.fromPhone===to.phone&&f.toPhone===me.phone))){ alert('❌ Request पहले से है!'); return; }
 busy(true);
 await db.collection('friends').add({fromPhone:me.phone, fromName:me.name+' '+me.surname, toPhone:to.phone, toName:to.name+' '+to.surname, status:'pending', createdAt:today()});
 alert('✅ Friend Request भेज दी! '+to.name+' के approve करने पर दोनों की Friends list में दिखेगा।'); showFriendForm=false; friendSearchQ=''; busy(false); renderApp();
}
async function respondFriend(id, accept){
 busy(true);
 if(accept) await db.collection('friends').doc(id).update({status:'approved'});
 else await db.collection('friends').doc(id).delete();
 busy(false); renderApp();
}
function connectSearchResults(q, excludePhone){
 return approvedMembers().filter(m => m.phone!==excludePhone && ((m.name+' '+m.surname).toLowerCase().includes(q) || (m.phone||'').includes(q) || (m.home_village||'').toLowerCase().includes(q))).slice(0,5);
}
function renderMyConnections(){
 const me = myMember();
 if(!me || me.status!=='approved') return '';
 let h = '<div class="border-t-2 pt-4 mt-4">';
 h += '<h4 class="font-bold text-lg mb-3">🤝 मित्र और रिश्तेदार</h4>';
 const pendRel = relativesData.filter(r => r.toPhone===me.phone && r.status==='pending');
 const pendFr = friendsData.filter(f => f.toPhone===me.phone && f.status==='pending');
 if(pendRel.length || pendFr.length){
  h += '<div class="bg-indigo-100 border-2 border-indigo-400 rounded-lg p-4 mb-4">';
  h += '<p class="font-bold text-indigo-800 mb-3">🔔 Pending Requests</p>';
  pendRel.forEach(r => {
   h += '<div class="bg-white rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm">👨‍👩‍👧 <b>'+esc(r.fromName)+'</b> ने आपको <b>'+esc(r.relation)+'</b> बताया है</p>'+
   '<div class="flex gap-2"><button onclick="respondRel(\''+r.id+'\',true)" title="Approve" class="bg-green-600 text-white w-9 h-9 rounded-full font-bold">✔️</button><button onclick="respondRel(\''+r.id+'\',false)" title="Reject" class="bg-red-500 text-white w-9 h-9 rounded-full font-bold">✖️</button></div></div>';
  });
  pendFr.forEach(f => {
   h += '<div class="bg-white rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm">🙋 <b>'+esc(f.fromName)+'</b> ने आपको Friend Request भेजी है</p>'+
   '<div class="flex gap-2"><button onclick="respondFriend(\''+f.id+'\',true)" title="Approve" class="bg-green-600 text-white w-9 h-9 rounded-full font-bold">✔️</button><button onclick="respondFriend(\''+f.id+'\',false)" title="Reject" class="bg-red-500 text-white w-9 h-9 rounded-full font-bold">✖️</button></div></div>';
  });
  h += '</div>';
 }
 const myRels = relOf(me), myFriends = friendsOf(me);
 h += '<p class="text-sm font-bold text-gray-700 mb-1">👨‍👩‍👧 मेरे रिश्तेदार ('+myRels.length+')</p>';
 h += myRels.length ? '<p class="text-sm text-gray-600 mb-3">'+myRels.map(esc).join(', ')+'</p>' : '<p class="text-xs text-gray-400 mb-3">अभी कोई नहीं</p>';
 h += '<p class="text-sm font-bold text-gray-700 mb-1">🙋 मेरे मित्र ('+myFriends.length+')</p>';
 h += myFriends.length ? '<p class="text-sm text-gray-600 mb-3">'+myFriends.map(esc).join(', ')+'</p>' : '<p class="text-xs text-gray-400 mb-3">अभी कोई नहीं</p>';
 h += '<div class="flex flex-wrap gap-3 mt-2">';
 h += '<button onclick="toggleRelForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm">➕ रिश्तेदार जोड़ें</button>';
 h += '<button onclick="toggleFriendForm()" class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold text-sm">➕ मित्र जोड़ें</button>';
 h += '</div>';
 if(showRelForm){
  h += '<div class="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-5 mt-4">';
  h += '<p class="font-bold mb-2">🔍 Community में से खोजो / Search relative:</p>';
  h += '<input type="text" oninput="relSearchQ=this.value.toLowerCase();renderApp()" value="'+esc(relSearchQ)+'" placeholder="Name / गाँव / Number..." class="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg mb-3">';
  if(relSearchQ){
   const results = connectSearchResults(relSearchQ, me.phone);
   if(results.length){
    results.forEach(m => {
     h += '<div class="bg-white rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm font-bold">'+esc(m.name)+' '+esc(m.surname)+' <span class="text-gray-500 font-normal">('+esc(m.home_village||'-')+')</span></p>'+
     '<div class="flex gap-2"><select id="relSel_'+m.id+'" class="border-2 rounded px-2 py-1 text-sm"><option value="">रिश्ता चुनो</option>'+RELATIONS.map(r=>'<option>'+r+'</option>').join('')+'</select>'+
     '<button onclick="sendRelRequest(\''+m.id+'\')" class="bg-indigo-600 text-white px-3 py-1 rounded font-bold text-sm">📤 REQUEST</button></div></div>';
    });
   } else h += '<p class="text-gray-500 text-sm">कोई नहीं मिला</p>';
  }
  h += '</div>';
 }
 if(showFriendForm){
  h += '<div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-5 mt-4">';
  h += '<p class="font-bold mb-2">🔍 Community में से खोजो / Search friend:</p>';
  h += '<input type="text" oninput="friendSearchQ=this.value.toLowerCase();renderApp()" value="'+esc(friendSearchQ)+'" placeholder="Name / गाँव / Number..." class="w-full px-4 py-2 border-2 border-purple-300 rounded-lg mb-3">';
  if(friendSearchQ){
   const results = connectSearchResults(friendSearchQ, me.phone);
   if(results.length){
    results.forEach(m => {
     h += '<div class="bg-white rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm font-bold">'+esc(m.name)+' '+esc(m.surname)+' <span class="text-gray-500 font-normal">('+esc(m.home_village||'-')+')</span></p>'+
     '<button onclick="sendFriendRequest(\''+m.id+'\')" class="bg-purple-600 text-white px-3 py-1 rounded font-bold text-sm">📤 REQUEST</button></div>';
    });
   } else h += '<p class="text-gray-500 text-sm">कोई नहीं मिला</p>';
  }
  h += '</div>';
 }
 h += '</div>';
 return h;
}

// ===== MY PROFILE / DELETE MY DATA / PRIVACY TOGGLE =====
async function deleteMyData(){
 const me = myMember(); if(!me) return;
 if(!confirm('⚠️ आपका पूरा DATA delete हो जाएगा (Profile + Cricket + Garba + Relatives + Friends)।\nवापस नहीं आएगा! पक्का?')) return;
 if(!confirm('Confirm दोबारा - DELETE करना है?')) return;
 busy(true);
 const batch = db.batch();
 batch.delete(db.collection('members').doc(me.id));
 cricketData.filter(c=>c.phone===me.phone).forEach(c=>batch.delete(db.collection('cricket').doc(c.id)));
 garbaRegs.filter(g=>g.phone===me.phone).forEach(g=>batch.delete(db.collection('garba_regs').doc(g.id)));
 relativesData.filter(r=>r.fromPhone===me.phone||r.toPhone===me.phone).forEach(r=>batch.delete(db.collection('relatives').doc(r.id)));
 friendsData.filter(f=>f.fromPhone===me.phone||f.toPhone===me.phone).forEach(f=>batch.delete(db.collection('friends').doc(f.id)));
 await batch.commit();
 busy(false);
 alert('✅ आपका पूरा data delete हो गया।');
 goPage('home');
}
// 🩸 अपना Blood Group खुद भरो => Blood page की उसी group list में अपने आप नाम आ जाएगा
async function setMyBlood(){
 const me = myMember(); if(!me){ showRegisterPrompt('Blood Group भरने के लिए पहले Community में register करो।'); return; }
 const gr = document.getElementById('myBloodGroup').value;
 const dn = document.getElementById('myBloodDonor').value;
 if(!gr){ alert('❌ Blood Group चुनो'); return; }
 await updDoc('members', me.id, {blood_group:gr, blood_donor:dn});
 alert('✅ Blood Group save हो गया: '+gr+'\n\n🩸 अब आपका नाम BLOOD page की "'+gr+'" list में अपने आप दिखेगा।');
}
async function togglePrivacySelf(){
 const me = myMember(); if(!me) return;
 const newP = (me.privacy||'').indexOf('Secret')===0 ? 'Public / सबको दिखे' : 'Secret / सिर्फ PSIM Team को';
 await updDoc('members', me.id, {privacy:newP});
 alert('✅ Privacy बदल गई: '+newP);
}

function quickLoginBoxHTML(){
 let h = '<div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-5 max-w-2xl mx-auto mb-2 text-center">';
 h += '<div class="flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto">';
 h += '<div class="flex items-center border-2 border-blue-300 rounded overflow-hidden flex-1"><span class="bg-blue-100 px-3 py-2 font-bold text-blue-700 text-sm">+91</span><input type="tel" id="ql_phone" maxlength="10" inputmode="numeric" value="'+esc(quickLoginPhone)+'" placeholder="Mobile Number" class="flex-1 px-3 py-2 outline-none"></div>';
 h += '<button onclick="sendQuickLoginOtp()" id="qlOtpSendBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold whitespace-nowrap">📲 OTP भेजो</button>';
 h += '</div>';
 h += '<div id="qlOtpBox" class="hidden mt-3 max-w-sm mx-auto"><input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" oninput="this.value=this.value.replace(/[^0-9]/g,\'\'); if(this.value.length===6) verifyQuickLoginOtp();" id="qlOtpCode" maxlength="6" placeholder="OTP डालें (SMS से auto-fill होगा)" class="w-full px-3 py-2 border-2 border-blue-300 rounded mb-2 text-center text-2xl font-bold tracking-widest"><button onclick="verifyQuickLoginOtp()" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">✅ Login करो</button><div id="qlResendArea" class="mt-2"></div></div>';
 h += '<div id="recaptcha-container-quicklogin" class="mt-2 flex justify-center"></div>';
 h += '</div>';
 return h;
}
function renderRegisterPage(){
 if(currentUser && myMember()){
  return '<div class="bg-white rounded-lg shadow-lg p-6 text-center"><p class="text-4xl mb-3">✅</p><p class="text-lg font-bold text-gray-700">आप पहले से registered हैं!</p><button onclick="goPage(\'community\')" class="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">Community Page पर जाओ →</button></div>';
 }
 let h = '<div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">';
 h += '<h2 class="text-2xl md:text-3xl font-bold mb-2 text-center">📝 पाटीदार परिवार से जुड़ो</h2>';
 h += '<p class="text-sm text-red-600 font-bold mb-4 text-center">⚠️ Subject to Admin Approval | सिर्फ जरूरी चीज़ें भरो - बाकी optional</p>';
 if(!currentUser && showRegModeChooser){
  h += regModeChooserHTML();
 } else {
  h += stepFormHTML({});
 }
 h += '</div>';
 return h;
}
function regModeChooserHTML(){
 let h = '<p class="text-center font-bold text-gray-700 mb-3">Register कैसे करना चाहते हो?</p>';
 h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
 h += '<button type="button" onclick="chooseRegMode(\'otp\')" class="bg-blue-50 hover:bg-blue-100 border-2 border-blue-400 rounded-xl p-6 text-center">'+
  '<span class="text-4xl block mb-2">📲</span><p class="font-bold text-blue-800 text-lg">OTP से Register</p>'+
  '<p class="text-xs text-gray-500 mt-1">अपना mobile number OTP से verify करो</p></button>';
 h += '<button type="button" onclick="chooseRegMode(\'reference\')" class="bg-green-50 hover:bg-green-100 border-2 border-green-400 rounded-xl p-6 text-center">'+
  '<span class="text-4xl block mb-2">🤝</span><p class="font-bold text-green-800 text-lg">Reference से Register</p>'+
  '<p class="text-xs text-gray-500 mt-1">किसी member ने पहले से approve कर रखा है? OTP की जरूरत नहीं</p></button>';
 h += '</div>';
 return h;
}
function chooseRegMode(mode){ regMode = mode; showRegModeChooser = false; renderApp(); }
function renderCommunity(){
 let top = '<h2 class="text-3xl font-bold mb-6">👥 COMMUNITY / समुदाय</h2>';
 top += '<button onclick="openSwipeView(\'community\')" class="w-full mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl">🔀 Profiles Explore करें</button>';
 top += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">';
 top += '<div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 cursor-pointer hover:shadow-xl" onclick="document.getElementById(\'searchSection\').scrollIntoView({behavior:\'smooth\'})"><p class="text-3xl mb-1">🔍</p><p class="font-bold text-xl">SEARCH MEMBERS</p><p class="text-sm text-blue-100">Name, Number, Village, District, State से</p></div>';
 top += '<div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 cursor-pointer hover:shadow-xl" onclick="document.getElementById(\'addSection\').scrollIntoView({behavior:\'smooth\'})"><p class="text-3xl mb-1">➕</p><p class="font-bold text-xl">ADD YOUR DETAILS</p><p class="text-sm text-green-100">Admin approval के बाद live</p></div></div>';

 let searchSec = '<div id="searchSection" class="bg-white rounded-lg shadow-lg p-6 mb-8">';
 searchSec += '<h3 class="text-2xl font-bold mb-4">🔍 SEARCH (<span id="memberCount"></span>)</h3>';
 searchSec += '<div class="flex flex-wrap gap-2 mb-4">'+[['name','By Name'],['phone','By Number'],['village','By Village'],['district','By District'],['state','By State']].map(b=>'<button onclick="setSearch(\''+b[0]+'\')" class="px-3 py-2 rounded font-bold text-sm '+(searchBy===b[0]?'bg-blue-600 text-white':'bg-gray-200')+'">'+b[1]+'</button>').join('')+'</div>';
 searchSec += '<input type="text" placeholder="🔍 Search करो..." oninput="doSearch(this.value)" value="'+esc(searchQ)+'" class="w-full px-4 py-3 border-2 border-blue-300 rounded-lg mb-6 text-lg">';
 searchSec += '<div id="memberGrid"></div></div>';

 const me = myMember();
 let addSec = '<div id="addSection" class="bg-white rounded-lg shadow-lg p-6">';
 if(me){
  addSec += '<h3 class="text-2xl font-bold mb-2">✅ आपकी Profile</h3>';
  addSec += '<p class="text-gray-600 mb-1">'+esc(me.name)+' '+esc(me.surname)+' | 📱 '+esc(me.phone)+'</p>';
  addSec += '<p class="mb-4">Status: <span class="font-bold '+(me.status==='approved'?'text-green-600':'text-yellow-600')+'">'+(me.status==='approved'?'APPROVED ✅':'PENDING ⏳ (Admin approval जल्द आएगी)')+'</span></p>';
  if(me.gender && me.gender.indexOf('Female')===0){
   const isSecret = (me.privacy||'').indexOf('Secret')===0;
   addSec += '<button onclick="togglePrivacySelf()" class="mb-3 mr-3 bg-purple-100 text-purple-700 border-2 border-purple-300 px-5 py-2 rounded-lg font-bold text-sm">'+(isSecret?'🔓 Profile PUBLIC करो':'🔒 Profile SECRET करो')+'</button>';
   addSec += '<p class="text-xs text-gray-400 mb-3">अभी: '+(isSecret?'🔒 Secret (सिर्फ PSIM Team को दिखती है)':'👁️ Public (सबको दिखती है)')+'</p>';
  }
  addSec += '<div class="bg-red-50 border-2 border-red-300 rounded-lg p-4 my-4">'+
   '<p class="font-bold text-red-800 mb-2">🩸 Blood Group / ब्लड ग्रुप</p>'+
   '<p class="text-xs text-gray-600 mb-3">भरते ही आपका नाम BLOOD page की उसी group की list में अपने आप जुड़ जाएगा</p>'+
   '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'+
   '<select id="myBloodGroup" class="px-3 py-2 border-2 rounded"><option value="">-- Blood Group चुनो --</option>'+BLOOD_GROUPS.map(g=>'<option '+(g===(me.blood_group||'')?'selected':'')+'>'+g+'</option>').join('')+'</select>'+
   '<select id="myBloodDonor" class="px-3 py-2 border-2 rounded">'+['हाँ / Yes','नहीं / No'].map(g=>'<option '+(g===(me.blood_donor||'')?'selected':'')+'>'+g+'</option>').join('')+'</select>'+
   '<button onclick="setMyBlood()" class="bg-red-600 text-white px-4 py-2 rounded font-bold">✅ SAVE</button></div>'+
   (me.blood_group?'<p class="text-sm text-green-700 font-bold mt-2">अभी: '+esc(me.blood_group)+' '+((me.blood_donor||'').indexOf('हाँ')===0?'(रक्तदान के लिए तैयार ✅)':'(रक्तदान: नहीं)')+'</p>':'')+
   '</div>';
  addSec += '<div class="flex flex-wrap gap-3 my-4">'+
   '<button onclick="openEditProfile()" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm">✏️ Edit Profile</button>'+
   '<button onclick="doLogout()" class="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg font-bold text-sm">🚪 Logout</button>'+
   '</div>';
  addSec += renderMyConnections();
  addSec += '<div class="border-t-2 pt-4 mt-4"><button onclick="deleteMyData()" class="bg-red-100 text-red-700 border-2 border-red-300 px-5 py-2 rounded-lg font-bold text-sm hover:bg-red-200">🗑️ Delete My Data / मेरा पूरा data delete करो</button></div>';
 } else {
  addSec += '<h3 class="text-2xl font-bold mb-2">➕ ADD YOUR DETAILS / अपनी जानकारी जोड़ें</h3>';
  addSec += '<p class="text-sm text-red-600 font-bold mb-4">⚠️ Subject to Admin Approval | सिर्फ 3 चीज़ें जरूरी - बाकी optional</p>';
  addSec += stepFormHTML({});
 }
 addSec += '</div>';
 return top + searchSec + addSec;
}

// ================= BUSINESS =================
const SAMPLE_BUSINESSES = [
 {id:'sample_1', name:'राज इलेक्ट्रिकल स्टोर', type:'Electrician', owner:'राज कुमार पटेल', phone:'9876543210', place:'राजेंद्र नगर, इंदौर', description:'घर और ऑफिस के लिए सभी विद्युत सामग्री। इंस्टालेशन सर्विस उपलब्ध।', village:'Indore', city:'Indore'},
 {id:'sample_2', name:'गौरव प्लम्बिंग सर्विसेज', type:'Plumber', owner:'गौरव शर्मा', phone:'9876543211', place:'खजराना, इंदौर', description:'24/7 सर्विस। नल, टैंक, पाइपिंग - सब कुछ।', village:'Indore', city:'Indore'},
 {id:'sample_3', name:'स्मार्ट लर्निंग सेंटर', type:'Tuition/Education', owner:'डॉ. प्रिया वर्मा', phone:'9876543212', place:'साकेत नगर, इंदौर', description:'10th, 12th के लिए मैथ्स और साइंस। ऑनलाइन क्लास भी उपलब्ध।', village:'Indore', city:'Indore'},
 {id:'sample_4', name:'राहुल वुड वर्क्स', type:'Carpenter', owner:'राहुल कुमार', phone:'9876543213', place:'मंडलेश्वर, इंदौर', description:'कस्टम फर्नीचर, दरवाजे, अलमारी। डिजाइन फ्री परामर्श।', village:'Indore', city:'Indore'},
 {id:'sample_5', name:'ग्लैमर ब्यूटी सलून', type:'Salon/Beauty', owner:'रीना पटेल', phone:'9876543214', place:'पुष्पराज नगर, इंदौर', description:'हेयर, मेहंदी, ब्राइडल मेकअप। होम सर्विस भी।', village:'Indore', city:'Indore'}
];
function isBizPromoActive(m){ return m && m.biz_promo_status==='active' && (m.biz_promo_until||'0000-00-00') >= today(); }
function shufflePromotedFirst(list){
 // 🚀 Promoted (paid) वाले हमेशा पहले — बस promoted-promoted और free-free के अंदर random order रहे
 const promoted = list.filter(x=>x.promoted).sort(()=>Math.random()-0.5);
 const free = list.filter(x=>!x.promoted).sort(()=>Math.random()-0.5);
 return promoted.concat(free);
}
function allBusinesses(){
 const real = publicMembers().filter(m => m.business_name).map(m => ({
  id:m.id,
  name:m.business_name, type:(m.business_type==='Other'&&m.business_type_other)?m.business_type_other:(m.business_type||'Business'),
  owner:m.name+' '+m.surname, phone:m.business_phone||m.phone, place:m.business_place||m.present_city||'',
  gmap:m.business_gmap||'', pic:m.business_pic1||'', description:m.business_details||'',
  village:m.home_village||'', city:m.present_city||'', ownerPhone:m.phone||'', promoted:isBizPromoActive(m),
  lat:m.business_lat||null, lng:m.business_lng||null
 }));
 real.sort((a,b) => (b.promoted?1:0)-(a.promoted?1:0));
 return real.length > 0 ? real : SAMPLE_BUSINESSES;
}
// ===== BUSINESS DETAIL MODAL (कहीं से भी click => पूरी details) =====
function labhBadgeHTML(b){
 const count = labhActiveReceivedBy(b.ownerPhone).length;
 let h = '<div class="mt-4 flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3">'+
  '<div class="text-2xl">🏅</div>'+
  '<p class="font-bold text-yellow-800">'+count+' लोगों को इनसे लाभ मिला</p>'+
  '</div>';
 if(currentUser && currentUser!==b.ownerPhone){
  if(hasGivenLabh(currentUser, b.ownerPhone)){
   h += '<button class="w-full mt-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg font-bold" disabled>✔️ आपने लाभ दिया — धन्यवाद!</button>';
  } else {
   h += '<button onclick="giveLabh(\''+b.id+'\',\''+esc(b.ownerPhone)+'\',\''+esc(b.name)+'\')" class="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-bold">✅ मुझे लाभ मिला</button>'+
    '<p class="text-[10px] text-gray-400 text-center mt-1">सिर्फ एक बार — deal के बाद ही दबाओ</p>';
  }
 }
 return h;
}
function bizDetailHTML(b){
 return (b.pic?'<img src="'+b.pic+'" class="w-full h-56 object-cover rounded-t-2xl">':'<div class="w-full h-28 bg-yellow-100 flex items-center justify-center text-6xl rounded-t-2xl">🏪</div>')+
  '<div class="p-6">'+
  '<p class="text-2xl font-bold text-yellow-700">'+esc(b.name)+'</p>'+
  '<p class="inline-block bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold mt-2">'+esc(b.type)+'</p>'+
  '<div class="mt-4 space-y-1 text-gray-700">'+
  '<p>👤 <b>'+esc(b.owner)+'</b></p>'+
  (b.place?'<p>📍 '+esc(b.place)+'</p>':'')+
  (b.village?'<p>🏡 गाँव: '+esc(b.village)+'</p>':'')+
  '<p>📱 '+esc(b.phone)+'</p></div>'+
  (b.description?'<p class="text-sm text-gray-700 mt-3 bg-gray-50 rounded-lg p-3 whitespace-pre-line">'+esc(b.description)+'</p>':'')+
  (b.ownerPhone ? labhBadgeHTML(b) : '')+
  (currentUser && currentUser!==b.ownerPhone && membersData.find(x=>x.id===b.id) ?
   '<div class="flex gap-2 flex-wrap mt-4"><button onclick="sendFriendRequest(\''+b.id+'\')" class="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold">➕ मित्र</button><button onclick="openRelPicker(\''+b.id+'\')" class="bg-indigo-100 text-indigo-700 border border-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold">👨‍👩‍👧 रिश्तेदार</button></div>' : '')+
  '<div class="grid grid-cols-1 gap-2 mt-5">'+
  '<a href="tel:'+esc(b.phone)+'" class="text-center bg-green-600 text-white px-4 py-3 rounded-lg font-bold">📞 Call करो</a>'+
  '<a href="https://wa.me/91'+esc(b.phone)+'" target="_blank" class="text-center bg-green-500 text-white px-4 py-3 rounded-lg font-bold">💬 WhatsApp</a>'+
  (b.gmap?'<a href="'+esc(b.gmap)+'" target="_blank" class="text-center bg-blue-600 text-white px-4 py-3 rounded-lg font-bold">📍 Location देखो</a>':'')+
  '<button onclick="closeBizForce()" class="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold">बंद करो / Close</button>'+
  '</div></div>';
}
function openBiz(id){
 const b = allBusinesses().find(x => x.id === id);
 if(!b) return;
 document.getElementById('bizModalBox').innerHTML = bizDetailHTML(b);
 document.getElementById('bizModal').classList.remove('hidden');
}
function closeBizForce(){ document.getElementById('bizModal').classList.add('hidden'); }
function closeBiz(e){ if(e && e.target && e.target.id==='bizModal') closeBizForce(); }
function openRelPicker(toId){
 const to = membersData.find(m=>m.id===toId); if(!to) return;
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6">'+
  '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-indigo-800">👨‍👩‍👧 रिश्तेदार जोड़ो</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
  '<p class="font-bold mb-3">'+esc(to.name)+' '+esc(to.surname)+' <span class="text-gray-500 font-normal text-sm">('+esc(to.home_village||'-')+')</span></p>'+
  '<label class="text-xs font-bold text-gray-600">रिश्ता चुनो</label>'+
  '<select id="relSel_'+to.id+'" class="w-full px-3 py-2 border-2 rounded mb-4"><option value="">-- चुनो --</option>'+RELATIONS.map(r=>'<option>'+r+'</option>').join('')+'</select>'+
  '<button onclick="sendRelRequest(\''+to.id+'\'); closeBizForce();" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold">📤 REQUEST भेजो</button>'+
  '</div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
function openMemberProfile(id){
 const m = membersData.find(x=>x.id===id); if(!m) return;
 const box = document.getElementById('bizModalBox');
 const rels = relOf(m), frs = friendsOf(m);
 const isMe = currentUser===m.phone;
 box.innerHTML =
  (m.profile_pic?'<img src="'+m.profile_pic+'" class="w-full h-56 object-cover rounded-t-2xl">':'<div class="w-full h-28 bg-blue-100 flex items-center justify-center text-6xl rounded-t-2xl">👤</div>')+
  '<div class="p-6">'+
  '<p class="text-2xl font-bold text-blue-800">'+esc(m.name)+' '+esc(m.surname)+'</p>'+
  (profOf(m)?'<p class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mt-2">'+esc(profOf(m))+'</p>':'')+
  '<div class="mt-4 space-y-1 text-gray-700 text-sm">'+
  '<p>📱 '+esc(m.phone)+'</p>'+
  '<p>🏡 गाँव: '+esc(m.home_village||'-')+', '+esc(distOf(m,'home')||'-')+'</p>'+
  '<p>📍 वर्तमान: '+esc(m.present_city||'-')+', '+esc(distOf(m,'present')||'-')+'</p>'+
  (m.marital_status?'<p>💍 '+esc(m.marital_status)+' | Age: '+esc(m.age||'-')+'</p>':'')+
  (m.blood_group?'<p>🩸 Blood Group: <b class="text-red-600">'+esc(m.blood_group)+'</b></p>':'')+
  (m.work_details?'<p>💼 '+esc(m.work_details)+'</p>':'')+
  '</div>'+
  (m.business_name?'<button onclick="openBiz(\''+m.id+'\')" class="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold mt-3">🏪 इनका Business देखें: '+esc(m.business_name)+'</button>':'')+
  (isMe?'<button onclick="closeBizForce();openEditProfile()" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold mt-3">✏️ Edit Profile</button>':'')+
  (!isMe && currentUser ? '<div class="flex gap-2 flex-wrap mt-4"><button onclick="sendFriendRequest(\''+m.id+'\')" class="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold">➕ मित्र</button><button onclick="openRelPicker(\''+m.id+'\')" class="bg-indigo-100 text-indigo-700 border border-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold">👨‍👩‍👧 रिश्तेदार</button></div>' : '')+
  '<div class="border-t-2 pt-3 mt-4">'+
  '<p class="text-sm font-bold text-gray-700 mb-1">🙋 मित्र ('+frs.length+')</p>'+
  (frs.length?'<p class="text-sm text-gray-600 mb-3">'+frs.map(esc).join(', ')+'</p>':'<p class="text-xs text-gray-400 mb-3">अभी कोई नहीं</p>')+
  '<p class="text-sm font-bold text-gray-700 mb-1">👨‍👩‍👧 रिश्तेदार ('+rels.length+')</p>'+
  (rels.length?'<p class="text-sm text-gray-600">'+rels.map(esc).join(', ')+'</p>':'<p class="text-xs text-gray-400">अभी कोई नहीं</p>')+
  '</div>'+
  '<button onclick="closeBizForce()" class="w-full mt-5 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold">बंद करो / Close</button>'+
  '</div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
function bizMiniCard(b){
 return '<div onclick="openBiz(\''+b.id+'\')" class="w-56 shrink-0 bg-white border-2 border-yellow-300 rounded-xl overflow-hidden shadow cursor-pointer hover:shadow-xl">'+
  (b.pic?'<img src="'+b.pic+'" class="w-full h-28 object-cover">':'<div class="w-full h-20 bg-yellow-100 flex items-center justify-center text-4xl">🏪</div>')+
  '<div class="p-3"><p class="font-bold text-yellow-800 text-sm truncate">'+esc(b.name)+'</p>'+
  '<p class="text-[10px] bg-yellow-200 inline-block px-2 py-0.5 rounded font-bold mt-1 truncate max-w-full">'+esc(b.type)+'</p>'+
  '<p class="text-[11px] text-gray-600 mt-1 truncate">👤 '+esc(b.owner)+'</p>'+
  (b.place?'<p class="text-[11px] text-gray-500 truncate">📍 '+esc(b.place)+'</p>':'')+
  '</div></div>';
}

// ================= MY ACCOUNT MENU (☰ — हर page पर, अपनी सारी चीज़ें एक जगह) =================
function openMyAccountMenu(){
 if(!currentUser){ showRegisterPrompt('अपनी Profile/Business/Property वगैरह देखने के लिए पहले Register करो।'); return; }
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6">'+
  '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-blue-800">☰ मेरा अकाउंट</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
  '<div class="grid grid-cols-2 gap-3">'+
  '<button onclick="myAcc_profile()" class="bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center font-bold text-blue-800"><span class="text-2xl block mb-1">👤</span>मेरी Profile</button>'+
  '<button onclick="myAcc_business()" class="bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 text-center font-bold text-yellow-800"><span class="text-2xl block mb-1">🏪</span>मेरा Business</button>'+
  '<button onclick="myAcc_property()" class="bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 rounded-lg p-4 text-center font-bold text-purple-800"><span class="text-2xl block mb-1">🏠</span>मेरी Property</button>'+
  '<button onclick="myAcc_jobs()" class="bg-green-50 hover:bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center font-bold text-green-800"><span class="text-2xl block mb-1">💼</span>मेरे Jobs</button>'+
  '<button onclick="myAcc_rishtedaar()" class="bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-300 rounded-lg p-4 text-center font-bold text-indigo-800"><span class="text-2xl block mb-1">👨‍👩‍👧</span>मेरे रिश्तेदार</button>'+
  '<button onclick="myAcc_mitra()" class="bg-pink-50 hover:bg-pink-100 border-2 border-pink-300 rounded-lg p-4 text-center font-bold text-pink-800"><span class="text-2xl block mb-1">🙋</span>मेरे मित्र</button>'+
  '<button onclick="myAcc_referrals()" class="bg-teal-50 hover:bg-teal-100 border-2 border-teal-300 rounded-lg p-4 text-center font-bold text-teal-800"><span class="text-2xl block mb-1">🤝</span>Reference से जोड़ो</button>'+
  '</div>'+
  '<div class="border-t-2 mt-4 pt-4 grid grid-cols-1 gap-2">'+
  '<button onclick="closeBizForce();openEditProfile()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold text-sm">✏️ Edit My Profile</button>'+
  '<button onclick="closeBizForce();askAdminLogin()" class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-bold text-sm">🏛️ Admin / Sub-admin Login</button>'+
  '<button onclick="closeBizForce();doLogout()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-bold text-sm">🚪 Sign Out</button>'+
  '</div></div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
function myAcc_profile(){
 const me = myMember();
 if(!me){ closeBizForce(); showRegisterPrompt('पहले Register करो — अभी आप सिर्फ OTP से login हो, Community member नहीं बने।'); return; }
 openMemberProfile(me.id);
}
function myAcc_business(){
 const me = myMember();
 if(!me){ closeBizForce(); showRegisterPrompt('पहले Register करो।'); return; }
 const box = document.getElementById('bizModalBox');
 if(!me.business_name){
  box.innerHTML = '<div class="p-6 text-center">'+
   '<div class="flex justify-end"><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
   '<p class="text-5xl mb-3">🏪</p><p class="font-bold text-gray-700 mb-4">अभी आपने कोई Business details नहीं डाली</p>'+
   '<button onclick="closeBizForce();openEditProfile()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">✏️ Business Details जोड़ो</button>'+
   '</div>';
  document.getElementById('bizModal').classList.remove('hidden');
  return;
 }
 const b = {
  id: me.id, name: me.business_name,
  type: (me.business_type==='Other'&&me.business_type_other)?me.business_type_other:(me.business_type||'Business'),
  owner: me.name+' '+me.surname, phone: me.business_phone||me.phone, place: me.business_place||me.present_city||'',
  gmap: me.business_gmap||'', pic: me.business_pic1||'', description: me.business_details||'', ownerPhone: me.phone
 };
 box.innerHTML = bizDetailHTML(b) + bizLocationPanelHTML(me) + labhListPanelHTML(me) + bizPromoPanelHTML(me);
 document.getElementById('bizModal').classList.remove('hidden');
 if(me.biz_promo_status!=='active' && me.biz_promo_status!=='pending' && siteMeta.razorpayBizPromo){
  setTimeout(()=>mountRazorpayButton(siteMeta.razorpayBizPromo,'razorpayBizPromoBox'),30);
 }
}
// business ka lat/lng set karna — "मेरे पास सबसे नज़दीक कौन सा business है" jaise Patidar AI सवाल ke liye
function bizLocationPanelHTML(me){
 return '<div class="mx-6 mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4">'+
  (me.business_lat ?
   '<p class="text-sm font-bold text-emerald-800">📍 Location set है — Patidar AI "पास में कौन सा business" जैसे सवाल में आपको दिखा सकता है</p>' :
   '<p class="text-sm text-gray-600 mb-2">आपके business की location set नहीं है — set करने पर Patidar AI "मेरे पास कौन सा business है" जैसे सवालों में आपको दिखा पाएगा</p>'+
   '<button onclick="geocodeMyBusiness()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm">📍 Location सेट करो</button>')+
  '</div>';
}
async function geocodeMyBusiness(){
 const me = myMember(); if(!me) return;
 const place = me.business_place || me.present_city || '';
 if(!place){ alert('❌ पहले Business Address भरो (Edit Profile से)।'); return; }
 busy(true);
 const out = await fetch(GEOCODE_VILLAGE_URL+'?village='+encodeURIComponent(place)+'&district='+encodeURIComponent(me.present_district||'')).then(r=>r.json()).catch(()=>({}));
 busy(false);
 if(!out.lat){ alert('❌ Location नहीं मिली — कुछ देर बाद फिर try करो।'); return; }
 await updDoc('members', me.id, {business_lat: out.lat, business_lng: out.lng});
 alert('✅ Location set हो गई!');
 myAcc_business();
}
function labhListPanelHTML(me){
 const active = labhActiveReceivedBy(me.phone);
 const list = active.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
 let h = '<div class="mx-6 mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">'+
  '<p class="font-bold text-yellow-800 mb-1">🏅 आपको मिले लाभ ('+active.length+')</p>';
 if(active.length){
  h += '<p class="text-sm text-green-700 font-bold mb-3">₹'+active.length+' discount अगली Business Promotion Renewal पर</p>'+
   '<div class="space-y-1.5 max-h-40 overflow-y-auto">'+list.map(l =>
    '<div class="flex justify-between items-center bg-white rounded px-3 py-1.5 text-sm"><span>'+esc(l.fromName)+'</span><span class="text-xs text-gray-400">'+esc(l.createdAt)+'</span></div>'
   ).join('')+'</div>';
 } else {
  h += '<p class="text-xs text-gray-500">अभी किसी ने लाभ नहीं दिया — जब कोई deal के बाद "मुझे लाभ मिला" दबाएगा, यहाँ दिखेगा</p>';
 }
 h += '<div class="flex items-center gap-2 mt-3 pt-3 border-t border-yellow-200">'+
  '<div class="flex-1 h-1.5 rounded-full bg-yellow-200 overflow-hidden"><div class="h-full bg-yellow-500" style="width:'+(labhReceivedToday(me.phone)*10)+'%"></div></div>'+
  '<span class="text-[10px] font-bold text-yellow-700">आज मिले '+labhReceivedToday(me.phone)+'/'+LABH_DAILY_LIMIT+'</span></div>';
 h += '</div>';
 return h;
}
function bizPromoPanelHTML(me){
 const fee = siteMeta.bizPromoFee||'300', days = siteMeta.bizPromoValidityDays||365;
 if(me.biz_promo_status==='active' && (me.biz_promo_until||'0000-00-00')>=today()){
  return '<div class="mx-6 mb-6 bg-orange-50 border-2 border-orange-400 rounded-lg p-4 text-center"><p class="font-bold text-orange-800">🚀 आपका Business अभी Promoted है</p><p class="text-xs text-orange-600 mt-1">Valid until: '+esc(me.biz_promo_until)+'</p></div>';
 }
 if(me.biz_promo_status==='pending'){
  return '<div class="mx-6 mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center"><p class="font-bold text-yellow-800">⏳ Promotion Request Pending</p><p class="text-xs text-yellow-600 mt-1">Admin payment confirm करते ही Promote कर देगा</p></div>';
 }
 return '<div class="mx-6 mb-6 bg-orange-50 border-2 border-orange-300 rounded-lg p-4">'+
  '<p class="font-bold text-orange-800 mb-1">🚀 अपना Business Promote करो</p>'+
  '<p class="text-xs text-gray-500 mb-2">आपका Business list में free में already दिखता है — Promote करने पर सबसे ऊपर, सबसे पहले दिखेगा</p>'+
  '<p class="text-xs text-gray-600 mb-3 font-bold">₹'+esc(fee)+' / '+(days>=365?Math.round(days/365)+' साल':days+' दिन')+'</p>'+
  (siteMeta.razorpayBizPromo?'<div id="razorpayBizPromoBox" class="flex justify-center mb-3"></div>':'<p class="text-xs text-gray-400 mb-3">💳 Payment button जल्द चालू होगा — तब तक Admin से बात करो: '+CONTACT_PHONE+'</p>')+
  referrerSelectHTML('bp_ref')+
  '<button onclick="submitBizPromo()" class="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold">✅ Payment के बाद यहाँ Confirm करो</button>'+
  '</div>';
}
async function submitBizPromo(){
 const me = myMember(); if(!me) return;
 const ref = document.getElementById('bp_ref').value;
 busy(true);
 await db.collection('members').doc(me.id).update({biz_promo_status:'pending', biz_promo_referredBy:ref, biz_promo_requestedAt:today()});
 busy(false);
 alert('✅ Request भेज दी! Payment confirm होते ही Admin आपका Business Promote कर देगा।');
 closeBizForce();
}
function myAcc_property(){
 const me = myMember();
 if(!me){ closeBizForce(); showRegisterPrompt('पहले Register करो।'); return; }
 const mine = propertyData.filter(p => p.phone===me.phone && p.status!=='rejected');
 const box = document.getElementById('bizModalBox');
 if(!mine.length){
  box.innerHTML = '<div class="p-6 text-center">'+
   '<div class="flex justify-end"><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
   '<p class="text-5xl mb-3">🏠</p><p class="font-bold text-gray-700 mb-4">अभी आपकी कोई Property Listing नहीं है</p>'+
   '<button onclick="closeBizForce();goPage(\'property\')" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold">➕ Listing डालो</button>'+
   '</div>';
 } else {
  box.innerHTML = '<div class="p-6">'+
   '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-purple-800">🏠 मेरी Property</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
   mine.map(p => '<div class="border-2 border-purple-300 rounded-lg p-4 mb-3">'+
    '<p class="font-bold">'+(p.kind==='dukan'?'🏪 दुकान':'🏠 मकान')+' - '+esc(p.name)+'</p>'+
    '<p class="text-sm text-gray-600">📍 '+esc(p.area)+(p.rent?' | ₹'+esc(p.rent)+'/माह':'')+'</p>'+
    '<p class="text-xs mt-1 font-bold '+(p.status==='approved'?(p.active!==false?'text-green-600':'text-gray-500'):'text-yellow-600')+'">'+(p.status==='approved'?(p.active!==false?'✅ Live':'⏸️ Inactive'):'⏳ Admin Approval बाकी')+'</p>'+
    '<p class="text-xs text-gray-400 mt-1">🔑 Code: '+esc(p.code||'-')+'</p></div>'
   ).join('')+
   '<button onclick="closeBizForce()" class="w-full mt-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold">बंद करो / Close</button></div>';
 }
 document.getElementById('bizModal').classList.remove('hidden');
}
function myAcc_jobs(){
 const me = myMember();
 if(!me){ closeBizForce(); showRegisterPrompt('पहले Register करो।'); return; }
 const mine = jobsData.filter(j => j.phone===me.phone);
 const box = document.getElementById('bizModalBox');
 const kindLabel = k => ({dena:'💼 रोज़गार देना है', lena:'🙋 रोज़गार चाहिए', freelance:'💻 Freelancing', freelance_dena:'💻 Freelancing देना है', freelance_lena:'🙋‍♂️ Freelancing चाहिए'}[k]||k);
 if(!mine.length){
  box.innerHTML = '<div class="p-6 text-center">'+
   '<div class="flex justify-end"><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
   '<p class="text-5xl mb-3">💼</p><p class="font-bold text-gray-700 mb-4">अभी आपकी कोई Job/Freelancing post नहीं है</p>'+
   '<button onclick="closeBizForce();goPage(\'rozgaar\')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">➕ Post करो</button>'+
   '</div>';
 } else {
  box.innerHTML = '<div class="p-6">'+
   '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-green-800">💼 मेरे Jobs</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
   mine.map(j => '<div class="border-2 border-green-300 rounded-lg p-4 mb-3">'+
    '<p class="font-bold">'+esc(j.title)+'</p>'+
    '<p class="text-xs text-gray-500">'+kindLabel(j.kind)+'</p>'+
    '<p class="text-xs mt-1 font-bold '+(j.status==='approved'?'text-green-600':'text-yellow-600')+'">'+(j.status==='approved'?'✅ Live':'⏳ Admin Approval बाकी')+'</p></div>'
   ).join('')+
   '<button onclick="closeBizForce()" class="w-full mt-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold">बंद करो / Close</button></div>';
 }
 document.getElementById('bizModal').classList.remove('hidden');
}
function myAcc_rishtedaar(){
 const me = myMember();
 if(!me){ closeBizForce(); showRegisterPrompt('पहले Register करो।'); return; }
 const pending = relativesData.filter(r => r.toPhone===me.phone && r.status==='pending');
 const sent = relativesData.filter(r => r.fromPhone===me.phone && r.status==='pending');
 const accepted = relativesData.filter(r => r.status==='approved' && (r.fromPhone===me.phone||r.toPhone===me.phone));
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6">'+
  '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-indigo-800">👨‍👩‍👧 मेरे रिश्तेदार</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
  (pending.length?('<p class="font-bold text-indigo-700 text-sm mb-2">🔔 Pending Requests</p>'+pending.map(r=>
   '<div class="bg-indigo-50 border border-indigo-300 rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm">'+esc(r.fromName)+' ने आपको <b>'+esc(r.relation)+'</b> बताया है</p>'+
   '<div class="flex gap-2"><button onclick="respondRel(\''+r.id+'\',true);closeBizForce()" class="bg-green-600 text-white w-9 h-9 rounded-full font-bold">✔️</button><button onclick="respondRel(\''+r.id+'\',false);closeBizForce()" class="bg-red-500 text-white w-9 h-9 rounded-full font-bold">✖️</button></div></div>'
  ).join('')):'')+
  (sent.length?('<p class="font-bold text-gray-600 text-sm mt-3 mb-2">📤 भेजी हुई (waiting)</p>'+sent.map(r=>'<p class="text-sm text-gray-600 mb-1">'+esc(r.toName)+' — '+esc(r.relation)+'</p>').join('')):'')+
  '<p class="font-bold text-gray-700 text-sm mt-3 mb-2">👨‍👩‍👧 List ('+accepted.length+')</p>'+
  (accepted.length?accepted.map(r=>'<p class="text-sm text-gray-600 mb-1">'+esc(r.fromPhone===me.phone?(r.toName+' ('+r.relation.split('/')[0].trim()+')'):(r.fromName+' ('+r.relation.split('/')[0].trim()+')'))+'</p>').join(''):'<p class="text-xs text-gray-400">अभी कोई नहीं</p>')+
  '<button onclick="closeBizForce()" class="w-full mt-4 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold">बंद करो / Close</button></div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
function myAcc_mitra(){
 const me = myMember();
 if(!me){ closeBizForce(); showRegisterPrompt('पहले Register करो।'); return; }
 const pending = friendsData.filter(f => f.toPhone===me.phone && f.status==='pending');
 const sent = friendsData.filter(f => f.fromPhone===me.phone && f.status==='pending');
 const accepted = friendsData.filter(f => f.status==='approved' && (f.fromPhone===me.phone||f.toPhone===me.phone));
 const box = document.getElementById('bizModalBox');
 box.innerHTML = '<div class="p-6">'+
  '<div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-pink-800">🙋 मेरे मित्र</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>'+
  (pending.length?('<p class="font-bold text-pink-700 text-sm mb-2">🔔 Pending Requests</p>'+pending.map(f=>
   '<div class="bg-pink-50 border border-pink-300 rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm">'+esc(f.fromName)+' ने Friend Request भेजी है</p>'+
   '<div class="flex gap-2"><button onclick="respondFriend(\''+f.id+'\',true);closeBizForce()" class="bg-green-600 text-white w-9 h-9 rounded-full font-bold">✔️</button><button onclick="respondFriend(\''+f.id+'\',false);closeBizForce()" class="bg-red-500 text-white w-9 h-9 rounded-full font-bold">✖️</button></div></div>'
  ).join('')):'')+
  (sent.length?('<p class="font-bold text-gray-600 text-sm mt-3 mb-2">📤 भेजी हुई (waiting)</p>'+sent.map(f=>'<p class="text-sm text-gray-600 mb-1">'+esc(f.toName)+'</p>').join('')):'')+
  '<p class="font-bold text-gray-700 text-sm mt-3 mb-2">🙋 List ('+accepted.length+')</p>'+
  (accepted.length?accepted.map(f=>'<p class="text-sm text-gray-600 mb-1">'+esc(f.fromPhone===me.phone?f.toName:f.fromName)+'</p>').join(''):'<p class="text-xs text-gray-400">अभी कोई नहीं</p>')+
  '<button onclick="closeBizForce()" class="w-full mt-4 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold">बंद करो / Close</button></div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
// ================= REFERENCE से जोड़ो (pre-approve — non-OTP आसान login) =================
function myAcc_referrals(){
 const me = myMember();
 if(!me){ closeBizForce(); showRegisterPrompt('पहले Register करो।'); return; }
 const box = document.getElementById('bizModalBox');
 const mine = referralPreapprovalsData.filter(r => r.referrerPhone===currentUser).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
 let h = '<div class="p-6">';
 h += '<div class="flex justify-between items-center mb-2"><h3 class="text-xl font-bold text-teal-800">🤝 Reference से जोड़ो</h3><button onclick="closeBizForce()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button></div>';
 h += '<p class="text-xs text-gray-500 mb-4">जिसे यहाँ pre-approve कर दोगे, वो Register page पर "Reference से Register" चुनकर बिना OTP के सीधे समाज से जुड़ सकता है।</p>';
 h += '<div class="bg-teal-50 border-2 border-teal-300 rounded-lg p-4 mb-4">';
 h += '<p class="font-bold text-teal-800 mb-2 text-sm">➕ नया व्यक्ति Pre-approve करो</p>';
 h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">'+
  '<input id="rp_name" placeholder="नाम" class="px-3 py-2 border-2 rounded">'+
  '<input id="rp_phone" placeholder="Mobile Number" maxlength="10" inputmode="numeric" class="px-3 py-2 border-2 rounded">'+
  '</div>';
 h += '<button onclick="submitPreapproval()" class="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-bold text-sm">✅ Pre-approve करो</button>';
 h += '</div>';
 if(!mine.length){
  h += '<p class="text-center text-gray-400 py-6">अभी तक किसी को pre-approve नहीं किया</p>';
 } else {
  h += '<p class="font-bold text-gray-700 text-sm mb-2">List ('+mine.length+')</p>';
  h += '<div class="space-y-2">'+mine.map(r => {
   const used = !!r.usedAt;
   return '<div class="flex items-center justify-between gap-2 bg-gray-50 border rounded-lg p-3">'+
    '<div><p class="font-bold text-sm">'+esc(r.name)+'</p><p class="text-xs text-gray-500">📱 '+esc(r.phone)+'</p>'+
    '<p class="text-xs font-bold '+(used?'text-green-600':'text-yellow-600')+'">'+(used?'✅ जुड़ गए':'⏳ Waiting')+'</p></div>'+
    '<div class="flex gap-2 shrink-0">'+
    (!used?'<a href="'+waPreapproveLink(r.name,r.phone)+'" target="_blank" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded font-bold text-xs">💬 बताओ</a>':'')+
    '<button onclick="deletePreapproval(\''+r.id+'\')" class="bg-red-100 text-red-600 px-2 py-2 rounded font-bold text-xs">🗑️</button>'+
    '</div></div>';
  }).join('')+'</div>';
 }
 h += '</div>';
 box.innerHTML = h;
 document.getElementById('bizModal').classList.remove('hidden');
}
async function submitPreapproval(){
 const me = myMember(); if(!me) return;
 const name = fmtName(document.getElementById('rp_name').value);
 const phone = fmtPhone(document.getElementById('rp_phone').value);
 if(!name){ alert('❌ नाम भरो'); return; }
 if(phone.length!==10){ alert('❌ सही 10 अंकों का Mobile Number भरो'); return; }
 if(phone===currentUser){ alert('❌ खुद को pre-approve नहीं कर सकते'); return; }
 if(membersData.find(m => m.phone===phone)){ alert('❌ यह number तो पहले से registered member है!'); return; }
 if(referralPreapprovalsData.find(r => r.referrerPhone===currentUser && r.phone===phone)){ alert('❌ इस number को आप पहले से pre-approve कर चुके हो!'); return; }
 busy(true);
 await db.collection('referral_preapprovals').add({
  referrerPhone: currentUser, referrerName: me.name+' '+me.surname, name, phone, createdAt: today(), usedAt: null
 });
 busy(false);
 myAcc_referrals();
}
function waPreapproveLink(name, phone){
 const msg = 'नमस्ते '+name+' 🙏 मैंने आपको पाटीदार समाज (PSIM) की app में approve कर दिया है — अब आप बिना OTP के सीधे समाज से जुड़ सकते हो, "Reference से Register" चुनकर:\n'+location.origin+'/#register';
 return 'https://wa.me/91'+phone+'?text='+encodeURIComponent(msg);
}
function deletePreapproval(id){ delDoc('referral_preapprovals', id, 'यह pre-approval delete करें?'); }
// हर page के नीचे चलती-फिरती business पट्टी (बिना search किए भी दिखे)
function businessStrip(){
 const biz = allBusinesses();
 if(!biz.length) return '';
 const sh = shufflePromotedFirst(biz);
 const cards = sh.map(bizMiniCard).join('');
 return '<div class="mt-10 bg-gradient-to-br from-yellow-50 to-orange-50 border-t-4 border-yellow-400 rounded-xl p-5 shadow-inner">'+
  '<h3 class="text-xl md:text-2xl font-bold text-center mb-1">🏪 पाटीदार बंधुओं के व्यापार</h3>'+
  '<p class="text-center text-gray-500 text-xs mb-4">हर बार अलग-अलग — card पर click करो, पूरी details मिलेंगी</p>'+
  '<div class="overflow-hidden"><div class="biz-track">'+cards+cards+'</div></div>'+
  '<div class="text-center mt-4"><button onclick="goPage(\'business\')" class="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold text-sm">सभी Business देखो →</button></div></div>';
}
function renderBusinessPage(){
 const list = allBusinesses();
 return '<h2 class="text-3xl font-bold mb-2">🏪 BUSINESS / व्यापार ('+list.length+')</h2>'+
 '<p class="text-gray-500 mb-4">Members की business details automatic दिखती हैं</p>'+
 patidarAIQuickLinkHTML()+
 '<button onclick="openSwipeView(\'business\')" class="w-full mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl">🔀 Businesses Explore करें</button>'+
 '<div class="flex gap-5 overflow-x-auto pb-3 noscroll">'+
 list.map(b => '<div class="w-72 shrink-0 border-2 '+(b.promoted?'border-amber-500':'bg-white border-yellow-300')+' rounded-lg overflow-hidden shadow-md hover:shadow-xl relative" '+(b.promoted?'style="background:linear-gradient(160deg,#FFF9E6,#FDE68A);"':'')+'>'+
  (b.promoted?'<span class="absolute top-2 left-2 z-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">🚀 PROMOTED</span>':'')+
  '<div onclick="openBiz(\''+b.id+'\')" class="cursor-pointer transform hover:scale-[1.01] transition-all">'+
  (b.pic?'<img src="'+b.pic+'" class="w-full h-44 object-cover">':'')+
  '<div class="p-5"><p class="font-bold text-xl text-yellow-700">'+esc(b.name)+'</p>'+
  '<p class="inline-block bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs font-bold mt-2">'+esc(b.type)+'</p>'+
  '<p class="text-sm text-gray-700 mt-3">👤 '+esc(b.owner)+'</p><p class="text-sm text-gray-700">📱 '+esc(b.phone)+'</p>'+
  (b.place?'<p class="text-sm text-gray-700">📍 '+esc(b.place)+'</p>':'')+
  (b.description?'<p class="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">'+esc(b.description)+'</p>':'')+
  (b.gmap?'<a href="'+esc(b.gmap)+'" target="_blank" onclick="event.stopPropagation()" class="block text-center mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">📍 Location देखो</a>':'')+
  '<p class="text-center text-xs text-yellow-700 font-bold mt-3">👆 पूरी details के लिए click करो</p>'+
  '</div></div>'+
  (currentUser && currentUser!==b.ownerPhone && membersData.find(x=>x.id===b.id) ?
   '<div class="px-5 pb-4 flex gap-2 flex-wrap"><button onclick="sendFriendRequest(\''+b.id+'\')" class="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold">➕ मित्र</button><button onclick="openRelPicker(\''+b.id+'\')" class="bg-indigo-100 text-indigo-700 border border-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold">👨‍👩‍👧 रिश्तेदार</button></div>' : '')+
 '</div>').join('')+'</div>';
}

// ================= GARBA =================
async function submitGarba(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Garba में register करने के लिए पहले Community member बनो।'); return; }
 const nm=fmtName(document.getElementById('gb_name').value) || (me.name+' '+me.surname);
 const age=document.getElementById('gb_age').value.trim() || (me.age||'');
 const area=document.getElementById('gb_area').value.trim();
 if(!area){ alert('❌ Indore का area/इलाका जरूरी!'); return; }
 if(garbaRegs.find(g=>g.phone===me.phone)){ alert('❌ आप पहले से register हो चुके हो!'); return; }
 busy(true);
 await db.collection('garba_regs').add({name:nm, age:age, area:area, phone:me.phone, status:'pending', createdAt:today()});
 busy(false);
 alert('✅ Registration हो गया! Admin approval के बाद confirm होगा 🪩');
 renderApp();
}
function renderGarbaPage(){
 if(!siteMeta.garbaFormOpen){
  return '<h2 class="text-3xl font-bold mb-4">🪩 NAVRAS GARBA MAHOTSAV</h2><div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-5xl mb-3">🪩</p><p class="text-lg font-bold text-gray-600">Registration अभी बंद है</p><p class="text-gray-400 text-sm mt-2">जल्द खुलेगी - Updates के लिए News page देखते रहो</p></div>';
 }
 const approved = garbaRegs.filter(g=>g.status==='approved');
 let h = '<h2 class="text-3xl font-bold mb-2">🪩 NAVRAS GARBA MAHOTSAV</h2>';
 h += '<p class="text-gray-500 mb-6">⚠️ सिर्फ Community Members ही register कर सकते हैं</p>';
 const meG = myMember();
 const already = meG && garbaRegs.find(g=>g.phone===meG.phone);
 if(already){
  h += '<div class="bg-green-100 border-2 border-green-400 rounded-lg p-5 mb-8 text-center font-bold text-green-800">✅ आप registered हो! Status: '+(already.status==='approved'?'CONFIRMED ✅':'Pending ⏳')+'</div>';
 } else {
  h += '<div class="bg-pink-50 border-2 border-pink-400 rounded-lg p-6 mb-8"><h3 class="text-xl font-bold mb-4">➕ REGISTER करो (आपकी details login से auto आएँगी)</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">आप Indore में कहाँ रहते हैं? *</label><input id="gb_area" placeholder="जैसे: Vishal Nagar" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">नाम (खाली छोड़ो = profile से)</label><input id="gb_name" value="'+esc(meG?(meG.name+' '+meG.surname):'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Age (खाली छोड़ो = profile से)</label><input id="gb_age" value="'+esc(meG?(meG.age||''):'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Number (login से auto)</label><input value="'+esc(currentUser)+'" readonly class="w-full px-3 py-2 border-2 rounded bg-gray-100 text-gray-500"></div></div>'+
  '<button onclick="submitGarba()" class="mt-4 bg-pink-600 text-white px-8 py-3 rounded-lg font-bold">✅ REGISTER करो</button></div>';
 }



 if(garbaCoords.length){
  h += '<div class="bg-white rounded-lg shadow-lg p-6 mb-8"><h3 class="text-xl font-bold mb-1">📍 Area Coordinators</h3><p class="text-sm text-gray-500 mb-4">अपने area के coordinator से सीधे बात करो</p><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  garbaCoords.map(c => '<div class="bg-pink-50 border-2 border-pink-300 rounded-xl p-4"><p class="font-bold text-pink-800">📍 '+esc(c.area)+'</p><p class="text-sm text-gray-700 mt-1">'+esc(c.name)+'</p>'+
   '<div class="flex gap-2 mt-3"><a href="tel:'+c.phone+'" class="flex-1 text-center bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-bold">📞 Call</a>'+
   '<a href="https://wa.me/91'+c.phone+'" target="_blank" class="flex-1 text-center bg-green-500 text-white rounded-lg px-3 py-2 text-sm font-bold">💬 WhatsApp</a></div></div>').join('')+'</div></div>';
 }
 if(garbaTeam.length){
  h += '<div class="bg-white rounded-lg shadow-lg p-6"><h3 class="text-xl font-bold mb-4">👥 हमारी Garba Team</h3><div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
  garbaTeam.map(t => '<div class="bg-pink-50 border-2 border-pink-300 rounded-xl p-4 text-center">'+
   (t.pic?'<img src="'+t.pic+'" class="h-16 w-16 object-cover rounded-full mx-auto mb-2 border-2 border-pink-300">':'<p class="text-3xl mb-2">🪩</p>')+
   '<p class="font-bold text-sm">'+esc(t.name)+'</p><p class="text-xs text-pink-700">'+esc(t.role||'')+'</p>'+
   '<a href="tel:'+t.phone+'" class="block mt-2 bg-green-600 text-white rounded px-2 py-1 text-xs font-bold">📞 '+esc(t.phone)+'</a></div>').join('')+'</div></div>';
 }
 return h;
}

// ================= CRICKET =================
async function joinCricket(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Cricket list में जुड़ने के लिए पहले Community member बनो।'); return; }
 if(cricketData.find(c=>c.phone===me.phone)){ alert('❌ आप पहले से list में हो!'); return; }
 busy(true);
 await db.collection('cricket').add({name:me.name+' '+me.surname, age:me.age||'', area:me.present_city||me.home_village||'', phone:me.phone, createdAt:today()});
 busy(false);
 alert('🏏 Hello '+esc(me.name)+'!\n\nआपका नाम Cricket टीम तक पहुंच गया है। जब भी Cricket का आयोजन होगा, आपको सूचना मिल जाएगी।\n\nThank you 🙏');
 renderApp();
}
function renderCricketPage(){
 const list = cricketData.slice().sort((a,b)=>a.name.localeCompare(b.name));
 let h = '<h2 class="text-3xl font-bold mb-2">🏏 CRICKET - Indore</h2>';
 h += '<p class="text-gray-500 mb-6">⚠️ सिर्फ Community Members - अपना number डालो, बाकी details अपने आप आ जाएंगी</p>';
 const meC = myMember();
 const inList = meC && cricketData.find(c=>c.phone===meC.phone);
 h += '<div class="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-8 text-center">';
 h += '<p class="text-4xl mb-3">🏏</p>';
 if(inList){
  h += '<p class="font-bold text-green-700 text-lg">✅ आप interested list में हो!</p>';
 } else {
  h += '<p class="text-sm text-gray-500 mb-3">बस 1 click - आपकी details profile से अपने आप आ जाएँगी</p>';
  h += '<button onclick="joinCricket()" class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg">🏏 मुझे खेलना है / I\'m Interested</button>';
 }
 h += '</div>';

 return h;
}

// ================= BLOOD =================
let bloodFilterGroup='', bloodFilterDist='', bloodFilterVillage='';
let showBloodSOSForm=false;
function allDonors(){
 const fromMembers = publicMembers()
  .filter(m => m.blood_group && (!m.blood_donor || m.blood_donor.indexOf('हाँ')===0))
  .map(m => ({name:m.name+' '+m.surname, blood_group:m.blood_group, phone:m.phone, district:distOf(m,'present')||distOf(m,'home')||'', village:m.home_village||m.present_city||''}));
 const seen = {};
 const merged = [];
 bloodData.concat(fromMembers).forEach(d => { if(!seen[d.phone]){ seen[d.phone]=1; merged.push(d); } });
 return merged;
}
// ================= 🆘 BLOOD EMERGENCY SOS =================
function activeBloodSOS(){ return bloodSosData.filter(s=>s.status!=='resolved').sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')); }
async function submitBloodSOS(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('SOS post करने के लिए पहले Community member बनो।'); return; }
 const bloodGroup = document.getElementById('sos_group').value;
 const hospital = document.getElementById('sos_hospital').value.trim();
 const city = document.getElementById('sos_city').value.trim();
 const contactPhone = fmtPhone(document.getElementById('sos_phone').value) || me.phone;
 const note = document.getElementById('sos_note').value.trim();
 if(!bloodGroup || !hospital){ alert('❌ Blood Group और Hospital जरूरी!'); return; }
 busy(true);
 await db.collection('blood_sos').add({fromPhone:me.phone, fromName:me.name+' '+me.surname, bloodGroup, hospital, city, contactPhone, note, status:'active', createdAt:today()});
 busy(false); showBloodSOSForm=false;
 alert('🆘 SOS post हो गई! Home page और Blood page पर सबको दिखेगी।');
 renderApp();
}
async function resolveBloodSOS(id){
 if(!confirm('✅ Blood मिल गया — SOS बंद करें?')) return;
 await updDoc('blood_sos', id, {status:'resolved'});
}
function bloodSOSCard(s, matchCount){
 return '<div class="bg-white border-2 border-red-500 rounded-lg p-4 shadow-md">'+
 '<div class="flex justify-between items-start gap-2 flex-wrap"><div>'+
 '<p class="text-2xl font-bold text-red-600">🆘 '+esc(s.bloodGroup)+' चाहिए</p>'+
 '<p class="text-sm text-gray-700 mt-1">🏥 '+esc(s.hospital)+(s.city?' | 📍 '+esc(s.city):'')+'</p>'+
 (s.note?'<p class="text-sm text-gray-600 mt-1">'+esc(s.note)+'</p>':'')+
 '<p class="text-xs text-gray-400 mt-1">पूछा: '+esc(s.fromName)+' | '+esc(s.createdAt||'')+(matchCount!=null?' | 🩸 '+matchCount+' matching donors':'')+'</p>'+
 '</div><div class="flex flex-col gap-2 shrink-0">'+
 '<a href="tel:'+esc(s.contactPhone)+'" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm text-center">📞 Call करो</a>'+
 ((currentUser===s.fromPhone||isAdmin())?'<button onclick="resolveBloodSOS(\''+s.id+'\')" class="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold text-sm">✅ मिल गया</button>':'')+
 '</div></div></div>';
}
function renderBloodPage(){
 const villQ = bloodFilterVillage.trim().toLowerCase();
 const filtered = allDonors().filter(m => (!bloodFilterGroup || m.blood_group===bloodFilterGroup) && (!bloodFilterDist || m.district===bloodFilterDist) && (!villQ || (m.village||'').toLowerCase().includes(villQ)));
 let h = '<h2 class="text-3xl font-bold mb-2">🩸 BLOOD DONORS / रक्तदाता ('+filtered.length+')</h2>';
 h += '<p class="text-gray-500 mb-4">गाँव/तहसील, District और Group से खोजो — सीधे Call या WhatsApp पर अनुरोध करो | Donors समाज द्वारा verified ✅</p>';
 h += patidarAIQuickLinkHTML();

 const activeSOS = activeBloodSOS();
 h += '<div class="bg-red-50 border-2 border-red-600 rounded-xl p-5 mb-6">';
 h += '<div class="flex justify-between items-center flex-wrap gap-2 mb-3"><h3 class="text-xl font-bold text-red-700">🆘 Emergency SOS ('+activeSOS.length+')</h3>'+
 '<button onclick="showBloodSOSForm=!showBloodSOSForm;renderApp()" class="bg-red-600 text-white px-5 py-2 rounded-lg font-bold text-sm">🆘 URGENT चाहिए — SOS Post करो</button></div>';
 if(showBloodSOSForm){
  h += '<div class="bg-white border-2 border-red-400 rounded-lg p-4 mb-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  '<select id="sos_group" class="px-3 py-2 border-2 rounded"><option value="">-- Blood Group --</option>'+BLOOD_GROUPS.map(g=>'<option>'+g+'</option>').join('')+'</select>'+
  '<input id="sos_hospital" placeholder="Hospital का नाम *" class="px-3 py-2 border-2 rounded">'+
  '<input id="sos_city" placeholder="शहर/इलाका" class="px-3 py-2 border-2 rounded">'+
  '<input id="sos_phone" maxlength="10" placeholder="Contact Phone (खाली छोड़ो तो अपना ही जाएगा)" class="px-3 py-2 border-2 rounded">'+
  '<div class="md:col-span-2"><textarea id="sos_note" rows="2" placeholder="Details (कितने units, कब तक चाहिए...)" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<button onclick="submitBloodSOS()" class="mt-3 bg-red-600 text-white px-6 py-2 rounded-lg font-bold">🆘 POST करो</button></div>';
 }
 if(activeSOS.length){
  h += '<div class="space-y-3">'+activeSOS.map(s=>bloodSOSCard(s, allDonors().filter(d=>d.blood_group===s.bloodGroup).length)).join('')+'</div>';
 } else {
  h += '<p class="text-sm text-gray-500">अभी कोई urgent request नहीं है 🙏</p>';
 }
 h += '</div>';
 h += '<div class="bg-white rounded-lg shadow p-5 mb-6 flex flex-wrap gap-3">';
 h += '<input type="text" value="'+esc(bloodFilterVillage)+'" oninput="bloodFilterVillage=this.value;renderApp()" placeholder="🏡 अपना गाँव/तहसील खुद डालो" class="px-3 py-2 border-2 rounded flex-1 min-w-[180px]">';
 h += '<select onchange="bloodFilterDist=this.value;renderApp()" class="px-3 py-2 border-2 rounded"><option value="">सभी District</option>'+MP_DISTRICTS.map(d=>'<option '+(d===bloodFilterDist?'selected':'')+'>'+d+'</option>').join('')+'</select>';
 h += '<select onchange="bloodFilterGroup=this.value;renderApp()" class="px-3 py-2 border-2 rounded"><option value="">सभी Blood Group</option>'+BLOOD_GROUPS.map(g=>'<option '+(g===bloodFilterGroup?'selected':'')+'>'+g+'</option>').join('')+'</select>';
 h += '</div>';
 const meB = myMember();
 if(meB){
  h += '<div class="bg-red-50 border-2 border-red-300 rounded-lg p-5 mb-6">'+
   '<p class="font-bold text-red-800 mb-1">🩸 अपना Blood Group डालो — नाम अपने आप नीचे की list में आ जाएगा</p>'+
   '<p class="text-xs text-gray-600 mb-3">'+esc(meB.name+' '+meB.surname)+' | 📱 '+esc(meB.phone)+'</p>'+
   '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'+
   '<select id="myBloodGroup" class="px-3 py-2 border-2 rounded"><option value="">-- Blood Group चुनो --</option>'+BLOOD_GROUPS.map(g=>'<option '+(g===(meB.blood_group||'')?'selected':'')+'>'+g+'</option>').join('')+'</select>'+
   '<select id="myBloodDonor" class="px-3 py-2 border-2 rounded">'+['हाँ / Yes','नहीं / No'].map(g=>'<option '+(g===(meB.blood_donor||'')?'selected':'')+'>'+g+'</option>').join('')+'</select>'+
   '<button onclick="setMyBlood()" class="bg-red-600 text-white px-4 py-2 rounded font-bold">✅ SAVE</button></div></div>';
 } else {
  h += '<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-center text-sm">🩸 Donor बनना चाहते हो? पहले Community में register करो — Blood Group भरते ही नाम list में आ जाएगा। Admin: <b>'+CONTACT_PHONE+'</b></div>';
 }
 if(!filtered.length){
  h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🩸</p><p class="text-lg font-bold text-gray-600">कोई donor नहीं मिला</p></div>';
 } else {
  BLOOD_GROUPS.forEach(gr => {
   const grp = filtered.filter(d => d.blood_group === gr);
   if(!grp.length) return;
   h += '<h3 class="text-2xl font-bold text-red-700 mt-6 mb-3">🩸 '+gr+' ('+grp.length+')</h3>';
   h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'+grp.map(m =>
    '<div class="bg-white border-2 border-red-300 rounded-lg p-5 shadow-md"><div class="flex justify-between items-start gap-2"><div><p class="font-bold text-lg">'+esc(m.name)+'</p>'+
    '<p class="text-2xl font-bold text-red-600 my-1">'+esc(m.blood_group)+'</p>'+
    '<p class="text-sm text-gray-600">📍 '+esc(m.village?m.village+', ':'')+esc(m.district||'-')+'</p></div>'+
    '<div class="flex flex-col gap-2 shrink-0"><a href="tel:'+m.phone+'" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm text-center">📞 Call</a>'+
    '<a href="https://wa.me/91'+m.phone+'?text='+encodeURIComponent('🩸 नमस्ते, मुझे आपकी '+m.blood_group+' Blood Group की जरूरत है। क्या आप रक्तदान के लिए उपलब्ध हैं? — पाटीदार समाज इंदौर महानगर')+'" target="_blank" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm text-center">💬 अनुरोध</a></div></div></div>').join('')+'</div>';
  });
 }
 return h;
}

// ================= 🕯️ शोक समाचार (Obituaries — सिर्फ Admin/Sub-admin post करते हैं) =================
let showObitForm=false;
function recentObituaries(days){
 const cutoff = new Date(Date.now() - (days||14)*86400000).toISOString().slice(0,10);
 return obituariesData.filter(o => (o.createdAt||'') >= cutoff);
}
async function submitObituaryAdmin(){
 const name = fmtName(_v('ob_name'));
 const age = _v('ob_age');
 const place = _v('ob_place');
 const deathDate = _v('ob_date');
 const pic = _v('ob_pic');
 const message = _v('ob_message');
 if(!name){ alert('❌ नाम जरूरी!'); return; }
 busy(true);
 await db.collection('obituaries').add({name, age, place, deathDate, pic, message, createdAt:today()});
 busy(false); showObitForm=false;
 alert('🕯️ शोक समाचार post हो गया।');
 renderApp();
}
function obituaryCard(o){
 return '<div class="bg-gray-100 border-2 border-gray-400 rounded-lg p-4 flex gap-4 items-start">'+
 (o.pic?'<img src="'+o.pic+'" class="h-20 w-20 object-cover rounded-full border-2 border-gray-400 shrink-0">':'<div class="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center text-3xl shrink-0">🕯️</div>')+
 '<div><p class="font-bold text-lg text-gray-800">'+esc(o.name)+(o.age?' ('+esc(o.age)+')':'')+'</p>'+
 (o.place||o.deathDate?'<p class="text-sm text-gray-600">'+esc(o.place||'')+(o.deathDate?' | '+esc(o.deathDate):'')+'</p>':'')+
 (o.message?'<p class="text-sm text-gray-700 mt-2 whitespace-pre-line">'+esc(o.message)+'</p>':'')+
 '</div></div>';
}
function renderObituariesPage(){
 let h = '<h2 class="text-3xl font-bold mb-2 text-gray-800">🕯️ शोक समाचार</h2>';
 h += '<p class="text-gray-500 mb-6">समाज के दिवंगत सदस्यों को श्रद्धांजलि</p>';
 if(!obituariesData.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🕯️</p><p class="text-lg font-bold text-gray-600">अभी कोई सूचना नहीं है</p></div>';
 else h += '<div class="space-y-4">'+obituariesData.map(obituaryCard).join('')+'</div>';
 return h;
}

// ================= 🏡 मेरे गाँव ले चलो =================
let selectedGaanv = '';
let showVillageDescForm = false;
function uniqueVillageCount(){
 return new Set(publicMembers().map(m=>fmtName(m.home_village)).filter(Boolean)).size;
}
function villageList(){
 const counts = {};
 publicMembers().forEach(m=>{ const v=fmtName(m.home_village); if(v) counts[v]=(counts[v]||0)+1; });
 return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));
}
function setGaanv(v){ selectedGaanv = fmtName(v); showVillageDescForm=false; renderApp(); window.scrollTo(0,0); }
function villageInfoFor(v){ return villageInfoData.find(x=>fmtName(x.village)===fmtName(v)); }
async function saveVillageDescription(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Description जोड़ने के लिए पहले Community member बनो।'); return; }
 const desc = document.getElementById('vg_desc').value.trim();
 if(!desc){ alert('❌ कुछ तो लिखो!'); return; }
 const existing = villageInfoFor(selectedGaanv);
 busy(true);
 if(existing) await db.collection('village_info').doc(existing.id).update({description:desc, updatedAt:today(), updatedBy:me.phone});
 else await db.collection('village_info').add({village:selectedGaanv, description:desc, addedBy:me.phone, createdAt:today()});
 busy(false); showVillageDescForm=false;
 alert('✅ Description save हो गई!');
 renderApp();
}
function renderMereGaanvPage(){
 let h = '<h2 class="text-3xl font-bold mb-2">🏡 मेरे गाँव ले चलो</h2>';
 h += '<p class="text-gray-500 mb-6">अपने गाँव की पूरी जानकारी — कौन-कौन है, क्या-क्या व्यापार है, सब एक जगह</p>';

 if(!selectedGaanv){
  h += '<div class="bg-white rounded-lg shadow p-5 mb-6"><div class="flex gap-2">'+
   '<input id="vg_search" list="dl_villages" placeholder="गाँव का नाम खोजो..." class="flex-1 px-3 py-2 border-2 rounded">'+
   '<button onclick="setGaanv(document.getElementById(\'vg_search\').value)" class="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold">ले चलो →</button>'+
   '</div></div>';
  const list = villageList();
  if(!list.length) h += '<p class="text-gray-500 text-center py-8">अभी कोई गाँव data में नहीं है</p>';
  else {
   h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">'+list.map(v=>
    '<div onclick="setGaanv(\''+esc(v.name).replace(/'/g,"\\'")+'\')" class="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-4 text-center cursor-pointer shadow hover:shadow-xl transform hover:scale-105 transition-all"><p class="font-bold truncate">'+bilingualHTML(v.name, translitLookup(v.name,'en2hi'))+'</p><p class="text-xs text-emerald-100 mt-1">'+v.count+' सदस्य</p></div>'
   ).join('')+'</div>';
  }
  return h;
 }

 const members = publicMembers().filter(m=>fmtName(m.home_village)===selectedGaanv);
 const businesses = shufflePromotedFirst(allBusinesses().filter(b=>fmtName(b.village)===selectedGaanv));
 const info = villageInfoFor(selectedGaanv);
 const hi = translitLookup(selectedGaanv, 'en2hi');

 h += '<button onclick="selectedGaanv=\'\';renderApp()" class="mb-4 bg-gray-200 px-4 py-2 rounded-lg font-bold text-sm">← दूसरा गाँव चुनो</button>';
 h += '<div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg p-6 mb-6">';
 h += '<h3 class="text-3xl font-bold mb-2">🏡 '+bilingualHTML(selectedGaanv, hi)+'</h3>';
 h += '<p class="text-emerald-100">👥 '+members.length+' सदस्य | 🏪 '+businesses.length+' व्यापार</p>';
 h += (info && info.lat) ?
  '<p class="text-emerald-100 text-xs mt-2">📍 Location set है — Patidar AI से distance जैसे सवाल पूछ सकते हो</p>' :
  '<button onclick="geocodeThisVillage()" class="mt-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full">📍 Location सेट करो</button>';
 h += '</div>';

 h += '<div class="bg-white rounded-lg shadow p-6 mb-6"><div class="flex justify-between items-center mb-2"><h3 class="text-lg font-bold">📝 गाँव के बारे में</h3><button onclick="showVillageDescForm=!showVillageDescForm;renderApp()" class="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">✏️ '+(info?'Edit करो':'Add करो')+'</button></div>';
 if(showVillageDescForm){
  h += '<textarea id="vg_desc" rows="3" placeholder="गाँव के बारे में लिखो..." class="w-full px-3 py-2 border-2 rounded mb-2">'+esc(info?info.description:'')+'</textarea>'+
  '<button onclick="saveVillageDescription()" class="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm">✅ Save</button>';
 } else {
  h += info ? '<p class="text-gray-700 whitespace-pre-line">'+esc(info.description)+'</p>' : '<p class="text-gray-400 text-sm">अभी कोई description नहीं है — पहला बनने वाले बनो!</p>';
 }
 h += '</div>';

 h += '<h3 class="text-2xl font-bold mb-3">🏪 यहाँ के व्यापार</h3>';
 if(!businesses.length) h += '<p class="text-gray-400 text-sm mb-6">अभी कोई business list नहीं है</p>';
 else h += '<div class="flex gap-3 overflow-x-auto pb-2 noscroll mb-6">'+businesses.map(b=>b.promoted?promoBizCardHTML(b):bizMiniCard(b)).join('')+'</div>';

 h += '<h3 class="text-2xl font-bold mb-3">👥 यहाँ के सदस्य ('+members.length+')</h3>';
 if(!members.length) h += '<p class="text-gray-400 text-sm">अभी कोई member नहीं है इस गाँव से</p>';
 else h += '<div class="flex gap-4 overflow-x-auto pb-2 noscroll">'+members.map(memberCard).join('')+'</div>';

 return h;
}
// गाँव का lat/lng सेट करना — बिना coordinates के "दो गाँव के बीच distance" जैसे सवाल Patidar AI जवाब नहीं दे सकता
async function geocodeThisVillage(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Location set करने के लिए पहले Community member बनो।'); return; }
 const ref = publicMembers().find(m=>fmtName(m.home_village)===selectedGaanv);
 const district = ref ? (ref.home_district||'') : '';
 busy(true);
 try{
  const resp = await fetch(GEOCODE_VILLAGE_URL+'?village='+encodeURIComponent(selectedGaanv)+'&district='+encodeURIComponent(district));
  const out = await resp.json().catch(()=>({}));
  busy(false);
  if(!out.lat){ alert('❌ Location नहीं मिली — कुछ देर बाद फिर try करो।'); return; }
  const existing = villageInfoFor(selectedGaanv);
  if(existing) await db.collection('village_info').doc(existing.id).update({lat:out.lat, lng:out.lng});
  else await db.collection('village_info').add({village:selectedGaanv, description:'', lat:out.lat, lng:out.lng, addedBy:me.phone, createdAt:today()});
  alert('✅ Location set हो गई!');
  renderApp();
 } catch(e){
  busy(false);
  alert('❌ Network error: '+e.message);
 }
}
// किसी bhi listing (hospital/dharamshala/business) ka lat/lng background me set karna — best-effort,
// fail ho to chup-chaap skip (submission ruknी nahi chahiye geocoding ki wajah se). Isi se "nearest X"
// jaise Patidar AI सवाल jawaab de paate hain.
async function geocodeAndAttach(col, docId, place, district){
 if(!place) return;
 try{
  const resp = await fetch(GEOCODE_VILLAGE_URL+'?village='+encodeURIComponent(place)+'&district='+encodeURIComponent(district||''));
  const out = await resp.json().catch(()=>({}));
  if(out.lat) await db.collection(col).doc(docId).update({lat:out.lat, lng:out.lng});
 } catch(e){ /* silent — geocoding optional hai */ }
}

// ================= 👨‍🌾 PATIDAR AI (मौजूदा search को conversational बनाना — कोई paid LLM नहीं, 100% free) =================
// Design: कोई बाहरी AI API नहीं बुलाई जाती — Community का data (business/blood/news/events/villages)
// पहले से browser में realtime listeners से load है, बस उसी पर keyword-matching + clarifying-question
// wala chhota conversation engine chalta hai. Isliye cost = ₹0 (Cloud Function bhi nahi lagti).
let aiPending = null; // {originalQuery} — jab AI ne clarifying sawaal poocha ho, agla message uska jawab माना jaata hai

const AI_GREETINGS = ['hi','hello','hey','namaste','namaskar','नमस्ते','नमस्कार','हैलो','हाय'];
const AI_DISTANCE_WORDS = ['distance','doori','दूरी','kitni door','kitna dur','kitni dur'];
const AI_BLOOD_WORDS = ['blood','khoon','रक्त','donor','donate'];
const AI_NEWS_WORDS = ['news','samachar','samachaar','खबर','समाचार'];
const AI_EVENT_WORDS = ['event','karyakram','कार्यक्रम'];
const AI_FOOD_WORDS = ['khana','khane','food','nashta','restaurant','भोजन','खाना','नाश्ता'];
const AI_NEAR_WORDS = ['nearest','sabse paas','sabse pass','paas','pass','nazdeek','najdeek','निकट','पास','नज़दीक'];
const AI_HOSPITAL_WORDS = ['hospital','aspatal','अस्पताल'];
const AI_DHARAMSHALA_WORDS = ['dharamshala','धर्मशाला'];
// Shaadi/Property jaanbhoojkar Patidar AI ke scope se bahar hain — sirf apne dedicated page par milte hain
// (Shaadi zyada sensitive/personal hai, Property allotment/ownership wali cheez hai) — AI se seedha nahi
const AI_SHAADI_WORDS = ['shaadi','shादी','विवाह','vivah','matrimony','rishta','रिश्ता'];
const AI_PROPERTY_WORDS = ['property','मकान','makan','किराए','kiraye','kirae','rent chahiye','flat chahiye'];
const AI_COUNT_TRIGGER = ['kitne','कितने','total','कुल'];
const AI_COUNT_SUBJECT = ['log','लोग','member','sadasya','सदस्य','admi','आदमी'];
// यह generative AI नहीं है (कोई bhi text खुद नहीं बनाता, सिर्फ हमारे अपने data से जवाब देता है) —
// isliye galat/obscene content "generate" karna structurally possible hi nahi hai। फिर भी, अगर कोई
// aisa sawaal type kare, respectfully mना कर देना chahiye — search logic tak jaane hi na de।
const AI_BLOCKED_WORDS = ['sex','porn','xxx','nude','nangi','chudai','रंडी','वेश्या','रेप','rape','drugs','ganja','charas','नशा','हथियार','weapon','gun','बम','bomb','kill','murder','हत्या'];
const AI_SELFHARM_WORDS = ['suicide','सुसाइड','आत्महत्या','khudkushi','खुदकुशी','जान दे'];
const AI_SYNONYMS = {
 'dr':'doctor','doc':'doctor','adv':'advocate lawyer','lawyer':'advocate legal',
 'ca':'accountant','cs':'accountant','eng':'engineer','engg':'engineer',
 'elec':'electrician electronics','electric':'electrician electronics',
 'plum':'plumber','carp':'carpenter','mistri':'mason carpenter',
 'darji':'tailor','nai':'barber salon','cook':'cook caterer restaurant food',
 'khana':'food restaurant hotel caterer khana','khane':'food restaurant hotel caterer khana',
 'nashta':'restaurant hotel food','bhukh':'food restaurant hotel caterer khana',
 'med':'medical pharmacy','medicine':'medical pharmacy','pharma':'medical pharmacy',
 'mobile':'mobile electronics','photo':'photographer','video':'videographer',
 'comp':'computer it','computer':'computer it','property':'property dealer real estate',
 'kirana':'kirana general store','grocery':'kirana general store',
 'jewel':'jewellery jeweller','sona':'jewellery jeweller','cloth':'textiles garments cloth',
 'transport':'transport logistics driver','construction':'construction builder',
 'beauty':'beauty salon','parlour':'beauty salon','auto':'automobile garage','garage':'automobile garage','mechanic':'automobile garage'
};
// Home page पर सबसे ऊपर, सबको दिखता है (guests भी) — biggest attraction है, isliye chhupana nahi।
// Chhota/compact rakha hai jaanbhoojkar — scroll na karna pade, sirf ek nazar mein attract kare aur click karaye।
// पूछने के लिए login जरूरी है — guest click kare to normal register-prompt अपने आप आ जाता है (goPage locked-page check से)।
function patidarAIHomeHeroHTML(){
 // हल्का, खेत-जैसा हरा-सुनहरा theme + हल्का circuit pattern पीछे — "गाँव वाला AI से जुड़कर smart हो गया" वाला भाव
 return '<div onclick="goPage(\'patidarai\')" class="relative overflow-hidden bg-gradient-to-br from-amber-50 via-lime-50 to-emerald-100 border-2 border-emerald-400 rounded-2xl shadow-lg px-6 py-5 mb-6 text-center cursor-pointer hover:shadow-2xl transform hover:scale-[1.01] transition-all">'+
  '<svg class="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 400 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'+
  '<path d="M20 60 H95 M95 60 V22 M95 60 V98 M305 60 H380 M305 60 V32 M305 60 V88 M150 22 H250" stroke="#047857" stroke-width="2" fill="none"/>'+
  '<circle cx="95" cy="22" r="4" fill="#047857"/><circle cx="95" cy="98" r="4" fill="#047857"/>'+
  '<circle cx="305" cy="32" r="4" fill="#047857"/><circle cx="305" cy="88" r="4" fill="#047857"/>'+
  '<circle cx="150" cy="22" r="4" fill="#047857"/><circle cx="250" cy="22" r="4" fill="#047857"/>'+
  '</svg>'+
  '<div class="relative">'+
  '<p class="text-[11px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-0.5">Welcome to</p>'+
  '<p class="text-4xl md:text-6xl font-extrabold tracking-tight mb-2 text-emerald-900">🌾👨‍🌾 PATIDAR AI</p>'+
  '<span class="inline-block bg-emerald-600 text-white font-bold text-sm px-5 py-1.5 rounded-full">'+(currentUser?'बात करो →':'🔒 Login करके पूछो →')+'</span>'+
  '</div></div>';
}
function renderPatidarAI(){
 let h = '<h2 class="text-3xl font-bold mb-2">👨‍🌾 Patidar AI</h2>';
 h += '<p class="text-gray-500 mb-1">मैं पाटीदार समाज का AI हूँ — सिर्फ पाटीदार समाज की समझ रखता हूँ, बाकी की नहीं। बाकी के लिए AI मुबारक 😄</p>';
 h += '<p class="text-gray-500 mb-1">Business/Profession, 🩸 Blood Donor, 📰 समाज की News, 📅 Events, या दो गाँव के बीच 📍 Distance — कुछ भी पूछो</p>';
 h += '<p class="text-xs text-gray-400 mb-4">⚠️ यह सिर्फ app में मौजूद data के आधार पर जवाब देता है, किसी member की personal profile नहीं देगा।</p>';
 h += '<div class="bg-white rounded-xl shadow-lg p-4 md:p-6">';
 h += '<div id="aiChatBox" class="space-y-3 mb-4 overflow-y-auto" style="max-height:50vh;">';
 if(!aiChatHistory.length){
  h += '<div class="text-center text-gray-400 py-8"><p class="text-4xl mb-2">👨‍🌾</p><p class="text-sm">नमस्ते! कुछ भी पूछो, जैसे नीचे दिए उदाहरण</p></div>';
 } else {
  h += aiChatHistory.map(aiChatBubble).join('');
  if(aiThinking) h += aiThinkingBubble();
 }
 h += '</div>';
 if(!aiChatHistory.length){
  const samples = ['इंदौर में खाने के option चाहिए','मेरे पास सबसे नज़दीक hospital कौन सा है?','O+ blood donor चाहिए'];
  h += '<div class="flex flex-wrap gap-2 mb-3">'+samples.map(s=>'<button onclick="askPatidarAISample(\''+esc(s).replace(/'/g,"\\'")+'\')" class="text-xs bg-violet-50 text-violet-700 border border-violet-300 rounded-full px-3 py-1.5 hover:bg-violet-100">'+esc(s)+'</button>').join('')+'</div>';
 }
 h += '<div class="flex gap-2">'+
  '<input id="ai_question" maxlength="300" onkeydown="if(event.key===\'Enter\'){event.preventDefault();askPatidarAI();}" placeholder="अपना सवाल लिखो..." class="flex-1 px-4 py-3 border-2 border-violet-300 rounded-lg"'+(aiThinking?' disabled':'')+'>'+
  '<button onclick="askPatidarAI()"'+(aiThinking?' disabled':'')+' class="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-3 rounded-lg font-bold">'+(aiThinking?'⏳':'भेजो →')+'</button>'+
  '</div>';
 h += '</div>';
 return h;
}
// हर AI जवाब के ऊपर एक छोटा सा लाल नारा — pre-approved list में से ही, हर बार अलग हो सकता है
const AI_NARAS = ['🚩 जय सरदार जय पाटीदार 🚩', '🚩 जय माँ अंबे 🚩', '🚩 जय माँ उमिया 🚩'];
function aiChatBubble(m){
 const mine = m.role==='user';
 let h = '';
 if(!mine) h += '<div class="flex justify-start"><div class="max-w-[85%] w-fit bg-red-600 text-white text-center text-xs font-bold py-1 px-4 rounded-md mb-1">'+aiPick(AI_NARAS)+'</div></div>';
 h += '<div class="flex '+(mine?'justify-end':'justify-start')+'">'+
  '<div class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line '+(mine?'bg-violet-600 text-white rounded-br-sm':'bg-gray-100 text-gray-800 rounded-bl-sm')+'">'+esc(m.text)+'</div></div>';
 return h;
}
function aiThinkingBubble(){
 return '<div class="flex justify-start"><div class="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-gray-100 text-gray-400">सोच रहा है...</div></div>';
}
function askPatidarAISample(q){ const inp=document.getElementById('ai_question'); if(inp){ inp.value=q; askPatidarAI(); } }
function scrollAiChatToBottom(){ setTimeout(()=>{ const box=document.getElementById('aiChatBox'); if(box) box.scrollTop = box.scrollHeight; }, 30); }
function askPatidarAI(){
 if(!currentUser){ showRegisterPrompt('Patidar AI इस्तेमाल करने के लिए पहले login करो।'); return; }
 const inp = document.getElementById('ai_question');
 const q = (inp && inp.value || '').trim();
 if(!q || aiThinking) return;
 aiChatHistory.push({role:'user', text:q});
 aiThinking = true;
 renderApp(); scrollAiChatToBottom();
 // असली network call नहीं है — chhota सा artificial pause taaki reply "socha hua" lage, ek robot jaisa turant-jawab na lage
 setTimeout(() => {
  let answer;
  if(aiPending){
   const combined = aiPending.originalQuery + ' ' + q;
   aiPending = null;
   answer = patidarAIReply(combined, 1);
  } else {
   answer = patidarAIReply(q, 0);
  }
  aiThinking = false;
  aiChatHistory.push({role:'ai', text:answer});
  renderApp(); scrollAiChatToBottom();
 }, 500);
}

// ---- Core conversation router — sab kuch sirf app ke apne data (members/business/blood/news/events/villages) se, bahar se kuch nahi ----
function patidarAIReply(qRaw, rounds){
 const q = qRaw.trim();
 const ql = q.toLowerCase();
 if(!q) return 'कुछ तो पूछो 🙂';

 if(AI_SELFHARM_WORDS.some(w => ql.includes(w))){
  return '🙏 अगर आप या आपका कोई अपना मुश्किल दौर से गुज़र रहा है, तो कृपया अभी बात करो — KIRAN Helpline: 1800-599-0019 (24x7, फ्री) या Vandrevala Foundation: 1860-2662-345। आप अकेले नहीं हो, मदद मौजूद है।';
 }
 if(AI_BLOCKED_WORDS.some(w => ql.includes(w))){
  return '🙏 माफ़ कीजिए, इस तरह के सवाल का जवाब मैं नहीं दे सकता। मैं सिर्फ समाज से जुड़ी जानकारी में मदद करता हूँ — Business, Hospital, Blood donor, News, Events वगैरह बेझिझक पूछो।';
 }
 if(AI_GREETINGS.some(g => ql===g || ql.startsWith(g+' '))) return aiGreetingReply();
 if(AI_DISTANCE_WORDS.some(w => ql.includes(w))) return handleAiDistance(q, ql);
 if(AI_NEAR_WORDS.some(w => ql.includes(w))) return handleAiNearest(q, ql);
 // "nearest/paas" na bola ho, sirf "hospital/dharamshala hai kya" jaisa general sawaal poocha ho — तब भी
 // seedha uska data dikhana chahiye, generic business search में गुम नहीं होना चाहिए
 if(AI_HOSPITAL_WORDS.some(w => ql.includes(w))) return handleAiHospitalList();
 if(AI_DHARAMSHALA_WORDS.some(w => ql.includes(w))) return handleAiDharamshalaList();
 if(AI_BLOOD_WORDS.some(w => ql.includes(w))) return handleAiBlood(q);
 if(AI_NEWS_WORDS.some(w => ql.includes(w))) return handleAiNews();
 if(AI_EVENT_WORDS.some(w => ql.includes(w))) return handleAiEvents();
 if(AI_SHAADI_WORDS.some(w => ql.includes(w))){
  return '💍 Shaadi/विवाह से जुड़ी जानकारी privacy की वजह से सिर्फ SHAADI page पर ही दिखती है, Patidar AI से नहीं — कृपया SHAADI page पर जाकर देखो।';
 }
 if(AI_PROPERTY_WORDS.some(w => ql.includes(w))){
  return '🏠 मकान-किरायेदार/Property की जानकारी सिर्फ Property page पर मिलती है — कृपया वहाँ जाकर देखो।';
 }
 if(AI_COUNT_TRIGGER.some(t => ql.includes(t)) && AI_COUNT_SUBJECT.some(s => ql.includes(s))) return handleAiCount(ql);
 if(rounds===0 && AI_FOOD_WORDS.some(w => ql.includes(w)) && !aiHasAreaHint(ql)){
  aiPending = { originalQuery: q };
  return '📍 कौनसा area चाहिए? और 🍽️ नाश्ता चाहिए या पूरा खाना?';
 }
 const results = aiSearchBusinesses(q);
 if(results.length) return aiFormatBusinessResults(results, q);
 return 'माफ़ कीजिए, समझ नहीं आया 🙏 मैं पाटीदार समाज का AI हूँ — सिर्फ पाटीदार समाज की समझ रखता हूँ, बाकी की नहीं। बाकी के लिए AI मुबारक 😄 आप मुझसे पूछ सकते हो: किसी काम/business वाले के बारे में (जैसे "इलेक्ट्रीशियन Vijay Nagar"), सबसे पास का Hospital/धर्मशाला/Business, 🩸 Blood donor, 📰 News, 📅 Events, गाँव के सदस्यों की गिनती, या दो गाँव के बीच Distance।';
}
// सिर्फ ginती — kisi bhi member ki personal detail (naam/phone/address) yahan kabhi nahi dikhti
function handleAiCount(ql){
 const list = villageList();
 const found = list.find(v => ql.includes(v.name.toLowerCase()));
 if(found) return '👨‍🌾 '+found.name+' गाँव के '+found.count+' सदस्य अभी हमारी app पर registered हैं — यह पूरे गाँव की जनसंख्या नहीं, सिर्फ registered members की गिनती है।';
 return '👨‍🌾 अभी हमारी community में कुल '+publicMembers().length+' registered सदस्य हैं। किसी खास गाँव के लिए पूछो, जैसे "Karwad में कितने सदस्य हैं?"';
}
// query mein koi jaana-pehchana place (business ka area ya koi gaanv) mila to uska naam wapas karta hai — isse jawab
// "generic list" na lagkar us jagah ke liye personalized lage (jaise koi insaan seedha jawab de raha ho)
function aiFindPlaceInQuery(qlText){
 let found = null;
 allBusinesses().forEach(b => {
  if(found || !b.place) return;
  b.place.split(',').map(s => s.trim()).forEach(seg => {
   if(!found && seg.length>2 && qlText.includes(seg.toLowerCase())) found = seg;
  });
 });
 if(!found) villageList().forEach(v => { if(!found && v.name.length>2 && qlText.includes(v.name.toLowerCase())) found = v.name; });
 return found;
}
function aiHasAreaHint(qlText){ return !!aiFindPlaceInQuery(qlText); }
function aiExpandSynonyms(q){
 let extra = '';
 Object.keys(AI_SYNONYMS).forEach(k => { if(q.includes(k)) extra += ' '+AI_SYNONYMS[k]; });
 return q + extra;
}
// Business/Blood page पर वैसे भी पूरी list already सबको दिखती है (signed-in members को) — यहाँ cap
// सिर्फ chat message बहुत बड़ी न हो जाए इसके लिए है, privacy control नहीं। इसलिए काफ़ी ऊँचा रखा है।
const AI_LIST_CAP = 25;
function aiSearchBusinesses(query){
 const q = aiExpandSynonyms(query.toLowerCase());
 const qWords = q.split(/\s+/).filter(w => w.length>1);
 const scored = allBusinesses().map(b => {
  const hay = (b.type+' '+b.name+' '+(b.place||'')+' '+(b.village||'')+' '+(b.city||'')).toLowerCase();
  let score = 0;
  if(hay.includes(q)) score += 10;
  qWords.forEach(w => { if(hay.includes(w)) score += 1; });
  return {b, score};
 }).filter(x => x.score>0).sort((a,b) => b.score-a.score);
 // Paid/promoted business hamesha pehle — baaki relevance ke hisaab se uske baad
 const promoted = scored.filter(x => x.b.promoted).map(x => x.b);
 const rest = scored.filter(x => !x.b.promoted).map(x => x.b);
 return promoted.concat(rest);
}
// थोड़ी बातचीत वाली variety के लिए — हर बार एक जैसा robotic जवाब न लगे, फिर भी tone सम्मानजनक ही रहे
function aiPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function aiFormatBusinessResults(results, query){
 const place = aiFindPlaceInQuery((query||'').toLowerCase());
 const intro = place ?
  aiPick(['👨‍🌾 '+place+' में ये अपने पाटीदार भाई-बहनों के व्यापार मिले:', '🙏 '+place+' में देखो, ये अपने समाज के व्यापार मिले:', '👨‍🌾 '+place+' के आसपास ये पाटीदार बंधुओं के व्यापार हैं:']) :
  aiPick(['👨‍🌾 ये अपने पाटीदार भाई-बहनों के व्यापार मिले:', '🙏 देखो, ये अपने समाज के व्यापार मिले:', '👨‍🌾 ये रहे अपने पाटीदार बंधुओं के व्यापार:']);
 const shown = results.slice(0, AI_LIST_CAP);
 const lines = shown.map((b,i) => (i+1)+'. '+b.name+(b.promoted?' ⭐':'')+' — '+b.type+(b.place?' | '+b.place:'')+'\n   📞 '+b.phone);
 const more = results.length > AI_LIST_CAP ? ('\n\n(+'+(results.length-AI_LIST_CAP)+' और भी हैं — पूरी list के लिए BUSINESS page पर जाओ)') : '';
 return intro+'\n\n'+lines.join('\n\n')+'\n\nसभी अपने ही समाज के भरोसेमंद लोग हैं — बेझिझक call/WhatsApp करो।'+more;
}
function aiGreetingReply(){
 const opener = aiPick(['नमस्ते 🙏', 'राम राम 🙏', 'जय पाटीदार समाज 🙏']);
 return opener+' मैं पाटीदार समाज का AI हूँ — सिर्फ पाटीदार समाज की समझ रखता हूँ, बाकी की नहीं 😄 मुझसे पूछो: कोई भी Business/Profession (डॉक्टर, वकील, इलेक्ट्रीशियन...), 🏥 सबसे पास का Hospital/धर्मशाला/Business, 🩸 Blood donor, 📰 समाज की News, 📅 Events, या दो गाँव के बीच 📍 Distance।';
}
function handleAiBlood(q){
 const m = q.toUpperCase().match(/\b(AB|A|B|O)[+-]/);
 const group = m ? m[0] : null;
 let donors = publicMembers().filter(mm => (mm.blood_donor||'').indexOf('हाँ')===0 && mm.blood_group);
 if(group) donors = donors.filter(d => d.blood_group===group);
 if(!donors.length) return group ? ('माफ़ कीजिए, अभी '+group+' के कोई registered donor नहीं हैं — BLOOD page पर जाकर 🆘 SOS डालो, ज़्यादा पहुँच मिलेगी।') : 'कौनसा blood group चाहिए? जैसे O+, B+, AB- लिखकर पूछो।';
 const shown = donors.slice(0, AI_LIST_CAP);
 const list = shown.map(d => '🩸 '+d.name+' '+d.surname+' — '+d.blood_group+(d.home_village?(' | '+d.home_village):'')+'\n   📞 '+d.phone);
 const more = donors.length > AI_LIST_CAP ? ('\n\n(+'+(donors.length-AI_LIST_CAP)+' और भी हैं — पूरी list के लिए BLOOD page पर जाओ)') : '';
 return 'ये blood donors मिले:\n\n'+list.join('\n\n')+'\n\nसीधे call/WhatsApp करो, या emergency में BLOOD page पर SOS डालो।'+more;
}
function handleAiNews(){
 const list = newsData.filter(n => n.status!=='pending').slice(0,5);
 if(!list.length) return 'अभी कोई News नहीं है।';
 return '📰 ताज़ा समाचार:\n\n'+list.map(n => '• '+n.title+(n.date?' ('+n.date+')':'')).join('\n')+'\n\nपूरी details NEWS page पर मिलेंगी।';
}
function handleAiEvents(){
 const list = eventsData.filter(e => (e.date||'')>=today()).slice(0,5);
 if(!list.length) return 'अभी कोई upcoming event नहीं है।';
 return '📅 आने वाले Events:\n\n'+list.map(e => '• '+e.title+' — '+e.date+(e.location?(' | '+e.location):'')).join('\n')+'\n\nपूरी details EVENTS page पर मिलेंगी।';
}
// "nearest/paas" bole bina bhi sirf "hospital hai kya" jaisa general sawaal pucha ho — तब भी seedha data dikhao,
// generic business search में गुम नहीं होना चाहिए। Area-filter yahan jaanboojhkar nahi — precise filtering "nearest" flow mein hai।
function handleAiHospitalList(){
 const list = approvedHospitals();
 if(!list.length) return 'माफ़ कीजिए, अभी कोई Hospital listed नहीं है — Hospital page पर जाकर add कर सकते हो।';
 const shown = list.slice(0, AI_LIST_CAP);
 const lines = shown.map((h,i) => (i+1)+'. '+(h.name_en||h.name_hi)+(h.area?' | '+h.area:'')+'\n   📞 '+h.phone);
 const more = list.length > AI_LIST_CAP ? ('\n\n(+'+(list.length-AI_LIST_CAP)+' और भी हैं — Hospital page पर जाओ)') : '';
 return '🏥 ये Hospitals मिले:\n\n'+lines.join('\n\n')+more;
}
function handleAiDharamshalaList(){
 const list = approvedDharamshala();
 if(!list.length) return 'माफ़ कीजिए, अभी कोई धर्मशाला listed नहीं है — धर्मशाला page पर जाकर add कर सकते हो।';
 const shown = list.slice(0, AI_LIST_CAP);
 const lines = shown.map((d,i) => (i+1)+'. '+(d.name_en||d.name_hi)+(d.village?' | '+d.village+(d.tehsil?', '+d.tehsil:''):'')+'\n   📞 '+d.phone);
 const more = list.length > AI_LIST_CAP ? ('\n\n(+'+(list.length-AI_LIST_CAP)+' और भी हैं — धर्मशाला page पर जाओ)') : '';
 return '🛕 ये धर्मशाला मिलीं:\n\n'+lines.join('\n\n')+more;
}
function handleAiDistance(q, ql){
 const names = villageList().map(v => v.name);
 const found = names.filter(n => ql.includes(n.toLowerCase()));
 if(found.length<2){
  aiPending = { originalQuery: q };
  return '📍 कौन से दो गाँव के बीच? दोनों नाम एक साथ लिखो, जैसे "Karwad aur Sanwer"';
 }
 const a = villageInfoFor(found[0]), b = villageInfoFor(found[1]);
 if(!a || !a.lat || !b || !b.lat){
  return '❌ '+found[0]+' या '+found[1]+' का location अभी set नहीं है। "मेरे गाँव ले चलो" पेज पर जाकर 📍 Location सेट करो, फिर पूछो।';
 }
 const km = Math.round(haversineKmClient(a.lat, a.lng, b.lat, b.lng)*10)/10;
 return '📍 '+found[0]+' और '+found[1]+' के बीच सीधी (हवाई) दूरी लगभग '+km+' km है — सड़क की असल दूरी इससे ज़्यादा हो सकती है।';
}
// "सबसे पास कौन सा hospital/dharamshala/business है" — kisi bhi gaanv/इलाके ka naam pucho, ya khud ka
// registered gaanv default reference बनता है। Sirf unhi listings ko count karta hai jinka location set hai।
function handleAiNearest(q, ql){
 let category = 'business';
 if(AI_HOSPITAL_WORDS.some(w => ql.includes(w))) category = 'hospital';
 else if(AI_DHARAMSHALA_WORDS.some(w => ql.includes(w))) category = 'dharamshala';

 const radiusMatch = q.match(/(\d+)\s*(km|kilometer|kilometre|किमी|किलोमीटर)/i);
 const radiusKm = radiusMatch ? parseInt(radiusMatch[1], 10) : null;

 const names = villageList().map(v => v.name);
 let refName = names.find(n => ql.includes(n.toLowerCase()));
 let refInfo = refName ? villageInfoFor(refName) : null;
 if(!refInfo){
  const me = myMember();
  if(me && me.home_village){ refName = me.home_village; refInfo = villageInfoFor(me.home_village); }
 }
 if(!refInfo || !refInfo.lat){
  if(refName) return '❌ '+refName+' का location अभी set नहीं है। "मेरे गाँव ले चलो" पेज पर जाकर 📍 Location सेट करो, फिर पूछो।';
  aiPending = { originalQuery: q };
  return '📍 आप किस गाँव/इलाके के पास ढूंढ रहे हो? नाम बताओ (जैसे "Karwad ke paas hospital")';
 }

 let candidates;
 let label;
 if(category==='hospital'){
  label = 'hospital';
  candidates = approvedHospitals().filter(h => h.lat).map(h => ({ name: h.name_en||h.name_hi, phone: h.phone, lat: h.lat, lng: h.lng }));
 } else if(category==='dharamshala'){
  label = 'धर्मशाला';
  candidates = approvedDharamshala().filter(d => d.lat).map(d => ({ name: d.name_en||d.name_hi, phone: d.phone, lat: d.lat, lng: d.lng }));
 } else {
  label = 'business';
  candidates = allBusinesses().filter(b => b.lat).map(b => ({ name: b.name, phone: b.phone, lat: b.lat, lng: b.lng }));
 }
 if(!candidates.length) return 'माफ़ कीजिए, अभी किसी भी '+label+' का location set नहीं है — location set होते ही यहाँ दिखने लगेगा।';

 let withDist = candidates.map(c => Object.assign({}, c, { km: haversineKmClient(refInfo.lat, refInfo.lng, c.lat, c.lng) }));
 if(radiusKm) withDist = withDist.filter(c => c.km <= radiusKm);
 withDist.sort((a,b) => a.km - b.km);
 withDist = withDist.slice(0, 10);
 if(!withDist.length) return '❌ '+radiusKm+' km के अंदर कोई '+label+' नहीं मिला (या location set नहीं है)।';

 const lines = withDist.map((c,i) => (i+1)+'. '+c.name+' — '+(Math.round(c.km*10)/10)+' km'+(c.phone?'\n   📞 '+c.phone:''));
 const nearIntro = aiPick(['👨‍🌾 '+refName+' के सबसे पास ये अपने पाटीदार भाई-बहन मिले:', '🙏 '+refName+' के आसपास देखो, ये मिले:']);
 return nearIntro+'\n\n'+lines.join('\n\n')+'\n\nदूरी हवाई (सीधी रेखा) है — सड़क की असल दूरी इससे ज़्यादा हो सकती है।';
}
// हर searchable portal पर छोटा सा quick-link — "सबसे पास कौन सा..." जैसे सवाल सीधे Patidar AI से पूछ सको
function patidarAIQuickLinkHTML(){
 return '<div onclick="goPage(\'patidarai\')" class="cursor-pointer bg-gradient-to-r from-amber-50 to-emerald-50 border-2 border-emerald-300 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between hover:shadow-md transition-all">'+
  '<span class="text-sm font-bold text-emerald-800">👨‍🌾 सीधे पूछो — "सबसे पास कौन सा..." जैसे सवाल</span>'+
  '<span class="text-xs font-bold text-emerald-700 whitespace-nowrap ml-2">Patidar AI →</span>'+
  '</div>';
}
function haversineKmClient(lat1, lon1, lat2, lon2){
 const R = 6371;
 const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
 const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
 return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ================= PROPERTY (मकान-किरायेदार) =================
function activeProperties(){
 const days = siteMeta.propertyValidityDays || 365;
 const cutoff = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
 return propertyData.filter(p => p.status==='approved' && p.active!==false && (p.approvedAt||p.createdAt||'9999') >= cutoff);
}
function activeShaadis(){
 const days = siteMeta.shaadiValidityDays || 180;
 const cutoff = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
 return shaadiData.filter(s => s.status==='approved' && s.paid!==false && (s.approvedAt||s.createdAt||'9999') >= cutoff);
}
async function submitProperty(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Listing डालने के लिए पहले Community member बनो।'); return; }
 // एक से ज़्यादा listing डाल सकते हो — हर listing की अपनी अलग Fee लगती है (ऊपर देना है/चाहिए wale Razorpay button)
 const type=document.getElementById('pp_type').value;
 const nm=fmtName(document.getElementById('pp_name').value);
 const ph=fmtPhone(document.getElementById('pp_phone').value);
 const area=document.getElementById('pp_area').value.trim();
 const rent=document.getElementById('pp_rent').value.trim();
 const bhk=document.getElementById('pp_bhk').value.trim();
 const desc=document.getElementById('pp_desc').value.trim();
 const pics=[0,1,2,3,4].map(i=>document.getElementById('pp_pic_'+i).value).filter(Boolean);
 const ref=document.getElementById('pp_ref').value;
 if(!type||!nm||!ph||!area){ alert('❌ Type, Name, Phone, Area जरूरी!'); return; }
 const code = randCode();
 busy(true);
 const kind = document.getElementById('pp_kind').value;
 await db.collection('property').add({kind,type,name:nm,phone:ph,area,rent,bhk,description:desc,pics,pic:pics[0]||'',referredBy:ref,code,status:'pending',active:true,createdAt:today()});
 busy(false); showPropForm=false;
 alert('✅ Listing submit हो गई!\\n\\n🔑 यह CODE संभाल के रखो: '+code+'\\n(इससे बाद में listing ON/OFF कर पाओगे)\\n\\nAdmin approval के बाद live होगी।');
 renderApp();
}
async function toggleMyProperty(){
 const ph = fmtPhone(document.getElementById('mp_phone').value);
 const code = document.getElementById('mp_code').value.trim();
 const p = propertyData.find(x => x.phone===ph && x.code===code);
 if(!p){ alert('❌ Phone/Code match नहीं हुआ'); return; }
 busy(true);
 await db.collection('property').doc(p.id).update({active: !(p.active!==false)});
 busy(false);
 alert(p.active!==false ? '✅ Listing अब INACTIVE कर दी गई' : '✅ Listing अब ACTIVE कर दी गई');
 showManageProp=false; renderApp();
}
function propGallery(p){
 const pics = (p.pics && p.pics.length) ? p.pics : (p.pic ? [p.pic] : []);
 if(!pics.length) return '';
 if(pics.length===1) return '<img src="'+pics[0]+'" class="w-full h-44 object-cover">';
 return '<div class="flex overflow-x-auto snap-x snap-mandatory h-44" style="scroll-snap-type:x mandatory;">'+
  pics.map(u=>'<img src="'+u+'" class="w-full h-44 object-cover flex-shrink-0" style="scroll-snap-align:start;">').join('')+
  '</div><p class="text-center text-[10px] text-gray-400 py-0.5">👉 स्वाइप करो — '+pics.length+' फोटो</p>';
}
function propCard(p){
 return '<div class="bg-white border-2 border-purple-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg">'+
 propGallery(p)+
 '<div class="p-4"><p class="inline-block bg-purple-200 text-purple-900 px-2 py-1 rounded text-xs font-bold mb-2">'+(p.kind==='dukan'?'🏪 दुकान':'🏠 मकान')+' - '+(p.type==='rent'?'किराए पर उपलब्ध':'चाहिए')+'</p>'+
 '<p class="font-bold text-lg">'+esc(p.name)+'</p>'+
 (p.rent?'<p class="text-xl font-bold text-green-600">₹'+esc(p.rent)+'/माह</p>':'')+
 (p.bhk?'<p class="text-sm text-gray-600">🏠 '+esc(p.bhk)+'</p>':'')+
 '<p class="text-sm text-gray-600">📍 '+esc(p.area)+'</p>'+
 (p.description?'<p class="text-sm text-gray-600 mt-2">'+esc(p.description)+'</p>':'')+
 '<a href="tel:'+p.phone+'" class="block text-center mt-3 bg-green-600 text-white px-4 py-2 rounded-lg font-bold">📞 '+esc(p.phone)+'</a></div></div>';
}
let propKind = 'makan';
function setPropKind(k){ propKind=k; showPropForm=false; renderApp(); }
function renderPropertyPage(){
 const all = activeProperties();
 const list = all.filter(p => (p.kind||'makan') === propKind);
 const nMakan = all.filter(p=>(p.kind||'makan')==='makan').length;
 const nDukan = all.filter(p=>p.kind==='dukan').length;
 const isMakan = propKind==='makan';
 const feeRent = siteMeta.propertyFeeRent||'500', feeWanted = siteMeta.propertyFeeWanted||'11';
 let h = '<h2 class="text-3xl font-bold mb-2">🏠 मकानमालिक - किरायेदार / दुकान</h2>';
 h += '<p class="text-gray-500 mb-4">दो अलग portal — जो चाहिए उस पर click करो</p>';
 h += '<div class="grid grid-cols-2 gap-3 mb-5">'+
 '<button onclick="setPropKind(\'makan\')" class="px-4 py-5 rounded-xl font-bold text-center '+(isMakan?'bg-purple-600 text-white shadow-lg':'bg-white border-2 border-purple-300 text-purple-700')+'"><p class="text-3xl mb-1">🏠</p><p>मकान</p><p class="text-xs font-normal">House / किराया ('+nMakan+')</p></button>'+
 '<button onclick="setPropKind(\'dukan\')" class="px-4 py-5 rounded-xl font-bold text-center '+(!isMakan?'bg-purple-600 text-white shadow-lg':'bg-white border-2 border-purple-300 text-purple-700')+'"><p class="text-3xl mb-1">🏪</p><p>दुकान</p><p class="text-xs font-normal">Shop / किराया ('+nDukan+')</p></button></div>';

 // ===== JOIN US + ₹Fee + Razorpay (देने वाले / चाहिए वाले — दो अलग fee) =====
 h += '<div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-6 mb-6 text-center">'+
  '<h3 class="text-2xl font-bold mb-1">🤝 JOIN US — '+(isMakan?'🏠 मकान':'🏪 दुकान')+' Listing</h3>'+
  '<p class="text-purple-100 mb-4">अपना '+(isMakan?'मकान':'दुकान')+' यहाँ list करो — पूरे समाज तक पहुँचेगा</p>'+
  '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div class="bg-white/10 rounded-lg p-4"><p class="font-bold mb-1">🔑 किराए पर देना है</p><p class="text-2xl font-bold mb-2">₹'+esc(feeRent)+' <span class="text-sm font-normal">/ साल</span></p>'+
   (siteMeta.razorpayPropRent?'<div id="razorpayPropRentBox" class="flex justify-center"></div>':'<p class="text-xs text-purple-100">Payment button जल्द चालू होगा — तब तक Admin से बात करो: '+CONTACT_PHONE+'</p>')+
  '</div>'+
  '<div class="bg-white/10 rounded-lg p-4"><p class="font-bold mb-1">🙋 किराए पर चाहिए</p><p class="text-2xl font-bold mb-2">₹'+esc(feeWanted)+' <span class="text-sm font-normal">/ साल</span></p>'+
   (siteMeta.razorpayPropWanted?'<div id="razorpayPropWantedBox" class="flex justify-center"></div>':'<p class="text-xs text-purple-100">Payment button जल्द चालू होगा — तब तक Admin से बात करो: '+CONTACT_PHONE+'</p>')+
  '</div></div>'+
  '<p class="text-xs text-purple-200 mt-3">💡 किराए पर चाहिए वालों के लिए fee छोटा रखा है — सिर्फ faltu/spam listings रोकने के लिए</p>'+
  '<button onclick="showPropForm=!showPropForm;renderApp()" class="mt-4 bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg">➕ Payment के बाद यहाँ Listing डालो</button>'+
  '</div>';
 h += '<div class="flex flex-wrap gap-3 mb-6">';
 h += '<button onclick="showManageProp=!showManageProp;renderApp()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold">🔑 अपनी Listing Manage करो</button>';
 h += '</div>';

 if(showManageProp){
  h += '<div class="bg-gray-50 border-2 border-gray-400 rounded-lg p-5 mb-6"><h3 class="font-bold mb-3">🔑 Active/Inactive करो</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-3">'+
  '<input id="mp_phone" maxlength="10" placeholder="आपका Phone" class="px-3 py-2 border-2 rounded">'+
  '<input id="mp_code" maxlength="4" placeholder="आपका Code" class="px-3 py-2 border-2 rounded">'+
  '<button onclick="toggleMyProperty()" class="bg-gray-700 text-white px-4 py-2 rounded font-bold">🔄 TOGGLE ON/OFF</button></div></div>';
 }

 if(showPropForm){
  h += '<div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-6 mb-8"><h3 class="text-xl font-bold mb-4">➕ ADD LISTING</h3>';
  h += '<div class="bg-yellow-100 border border-yellow-400 rounded p-3 mb-4 text-sm">💳 Fee: किराए पर देना है = ₹'+esc(feeRent)+'/साल | किराए पर चाहिए = ₹'+esc(feeWanted)+'/साल — Payment ऊपर Razorpay से करो, फिर यह form भरो</div>';
  h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">क्या? *</label><select id="pp_kind" class="w-full px-3 py-2 border-2 rounded"><option value="makan" '+(propKind==='makan'?'selected':'')+'>🏠 मकान</option><option value="dukan" '+(propKind==='dukan'?'selected':'')+'>🏪 दुकान</option></select></div>'+
  '<div><label class="text-xs font-bold">Type *</label><select id="pp_type" class="w-full px-3 py-2 border-2 rounded"><option value="rent">किराए पर देना है</option><option value="wanted">मुझे किराए पर चाहिए</option></select></div>'+
  '<div><label class="text-xs font-bold">Name / नाम *</label><input id="pp_name" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone *</label><input id="pp_phone" maxlength="10" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Area / इलाका (Indore) *</label><input id="pp_area" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Rent (₹/माह)</label><input id="pp_rent" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">BHK / Rooms</label><input id="pp_bhk" placeholder="जैसे: 2 BHK" class="w-full px-3 py-2 border-2 rounded"></div>'+
  referrerSelectHTML('pp_ref')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="pp_desc" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>';
  h += '<div class="mt-4"><label class="text-xs font-bold">📷 Photos (ज्यादा से ज्यादा 5)</label><div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">'+
  [0,1,2,3,4].map(i=>'<div><input type="hidden" id="pp_pic_'+i+'"><button type="button" onclick="openCloudUpload(\'pp_pic_'+i+'\')" class="w-full bg-blue-600 text-white px-2 py-2 rounded font-bold text-xs">📷 '+(i+1)+'</button><img id="pp_pic_'+i+'_prev" class="hidden mt-1 h-16 w-full object-cover rounded border-2"></div>').join('')+
  '</div></div>';
  h += '<div class="flex gap-3 mt-4"><button onclick="submitProperty()" class="bg-purple-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showPropForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }

 if(!list.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">'+(isMakan?'🏠':'🏪')+'</p><p class="text-lg font-bold text-gray-600">अभी इस portal में कोई listing नहीं है</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+list.map(propCard).join('')+'</div>';
 return h;
}

// ================= मेरी धर्मशाला =================
function approvedDharamshala(){ return dharamshalaData.filter(d=>d.status==='approved'); }
function setDharamshalaKind(k){ dharamshalaKind=k; showDharamshalaForm=false; renderApp(); }
async function submitDharamshala(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('धर्मशाला जोड़ने के लिए पहले Community member बनो।'); return; }
 const {name_en, name_hi} = readBilingual('dh');
 const village = document.getElementById('dh_village').value.trim();
 const tehsil = document.getElementById('dh_tehsil').value.trim();
 const ownerType = document.getElementById('dh_owner_type').value;
 const ownerName = document.getElementById('dh_owner_name').value.trim();
 const phone = fmtPhone(document.getElementById('dh_phone').value);
 const gmap = document.getElementById('dh_gmap').value.trim();
 const details = document.getElementById('dh_details').value.trim();
 if((!name_en && !name_hi) || !phone){ alert('❌ Name और Phone जरूरी!'); return; }
 saveTranslitPair(name_en, name_hi);
 busy(true);
 const ref = await db.collection('dharamshala').add({kind:dharamshalaKind, name_en, name_hi, village, tehsil, ownerType, ownerName, phone, gmap, details, status:'pending', createdAt:today(), addedBy:me.phone});
 geocodeAndAttach('dharamshala', ref.id, village, tehsil); // background mein — "nearest dharamshala" jaise Patidar AI सवाल के लिए
 busy(false); showDharamshalaForm=false;
 alert('✅ जानकारी submit हो गई! Admin approval के बाद list में दिखेगी।');
 renderApp();
}
function dharamshalaCard(d){
 return '<div class="bg-white border-2 border-orange-300 rounded-lg overflow-hidden shadow-md p-4">'+
 '<p class="font-bold text-lg">'+bilingualHTML(d.name_en,d.name_hi)+'</p>'+
 '<p class="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-bold mt-1">'+(d.ownerType==='samaj'?'🛕 समाज की':'👤 व्यक्ति विशेष की')+(d.ownerName?' — '+esc(d.ownerName):'')+'</p>'+
 (d.village||d.tehsil?'<p class="text-sm text-gray-600 mt-1">📍 '+esc(d.village||'-')+(d.tehsil?' / '+esc(d.tehsil):'')+'</p>':'')+
 (d.details?'<p class="text-sm text-gray-600 mt-2">'+esc(d.details)+'</p>':'')+
 (d.gmap?'<a href="'+esc(d.gmap)+'" target="_blank" rel="noopener" class="block text-center mt-2 bg-blue-50 text-blue-700 border-2 border-blue-300 px-4 py-2 rounded-lg font-bold text-sm">📍 Google Maps पर देखें</a>':'')+
 '<a href="tel:'+esc(d.phone)+'" class="block text-center mt-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold">📞 '+esc(d.phone)+'</a></div>';
}
function renderDharamshalaPage(){
 const all = approvedDharamshala();
 const list = all.filter(d => (d.kind||'village') === dharamshalaKind);
 const nVillage = all.filter(d=>(d.kind||'village')==='village').length;
 const nHotel = all.filter(d=>d.kind==='hotel').length;
 const isVillage = dharamshalaKind==='village';
 let h = '<h2 class="text-3xl font-bold mb-2">🛕 मेरी धर्मशाला</h2>';
 h += '<p class="text-gray-500 mb-4">यात्रा/कार्यक्रम के लिए ठहरने की जगह ढूंढो या अपनी धर्मशाला/होटल यहाँ जोड़ो</p>';
 h += patidarAIQuickLinkHTML();
 h += '<div class="grid grid-cols-2 gap-3 mb-5">'+
 '<button onclick="setDharamshalaKind(\'village\')" class="px-4 py-5 rounded-xl font-bold text-center '+(isVillage?'bg-orange-600 text-white shadow-lg':'bg-white border-2 border-orange-300 text-orange-700')+'"><p class="text-3xl mb-1">🛕</p><p>गाँव की धर्मशाला</p><p class="text-xs font-normal">('+nVillage+')</p></button>'+
 '<button onclick="setDharamshalaKind(\'hotel\')" class="px-4 py-5 rounded-xl font-bold text-center '+(!isVillage?'bg-orange-600 text-white shadow-lg':'bg-white border-2 border-orange-300 text-orange-700')+'"><p class="text-3xl mb-1">🏨</p><p>Hotels — शहर/Town</p><p class="text-xs font-normal">('+nHotel+')</p></button></div>';
 h += '<div class="text-center mb-6"><button onclick="showDharamshalaForm=!showDharamshalaForm;renderApp()" class="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold">➕ यहाँ जोड़ो</button></div>';
 if(showDharamshalaForm){
  h += '<div class="bg-orange-50 border-2 border-orange-400 rounded-lg p-6 mb-8"><h3 class="text-xl font-bold mb-4">➕ ADD '+(isVillage?'धर्मशाला':'HOTEL')+'</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  bilingualInputsHTML('dh', (isVillage?'धर्मशाला':'Hotel')+' Name')+
  '<div><label class="text-xs font-bold">'+(isVillage?'गाँव / Village':'शहर / City-Area')+' *</label><input id="dh_village" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">तहसील / Tehsil</label><input id="dh_tehsil" list="dl_tehsils" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">किसकी है?</label><select id="dh_owner_type" class="w-full px-3 py-2 border-2 rounded"><option value="samaj">🛕 समाज की (Samaj)</option><option value="person">👤 व्यक्ति विशेष की (Individual)</option></select></div>'+
  '<div><label class="text-xs font-bold">मालिक/Trust का नाम</label><input id="dh_owner_name" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone *</label><input id="dh_phone" maxlength="10" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Google Maps Link</label><input id="dh_gmap" placeholder="https://maps.google.com/..." class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="dh_details" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitDharamshala()" class="bg-orange-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showDharamshalaForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 if(!list.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🛕</p><p class="text-lg font-bold text-gray-600">अभी कोई listing नहीं है</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+list.map(dharamshalaCard).join('')+'</div>';
 return h;
}

// ================= पाटीदार अस्पताल =================
function approvedHospitals(){ return hospitalsData.filter(h=>h.status==='approved'); }
function setHospitalKind(k){ hospitalKind=k; showHospitalForm=false; renderApp(); }
async function submitHospital(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Hospital जोड़ने के लिए पहले Community member बनो।'); return; }
 const {name_en, name_hi} = readBilingual('hp');
 const runBy = document.getElementById('hp_run_by').value.trim();
 const area = document.getElementById('hp_area').value.trim();
 const phone = fmtPhone(document.getElementById('hp_phone').value);
 const gmap = document.getElementById('hp_gmap').value.trim();
 const details = document.getElementById('hp_details').value.trim();
 if((!name_en && !name_hi) || !phone){ alert('❌ Name और Phone जरूरी!'); return; }
 saveTranslitPair(name_en, name_hi);
 busy(true);
 const ref = await db.collection('hospitals').add({kind:hospitalKind, name_en, name_hi, runBy, area, phone, gmap, details, status:'pending', createdAt:today(), addedBy:me.phone});
 geocodeAndAttach('hospitals', ref.id, area, 'Indore'); // background mein — "nearest hospital" jaise Patidar AI सवाल के लिए
 busy(false); showHospitalForm=false;
 alert('✅ जानकारी submit हो गई! Admin approval के बाद list में दिखेगी।');
 renderApp();
}
function hospitalCard(h){
 return '<div class="bg-white border-2 border-sky-300 rounded-lg overflow-hidden shadow-md p-4">'+
 '<p class="font-bold text-lg">'+bilingualHTML(h.name_en,h.name_hi)+'</p>'+
 '<p class="inline-block bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-xs font-bold mt-1">'+(h.kind==='samaj'?'🛕 समाज का अस्पताल (Trust)':'🏥 निजी अस्पताल (Private)')+'</p>'+
 (h.area?'<p class="text-sm text-gray-600 mt-1">📍 '+esc(h.area)+'</p>':'')+
 (h.runBy?'<p class="text-sm text-gray-600 mt-1">👤 '+esc(h.runBy)+'</p>':'')+
 (h.details?'<p class="text-sm text-gray-600 mt-2">'+esc(h.details)+'</p>':'')+
 (h.gmap?'<a href="'+esc(h.gmap)+'" target="_blank" rel="noopener" class="block text-center mt-2 bg-blue-50 text-blue-700 border-2 border-blue-300 px-4 py-2 rounded-lg font-bold text-sm">📍 Google Maps पर देखें</a>':'')+
 '<a href="tel:'+esc(h.phone)+'" class="block text-center mt-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold">📞 '+esc(h.phone)+'</a></div>';
}
function renderHospitalsPage(){
 const all = approvedHospitals();
 const list = all.filter(h => (h.kind||'niji') === hospitalKind);
 const nNiji = all.filter(h=>(h.kind||'niji')==='niji').length;
 const nSamaj = all.filter(h=>h.kind==='samaj').length;
 const isNiji = hospitalKind==='niji';
 let h = '<h2 class="text-3xl font-bold mb-2">🏥 पाटीदार अस्पताल</h2>';
 h += '<p class="text-gray-500 mb-4">जरूरत के वक्त भरोसेमंद अस्पताल की जानकारी</p>';
 h += patidarAIQuickLinkHTML();
 h += '<div class="grid grid-cols-2 gap-3 mb-5">'+
 '<button onclick="setHospitalKind(\'niji\')" class="px-4 py-5 rounded-xl font-bold text-center '+(isNiji?'bg-sky-600 text-white shadow-lg':'bg-white border-2 border-sky-300 text-sky-700')+'"><p class="text-3xl mb-1">🏥</p><p>निजी अस्पताल</p><p class="text-xs font-normal">Private ('+nNiji+')</p></button>'+
 '<button onclick="setHospitalKind(\'samaj\')" class="px-4 py-5 rounded-xl font-bold text-center '+(!isNiji?'bg-sky-600 text-white shadow-lg':'bg-white border-2 border-sky-300 text-sky-700')+'"><p class="text-3xl mb-1">🛕</p><p>समाज के अस्पताल</p><p class="text-xs font-normal">Trust ('+nSamaj+')</p></button></div>';
 h += '<div class="text-center mb-6"><button onclick="showHospitalForm=!showHospitalForm;renderApp()" class="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-lg font-bold">➕ यहाँ जोड़ो</button></div>';
 if(showHospitalForm){
  h += '<div class="bg-sky-50 border-2 border-sky-400 rounded-lg p-6 mb-8"><h3 class="text-xl font-bold mb-4">➕ ADD HOSPITAL</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  bilingualInputsHTML('hp', 'Hospital Name')+
  '<div><label class="text-xs font-bold">'+(isNiji?'चलाने वाला / Owner':'Trust का नाम')+'</label><input id="hp_run_by" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">इलाका / Area (Indore)</label><input id="hp_area" list="dl_villages" placeholder="जैसे: Vijay Nagar" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone *</label><input id="hp_phone" maxlength="10" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Google Maps Link</label><input id="hp_gmap" placeholder="https://maps.google.com/..." class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details (specialities, etc.)</label><textarea id="hp_details" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitHospital()" class="bg-sky-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showHospitalForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 if(!list.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🏥</p><p class="text-lg font-bold text-gray-600">अभी कोई listing नहीं है</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+list.map(hospitalCard).join('')+'</div>';
 return h;
}

// ================= STUDENT IN इंदौर =================
const STUDENT_NEED_KINDS = [['tiffin','🍱','Tiffin Centers'],['room_hostel','🏠','Samaj Rooms / Hostel'],['kirana','🛒','Kirana Shops'],['gas','🔥','Gas Connection Help'],['stationery','📚','Stationery Shops'],['other','📌','Other']];
function approvedStudentNeeds(){ return studentNeedsData.filter(s=>s.status==='approved'); }
function myStudentReg(){ return studentsData.find(s=>s.phone===currentUser); }
function setStudentNeedKind(k){ studentNeedKind=k; showStudentNeedForm=false; renderApp(); }
async function registerStudent(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Register करने के लिए पहले Community member बनो।'); return; }
 const college = document.getElementById('st_college').value.trim();
 const homeVillage = document.getElementById('st_home').value.trim();
 if(!college){ alert('❌ College/Course जरूरी!'); return; }
 busy(true);
 await db.collection('students').add({name:me.name+' '+me.surname, phone:me.phone, college, homeVillage, createdAt:today()});
 busy(false); showStudentRegForm=false;
 alert('✅ Register हो गए! अब नीचे directory देखो।');
 renderApp();
}
async function submitStudentNeed(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('जोड़ने के लिए पहले Community member बनो।'); return; }
 const {name_en, name_hi} = readBilingual('sn');
 const phone = fmtPhone(document.getElementById('sn_phone').value);
 const area = document.getElementById('sn_area').value.trim();
 const gmap = document.getElementById('sn_gmap').value.trim();
 const details = document.getElementById('sn_details').value.trim();
 if((!name_en && !name_hi) || !phone){ alert('❌ Name और Phone जरूरी!'); return; }
 saveTranslitPair(name_en, name_hi);
 busy(true);
 await db.collection('student_needs').add({kind:studentNeedKind, name_en, name_hi, phone, area, gmap, details, status:'pending', createdAt:today(), addedBy:me.phone});
 busy(false); showStudentNeedForm=false;
 alert('✅ जानकारी submit हो गई! Admin approval के बाद list में दिखेगी।');
 renderApp();
}
function studentNeedCard(s){
 return '<div class="bg-white border-2 border-fuchsia-300 rounded-lg overflow-hidden shadow-md p-4">'+
 '<p class="font-bold text-lg">'+bilingualHTML(s.name_en,s.name_hi)+'</p>'+
 (s.area?'<p class="text-sm text-gray-600 mt-1">📍 '+esc(s.area)+'</p>':'')+
 (s.details?'<p class="text-sm text-gray-600 mt-2">'+esc(s.details)+'</p>':'')+
 (s.gmap?'<a href="'+esc(s.gmap)+'" target="_blank" rel="noopener" class="block text-center mt-2 bg-blue-50 text-blue-700 border-2 border-blue-300 px-4 py-2 rounded-lg font-bold text-sm">📍 Google Maps पर देखें</a>':'')+
 '<a href="tel:'+esc(s.phone)+'" class="block text-center mt-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold">📞 '+esc(s.phone)+'</a></div>';
}
function renderStudentsPage(){
 const all = approvedStudentNeeds();
 const list = all.filter(s => (s.kind||'tiffin') === studentNeedKind);
 const me = myStudentReg();
 let h = '<h2 class="text-3xl font-bold mb-2">🎓 STUDENT इंदौर</h2>';
 h += '<p class="text-gray-500 mb-4">इंदौर में पढ़ने वाले पाटीदार students के लिए — Tiffin, Room/Hostel, Kirana, Gas, Stationery सब एक जगह</p>';
 if(me){
  h += '<div class="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6"><p class="font-bold text-green-800">✅ आप registered हो — '+esc(me.college)+'</p></div>';
 } else {
  h += '<div class="bg-fuchsia-50 border-2 border-fuchsia-400 rounded-lg p-5 mb-6"><h3 class="font-bold mb-3">📝 Student के रूप में Register करो</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  '<input id="st_college" placeholder="College / Course *" class="px-3 py-2 border-2 rounded">'+
  '<input id="st_home" placeholder="गाँव/शहर (घर) — Home Village" class="px-3 py-2 border-2 rounded">'+
  '</div><button onclick="registerStudent()" class="mt-3 bg-fuchsia-600 text-white px-6 py-2 rounded-lg font-bold">✅ Register</button></div>';
 }
 h += '<div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">'+STUDENT_NEED_KINDS.map(k=>{
  const n = all.filter(s=>(s.kind||'tiffin')===k[0]).length;
  const active = studentNeedKind===k[0];
  return '<button onclick="setStudentNeedKind(\''+k[0]+'\')" class="px-3 py-4 rounded-xl font-bold text-center '+(active?'bg-fuchsia-600 text-white shadow-lg':'bg-white border-2 border-fuchsia-300 text-fuchsia-700')+'"><p class="text-2xl mb-1">'+k[1]+'</p><p class="text-xs">'+k[2]+'</p><p class="text-[10px] font-normal">('+n+')</p></button>';
 }).join('')+'</div>';
 h += '<div class="text-center mb-6"><button onclick="showStudentNeedForm=!showStudentNeedForm;renderApp()" class="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-8 py-3 rounded-lg font-bold">➕ यहाँ जोड़ो</button></div>';
 if(showStudentNeedForm){
  h += '<div class="bg-fuchsia-50 border-2 border-fuchsia-400 rounded-lg p-6 mb-8"><h3 class="text-xl font-bold mb-4">➕ ADD — '+STUDENT_NEED_KINDS.find(k=>k[0]===studentNeedKind)[2]+'</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  bilingualInputsHTML('sn', 'Name')+
  '<div><label class="text-xs font-bold">Phone *</label><input id="sn_phone" maxlength="10" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">इलाका / Area</label><input id="sn_area" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Google Maps Link</label><input id="sn_gmap" placeholder="https://maps.google.com/..." class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="sn_details" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitStudentNeed()" class="bg-fuchsia-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showStudentNeedForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 if(!list.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">'+STUDENT_NEED_KINDS.find(k=>k[0]===studentNeedKind)[1]+'</p><p class="text-lg font-bold text-gray-600">अभी कोई listing नहीं है</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+list.map(studentNeedCard).join('')+'</div>';
 return h;
}

// ================= SHAADI =================
function shaadiViewState(){
 let st = {};
 try{ st = JSON.parse(localStorage.getItem('psShaadiViews')||'{}'); }catch(e){}
 if(st.date !== today()){ st = {date:today(), ids:[]}; }
 return st;
}
function saveShaadiViewState(st){ localStorage.setItem('psShaadiViews', JSON.stringify(st)); }
function revealShaadi(id){
 const st = shaadiViewState();
 if(st.ids.includes(id)){ renderApp(); return; }
 if(st.ids.length >= 10){ alert('⏰ आज की 10 profiles की limit पूरी हो गई!\nकल फिर 10 नई देख पाओगे।'); return; }
 st.ids.push(id); saveShaadiViewState(st); renderApp();
}
function shaadiCard(s, revealed){
 const paid = (s.paid!==false) ? '<span class="text-[10px] bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-bold">⭐ PAID / VERIFIED</span>' : '';
 if(!revealed){
  return '<div class="bg-white border-2 border-pink-300 rounded-lg overflow-hidden shadow-md text-center p-6">'+
  '<div class="w-full h-40 bg-pink-100 flex items-center justify-center text-6xl rounded mb-3">💍</div>'+
  '<p class="text-gray-500 text-sm mb-1">'+esc(s.gender||'')+' | Age: '+esc(s.age||'-')+'</p>'+
  '<p class="mb-3">'+paid+'</p>'+
  '<button onclick="revealShaadi(\''+s.id+'\')" class="bg-pink-600 text-white px-6 py-2 rounded-lg font-bold">👁️ Profile देखो</button></div>';
 }
 return '<div class="bg-white border-2 border-pink-400 rounded-lg overflow-hidden shadow-md hover:shadow-lg">'+
 (s.pic?'<img src="'+s.pic+'" class="w-full h-56 object-cover">':'<div class="w-full h-24 bg-pink-100 flex items-center justify-center text-5xl">💍</div>')+
 '<div class="p-4"><p class="font-bold text-xl text-pink-700">'+esc(s.name)+' '+paid+'</p>'+
 '<p class="text-sm text-gray-700 mt-2">'+esc(s.gender||'')+' | Age: '+esc(s.age||'-')+' | '+esc(s.education||'')+'</p>'+
 '<p class="text-sm text-gray-700">🏡 '+esc(s.village||'-')+', '+esc(s.district||'-')+'</p>'+
 (s.details?'<p class="text-sm text-gray-600 mt-2">'+esc(s.details)+'</p>':'')+
 '<p class="mt-3 bg-pink-100 text-pink-800 rounded p-2 text-center text-sm font-bold">📞 संपर्क: '+CONTACT_PHONE+'</p>'+
 '</div></div>';
}
// दो portal: वर चाहिए (लड़के दिखेंगे) | वधू चाहिए (लड़कियाँ दिखेंगी)
let shaadiKind = '';
let showShaadiForm = false;
function setShaadiKind(k, allowed){
 if(k !== allowed){
  alert(allowed==='vadhu'
   ? 'ℹ️ आप पुरुष हैं — आपको सिर्फ 👰 वधू (लड़कियों) की profiles दिखेंगी।'
   : 'ℹ️ आप महिला हैं — आपको सिर्फ 🤵 वर (लड़कों) की profiles दिखेंगी।');
  return;
 }
 shaadiKind = k; renderApp();
}
async function submitShaadiProfile(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('Shaadi profile डालने के लिए पहले Community member बनो।'); return; }
 const nm=fmtName(document.getElementById('sh2_name').value), gender=document.getElementById('sh2_gender').value,
  age=document.getElementById('sh2_age').value.trim(), edu=document.getElementById('sh2_edu').value.trim(),
  village=fmtName(document.getElementById('sh2_village').value), district=document.getElementById('sh2_district').value.trim(),
  contact=fmtPhone(document.getElementById('sh2_contact').value), pic=document.getElementById('sh2_pic').value,
  details=document.getElementById('sh2_details').value.trim(), ref=document.getElementById('sh2_ref').value;
 if(!nm||!age||!contact){ alert('❌ Name, Age और Contact जरूरी!'); return; }
 busy(true);
 await db.collection('shaadi').add({name:nm, gender, age, education:edu, village, district, contact, pic, details, referredBy:ref, paid:false, status:'pending', createdAt:today()});
 busy(false); showShaadiForm=false;
 alert('✅ Profile submit हो गई! Payment confirm होने के बाद Admin approve करेगा।'); renderApp();
}
function renderShaadiPage(){
 const me = myMember();
 const fee = siteMeta.shaadiFee||'500', days = siteMeta.shaadiValidityDays||180;
 let h = '<h2 class="text-3xl font-bold mb-2">💍 SHAADI / विवाह</h2>';
 h += '<div class="bg-pink-50 border-2 border-pink-300 rounded-lg p-4 mb-6 text-center"><p class="font-bold text-pink-800">सभी profiles ⭐ PAID + VERIFIED ✅</p><p class="text-xs text-gray-500 mt-1">रोज़ सिर्फ 10 profiles देख सकते हो</p>'+
  '<p class="text-sm font-bold text-pink-700 mt-2">💳 Profile Fee: ₹'+esc(fee)+' / '+days+' दिन</p>'+
  (siteMeta.razorpayShaadi?'<div class="mt-3 flex justify-center" id="razorpayShaadiBox"></div>':'<p class="text-xs text-gray-400 mt-2">💳 Payment button जल्द चालू होगा — तब तक Admin से बात करो: '+CONTACT_PHONE+'</p>')+
  '</div>';
 if(!me || me.status!=='approved'){
  h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🔒</p><p class="text-lg font-bold text-gray-600">Shaadi profiles देखने के लिए पहले Community member बनो</p><button onclick="startRegister()" class="mt-4 bg-pink-600 text-white px-6 py-3 rounded-lg font-bold">📝 REGISTER YOURSELF</button></div>';
  return h;
 }
 h += '<button onclick="showShaadiForm=!showShaadiForm;renderApp()" class="mb-6 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-bold">➕ Payment के बाद अपनी/परिवार की Profile डालो</button>';
 if(showShaadiForm){
  h += '<div class="bg-pink-50 border-2 border-pink-400 rounded-lg p-6 mb-8"><h3 class="text-xl font-bold mb-4">➕ ADD SHAADI PROFILE</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="sh2_name" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Gender *</label><select id="sh2_gender" class="w-full px-3 py-2 border-2 rounded"><option>Male / पुरुष</option><option>Female / महिला</option></select></div>'+
  '<div><label class="text-xs font-bold">Age *</label><input id="sh2_age" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Education</label><input id="sh2_edu" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Village</label><input id="sh2_village" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">District</label><input id="sh2_district" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Family Contact *</label><input id="sh2_contact" maxlength="10" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="sh2_pic"><button type="button" onclick="openCloudUpload(\'sh2_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="sh2_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div>'+
  referrerSelectHTML('sh2_ref')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="sh2_details" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitShaadiProfile()" class="bg-pink-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showShaadiForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 const iAmMale = (me.gender||'').indexOf('Male')===0;
 const iAmFemale = (me.gender||'').indexOf('Female')===0;
 if(!iAmMale && !iAmFemale){
  h += '<div class="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-5 text-center font-bold text-yellow-800">⚠️ आपकी profile में Gender नहीं भरा है - Admin से update करवाओ: '+CONTACT_PHONE+'</div>';
  return h;
 }
 // लड़कों को लड़कियाँ (वधू चाहिए), लड़कियों को लड़के (वर चाहिए)
 const allowed = iAmMale ? 'vadhu' : 'var';
 if(shaadiKind !== allowed) shaadiKind = allowed;
 const active = activeShaadis();
 const varList   = active.filter(s => (s.gender||'').indexOf('Male')===0);
 const vadhuList = active.filter(s => (s.gender||'').indexOf('Female')===0);
 h += '<div class="grid grid-cols-2 gap-3 mb-5">'+
  '<button onclick="setShaadiKind(\'var\',\''+allowed+'\')" class="px-4 py-4 rounded-xl font-bold text-center '+(shaadiKind==='var'?'bg-rose-600 text-white shadow-lg':'bg-gray-100 text-gray-500 border-2')+'">'+
   '<p class="text-3xl mb-1">🤵</p><p>वर चाहिए</p><p class="text-xs font-normal">Groom Profiles ('+varList.length+')</p>'+(allowed!=='var'?'<p class="text-[10px] mt-1">🔒</p>':'')+'</button>'+
  '<button onclick="setShaadiKind(\'vadhu\',\''+allowed+'\')" class="px-4 py-4 rounded-xl font-bold text-center '+(shaadiKind==='vadhu'?'bg-rose-600 text-white shadow-lg':'bg-gray-100 text-gray-500 border-2')+'">'+
   '<p class="text-3xl mb-1">👰</p><p>वधू चाहिए</p><p class="text-xs font-normal">Bride Profiles ('+vadhuList.length+')</p>'+(allowed!=='vadhu'?'<p class="text-[10px] mt-1">🔒</p>':'')+'</button></div>';
 h += '<p class="text-xs text-gray-500 mb-4">🔒 नियम: लड़कों को सिर्फ लड़कियों की और लड़कियों को सिर्फ लड़कों की profiles दिखती हैं।</p>';
 const list = shaadiKind==='var' ? varList : vadhuList;
 const st = shaadiViewState();
 const left = Math.max(0, 10 - st.ids.length);
 h += '<div class="bg-white border-2 border-rose-200 rounded-lg p-4 mb-5 flex flex-wrap justify-between items-center gap-2">'+
  '<p class="text-lg font-bold">'+(shaadiKind==='var'?'🤵 वर / Groom':'👰 वधू / Bride')+' Profiles ('+list.length+')</p>'+
  '<p class="text-sm font-bold '+(left?'text-green-700':'text-red-600')+'">आज देखी: '+st.ids.length+' / 10 '+(left?'(बाकी '+left+')':'(limit पूरी — कल फिर 10)')+'</p></div>';
 if(!list.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">💍</p><p class="text-lg font-bold text-gray-600">जल्द ही profiles आ रही हैं...</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+list.map(s => shaadiCard(s, st.ids.includes(s.id))).join('')+'</div>';
 return h;
}

// ================= ROZGAAR =================
let jobKind = 'dena';
async function submitJob(){
 const t=document.getElementById('jb_title').value.trim(), c=fmtName(document.getElementById('jb_company').value),
  pl=document.getElementById('jb_place').value.trim(), sal=document.getElementById('jb_salary').value.trim(),
  ph=fmtPhone(document.getElementById('jb_phone').value), ds=document.getElementById('jb_desc').value.trim(),
  kind=document.getElementById('jb_kind').value, ref=document.getElementById('jb_ref').value;
 if(!t||!ph){ alert('❌ Title और Contact जरूरी!'); return; }
 busy(true);
 await db.collection('jobs').add({title:t,company:c,place:pl,salary:sal,phone:ph,details:ds,kind:kind,referredBy:ref,status:'pending',createdAt:today()});
 busy(false); showJobForm=false;
 alert('✅ Submit हो गया! Admin approval के बाद live होगा।'); renderApp();
}
function renderRozgaarPage(){
 const all = jobsData.filter(j=>j.status==='approved');
 const list = all.filter(j => (j.kind||'dena') === jobKind || (jobKind==='freelance_dena' && j.kind==='freelance'));
 let h = '<h2 class="text-3xl font-bold mb-2">💼 ROZGAAR / रोज़गार</h2>';
 h += '<div class="flex flex-wrap gap-2 mb-4">'+
 '<button onclick="jobKind=\'dena\';renderApp()" class="px-4 py-2 rounded-lg font-bold text-sm '+(jobKind==='dena'?'bg-green-600 text-white':'bg-gray-200')+'">💼 रोज़गार देना है ('+all.filter(j=>(j.kind||'dena')==='dena').length+')</button>'+
 '<button onclick="jobKind=\'lena\';renderApp()" class="px-4 py-2 rounded-lg font-bold text-sm '+(jobKind==='lena'?'bg-green-600 text-white':'bg-gray-200')+'">🙋 रोज़गार चाहिए ('+all.filter(j=>j.kind==='lena').length+')</button>'+
 '<button onclick="jobKind=\'freelance_dena\';renderApp()" class="px-4 py-2 rounded-lg font-bold text-sm '+(jobKind==='freelance_dena'?'bg-green-600 text-white':'bg-gray-200')+'">💻 Freelancing काम देना है ('+all.filter(j=>j.kind==='freelance_dena'||j.kind==='freelance').length+')</button>'+
 '<button onclick="jobKind=\'freelance_lena\';renderApp()" class="px-4 py-2 rounded-lg font-bold text-sm '+(jobKind==='freelance_lena'?'bg-green-600 text-white':'bg-gray-200')+'">🙋‍♂️ Freelancing काम चाहिए ('+all.filter(j=>j.kind==='freelance_lena').length+')</button></div>';
 const jobsFeeSeeker = siteMeta.jobsFeeSeeker||'11';
 h += '<div class="bg-yellow-100 border border-yellow-400 rounded p-3 mb-4 text-sm">💼 रोज़गार/Freelancing <b>देना है</b> — बिल्कुल FREE 🆓<br>🙋 रोज़गार/Freelancing <b>चाहिए</b> — ₹'+esc(jobsFeeSeeker)+' (सिर्फ faltu/spam posts रोकने के लिए)</div>';
 if(siteMeta.razorpayJobsSeeker) h += '<p class="text-xs text-gray-500 text-center mb-1">👇 सिर्फ "चाहिए" वाले ही pay करें</p><div id="razorpayJobsSeekerBox" class="flex justify-center mb-4"></div>';
 h += '<button onclick="showJobForm=!showJobForm;renderApp()" class="mb-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">➕ Post करो</button>';
 if(showJobForm){
  h += '<div class="bg-green-50 border-2 border-green-400 rounded-lg p-5 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">किस type का? *</label><select id="jb_kind" class="w-full px-3 py-2 border-2 rounded"><option value="dena">💼 रोज़गार देना है (job available)</option><option value="lena">🙋 रोज़गार चाहिए (job needed)</option><option value="freelance_dena">💻 Freelancing काम देना है (hiring)</option><option value="freelance_lena">🙋‍♂️ Freelancing काम चाहिए (looking for work)</option></select></div>'+
  '<div><label class="text-xs font-bold">Job Title *</label><input id="jb_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Company</label><input id="jb_company" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Place</label><input id="jb_place" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Salary</label><input id="jb_salary" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Contact *</label><input id="jb_phone" class="w-full px-3 py-2 border-2 rounded"></div>'+
  referrerSelectHTML('jb_ref')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="jb_desc" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitJob()" class="bg-green-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showJobForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 if(!list.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">💼</p><p class="text-lg font-bold text-gray-600">अभी कोई job नहीं - पहली आप डालो!</p></div>';
 else h += '<div class="space-y-4">'+list.map(j =>
  '<div class="bg-white border-2 border-green-300 rounded-lg p-5 shadow-md"><div class="flex flex-wrap justify-between items-start gap-3"><div>'+
  '<p class="text-xl font-bold text-green-700">'+esc(j.title)+'</p>'+
  (j.company?'<p class="text-sm text-gray-700">🏢 '+esc(j.company)+'</p>':'')+
  '<p class="text-sm text-gray-700">📍 '+esc(j.place||'-')+(j.salary?' | 💰 '+esc(j.salary):'')+'</p>'+
  (j.details?'<p class="text-sm text-gray-600 mt-2 bg-green-50 rounded p-2">'+esc(j.details)+'</p>':'')+
  '</div><a href="tel:'+j.phone+'" class="bg-green-600 text-white px-5 py-2 rounded-lg font-bold">📞 '+esc(j.phone)+'</a></div></div>').join('')+'</div>';
 return h;
}

// ================= OLD ITEMS =================
function activeOldItems(){
 const days = siteMeta.expiryDays || 30;
 const cutoff = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
 const list = oldItems.filter(o => o.status==='approved' && (o.createdAt||'9999') >= cutoff);
 list.sort((a,b) => (b.promoted?1:0)-(a.promoted?1:0));
 return list;
}
async function submitOldItem(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('सामान बेचने के लिए पहले Community member बनो।'); return; }
 const t=document.getElementById('it_title').value.trim(), pr=document.getElementById('it_price').value.trim(),
  ph=fmtPhone(document.getElementById('it_phone').value), ds=document.getElementById('it_desc').value.trim(),
  pic=document.getElementById('it_pic').value;
 if(!t||!pr||!ph){ alert('❌ Item, Price, Contact जरूरी!'); return; }
 const olx=document.getElementById('it_olx').value.trim();
 const ref=document.getElementById('it_ref').value;
 const promoted=document.getElementById('it_promote').checked;
 const isExtra = oldItems.some(o => o.phone===me.phone && o.status!=='rejected');
 busy(true);
 await db.collection('olditems').add({title:t,price:pr,phone:ph,description:ds,pic:pic,olx_link:olx,referredBy:ref,promoted,extraFee:isExtra,status:'pending',createdAt:today()});
 busy(false); showItemForm=false;
 alert('✅ Item submit! Admin approval के बाद '+(siteMeta.expiryDays||30)+' दिन live रहेगा।'); renderApp();
}
function renderOldItemsPage(){
 const approved = activeOldItems();
 const me = myMember();
 const isMember = !!(me && me.status==='approved');
 let h = '<h2 class="text-3xl font-bold mb-2">🛒 अपना OLX ('+approved.length+')</h2>';
 h += '<p class="text-gray-500 mb-4">समाज के अंदर पुराना सामान बेचो — देखना सबके लिए खुला है, पूरी details + Call/WhatsApp के लिए Community member बनो</p>';
 if(isMember){
  h += '<button onclick="showItemForm=!showItemForm;renderApp()" class="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold">➕ अपना सामान बेचो</button>';
 } else {
  h += '<div class="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-4 text-center text-sm">🔒 सामान बेचने के लिए पहले <button onclick="showRegisterPrompt(\'सामान बेचने के लिए पहले Community member बनो।\')" class="underline font-bold text-purple-700">Register करो</button></div>';
 }
 if(isMember){
  const hasItem = oldItems.some(o => o.phone===me.phone && o.status!=='rejected');
  if(hasItem){
   h += '<div class="bg-yellow-100 border border-yellow-400 rounded p-3 mb-3 text-sm">💳 आपकी पहली listing free थी — अगली/extra listing के लिए ₹'+esc(siteMeta.olxExtraItemFee||'100')+' लगेंगे</div>';
   if(siteMeta.razorpayOlxExtra) h += '<div id="razorpayOlxExtraBox" class="flex justify-center mb-3"></div>';
  } else {
   h += '<div class="bg-green-100 border border-green-400 rounded p-3 mb-3 text-sm">🆓 आपकी पहली Listing बिल्कुल FREE है</div>';
  }
  h += '<div class="bg-orange-50 border border-orange-300 rounded p-3 mb-4 text-sm">🚀 सबसे ऊपर दिखाना है? ₹'+esc(siteMeta.olxPromoFee||'100')+' — नीचे form में checkbox से चुनो</div>';
  if(siteMeta.razorpayOlxPromo) h += '<div id="razorpayOlxPromoBox" class="flex justify-center mb-4"></div>';
 }
 if(showItemForm && isMember){
  h += '<div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-5 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Item Name *</label><input id="it_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Price (₹) *</label><input id="it_price" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Contact *</label><input id="it_phone" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="it_pic"><button type="button" onclick="openCloudUpload(\'it_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="it_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div>'+
  '<div><label class="text-xs font-bold">🔗 OLX Link (optional — OLX पर भी डाला हो तो)</label><input id="it_olx" placeholder="https://www.olx.in/item/..." class="w-full px-3 py-2 border-2 rounded"><p class="text-[10px] text-gray-400 mt-0.5">यहाँ link डालोगे तो सामान पर "OLX पर देखो" button आएगा जो सीधे OLX पर ले जाएगा</p></div>'+
  referrerSelectHTML('it_ref')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="it_desc" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div>'+
  '<label class="md:col-span-2 flex items-center gap-2 text-sm font-bold bg-orange-50 border border-orange-300 rounded px-3 py-2"><input type="checkbox" id="it_promote" class="h-4 w-4"> 🚀 इसे सबसे ऊपर दिखाओ (Promote — ₹'+esc(siteMeta.olxPromoFee||'100')+', payment ऊपर करके ही टिक करो)</label></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitOldItem()" class="bg-purple-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showItemForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 if(!approved.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🛒</p><p class="text-lg font-bold text-gray-600">अभी कोई item नहीं - पहला आप डालो!</p></div>';
 else if(isMember) h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+approved.map(o =>
  '<div class="border-2 '+(o.promoted?'border-amber-500':'bg-white border-purple-300')+' rounded-lg overflow-hidden shadow-md hover:shadow-lg relative" '+(o.promoted?'style="background:linear-gradient(160deg,#FFF9E6,#FDE68A);"':'')+'>'+
  (o.promoted?'<span class="absolute top-2 left-2 z-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">🚀 PROMOTED</span>':'')+
  (o.pic?'<img src="'+o.pic+'" class="w-full h-44 object-cover">':'')+
  '<div class="p-4"><p class="font-bold text-lg text-purple-700">'+esc(o.title)+'</p>'+
  '<p class="text-2xl font-bold text-green-600 mt-1">₹ '+esc(o.price)+'</p>'+
  (o.description?'<p class="text-sm text-gray-600 mt-2">'+esc(o.description)+'</p>':'')+
  '<a href="tel:'+o.phone+'" class="block text-center mt-3 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">📞 Call</a>'+
  (o.olx_link?'<a href="'+esc(o.olx_link)+'" target="_blank" rel="noopener" class="block text-center mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">🔗 OLX पर देखो / Open OLX</a>':'')+
  '<button onclick="shareWA(\'🛒 '+esc(o.title).replace(/\'/g,'')+' - ₹'+esc(o.price)+' | अपना OLX: \'+pageLink(\'olditems\'))" class="block w-full text-center mt-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm">📤 WhatsApp Share</button>'+
  '</div></div>').join('')+'</div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+approved.map(o =>
  '<div class="border-2 '+(o.promoted?'border-amber-500':'bg-white border-purple-200')+' rounded-lg overflow-hidden shadow-md relative" '+(o.promoted?'style="background:linear-gradient(160deg,#FFF9E6,#FDE68A);"':'')+'>'+
  (o.promoted?'<span class="absolute top-2 left-2 z-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">🚀 PROMOTED</span>':'')+
  (o.pic?'<img src="'+o.pic+'" class="w-full h-44 object-cover">':'')+
  '<div class="p-4"><p class="font-bold text-lg text-purple-700">'+esc(o.title)+'</p>'+
  (o.description?'<p class="text-sm text-gray-500 mt-1">'+esc(o.description).slice(0,60)+(o.description.length>60?'...':'')+'</p>':'')+
  '<button onclick="showRegisterPrompt(\'पूरी details, price और seller का number देखने के लिए पहले Community member बनो।\')" class="block w-full text-center mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm">🔒 पूरी Details के लिए Register करो</button>'+
  '</div></div>').join('')+'</div>';
 return h;
}

// ================= NEWS =================
let showNewsForm = false;
async function submitNews(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('News डालने के लिए पहले Community member बनो।'); return; }
 const t=document.getElementById('un_title').value.trim(), c=document.getElementById('un_content').value.trim(), pic=document.getElementById('un_pic').value;
 if(!t||!c){ alert('❌ Title और Content जरूरी!'); return; }
 busy(true);
 await db.collection('news').add({title:t, content:c, pic:pic, date:today(), status:'pending', createdAt:today(), submittedBy:me.phone});
 busy(false); showNewsForm=false;
 alert('✅ Submit हो गया! Admin approval के बाद live होगा।'); renderApp();
}
function renderNewsPage(){
 const me = myMember();
 const isMember = !!(me && me.status==='approved');
 const visible = newsData.filter(n => n.status!=='pending');
 let h = '<h2 class="text-3xl font-bold mb-2">📰 NEWS ('+visible.length+')</h2>';
 h += '<p class="text-gray-500 text-sm mb-4">पाटीदार समाज से जुड़ी कोई भी खबर हो तो डालो — Subject to Admin Approval</p>';
 if(isMember){
  h += '<button onclick="showNewsForm=!showNewsForm;renderApp()" class="mb-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold">➕ News डालो</button>';
  if(showNewsForm){
   h += '<div class="bg-red-50 border-2 border-red-400 rounded-lg p-5 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
   '<div><label class="text-xs font-bold">Title *</label><input id="un_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
   '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="un_pic"><button type="button" onclick="openCloudUpload(\'un_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button></div>'+
   '<div class="md:col-span-2"><label class="text-xs font-bold">Content *</label><textarea id="un_content" rows="3" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
   '<div class="flex gap-3 mt-4"><button onclick="submitNews()" class="bg-red-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showNewsForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
  }
 } else {
  h += '<div class="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4 text-center text-sm">🔒 News डालने के लिए पहले <button onclick="showRegisterPrompt(\'News डालने के लिए पहले Community member बनो।\')" class="underline font-bold text-red-700">Register करो</button></div>';
 }
 if(!visible.length) return h+'<p class="text-gray-500 text-center py-12 text-lg">अभी कोई news नहीं है</p>';
 let list = visible.slice();
 if(selectedNewsId){ const idx=list.findIndex(n=>n.id===selectedNewsId); if(idx>0){ const [n]=list.splice(idx,1); list.unshift(n); } }
 h += '<div class="space-y-5">'+
 list.map(n => '<div class="bg-white border-2 '+(n.id===selectedNewsId?'border-red-600 ring-2 ring-red-300':'border-red-300')+' rounded-lg overflow-hidden shadow-md">'+
  (n.pic?'<img src="'+n.pic+'" class="w-full h-52 object-cover">':'')+
  '<div class="p-5"><p class="text-2xl font-bold text-red-700">'+esc(n.title)+'</p><p class="text-xs text-gray-500 mt-1">📅 '+n.date+'</p><p class="text-gray-700 mt-3 whitespace-pre-line">'+esc(n.content)+'</p>'+
  '<button onclick="shareWA(\'📰 '+esc(n.title).replace(/\'/g,'')+' | Patidar Samaj Indore: \'+pageLink(\'news/'+n.id+'\'))" class="mt-4 bg-green-500 text-white px-5 py-2 rounded-lg font-bold text-sm">📤 WhatsApp Share</button>'+
  '</div></div>').join('')+'</div>';
 return h;
}

// ================= PRATIBHA =================
async function submitPratibha(){
 const me = myMember();
 if(!me || me.status!=='approved'){ showRegisterPrompt('प्रतिभा जोड़ने के लिए पहले Community member बनो।'); return; }
 const nm=fmtName(document.getElementById('pt_name').value), ach=document.getElementById('pt_ach').value.trim(),
  ds=document.getElementById('pt_desc').value.trim(), vl=fmtName(document.getElementById('pt_place').value);
 if(!nm||!ach){ alert('❌ Name और Achievement जरूरी!'); return; }
 busy(true);
 await db.collection('pratibha').add({name:nm,achievement:ach,details:ds,place:vl,pic:document.getElementById('pt_pic').value,status:'pending',createdAt:today()});
 busy(false); showPratForm=false;
 alert('✅ Submit! Admin approval के बाद live।'); renderApp();
}
function renderPratibhaPage(){
 const approved = pratibhaData.filter(p=>p.status==='approved');
 const meP = myMember();
 const isMemberP = !!(meP && meP.status==='approved');
 let h = '<h2 class="text-3xl font-bold mb-2">🏆 प्रतिभा परिचय</h2>';
 h += '<p class="text-gray-500 text-sm mb-3">Community member कोई भी प्रतिभा जोड़ सकता है — Subject to Admin Approval</p>';
 if(isMemberP){
  h += '<button onclick="showPratForm=!showPratForm;renderApp()" class="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold">➕ प्रतिभा जोड़ो</button>';
 } else {
  h += '<div class="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 mb-4 text-center text-sm">🔒 प्रतिभा जोड़ने के लिए पहले <button onclick="showRegisterPrompt(\'प्रतिभा जोड़ने के लिए पहले Community member बनो।\')" class="underline font-bold text-indigo-700">Register करो</button></div>';
 }
 if(showPratForm && isMemberP){
  h += '<div class="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-5 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="pt_name" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Achievement *</label><input id="pt_ach" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Village/City</label><input id="pt_place" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="pt_pic"><button type="button" onclick="openCloudUpload(\'pt_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="pt_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="pt_desc" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitPratibha()" class="bg-indigo-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showPratForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 if(!approved.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🏆</p><p class="text-lg font-bold text-gray-600">अभी कोई प्रतिभा add नहीं हुई</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+approved.map(p =>
  '<div class="bg-white border-2 border-indigo-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg">'+
  (p.pic?'<img src="'+p.pic+'" class="w-full h-52 object-cover">':'<div class="w-full h-24 bg-gradient-to-r from-indigo-100 to-indigo-200 flex items-center justify-center text-5xl">🏆</div>')+
  '<div class="p-4"><p class="font-bold text-xl text-indigo-700">'+esc(p.name)+'</p>'+
  '<p class="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-bold mt-1">🏆 '+esc(p.achievement)+'</p>'+
  (p.place?'<p class="text-sm text-gray-600 mt-2">📍 '+esc(p.place)+'</p>':'')+
  (p.details?'<p class="text-sm text-gray-600 mt-2">'+esc(p.details)+'</p>':'')+
  '</div></div>').join('')+'</div>';
 return h;
}

// ================= EVENTS / GALLERY =================
// ================= SUGGESTIONS ("अपनी सलाह दें") — कोई भी दे सकता है, login जरूरी नहीं =================
let suggestName = '', suggestPhone = '', suggestText = '';
function renderSuggestionsPage(){
 let h = '<div class="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6 mb-6 text-center">';
 h += '<p class="text-3xl mb-2">💡</p><h2 class="text-2xl md:text-3xl font-bold mb-2">अपनी सलाह दें / Give Your Suggestion</h2>';
 h += '<p class="text-orange-100">समाज को बेहतर बनाने के लिए आपकी राय हमारे लिए कीमती है</p></div>';
 h += '<div class="bg-white rounded-lg shadow-lg p-6 max-w-xl mx-auto">';
 h += '<label class="text-xs font-bold text-gray-600">आपका नाम (optional)</label>';
 h += '<input type="text" id="sg_name" value="'+esc(suggestName)+'" oninput="suggestName=this.value" placeholder="नाम (चाहें तो)" class="w-full px-3 py-2 border-2 rounded mb-3">';
 h += '<label class="text-xs font-bold text-gray-600">Mobile Number (optional)</label>';
 h += '<input type="tel" id="sg_phone" maxlength="10" value="'+esc(suggestPhone)+'" oninput="suggestPhone=this.value" placeholder="ताकि हम contact कर सकें" class="w-full px-3 py-2 border-2 rounded mb-3">';
 h += '<label class="text-xs font-bold text-gray-600">आपकी सलाह *</label>';
 h += '<textarea id="sg_text" rows="5" oninput="suggestText=this.value" placeholder="यहाँ अपनी सलाह/सुझाव लिखो..." class="w-full px-3 py-2 border-2 rounded mb-4">'+esc(suggestText)+'</textarea>';
 h += '<button onclick="submitSuggestion()" class="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold text-lg">📤 भेजो / Send</button>';
 h += '</div>';
 return h;
}
async function submitSuggestion(){
 const text = document.getElementById('sg_text').value.trim();
 if(!text){ alert('❌ कृपया अपनी सलाह लिखो'); return; }
 const name = fmtName(document.getElementById('sg_name').value);
 const phone = fmtPhone(document.getElementById('sg_phone').value);
 busy(true);
 await db.collection('suggestions').add({name:name, phone:phone, text:text, status:'pending', createdAt:today()});
 busy(false);
 suggestName=''; suggestPhone=''; suggestText='';
 alert('🙏 आपकी सलाह के लिए तहे दिल से शुक्रिया!\n\nआपका दिन मंगलमय हो! 😊');
 renderApp();
}
function renderEventsPage(){
 if(!eventsData.length) return '<h2 class="text-3xl font-bold mb-6">📅 EVENTS</h2><p class="text-gray-500 text-center py-12">कोई event नहीं</p>';
 return '<h2 class="text-3xl font-bold mb-6">📅 EVENTS ('+eventsData.length+')</h2><div class="space-y-4">'+
 eventsData.map(e => '<div class="bg-white border-2 border-green-300 rounded-lg overflow-hidden shadow-md">'+(e.pic?'<img src="'+e.pic+'" class="w-full h-52 object-cover">':'')+'<div class="p-6"><p class="text-2xl font-bold text-green-700">'+esc(e.title)+'</p><p class="text-gray-700 mt-2">📅 '+e.date+' @ '+(e.time||'')+' | 📍 '+esc(e.location)+'</p><p class="text-gray-600 mt-1">'+esc(e.description||'')+'</p></div></div>').join('')+'</div>';
}
function renderGalleryPage(){
 if(!photosData.length) return '<h2 class="text-3xl font-bold mb-6">🖼️ GALLERY</h2><p class="text-gray-500 text-center py-12 text-lg">अभी photos नहीं हैं</p>';
 return '<h2 class="text-3xl font-bold mb-6">🖼️ GALLERY ('+photosData.length+')</h2><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+
 photosData.map(p => '<div class="bg-white border-2 border-purple-300 rounded-lg overflow-hidden shadow-md"><img src="'+p.url+'" class="w-full h-56 object-cover"><div class="p-4"><p class="font-bold text-purple-700">'+esc(p.title||'')+'</p><p class="text-sm text-gray-600">'+esc(p.caption||'')+'</p></div></div>').join('')+'</div>';
}

// ================= 🎭 FAKE DEMO DATA (admin-only — app दिखाने के लिए, बाद में delete करने लायक) =================
// हर fake document पर isFake:true flag रहता है (delete करने के लिए) और हर नाम/title के आगे "(Fake)" लिखा रहता है
// (असली data से कभी confuse न हो) — इसीलिए normal search/AI logic को कहीं छूने की जरूरत नहीं पड़ी।
const FAKE_MALE_NAMES = ['Ramesh','Suresh','Mahesh','Naveen','Deepak','Rajesh','Sanjay','Vijay','Ashok','Pankaj','Manoj','Dinesh','Anil','Sunil','Prakash','Ratan','Mukesh','Rakesh','Yogesh','Bharat','Kishore','Narendra','Jitendra','Hitesh','Nitin','Sandeep','Vinod','Girish','Amit','Rohit'];
const FAKE_FEMALE_NAMES = ['Kavita','Sunita','Rekha','Geeta','Meena','Pooja','Priya','Anjali','Nisha','Sarita','Kiran','Manisha','Usha','Radha','Seema','Kalpana','Neelam','Jyoti','Shobha','Vandana'];
const FAKE_SURNAMES = ['Patel','Patidar'];
const FAKE_VILLAGES = ['Karwad','Sanwer','Depalpur','Betma','Gautampura','Rau','Manpur','Hatod','Mhow','Simrol'];
function fakePh(base,i){ return String(base+i); }
function fakePick(arr,i){ return arr[i%arr.length]; }
async function seedFakeDemoData(){
 if(!isSuperAdmin()){ alert('❌ सिर्फ Admin कर सकता है'); return; }
 if(!confirm('⚠️ यह ~150 FAKE demo documents बनाएगा (members, business, शादी, property, news, events) — हर नाम के आगे "(Fake)" लिखा रहेगा। सिर्फ demo दिखाने के लिए, बाद में delete कर सकते हो। आगे बढ़ें?')) return;
 busy(true);
 try{
  const batch = db.batch();
  const bizTypes = BUSINESS_TYPES.filter(t => t!=='Other');
  for(let i=1;i<=30;i++){ // 30 personal profiles (कोई business नहीं)
   const male = i%3!==0;
   const ref = db.collection('members').doc();
   batch.set(ref, {
    name: male?fakePick(FAKE_MALE_NAMES,i):fakePick(FAKE_FEMALE_NAMES,i), surname: fakePick(FAKE_SURNAMES,i)+' (Fake)',
    phone: fakePh(9000000000,i), gender: male?'Male / पुरुष':'Female / महिला',
    home_village: fakePick(FAKE_VILLAGES,i), home_district:'Indore', present_city:'Indore',
    blood_group: fakePick(BLOOD_GROUPS,i), blood_donor: (i%2===0)?'हाँ / Yes':'नहीं / No',
    status:'approved', createdAt: today(), phoneVerified:true, isFake:true
   });
  }
  for(let i=1;i<=30;i++){ // 30 business profiles
   const male = i%3!==0;
   const btype = fakePick(bizTypes,i);
   const ref = db.collection('members').doc();
   batch.set(ref, {
    name: male?fakePick(FAKE_MALE_NAMES,i+7):fakePick(FAKE_FEMALE_NAMES,i+7), surname: fakePick(FAKE_SURNAMES,i+1)+' (Fake)',
    phone: fakePh(9000000100,i), gender: male?'Male / पुरुष':'Female / महिला',
    home_village: fakePick(FAKE_VILLAGES,i+2), home_district:'Indore', present_city:'Indore',
    business_name: btype+' '+fakePick(FAKE_SURNAMES,i)+' (Fake)', business_type: btype,
    business_place: fakePick(FAKE_VILLAGES,i+2)+', Indore', business_phone: fakePh(9000000100,i),
    business_details: 'Demo के लिए बनाया गया fake business listing।',
    status:'approved', createdAt: today(), phoneVerified:true, isFake:true
   });
  }
  for(let i=1;i<=20;i++){ // 20 महिला profiles Secret privacy पर — publicMembers()/Patidar AI से अपने-आप बाहर रहेंगी
   const ref = db.collection('members').doc();
   batch.set(ref, {
    name: fakePick(FAKE_FEMALE_NAMES,i+3), surname: fakePick(FAKE_SURNAMES,i)+' (Fake)', phone: fakePh(9000000400,i),
    gender:'Female / महिला', privacy:'Secret / सिर्फ PSIM Team को',
    home_village: fakePick(FAKE_VILLAGES,i), home_district:'Indore', present_city:'Indore',
    blood_group: fakePick(BLOOD_GROUPS,i),
    status:'approved', createdAt: today(), phoneVerified:true, isFake:true
   });
  }
  const EDUCATIONS = ['B.Com','B.E./B.Tech','MBA','B.A.','M.Com','CA','Doctor (MBBS)'];
  for(let i=1;i<=30;i++){ // 30 शादी profiles
   const male = i%2===0;
   const ref = db.collection('shaadi').doc();
   batch.set(ref, {
    name: (male?fakePick(FAKE_MALE_NAMES,i+11):fakePick(FAKE_FEMALE_NAMES,i+11))+' '+fakePick(FAKE_SURNAMES,i)+' (Fake)',
    gender: male?'Male / पुरुष':'Female / महिला', age: String(22+(i%15)), education: fakePick(EDUCATIONS,i),
    village: fakePick(FAKE_VILLAGES,i), district:'Indore', contact: fakePh(9000000200,i),
    details:'Demo के लिए बनाई गई fake profile।', paid:true, status:'approved', createdAt: today(), isFake:true
   });
  }
  for(let i=1;i<=30;i++){ // 30 Property listings
   const kind = i%4===0?'dukan':'makan';
   const ref = db.collection('property').doc();
   batch.set(ref, {
    kind, type: i%3===0?'wanted':'rent',
    name: fakePick(FAKE_MALE_NAMES,i)+' '+fakePick(FAKE_SURNAMES,i)+' (Fake)', phone: fakePh(9000000300,i),
    area: fakePick(FAKE_VILLAGES,i)+', Indore', rent: String(3000+(i*250)),
    bhk: kind==='makan'?fakePick(['1 BHK','2 BHK','3 BHK'],i):'',
    description:'Demo के लिए बनाई गई fake listing।', pics:[], pic:'', code:'FAKE'+i,
    status:'approved', active:true, createdAt: today(), isFake:true
   });
  }
  ['समाज की वार्षिक बैठक संपन्न','नए सदस्यों का स्वागत समारोह','पाटीदार युवा सम्मेलन की घोषणा','समाज भवन निर्माण हेतु सहयोग अपील','होली मिलन कार्यक्रम की तैयारी'].forEach(t => {
   const ref = db.collection('news').doc();
   batch.set(ref, { title:t+' (Fake)', content:'यह एक demo/fake समाचार है, सिर्फ app दिखाने के लिए बनाया गया है।', pic:'', date:today(), status:'approved', createdAt:today(), isFake:true });
  });
  ['होली मिलन समारोह','वार्षिक सम्मेलन','युवा खेल महोत्सव','सामूहिक विवाह सम्मेलन','रक्तदान शिविर'].forEach((t,idx) => {
   const ref = db.collection('events').doc();
   batch.set(ref, { title:t+' (Fake)', date:new Date(Date.now()+(idx+5)*86400000).toISOString().slice(0,10), time:'18:00', location:'Indore', description:'यह एक demo/fake event है, सिर्फ app दिखाने के लिए बनाया गया है।', pic:'', isFake:true });
  });
  await batch.commit();
  busy(false);
  alert('✅ Fake demo data बन गया! हर नाम के आगे "(Fake)" लिखा है। हटाने के लिए "🗑️ सारा Fake Data Delete करो" इस्तेमाल करो।');
  renderApp();
 } catch(e){ busy(false); alert('❌ Error: '+e.message); }
}
async function deleteFakeDemoData(){
 if(!isSuperAdmin()){ alert('❌ सिर्फ Admin कर सकता है'); return; }
 if(!confirm('⚠️ सारा FAKE demo data permanently delete हो जाएगा (असली data को हाथ नहीं लगेगा)। पक्का?')) return;
 busy(true);
 try{
  for(const col of ['members','shaadi','property','news','events']){
   const snap = await db.collection(col).where('isFake','==',true).get();
   if(snap.empty) continue;
   const batch = db.batch();
   snap.forEach(d => batch.delete(d.ref));
   await batch.commit();
  }
  busy(false);
  alert('✅ सारा fake demo data delete हो गया।');
  renderApp();
 } catch(e){ busy(false); alert('❌ Error: '+e.message); }
}

// ================= ADMIN HELPERS =================
function switchTab(t){ adminTab=t; editingId=null; adminEditTarget=null; renderApp(); }
function _localCol(col){
 if(col==='members') return membersData; if(col==='events') return eventsData;
 if(col==='news') return newsData; if(col==='photos') return photosData;
 if(col==='olditems') return oldItems; if(col==='pratibha') return pratibhaData;
 if(col==='jobs') return jobsData; if(col==='shaadi') return shaadiData;
 if(col==='relatives') return relativesData; if(col==='committee') return committeeData;
 if(col==='garba_regs') return garbaRegs; if(col==='garba_team') return garbaTeam;
 if(col==='garba_coords') return garbaCoords;
 if(col==='cricket') return cricketData; if(col==='property') return propertyData;
 if(col==='blood') return bloodData; if(col==='suggestions') return suggestionsData;
 if(col==='village_leads') return villageLeadsData;
 if(col==='dharamshala') return dharamshalaData; if(col==='hospitals') return hospitalsData;
 if(col==='student_needs') return studentNeedsData; if(col==='students') return studentsData;
 if(col==='blood_sos') return bloodSosData; if(col==='obituaries') return obituariesData;
 if(col==='village_info') return villageInfoData;
 if(col==='referral_preapprovals') return referralPreapprovalsData;
 return null;
}
async function updDoc(col,id,data){
 // OPTIMISTIC: pehle screen par turant dikhाओ, phir server par save karo
 const arr = _localCol(col);
 if(arr){ const it = arr.find(x=>x.id===id); if(it) Object.assign(it, data); }
 renderApp();
 try{ await db.collection(col).doc(id).update(data); }
 catch(e){ alert('⚠️ Save error - internet check karo: '+e.message); }
}
async function delDoc(col,id,msg){
 if(!confirm(msg||'Delete?')) return;
 const arr = _localCol(col);
 if(arr){ const i = arr.findIndex(x=>x.id===id); if(i>-1) arr.splice(i,1); }
 renderApp();
 try{ await db.collection(col).doc(id).delete(); }
 catch(e){ alert('⚠️ Delete error: '+e.message); }
}

// Members
async function approveMember(id){ await updDoc('members',id,{status:'approved'}); alert('✅ Approved!'); }
function rejectMember(id){ delDoc('members',id,'Reject और delete करना है?'); }
function deleteMemberAdmin(id){ delDoc('members',id,'Member delete करना है?'); }
function editMemberAdmin(id){ editingId=id; renderApp(); window.scrollTo(0,0); }
async function saveMemberAdmin(){
 const d = readMemberForm('adm_');
 busy(true); await db.collection('members').doc(editingId).update(d);
 editingId=null; busy(false); alert('✅ Updated!'); renderApp();
}
async function addMemberAdmin(){
 const d = readMemberForm('new_');
 if(!d.name||!d.phone){ alert('❌ Name और Phone जरूरी!'); return; }
 d.status='approved'; d.createdAt=today();
 busy(true); await db.collection('members').add(d);
 showAddForm=false; busy(false); alert('✅ Member added!'); renderApp();
}
async function blockUser(phone){
 if(!confirm(phone+' को BLOCK करना है?')) return;
 siteMeta.blocked = siteMeta.blocked||[]; siteMeta.blocked.push(phone);
 await saveMeta(); alert('🚫 Blocked!'); renderApp();
}
function downloadExcel(){
 const cols = ['status'].concat(MEMBER_FIELDS.map(f=>f[0]));
 const rows = [cols.join(',')].concat(membersData.map(m => cols.map(c => '"'+String(m[c]||'').replace(/"/g,'""')+'"').join(',')));
 const blob = new Blob(['\ufeff'+rows.join('\n')], {type:'text/csv;charset=utf-8'});
 const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='patidar-members-'+today()+'.csv'; a.click();
}
async function handleExcel(e){
 const file = e.target.files[0]; if(!file) return;
 Papa.parse(file, { header:true, skipEmptyLines:true, complete: async (res)=>{
  busy(true); let added=0;
  const batch = db.batch();
  res.data.forEach(row=>{
   const g=(k)=>row[k]||row[k.charAt(0).toUpperCase()+k.slice(1)]||row[k.toUpperCase()]||'';
   if(!g('name')||!g('phone')) return;
   const obj={status:'approved',createdAt:today()};
   MEMBER_FIELDS.forEach(f=>{ obj[f[0]]=String(g(f[0])||''); });
   obj.name=fmtName(obj.name); obj.surname=fmtName(obj.surname); obj.phone=fmtPhone(obj.phone);
   batch.set(db.collection('members').doc(), obj); added++;
  });
  await batch.commit(); busy(false);
  alert('✅ '+added+' members added!'); renderApp();
 }});
 e.target.value='';
}
function adminMemberRow(m, pending){
 let btns = pending ?
  '<button onclick="approveMember(\''+m.id+'\')" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅ APPROVE</button><button onclick="rejectMember(\''+m.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button>' :
  '<button onclick="editMemberAdmin(\''+m.id+'\')" class="bg-blue-500 text-white px-4 py-2 rounded font-bold">✏️</button><button onclick="deleteMemberAdmin(\''+m.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button><button onclick="blockUser(\''+esc(m.phone)+'\')" class="bg-gray-700 text-white px-3 py-2 rounded font-bold text-xs">🚫</button>';
 return '<div class="bg-white border-2 '+(pending?'border-yellow-400':'border-blue-300')+' rounded-lg p-4 flex flex-wrap justify-between items-center gap-3">'+
 '<div><p class="font-bold text-lg">'+esc(m.name)+' '+esc(m.surname)+' <span class="text-xs text-gray-500">('+esc(profOf(m)||'-')+')</span>'+(m.gender&&m.gender.indexOf('Female')===0&&m.privacy&&m.privacy.indexOf('Secret')===0?' <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">🔒 Secret</span>':'')+'</p>'+
 '<p class="text-sm text-gray-600">📱 '+esc(m.phone)+' | '+esc(m.blood_group||'')+'</p>'+
 '<p class="text-sm text-gray-600">🏡 '+esc(m.home_village||'-')+', '+esc(distOf(m,'home')||'-')+' → 📍 '+esc(m.present_city||'-')+'</p>'+
 (m.business_name?'<p class="text-sm text-yellow-700">🏪 '+esc(m.business_name)+'</p>':'')+'</div>'+
 '<div class="flex gap-2 flex-wrap">'+btns+'</div></div>';
}

// Events
async function addEventAdmin(){
 const t=document.getElementById('ev_title').value.trim(), d=document.getElementById('ev_date').value, l=document.getElementById('ev_loc').value.trim();
 if(!t||!d||!l){ alert('❌ Name, Date, Place जरूरी!'); return; }
 busy(true);
 await db.collection('events').add({title:t,date:d,time:document.getElementById('ev_time').value||'18:00',location:l,description:document.getElementById('ev_desc').value.trim(),pic:document.getElementById('ev_pic')?document.getElementById('ev_pic').value:''});
 busy(false); alert('✅ Event added!'); renderApp();
}
// ===== EDIT (photo सहित) : Events / News / Pratibha / Gallery =====
let editEventId=null, editNewsId=null, editPratId=null, editPhotoId=null;
function startEditEvent(id){ editEventId=id; editNewsId=editPratId=editPhotoId=null; renderApp(); window.scrollTo(0,0); }
function startEditNews(id){ editNewsId=id; editEventId=editPratId=editPhotoId=null; renderApp(); window.scrollTo(0,0); }
function startEditPrat(id){ editPratId=id; editEventId=editNewsId=editPhotoId=null; renderApp(); window.scrollTo(0,0); }
function startEditPhoto(id){ editPhotoId=id; editEventId=editNewsId=editPratId=null; renderApp(); window.scrollTo(0,0); }
function cancelEdit(){ editEventId=editNewsId=editPratId=editPhotoId=null; renderApp(); }
function _v(id){ const el=document.getElementById(id); return el ? (el.value||'').trim() : ''; }

async function saveEditEvent(){
 const id = editEventId; if(!id) return;
 const d = {title:_v('ee_title'), date:_v('ee_date'), time:_v('ee_time'), location:_v('ee_loc'), description:_v('ee_desc'), pic:_v('ee_pic')};
 if(!d.title||!d.date||!d.location){ alert('❌ Event Name, Date, Place जरूरी!'); return; }
 editEventId=null; await updDoc('events',id,d); alert('✅ Event update हो गया!');
}
async function saveEditNews(){
 const id = editNewsId; if(!id) return;
 const d = {title:_v('en_title'), date:_v('en_date'), content:_v('en_content'), pic:_v('en_pic')};
 if(!d.title||!d.date||!d.content){ alert('❌ Heading, Date और News तीनों जरूरी!'); return; }
 editNewsId=null; await updDoc('news',id,d); alert('✅ News update हो गई!');
}
async function saveEditPrat(){
 const id = editPratId; if(!id) return;
 const d = {name:fmtName(_v('ep_name')), achievement:_v('ep_ach'), place:fmtName(_v('ep_place')), details:_v('ep_desc'), pic:_v('ep_pic')};
 if(!d.name||!d.achievement){ alert('❌ Name और Achievement जरूरी!'); return; }
 editPratId=null; await updDoc('pratibha',id,d); alert('✅ प्रतिभा update हो गई!');
}
async function saveEditPhoto(){
 const id = editPhotoId; if(!id) return;
 const d = {title:_v('eg_title'), caption:_v('eg_cap'), url:_v('eg_url')};
 if(!d.url){ alert('❌ Photo जरूरी है!'); return; }
 editPhotoId=null; await updDoc('photos',id,d); alert('✅ Photo update हो गई!');
}
function _photoField(fid, val, label){
 return '<div><label class="text-xs font-bold">'+label+'</label>'+
  '<input type="hidden" id="'+fid+'" value="'+esc(val||'')+'">'+
  '<button type="button" onclick="openCloudUpload(\''+fid+'\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Photo बदलो / Upload</button>'+
  '<img id="'+fid+'_prev" src="'+esc(val||'')+'" class="'+(val?'':'hidden ')+'mt-2 h-24 w-full object-cover rounded border-2"></div>';
}
function editEventForm(){
 const e = eventsData.find(x=>x.id===editEventId); if(!e) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">✏️ EDIT EVENT</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Event Name *</label><input id="ee_title" value="'+esc(e.title)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Place *</label><input id="ee_loc" value="'+esc(e.location)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Date *</label><input type="date" id="ee_date" value="'+esc(e.date)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Time</label><input type="time" id="ee_time" value="'+esc(e.time||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Description</label><textarea id="ee_desc" rows="2" class="w-full px-3 py-2 border-2 rounded">'+String(e.description||'').replace(/</g,'&lt;')+'</textarea></div>'+
  _photoField('ee_pic', e.pic, 'Event Photo 📷')+'</div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveEditEvent()" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editNewsForm(){
 const n = newsData.find(x=>x.id===editNewsId); if(!n) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">✏️ EDIT NEWS</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">1️⃣ Heading / शीर्षक *</label><input id="en_title" value="'+esc(n.title)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">2️⃣ Date / तारीख *</label><input type="date" id="en_date" value="'+esc(n.date)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">3️⃣ News / समाचार *</label><textarea id="en_content" rows="4" class="w-full px-3 py-2 border-2 rounded">'+String(n.content||'').replace(/</g,'&lt;')+'</textarea></div>'+
  _photoField('en_pic', n.pic, '4️⃣ News Photo 📷')+'</div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveEditNews()" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editPratForm(){
 const p = pratibhaData.find(x=>x.id===editPratId); if(!p) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">✏️ EDIT प्रतिभा</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="ep_name" value="'+esc(p.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Achievement *</label><input id="ep_ach" value="'+esc(p.achievement)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Village / City</label><input id="ep_place" value="'+esc(p.place||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  _photoField('ep_pic', p.pic, 'Photo 📷')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="ep_desc" rows="2" class="w-full px-3 py-2 border-2 rounded">'+String(p.details||'').replace(/</g,'&lt;')+'</textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveEditPrat()" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editPhotoForm(){
 const p = photosData.find(x=>x.id===editPhotoId); if(!p) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">✏️ EDIT / UPDATE PHOTO</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Title</label><input id="eg_title" value="'+esc(p.title||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Caption</label><input id="eg_cap" value="'+esc(p.caption||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2">'+_photoField('eg_url', p.url, '📷 Photo बदलो *')+'</div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveEditPhoto()" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}

// ===== EDIT (photo सहित नहीं / mostly text) : Garba Team/Coords, Cricket, Blood, Property, Shaadi, Jobs, OLX, Committee =====
let adminEditTarget = null; // {type, id}
function startAdminEdit(type, id){ adminEditTarget = {type, id}; renderApp(); window.scrollTo(0,0); }
function cancelAdminEdit(){ adminEditTarget = null; renderApp(); }
function isAdminEditing(type){ return adminEditTarget && adminEditTarget.type===type; }

function editGarbaTeamForm(){
 const t = garbaTeam.find(x=>x.id===adminEditTarget.id); if(!t) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT TEAM MEMBER</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="gte_name" value="'+esc(t.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone</label><input id="gte_phone" value="'+esc(t.phone||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Role</label><input id="gte_role" value="'+esc(t.role||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  _photoField('gte_pic', t.pic, 'Photo 📷')+'</div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'garba_team\',{name:fmtName(_v(\'gte_name\')),phone:_v(\'gte_phone\'),role:_v(\'gte_role\'),pic:_v(\'gte_pic\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editGarbaCoordForm(){
 const c = garbaCoords.find(x=>x.id===adminEditTarget.id); if(!c) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT COORDINATOR</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4">'+
  '<div><label class="text-xs font-bold">Area *</label><input id="gce_area" value="'+esc(c.area)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Name *</label><input id="gce_name" value="'+esc(c.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone</label><input id="gce_phone" value="'+esc(c.phone||'')+'" class="w-full px-3 py-2 border-2 rounded"></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'garba_coords\',{area:fmtName(_v(\'gce_area\')),name:fmtName(_v(\'gce_name\')),phone:_v(\'gce_phone\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editCricketForm(){
 const c = cricketData.find(x=>x.id===adminEditTarget.id); if(!c) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT CRICKET REGISTRATION</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="cke_name" value="'+esc(c.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Area</label><input id="cke_area" value="'+esc(c.area||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone</label><input id="cke_phone" value="'+esc(c.phone||'')+'" class="w-full px-3 py-2 border-2 rounded"></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'cricket\',{name:fmtName(_v(\'cke_name\')),area:_v(\'cke_area\'),phone:_v(\'cke_phone\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editBloodForm(){
 const b = bloodData.find(x=>x.id===adminEditTarget.id); if(!b) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT BLOOD DONOR</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="ble_name" value="'+esc(b.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Blood Group *</label><input id="ble_bg" value="'+esc(b.blood_group||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">District</label><input id="ble_district" value="'+esc(b.district||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone</label><input id="ble_phone" value="'+esc(b.phone||'')+'" class="w-full px-3 py-2 border-2 rounded"></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'blood\',{name:fmtName(_v(\'ble_name\')),blood_group:_v(\'ble_bg\'),district:_v(\'ble_district\'),phone:_v(\'ble_phone\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editPropertyForm(){
 const p = propertyData.find(x=>x.id===adminEditTarget.id); if(!p) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT PROPERTY LISTING</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">क्या? *</label><select id="pre_kind" class="w-full px-3 py-2 border-2 rounded"><option value="makan" '+(p.kind==='makan'?'selected':'')+'>🏠 मकान</option><option value="dukan" '+(p.kind==='dukan'?'selected':'')+'>🏪 दुकान</option></select></div>'+
  '<div><label class="text-xs font-bold">Type *</label><select id="pre_type" class="w-full px-3 py-2 border-2 rounded"><option value="rent" '+(p.type==='rent'?'selected':'')+'>किराए पर देना है</option><option value="wanted" '+(p.type==='wanted'?'selected':'')+'>मुझे किराए पर चाहिए</option></select></div>'+
  '<div><label class="text-xs font-bold">Name *</label><input id="pre_name" value="'+esc(p.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone *</label><input id="pre_phone" value="'+esc(p.phone)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Area *</label><input id="pre_area" value="'+esc(p.area)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Rent</label><input id="pre_rent" value="'+esc(p.rent||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">BHK</label><input id="pre_bhk" value="'+esc(p.bhk||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="pre_desc" rows="2" class="w-full px-3 py-2 border-2 rounded">'+String(p.description||'').replace(/</g,'&lt;')+'</textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'property\',{kind:_v(\'pre_kind\'),type:_v(\'pre_type\'),name:fmtName(_v(\'pre_name\')),phone:_v(\'pre_phone\'),area:_v(\'pre_area\'),rent:_v(\'pre_rent\'),bhk:_v(\'pre_bhk\'),description:_v(\'pre_desc\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editShaadiForm(){
 const s = shaadiData.find(x=>x.id===adminEditTarget.id); if(!s) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT SHAADI PROFILE</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="she_name" value="'+esc(s.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Gender</label><select id="she_gender" class="w-full px-3 py-2 border-2 rounded"><option '+((s.gender||'').indexOf('Male')===0?'selected':'')+'>Male / पुरुष</option><option '+((s.gender||'').indexOf('Female')===0?'selected':'')+'>Female / महिला</option></select></div>'+
  '<div><label class="text-xs font-bold">Age</label><input id="she_age" value="'+esc(s.age||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Education</label><input id="she_edu" value="'+esc(s.education||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Village</label><input id="she_village" value="'+esc(s.village||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">District</label><input id="she_district" value="'+esc(s.district||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Contact</label><input id="she_contact" value="'+esc(s.contact||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  _photoField('she_pic', s.pic, 'Photo 📷')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="she_details" rows="2" class="w-full px-3 py-2 border-2 rounded">'+String(s.details||'').replace(/</g,'&lt;')+'</textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'shaadi\',{name:fmtName(_v(\'she_name\')),gender:_v(\'she_gender\'),age:_v(\'she_age\'),education:_v(\'she_edu\'),village:fmtName(_v(\'she_village\')),district:_v(\'she_district\'),contact:_v(\'she_contact\'),pic:_v(\'she_pic\'),details:_v(\'she_details\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editJobForm(){
 const j = jobsData.find(x=>x.id===adminEditTarget.id); if(!j) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT JOB POST</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Type</label><select id="jbe_kind" class="w-full px-3 py-2 border-2 rounded"><option value="dena" '+(j.kind==='dena'?'selected':'')+'>💼 रोज़गार देना है</option><option value="lena" '+(j.kind==='lena'?'selected':'')+'>🙋 रोज़गार चाहिए</option><option value="freelance_dena" '+(j.kind==='freelance_dena'?'selected':'')+'>💻 Freelancing देना है</option><option value="freelance_lena" '+(j.kind==='freelance_lena'?'selected':'')+'>🙋‍♂️ Freelancing चाहिए</option></select></div>'+
  '<div><label class="text-xs font-bold">Job Title *</label><input id="jbe_title" value="'+esc(j.title)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Company</label><input id="jbe_company" value="'+esc(j.company||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Place</label><input id="jbe_place" value="'+esc(j.place||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Salary</label><input id="jbe_salary" value="'+esc(j.salary||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Contact *</label><input id="jbe_phone" value="'+esc(j.phone)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="jbe_desc" rows="2" class="w-full px-3 py-2 border-2 rounded">'+String(j.details||'').replace(/</g,'&lt;')+'</textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'jobs\',{kind:_v(\'jbe_kind\'),title:_v(\'jbe_title\'),company:fmtName(_v(\'jbe_company\')),place:_v(\'jbe_place\'),salary:_v(\'jbe_salary\'),phone:_v(\'jbe_phone\'),details:_v(\'jbe_desc\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editOldItemForm(){
 const o = oldItems.find(x=>x.id===adminEditTarget.id); if(!o) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT ITEM</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Item *</label><input id="ite_title" value="'+esc(o.title)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Price *</label><input id="ite_price" value="'+esc(o.price)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Contact *</label><input id="ite_phone" value="'+esc(o.phone)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">OLX Link</label><input id="ite_olx" value="'+esc(o.olx_link||'')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  _photoField('ite_pic', o.pic, 'Photo 📷')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="ite_desc" rows="2" class="w-full px-3 py-2 border-2 rounded">'+String(o.description||'').replace(/</g,'&lt;')+'</textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'olditems\',{title:_v(\'ite_title\'),price:_v(\'ite_price\'),phone:_v(\'ite_phone\'),olx_link:_v(\'ite_olx\'),pic:_v(\'ite_pic\'),description:_v(\'ite_desc\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
function editCommitteeForm(){
 const c = committeeData.find(x=>x.id===adminEditTarget.id); if(!c) return '';
 return '<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">✏️ EDIT समिति MEMBER</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="cme_name" value="'+esc(c.name)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Post *</label><input id="cme_post" value="'+esc(c.post)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  _photoField('cme_pic', c.pic, 'Photo 📷')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="cme_details" rows="2" class="w-full px-3 py-2 border-2 rounded">'+String(c.details||'').replace(/</g,'&lt;')+'</textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="saveAdminEdit(\'committee\',{name:fmtName(_v(\'cme_name\')),post:_v(\'cme_post\'),pic:_v(\'cme_pic\'),details:_v(\'cme_details\')})" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="cancelAdminEdit()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
}
async function saveAdminEdit(col, data){
 const id = adminEditTarget && adminEditTarget.id; if(!id) return;
 adminEditTarget = null;
 await updDoc(col, id, data);
 alert('✅ Update हो गया!');
}
const ADMIN_EDIT_FORMS = { garba_team:editGarbaTeamForm, garba_coords:editGarbaCoordForm, cricket:editCricketForm, blood:editBloodForm, property:editPropertyForm, shaadi:editShaadiForm, jobs:editJobForm, olditems:editOldItemForm, committee:editCommitteeForm };

// News
async function addNewsAdmin(){
 const t=document.getElementById('nw_title').value.trim(), d=document.getElementById('nw_date').value, c=document.getElementById('nw_content').value.trim();
 if(!t||!d||!c){ alert('❌ सब भरो!'); return; }
 busy(true);
 await db.collection('news').add({title:t,date:d,content:c,pic:document.getElementById('nw_pic').value});
 busy(false); alert('✅ News added!'); renderApp();
}
async function toggleShaadiPaid(id, cur){ await updDoc('shaadi', id, {paid: !cur}); }

// Gallery
async function addPhotoAdmin(){
 const u=document.getElementById('ph_url').value;
 if(!u){ alert('❌ Photo upload करो!'); return; }
 busy(true);
 await db.collection('photos').add({title:document.getElementById('ph_title').value.trim(),caption:document.getElementById('ph_cap').value.trim(),url:u,createdAt:today()});
 busy(false); alert('✅ Photo added!'); renderApp();
}

// Shaadi
async function addShaadiAdmin(){
 const nm=fmtName(document.getElementById('sh_name').value);
 if(!nm){ alert('❌ Name जरूरी!'); return; }
 busy(true);
 await db.collection('shaadi').add({name:nm, gender:document.getElementById('sh_gender').value, age:document.getElementById('sh_age').value.trim(),
  education:document.getElementById('sh_edu').value.trim(), village:fmtName(document.getElementById('sh_village').value),
  district:document.getElementById('sh_district').value.trim(), details:document.getElementById('sh_details').value.trim(),
  pic:document.getElementById('sh_pic').value, contact:fmtPhone(document.getElementById('sh_contact').value), status:'approved', createdAt:today()});
 busy(false); alert('✅ Shaadi profile added!'); renderApp();
}

// Committee
async function addCommittee(){
 const nm=fmtName(document.getElementById('cm_name').value), po=document.getElementById('cm_post').value.trim();
 if(!nm||!po){ alert('❌ Name और Post जरूरी!'); return; }
 busy(true);
 await db.collection('committee').add({name:nm, post:po, details:document.getElementById('cm_details').value.trim(), pic:document.getElementById('cm_pic').value});
 busy(false); alert('✅ समिति member added!'); renderApp();
}

// Garba
async function addGarbaTeam(){
 const nm=fmtName(document.getElementById('gt_name').value), ph=fmtPhone(document.getElementById('gt_phone').value);
 if(!nm||!ph){ alert('❌ Name और Phone जरूरी!'); return; }
 busy(true);
 await db.collection('garba_team').add({name:nm,phone:ph,role:document.getElementById('gt_role').value.trim(),pic:document.getElementById('gt_pic').value});
 busy(false); alert('✅ Team member added!'); renderApp();
}
async function toggleGarbaForm(){
 siteMeta.garbaFormOpen = !siteMeta.garbaFormOpen; await saveMeta(); renderApp();
}
async function addGarbaCoord(){
 if(garbaCoords.length>=10){ alert('❌ ज्यादा से ज्यादा 10 Area Coordinators ही जोड़ सकते हो'); return; }
 const nm=fmtName(document.getElementById('gc_name').value), ph=fmtPhone(document.getElementById('gc_phone').value), area=document.getElementById('gc_area').value.trim();
 if(!nm||!ph||!area){ alert('❌ Name, Phone, Area जरूरी!'); return; }
 busy(true);
 await db.collection('garba_coords').add({name:nm,phone:ph,area:area,createdAt:today()});
 busy(false); alert('✅ Area Coordinator added!'); renderApp();
}

// Sub-admins
const SUBADMIN_TABS = [['members','👥 Members'],['relatives','👨‍👩‍👧 Relatives'],['garba','🪩 Garba'],['cricket','🏏 Cricket'],['property','🏠 Property'],['blood','🩸 Blood'],['shaadi','💍 Shaadi'],['rozgaar','💼 Jobs'],['olditems','🛒 सामान'],['events','📅 Events'],['news','📰 News'],['pratibha','🏆 प्रतिभा'],['gallery','🖼️ Gallery'],['suggestions','💡 Suggestions'],['referrals','🎗️ Referral']];
let saSearchQ = '', saSelectedPhone = '', saTabs = [];
function saSearch(v){ saSearchQ = v; saSelectedPhone = ''; renderApp(); }
function saPick(phone){ saSelectedPhone = phone; renderApp(); }
function saToggleTab(key){ saTabs = saTabs.includes(key) ? saTabs.filter(t=>t!==key) : saTabs.concat([key]); renderApp(); }
function saMatches(){
 const q = saSearchQ.trim().toLowerCase();
 if(!q) return [];
 const subAdminPhones = (siteMeta.subAdmins||[]).map(s=>fmtPhone(s.phone));
 return approvedMembers().filter(m =>
  m.phone !== ADMIN_PHONE && !subAdminPhones.includes(m.phone) &&
  ((m.name+' '+m.surname).toLowerCase().includes(q) || m.phone.includes(q))
 ).slice(0,8);
}
async function addSubAdmin(){
 const m = membersData.find(x => x.phone === saSelectedPhone);
 if(!m){ alert('❌ पहले Community search से एक member चुनो'); return; }
 if(!saTabs.length){ alert('❌ कम से कम 1 portal चुनो!'); return; }
 if((siteMeta.subAdmins||[]).find(s=>fmtPhone(s.phone)===m.phone)){ alert('❌ यह member पहले से sub-admin है!'); return; }
 const nm = fmtName(m.name+' '+m.surname);
 const tabsUsed = saTabs.slice();
 siteMeta.subAdmins = (siteMeta.subAdmins||[]).concat([{name:nm, phone:m.phone, tabs:tabsUsed, createdAt:today()}]);
 await saveMeta();
 saSearchQ=''; saSelectedPhone=''; saTabs=[];
 alert('✅ Sub-Admin बन गया!\n\n👤 '+nm+'\n📱 '+m.phone+'\n📂 Portals: '+tabsUsed.join(', ')+'\n\nउनको बोलो: website पर अपने इसी number से Register/Login करें\n→ ⚙️ button अपने आप दिखेगा → उनके portals खुलेंगे।');
 renderApp();
}
async function delSubAdmin(i){
 if(!confirm((siteMeta.subAdmins[i].name)+' को हटाना है?')) return;
 siteMeta.subAdmins.splice(i,1); await saveMeta(); renderApp();
}

// Blood donors (admin-managed)
async function addBloodAdmin(){
 const nm=fmtName(document.getElementById('bl_name').value), gr=document.getElementById('bl_group').value,
  ph=fmtPhone(document.getElementById('bl_phone').value), dist=document.getElementById('bl_district').value,
  vil=fmtName(document.getElementById('bl_village').value);
 if(!nm||!gr||!ph){ alert('❌ Name, Group, Phone जरूरी!'); return; }
 busy(true);
 await db.collection('blood').add({name:nm, blood_group:gr, phone:ph, district:dist, village:vil, createdAt:today()});
 busy(false); alert('✅ Donor added!'); renderApp();
}

// Site settings
async function saveSiteMeta(){
 siteMeta.ticker = document.getElementById('st_ticker').value.trim();
 siteMeta.aboutUs = document.getElementById('st_about').value.trim();
 siteMeta.fb = document.getElementById('st_fb').value.trim();
 siteMeta.insta = document.getElementById('st_insta').value.trim();
 siteMeta.youtube = document.getElementById('st_yt').value.trim();
 siteMeta.expiryDays = parseInt(document.getElementById('st_expiry').value)||30;
 siteMeta.propertyValidityDays = parseInt(document.getElementById('st_propdays').value)||365;
 siteMeta.propertyFeeRent = document.getElementById('st_propfeerent').value.trim()||'500';
 siteMeta.propertyFeeWanted = document.getElementById('st_propfeewanted').value.trim()||'11';
 siteMeta.razorpayPropRent = document.getElementById('st_rz_proprent').value.trim();
 siteMeta.razorpayPropWanted = document.getElementById('st_rz_propwanted').value.trim();
 siteMeta.shaadiFee = document.getElementById('st_shaadifee').value.trim();
 siteMeta.shaadiValidityDays = parseInt(document.getElementById('st_shaadidays').value)||180;
 siteMeta.razorpayShaadi = document.getElementById('st_rz_shaadi').value.trim();
 siteMeta.jobsFeeSeeker = document.getElementById('st_jobsfeeseeker').value.trim()||'11';
 siteMeta.razorpayJobsSeeker = document.getElementById('st_rz_jobsseeker').value.trim();
 siteMeta.bizPromoFee = document.getElementById('st_bizpromofee').value.trim()||'300';
 siteMeta.bizPromoValidityDays = parseInt(document.getElementById('st_bizpromodays').value)||365;
 siteMeta.razorpayBizPromo = document.getElementById('st_rz_bizpromo').value.trim();
 siteMeta.olxExtraItemFee = document.getElementById('st_olxextrafee').value.trim()||'100';
 siteMeta.razorpayOlxExtra = document.getElementById('st_rz_olxextra').value.trim();
 siteMeta.olxPromoFee = document.getElementById('st_olxpromofee').value.trim()||'100';
 siteMeta.razorpayOlxPromo = document.getElementById('st_rz_olxpromo').value.trim();
 siteMeta.texts = Object.assign({}, siteMeta.texts, {
  objective: document.getElementById('tx_objective').value.trim(),
  inviteMsg: document.getElementById('tx_invite').value.trim()
 });
 siteMeta.ads = [0,1,2,3,4].map(i => ({
  img: document.getElementById('ad_img_'+i).value,
  link: document.getElementById('ad_link_'+i).value.trim(),
  on: document.getElementById('ad_on_'+i).checked
 }));
 busy(true); await saveMeta(); busy(false);
 alert('✅ Site settings saved!'); renderApp();
}

function renderAdmin(){
 const pending = membersData.filter(m=>m.status==='pending');
 const approved = approvedMembers();
 const pendItems = oldItems.filter(o=>o.status==='pending');
 const pendPrat = pratibhaData.filter(p=>p.status==='pending');
 const pendJobs = jobsData.filter(j=>j.status==='pending');
 const pendGarba = garbaRegs.filter(g=>g.status==='pending');
 const pendProp = propertyData.filter(p=>p.status==='pending');
 const pendShaadi = shaadiData.filter(s=>s.status==='pending');
 const pendRel = relativesData.filter(r=>r.status==='pending');
 const pendSuggest = suggestionsData.filter(s=>s.status==='pending');
 const pendNews = newsData.filter(n=>n.status==='pending');
 const pendBizPromo = membersData.filter(m=>m.biz_promo_status==='pending');
 const pendDharamshala = dharamshalaData.filter(d=>d.status==='pending');
 const pendHospitals = hospitalsData.filter(h=>h.status==='pending');
 const pendStudentNeeds = studentNeedsData.filter(s=>s.status==='pending');
 let h = '<div class="bg-gradient-to-r from-red-900 to-red-800 text-white rounded-lg px-6 py-5 mb-6 flex flex-wrap justify-between items-center gap-3"><h2 class="text-2xl md:text-3xl font-bold">⚙️ ADMIN DASHBOARD</h2>'+
 '<div class="text-sm">👥 '+approved.length+' approved | ⏳ '+pending.length+' pending</div>'+
 '<button onclick="goPage(\'home\')" class="bg-blue-600 px-5 py-2 rounded font-bold">← BACK</button></div>';
 const tabs = [
  ['members','👥 MEMBERS'+(pending.length?' ('+pending.length+')':'')],
  ['relatives','👨‍👩‍👧 RELATIVES'+(pendRel.length?' ('+pendRel.length+')':'')],
  ['garba','🪩 GARBA'+(pendGarba.length?' ('+pendGarba.length+')':'')],
  ['cricket','🏏 CRICKET'],
  ['property','🏠 PROPERTY'+(pendProp.length?' ('+pendProp.length+')':'')],
  ['blood','🩸 BLOOD'],
  ['shaadi','💍 SHAADI'+(pendShaadi.length?' ('+pendShaadi.length+')':'')],
  ['rozgaar','💼 JOBS'+(pendJobs.length?' ('+pendJobs.length+')':'')],
  ['olditems','🛒 सामान'+(pendItems.length?' ('+pendItems.length+')':'')],
  ['events','📅 EVENTS'],
  ['news','📰 NEWS'+(pendNews.length?' ('+pendNews.length+')':'')],
  ['pratibha','🏆 प्रतिभा'+(pendPrat.length?' ('+pendPrat.length+')':'')],
  ['gallery','🖼️ GALLERY'],
  ['suggestions','💡 SUGGESTIONS'+(pendSuggest.length?' ('+pendSuggest.length+')':'')],
  ['referrals','🎗️ REFERRAL'+(pendBizPromo.length?' ('+pendBizPromo.length+')':'')],
  ['villageleads','📍 गाँव/तहसील'+(villageLeadsData.length?' ('+villageLeadsData.length+')':'')],
  ['dharamshala','🛕 धर्मशाला'+(pendDharamshala.length?' ('+pendDharamshala.length+')':'')],
  ['hospitals','🏥 अस्पताल'+(pendHospitals.length?' ('+pendHospitals.length+')':'')],
  ['students','🎓 STUDENT'+(pendStudentNeeds.length?' ('+pendStudentNeeds.length+')':'')],
  ['obituaries','🕯️ शोक समाचार'],
  ['meregaanv','🏡 मेरे गाँव'],
  ['site','🌐 SITE']
 ];
 const allowed = allowedTabs();
 const visTabs = allowed===null ? tabs : tabs.filter(t => allowed.includes(t[0]));
 if(allowed!==null && !allowed.includes(adminTab) && visTabs.length) adminTab = visTabs[0][0];
 const sub = subAdminInfo();
 if(sub) h += '<div class="bg-indigo-100 border border-indigo-300 rounded-lg px-4 py-2 mb-4 text-sm font-bold text-indigo-800">👤 Sub-Admin: '+esc(sub.name)+' | Portals: '+(sub.tabs||[]).join(', ')+'</div>';
 h += '<div class="flex gap-2 mb-6 overflow-x-auto">'+visTabs.map(t=>'<button onclick="switchTab(\''+t[0]+'\')" class="px-4 py-3 rounded-lg font-bold whitespace-nowrap text-sm '+(adminTab===t[0]?'bg-red-600 text-white':'bg-white border-2')+'">'+t[1]+'</button>').join('')+'</div>';

 if(adminTab==='members'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING APPROVALS ('+pending.length+')</h3>';
  h += pending.length ? '<div class="space-y-3">'+pending.map(m=>adminMemberRow(m,true)).join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  if(editingId){
   const m = membersData.find(x=>x.id===editingId);
   if(m) h += '<div class="bg-blue-50 border-2 border-blue-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">✏️ EDIT: '+esc(m.name)+' '+esc(m.surname)+'</h3>'+memberFormHTML('adm_',m)+
   '<div class="flex gap-3 mt-5"><button onclick="saveMemberAdmin()" class="bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE</button><button onclick="editingId=null;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
  }
  h += '<div class="flex flex-wrap gap-3 mb-6"><button onclick="showAddForm=!showAddForm;renderApp()" class="bg-green-600 text-white px-5 py-3 rounded font-bold">➕ ADD MEMBER</button>'+
  '<label class="bg-blue-600 text-white px-5 py-3 rounded font-bold cursor-pointer">📥 UPLOAD EXCEL<input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="handleExcel(event)"></label>'+
  '<button onclick="downloadExcel()" class="bg-teal-600 text-white px-5 py-3 rounded font-bold">📤 DOWNLOAD EXCEL</button></div>';
  if(showAddForm) h += '<div class="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">➕ NEW MEMBER</h3>'+memberFormHTML('new_')+
   '<div class="flex gap-3 mt-5"><button onclick="addMemberAdmin()" class="bg-green-600 text-white px-8 py-3 rounded font-bold">✅ ADD</button><button onclick="showAddForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-2xl font-bold mb-4">✅ APPROVED ('+approved.length+')</h3><div class="space-y-3">'+approved.map(m=>adminMemberRow(m,false)).join('')+'</div></div>';
 }

 if(adminTab==='relatives'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING RELATIVE REQUESTS ('+pendRel.length+')</h3>';
  h += pendRel.length ? '<div class="space-y-3">'+pendRel.map(r=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p><b>'+esc(r.fromName)+'</b> ('+esc(r.fromPhone)+') → <b>'+esc(r.toName)+'</b> ('+esc(r.toPhone)+') : <span class="font-bold text-indigo-700">'+esc(r.relation)+'</span></p><div class="flex gap-2"><button onclick="updDoc(\'relatives\',\''+r.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'relatives\',\''+r.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
 }

 if(adminTab==='suggestions'){
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-2xl font-bold mb-4">💡 SUGGESTIONS / सलाह ('+suggestionsData.length+')</h3>'+
  (suggestionsData.length ? '<div class="space-y-3">'+suggestionsData.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).map(s=>
   '<div class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4"><div class="flex justify-between items-start gap-3 flex-wrap"><div><p class="font-bold">'+esc(s.name||'Anonymous')+'</p>'+(s.phone?'<p class="text-xs text-gray-500">📱 '+esc(s.phone)+'</p>':'')+'<p class="text-xs text-gray-400">📅 '+esc(s.createdAt||'')+'</p></div>'+
   '<button onclick="delDoc(\'suggestions\',\''+s.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>'+
   '<p class="text-gray-700 mt-2 whitespace-pre-line">'+esc(s.text)+'</p></div>'
  ).join('')+'</div>' : '<p class="text-gray-400 text-center py-8">अभी कोई suggestion नहीं आई</p>')+
  '</div>';
 }

 if(adminTab==='villageleads'){
  const grouped = {};
  villageLeadsData.forEach(v => {
   const key = (v.village||'-')+(v.tehsil?' / '+v.tehsil:'')+(v.district?' | '+v.district:'')+(v.state?' | '+v.state:'');
   grouped[key] = (grouped[key]||0) + 1;
  });
  const summary = Object.entries(grouped).sort((a,b)=>b[1]-a[1]);
  h += '<div class="bg-teal-50 border-2 border-teal-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">📊 गाँव/तहसील के हिसाब से (Total: '+villageLeadsData.length+')</h3>'+
  (summary.length ? '<div class="space-y-1">'+summary.map(([k,c])=>'<div class="flex justify-between bg-white rounded px-3 py-2 text-sm"><span class="font-bold">'+esc(k)+'</span><span class="text-teal-700 font-bold">'+c+'</span></div>').join('')+'</div>' : '<p class="text-gray-500">अभी कोई data नहीं</p>')+
  '</div>';
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">📋 सभी Entries</h3>'+
  (villageLeadsData.length ? '<div class="space-y-2">'+villageLeadsData.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).map(v=>
   '<div class="flex justify-between items-start bg-gray-50 rounded-lg px-4 py-2 gap-2"><span class="text-sm">🏡 '+(v.village?bilingualHTML(v.village,v.village_hi):'-')+(v.tehsil?' | '+bilingualHTML(v.tehsil,v.tehsil_hi):'')+(v.district?' | '+esc(v.district):'')+(v.state?' | '+esc(v.state):'')+' <span class="text-gray-400">('+esc(v.createdAt||'')+')</span>'+(v.notes?'<br><span class="text-xs text-gray-500">📝 '+esc(v.notes)+'</span>':'')+'</span>'+
   '<button onclick="delDoc(\'village_leads\',\''+v.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm shrink-0">🗑️</button></div>'
  ).join('')+'</div>' : '<p class="text-gray-400 text-center py-8">कोई entry नहीं</p>')+
  '</div>';
 }

 if(adminTab==='dharamshala'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING ('+pendDharamshala.length+')</h3>';
  h += pendDharamshala.length ? '<div class="space-y-3">'+pendDharamshala.map(d=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p><b>'+bilingualHTML(d.name_en,d.name_hi)+'</b> — '+(d.kind==='hotel'?'🏨 Hotel':'🛕 गाँव')+' | '+(d.ownerType==='samaj'?'समाज की':'व्यक्ति विशेष')+' | 📍 '+esc(d.village||'-')+(d.tehsil?'/'+esc(d.tehsil):'')+' | 📞 '+esc(d.phone)+'</p><div class="flex gap-2"><button onclick="updDoc(\'dharamshala\',\''+d.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'dharamshala\',\''+d.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  const liveD = dharamshalaData.filter(d=>d.status==='approved');
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">✅ LIVE ('+liveD.length+')</h3><div class="space-y-2">'+
  liveD.map(d=>'<div class="flex justify-between items-center bg-orange-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="text-sm font-bold">'+bilingualHTML(d.name_en,d.name_hi)+' | '+(d.kind==='hotel'?'🏨':'🛕')+' | 📞'+esc(d.phone)+'</span><button onclick="delDoc(\'dharamshala\',\''+d.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+
  '</div></div>';
 }

 if(adminTab==='hospitals'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING ('+pendHospitals.length+')</h3>';
  h += pendHospitals.length ? '<div class="space-y-3">'+pendHospitals.map(hp=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p><b>'+bilingualHTML(hp.name_en,hp.name_hi)+'</b> — '+(hp.kind==='samaj'?'🛕 समाज/Trust':'🏥 निजी')+(hp.runBy?' | '+esc(hp.runBy):'')+' | 📞 '+esc(hp.phone)+'</p><div class="flex gap-2"><button onclick="updDoc(\'hospitals\',\''+hp.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'hospitals\',\''+hp.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  const liveH = hospitalsData.filter(hp=>hp.status==='approved');
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">✅ LIVE ('+liveH.length+')</h3><div class="space-y-2">'+
  liveH.map(hp=>'<div class="flex justify-between items-center bg-sky-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="text-sm font-bold">'+bilingualHTML(hp.name_en,hp.name_hi)+' | '+(hp.kind==='samaj'?'🛕':'🏥')+' | 📞'+esc(hp.phone)+'</span><button onclick="delDoc(\'hospitals\',\''+hp.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+
  '</div></div>';
 }

 if(adminTab==='students'){
  h += '<div class="bg-fuchsia-50 border-2 border-fuchsia-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">🎓 REGISTERED STUDENTS ('+studentsData.length+')</h3>'+
  (studentsData.length ? '<div class="space-y-1">'+studentsData.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).map(s=>'<div class="flex justify-between bg-white rounded px-3 py-2 text-sm"><span>'+esc(s.name)+' — '+esc(s.college)+(s.homeVillage?' | 🏡 '+esc(s.homeVillage):'')+'</span><span class="text-gray-400">📞'+esc(s.phone)+'</span></div>').join('')+'</div>' : '<p class="text-gray-500">अभी कोई registered नहीं</p>')+
  '</div>';
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING NEEDS-DIRECTORY ('+pendStudentNeeds.length+')</h3>';
  h += pendStudentNeeds.length ? '<div class="space-y-3">'+pendStudentNeeds.map(s=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p><b>'+bilingualHTML(s.name_en,s.name_hi)+'</b> — '+esc((STUDENT_NEED_KINDS.find(k=>k[0]===s.kind)||[,,'Other'])[2])+(s.area?' | 📍 '+esc(s.area):'')+' | 📞 '+esc(s.phone)+'</p><div class="flex gap-2"><button onclick="updDoc(\'student_needs\',\''+s.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'student_needs\',\''+s.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  const liveS = studentNeedsData.filter(s=>s.status==='approved');
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">✅ LIVE DIRECTORY ('+liveS.length+')</h3><div class="space-y-2">'+
  liveS.map(s=>'<div class="flex justify-between items-center bg-fuchsia-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="text-sm font-bold">'+bilingualHTML(s.name_en,s.name_hi)+' | '+esc((STUDENT_NEED_KINDS.find(k=>k[0]===s.kind)||[,,'Other'])[2])+' | 📞'+esc(s.phone)+'</span><button onclick="delDoc(\'student_needs\',\''+s.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+
  '</div></div>';
 }

 if(adminTab==='obituaries'){
  h += '<div class="bg-gray-100 border-2 border-gray-400 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">➕ ADD शोक समाचार</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">नाम *</label><input id="ob_name" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">उम्र / Age</label><input id="ob_age" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">गाँव/शहर</label><input id="ob_place" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">दिनांक</label><input id="ob_date" type="date" class="w-full px-3 py-2 border-2 rounded"></div>'+
  _photoField('ob_pic','','फोटो 📷')+
  '<div class="md:col-span-2"><label class="text-xs font-bold">श्रद्धांजलि संदेश</label><textarea id="ob_message" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<button onclick="submitObituaryAdmin()" class="mt-4 bg-gray-700 text-white px-8 py-3 rounded font-bold">✅ POST करो</button></div>';
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">🕯️ ALL NOTICES ('+obituariesData.length+')</h3><div class="space-y-2">'+
  obituariesData.map(o=>'<div class="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="text-sm font-bold">'+esc(o.name)+(o.place?' | '+esc(o.place):'')+(o.deathDate?' | '+esc(o.deathDate):'')+'</span><button onclick="delDoc(\'obituaries\',\''+o.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+
  '</div></div>';
 }

 if(adminTab==='meregaanv'){
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">🏡 गाँव Descriptions ('+villageInfoData.length+')</h3><p class="text-xs text-gray-500 mb-4">कोई भी member ये लिख/सुधार सकता है — गलत/spam content यहाँ से हटाओ</p><div class="space-y-2">'+
  (villageInfoData.length ? villageInfoData.map(v=>'<div class="flex justify-between items-start bg-gray-50 rounded-lg px-4 py-2 gap-2"><span class="text-sm"><b>'+esc(v.village)+'</b><br><span class="text-gray-600">'+esc(v.description)+'</span></span><button onclick="delDoc(\'village_info\',\''+v.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm shrink-0">🗑️</button></div>').join('') : '<p class="text-gray-400 text-center py-8">कोई description नहीं है</p>')+
  '</div></div>';
 }

 if(adminTab==='referrals'){
  h += '<div class="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">🚀 PENDING BUSINESS PROMOTIONS ('+pendBizPromo.length+')</h3>';
  h += pendBizPromo.length ? '<div class="space-y-3">'+pendBizPromo.map(m=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p><b>'+esc(m.business_name||'-')+'</b> — '+esc(m.name+' '+m.surname)+' ('+esc(m.phone)+')'+(m.biz_promo_referredBy?' | 🎗️ '+esc(referrerNameOf(m.biz_promo_referredBy)):'')+'</p><div class="flex gap-2"><button onclick="approveBizPromo(\''+m.id+'\')" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅ Activate</button><button onclick="rejectBizPromo(\''+m.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  const board = computeReferralLeaderboard();
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-2xl font-bold mb-1">🎗️ REFERRAL LEADERBOARD</h3><p class="text-xs text-gray-500 mb-4">Property/Jobs/Shaadi/Business-Promotion — approved paid items जिनमें referrer select हुआ था</p>';
  h += !board.length ? '<p class="text-gray-400 text-center py-8">अभी कोई referral नहीं</p>' :
   '<div class="space-y-2">'+board.map((r,i)=>'<div class="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-lg px-4 py-3"><span class="font-bold">#'+(i+1)+' '+esc(referrerNameOf(r.phone))+' <span class="text-xs text-gray-500 font-normal">('+esc(r.phone)+')</span></span><span class="font-bold text-orange-700">'+r.count+' referrals · ₹'+r.amount+'</span></div>').join('')+'</div>';
  h += '</div>';
  const labhSorted = labhData.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  h += '<div class="bg-white rounded-lg shadow p-6 mt-6"><h3 class="text-2xl font-bold mb-1">🏅 लाभ AUDIT TRAIL ('+labhData.length+')</h3><p class="text-xs text-gray-500 mb-4">किसने किसको कब लाभ दिया — verification calls के लिए। Active = 30 दिन के अंदर देने वाला active था</p>';
  h += !labhSorted.length ? '<p class="text-gray-400 text-center py-8">अभी कोई लाभ नहीं दिया गया</p>' :
   '<div class="space-y-2 max-h-96 overflow-y-auto">'+labhSorted.map(l => {
    const active = isLabhActive(l);
    return '<div class="flex justify-between items-center bg-gray-50 border rounded-lg px-4 py-2.5 flex-wrap gap-2"><span class="text-sm"><b>'+esc(l.fromName)+'</b> ('+esc(l.fromPhone)+') → <b>'+esc(l.toName)+'</b> ('+esc(l.toPhone)+') <span class="text-gray-400">— '+esc(l.createdAt)+'</span> '+(active?'<span class="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold ml-1">ACTIVE</span>':'<span class="text-[10px] bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full font-bold ml-1">EXPIRED (30+ दिन inactive)</span>')+'</span><button onclick="delDoc(\'labh\',\''+l.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️ Revoke</button></div>';
   }).join('')+'</div>';
  h += '</div>';
 }

 if(adminTab==='garba'){
  h += '<div class="bg-pink-50 border-2 border-pink-400 rounded-lg p-6 mb-6 flex justify-between items-center flex-wrap gap-3"><p class="font-bold">Registration Form: <span class="'+(siteMeta.garbaFormOpen?'text-green-600':'text-red-600')+'">'+(siteMeta.garbaFormOpen?'OPEN ✅':'CLOSED ❌')+'</span></p><button onclick="toggleGarbaForm()" class="bg-pink-600 text-white px-5 py-2 rounded font-bold">🔄 TOGGLE ON/OFF</button></div>';
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">⏳ PENDING REGISTRATIONS ('+pendGarba.length+')</h3>';
  h += pendGarba.length ? '<div class="space-y-3">'+pendGarba.map(g=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p><b>'+esc(g.name)+'</b> | Age '+esc(g.age||'-')+' | '+esc(g.area)+' | 📱'+esc(g.phone)+'</p><div class="flex gap-2"><button onclick="updDoc(\'garba_regs\',\''+g.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'garba_regs\',\''+g.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  h += '<div class="bg-pink-50 border-2 border-pink-400 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">➕ ADD TEAM MEMBER</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  '<input id="gt_name" placeholder="Name" class="px-3 py-2 border-2 rounded"><input id="gt_phone" placeholder="Phone" maxlength="10" class="px-3 py-2 border-2 rounded">'+
  '<input id="gt_role" placeholder="Role (जैसे Coordinator)" class="px-3 py-2 border-2 rounded">'+
  '<div><input type="hidden" id="gt_pic"><button type="button" onclick="openCloudUpload(\'gt_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Photo</button></div></div>'+
  '<button onclick="addGarbaTeam()" class="mt-3 bg-pink-600 text-white px-6 py-2 rounded font-bold">✅ ADD</button></div>';
  if(isAdminEditing('garba_team')) h += editGarbaTeamForm();
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">Team ('+garbaTeam.length+')</h3><div class="space-y-2">'+garbaTeam.map(t=>'<div class="flex justify-between items-center bg-pink-50 rounded-lg px-4 py-2"><span class="font-bold">'+esc(t.name)+' - '+esc(t.role||'')+' ('+esc(t.phone)+')</span><div class="flex gap-2"><button onclick="startAdminEdit(\'garba_team\',\''+t.id+'\')" class="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">✏️</button><button onclick="delDoc(\'garba_team\',\''+t.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';
  h += '<div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-6 mt-6"><h3 class="text-xl font-bold mb-1">📍 AREA COORDINATORS ('+garbaCoords.length+'/10)</h3><p class="text-xs text-gray-500 mb-4">हर area के बच्चों को पता चले किससे बात करनी है — max 10</p><div class="grid grid-cols-1 md:grid-cols-3 gap-3">'+
  '<input id="gc_name" placeholder="Name" class="px-3 py-2 border-2 rounded"><input id="gc_phone" placeholder="Phone" maxlength="10" class="px-3 py-2 border-2 rounded"><input id="gc_area" placeholder="Area (जैसे Vishal Nagar)" class="px-3 py-2 border-2 rounded"></div>'+
  '<button onclick="addGarbaCoord()" class="mt-3 bg-purple-600 text-white px-6 py-2 rounded font-bold">✅ ADD</button>'+
  (isAdminEditing('garba_coords') ? editGarbaCoordForm() : '')+
  '<div class="mt-4 space-y-2">'+garbaCoords.map(c=>'<div class="flex justify-between items-center bg-white rounded-lg px-4 py-2 border"><span class="font-bold text-sm">📍 '+esc(c.area)+' — '+esc(c.name)+' ('+esc(c.phone)+')</span><div class="flex gap-2"><button onclick="startAdminEdit(\'garba_coords\',\''+c.id+'\')" class="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">✏️</button><button onclick="delDoc(\'garba_coords\',\''+c.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';
 }

 if(adminTab==='cricket'){
  if(isAdminEditing('cricket')) h += editCricketForm();
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">🏏 Interested Players ('+cricketData.length+')</h3><div class="space-y-2">'+
  cricketData.map(c=>'<div class="flex justify-between items-center bg-green-50 rounded-lg px-4 py-2"><span class="font-bold">'+esc(c.name)+' - '+esc(c.area)+' ('+esc(c.phone)+')</span><div class="flex gap-2"><button onclick="startAdminEdit(\'cricket\',\''+c.id+'\')" class="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">✏️</button><button onclick="delDoc(\'cricket\',\''+c.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';
 }

 if(adminTab==='property'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">⏳ PENDING LISTINGS ('+pendProp.length+')</h3>';
  h += pendProp.length ? '<div class="space-y-3">'+pendProp.map(p=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div>'+
   (p.pic?'<img src="'+p.pic+'" class="h-16 w-16 object-cover rounded inline-block mr-2">':'')+
   '<span><b>'+esc(p.name)+'</b> - '+(p.type==='rent'?'🏠 मकान':'🔍 चाहिए')+' | '+esc(p.area)+' | 📱'+esc(p.phone)+'</span></div><div class="flex gap-2"><button onclick="updDoc(\'property\',\''+p.id+'\',{status:\'approved\',approvedAt:today()})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'property\',\''+p.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  const appProp = propertyData.filter(p=>p.status==='approved');
  if(isAdminEditing('property')) h += editPropertyForm();
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">✅ LIVE LISTINGS ('+appProp.length+')</h3><div class="space-y-2">'+
  appProp.map(p=>'<div class="flex justify-between items-center bg-purple-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="font-bold">'+esc(p.name)+' - '+esc(p.area)+' <span class="text-xs '+(p.active!==false?'text-green-600':'text-red-600')+'">('+(p.active!==false?'ACTIVE':'INACTIVE')+')</span></span><div class="flex gap-2"><button onclick="updDoc(\'property\',\''+p.id+'\',{active:'+(p.active!==false?'false':'true')+'})" class="bg-gray-600 text-white px-3 py-1 rounded font-bold text-sm">🔄</button><button onclick="startAdminEdit(\'property\',\''+p.id+'\')" class="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">✏️</button><button onclick="delDoc(\'property\',\''+p.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';
 }

 if(adminTab==='blood'){
  const allSOS = bloodSosData.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  h += '<div class="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">🆘 SOS REQUESTS ('+allSOS.length+')</h3>'+
  (allSOS.length ? '<div class="space-y-2">'+allSOS.map(s=>'<div class="flex justify-between items-center bg-white rounded-lg px-4 py-2 flex-wrap gap-2"><span class="text-sm">'+(s.status==='resolved'?'✅':'🆘')+' <b>'+esc(s.bloodGroup)+'</b> — '+esc(s.hospital)+' | '+esc(s.fromName)+' | 📱'+esc(s.contactPhone)+' | '+esc(s.createdAt||'')+'</span><div class="flex gap-2">'+(s.status!=='resolved'?'<button onclick="resolveBloodSOS(\''+s.id+'\')" class="bg-gray-500 text-white px-3 py-1 rounded font-bold text-sm">✅ Resolve</button>':'')+'<button onclick="delDoc(\'blood_sos\',\''+s.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई SOS नहीं</p>')+
  '</div>';
  h += '<div class="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">➕ ADD BLOOD DONOR</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  '<input id="bl_name" placeholder="Name *" class="px-3 py-2 border-2 rounded">'+
  '<select id="bl_group" class="px-3 py-2 border-2 rounded"><option value="">Blood Group *</option>'+BLOOD_GROUPS.map(g=>'<option>'+g+'</option>').join('')+'</select>'+
  '<input id="bl_phone" maxlength="10" placeholder="Phone *" class="px-3 py-2 border-2 rounded">'+
  '<select id="bl_district" class="px-3 py-2 border-2 rounded"><option value="">District</option>'+MP_DISTRICTS.map(d=>'<option>'+d+'</option>').join('')+'</select>'+
  '<input id="bl_village" placeholder="Village/City" class="px-3 py-2 border-2 rounded"></div>'+
  '<button onclick="addBloodAdmin()" class="mt-4 bg-red-600 text-white px-8 py-3 rounded font-bold">✅ ADD DONOR</button>'+
  '<p class="text-xs text-gray-500 mt-2">💡 TIP: Members tab में जिनका blood_group भरा है, उनकी details यहाँ copy कर सकते हो</p></div>';
  if(isAdminEditing('blood')) h += editBloodForm();
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">🩸 ALL DONORS ('+bloodData.length+')</h3><div class="space-y-2">'+
  bloodData.map(b=>'<div class="flex justify-between items-center bg-red-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="font-bold text-sm">'+esc(b.name)+' | <span class="text-red-600">'+esc(b.blood_group)+'</span> | '+esc(b.district||'-')+' | 📱'+esc(b.phone)+'</span><div class="flex gap-2"><button onclick="startAdminEdit(\'blood\',\''+b.id+'\')" class="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">✏️</button><button onclick="delDoc(\'blood\',\''+b.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';
 }

 if(adminTab==='shaadi'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING SELF-SUBMITTED PROFILES ('+pendShaadi.length+')</h3>';
  h += pendShaadi.length ? '<div class="space-y-3">'+pendShaadi.map(s=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(s.pic?'<img src="'+s.pic+'" class="h-16 w-16 object-cover rounded">':'')+'<div><p class="font-bold">'+esc(s.name)+' | '+esc(s.gender||'-')+' | Age '+esc(s.age||'-')+' | '+esc(s.village||'-')+'</p><p class="text-sm text-gray-600">📞 '+esc(s.contact||'-')+(s.referredBy?' | 🎗️ '+esc(referrerNameOf(s.referredBy)):'')+'</p></div></div><div class="flex gap-2"><button onclick="updDoc(\'shaadi\',\''+s.id+'\',{status:\'approved\',approvedAt:today(),paid:true})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅ Activate</button><button onclick="delDoc(\'shaadi\',\''+s.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  h += '<div class="bg-pink-50 border-2 border-pink-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">➕ ADD SHAADI PROFILE (Admin — बिना payment link के)</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Name *</label><input id="sh_name" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Gender</label><select id="sh_gender" class="w-full px-3 py-2 border-2 rounded"><option>Male / पुरुष</option><option>Female / महिला</option></select></div>'+
  '<div><label class="text-xs font-bold">Age</label><input id="sh_age" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Education</label><input id="sh_edu" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Village</label><input id="sh_village" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">District</label><input id="sh_district" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Family Contact</label><input id="sh_contact" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="sh_pic"><button type="button" onclick="openCloudUpload(\'sh_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="sh_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="sh_details" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<button onclick="addShaadiAdmin()" class="mt-4 bg-pink-600 text-white px-8 py-3 rounded font-bold">✅ ADD PROFILE</button></div>';
  h += '<h3 class="text-xl font-bold mb-3">Live Profiles ('+shaadiData.filter(s=>s.status==='approved').length+')</h3>';
  if(isAdminEditing('shaadi')) h += editShaadiForm();
  h += '<div class="space-y-3">'+shaadiData.filter(s=>s.status==='approved').map(s=>{
   const isPaid = s.paid!==false;
   return '<div class="bg-white border-2 border-pink-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(s.pic?'<img src="'+s.pic+'" class="h-16 w-16 object-cover rounded">':'')+'<div><p class="font-bold">'+esc(s.name)+' | '+esc(s.gender||'-')+' | '+esc(s.age||'-')+' | '+esc(s.village||'-')+' '+(isPaid?'<span class="text-[10px] bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-bold">⭐ PAID</span>':'<span class="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">UNPAID</span>')+'</p><p class="text-sm text-gray-600">📞 '+esc(s.contact||'-')+'</p></div></div><div class="flex gap-2"><button onclick="toggleShaadiPaid(\''+s.id+'\','+isPaid+')" class="'+(isPaid?'bg-gray-600':'bg-yellow-500')+' text-white px-4 py-2 rounded font-bold text-sm">'+(isPaid?'UNPAID करो':'⭐ PAID करो')+'</button><button onclick="startAdminEdit(\'shaadi\',\''+s.id+'\')" class="bg-blue-500 text-white px-4 py-2 rounded font-bold">✏️</button><button onclick="delDoc(\'shaadi\',\''+s.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div></div>';
  }).join('')+'</div>';
 }

 if(adminTab==='rozgaar'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING JOBS ('+pendJobs.length+')</h3>';
  h += pendJobs.length ? '<div class="space-y-3">'+pendJobs.map(j=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div><p class="font-bold">'+esc(j.title)+' - '+esc(j.company||'')+'</p><p class="text-sm text-gray-600">📍 '+esc(j.place||'')+' | 📱 '+esc(j.phone)+'</p></div><div class="flex gap-2"><button onclick="updDoc(\'jobs\',\''+j.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'jobs\',\''+j.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  if(isAdminEditing('jobs')) h += editJobForm();
  h += '<div class="space-y-3">'+jobsData.filter(j=>j.status==='approved').map(j=>'<div class="bg-white border-2 border-green-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p class="font-bold">'+esc(j.title)+' ('+esc(j.place||'')+')</p><div class="flex gap-2"><button onclick="startAdminEdit(\'jobs\',\''+j.id+'\')" class="bg-blue-500 text-white px-4 py-2 rounded font-bold">✏️</button><button onclick="delDoc(\'jobs\',\''+j.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div></div>').join('')+'</div>';
 }

 if(adminTab==='olditems'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING ITEMS ('+pendItems.length+')</h3>';
  h += pendItems.length ? '<div class="space-y-3">'+pendItems.map(o=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(o.pic?'<img src="'+o.pic+'" class="h-16 w-16 object-cover rounded">':'')+'<div><p class="font-bold">'+esc(o.title)+' - ₹'+esc(o.price)+'</p><p class="text-sm text-gray-600">📱 '+esc(o.phone)+'</p></div></div><div class="flex gap-2"><button onclick="updDoc(\'olditems\',\''+o.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'olditems\',\''+o.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  if(isAdminEditing('olditems')) h += editOldItemForm();
  h += '<div class="space-y-3">'+oldItems.filter(o=>o.status==='approved').map(o=>'<div class="bg-white border-2 border-purple-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p class="font-bold">'+esc(o.title)+' - ₹'+esc(o.price)+'</p><div class="flex gap-2"><button onclick="startAdminEdit(\'olditems\',\''+o.id+'\')" class="bg-blue-500 text-white px-4 py-2 rounded font-bold">✏️</button><button onclick="delDoc(\'olditems\',\''+o.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div></div>').join('')+'</div>';
 }

 if(adminTab==='events'){
  h += '<div class="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">➕ ADD EVENT</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Event Name *</label><input id="ev_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Place *</label><input id="ev_loc" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Date *</label><input type="date" id="ev_date" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Time</label><input type="time" id="ev_time" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Description</label><input id="ev_desc" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="ev_pic"><button type="button" onclick="openCloudUpload(\'ev_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="ev_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div></div>'+
  '<button onclick="addEventAdmin()" class="mt-4 bg-green-600 text-white px-8 py-3 rounded font-bold">✅ ADD</button></div>';
  if(editEventId) h += editEventForm();
  h += '<div class="space-y-3">'+eventsData.map(e=>'<div class="bg-white border-2 border-green-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(e.pic?'<img src="'+e.pic+'" class="h-16 w-16 object-cover rounded">':'')+'<div><p class="font-bold text-lg">'+esc(e.title)+'</p><p class="text-sm text-gray-600">📅 '+e.date+' @ '+(e.time||'')+' | 📍 '+esc(e.location)+'</p></div></div><div class="flex gap-2"><button onclick="startEditEvent(\''+e.id+'\')" class="bg-blue-500 text-white px-4 py-2 rounded font-bold">✏️ EDIT</button><button onclick="delDoc(\'events\',\''+e.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div></div>').join('')+'</div>';
 }

 if(adminTab==='news'){
  h += '<div class="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">➕ ADD NEWS</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Title *</label><input id="nw_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Date *</label><input type="date" id="nw_date" value="'+today()+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Content *</label><textarea id="nw_content" rows="3" class="w-full px-3 py-2 border-2 rounded"></textarea></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="nw_pic"><button type="button" onclick="openCloudUpload(\'nw_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="nw_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div></div>'+
  '<button onclick="addNewsAdmin()" class="mt-4 bg-red-600 text-white px-8 py-3 rounded font-bold">✅ ADD NEWS</button></div>';
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">⏳ MEMBERS द्वारा भेजी गई (PENDING) ('+pendNews.length+')</h3>';
  h += pendNews.length ? '<div class="space-y-3">'+pendNews.map(n=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div><p class="font-bold">'+esc(n.title)+'</p><p class="text-sm text-gray-600">'+esc(String(n.content||'').slice(0,80))+'...</p></div><div class="flex gap-2"><button onclick="updDoc(\'news\',\''+n.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'news\',\''+n.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  if(editNewsId) h += editNewsForm();
  h += '<div class="space-y-3">'+newsData.filter(n=>n.status!=='pending').map(n=>'<div class="bg-white border-2 border-red-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(n.pic?'<img src="'+n.pic+'" class="h-16 w-16 object-cover rounded">':'<div class="h-16 w-16 bg-red-50 rounded flex items-center justify-center text-2xl">📰</div>')+'<div><p class="font-bold">'+esc(n.title)+'</p><p class="text-xs text-gray-500">📅 '+n.date+'</p><p class="text-xs text-gray-500">'+esc(String(n.content||'').slice(0,60))+'...</p></div></div><div class="flex gap-2"><button onclick="startEditNews(\''+n.id+'\')" class="bg-blue-500 text-white px-3 py-2 rounded font-bold">✏️ EDIT</button><button onclick="delDoc(\'news\',\''+n.id+'\')" class="bg-red-500 text-white px-3 py-2 rounded font-bold">🗑️</button></div></div>').join('')+'</div>';
 }

 if(adminTab==='pratibha'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING ('+pendPrat.length+')</h3>';
  h += pendPrat.length ? '<div class="space-y-3">'+pendPrat.map(p=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p class="font-bold">'+esc(p.name)+' - 🏆 '+esc(p.achievement)+'</p><div class="flex gap-2"><button onclick="updDoc(\'pratibha\',\''+p.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'pratibha\',\''+p.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  if(editPratId) h += editPratForm();
  h += '<div class="space-y-3">'+pratibhaData.filter(p=>p.status==='approved').map(p=>'<div class="bg-white border-2 border-indigo-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(p.pic?'<img src="'+p.pic+'" class="h-16 w-16 object-cover rounded">':'')+'<p class="font-bold">'+esc(p.name)+' - 🏆 '+esc(p.achievement)+'</p></div><div class="flex gap-2"><button onclick="startEditPrat(\''+p.id+'\')" class="bg-blue-500 text-white px-4 py-2 rounded font-bold">✏️ EDIT</button><button onclick="delDoc(\'pratibha\',\''+p.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div></div>').join('')+'</div>';
 }

 if(adminTab==='gallery'){
  h += '<div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">➕ ADD PHOTO</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Title</label><input id="ph_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Caption</label><input id="ph_cap" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">📷 Photo *</label><input type="hidden" id="ph_url"><button type="button" onclick="openCloudUpload(\'ph_url\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold">📷 Upload Photo</button><img id="ph_url_prev" class="hidden mt-2 h-32 object-cover rounded border-2"></div></div>'+
  '<button onclick="addPhotoAdmin()" class="mt-4 bg-purple-600 text-white px-8 py-3 rounded font-bold">✅ ADD</button></div>';
  if(editPhotoId) h += editPhotoForm();
  h += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">'+photosData.map(p=>'<div class="bg-white border-2 border-purple-300 rounded-lg overflow-hidden"><img src="'+p.url+'" class="w-full h-40 object-cover"><div class="p-3"><p class="font-bold">'+esc(p.title||'')+'</p><p class="text-xs text-gray-500">'+esc(p.caption||'')+'</p><div class="flex gap-2 mt-2"><button onclick="startEditPhoto(\''+p.id+'\')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold">✏️ UPDATE</button><button onclick="delDoc(\'photos\',\''+p.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">🗑️</button></div></div></div>').join('')+'</div>';
 }

 if(adminTab==='site' && isSuperAdmin()){
  h += '<div class="bg-blue-50 border-2 border-blue-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">🌐 SITE SETTINGS</h3><div class="space-y-4">'+
  '<div><label class="text-xs font-bold">🔔 सूचना Ticker</label><input id="st_ticker" value="'+esc(siteMeta.ticker)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">ℹ️ About Us</label><textarea id="st_about" rows="4" class="w-full px-3 py-2 border-2 rounded">'+esc(siteMeta.aboutUs)+'</textarea></div>'+
  '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">'+
  '<div><label class="text-xs font-bold">📘 Facebook</label><input id="st_fb" value="'+esc(siteMeta.fb)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">📸 Instagram</label><input id="st_insta" value="'+esc(siteMeta.insta)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">▶️ YouTube</label><input id="st_yt" value="'+esc(siteMeta.youtube)+'" class="w-full px-3 py-2 border-2 rounded"></div></div>'+
  '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">'+
  '<div><label class="text-xs font-bold">⏰ पुराना सामान expiry (दिन)</label><input type="number" id="st_expiry" value="'+(siteMeta.expiryDays||30)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">⏰ Property validity (दिन)</label><input type="number" id="st_propdays" value="'+(siteMeta.propertyValidityDays||365)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div></div></div>'+
  '<div class="border-t-2 pt-4 mt-2"><p class="font-bold text-lg mb-3">🏠 Property — देने वाले / चाहिए वाले अलग Fee</p><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">🔑 किराए पर देना है — Fee (₹)</label><input id="st_propfeerent" value="'+esc(siteMeta.propertyFeeRent||'500')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🔑 देना है — Razorpay Button ID</label><input id="st_rz_proprent" value="'+esc(siteMeta.razorpayPropRent||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🙋 किराए पर चाहिए — Fee (₹, spam रोकने के लिए छोटा रखो)</label><input id="st_propfeewanted" value="'+esc(siteMeta.propertyFeeWanted||'11')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🙋 चाहिए — Razorpay Button ID</label><input id="st_rz_propwanted" value="'+esc(siteMeta.razorpayPropWanted||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '</div></div>'+
  '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">💍 Shaadi Profile Fee (₹)</label><input id="st_shaadifee" value="'+esc(siteMeta.shaadiFee||'500')+'" placeholder="जैसे 500" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">💍 Shaadi — Razorpay Button ID</label><input id="st_rz_shaadi" value="'+esc(siteMeta.razorpayShaadi||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">💍 Shaadi Validity (दिन)</label><input type="number" id="st_shaadidays" value="'+(siteMeta.shaadiValidityDays||180)+'" class="w-full px-3 py-2 border-2 rounded"></div></div>'+
  '<div class="border-t-2 pt-4 mt-2"><p class="font-bold text-lg mb-1">💼 Rozgaar (देना है FREE, चाहिए वालों का spam-रोकने Fee) / 🚀 Business Promotion</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4">'+
  '<div><label class="text-xs font-bold">🙋 रोज़गार चाहिए — Fee (₹)</label><input id="st_jobsfeeseeker" value="'+esc(siteMeta.jobsFeeSeeker||'11')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🙋 चाहिए — Razorpay Button ID</label><input id="st_rz_jobsseeker" value="'+esc(siteMeta.razorpayJobsSeeker||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div></div>'+
  '<p class="text-xs text-gray-500 md:col-span-3">💼 "रोज़गार/Freelancing देना है" हमेशा FREE रहेगा — koi fee/button नहीं है</p>'+
  '<div><label class="text-xs font-bold">🚀 Business Promotion Fee (₹)</label><input id="st_bizpromofee" value="'+esc(siteMeta.bizPromoFee||'300')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🚀 Business Promotion Validity (दिन)</label><input type="number" id="st_bizpromodays" value="'+(siteMeta.bizPromoValidityDays||365)+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🚀 Business Promotion — Razorpay Button ID</label><input id="st_rz_bizpromo" value="'+esc(siteMeta.razorpayBizPromo||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '</div></div>'+
  '<div class="border-t-2 pt-4 mt-2"><p class="font-bold text-lg mb-1">🛒 अपना OLX — पहली Listing FREE, अगली Extra Fee + Promote</p><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">🛒 Extra Item Fee (₹)</label><input id="st_olxextrafee" value="'+esc(siteMeta.olxExtraItemFee||'100')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🛒 Extra Item — Razorpay Button ID</label><input id="st_rz_olxextra" value="'+esc(siteMeta.razorpayOlxExtra||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🚀 OLX Promote Fee (₹)</label><input id="st_olxpromofee" value="'+esc(siteMeta.olxPromoFee||'100')+'" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🚀 OLX Promote — Razorpay Button ID</label><input id="st_rz_olxpromo" value="'+esc(siteMeta.razorpayOlxPromo||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '</div></div>'+
  '<div><label class="text-xs font-bold">🚫 Blocked phones</label><p class="text-sm text-gray-600">'+((siteMeta.blocked||[]).join(', ')||'कोई नहीं')+'</p></div>';

  h += '<div class="border-t-2 pt-4"><p class="font-bold text-lg mb-2">📝 Website के मुख्य Text (Site Text Editor)</p><p class="text-xs text-gray-500 mb-3">यहाँ से पूरी website के मुख्य/marketing text खुद बदल सकते हो — बिना developer के</p>'+
  '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div class="mt-3"><label class="text-xs font-bold">🎯 हमारा उद्देश्य (Objective popup)</label><textarea id="tx_objective" rows="4" class="w-full px-3 py-2 border-2 rounded">'+esc(T('objective', DEFAULT_OBJECTIVE_TEXT))+'</textarea></div>'+
  '<div class="mt-3"><label class="text-xs font-bold">💬 WhatsApp Invite Message</label><textarea id="tx_invite" rows="3" class="w-full px-3 py-2 border-2 rounded">'+esc(T('inviteMsg', DEFAULT_INVITE_MSG))+'</textarea></div>'+
  '</div>';

  h += '<div class="border-t-2 pt-4"><p class="font-bold text-lg mb-2">📢 5 AD SLOTS (Home Page)</p>';
  for(let i=0;i<5;i++){
   const ad = (siteMeta.ads&&siteMeta.ads[i]) || {};
   h += '<div class="bg-gray-50 border rounded-lg p-3 mb-3"><p class="text-xs font-bold mb-2">Ad Slot '+(i+1)+'</p>'+
   '<input type="hidden" id="ad_img_'+i+'" value="'+esc(ad.img||'')+'">'+
   '<div class="flex flex-wrap gap-3 items-center">'+
   '<button type="button" onclick="openCloudUpload(\'ad_img_'+i+'\')" class="bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload Image</button>'+
   '<img id="ad_img_'+i+'_prev" src="'+esc(ad.img||'')+'" class="'+(ad.img?'':'hidden ')+'h-12 rounded border">'+
   '<input id="ad_link_'+i+'" value="'+esc(ad.link||'')+'" placeholder="Link (optional)" class="flex-1 min-w-[150px] px-3 py-2 border-2 rounded text-sm">'+
   '<label class="flex items-center gap-1 text-sm font-bold"><input type="checkbox" id="ad_on_'+i+'" '+(ad.on?'checked':'')+' class="h-4 w-4"> ON</label>'+
   '</div></div>';
  }
  h += '</div>';

  h += '<div class="border-t-2 pt-4"><p class="font-bold text-lg mb-2">🔑 SUB-ADMINS (अलग-अलग portals के लिए अलग log)</p>'+
  '<div class="bg-gray-50 border rounded-lg p-4 mb-3">'+
  '<label class="text-xs font-bold text-gray-600">Community Member खोजो (नाम या Mobile Number से)</label>'+
  '<input id="sa_search" value="'+esc(saSearchQ)+'" oninput="saSearch(this.value)" placeholder="🔍 नाम या number टाइप करो..." class="w-full px-3 py-2 border-2 rounded mt-1 mb-2">'+
  (saSearchQ.trim() ? (saMatches().length ?
   '<div class="border-2 border-indigo-200 rounded-lg divide-y mb-3 max-h-56 overflow-y-auto">'+
   saMatches().map(m=>'<div onclick="saPick(\''+m.phone+'\')" class="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center '+(saSelectedPhone===m.phone?'bg-indigo-100':'')+'"><span class="text-sm font-bold">'+esc(m.name)+' '+esc(m.surname)+'</span><span class="text-xs text-gray-500">📱 '+esc(m.phone)+'</span></div>').join('')+
   '</div>'
   : '<p class="text-sm text-gray-400 mb-3">कोई matching approved member नहीं मिला</p>')
   : '')+
  (saSelectedPhone ? (function(){ const m=membersData.find(x=>x.phone===saSelectedPhone); return m ? '<div class="bg-white border-2 border-indigo-400 rounded-lg p-3 mb-3 flex justify-between items-center"><span class="text-sm"><b>✅ चुना गया:</b> '+esc(m.name)+' '+esc(m.surname)+' | 📱 '+esc(m.phone)+'</span></div>' : ''; })() : '')+
  '<p class="text-xs font-bold mb-2">कौन-कौन से portals दिखें:</p><div class="flex flex-wrap gap-3 mb-3">'+
  SUBADMIN_TABS.map(t=>'<label class="flex items-center gap-1 text-sm bg-white border rounded px-2 py-1"><input type="checkbox" onchange="saToggleTab(\''+t[0]+'\')" '+(saTabs.includes(t[0])?'checked':'')+' class="h-4 w-4"> '+t[1]+'</label>').join('')+'</div>'+
  '<button onclick="addSubAdmin()" class="bg-indigo-600 text-white px-6 py-2 rounded font-bold">➕ CREATE SUB-ADMIN</button></div>'+
  '<div class="space-y-2 mb-4">'+(siteMeta.subAdmins||[]).map((s,i)=>'<div class="flex justify-between items-center bg-indigo-50 rounded-lg px-3 py-2 flex-wrap gap-2"><span class="text-sm"><b>'+esc(s.name)+'</b> | 📱 '+esc(s.phone||s.contact||'-')+' | '+(s.tabs||[]).join(', ')+'</span><button onclick="delSubAdmin('+i+')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+'</div></div>';

  h += '<div class="border-t-2 pt-4"><p class="font-bold text-lg mb-2">🙏 समिति MEMBERS</p><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  '<input id="cm_name" placeholder="Name" class="px-3 py-2 border-2 rounded">'+
  '<input id="cm_post" placeholder="Post (अध्यक्ष...)" class="px-3 py-2 border-2 rounded">'+
  '<div><input type="hidden" id="cm_pic"><button type="button" onclick="openCloudUpload(\'cm_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Photo</button></div>'+
  '<input id="cm_details" placeholder="Details" class="px-3 py-2 border-2 rounded"></div>'+
  '<button onclick="addCommittee()" class="mt-3 bg-blue-600 text-white px-6 py-2 rounded font-bold">➕ ADD</button>'+
  (isAdminEditing('committee') ? editCommitteeForm() : '')+
  '<div class="mt-3 space-y-2">'+committeeData.map(c=>'<div class="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2"><span class="font-bold text-sm">'+esc(c.name)+' ('+esc(c.post)+')</span><div class="flex gap-2"><button onclick="startAdminEdit(\'committee\',\''+c.id+'\')" class="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">✏️</button><button onclick="delDoc(\'committee\',\''+c.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';

  h += '</div><button onclick="saveSiteMeta()" class="mt-5 bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE SETTINGS</button></div>';

  h += '<div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-6"><h3 class="text-xl font-bold mb-2">🎭 Fake Demo Data</h3>'+
   '<p class="text-sm text-gray-600 mb-4">App दिखाने के लिए ~150 fake documents बनाओ (30 personal profiles, 30 businesses, 20 secret-privacy महिला profiles, 30 शादी profiles, 30 Property listings, कुछ News/Events) — हर नाम के आगे "(Fake)" लिखा होगा ताकि कोई असली न समझे। जब असली data आने लगे, नीचे वाले button से सारा fake data एक साथ delete कर सकते हो।</p>'+
   '<div class="flex flex-wrap gap-3">'+
   '<button onclick="seedFakeDemoData()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold">🎭 Fake Demo Data बनाओ</button>'+
   '<button onclick="deleteFakeDemoData()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold">🗑️ सारा Fake Data Delete करो</button>'+
   '</div></div>';
 }
 return h;
}

// ================= UI =================
function renderApp(){
 buildDatalists();
 const mc = document.getElementById('mainContent');
 let html = '';
 if(currentPage==='register') html = renderRegisterPage();
 else if(currentPage==='community') html = renderCommunity();
 else if(currentPage==='business') html = renderBusinessPage();
 else if(currentPage==='garba') html = renderGarbaPage();
 else if(currentPage==='cricket') html = renderCricketPage();
 else if(currentPage==='blood') html = renderBloodPage();
 else if(currentPage==='property') html = renderPropertyPage();
 else if(currentPage==='shaadi') html = renderShaadiPage();
 else if(currentPage==='rozgaar') html = renderRozgaarPage();
 else if(currentPage==='olditems') html = renderOldItemsPage();
 else if(currentPage==='dharamshala') html = renderDharamshalaPage();
 else if(currentPage==='hospitals') html = renderHospitalsPage();
 else if(currentPage==='students') html = renderStudentsPage();
 else if(currentPage==='obituaries') html = renderObituariesPage();
 else if(currentPage==='meregaanv') html = renderMereGaanvPage();
 else if(currentPage==='patidarai') html = renderPatidarAI();
 else if(currentPage==='news') html = renderNewsPage();
 else if(currentPage==='pratibha') html = renderPratibhaPage();
 else if(currentPage==='events') html = renderEventsPage();
 else if(currentPage==='suggestions') html = renderSuggestionsPage();
 else if(currentPage==='gallery') html = renderGalleryPage();
 else if(currentPage==='admin') html = renderAdmin();
 else html = renderHome();
 // 🏪 हर page के नीचे businesses (बिना search किए भी दिखें)
 if(currentPage!=='admin' && currentPage!=='business') html += businessStrip();
 mc.innerHTML = html;
 renderRandProfile();
 if(currentPage==='community') renderMemberGrid();
 if(currentPage==='property'){
  if(siteMeta.razorpayPropRent) setTimeout(()=>mountRazorpayButton(siteMeta.razorpayPropRent,'razorpayPropRentBox'),30);
  if(siteMeta.razorpayPropWanted) setTimeout(()=>mountRazorpayButton(siteMeta.razorpayPropWanted,'razorpayPropWantedBox'),30);
 }
 if(currentPage==='shaadi' && siteMeta.razorpayShaadi) setTimeout(()=>mountRazorpayButton(siteMeta.razorpayShaadi,'razorpayShaadiBox'),30);
 if(currentPage==='rozgaar' && siteMeta.razorpayJobsSeeker) setTimeout(()=>mountRazorpayButton(siteMeta.razorpayJobsSeeker,'razorpayJobsSeekerBox'),30);
 if(currentPage==='olditems'){
  if(siteMeta.razorpayOlxExtra) setTimeout(()=>mountRazorpayButton(siteMeta.razorpayOlxExtra,'razorpayOlxExtraBox'),30);
  if(siteMeta.razorpayOlxPromo) setTimeout(()=>mountRazorpayButton(siteMeta.razorpayOlxPromo,'razorpayOlxPromoBox'),30);
 }
 setTimeout(()=>{
  document.querySelectorAll('select[id$="gender"]').forEach(sel=>{
   const prefix = sel.id.slice(0,-6);
   togglePrivacyBox(sel.value, prefix);
  });
 },30);
}
function updateUI(){
 const loggedIn = !!currentUser;
 document.getElementById('logoutBtn').classList.toggle('hidden', !loggedIn && !localStorage.getItem('psim_admin_ok'));
 document.getElementById('adminBtn').classList.toggle('hidden', !isAdmin() && loggedIn);
 const me = loggedIn ? myMember() : null;
 const nameStr = loggedIn ? (me ? (me.name+' '+me.surname) : currentUser) : '';
 document.getElementById('userName').textContent = loggedIn ? '👤 '+nameStr+(isSuperAdmin()?' (Admin)':(subAdminInfo()?' (Sub-Admin)':'')) : '';
 const tb = document.getElementById('tickerBar');
 if(siteMeta.ticker){ tb.classList.remove('hidden'); document.getElementById('tickerText').textContent = '🔔 '+siteMeta.ticker+'  •  🔔 '+siteMeta.ticker; }
 else tb.classList.add('hidden');
 document.querySelectorAll('.nav-btn').forEach(b=>{
  b.classList.toggle('bg-blue-500', b.dataset.page===currentPage);
  b.classList.toggle('text-white', b.dataset.page===currentPage);
  const locked = LOCKED_PAGES.includes(b.dataset.page);
  b.classList.toggle('nav-locked', locked);
  b.classList.toggle('nav-open', !locked);
 });
 renderApp();
}

busy(true);
setupRealtimeListeners();
// AUTO-REFRESH backup: har 30 second me silent re-render (realtime ke saath double safety)
setInterval(safeRerender, 30000);

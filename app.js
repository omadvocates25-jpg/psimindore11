
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
const ADMIN_PASSWORD = "PatidarSamaj@2026"; // backup password
const ADMIN_PHONE = "8103179376"; // Super Admin ka number - OTP login se auto-admin
const CONTACT_PHONE = "81031-79376";
const MP_DISTRICTS = ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad (Narmadapuram)","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Maihar","Mandla","Mandsaur","Mauganj","Morena","Narsinghpur","Neemuch","Niwari","Pandhurna","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha","Other (MP से बाहर)"];
const STATES = ["Madhya Pradesh","Maharashtra","Gujarat","Rajasthan","Uttar Pradesh","Chhattisgarh","Delhi","Punjab","Haryana","Bihar","Karnataka","Tamil Nadu","Telangana","Andhra Pradesh","West Bengal","Odisha","Jharkhand","Assam","Kerala","Goa","Himachal Pradesh","Uttarakhand","Jammu & Kashmir","Other / विदेश"];
const DEFAULT_PROFESSIONS = ["Doctor","Advocate / वकील","CA / Accountant","Teacher / Coaching","Engineer","Government Job","Farmer / किसान","Carpenter / बढ़ई","Plumber","Electrician","Mason / राजमिस्त्री","Tailor / दर्जी","Barber / नाई","Cook / Caterer","Driver","Kirana Shop / किराना","Medical Shop","Electric Shop","Mobile Shop","Sabji / Fruit Vendor","Dairy / दूध डेयरी","Jeweller / सुनार","Cloth Shop / कपड़ा","Footwear Shop","Property Dealer","Tractor / Machinery","Painter","Welder / Fabricator","Photographer / Videographer","Tent House / Event","Computer / IT Work","Gym / Fitness Trainer","Other / अन्य"];
const RELATIONS = ["पिता / Father","माता / Mother","भाई / Brother","बहन / Sister","बेटा / Son","बेटी / Daughter","पति / Husband","पत्नी / Wife","चाचा / Uncle","मामा / Mama","दादा / Grandfather","अन्य / Other"];
const BUSINESS_TYPES = ["Kirana/General Store","Restaurant/Food","Textiles/Garments","Agriculture/Farming","Real Estate/Property","Construction/Builder","Transport/Logistics","Medical/Pharmacy","Education/Coaching","Electronics/Mobile","Jewellery","Hardware/Building Material","Automobile/Garage","Beauty/Salon","Legal/CA/Consultant","Import-Export/Trading","Manufacturing/Factory","Other"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

// ================= STATE =================
let currentUser = ''; // logged-in user ka 10-digit phone
let _authResolved = false; // Firebase persisted-session check poora hone tak true nahi hota
let currentPage = 'home';
let editingId = null;
let selectedProfession = '';
let selectedNewsId = '';
let randIdx = 0, randOrder = [];
let searchQ = '', searchBy = 'name';
let adminTab = 'members';
let showAddForm=false, showItemForm=false, showPratForm=false, showJobForm=false, showRelForm=false, showGarbaForm=false, showPropForm=false, showManageProp=false;
let regStep = 0;
let relSearchQ = '';

let membersData=[], eventsData=[], newsData=[], photosData=[], oldItems=[], pratibhaData=[], jobsData=[], shaadiData=[], relativesData=[], committeeData=[], garbaRegs=[], garbaTeam=[], cricketData=[], propertyData=[], bloodData=[];
let siteMeta = { ticker:'', aboutUs:'', fb:'', insta:'', youtube:'', committee:'', expiryDays:30, propertyValidityDays:365, propertyFee:'500', razorpayButtonId:'', razorpayMakan:'', razorpayDukan:'', shaadiFee:'', razorpayShaadi:'', professions: DEFAULT_PROFESSIONS.slice(), blocked:[], garbaFormOpen:true, ads:[{},{},{},{},{}], subAdmins:[] };
function professionsList(){ return (siteMeta.professions && siteMeta.professions.length) ? siteMeta.professions : DEFAULT_PROFESSIONS; }

function isSuperAdmin(){ return currentUser === ADMIN_PHONE || localStorage.getItem('psim_admin_ok') === 'true'; }
function subAdminInfo(){ if(!currentUser) return null; return (siteMeta.subAdmins||[]).find(s => fmtPhone(s.phone) === currentUser) || null; }
function isAdmin(){ return isSuperAdmin() || !!subAdminInfo(); }
function allowedTabs(){ if(isSuperAdmin()) return null; const s=subAdminInfo(); return s ? (s.tabs||[]) : []; }
function myMember(){ return membersData.find(m => m.phone === currentUser); }
function approvedMembers(){ return membersData.filter(m => m.status === 'approved'); }
function isPublicProfile(m){ return !(m.gender && m.gender.indexOf('Female')===0 && m.privacy && m.privacy.indexOf('Secret')===0); }
function publicMembers(){ return approvedMembers().filter(isPublicProfile); }
function findApprovedByPhone(ph){ return approvedMembers().find(m => m.phone === fmtPhone(ph)); }
function esc(s){ return String(s==null?'':s).replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function distOf(m, w){ const d=m[w+'_district']||'', o=m[w+'_district_other']||''; if(d==='Other (MP से बाहर)') return o||'Other'; return o&&!d?o:d; }
function profOf(m){ const p=m.profession||'', o=m.profession_other||''; if(p.startsWith('Other')) return o||p; return p; }
function today(){ return new Date().toISOString().slice(0,10); }
function daysAgo(dateStr){ if(!dateStr) return 99999; return Math.floor((Date.now()-new Date(dateStr).getTime())/86400000); }
function randCode(){ return String(Math.floor(1000+Math.random()*9000)); }
function fmtName(s){ return (s||'').trim().replace(/\s+/g,' ').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()); }
function fmtPhone(s){ return (s||'').replace(/[^0-9]/g,'').slice(0,10); }
function phoneFromFirebase(fbPhone){ return (fbPhone||'').replace(/[^0-9]/g,'').slice(-10); } // "+919876543210" -> "9876543210"

// ================= ADMIN LOGIN (simple password) =================
function askAdminLogin(){
 if(isAdmin()){
  const at = allowedTabs();
  if(at && at.length) adminTab = at.includes(adminTab) ? adminTab : at[0];
  location.hash='admin'; return;
 }
 if(!currentUser){
  alert('📱 पहले OTP से Login करो।\n(Admin/Sub-admin numbers अपने आप पहचाने जाएंगे)\n\nEmergency: password से भी जा सकते हो - OK दबाओ');
 }
 const pass = prompt('🔒 Backup Admin Password (सिर्फ emergency):');
 if(pass === null) return;
 if(pass === ADMIN_PASSWORD){
  localStorage.setItem('psim_admin_ok','true');
  alert('✅ Super Admin (password backup) login!');
  updateUI(); location.hash='admin'; return;
 }
 alert('❌ गलत Password! Sub-admins को password नहीं - अपने NUMBER से OTP login करो।');
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
 watch('committee', d => committeeData = d);
 watch('garba_regs', d => garbaRegs = d);
 watch('garba_team', d => garbaTeam = d);
 watch('cricket', d => cricketData = d);
 watch('property', d => propertyData = d);
 watch('blood', d => bloodData = d);
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
// बिना login दिखने वाले pages — सिर्फ Community (members directory), Business, Profession (member contact list) lock हैं
const OPEN_PAGES = ['home','news','register','events','gallery','pratibha','garba','cricket','blood','property','shaadi','rozgaar','olditems'];
function goPage(p){
 
 location.hash = p;
}
function goProfession(i){
 if(_authResolved && !currentUser){ openLogin(); return; }
 selectedProfession = professionsList()[i]; location.hash = 'profession';
}
function route(){
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

// ================= OTP LOGIN =================
let _loginConfirmation = null;
let _loginRecaptcha = null;
function ensureLoginRecaptcha(){
 if(!_loginRecaptcha){
  _loginRecaptcha = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
 }
 return _loginRecaptcha;
}
function openLogin(){
 document.getElementById('lmStep1').classList.remove('hidden');
 document.getElementById('lmStep2').classList.add('hidden');
 document.getElementById('lm_phone').value = '';
 document.getElementById('lm_otp').value = '';
 document.getElementById('loginModal').classList.remove('hidden');
}
function closeLogin(){ document.getElementById('loginModal').classList.add('hidden'); }

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

function sendLoginOtp(){
 const phone = fmtPhone(document.getElementById('lm_phone').value);
 if(phone.length!==10){ alert('❌ सही 10 अंकों का number डालो'); return; }
 if((siteMeta.blocked||[]).includes(phone)){ alert('🚫 यह number block है। Admin से contact: '+CONTACT_PHONE); return; }
 const btn = document.getElementById('lm_send_btn');
 btn.disabled = true; btn.textContent = '📲 OTP भेज रहे हैं......';
 auth.signInWithPhoneNumber('+91'+phone, ensureLoginRecaptcha()).then(result => {
  _loginConfirmation = result;
  document.getElementById('lm_phone_display').textContent = '+91'+phone;
  document.getElementById('lmStep1').classList.add('hidden');
  document.getElementById('lmStep2').classList.remove('hidden');
 }).catch(err => {
  alert('❌ OTP भेजने में समस्या: '+err.message);
 }).finally(() => {
  btn.disabled = false; btn.textContent = '📲 OTP भेजो / Send OTP';
 });
}
async function verifyLoginOtp(){
 const code = document.getElementById('lm_otp').value.trim();
 if(code.length!==6){ alert('❌ 6 अंकों का OTP डालो'); return; }
 if(!_loginConfirmation){ alert('❌ पहले OTP भेजो'); return; }
 try{ await _loginConfirmation.confirm(code); }
 catch(e){ alert('❌ गलत OTP - दोबारा देखो'); return; }
 _pendingRegisterRedirect = true;
 closeLogin();
}
// Login के तुरंत बाद: अगर member नहीं है तो सीधे registration form पर ले जाओ
let _pendingRegisterRedirect = false;
function startRegister(){
 if(currentUser && myMember()){ alert('✅ आप पहले से registered हैं! आपकी profile Community page पर है।'); goPage('community'); return; }
 regStep = 0;
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
 ['profession','Profession / पेशा','profselect'],
 ['profession_other','Profession - Other','text'],
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
 {title:'👤 और जानकारी / More Details', color:'purple', keys:['profile_pic','age','marital_status','profession','profession_other','work_details','blood_group','blood_donor','home_tehsil','home_pincode','home_police_station','present_address','present_tehsil','present_pincode','present_police_station']}
];

function fieldHTML(prefix, f, val){
 val = val || '';
 const fid = prefix + f[0];
 if(f[2] === 'photo'){
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label>'+
   '<input type="hidden" id="'+fid+'" value="'+esc(val)+'">'+
   '<button type="button" onclick="openCloudUpload(\''+fid+'\')" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload Photo</button>'+
   '<img id="'+fid+'_prev" src="'+esc(val)+'" class="'+(val?'':'hidden ')+'mt-2 h-20 w-full object-cover rounded border-2 border-gray-300"></div>';
 }
 if(f[2] === 'textarea'){
  return '<div class="md:col-span-2 lg:col-span-3"><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><textarea id="'+fid+'" rows="2" class="w-full px-3 py-2 border-2 border-gray-300 rounded">'+String(val).replace(/</g,'&lt;')+'</textarea></div>';
 }
 if(f[2] === 'gender'){
  const opts = ['Male / पुरुष','Female / महिला','Other / अन्य'].map(o=>'<option '+(o===val?'selected':'')+'>'+o+'</option>').join('');
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+' *</label><select id="'+fid+'" onchange="togglePrivacyBox(this.value,\''+prefix+'\')" class="w-full px-3 py-2 border-2 border-gray-300 rounded"><option value="">--Select--</option>'+opts+'</select></div>';
 }
 if(f[2] === 'privacy'){
  return '<div id="'+prefix+'privacyBox" class="hidden md:col-span-2 bg-red-50 border-2 border-red-400 rounded-lg p-4 mt-1">'+
   '<label class="text-sm font-bold text-red-700 flex items-center gap-1">🔒 आपकी Privacy, आपकी पसंद *</label>'+
   '<p class="text-xs text-red-600 mt-1 mb-2">आपकी सुरक्षा हमारे लिए ज़रूरी है — कृपया चुनें कि आपकी प्रोफाइल सबको दिखाई दे, या सिर्फ PSIM Team को।</p>'+
   '<select id="'+fid+'" class="w-full px-3 py-2 border-2 border-red-300 rounded bg-white font-bold text-red-800">'+
   '<option value="">-- चुनें / Please Select --</option>'+
   '<option value="Public / सबको दिखे" '+(val==='Public / सबको दिखे'?'selected':'')+'>👁️ मेरी प्रोफाइल सबको दिखे / Public</option>'+
   '<option value="Secret / सिर्फ PSIM Team को" '+(val==='Secret / सिर्फ PSIM Team को'?'selected':'')+'>🔒 सिर्फ PSIM Team को दिखे / Secret</option>'+
   '</select>'+
   '<p class="text-[11px] text-red-500 mt-1">"Secret" चुनने पर भी आपको समाज की सारी सुविधाएँ मिलती रहेंगी — बस आपकी प्रोफाइल सार्वजनिक Community list में नहीं दिखेगी।</p></div>';
 }
 if(f[2] === 'profselect'){
  const opts = professionsList().map(o => '<option '+(o===val?'selected':'')+'>'+o+'</option>').join('');
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><select id="'+fid+'" class="w-full px-3 py-2 border-2 border-gray-300 rounded"><option value="">--Select--</option>'+opts+'</select></div>';
 }
 if(f[2] === 'select'){
  let src = f[3];
  if(f[0]==='business_type'){
   const extras = [...new Set(membersData.map(m=>m.business_type_other).filter(v=>v&&v.trim()))];
   src = f[3].concat(extras.filter(e=>!f[3].includes(e)));
  }
  const opts = src.map(o => '<option '+(o===val?'selected':'')+'>'+o+'</option>').join('');
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><select id="'+fid+'" class="w-full px-3 py-2 border-2 border-gray-300 rounded"><option value="">--Select--</option>'+opts+'</select></div>';
 }
 if(f[0]==='phone' && prefix==='reg_' && currentUser){
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+' (आपका login number - automatic)</label><input type="tel" id="'+fid+'" value="'+esc(currentUser)+'" readonly class="w-full px-3 py-2 border-2 border-gray-300 rounded bg-gray-100 text-gray-600"></div>';
 }
 if(f[0]==='phone' && prefix==='reg_'){
  return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><div class="flex items-center border-2 border-gray-300 rounded overflow-hidden"><span class="bg-gray-100 px-3 py-2 font-bold text-gray-600 text-sm">+91</span><input type="tel" id="'+fid+'" maxlength="10" value="'+esc(val)+'" class="flex-1 px-3 py-2 outline-none"></div></div>';
 }
 let listAttr='';
 if(f[0].includes('village')) listAttr=' list="dl_villages"';
 else if(f[0].includes('tehsil')) listAttr=' list="dl_tehsils"';
 else if(f[0].includes('city')) listAttr=' list="dl_cities"';
 else if(f[0].includes('police')) listAttr=' list="dl_police"';
 return '<div><label class="text-xs font-bold text-gray-600">'+f[1]+'</label><input type="'+f[2]+'" id="'+fid+'"'+listAttr+' value="'+esc(val)+'" class="w-full px-3 py-2 border-2 border-gray-300 rounded"></div>';
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
 let h = '<div class="flex justify-center gap-2 mb-4">';
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
  } else {
   h += '<p class="text-center mb-1">आपकी सभी जानकारी दर्ज हो गई है।</p>';
   h += '<p class="text-center mb-4 text-sm text-gray-500">+91 '+esc(draftGet('phone'))+' पर OTP भेजा जाएगा</p>';
   h += '<button onclick="sendRegOtp()" id="regOtpSendBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">📲 OTP भेजो</button>';
   h += '<div id="regOtpBox" class="hidden mt-4"><input type="text" id="regOtpCode" maxlength="6" placeholder="OTP डालें" class="w-full px-3 py-2 border-2 border-gray-300 rounded mb-2 text-center text-2xl font-bold tracking-widest"><button onclick="verifyRegOtp()" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">✅ सत्यापित करें</button></div>';
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
let _regConfirmation = null;
let _regRecaptcha = null;
function ensureRegRecaptcha(){
 if(!_regRecaptcha){
  _regRecaptcha = new firebase.auth.RecaptchaVerifier('recaptcha-container-reg', { size: 'invisible' });
 }
 return _regRecaptcha;
}
async function sendRegOtp(){
 const phone = fmtPhone(draftGet('phone'));
 if(phone.length!==10){ alert('❌ सही 10 अंकों का Mobile Number भरो'); return; }
 if((siteMeta.blocked||[]).includes(phone)){ alert('🚫 यह number block है। Admin से contact: '+CONTACT_PHONE); return; }
 if(membersData.find(m => m.phone === phone)){ alert('❌ यह number पहले से registered है! सीधे Login करो।'); return; }
 const btn = document.getElementById('regOtpSendBtn');
 btn.disabled = true; btn.textContent = '📲 OTP भेज रहे हैं...';
 try{
  _regConfirmation = await auth.signInWithPhoneNumber('+91'+phone, ensureRegRecaptcha());
  document.getElementById('regOtpBox').classList.remove('hidden');
 } catch(err){
  alert('❌ OTP भेजने में समस्या: '+err.message);
 }
 btn.disabled = false; btn.textContent = '📲 OTP भेजो';
}
async function verifyRegOtp(){
 const code = document.getElementById('regOtpCode').value.trim();
 if(code.length!==6){ alert('❌ 6 अंकों का OTP डालो'); return; }
 if(!_regConfirmation){ alert('❌ पहले OTP भेजो'); return; }
 try{ await _regConfirmation.confirm(code); }
 catch(e){ alert('❌ गलत OTP - दोबारा देखो'); return; }
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

// ================= HOME =================
function renderHome(){
 let h = '<div class="text-center mb-8"><h2 class="text-4xl md:text-5xl font-bold mb-3">स्वागत है / Welcome</h2><p class="text-xl md:text-2xl text-gray-600">समाज की सेवा है हमारा लक्ष्य</p><p class="text-sm text-gray-400">Service to Society is Our Goal</p></div>';
 h += '<div class="bg-gradient-to-r from-blue-900 via-indigo-800 to-orange-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6"><div class="flex flex-col md:flex-row items-center gap-5 md:gap-8"><img src="data:image/webp;base64,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" class="h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-yellow-400 shadow-2xl object-cover flex-shrink-0"><div class="text-center md:text-left"><p class="text-xs md:text-sm uppercase tracking-widest text-yellow-300 font-bold mb-1">हमारे आदर्श / Our Inspiration</p><h3 class="text-2xl md:text-3xl font-bold text-white mb-1">सरदार वल्लभभाई पटेल</h3><p class="text-blue-100 text-sm md:text-base">लौह पुरुष — Iron Man of India</p></div></div></div>';

 if(!currentUser){
  h += '<div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl shadow-lg p-6 mb-6 text-center">';
  h += '<p class="text-lg font-bold text-green-800 mb-4">🌟 हमारे समुदाय से जुड़ो</p>';
  h += '<div class="grid grid-cols-3 gap-3 mb-4">';
  h += '<div><p class="text-2xl font-bold text-green-700">'+publicMembers().length+'</p><p class="text-[11px] text-gray-700 font-bold">सदस्य</p></div>';
  h += '<div><p class="text-2xl font-bold text-yellow-600">'+allBusinesses().length+'</p><p class="text-[11px] text-gray-700 font-bold">व्यापार</p></div>';
  h += '<div><p class="text-2xl font-bold text-blue-600">'+eventsData.length+'</p><p class="text-[11px] text-gray-700 font-bold">कार्यक्रम</p></div>';
  h += '</div>';
  h += '<p class="text-sm text-gray-700 mb-3">हजारों पाटीदार समुदाय से जुड़े हैं। अपना नेटवर्क बढ़ाओ!</p>';
  h += '<button onclick="startRegister()" class="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold">📝 अभी रजिस्टर करो →</button>';
  h += '</div>';
 }

 h += '<div class="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6 mb-6 text-center">';
 h += '<p class="text-2xl font-bold mb-1">🔍 आपको कौन चाहिए? / Whom do you need?</p>';
 h += '<p class="text-orange-100 mb-4">Doctor, वकील, Carpenter, Electrician या कोई और?</p>';
 h += '<button onclick="document.getElementById(\'profListBox\').classList.toggle(\'hidden\')" class="bg-white text-orange-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-orange-50">व्यवसाय चुनें ▼</button>';
 h += '<div id="profListBox" class="hidden mt-4 bg-white rounded-lg p-4 max-h-72 overflow-y-auto text-left"><div class="grid grid-cols-2 md:grid-cols-3 gap-2">';
 professionsList().forEach((p,i)=>{ h += '<button onclick="goProfession('+i+')" class="text-left px-3 py-2 rounded bg-orange-50 hover:bg-orange-200 text-gray-800 font-bold text-sm border border-orange-200">'+p+'</button>'; });
 h += '</div></div></div>';

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
  ['olditems','indigo','🛒','पुराना सामान<br>Old Items', activeOldItems().length+' Items'],
  ['news','amber','📰','NEWS<br>समाचार', newsData.length+' Updates'],
  ['pratibha','cyan','🏆','प्रतिभा परिचय<br>Talents', pratibhaData.filter(p=>p.status==='approved').length+' Stars'],
  ['events','lime','📅','EVENTS<br>कार्यक्रम', eventsData.length+' Events']
 ];
 h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">';
 portals.slice(0,4).forEach(p => {
  h += '<div class="bg-gradient-to-br from-'+p[1]+'-500 to-'+p[1]+'-600 text-white rounded-2xl p-3 md:p-4 text-center cursor-pointer shadow-md hover:shadow-2xl transform hover:scale-105 transition-all" onclick="goPage(\''+p[0]+'\')"><div class="h-10 w-10 md:h-12 md:w-12 mx-auto mb-1.5 rounded-full bg-white/25 flex items-center justify-center text-xl md:text-2xl">'+p[2]+'</div><p class="font-bold text-[11px] md:text-xs leading-tight">'+p[3]+'</p><p class="text-[9px] md:text-[10px] mt-1 text-'+p[1]+'-100">'+p[4]+'</p></div>';
 });
 h += '</div>';

 h += adBanner(1);

 h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">';
 portals.slice(4,8).forEach(p => {
  h += '<div class="bg-gradient-to-br from-'+p[1]+'-500 to-'+p[1]+'-600 text-white rounded-2xl p-3 md:p-4 text-center cursor-pointer shadow-md hover:shadow-2xl transform hover:scale-105 transition-all" onclick="goPage(\''+p[0]+'\')"><div class="h-10 w-10 md:h-12 md:w-12 mx-auto mb-1.5 rounded-full bg-white/25 flex items-center justify-center text-xl md:text-2xl">'+p[2]+'</div><p class="font-bold text-[11px] md:text-xs leading-tight">'+p[3]+'</p><p class="text-[9px] md:text-[10px] mt-1 text-'+p[1]+'-100">'+p[4]+'</p></div>';
 });
 h += '</div>';

 h += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">';
 portals.slice(8,12).forEach(p => {
  h += '<div class="bg-gradient-to-br from-'+p[1]+'-500 to-'+p[1]+'-600 text-white rounded-2xl p-3 md:p-4 text-center cursor-pointer shadow-md hover:shadow-2xl transform hover:scale-105 transition-all" onclick="goPage(\''+p[0]+'\')"><div class="h-10 w-10 md:h-12 md:w-12 mx-auto mb-1.5 rounded-full bg-white/25 flex items-center justify-center text-xl md:text-2xl">'+p[2]+'</div><p class="font-bold text-[11px] md:text-xs leading-tight">'+p[3]+'</p><p class="text-[9px] md:text-[10px] mt-1 text-'+p[1]+'-100">'+p[4]+'</p></div>';
 });
 h += '</div>';

 h += '<div class="bg-white rounded-xl shadow-lg p-6 mb-8"><h3 class="text-2xl font-bold mb-1 text-center">🎲 जानो अपने साथियों को / Know Your Community</h3><p class="text-center text-gray-500 text-sm mb-4">Random member profiles देखो</p><div id="randProfileBox"></div></div>';

 // 🏪 BUSINESS SPOTLIGHT (random - हर बार अलग | बिना search किए भी दिखे)
 const biz = allBusinesses();
 if(biz.length){
  const shuffled = biz.slice().sort(()=>Math.random()-0.5).slice(0,6);
  h += '<div class="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-lg p-6 mb-8">';
  h += '<h3 class="text-2xl font-bold mb-1 text-center">🏪 पाटीदार बंधुओं के व्यापार / Business Spotlight</h3>';
  h += '<p class="text-center text-gray-500 text-sm mb-4">हर बार अलग-अलग businesses — card पर click करो, पूरी details + Call/WhatsApp मिलेगा</p>';
  h += '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
  shuffled.forEach(b => {
   h += '<div onclick="openBiz(\''+b.id+'\')" class="bg-white border-2 border-yellow-300 rounded-lg overflow-hidden shadow cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all">'+
   (b.pic?'<img src="'+b.pic+'" class="w-full h-32 object-cover">':'<div class="w-full h-20 bg-yellow-100 flex items-center justify-center text-4xl">🏪</div>')+
   '<div class="p-3"><p class="font-bold text-yellow-800 text-sm truncate">'+esc(b.name)+'</p>'+
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

 if(newsData.length){
  h += '<div class="bg-white rounded-lg shadow-lg p-6 mb-8"><h3 class="text-2xl font-bold mb-4">📰 Latest News / ताज़ा समाचार</h3><div class="space-y-3">'+
  newsData.slice(0,3).map(n => '<div class="bg-red-50 border-l-4 border-red-500 rounded p-4"><p class="font-bold text-red-700">'+esc(n.title)+'</p><p class="text-xs text-gray-500">📅 '+n.date+'</p><p class="text-sm text-gray-700 mt-1">'+esc(n.content).slice(0,150)+'...</p></div>').join('')+
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

 h += '<div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-lg p-8 text-center mb-8">'+
 '<h3 class="text-3xl font-bold mb-2">🤝 JOIN US / हमसे जुड़ें</h3>'+
 '<p class="text-green-100 mb-4">Become an Active Member of PSIM / PSIM के सक्रिय सदस्य बनें</p>'+
 '<button onclick="goPage(\'community\')" class="bg-white text-green-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-50">➕ REGISTER NOW / अभी जुड़ें</button></div>';

 h += '<div class="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg shadow-lg p-8 text-center"><h3 class="text-2xl font-bold mb-3">📞 CONTACT US</h3><p class="text-2xl font-bold">Contact - '+CONTACT_PHONE+'</p><p class="text-blue-200 mt-1">पाटीदार समाज इंदौर महानगर</p></div>';
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
function renderRandProfile(){
 const box = document.getElementById('randProfileBox'); if(!box) return;
 if(!currentUser){ box.innerHTML='<div class="text-center py-6"><p class="text-5xl mb-3">🔒</p><p class="font-bold text-gray-600">Profiles देखने के लिए Login करो</p><button onclick="openLogin()" class="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">📱 LOGIN</button></div>'; return; }
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
function renderProfessionPage(){
 const list = publicMembers().filter(m => profOf(m)===selectedProfession)
  .sort((a,b)=>(a.name+' '+a.surname).localeCompare(b.name+' '+b.surname));
 let h = '<button onclick="goPage(\'home\')" class="mb-4 bg-gray-200 px-4 py-2 rounded font-bold">← Back</button>';
 h += '<h2 class="text-3xl font-bold mb-2">🔍 '+esc(selectedProfession)+' ('+list.length+')</h2>';
 h += '<p class="text-gray-500 mb-6">Alphabetical list - गाँव/Tehsil/District details के साथ</p>';
 if(!list.length){
  h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">😔</p><p class="text-lg font-bold text-gray-600">अभी इस profession में कोई member नहीं है</p></div>';
 } else {
  h += '<div class="space-y-4">'+list.map(m =>
   '<div class="bg-white border-2 border-orange-300 rounded-lg p-5 shadow-md hover:shadow-lg"><div class="flex flex-wrap justify-between items-start gap-3"><div class="flex gap-3">'+
   (m.profile_pic?'<img src="'+m.profile_pic+'" class="h-16 w-16 object-cover rounded-full border-2 border-orange-300">':'')+
   '<div><p class="text-xl font-bold text-orange-700">'+esc(m.name)+' '+esc(m.surname)+'</p>'+
   '<p class="text-sm text-gray-700 mt-1">🏡 गाँव: '+esc(m.home_village||'-')+' | District: '+esc(distOf(m,'home')||'-')+'</p>'+
   '<p class="text-sm text-gray-700">📍 Present: '+esc(m.present_city||'-')+', '+esc(distOf(m,'present')||'-')+'</p>'+
   (m.work_details?'<p class="text-sm text-gray-600 mt-2 bg-orange-50 rounded p-2">📝 '+esc(m.work_details)+'</p>':'')+
   '</div></div><a href="tel:'+m.phone+'" class="bg-green-600 text-white px-5 py-2 rounded-lg font-bold">📞 '+esc(m.phone)+'</a></div></div>').join('')+'</div>';
 }
 return h;
}

// ================= COMMUNITY (members directory — login required) =================
function setSearch(by){ searchBy=by; renderApp(); }
function doSearch(v){ searchQ=v.toLowerCase(); renderMemberGrid(); }
function memberCard(m){
 const rels = relOf(m);
 return '<div class="bg-white border-2 border-blue-300 rounded-lg p-5 shadow-md hover:shadow-lg">'+
 (m.profile_pic?'<img src="'+m.profile_pic+'" class="h-24 w-24 object-cover rounded-full border-2 border-blue-300 mb-3">':'')+
 '<p class="font-bold text-xl text-blue-700">'+esc(m.name)+' '+esc(m.surname)+'</p>'+
 '<p class="text-xs bg-blue-100 inline-block px-2 py-1 rounded mt-1">'+esc(profOf(m)||'')+'</p>'+
 '<div class="mt-3 space-y-1 text-sm text-gray-700">'+
 '<p>📱 '+esc(m.phone)+'</p>'+
 '<p>🏡 गाँव: '+esc(m.home_village||'-')+', '+esc(distOf(m,'home')||'-')+(m.home_state&&m.home_state!=='Madhya Pradesh'?' ('+esc(m.home_state)+')':'')+'</p>'+
 '<p>📍 Present: '+esc(m.present_city||'-')+', '+esc(distOf(m,'present')||'-')+(m.present_state&&m.present_state!=='Madhya Pradesh'?' ('+esc(m.present_state)+')':'')+'</p>'+
 (m.marital_status?'<p>💍 '+esc(m.marital_status)+' | Age: '+esc(m.age||'-')+'</p>':'')+
 (m.blood_group?'<p>🩸 Blood Group: <b class="text-red-600">'+esc(m.blood_group)+'</b>'+((m.blood_donor||'').indexOf('हाँ')===0?' <span class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">रक्तदाता ✅</span>':'')+'</p>':'')+
 (m.business_name?'<p class="cursor-pointer text-yellow-700 font-bold" onclick="openBiz(\''+m.id+'\')">🏪 '+esc(m.business_name)+' ▸</p>':'')+
 (rels.length?'<p class="bg-indigo-50 rounded p-2 mt-2 text-xs">👨‍👩‍👧‍👦 <b>परिवार:</b> '+rels.join(', ')+'</p>':'')+
 '</div></div>';
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
 el.innerHTML = filtered.length ? '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+filtered.map(memberCard).join('')+'</div>' : '<p class="text-gray-500 text-lg text-center py-8">कोई member नहीं मिला</p>';
 const cnt = document.getElementById('memberCount'); if(cnt) cnt.textContent = filtered.length;
}

// ===== RELATIVES (peer-approval - logged-in users) =====
function toggleRelForm(){ showRelForm=!showRelForm; renderApp(); }
async function sendRelRequest(toId){
 const me = myMember();
 if(!me || me.status!=='approved'){ alert('❌ पहले Community में register होना जरूरी है। Admin approval के बाद यह feature unlock होगा।'); return; }
 const to = membersData.find(m=>m.id===toId); if(!to) return;
 const relation = document.getElementById('relSel_'+toId).value;
 if(!relation){ alert('❌ रिश्ता चुनो'); return; }
 if(relativesData.find(r => (r.fromPhone===me.phone&&r.toPhone===to.phone)||(r.fromPhone===to.phone&&r.toPhone===me.phone))){ alert('❌ Request पहले से है!'); return; }
 busy(true);
 await db.collection('relatives').add({fromPhone:me.phone, fromName:me.name+' '+me.surname, toPhone:to.phone, toName:to.name+' '+to.surname, relation:relation, status:'pending', createdAt:today()});
 alert('✅ Request भेज दी! '+to.name+' के approve करने पर दोनों profile में दिखेगा।'); showRelForm=false; busy(false); renderApp();
}
async function respondRel(id, accept){
 busy(true);
 if(accept) await db.collection('relatives').doc(id).update({status:'approved'});
 else await db.collection('relatives').doc(id).delete();
 busy(false); renderApp();
}
function renderRelSection(){
 const me = myMember();
 let h = '';
 if(me && me.status==='approved'){
  const pend = relativesData.filter(r => r.toPhone===me.phone && r.status==='pending');
  if(pend.length){
   h += '<div class="bg-indigo-100 border-2 border-indigo-400 rounded-lg p-4 mb-6"><p class="font-bold text-indigo-800 mb-3">🔔 Relative Requests ('+pend.length+')</p>';
   pend.forEach(r => {
    h += '<div class="bg-white rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm"><b>'+esc(r.fromName)+'</b> ने आपको <b>'+esc(r.relation)+'</b> बताया है</p>'+
    '<div class="flex gap-2"><button onclick="respondRel(\''+r.id+'\',true)" class="bg-green-600 text-white px-4 py-1 rounded font-bold text-sm">✅ APPROVE</button><button onclick="respondRel(\''+r.id+'\',false)" class="bg-red-500 text-white px-4 py-1 rounded font-bold text-sm">❌</button></div></div>';
   });
   h += '</div>';
  }
 }
 h += '<button onclick="toggleRelForm()" class="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold">➕ रिश्तेदार जोड़ें / Add Relative</button>';
 if(showRelForm){
  h += '<div class="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-5 mb-6">';
  h += '<p class="font-bold mb-2">🔍 Community में से खोजो / Search relative:</p>';
  h += '<input type="text" oninput="relSearchQ=this.value.toLowerCase();renderApp()" value="'+esc(relSearchQ)+'" placeholder="Name / गाँव / Number..." class="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg mb-3">';
  if(relSearchQ){
   const results = approvedMembers().filter(m => ((m.name+' '+m.surname).toLowerCase().includes(relSearchQ) || (m.phone||'').includes(relSearchQ) || (m.home_village||'').toLowerCase().includes(relSearchQ))).slice(0,5);
   if(results.length){
    results.forEach(m => {
     h += '<div class="bg-white rounded-lg p-3 mb-2 flex flex-wrap justify-between items-center gap-2"><p class="text-sm font-bold">'+esc(m.name)+' '+esc(m.surname)+' <span class="text-gray-500 font-normal">('+esc(m.home_village||'-')+')</span></p>'+
     '<div class="flex gap-2"><select id="relSel_'+m.id+'" class="border-2 rounded px-2 py-1 text-sm"><option value="">रिश्ता चुनो</option>'+RELATIONS.map(r=>'<option>'+r+'</option>').join('')+'</select>'+
     '<button onclick="sendRelRequest(\''+m.id+'\')" class="bg-indigo-600 text-white px-3 py-1 rounded font-bold text-sm">📤 REQUEST</button></div></div>';
    });
   } else h += '<p class="text-gray-500 text-sm">कोई नहीं मिला</p>';
  }
  h += '<p class="text-xs text-gray-400 mt-2">⚠️ सामने वाला member approve करेगा तब दोनों profile में रिश्ता दिखेगा</p>';
  h += '</div>';
 }
 return h;
}

// ===== MY PROFILE / DELETE MY DATA / PRIVACY TOGGLE =====
async function deleteMyData(){
 const me = myMember(); if(!me) return;
 if(!confirm('⚠️ आपका पूरा DATA delete हो जाएगा (Profile + Cricket + Garba + Relatives)।\nवापस नहीं आएगा! पक्का?')) return;
 if(!confirm('Confirm दोबारा - DELETE करना है?')) return;
 busy(true);
 const batch = db.batch();
 batch.delete(db.collection('members').doc(me.id));
 cricketData.filter(c=>c.phone===me.phone).forEach(c=>batch.delete(db.collection('cricket').doc(c.id)));
 garbaRegs.filter(g=>g.phone===me.phone).forEach(g=>batch.delete(db.collection('garba_regs').doc(g.id)));
 relativesData.filter(r=>r.fromPhone===me.phone||r.toPhone===me.phone).forEach(r=>batch.delete(db.collection('relatives').doc(r.id)));
 await batch.commit();
 busy(false);
 alert('✅ आपका पूरा data delete हो गया।');
 goPage('home');
}
// 🩸 अपना Blood Group खुद भरो => Blood page की उसी group list में अपने आप नाम आ जाएगा
async function setMyBlood(){
 const me = myMember(); if(!me){ alert('❌ पहले Community में register करो'); return; }
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

function renderRegisterPage(){
 if(currentUser && myMember()){
  return '<div class="bg-white rounded-lg shadow-lg p-6 text-center"><p class="text-4xl mb-3">✅</p><p class="text-lg font-bold text-gray-700">आप पहले से registered हैं!</p><button onclick="goPage(\'community\')" class="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">Community Page पर जाओ →</button></div>';
 }
 let h = '<div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">';
 h += '<h2 class="text-2xl md:text-3xl font-bold mb-2 text-center">📝 पाटीदार परिवार से जुड़ो</h2>';
 h += '<p class="text-sm text-red-600 font-bold mb-4 text-center">⚠️ Subject to Admin Approval | सिर्फ जरूरी चीज़ें भरो - बाकी optional</p>';
 h += stepFormHTML({});
 h += '</div>';
 return h;
}
function renderCommunity(){
 let top = '<h2 class="text-3xl font-bold mb-6">👥 COMMUNITY / समुदाय</h2>';
 top += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">';
 top += '<div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 cursor-pointer hover:shadow-xl" onclick="document.getElementById(\'searchSection\').scrollIntoView({behavior:\'smooth\'})"><p class="text-3xl mb-1">🔍</p><p class="font-bold text-xl">SEARCH MEMBERS</p><p class="text-sm text-blue-100">Name, Number, Village, District, State से</p></div>';
 top += '<div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 cursor-pointer hover:shadow-xl" onclick="document.getElementById(\'addSection\').scrollIntoView({behavior:\'smooth\'})"><p class="text-3xl mb-1">➕</p><p class="font-bold text-xl">ADD YOUR DETAILS</p><p class="text-sm text-green-100">Admin approval के बाद live</p></div></div>';

 top += renderRelSection();

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
  addSec += '<p class="text-xs text-gray-500 mb-3">अन्य जानकारी में बदलाव के लिए Admin से संपर्क करो: '+CONTACT_PHONE+'</p>';
  addSec += '<div class="border-t-2 pt-4"><button onclick="deleteMyData()" class="bg-red-100 text-red-700 border-2 border-red-300 px-5 py-2 rounded-lg font-bold text-sm hover:bg-red-200">🗑️ Delete My Data / मेरा पूरा data delete करो</button></div>';
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
function allBusinesses(){
 const real = publicMembers().filter(m => m.business_name).map(m => ({
  id:m.id,
  name:m.business_name, type:(m.business_type==='Other'&&m.business_type_other)?m.business_type_other:(m.business_type||'Business'),
  owner:m.name+' '+m.surname, phone:m.business_phone||m.phone, place:m.business_place||m.present_city||'',
  gmap:m.business_gmap||'', pic:m.business_pic1||'', description:m.business_details||'',
  village:m.home_village||'', city:m.present_city||'', ownerPhone:m.phone||''
 }));
 return real.length > 0 ? real : SAMPLE_BUSINESSES;
}
// ===== BUSINESS DETAIL MODAL (कहीं से भी click => पूरी details) =====
function openBiz(id){
 const b = allBusinesses().find(x => x.id === id);
 if(!b) return;
 const box = document.getElementById('bizModalBox');
 box.innerHTML =
  (b.pic?'<img src="'+b.pic+'" class="w-full h-56 object-cover rounded-t-2xl">':'<div class="w-full h-28 bg-yellow-100 flex items-center justify-center text-6xl rounded-t-2xl">🏪</div>')+
  '<div class="p-6">'+
  '<p class="text-2xl font-bold text-yellow-700">'+esc(b.name)+'</p>'+
  '<p class="inline-block bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold mt-2">'+esc(b.type)+'</p>'+
  '<div class="mt-4 space-y-1 text-gray-700">'+
  '<p>👤 <b>'+esc(b.owner)+'</b></p>'+
  (b.place?'<p>📍 '+esc(b.place)+'</p>':'')+
  (b.village?'<p>🏡 गाँव: '+esc(b.village)+'</p>':'')+
  '<p>📱 '+esc(b.phone)+'</p></div>'+
  (b.description?'<p class="text-sm text-gray-700 mt-3 bg-gray-50 rounded-lg p-3 whitespace-pre-line">'+esc(b.description)+'</p>':'')+
  '<div class="grid grid-cols-1 gap-2 mt-5">'+
  '<a href="tel:'+esc(b.phone)+'" class="text-center bg-green-600 text-white px-4 py-3 rounded-lg font-bold">📞 Call करो</a>'+
  '<a href="https://wa.me/91'+esc(b.phone)+'" target="_blank" class="text-center bg-green-500 text-white px-4 py-3 rounded-lg font-bold">💬 WhatsApp</a>'+
  (b.gmap?'<a href="'+esc(b.gmap)+'" target="_blank" class="text-center bg-blue-600 text-white px-4 py-3 rounded-lg font-bold">📍 Location देखो</a>':'')+
  '<button onclick="closeBizForce()" class="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold">बंद करो / Close</button>'+
  '</div></div>';
 document.getElementById('bizModal').classList.remove('hidden');
}
function closeBizForce(){ document.getElementById('bizModal').classList.add('hidden'); }
function closeBiz(e){ if(e && e.target && e.target.id==='bizModal') closeBizForce(); }
function bizMiniCard(b){
 return '<div onclick="openBiz(\''+b.id+'\')" class="w-56 shrink-0 bg-white border-2 border-yellow-300 rounded-xl overflow-hidden shadow cursor-pointer hover:shadow-xl">'+
  (b.pic?'<img src="'+b.pic+'" class="w-full h-28 object-cover">':'<div class="w-full h-20 bg-yellow-100 flex items-center justify-center text-4xl">🏪</div>')+
  '<div class="p-3"><p class="font-bold text-yellow-800 text-sm truncate">'+esc(b.name)+'</p>'+
  '<p class="text-[10px] bg-yellow-200 inline-block px-2 py-0.5 rounded font-bold mt-1 truncate max-w-full">'+esc(b.type)+'</p>'+
  '<p class="text-[11px] text-gray-600 mt-1 truncate">👤 '+esc(b.owner)+'</p>'+
  (b.place?'<p class="text-[11px] text-gray-500 truncate">📍 '+esc(b.place)+'</p>':'')+
  '</div></div>';
}
// हर page के नीचे चलती-फिरती business पट्टी (बिना search किए भी दिखे)
function businessStrip(){
 const biz = allBusinesses();
 if(!biz.length) return '';
 const sh = biz.slice().sort(()=>Math.random()-0.5);
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
 '<p class="text-gray-500 mb-6">Members की business details automatic दिखती हैं</p>'+
 '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+
 list.map(b => '<div onclick="openBiz(\''+b.id+'\')" class="bg-white border-2 border-yellow-300 rounded-lg overflow-hidden shadow-md hover:shadow-xl cursor-pointer transform hover:scale-[1.02] transition-all">'+
  (b.pic?'<img src="'+b.pic+'" class="w-full h-44 object-cover">':'')+
  '<div class="p-5"><p class="font-bold text-xl text-yellow-700">'+esc(b.name)+'</p>'+
  '<p class="inline-block bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs font-bold mt-2">'+esc(b.type)+'</p>'+
  '<p class="text-sm text-gray-700 mt-3">👤 '+esc(b.owner)+'</p><p class="text-sm text-gray-700">📱 '+esc(b.phone)+'</p>'+
  (b.place?'<p class="text-sm text-gray-700">📍 '+esc(b.place)+'</p>':'')+
  (b.description?'<p class="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">'+esc(b.description)+'</p>':'')+
  (b.gmap?'<a href="'+esc(b.gmap)+'" target="_blank" onclick="event.stopPropagation()" class="block text-center mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">📍 Location देखो</a>':'')+
  '<p class="text-center text-xs text-yellow-700 font-bold mt-3">👆 पूरी details के लिए click करो</p>'+
 '</div></div>').join('')+'</div>';
}

// ================= GARBA =================
async function submitGarba(){
 const me = myMember();
 if(!me || me.status!=='approved'){ alert('❌ पहले Community member बनो (registered + approved)। Community page पर details भरो।'); return; }
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
 if(!me || me.status!=='approved'){ alert('❌ पहले Community member बनो (registered + approved)।'); return; }
 if(cricketData.find(c=>c.phone===me.phone)){ alert('❌ आप पहले से list में हो!'); return; }
 busy(true);
 await db.collection('cricket').add({name:me.name+' '+me.surname, age:me.age||'', area:me.present_city||me.home_village||'', phone:me.phone, createdAt:today()});
 busy(false);
 alert('✅ आप Cricket interested list में add हो गए! 🏏');
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
let bloodFilterGroup='', bloodFilterDist='';
function allDonors(){
 const fromMembers = publicMembers()
  .filter(m => m.blood_group && (!m.blood_donor || m.blood_donor.indexOf('हाँ')===0))
  .map(m => ({name:m.name+' '+m.surname, blood_group:m.blood_group, phone:m.phone, district:distOf(m,'present')||distOf(m,'home')||'', village:m.home_village||m.present_city||''}));
 const seen = {};
 const merged = [];
 bloodData.concat(fromMembers).forEach(d => { if(!seen[d.phone]){ seen[d.phone]=1; merged.push(d); } });
 return merged;
}
function renderBloodPage(){
 const filtered = allDonors().filter(m => (!bloodFilterGroup || m.blood_group===bloodFilterGroup) && (!bloodFilterDist || m.district===bloodFilterDist));
 let h = '<h2 class="text-3xl font-bold mb-2">🩸 BLOOD DONORS / रक्तदाता ('+filtered.length+')</h2>';
 h += '<p class="text-gray-500 mb-6">District/Group से खोजो - सीधे call करो | Donors समाज द्वारा verified ✅</p>';
 h += '<div class="bg-white rounded-lg shadow p-5 mb-6 flex flex-wrap gap-3">';
 h += '<select onchange="bloodFilterGroup=this.value;renderApp()" class="px-3 py-2 border-2 rounded"><option value="">सभी Blood Group</option>'+BLOOD_GROUPS.map(g=>'<option '+(g===bloodFilterGroup?'selected':'')+'>'+g+'</option>').join('')+'</select>';
 h += '<select onchange="bloodFilterDist=this.value;renderApp()" class="px-3 py-2 border-2 rounded"><option value="">सभी District</option>'+MP_DISTRICTS.map(d=>'<option '+(d===bloodFilterDist?'selected':'')+'>'+d+'</option>').join('')+'</select>';
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
    '<div class="bg-white border-2 border-red-300 rounded-lg p-5 shadow-md"><div class="flex justify-between items-start"><div><p class="font-bold text-lg">'+esc(m.name)+'</p>'+
    '<p class="text-2xl font-bold text-red-600 my-1">'+esc(m.blood_group)+'</p>'+
    '<p class="text-sm text-gray-600">📍 '+esc(m.village?m.village+', ':'')+esc(m.district||'-')+'</p></div>'+
    '<a href="tel:'+m.phone+'" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">📞 Call</a></div></div>').join('')+'</div>';
  });
 }
 return h;
}

// ================= PROPERTY (मकान-किरायेदार) =================
function activeProperties(){
 const days = siteMeta.propertyValidityDays || 365;
 const cutoff = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
 return propertyData.filter(p => p.status==='approved' && p.active!==false && (p.approvedAt||p.createdAt||'9999') >= cutoff);
}
async function submitProperty(){
 const type=document.getElementById('pp_type').value;
 const nm=fmtName(document.getElementById('pp_name').value);
 const ph=fmtPhone(document.getElementById('pp_phone').value);
 const area=document.getElementById('pp_area').value.trim();
 const rent=document.getElementById('pp_rent').value.trim();
 const bhk=document.getElementById('pp_bhk').value.trim();
 const desc=document.getElementById('pp_desc').value.trim();
 const pic=document.getElementById('pp_pic').value;
 if(!type||!nm||!ph||!area){ alert('❌ Type, Name, Phone, Area जरूरी!'); return; }
 const code = randCode();
 busy(true);
 const kind = document.getElementById('pp_kind').value;
 await db.collection('property').add({kind,type,name:nm,phone:ph,area,rent,bhk,description:desc,pic,code,status:'pending',active:true,createdAt:today()});
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
function propCard(p){
 return '<div class="bg-white border-2 border-purple-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg">'+
 (p.pic?'<img src="'+p.pic+'" class="w-full h-44 object-cover">':'')+
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
 const fee = siteMeta.propertyFee||'500';
 let h = '<h2 class="text-3xl font-bold mb-2">🏠 मकानमालिक - किरायेदार / दुकान</h2>';
 h += '<p class="text-gray-500 mb-4">दो अलग portal — जो चाहिए उस पर click करो</p>';
 h += '<div class="grid grid-cols-2 gap-3 mb-5">'+
 '<button onclick="setPropKind(\'makan\')" class="px-4 py-5 rounded-xl font-bold text-center '+(isMakan?'bg-purple-600 text-white shadow-lg':'bg-white border-2 border-purple-300 text-purple-700')+'"><p class="text-3xl mb-1">🏠</p><p>मकान</p><p class="text-xs font-normal">House / किराया ('+nMakan+')</p></button>'+
 '<button onclick="setPropKind(\'dukan\')" class="px-4 py-5 rounded-xl font-bold text-center '+(!isMakan?'bg-purple-600 text-white shadow-lg':'bg-white border-2 border-purple-300 text-purple-700')+'"><p class="text-3xl mb-1">🏪</p><p>दुकान</p><p class="text-xs font-normal">Shop / किराया ('+nDukan+')</p></button></div>';

 // ===== JOIN US + ₹Fee + Razorpay (हर portal के लिए अलग) =====
 h += '<div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-6 mb-6 text-center">'+
  '<h3 class="text-2xl font-bold mb-1">🤝 JOIN US — '+(isMakan?'🏠 मकान':'🏪 दुकान')+' Listing</h3>'+
  '<p class="text-purple-100 mb-3">अपना '+(isMakan?'मकान':'दुकान')+' यहाँ list करो — पूरे समाज तक पहुँचेगा</p>'+
  '<p class="text-3xl font-bold mb-3">₹'+esc(fee)+' <span class="text-base font-normal">/ साल</span></p>'+
  '<div id="razorpayBtnContainer" class="flex justify-center mb-3"></div>'+
  (((isMakan?siteMeta.razorpayMakan:siteMeta.razorpayDukan)||siteMeta.razorpayButtonId) ? '' :
    '<div class="bg-white/20 rounded-lg p-3 text-sm mb-3">💳 Payment button जल्द चालू होगा — तब तक Admin से बात करो: '+CONTACT_PHONE+'</div>')+
  '<button onclick="showPropForm=!showPropForm;renderApp()" class="bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg">➕ Payment के बाद यहाँ Listing डालो</button>'+
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
  h += '<div class="bg-yellow-100 border border-yellow-400 rounded p-3 mb-4 text-sm">💳 Fee: ₹'+(siteMeta.propertyFee||'500')+'/साल — Payment ऊपर Razorpay से करो, फिर यह form भरो</div>';
  h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">क्या? *</label><select id="pp_kind" class="w-full px-3 py-2 border-2 rounded"><option value="makan" '+(propKind==='makan'?'selected':'')+'>🏠 मकान</option><option value="dukan" '+(propKind==='dukan'?'selected':'')+'>🏪 दुकान</option></select></div>'+
  '<div><label class="text-xs font-bold">Type *</label><select id="pp_type" class="w-full px-3 py-2 border-2 rounded"><option value="rent">किराए पर देना है</option><option value="wanted">मुझे किराए पर चाहिए</option></select></div>'+
  '<div><label class="text-xs font-bold">Name / नाम *</label><input id="pp_name" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Phone *</label><input id="pp_phone" maxlength="10" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Area / इलाका (Indore) *</label><input id="pp_area" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Rent (₹/माह)</label><input id="pp_rent" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">BHK / Rooms</label><input id="pp_bhk" placeholder="जैसे: 2 BHK" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="pp_pic"><button type="button" onclick="openCloudUpload(\'pp_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="pp_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="pp_desc" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>';
  h += '<div class="flex gap-3 mt-4"><button onclick="submitProperty()" class="bg-purple-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showPropForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }

 if(!list.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">'+(isMakan?'🏠':'🏪')+'</p><p class="text-lg font-bold text-gray-600">अभी इस portal में कोई listing नहीं है</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+list.map(propCard).join('')+'</div>';
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
function setShaadiKind(k, allowed){
 if(k !== allowed){
  alert(allowed==='vadhu'
   ? 'ℹ️ आप पुरुष हैं — आपको सिर्फ 👰 वधू (लड़कियों) की profiles दिखेंगी।'
   : 'ℹ️ आप महिला हैं — आपको सिर्फ 🤵 वर (लड़कों) की profiles दिखेंगी।');
  return;
 }
 shaadiKind = k; renderApp();
}
function renderShaadiPage(){
 const me = myMember();
 let h = '<h2 class="text-3xl font-bold mb-2">💍 SHAADI / विवाह</h2>';
 h += '<div class="bg-pink-50 border-2 border-pink-300 rounded-lg p-4 mb-6 text-center"><p class="font-bold text-pink-800">अपनी profile डलवाने के लिए संपर्क करें: '+CONTACT_PHONE+'</p><p class="text-xs text-gray-500 mt-1">सभी profiles ⭐ PAID + VERIFIED ✅ | रोज़ सिर्फ 10 profiles देख सकते हो</p>'+
  (siteMeta.shaadiFee?'<p class="text-sm font-bold text-pink-700 mt-2">💳 Profile Fee: ₹'+esc(siteMeta.shaadiFee)+'</p>':'')+
  (siteMeta.razorpayShaadi?'<div class="mt-3 flex justify-center" id="razorpayShaadiBox"></div>':'')+
  '</div>';
 if(!me || me.status!=='approved'){
  h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🔒</p><p class="text-lg font-bold text-gray-600">Shaadi profiles देखने के लिए पहले Community member बनो</p><button onclick="startRegister()" class="mt-4 bg-pink-600 text-white px-6 py-3 rounded-lg font-bold">📝 REGISTER YOURSELF</button></div>';
  return h;
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
 const paidOf = arr => arr.filter(s => s.paid!==false);
 const varList   = paidOf(shaadiData.filter(s => s.status==='approved' && (s.gender||'').indexOf('Male')===0));
 const vadhuList = paidOf(shaadiData.filter(s => s.status==='approved' && (s.gender||'').indexOf('Female')===0));
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
  kind=document.getElementById('jb_kind').value;
 if(!t||!ph){ alert('❌ Title और Contact जरूरी!'); return; }
 busy(true);
 await db.collection('jobs').add({title:t,company:c,place:pl,salary:sal,phone:ph,details:ds,kind:kind,status:'pending',createdAt:today()});
 busy(false); showJobForm=false;
 alert('✅ Submit हो गया! Admin approval के बाद live होगा।'); renderApp();
}
function renderRozgaarPage(){
 const all = jobsData.filter(j=>j.status==='approved');
 const list = all.filter(j => (j.kind||'dena') === jobKind);
 let h = '<h2 class="text-3xl font-bold mb-2">💼 ROZGAAR / रोज़गार</h2>';
 h += '<div class="flex flex-wrap gap-2 mb-4">'+
 '<button onclick="jobKind=\'dena\';renderApp()" class="px-4 py-2 rounded-lg font-bold text-sm '+(jobKind==='dena'?'bg-green-600 text-white':'bg-gray-200')+'">💼 रोज़गार देना है ('+all.filter(j=>(j.kind||'dena')==='dena').length+')</button>'+
 '<button onclick="jobKind=\'lena\';renderApp()" class="px-4 py-2 rounded-lg font-bold text-sm '+(jobKind==='lena'?'bg-green-600 text-white':'bg-gray-200')+'">🙋 रोज़गार चाहिए ('+all.filter(j=>j.kind==='lena').length+')</button>'+
 '<button onclick="jobKind=\'freelance\';renderApp()" class="px-4 py-2 rounded-lg font-bold text-sm '+(jobKind==='freelance'?'bg-green-600 text-white':'bg-gray-200')+'">💻 Freelancing ('+all.filter(j=>j.kind==='freelance').length+')</button></div>';
 h += '<button onclick="showJobForm=!showJobForm;renderApp()" class="mb-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">➕ Post करो</button>';
 if(showJobForm){
  h += '<div class="bg-green-50 border-2 border-green-400 rounded-lg p-5 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">किस type का? *</label><select id="jb_kind" class="w-full px-3 py-2 border-2 rounded"><option value="dena">💼 रोज़गार देना है (job available)</option><option value="lena">🙋 रोज़गार चाहिए (job needed)</option><option value="freelance">💻 Freelancing काम</option></select></div>'+
  '<div><label class="text-xs font-bold">Job Title *</label><input id="jb_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Company</label><input id="jb_company" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Place</label><input id="jb_place" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Salary</label><input id="jb_salary" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Contact *</label><input id="jb_phone" class="w-full px-3 py-2 border-2 rounded"></div>'+
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
 return oldItems.filter(o => o.status==='approved' && (o.createdAt||'9999') >= cutoff);
}
async function submitOldItem(){
 const t=document.getElementById('it_title').value.trim(), pr=document.getElementById('it_price').value.trim(),
  ph=fmtPhone(document.getElementById('it_phone').value), ds=document.getElementById('it_desc').value.trim(),
  pic=document.getElementById('it_pic').value;
 if(!t||!pr||!ph){ alert('❌ Item, Price, Contact जरूरी!'); return; }
 busy(true);
 const olx=document.getElementById('it_olx').value.trim();
 await db.collection('olditems').add({title:t,price:pr,phone:ph,description:ds,pic:pic,olx_link:olx,status:'pending',createdAt:today()});
 busy(false); showItemForm=false;
 alert('✅ Item submit! Admin approval के बाद '+(siteMeta.expiryDays||30)+' दिन live रहेगा।'); renderApp();
}
function renderOldItemsPage(){
 const approved = activeOldItems();
 let h = '<h2 class="text-3xl font-bold mb-2">🛒 पुराने सामान का बाज़ार ('+approved.length+')</h2>';
 h += '<p class="text-gray-500 mb-4">पुराना सामान बेचो-खरीदो — समाज के अंदर। सामान की पूरी details + OLX link (click करते ही OLX पर redirect)</p>';
 h += '<button onclick="showItemForm=!showItemForm;renderApp()" class="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold">➕ अपना सामान बेचो</button>';
 if(showItemForm){
  h += '<div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-5 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">Item Name *</label><input id="it_title" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Price (₹) *</label><input id="it_price" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Contact *</label><input id="it_phone" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">Photo 📷</label><input type="hidden" id="it_pic"><button type="button" onclick="openCloudUpload(\'it_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Upload</button><img id="it_pic_prev" class="hidden mt-2 h-24 object-cover rounded border-2"></div>'+
  '<div><label class="text-xs font-bold">🔗 OLX Link (optional — OLX पर भी डाला हो तो)</label><input id="it_olx" placeholder="https://www.olx.in/item/..." class="w-full px-3 py-2 border-2 rounded"><p class="text-[10px] text-gray-400 mt-0.5">यहाँ link डालोगे तो सामान पर "OLX पर देखो" button आएगा जो सीधे OLX पर ले जाएगा</p></div>'+
  '<div class="md:col-span-2"><label class="text-xs font-bold">Details</label><textarea id="it_desc" rows="2" class="w-full px-3 py-2 border-2 rounded"></textarea></div></div>'+
  '<div class="flex gap-3 mt-4"><button onclick="submitOldItem()" class="bg-purple-600 text-white px-8 py-3 rounded font-bold">✅ SUBMIT</button><button onclick="showItemForm=false;renderApp()" class="bg-gray-400 text-white px-8 py-3 rounded font-bold">CANCEL</button></div></div>';
 }
 if(!approved.length) h += '<div class="bg-white rounded-lg p-10 text-center shadow"><p class="text-4xl mb-3">🛒</p><p class="text-lg font-bold text-gray-600">अभी कोई item नहीं - पहला आप डालो!</p></div>';
 else h += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">'+approved.map(o =>
  '<div class="bg-white border-2 border-purple-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg">'+
  (o.pic?'<img src="'+o.pic+'" class="w-full h-44 object-cover">':'')+
  '<div class="p-4"><p class="font-bold text-lg text-purple-700">'+esc(o.title)+'</p>'+
  '<p class="text-2xl font-bold text-green-600 mt-1">₹ '+esc(o.price)+'</p>'+
  (o.description?'<p class="text-sm text-gray-600 mt-2">'+esc(o.description)+'</p>':'')+
  '<a href="tel:'+o.phone+'" class="block text-center mt-3 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">📞 Call</a>'+
  (o.olx_link?'<a href="'+esc(o.olx_link)+'" target="_blank" rel="noopener" class="block text-center mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">🔗 OLX पर देखो / Open OLX</a>':'')+
  '</div></div>').join('')+'</div>';
 return h;
}

// ================= NEWS =================
function renderNewsPage(){
 if(!newsData.length) return '<h2 class="text-3xl font-bold mb-6">📰 NEWS</h2><p class="text-gray-500 text-center py-12 text-lg">अभी कोई news नहीं है</p>';
 let list = newsData.slice();
 if(selectedNewsId){ const idx=list.findIndex(n=>n.id===selectedNewsId); if(idx>0){ const [n]=list.splice(idx,1); list.unshift(n); } }
 return '<h2 class="text-3xl font-bold mb-6">📰 NEWS ('+newsData.length+')</h2><div class="space-y-5">'+
 list.map(n => '<div class="bg-white border-2 '+(n.id===selectedNewsId?'border-red-600 ring-2 ring-red-300':'border-red-300')+' rounded-lg overflow-hidden shadow-md">'+
  (n.pic?'<img src="'+n.pic+'" class="w-full h-52 object-cover">':'')+
  '<div class="p-5"><p class="text-2xl font-bold text-red-700">'+esc(n.title)+'</p><p class="text-xs text-gray-500 mt-1">📅 '+n.date+'</p><p class="text-gray-700 mt-3 whitespace-pre-line">'+esc(n.content)+'</p>'+
  '<button onclick="shareWA(\'📰 '+esc(n.title).replace(/\'/g,'')+' | Patidar Samaj Indore: \'+pageLink(\'news/'+n.id+'\'))" class="mt-4 bg-green-500 text-white px-5 py-2 rounded-lg font-bold text-sm">📤 WhatsApp Share</button>'+
  '</div></div>').join('')+'</div>';
}

// ================= PRATIBHA =================
async function submitPratibha(){
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
 let h = '<h2 class="text-3xl font-bold mb-2">🏆 प्रतिभा परिचय</h2>';
 h += '<button onclick="showPratForm=!showPratForm;renderApp()" class="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold">➕ प्रतिभा जोड़ो</button>';
 if(showPratForm){
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

// ================= ADMIN HELPERS =================
function switchTab(t){ adminTab=t; editingId=null; renderApp(); }
function _localCol(col){
 if(col==='members') return membersData; if(col==='events') return eventsData;
 if(col==='news') return newsData; if(col==='photos') return photosData;
 if(col==='olditems') return oldItems; if(col==='pratibha') return pratibhaData;
 if(col==='jobs') return jobsData; if(col==='shaadi') return shaadiData;
 if(col==='relatives') return relativesData; if(col==='committee') return committeeData;
 if(col==='garba_regs') return garbaRegs; if(col==='garba_team') return garbaTeam;
 if(col==='cricket') return cricketData; if(col==='property') return propertyData;
 if(col==='blood') return bloodData; return null;
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

// Professions
async function addProfessionAdmin(){
 const p = document.getElementById('newProf').value.trim();
 if(!p){ alert('❌ लिखो!'); return; }
 if(professionsList().includes(p)){ alert('❌ पहले से है!'); return; }
 siteMeta.professions = professionsList().concat([p]); await saveMeta(); renderApp();
}
async function editProfessionAdmin(i){
 const np = prompt('Edit:', professionsList()[i]);
 if(np&&np.trim()){ siteMeta.professions[i]=np.trim(); await saveMeta(); renderApp(); }
}
async function delProfessionAdmin(i){
 if(confirm('"'+professionsList()[i]+'" delete?')){ siteMeta.professions.splice(i,1); await saveMeta(); renderApp(); }
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

// Sub-admins
const SUBADMIN_TABS = [['members','👥 Members'],['relatives','👨‍👩‍👧 Relatives'],['professions','🔧 Professions'],['garba','🪩 Garba'],['cricket','🏏 Cricket'],['property','🏠 Property'],['blood','🩸 Blood'],['shaadi','💍 Shaadi'],['rozgaar','💼 Jobs'],['olditems','🛒 सामान'],['events','📅 Events'],['news','📰 News'],['pratibha','🏆 प्रतिभा'],['gallery','🖼️ Gallery']];
async function addSubAdmin(){
 const nm = fmtName(document.getElementById('sa_name').value);
 const ph = fmtPhone(document.getElementById('sa_phone').value);
 const tabs = SUBADMIN_TABS.filter(t => document.getElementById('sa_tab_'+t[0]).checked).map(t=>t[0]);
 if(!nm || ph.length!==10){ alert('❌ Name और सही 10-digit Number जरूरी!'); return; }
 if(ph === ADMIN_PHONE){ alert('❌ यह आपका Super Admin number है - यह पहले से full access है!'); return; }
 if(!tabs.length){ alert('❌ कम से कम 1 portal चुनो!'); return; }
 if((siteMeta.subAdmins||[]).find(s=>fmtPhone(s.phone)===ph)){ alert('❌ यह number पहले से sub-admin है!'); return; }
 siteMeta.subAdmins = (siteMeta.subAdmins||[]).concat([{name:nm, phone:ph, tabs:tabs, createdAt:today()}]);
 await saveMeta();
 alert('✅ Sub-Admin बन गया!\n\n👤 '+nm+'\n📱 '+ph+'\n📂 Portals: '+tabs.join(', ')+'\n\nउसको बोलो: website पर अपने इसी number से OTP LOGIN करे\n→ ⚙️ button अपने आप दिखेगा → उसके portals खुलेंगे।');
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
 siteMeta.propertyFee = document.getElementById('st_propfee').value.trim()||'500';
 siteMeta.razorpayButtonId = document.getElementById('st_razorpay').value.trim();
 siteMeta.razorpayMakan = document.getElementById('st_rz_makan').value.trim();
 siteMeta.razorpayDukan = document.getElementById('st_rz_dukan').value.trim();
 siteMeta.shaadiFee = document.getElementById('st_shaadifee').value.trim();
 siteMeta.razorpayShaadi = document.getElementById('st_rz_shaadi').value.trim();
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
 const pendRel = relativesData.filter(r=>r.status==='pending');
 let h = '<div class="bg-gradient-to-r from-red-900 to-red-800 text-white rounded-lg px-6 py-5 mb-6 flex flex-wrap justify-between items-center gap-3"><h2 class="text-2xl md:text-3xl font-bold">⚙️ ADMIN DASHBOARD</h2>'+
 '<div class="text-sm">👥 '+approved.length+' approved | ⏳ '+pending.length+' pending</div>'+
 '<button onclick="goPage(\'home\')" class="bg-blue-600 px-5 py-2 rounded font-bold">← BACK</button></div>';
 const tabs = [
  ['members','👥 MEMBERS'+(pending.length?' ('+pending.length+')':'')],
  ['relatives','👨‍👩‍👧 RELATIVES'+(pendRel.length?' ('+pendRel.length+')':'')],
  ['professions','🔧 PROFESSIONS'],
  ['garba','🪩 GARBA'+(pendGarba.length?' ('+pendGarba.length+')':'')],
  ['cricket','🏏 CRICKET'],
  ['property','🏠 PROPERTY'+(pendProp.length?' ('+pendProp.length+')':'')],
  ['blood','🩸 BLOOD'],
  ['shaadi','💍 SHAADI'],
  ['rozgaar','💼 JOBS'+(pendJobs.length?' ('+pendJobs.length+')':'')],
  ['olditems','🛒 सामान'+(pendItems.length?' ('+pendItems.length+')':'')],
  ['events','📅 EVENTS'],
  ['news','📰 NEWS'],
  ['pratibha','🏆 प्रतिभा'+(pendPrat.length?' ('+pendPrat.length+')':'')],
  ['gallery','🖼️ GALLERY'],
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

 if(adminTab==='professions'){
  h += '<div class="bg-orange-50 border-2 border-orange-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">➕ ADD PROFESSION</h3><div class="flex gap-3"><input id="newProf" class="flex-1 px-4 py-3 border-2 rounded-lg"><button onclick="addProfessionAdmin()" class="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold">✅ ADD</button></div></div>';
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-2xl font-bold mb-4">🔧 ALL ('+professionsList().length+')</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  professionsList().map((p,i)=>'<div class="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-lg px-4 py-3"><span class="font-bold">'+esc(p)+'</span><div class="flex gap-2"><button onclick="editProfessionAdmin('+i+')" class="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">✏️</button><button onclick="delProfessionAdmin('+i+')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';
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
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">Team ('+garbaTeam.length+')</h3><div class="space-y-2">'+garbaTeam.map(t=>'<div class="flex justify-between items-center bg-pink-50 rounded-lg px-4 py-2"><span class="font-bold">'+esc(t.name)+' - '+esc(t.role||'')+' ('+esc(t.phone)+')</span><button onclick="delDoc(\'garba_team\',\''+t.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+'</div></div>';
 }

 if(adminTab==='cricket'){
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">🏏 Interested Players ('+cricketData.length+')</h3><div class="space-y-2">'+
  cricketData.map(c=>'<div class="flex justify-between items-center bg-green-50 rounded-lg px-4 py-2"><span class="font-bold">'+esc(c.name)+' - '+esc(c.area)+' ('+esc(c.phone)+')</span><button onclick="delDoc(\'cricket\',\''+c.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+'</div></div>';
 }

 if(adminTab==='property'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">⏳ PENDING LISTINGS ('+pendProp.length+')</h3>';
  h += pendProp.length ? '<div class="space-y-3">'+pendProp.map(p=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div>'+
   (p.pic?'<img src="'+p.pic+'" class="h-16 w-16 object-cover rounded inline-block mr-2">':'')+
   '<span><b>'+esc(p.name)+'</b> - '+(p.type==='rent'?'🏠 मकान':'🔍 चाहिए')+' | '+esc(p.area)+' | 📱'+esc(p.phone)+'</span></div><div class="flex gap-2"><button onclick="updDoc(\'property\',\''+p.id+'\',{status:\'approved\',approvedAt:today()})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'property\',\''+p.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div>';
  const appProp = propertyData.filter(p=>p.status==='approved');
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">✅ LIVE LISTINGS ('+appProp.length+')</h3><div class="space-y-2">'+
  appProp.map(p=>'<div class="flex justify-between items-center bg-purple-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="font-bold">'+esc(p.name)+' - '+esc(p.area)+' <span class="text-xs '+(p.active!==false?'text-green-600':'text-red-600')+'">('+(p.active!==false?'ACTIVE':'INACTIVE')+')</span></span><div class="flex gap-2"><button onclick="updDoc(\'property\',\''+p.id+'\',{active:'+(p.active!==false?'false':'true')+'})" class="bg-gray-600 text-white px-3 py-1 rounded font-bold text-sm">🔄</button><button onclick="delDoc(\'property\',\''+p.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div></div>').join('')+'</div></div>';
 }

 if(adminTab==='blood'){
  h += '<div class="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6"><h3 class="text-xl font-bold mb-4">➕ ADD BLOOD DONOR</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  '<input id="bl_name" placeholder="Name *" class="px-3 py-2 border-2 rounded">'+
  '<select id="bl_group" class="px-3 py-2 border-2 rounded"><option value="">Blood Group *</option>'+BLOOD_GROUPS.map(g=>'<option>'+g+'</option>').join('')+'</select>'+
  '<input id="bl_phone" maxlength="10" placeholder="Phone *" class="px-3 py-2 border-2 rounded">'+
  '<select id="bl_district" class="px-3 py-2 border-2 rounded"><option value="">District</option>'+MP_DISTRICTS.map(d=>'<option>'+d+'</option>').join('')+'</select>'+
  '<input id="bl_village" placeholder="Village/City" class="px-3 py-2 border-2 rounded"></div>'+
  '<button onclick="addBloodAdmin()" class="mt-4 bg-red-600 text-white px-8 py-3 rounded font-bold">✅ ADD DONOR</button>'+
  '<p class="text-xs text-gray-500 mt-2">💡 TIP: Members tab में जिनका blood_group भरा है, उनकी details यहाँ copy कर सकते हो</p></div>';
  h += '<div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">🩸 ALL DONORS ('+bloodData.length+')</h3><div class="space-y-2">'+
  bloodData.map(b=>'<div class="flex justify-between items-center bg-red-50 rounded-lg px-4 py-2 flex-wrap gap-2"><span class="font-bold text-sm">'+esc(b.name)+' | <span class="text-red-600">'+esc(b.blood_group)+'</span> | '+esc(b.district||'-')+' | 📱'+esc(b.phone)+'</span><button onclick="delDoc(\'blood\',\''+b.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+'</div></div>';
 }

 if(adminTab==='shaadi'){
  h += '<div class="bg-pink-50 border-2 border-pink-400 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">➕ ADD SHAADI PROFILE</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
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
  h += '<div class="space-y-3">'+shaadiData.map(s=>{
   const isPaid = s.paid!==false;
   return '<div class="bg-white border-2 border-pink-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(s.pic?'<img src="'+s.pic+'" class="h-16 w-16 object-cover rounded">':'')+'<div><p class="font-bold">'+esc(s.name)+' | '+esc(s.gender||'-')+' | '+esc(s.age||'-')+' | '+esc(s.village||'-')+' '+(isPaid?'<span class="text-[10px] bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-bold">⭐ PAID</span>':'<span class="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">UNPAID</span>')+'</p><p class="text-sm text-gray-600">📞 '+esc(s.contact||'-')+'</p></div></div><div class="flex gap-2"><button onclick="toggleShaadiPaid(\''+s.id+'\','+isPaid+')" class="'+(isPaid?'bg-gray-600':'bg-yellow-500')+' text-white px-4 py-2 rounded font-bold text-sm">'+(isPaid?'UNPAID करो':'⭐ PAID करो')+'</button><button onclick="delDoc(\'shaadi\',\''+s.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div></div>';
  }).join('')+'</div>';
 }

 if(adminTab==='rozgaar'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING JOBS ('+pendJobs.length+')</h3>';
  h += pendJobs.length ? '<div class="space-y-3">'+pendJobs.map(j=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div><p class="font-bold">'+esc(j.title)+' - '+esc(j.company||'')+'</p><p class="text-sm text-gray-600">📍 '+esc(j.place||'')+' | 📱 '+esc(j.phone)+'</p></div><div class="flex gap-2"><button onclick="updDoc(\'jobs\',\''+j.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'jobs\',\''+j.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div><div class="space-y-3">'+jobsData.filter(j=>j.status==='approved').map(j=>'<div class="bg-white border-2 border-green-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p class="font-bold">'+esc(j.title)+' ('+esc(j.place||'')+')</p><button onclick="delDoc(\'jobs\',\''+j.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div>').join('')+'</div>';
 }

 if(adminTab==='olditems'){
  h += '<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"><h3 class="text-2xl font-bold mb-4">⏳ PENDING ITEMS ('+pendItems.length+')</h3>';
  h += pendItems.length ? '<div class="space-y-3">'+pendItems.map(o=>'<div class="bg-white border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(o.pic?'<img src="'+o.pic+'" class="h-16 w-16 object-cover rounded">':'')+'<div><p class="font-bold">'+esc(o.title)+' - ₹'+esc(o.price)+'</p><p class="text-sm text-gray-600">📱 '+esc(o.phone)+'</p></div></div><div class="flex gap-2"><button onclick="updDoc(\'olditems\',\''+o.id+'\',{status:\'approved\'})" class="bg-green-600 text-white px-4 py-2 rounded font-bold">✅</button><button onclick="delDoc(\'olditems\',\''+o.id+'\')" class="bg-red-600 text-white px-4 py-2 rounded font-bold">❌</button></div></div>').join('')+'</div>' : '<p class="text-gray-500">कोई pending नहीं</p>';
  h += '</div><div class="space-y-3">'+oldItems.filter(o=>o.status==='approved').map(o=>'<div class="bg-white border-2 border-purple-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><p class="font-bold">'+esc(o.title)+' - ₹'+esc(o.price)+'</p><button onclick="delDoc(\'olditems\',\''+o.id+'\')" class="bg-red-500 text-white px-4 py-2 rounded font-bold">🗑️</button></div>').join('')+'</div>';
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
  if(editNewsId) h += editNewsForm();
  h += '<div class="space-y-3">'+newsData.map(n=>'<div class="bg-white border-2 border-red-300 rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div class="flex gap-3 items-center">'+(n.pic?'<img src="'+n.pic+'" class="h-16 w-16 object-cover rounded">':'<div class="h-16 w-16 bg-red-50 rounded flex items-center justify-center text-2xl">📰</div>')+'<div><p class="font-bold">'+esc(n.title)+'</p><p class="text-xs text-gray-500">📅 '+n.date+'</p><p class="text-xs text-gray-500">'+esc(String(n.content||'').slice(0,60))+'...</p></div></div><div class="flex gap-2"><button onclick="startEditNews(\''+n.id+'\')" class="bg-blue-500 text-white px-3 py-2 rounded font-bold">✏️ EDIT</button><button onclick="delDoc(\'news\',\''+n.id+'\')" class="bg-red-500 text-white px-3 py-2 rounded font-bold">🗑️</button></div></div>').join('')+'</div>';
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
  '<div><label class="text-xs font-bold">💰 Property Fee (₹)</label><input id="st_propfee" value="'+esc(siteMeta.propertyFee||'500')+'" class="w-full px-3 py-2 border-2 rounded"></div></div>'+
  '<div><label class="text-xs font-bold">💳 Razorpay Button ID (Default / सभी के लिए)</label><input id="st_razorpay" value="'+esc(siteMeta.razorpayButtonId||'')+'" placeholder="pl_XXXXXXXXXXXXXX" class="w-full px-3 py-2 border-2 rounded"><p class="text-[10px] text-gray-400 mt-1">Razorpay Dashboard → Payment Button बनाओ → ID यहाँ paste करो</p></div>'+
  '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+
  '<div><label class="text-xs font-bold">🏠 मकान Portal — Razorpay Button ID</label><input id="st_rz_makan" value="'+esc(siteMeta.razorpayMakan||'')+'" placeholder="pl_XXXX (खाली = default)" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">🏪 दुकान Portal — Razorpay Button ID</label><input id="st_rz_dukan" value="'+esc(siteMeta.razorpayDukan||'')+'" placeholder="pl_XXXX (खाली = default)" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">💍 Shaadi Profile Fee (₹)</label><input id="st_shaadifee" value="'+esc(siteMeta.shaadiFee||'')+'" placeholder="जैसे 500" class="w-full px-3 py-2 border-2 rounded"></div>'+
  '<div><label class="text-xs font-bold">💍 Shaadi — Razorpay Button ID</label><input id="st_rz_shaadi" value="'+esc(siteMeta.razorpayShaadi||'')+'" placeholder="pl_XXXX" class="w-full px-3 py-2 border-2 rounded"></div></div>'+
  '<div><label class="text-xs font-bold">🚫 Blocked phones</label><p class="text-sm text-gray-600">'+((siteMeta.blocked||[]).join(', ')||'कोई नहीं')+'</p></div>';

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
  '<div class="bg-gray-50 border rounded-lg p-4 mb-3"><div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">'+
  '<input id="sa_name" placeholder="Name (जैसे: Rahul Patidar)" class="px-3 py-2 border-2 rounded">'+
  '<input id="sa_phone" maxlength="10" placeholder="उसका Mobile Number (10 digit)" class="px-3 py-2 border-2 rounded"></div>'+
  '<p class="text-xs text-gray-500 mb-2">💡 वो person अपने इस number से OTP login करेगा = admin option अपने आप मिलेगा</p>'+
  '<p class="text-xs font-bold mb-2">कौन-कौन से portals दिखें:</p><div class="flex flex-wrap gap-3 mb-3">'+
  SUBADMIN_TABS.map(t=>'<label class="flex items-center gap-1 text-sm bg-white border rounded px-2 py-1"><input type="checkbox" id="sa_tab_'+t[0]+'" class="h-4 w-4"> '+t[1]+'</label>').join('')+'</div>'+
  '<button onclick="addSubAdmin()" class="bg-indigo-600 text-white px-6 py-2 rounded font-bold">➕ CREATE SUB-ADMIN</button></div>'+
  '<div class="space-y-2 mb-4">'+(siteMeta.subAdmins||[]).map((s,i)=>'<div class="flex justify-between items-center bg-indigo-50 rounded-lg px-3 py-2 flex-wrap gap-2"><span class="text-sm"><b>'+esc(s.name)+'</b> | 📱 '+esc(s.phone||s.contact||'-')+' | '+(s.tabs||[]).join(', ')+'</span><button onclick="delSubAdmin('+i+')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+'</div></div>';

  h += '<div class="border-t-2 pt-4"><p class="font-bold text-lg mb-2">🙏 समिति MEMBERS</p><div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
  '<input id="cm_name" placeholder="Name" class="px-3 py-2 border-2 rounded">'+
  '<input id="cm_post" placeholder="Post (अध्यक्ष...)" class="px-3 py-2 border-2 rounded">'+
  '<div><input type="hidden" id="cm_pic"><button type="button" onclick="openCloudUpload(\'cm_pic\')" class="w-full bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm">📷 Photo</button></div>'+
  '<input id="cm_details" placeholder="Details" class="px-3 py-2 border-2 rounded"></div>'+
  '<button onclick="addCommittee()" class="mt-3 bg-blue-600 text-white px-6 py-2 rounded font-bold">➕ ADD</button>'+
  '<div class="mt-3 space-y-2">'+committeeData.map(c=>'<div class="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2"><span class="font-bold text-sm">'+esc(c.name)+' ('+esc(c.post)+')</span><button onclick="delDoc(\'committee\',\''+c.id+'\')" class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">🗑️</button></div>').join('')+'</div></div>';

  h += '</div><button onclick="saveSiteMeta()" class="mt-5 bg-blue-600 text-white px-8 py-3 rounded font-bold">✅ SAVE SETTINGS</button></div>';
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
 else if(currentPage==='news') html = renderNewsPage();
 else if(currentPage==='pratibha') html = renderPratibhaPage();
 else if(currentPage==='events') html = renderEventsPage();
 else if(currentPage==='gallery') html = renderGalleryPage();
 else if(currentPage==='profession') html = renderProfessionPage();
 else if(currentPage==='admin') html = renderAdmin();
 else html = renderHome();
 // 🏪 हर page के नीचे businesses (बिना search किए भी दिखें)
 if(currentPage!=='admin' && currentPage!=='business') html += businessStrip();
 mc.innerHTML = html;
 renderRandProfile();
 if(currentPage==='community') renderMemberGrid();
 if(currentPage==='property'){
  const rid = (propKind==='makan' ? siteMeta.razorpayMakan : siteMeta.razorpayDukan) || siteMeta.razorpayButtonId;
  if(rid) setTimeout(()=>mountRazorpayButton(rid,'razorpayBtnContainer'),30);
 }
 if(currentPage==='shaadi' && siteMeta.razorpayShaadi) setTimeout(()=>mountRazorpayButton(siteMeta.razorpayShaadi,'razorpayShaadiBox'),30);
 setTimeout(()=>{
  document.querySelectorAll('select[id$="gender"]').forEach(sel=>{
   const prefix = sel.id.slice(0,-6);
   togglePrivacyBox(sel.value, prefix);
  });
 },30);
}
function updateUI(){
 const loggedIn = !!currentUser;
 document.getElementById('loginBtn').classList.toggle('hidden', loggedIn);
 document.getElementById('logoutBtn').classList.toggle('hidden', !loggedIn && !localStorage.getItem('psim_admin_ok'));
 document.getElementById('adminBtn').classList.toggle('hidden', !isAdmin() && loggedIn);
 const me = loggedIn ? myMember() : null;
 const nameStr = loggedIn ? (me ? (me.name+' '+me.surname) : currentUser) : '';
 document.getElementById('userName').textContent = loggedIn ? '👤 '+nameStr+(isSuperAdmin()?' (Admin)':(subAdminInfo()?' (Sub-Admin)':'')) : '';
 // "REGISTER YOURSELF" bar - सिर्फ तब तक जब तक member नहीं बना
 const rb = document.getElementById('registerBar');
 if(rb) rb.classList.toggle('hidden', !!(loggedIn && me));
 // Login के तुरंत बाद नया user => सीधे registration form
 if(_pendingRegisterRedirect && loggedIn){
  _pendingRegisterRedirect = false;
  if(!me){
   setTimeout(()=>{ goPage('community'); setTimeout(()=>{ const el=document.getElementById('addSection'); if(el) el.scrollIntoView({behavior:'smooth'}); },500); },200);
  }
 }
 const tb = document.getElementById('tickerBar');
 if(siteMeta.ticker){ tb.classList.remove('hidden'); document.getElementById('tickerText').textContent = '🔔 '+siteMeta.ticker+'  •  🔔 '+siteMeta.ticker; }
 else tb.classList.add('hidden');
 document.querySelectorAll('.nav-btn').forEach(b=>{
  b.classList.toggle('bg-blue-500', b.dataset.page===currentPage);
  b.classList.toggle('text-white', b.dataset.page===currentPage);
 });
 renderApp();
}

busy(true);
setupRealtimeListeners();
// AUTO-REFRESH backup: har 30 second me silent re-render (realtime ke saath double safety)
setInterval(safeRerender, 30000);

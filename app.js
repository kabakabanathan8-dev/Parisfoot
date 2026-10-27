(() => {
  "use strict";
  const DEMO_MATCHES = [
    {id:"demo-1",day:"today",league:"Ligue de démonstration",time:"18:00",home:"Real Madrid",away:"FC Barcelone",homeCode:"RM",awayCode:"FCB",odds:{home:2.10,draw:3.20,away:2.80}},
    {id:"demo-2",day:"today",league:"Ligue de démonstration",time:"20:30",home:"Arsenal FC",away:"Chelsea FC",homeCode:"ARS",awayCode:"CHE",odds:{home:1.95,draw:3.40,away:3.50}},
    {id:"demo-3",day:"upcoming",league:"Ligue de démonstration",time:"Demain · 16:00",home:"Inter Milan",away:"AC Milan",homeCode:"INT",awayCode:"MIL",odds:{home:2.25,draw:3.10,away:2.95}}
  ];
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  let selected = [];
  let filter = "all";
  let authMode = "signup";
  let supabase = null;
  let currentUser = null;
  const money = n => new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(n) + " FC";
  const safe = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600);}
  function initBackend(){
    const cfg=window.GLOBAL_BET_CONFIG||{};
    if(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase){
      supabase=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      supabase.auth.getSession().then(({data})=>{currentUser=data.session?.user||null;updateAuthUI();loadHistory();});
      supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateAuthUI();loadHistory();});
    }
  }
  function renderMatches(){
    const list=$("#match-list");
    const matches=DEMO_MATCHES.filter(m=>filter==="all"||m.day===filter);
    if(!matches.length){list.innerHTML='<div class="empty-state"><b>Aucun match dans ce filtre</b><p>Choisissez une autre catégorie.</p></div>';return;}
    list.innerHTML=matches.map(m=>`<article class="match-card"><div class="match-time"><b>${m.day==="today"?"AUJOURD'HUI":"À VENIR"}</b><span>${m.time}</span></div><div class="teams"><div class="team"><span class="team-badge">${safe(m.homeCode)}</span>${safe(m.home)}</div><div class="team"><span class="team-badge">${safe(m.awayCode)}</span>${safe(m.away)}</div></div><div class="odds">${[["1","home"],["N","draw"],["2","away"]].map(([label,key])=>{const isSelected=selected.some(p=>p.matchId===m.id&&p.key===key);return `<button class="odd-btn ${isSelected?"selected":""}" data-match="${m.id}" data-key="${key}" aria-pressed="${isSelected}"><small>${label}</small><b>${m.odds[key].toFixed(2)}</b></button>`}).join("")}</div><div class="match-status"><span>⚽</span>DÉMO</div></article>`).join("");
    $$(".odd-btn").forEach(btn=>btn.addEventListener("click",()=>togglePick(btn.dataset.match,btn.dataset.key)));
  }
  function togglePick(matchId,key){
    const m=DEMO_MATCHES.find(x=>x.id===matchId);if(!m)return;
    const existing=selected.findIndex(p=>p.matchId===matchId);
    if(existing>=0 && selected[existing].key===key)selected.splice(existing,1);
    else {if(existing>=0)selected.splice(existing,1);selected.push({matchId,key,home:m.home,away:m.away,label:key==="home"?"1":key==="draw"?"N":"2",odd:m.odds[key]});}
    renderMatches();renderSlip();
  }
  function renderSlip(){
    const holder=$("#slip-items");
    if(!selected.length){holder.innerHTML='<div class="empty-state"><span>＋</span><b>Votre ticket est vide</b><p>Sélectionnez une cote dans la liste des matchs pour commencer.</p></div>';}
    else {holder.innerHTML=selected.map((p,i)=>`<div class="slip-item"><div><b>${safe(p.home)} — ${safe(p.away)}</b><small>Résultat : ${p.label} · Cote fictive</small></div><div style="text-align:right"><strong>${p.odd.toFixed(2)}</strong><button class="remove-pick" data-remove="${i}" aria-label="Retirer la sélection">×</button></div></div>`).join("");$$("[data-remove]").forEach(b=>b.addEventListener("click",()=>{selected.splice(Number(b.dataset.remove),1);renderMatches();renderSlip();}));}
    const stake=Math.max(0,Number($("#stake").value)||0);const combined=selected.reduce((n,p)=>n*p.odd,1);
    $("#potential").textContent=money(selected.length?Math.round(stake*combined):stake);
  }
  async function saveTicket(){
    if(!selected.length){toast("Ajoutez au moins une sélection.");return;}
    if(!currentUser){openAuth("signup");showAuthMessage("Connectez-vous pour enregistrer le ticket.",false);return;}
    if(!supabase){toast("Configurez Supabase pour enregistrer les tickets en ligne.");return;}
    const stake=Math.max(0,Number($("#stake").value)||0);
    if(stake<100){toast("La mise virtuelle minimale est de 100 FC.");return;}
    const payload={user_id:currentUser.id,selections:selected.map(({matchId,home,away,label,odd})=>({match_id:matchId,home,away,selection:label,odds:odd})),stake_virtual:Math.round(stake),potential_virtual:Math.round(stake*selected.reduce((n,p)=>n*p.odd,1)),status:"demo"};
    const {error}=await supabase.from("demo_tickets").insert(payload);
    if(error){console.error(error);toast("Impossible d'enregistrer. Vérifiez le schéma SQL Supabase.");return;}
    selected=[];renderMatches();renderSlip();loadHistory();toast("Ticket de démonstration enregistré.");
  }
  async function loadHistory(){
    const box=$("#ticket-history");
    if(!currentUser){box.innerHTML='<div class="empty-state compact"><p>Connectez-vous pour voir vos tickets enregistrés.</p></div>';return;}
    if(!supabase){box.innerHTML='<div class="empty-state compact"><p>Configurez Supabase pour activer l’historique en ligne.</p></div>';return;}
    const {data,error}=await supabase.from("demo_tickets").select("id,selections,stake_virtual,potential_virtual,status,created_at").order("created_at",{ascending:false}).limit(20);
    if(error){box.innerHTML='<div class="empty-state compact"><p>Historique indisponible. Vérifiez la configuration de la base de données.</p></div>';return;}
    if(!data?.length){box.innerHTML='<div class="empty-state compact"><p>Aucun ticket enregistré pour le moment.</p></div>';return;}
    box.innerHTML=data.map(t=>`<article class="history-card"><div><b>Ticket démo #${safe(t.id.slice(0,8))}</b><small>${(t.selections||[]).length} sélection(s) · ${new Date(t.created_at).toLocaleString("fr-FR")}</small></div><div style="text-align:right"><b>${money(t.stake_virtual)}</b><small>Gain potentiel fictif : ${money(t.potential_virtual)}</small></div></article>`).join("");
  }
  function openAuth(mode){authMode=mode;$("#auth-modal").hidden=false;$("#auth-title").textContent=mode==="signup"?"Créez votre compte":"Connectez-vous";$("#auth-subtitle").textContent=mode==="signup"?"Enregistrez vos tickets de démonstration.":"Retrouvez votre espace personnel.";$("#auth-submit").textContent=mode==="signup"?"Créer mon compte":"Se connecter";$("#auth-password").setAttribute("autocomplete",mode==="signup"?"new-password":"current-password");$("#auth-message").hidden=true;}
  function closeAuth(){$("#auth-modal").hidden=true;$("#auth-form").reset();}
  function showAuthMessage(msg,error){const el=$("#auth-message");el.textContent=msg;el.hidden=false;el.classList.toggle("error",!!error);}
  function updateAuthUI(){
    const login=$("#login-open"),signup=$("#signup-open");
    if(currentUser){login.textContent="Déconnexion";login.onclick=async()=>{if(supabase)await supabase.auth.signOut();};signup.textContent="Mon compte";signup.onclick=()=>{toast(currentUser.email||"Compte connecté");};}
    else{login.textContent="Connexion";login.onclick=()=>openAuth("login");signup.textContent="Créer un compte";signup.onclick=()=>openAuth("signup");}
  }
  async function submitAuth(event){
    event.preventDefault();
    if(!supabase){showAuthMessage("Pour activer les comptes : renseignez l’URL et la clé publique Supabase dans config.js, puis rechargez le site.",true);return;}
    const email=$("#auth-email").value.trim(),password=$("#auth-password").value;
    $("#auth-submit").disabled=true;$("#auth-submit").textContent="Patientez…";
    let result;
    if(authMode==="signup")result=await supabase.auth.signUp({email,password});
    else result=await supabase.auth.signInWithPassword({email,password});
    $("#auth-submit").disabled=false;$("#auth-submit").textContent=authMode==="signup"?"Créer mon compte":"Se connecter";
    if(result.error){showAuthMessage(result.error.message,true);return;}
    if(authMode==="signup"&&!result.data.session){showAuthMessage("Compte créé. Vérifiez votre e-mail si la confirmation est activée.",false);return;}
    currentUser=result.data.user||result.data.session?.user||null;updateAuthUI();loadHistory();showAuthMessage("Connexion réussie.",false);setTimeout(closeAuth,700);
  }
  function init(){
    $("#year").textContent=new Date().getFullYear();
    renderMatches();renderSlip();initBackend();
    $$(".filter").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));renderMatches();}));
    $("#stake").addEventListener("input",renderSlip);$("#clear-slip").addEventListener("click",()=>{selected=[];renderMatches();renderSlip();});
    $("#save-ticket").addEventListener("click",saveTicket);
    $("#login-open").addEventListener("click",()=>openAuth("login"));$("#signup-open").addEventListener("click",()=>openAuth("signup"));
    $("#modal-close").addEventListener("click",closeAuth);$("#auth-modal").addEventListener("click",e=>{if(e.target===$("#auth-modal"))closeAuth();});
    $("#auth-switch").addEventListener("click",()=>openAuth(authMode==="signup"?"login":"signup"));$("#auth-form").addEventListener("submit",submitAuth);
    updateAuthUI();
  }
  document.addEventListener("DOMContentLoaded",init);
})();

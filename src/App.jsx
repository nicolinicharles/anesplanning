import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// Empêche la traduction automatique du navigateur (Google Translate casse le rendu React)
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("translate", "no");
  document.documentElement.classList.add("notranslate");
  if (!document.querySelector('meta[name="google"]')) {
    const m = document.createElement("meta");
    m.name = "google";
    m.content = "notranslate";
    document.head && document.head.appendChild(m);
  }
}

// ── STORAGE PERSISTANT (Supabase) ───────────────────────────────────────────────

const supabase = createClient(
  "https://zfxjdeqbqebgxerhryes.supabase.co",
  "sb_publishable_YAOptWQ8JKIh-YrcFXrhZw_JE5EdH0l"
);

async function storageGet(key) {
  try {
    const { data, error } = await supabase
      .from("app_state")
      .select("data")
      .eq("id", key)
      .maybeSingle();
    if (error) { console.error("Supabase get error", error); return null; }
    return data ? data.data : null;
  } catch (e) { console.error("Storage error", e); return null; }
}
async function storageSet(key, value) {
  try {
    const { error } = await supabase
      .from("app_state")
      .upsert({ id: key, data: value, updated_at: new Date().toISOString() });
    if (error) console.error("Supabase set error", error);
  } catch (e) { console.error("Storage error", e); }
}

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────

const T = {
  bg:"#f0f4ff",
  surface:"#ffffff",
  surfaceUp:"#f8faff",
  border:"#e4e9f5",
  borderStrong:"#c7d2ec",
  teal:"#4f6ef7",
  tealDark:"#3b55e0",
  tealGlow:"rgba(79,110,247,0.10)",
  green:"#00b86b",
  red:"#f03e3e",
  amber:"#f59e0b",
  purple:"#8b5cf6",
  textPrimary:"#141c2f",
  textSecondary:"#4b5675",
  textMuted:"#8c97b2",
};

const MEDECINS = [
  {id:"lydia",    nom:"Lydia",    etp:0.5},
  {id:"oscar",    nom:"Oscar",    etp:1.0},
  {id:"frederic", nom:"Frédéric", etp:1.0},
  {id:"idris",    nom:"Idris",    etp:0.7},
  {id:"charles",  nom:"Charles",  etp:0.7},
  {id:"sophie",   nom:"Sophie",   etp:0.7},
  {id:"rodolphe", nom:"Rodolphe", etp:0.7},
];

const USERS = [
  {id:"admin",    nom:"Admin",    role:"admin",   pw:"admin123"},
  {id:"lydia",    nom:"Lydia",    role:"medecin", pw:"lydia"},
  {id:"oscar",    nom:"Oscar",    role:"medecin", pw:"oscar"},
  {id:"frederic", nom:"Frédéric", role:"medecin", pw:"frederic"},
  {id:"idris",    nom:"Idris",    role:"medecin", pw:"idris"},
  {id:"charles",  nom:"Charles",  role:"medecin", pw:"charles"},
  {id:"sophie",   nom:"Sophie",   role:"medecin", pw:"sophie"},
  {id:"rodolphe", nom:"Rodolphe", role:"medecin", pw:"rodolphe"},
];

const COULEURS = {
  lydia:    {bg:"#eff6ff",text:"#1d4ed8",border:"#bfdbfe"},
  oscar:    {bg:"#f0fdf4",text:"#15803d",border:"#bbf7d0"},
  frederic: {bg:"#fffbeb",text:"#b45309",border:"#fde68a"},
  idris:    {bg:"#faf5ff",text:"#7c3aed",border:"#ddd6fe"},
  charles:  {bg:"#fff1f2",text:"#be123c",border:"#fecdd3"},
  sophie:   {bg:"#fff7ed",text:"#c2410c",border:"#fed7aa"},
  rodolphe: {bg:"#f0fdfa",text:"#0f766e",border:"#99f6e4"},
  remplacant:{bg:"#f5f3ff",text:"#6d28d9",border:"#c4b5fd"},
};

const JOURS = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function getCouleur(id){ return COULEURS[id] || {bg:"#1e2d45",text:"#94a3b8",border:"#334155"}; }

// ── DATES ──────────────────────────────────────────────────────────────────────

function dk(date){ return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0"); }
function dkToDate(key){ const [y,m,d]=key.split("-"); return new Date(Number(y),Number(m)-1,Number(d)); }
function ffr(key){ if(!key)return""; const[y,m,d]=key.split("-"); return d+"/"+m+"/"+y; }
function dureeJ(a,b){ return Math.round((dkToDate(b)-dkToDate(a))/86400000)+1; }

function joursFeries(annee){
  const s=new Set();
  const a=(m,d)=>s.add(annee+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0"));
  a(1,1);a(5,1);a(5,8);a(7,14);a(8,15);a(11,1);a(11,11);a(12,25);
  const A=annee%19,B=Math.floor(annee/100),C=annee%100,D=Math.floor(B/4),E=B%4;
  const F=Math.floor((B+8)/25),G=Math.floor((B-F+1)/3),H=(19*A+B-D-G+15)%30;
  const I=Math.floor(C/4),K=C%4,L=(32+2*E+2*I-H-K)%7,M2=Math.floor((A+11*H+22*L)/451);
  const mo=Math.floor((H+L-7*M2+114)/31),da=((H+L-7*M2+114)%31)+1;
  const p=new Date(annee,mo-1,da);
  const addD=d2=>s.add(dk(d2));
  const lp=new Date(p);lp.setDate(p.getDate()+1);addD(lp);
  const asc=new Date(p);asc.setDate(p.getDate()+39);addD(asc);
  const pe=new Date(p);pe.setDate(p.getDate()+50);addD(pe);
  return s;
}

function tousJours(annee){
  const f=joursFeries(annee),jours=[],d=new Date(annee,0,1);
  while(d.getFullYear()===annee){ const key=dk(d); jours.push({key,js:d.getDay(),ferie:f.has(key)}); d.setDate(d.getDate()+1); }
  return jours;
}

// ── ALGORITHME ─────────────────────────────────────────────────────────────────

function jourFr(js){return["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"][js];}
function numSem(key){
  const d=dkToDate(key);d.setHours(0,0,0,0);d.setDate(d.getDate()+4-(d.getDay()||7));
  const debut=new Date(d.getFullYear(),0,1);return Math.ceil((((d-debut)/86400000)+1)/7);
}
function poids(key,ferie){ const js=dkToDate(key).getDay(); if(ferie)return 3; if([5,6,0].includes(js))return 2; return 1.5; }
function estIndispo(id,key,indispos){ return indispos.some(i=>i.medecinId===id&&key>=i.dateDebut&&key<=i.dateFin); }
function contrainteBloque(id,key,contraintes){ const j=jourFr(dkToDate(key).getDay()); return contraintes.some(c=>c.medecinId===id&&c.type==="jour_interdit"&&c.valeur===j); }
function contrainteMax(id,key,contraintes,gardes){
  const j=jourFr(dkToDate(key).getDay());
  const c=contraintes.find(x=>x.medecinId===id&&x.type==="max_par_mois"&&x.valeur===j);
  if(!c)return true;
  const d=dkToDate(key),mo=d.getMonth(),an=d.getFullYear();
  let n=0;
  for(const[k,v]of Object.entries(gardes)){if(v===id){const dd=dkToDate(k);if(dd.getMonth()===mo&&dd.getFullYear()===an&&jourFr(dd.getDay())===j)n++;}}
  return n<Number(c.max||2);
}
function pg(m){if(m.id==="lydia")return m.etp*1.05;if(m.id==="oscar"||m.id==="frederic")return m.etp*0.90;return m.etp*1.15;}
function pw(m){if(m.id==="lydia")return m.etp*0.95;if(m.id==="oscar"||m.id==="frederic")return m.etp*0.90;return m.etp*1.15;}
function cfn(tot,ms,m,fn){const tp=ms.reduce((s,x)=>s+fn(x),0);return tp>0?tot*fn(m)/tp:0;}
function cWE(m){if(m.id==="lydia"||m.etp<=0.55)return 6;if(m.etp<0.85)return 8;return 10;}
function weBl(m){return m.vd+m.sa;}
function depWE(m){return weBl(m)>=cWE(m)+2;}
function initSt(ms){return ms.map(m=>({...m,u:0,g:0,vd:0,sa:0,sem:0,we:[],fer:0}));}
function addSt(st,id,key,ferie){
  const m=st.find(x=>x.id===id);if(!m)return;
  const js=dkToDate(key).getDay();
  m.g++;m.u+=poids(key,ferie);
  if(ferie)m.fer++;
  if(js===5)m.vd++;if(js===6)m.sa++;if(js>=1&&js<=4)m.sem++;
  if([5,6,0].includes(js))m.we.push(numSem(key));
}
function remSt(st,id,key,ferie){
  const m=st.find(x=>x.id===id);if(!m)return;
  const js=dkToDate(key).getDay();
  m.g--;m.u-=poids(key,ferie);
  if(ferie)m.fer--;
  if(js===5)m.vd--;if(js===6)m.sa--;if(js>=1&&js<=4)m.sem--;
  if([5,6,0].includes(js)){const s=numSem(key);const i=m.we.indexOf(s);if(i>=0)m.we.splice(i,1);}
}
function bonus(m,st,ua){
  const tu=st.reduce((s,x)=>s+x.u,0)+ua,te=st.reduce((s,x)=>s+x.etp,0);
  if(te<=0)return 0;const cu=tu*m.etp/te,ec=cu-m.u;
  let b=ec*1200;
  if(ec>30)b+=150000;else if(ec>20)b+=100000;else if(ec>10)b+=50000;else if(ec>5)b+=15000;
  if(ec<-30)b-=150000;else if(ec<-20)b-=100000;else if(ec<-10)b-=50000;else if(ec<-5)b-=15000;
  return b;
}
// Détecte si une garde existante viole une contrainte
function gardeViolee(medecinId, key, contraintes, gardes){
  if(contrainteBloque(medecinId, key, contraintes)) return "Jour interdit";
  if(!contrainteMax(medecinId, key, contraintes, gardes)){
    const j=jourFr(dkToDate(key).getDay());
    return "Max "+j+" dépassé";
  }
  return null;
}

function candOk(m,key,indispos,contraintes,gardes,interdit){
  if(interdit.includes(m.id))return false;
  // Jour déjà pris par un remplaçant
  if(gardes[key]&&gardes[key].startsWith&&gardes[key].startsWith("remp_"))return false;
  if(estIndispo(m.id,key,indispos))return false;
  if(contrainteBloque(m.id,key,contraintes))return false;
  if(!contrainteMax(m.id,key,contraintes,gardes))return false;
  const d=dkToDate(key);
  // Pas de garde consécutive (veille/lendemain)
  const v=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()-1));
  const l=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()+1));
  if(gardes[v]===m.id)return false;
  if(gardes[l]===m.id)return false;
  // Max 2 gardes par semaine calendaire (lundi-dimanche)
  const jourSem=d.getDay()===0?6:d.getDay()-1; // 0=lundi, 6=dimanche
  const debutSem=new Date(d);debutSem.setDate(d.getDate()-jourSem);
  let gardesSemaine=0;
  for(let i=0;i<7;i++){
    const ks=dk(new Date(debutSem.getFullYear(),debutSem.getMonth(),debutSem.getDate()+i));
    if(ks!==key&&gardes[ks]===m.id)gardesSemaine++;
  }
  if(gardesSemaine>=2)return false;
  // Pas 3 gardes en 5 jours (fenêtre glissante -4j à +4j)
  let gardes5j=0;
  for(let i=-4;i<=4;i++){
    if(i===0)continue;
    const kw=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()+i));
    if(gardes[kw]===m.id)gardes5j++;
  }
  if(gardes5j>=2)return false;
  // Pas jeudi + samedi (ou samedi + jeudi) : empiète sur le weekend
  const js=d.getDay();
  if(js===4){ // jeudi → vérifier samedi +2j
    const samK=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()+2));
    if(gardes[samK]===m.id)return false;
  }
  if(js===6){ // samedi → vérifier jeudi -2j
    const jeuK=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()-2));
    if(gardes[jeuK]===m.id)return false;
  }
  // Éviter semaine pleine avant/après un pack ven+dim
  // Si vendredi : vérifier que le médecin n'a pas >=3 gardes dans les 7 jours qui suivent
  if(js===5){
    let gardesApres=0;
    for(let i=1;i<=7;i++){
      const ka=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()+i));
      if(gardes[ka]===m.id)gardesApres++;
    }
    if(gardesApres>=3)return false;
    // Et pas >=3 gardes dans les 7 jours précédents
    let gardesAvant=0;
    for(let i=1;i<=7;i++){
      const kb=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()-i));
      if(gardes[kb]===m.id)gardesAvant++;
    }
    if(gardesAvant>=3)return false;
  }
  return true;
}
function sWE(m,key,st,ferie){
  const tv=st.reduce((s,x)=>s+x.vd,0)+1;
  let sc=bonus(m,st,4);sc+=(cWE(m)-weBl(m))*120;sc+=(cfn(tv,st,m,pw)-m.vd)*20;
  if(ferie){
    const totalFer=st.reduce((s,x)=>s+x.fer,0)+1;
    const te=st.reduce((s,x)=>s+x.etp,0);
    const cibleFer=te>0?totalFer*m.etp/te:0;
    sc-=(m.fer-cibleFer)*5000;
    if(m.fer>0)sc-=8000;
  }
  if(m.id==="lydia"||m.etp<=0.55){if(m.vd<2)sc+=20000;if(m.vd>=3)sc-=15000;if(m.vd>=4)sc-=50000;}
  if(m.etp<0.85&&m.etp>0.55&&m.id!=="lydia"){if(m.vd<3)sc+=18000;if(m.vd>=5)sc-=18000;}
  if(m.etp>=1){if(m.vd<5)sc+=18000;if(m.vd>=7)sc-=15000;}
  const s=numSem(key);if(m.we.some(w=>Math.abs(w-s)===0))sc-=100;if(m.we.some(w=>Math.abs(w-s)===1))sc-=55;
  // Pénalité forte si semaine pleine (5 gardes sem) avant ou après ce WE
  // Vérifier si le médecin a déjà des gardes en semaine cette semaine-là
  const d2=dkToDate(key);
  // Semaine précédente : lun-ven
  let gardesSemPrev=0,gardesSemSuiv=0;
  for(let i=1;i<=5;i++){
    const prev=dk(new Date(d2.getFullYear(),d2.getMonth(),d2.getDate()-i));
    const suiv=dk(new Date(d2.getFullYear(),d2.getMonth(),d2.getDate()+i));
    // gardes est accessible via closure dans genererGardes
    // On utilise m.sem (gardes de semaine déjà comptées) comme proxy
  }
  // Pénalité basée sur le nb de gardes de semaine récentes (approximation)
  if(m.sem>0&&m.we.some(w=>w===s-1||w===s+1))sc-=8000;
  return sc+Math.random();
}
function sSam(m,key,st){
  const ts=st.reduce((s,x)=>s+x.sa,0)+1;let sc=bonus(m,st,2);
  const minS=Math.min(...st.map(x=>x.sa));sc+=(ts/st.length-m.sa)*360;
  if(m.sa>minS+1)sc-=10000;if(m.sa>minS+2)sc-=80000;if(m.sa<=minS)sc+=6000;
  const s=numSem(key);if(m.we.some(w=>Math.abs(w-s)===0))sc-=100;if(m.we.some(w=>Math.abs(w-s)===1))sc-=55;
  // Pénalité forte si semaine pleine (5 gardes sem) avant ou après ce WE
  // Vérifier si le médecin a déjà des gardes en semaine cette semaine-là
  const d2=dkToDate(key);
  // Semaine précédente : lun-ven
  let gardesSemPrev=0,gardesSemSuiv=0;
  for(let i=1;i<=5;i++){
    const prev=dk(new Date(d2.getFullYear(),d2.getMonth(),d2.getDate()-i));
    const suiv=dk(new Date(d2.getFullYear(),d2.getMonth(),d2.getDate()+i));
    // gardes est accessible via closure dans genererGardes
    // On utilise m.sem (gardes de semaine déjà comptées) comme proxy
  }
  // Pénalité basée sur le nb de gardes de semaine récentes (approximation)
  if(m.sem>0&&m.we.some(w=>w===s-1||w===s+1))sc-=8000;
  return sc+Math.random();
}
function sSem(m,key,ferie,st){
  const tg=st.reduce((s,x)=>s+x.g,0)+1;let sc=bonus(m,st,poids(key,ferie));
  sc+=(cfn(tg,st,m,pg)-m.g)*42;
  const tu=st.reduce((s,x)=>s+x.u,0)+poids(key,ferie),te=st.reduce((s,x)=>s+x.etp,0);
  sc+=(te>0?tu*m.etp/te:0-m.u)*0.60;
  // Pénalité forte si déjà des fériés — équilibrage spécifique
  if(ferie){
    const totalFer=st.reduce((s,x)=>s+x.fer,0)+1;
    const cibleFer=te>0?totalFer*m.etp/te:0;
    const ecartFer=m.fer-cibleFer;
    sc-=ecartFer*5000; // Fort pour équilibrer les fériés
    if(m.fer>0)sc-=8000; // Pénalité supplémentaire si déjà eu un férié
  }
  return sc+Math.random();
}

function genererGardes(medecins,indispos,contraintes,debutKey,finKey,annee,gardesInitiales={}){
  const ja=tousJours(annee);
  const jours=ja.filter(j=>j.key>=debutKey&&j.key<=finKey);
  // Partir avec les gardes initiales (remplaçants pré-placés)
  const gardes={...gardesInitiales},st=initSt(medecins);
  for(let i=0;i<jours.length;i++){
    const j=jours[i];if(j.js!==5)continue;
    const sam=jours[i+1],dim=jours[i+2];if(!sam||!dim)continue;
    // Pack Ven+Dim si les deux sont libres
    if(!gardes[j.key]&&!gardes[dim.key]){
      let cands=st.filter(m=>candOk(m,j.key,indispos,contraintes,gardes,[])&&candOk(m,dim.key,indispos,contraintes,gardes,[]));
      let sq=cands.filter(m=>!depWE(m));if(sq.length>0)cands=sq;
      if(cands.length>0){cands.sort((a,b)=>sWE(b,j.key,st,j.ferie)-sWE(a,j.key,st,j.ferie));const c=cands[0];gardes[j.key]=c.id;gardes[dim.key]=c.id;addSt(st,c.id,j.key,j.ferie);addSt(st,c.id,dim.key,dim.ferie);}
    }
    // Si vendredi pris (remplaçant) mais dimanche libre -> attribuer dimanche seul
    else if(gardes[j.key]&&gardes[j.key].startsWith&&gardes[j.key].startsWith("remp_")&&!gardes[dim.key]){
      let cands=st.filter(m=>candOk(m,dim.key,indispos,contraintes,gardes,[]));
      let sq=cands.filter(m=>!depWE(m));if(sq.length>0)cands=sq;
      if(cands.length>0){cands.sort((a,b)=>sSam(b,dim.key,st)-sSam(a,dim.key,st));const c=cands[0];gardes[dim.key]=c.id;addSt(st,c.id,dim.key,dim.ferie);}
    }
    // Si dimanche pris (remplaçant) mais vendredi libre -> attribuer vendredi seul
    else if(!gardes[j.key]&&gardes[dim.key]&&gardes[dim.key].startsWith&&gardes[dim.key].startsWith("remp_")){
      let cands=st.filter(m=>candOk(m,j.key,indispos,contraintes,gardes,[]));
      let sq=cands.filter(m=>!depWE(m));if(sq.length>0)cands=sq;
      if(cands.length>0){cands.sort((a,b)=>sWE(b,j.key,st,j.ferie)-sWE(a,j.key,st,j.ferie));const c=cands[0];gardes[j.key]=c.id;addSt(st,c.id,j.key,j.ferie);}
    }
    if(!gardes[sam.key]){
      const interdit=[gardes[j.key],gardes[dim.key]].filter(Boolean);
      let cands=st.filter(m=>candOk(m,sam.key,indispos,contraintes,gardes,interdit));
      let sq=cands.filter(m=>!depWE(m));if(sq.length>0)cands=sq;
      if(cands.length>0){cands.sort((a,b)=>sSam(b,sam.key,st)-sSam(a,sam.key,st));const c=cands[0];gardes[sam.key]=c.id;addSt(st,c.id,sam.key,sam.ferie);}
    }
  }
  for(let i=0;i<jours.length;i++){
    const j=jours[i];if(![1,2,3,4].includes(j.js)||gardes[j.key])continue;
    let cands=st.filter(m=>candOk(m,j.key,indispos,contraintes,gardes,[]));
    if(cands.length>0){cands.sort((a,b)=>sSem(b,j.key,j.ferie,st)-sSem(a,j.key,j.ferie,st));const c=cands[0];gardes[j.key]=c.id;addSt(st,c.id,j.key,j.ferie);}
  }
  const kj=[...jours.filter(j=>[1,2,3,4].includes(j.js)).map(j=>j.key)];
  for(let tour=0;tour<800;tour++){
    const tg=st.reduce((s,m)=>s+m.g,0);
    const ecs=st.map(m=>({m,e:m.g-cfn(tg,st,m,pg)}));
    const sur=ecs.slice().sort((a,b)=>b.e-a.e)[0],man=ecs.slice().sort((a,b)=>a.e-b.e)[0];
    if(!sur||!man||sur.e<0.25||man.e>-0.25)break;
    let fait=false;
    for(const key of kj){
      if(gardes[key]!==sur.m.id)continue;
      const old=gardes[key];delete gardes[key];
      if(candOk(man.m,key,indispos,contraintes,gardes,[])){
        const ferie=ja.find(j=>j.key===key)?.ferie||false;
        remSt(st,sur.m.id,key,ferie);gardes[key]=man.m.id;addSt(st,man.m.id,key,ferie);fait=true;break;
      }else{gardes[key]=old;}
    }
    if(!fait)break;
  }
  const stats=medecins.map(m=>{const s=st.find(x=>x.id===m.id);return{...m,unites:s.u,gardes:s.g,vendDim:s.vd,samedi:s.sa,semaine:s.sem};});
  // Jours sans garde dans la période
  const gardesManquantes=[];
  for(const j of jours){
    if(!gardes[j.key]) gardesManquantes.push(j.key);
  }
  return{gardes,stats,gardesManquantes};
}

// ── ALGORITHME CS / BO (V18) ──────────────────────────────────────────────────

function genererCSBO(medecins, gardes, bos, indispos, contraintes, csbo, besoins, debutKey, finKey, annee) {
  const ja = tousJours(annee);
  const jours = ja.filter(j => j.key >= debutKey && j.key <= finKey && ![0,6].includes(j.js));

  // Cloner csbo existant (gardes manuelles conservées)
  const result = {};
  for (const [k, v] of Object.entries(csbo)) {
    if (k >= debutKey && k <= finKey) result[k] = {...v};
  }

  // Stats par médecin
  const st = medecins.map(m => ({
    ...m, u: 0, cs: 0, bo: 0, cibleCS: 0, cibleBO: 0, cible: 0
  }));

  // Calculer unités déjà acquises via gardes
  for (const j of ja) {
    const g = gardes[j.key];
    if (!g || g.startsWith('remp_')) continue;
    const m = st.find(x => x.id === g);
    if (m) m.u += poids(j.key, j.ferie);
    // BO remplaçant déjà compté séparément
  }

  // Compter CS/BO déjà fixés manuellement
  for (const [key, v] of Object.entries(result)) {
    ['cs1','cs2'].forEach(p => { if (v[p]) { const m = st.find(x => x.id === v[p]); if (m) { m.u += 1; m.cs += 1; } } });
    ['bo1','bo2','bo3'].forEach(p => { if (v[p]) { const m = st.find(x => x.id === v[p]); if (m) { m.u += 1; m.bo += 1; } } });
  }

  // Besoin par défaut selon le jour
  function getBesoin(key, ferie, js) {
    const override = besoins[key] || {};
    const estSemaine = [1,2,3,4,5].includes(js) && !ferie;
    return {
      cs1: override.cs1 !== undefined ? override.cs1 : (estSemaine ? 1 : 0),
      cs2: override.cs2 !== undefined ? override.cs2 : 0,
      bo1: override.bo1 !== undefined ? override.bo1 : (estSemaine ? 1 : 0),
      bo2: override.bo2 !== undefined ? override.bo2 : (estSemaine ? 1 : 0),
      bo3: override.bo3 !== undefined ? override.bo3 : 0,
    };
  }

  // Postes à remplir selon les besoins
  const postesCS = [], postesBO = [];
  for (const j of jours) {
    const fixe = result[j.key] || {};
    const b = getBesoin(j.key, j.ferie, j.js);
    if (b.cs1 && !fixe.cs1) postesCS.push({ key: j.key, slot: 'cs1', ferie: j.ferie });
    if (b.cs2 && !fixe.cs2) postesCS.push({ key: j.key, slot: 'cs2', ferie: j.ferie });
    // Slots BO demandés ce jour
    const slotsBO = [];
    if (b.bo1 && !fixe.bo1) slotsBO.push('bo1');
    if (b.bo2 && !fixe.bo2) slotsBO.push('bo2');
    if (b.bo3 && !fixe.bo3) slotsBO.push('bo3');
    // Un remplaçant en journée (bos) occupe un poste BO → on en retire autant
    const rempBO = bos[j.key] ? 1 : 0;
    const slotsBORestants = slotsBO.slice(rempBO);
    for (const slot of slotsBORestants) postesBO.push({ key: j.key, slot, ferie: j.ferie });
  }

  const totalCS = postesCS.length, totalBO = postesBO.length;
  const totalEtp = medecins.reduce((s, m) => s + m.etp, 0);
  const totalU = st.reduce((s, m) => s + m.u, 0) + totalCS + totalBO;

  st.forEach(m => {
    m.cible = totalEtp > 0 ? totalU * m.etp / totalEtp : 0;
    m.cibleCS = totalEtp > 0 ? totalCS * m.etp / totalEtp : 0;
    m.cibleBO = totalEtp > 0 ? totalBO * m.etp / totalEtp : 0;
  });

  // Vérifie si un médecin peut faire un poste ce jour
  function peutFaire(m, key, currentResult) {
    const result2 = currentResult || result;
    if (estIndispo(m.id, key, indispos)) return false;
    if (contrainteBloque(m.id, key, contraintes)) return false;
    // Pas de CS/BO si garde ce jour (y compris PONCTUEL)
    const g2=gardes[key];
    const gr2=g2&&g2.startsWith("PONCTUEL:")?g2.split(":")[1]:g2;
    if (gr2 === m.id) return false;
    // Pas de CS/BO si déjà un CS/BO ce jour dans result
    const deja=result2[key]||{};
    if(deja.cs1===m.id||deja.cs2===m.id||deja.bo1===m.id||deja.bo2===m.id||deja.bo3===m.id) return false;
    // Pas de CS/BO le lendemain d'une garde
    const d = dkToDate(key);
    const veille = dk(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
    if (gardes[veille] === m.id) return false;
    // Si pack ven+dim cette semaine → max 2 CS/BO sur la semaine
    const jourSem = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=lun
    const debutSem = new Date(d); debutSem.setDate(d.getDate() - jourSem);
    // Chercher si ven+dim de garde cette semaine
    const venK = dk(new Date(debutSem.getFullYear(), debutSem.getMonth(), debutSem.getDate() + 4));
    const dimK = dk(new Date(debutSem.getFullYear(), debutSem.getMonth(), debutSem.getDate() + 6));
    const aPackWE = gardes[venK] === m.id && gardes[dimK] === m.id;
    if (aPackWE) {
      // Compter CS/BO déjà placés cette semaine
      let nbSem = 0;
      for (let i = 0; i < 7; i++) {
        const ks = dk(new Date(debutSem.getFullYear(), debutSem.getMonth(), debutSem.getDate() + i));
        if (ks === key) continue;
        const vs = result2[ks] || {};
        if (vs.cs1 === m.id || vs.cs2 === m.id || vs.bo1 === m.id || vs.bo2 === m.id || vs.bo3 === m.id) nbSem++;
      }
      if (nbSem >= 2) return false; // Max 2 CS/BO la semaine du pack ven+dim
    }
    // Même règle pour la semaine précédente si dim était en début de semaine
    const dimPrecK = dk(new Date(d.getFullYear(), d.getMonth(), d.getDate() - jourSem - 1));
    const venPrecK = dk(new Date(d.getFullYear(), d.getMonth(), d.getDate() - jourSem - 3));
    const aPackWEPrec = gardes[venPrecK] === m.id && gardes[dimPrecK] === m.id;
    if (aPackWEPrec) {
      let nbSemPrec = 0;
      for (let i = 0; i < 7; i++) {
        const ks = dk(new Date(debutSem.getFullYear(), debutSem.getMonth(), debutSem.getDate() + i));
        if (ks === key) continue;
        const vs = result2[ks] || {};
        if (vs.cs1 === m.id || vs.cs2 === m.id || vs.bo1 === m.id || vs.bo2 === m.id || vs.bo3 === m.id) nbSemPrec++;
      }
      if (nbSemPrec >= 2) return false;
    }
    return true;
  }

  function dejaAffecteJour(m, key, res) {
    const v = res[key] || {};
    return ['cs1','cs2','bo1','bo2','bo3'].some(p => v[p] === m.id);
  }

  function scoreCS(m) {
    const manqueCS = m.cibleCS - m.cs;
    const deficit = m.cible - m.u;
    let sc = manqueCS * 2500 - m.cs * 120 + deficit * 5;
    if ((m.id === 'oscar' || m.id === 'frederic') && m.cs > m.cibleCS + 2) sc -= 5000;
    return sc + Math.random();
  }

  function scoreBO(m) {
    const deficit = m.cible - m.u;
    const manqueBO = m.cibleBO - m.bo;
    let sc = deficit * 1800 + manqueBO * 40;
    if (m.id === 'oscar' && deficit > 5) sc += 12000;
    if (m.id === 'frederic' && deficit > 5) sc += 5000;
    if (deficit <= 0) sc -= 30000;
    return sc + Math.random();
  }

  // Mélanger pour randomiser
  const shuffle = arr => { for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };

  // Trier par nombre de candidats (les plus contraints d'abord)
  const sortByConstraint = postes => postes.slice().sort((a, b) => {
    const ca = medecins.filter(m => peutFaire(m, a.key) && !dejaAffecteJour(m, a.key, result)).length;
    const cb = medecins.filter(m => peutFaire(m, b.key) && !dejaAffecteJour(m, b.key, result)).length;
    return ca - cb;
  });

  let meilleurResult = null, meilleurScore = Infinity, meilleurNonRemplis = 9999;

  for (let essai = 0; essai < 80; essai++) {
    const stLocal = st.map(m => ({...m}));
    const resLocal = {};
    for (const [k, v] of Object.entries(result)) resLocal[k] = {...v};
    let nonRemplis = 0;

    // 1) CS d'abord
    for (const poste of sortByConstraint(shuffle(postesCS.slice()))) {
      const cands = stLocal.filter(m => peutFaire(m, poste.key, resLocal) && !dejaAffecteJour(m, poste.key, resLocal));
      if (cands.length === 0) { nonRemplis++; continue; }
      cands.sort((a, b) => scoreCS(b) - scoreCS(a));
      const c = cands[0];
      if (!resLocal[poste.key]) resLocal[poste.key] = {};
      resLocal[poste.key][poste.slot] = c.id;
      c.u += 1; c.cs += 1;
    }

    // 2) BO ensuite
    for (const poste of sortByConstraint(shuffle(postesBO.slice()))) {
      const cands = stLocal.filter(m => peutFaire(m, poste.key, resLocal) && !dejaAffecteJour(m, poste.key, resLocal));
      if (cands.length === 0) { nonRemplis++; continue; }
      cands.sort((a, b) => scoreBO(b) - scoreBO(a));
      const c = cands[0];
      if (!resLocal[poste.key]) resLocal[poste.key] = {};
      resLocal[poste.key][poste.slot] = c.id;
      c.u += 1; c.bo += 1;
    }

    // 3) Optimisation CS
    for (let tour = 0; tour < 200; tour++) {
      const trop = stLocal.slice().sort((a,b) => (b.cs-b.cibleCS)-(a.cs-a.cibleCS))[0];
      const manque = stLocal.slice().sort((a,b) => (a.cs-a.cibleCS)-(b.cs-b.cibleCS))[0];
      if (!trop||!manque||(trop.cs-trop.cibleCS)<0.8||(manque.cibleCS-manque.cs)<0.8) break;
      let fait = false;
      for (const poste of postesCS) {
        const v = resLocal[poste.key]||{};
        if (v[poste.slot] !== trop.id) continue;
        delete v[poste.slot]; trop.cs--; trop.u--;
        if (peutFaire(manque, poste.key, resLocal) && !dejaAffecteJour(manque, poste.key, resLocal)) {
          v[poste.slot] = manque.id; manque.cs++; manque.u++; fait = true; break;
        } else { v[poste.slot] = trop.id; trop.cs++; trop.u++; }
      }
      if (!fait) break;
    }

    // 4) Optimisation BO
    for (let tour = 0; tour < 200; tour++) {
      const trop = stLocal.slice().sort((a,b) => (b.u-b.cible)-(a.u-a.cible))[0];
      const manque = stLocal.slice().sort((a,b) => (a.u-a.cible)-(b.u-b.cible))[0];
      if (!trop||!manque||(trop.u-trop.cible)<0.8||(manque.cible-manque.u)<0.8) break;
      let fait = false;
      for (const poste of postesBO) {
        const v = resLocal[poste.key]||{};
        if (v[poste.slot] !== trop.id) continue;
        delete v[poste.slot]; trop.bo--; trop.u--;
        if (peutFaire(manque, poste.key, resLocal) && !dejaAffecteJour(manque, poste.key, resLocal)) {
          v[poste.slot] = manque.id; manque.bo++; manque.u++; fait = true; break;
        } else { v[poste.slot] = trop.id; trop.bo++; trop.u++; }
      }
      if (!fait) break;
    }

    const score = stLocal.reduce((s,m) => {
      const eu=m.u-m.cible, ecs=m.cs-m.cibleCS, ebo=m.bo-m.cibleBO;
      return s + eu*eu*25 + ecs*ecs*220 + ebo*ebo*5;
    }, 0) + nonRemplis * 1000000;

    if (score < meilleurScore) {
      meilleurScore = score; meilleurResult = resLocal;
      meilleurNonRemplis = nonRemplis;
    }
  }

  // Recalculer les _manque dans meilleurResult après optimisations
  if(meilleurResult){
    for(const poste of [...postesCS,...postesBO]){
      const v=meilleurResult[poste.key]||{};
      if(!v[poste.slot]){
        if(!meilleurResult[poste.key])meilleurResult[poste.key]={};
        if(!meilleurResult[poste.key]._manque)meilleurResult[poste.key]._manque=[];
        if(!meilleurResult[poste.key]._manque.includes(poste.slot))
          meilleurResult[poste.key]._manque.push(poste.slot);
      }
    }
  }

  // Stats finales incluant CS/BO
  const statsFinales = medecins.map(m => {
    let u = 0, cs = 0, bo = 0;
    for (const j of ja) {
      const g = gardes[j.key];
      if (g === m.id) u += poids(j.key, j.ferie);
      const v = (meilleurResult||{})[j.key] || {};
      if (v.cs1===m.id||v.cs2===m.id) { u+=1; cs++; }
      if (v.bo1===m.id||v.bo2===m.id||v.bo3===m.id) { u+=1; bo++; }
    }
    const s = st.find(x=>x.id===m.id);
    return { ...m, unites:u, gardes:s?.g||0, vendDim:s?.vd||0, samedi:s?.sa||0, semaine:s?.sem||0, cs, bo };
  });

  return { csbo: meilleurResult || result, stats: statsFinales, nonRemplis: meilleurNonRemplis };
}


// ── COMPOSANTS DE BASE ─────────────────────────────────────────────────────────

function Badge({medecinId,remplacants=[]}){
  if(!medecinId)return <span style={{color:T.textMuted,fontSize:11}}>—</span>;
  const m=MEDECINS.find(x=>x.id===medecinId)||remplacants.find(x=>x.id===medecinId);
  const c=getCouleur(medecinId);
  return <span style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{m?m.nom:medecinId}</span>;
}

function Btn({children,onClick,variant="primary",disabled,small,full}){
  const bg={primary:"linear-gradient(135deg,#4f6ef7,#7c3aed)",ghost:"transparent",danger:"rgba(240,62,62,0.08)",success:"rgba(0,184,107,0.08)",warn:"rgba(245,158,11,0.08)"};
  const cl={primary:"#fff",ghost:T.textSecondary,danger:"#f03e3e",success:"#00b86b",warn:T.amber};
  const bd={primary:"none",ghost:"1px solid "+T.border,danger:"1px solid rgba(240,62,62,0.25)",success:"1px solid rgba(0,184,107,0.25)",warn:"1px solid rgba(245,158,11,0.25)"};
  return <button onClick={onClick} disabled={disabled} style={{background:disabled?"#e8ecf8":bg[variant]||bg.primary,color:disabled?T.textMuted:cl[variant]||cl.primary,border:bd[variant]||bd.primary,padding:small?"6px 12px":full?"14px":"9px 16px",borderRadius:10,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontSize:small?11:14,opacity:disabled?0.6:1,width:full?"100%":"auto",whiteSpace:"nowrap"}}>{children}</button>;
}

function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{background:"#fff",borderRadius:14,border:"1px solid "+T.border,padding:16,cursor:onClick?"pointer":"default",boxShadow:"0 1px 4px rgba(79,110,247,0.06)",...style}}>{children}</div>;
}

function SectionTitle({children}){
  return <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,marginTop:4}}>{children}</div>;
}

function Toast({message,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const cl={success:T.green,error:T.red,info:T.teal};
  const bg=cl[type]||T.green;
  return <div style={{position:"fixed",bottom:90,left:16,right:16,background:"#fff",border:"1px solid "+bg,borderLeft:"4px solid "+bg,color:T.textPrimary,borderRadius:12,padding:"14px 16px",fontWeight:600,zIndex:9999,boxShadow:"0 8px 32px rgba(79,110,247,0.15)",fontSize:14,display:"flex",alignItems:"center",gap:10}}>
    <span style={{color:bg,fontSize:18,flexShrink:0}}>{type==="success"?"✓":type==="error"?"✕":"ℹ"}</span>{message}
  </div>;
}

function LoadingScreen(){
  return <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#f0f4ff,#f5f0ff)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
    <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(79,110,247,0.3)"}}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    </div>
    <div style={{fontSize:14,color:T.textSecondary,fontWeight:600}}>Chargement des données...</div>
  </div>;
}

// ── ICÔNES ─────────────────────────────────────────────────────────────────────

const IcoCalendar=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoGrid=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IcoScale=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 9l9-6 9 6"/><path d="M3 15h18"/></svg>;
const IcoSlash=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IcoSettings=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>;
const IcoEchange=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>;
const IcoBesoins=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IcoRemp=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoUser=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

// ── LOGIN ───────────────────────────────────────────────────────────────────────

function LoginView({onLogin}){
  const [uid,setUid]=useState("");
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const go=()=>{
    setLoading(true);
    setTimeout(()=>{
      const u=USERS.find(x=>x.id===uid&&x.pw===pw);
      if(u)onLogin(u);else{setErr("Identifiant ou mot de passe incorrect.");setLoading(false);}
    },400);
  };
  const inp={width:"100%",padding:"13px 14px",background:"#f8faff",border:"1.5px solid "+T.border,borderRadius:12,fontSize:15,color:T.textPrimary,boxSizing:"border-box",outline:"none",marginBottom:14,transition:"border-color 0.15s"};
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(145deg,rgba(30,40,100,0.75),rgba(80,20,130,0.80)),url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80') center/cover no-repeat",padding:"52px 24px 36px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}}/>
        <div style={{position:"absolute",bottom:-30,left:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        <div style={{width:68,height:68,borderRadius:20,background:"rgba(255,255,255,0.2)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <h1 style={{fontSize:30,fontWeight:800,color:"#fff",margin:"0 0 6px",letterSpacing:"-0.02em"}}>AnesPlanning</h1>
        <p style={{color:"rgba(255,255,255,0.75)",fontSize:13,fontWeight:500,margin:"0 0 28px"}}>Hôpital Privé d'Ambérieu</p>

      </div>
      <div style={{flex:1,padding:"28px 24px 40px"}}>
        <h2 style={{fontSize:20,fontWeight:800,color:T.textPrimary,margin:"0 0 4px"}}>Connexion</h2>
        <p style={{color:T.textSecondary,fontSize:13,margin:"0 0 24px"}}>Accédez à votre espace de planification</p>
        <label style={{fontSize:11,fontWeight:700,color:T.textSecondary,display:"block",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"}}>Identifiant</label>
        <select value={uid} onChange={e=>setUid(e.target.value)} style={{...inp}}>
          <option value="" style={{background:T.surfaceUp}}>— Sélectionner —</option>
          {USERS.map(u=><option key={u.id} value={u.id} style={{background:T.surfaceUp}}>{u.nom}</option>)}
        </select>
        <label style={{fontSize:11,fontWeight:700,color:T.textSecondary,display:"block",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"}}>Mot de passe</label>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••" style={{...inp,marginBottom:err?8:20}}/>
        {err&&<p style={{color:T.red,fontSize:13,margin:"0 0 16px"}}>{err}</p>}
        <Btn onClick={go} disabled={loading||!uid||!pw} full>{loading?"Connexion...":"Se connecter →"}</Btn>
        <p style={{marginTop:20,fontSize:11,color:T.textMuted,textAlign:"center"}}>Mot de passe = identifiant · Admin : admin / admin123</p>
      </div>
    </div>
  );
}

// ── TOPBAR ─────────────────────────────────────────────────────────────────────

function TopBar({user,tab,annee,setAnnee,onMenu}){
  const titles={periodes:"Périodes",planning:"Planning",equite:"Équité",indispos:"Indisponibilités",contraintes:"Contraintes",monplanning:"Mon planning",remplacants:"Remplaçants"};
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"#fff",borderBottom:"1px solid "+T.border,height:58,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",boxShadow:"0 2px 12px rgba(79,110,247,0.08)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(79,110,247,0.3)"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:T.textPrimary,lineHeight:1.1}}>AnesPlanning</div>
          <div style={{fontSize:10,color:T.teal,fontWeight:600}}>{titles[tab]||""}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:2,background:T.surfaceUp,border:"1px solid "+T.border,borderRadius:9,padding:"3px 6px"}}>
          <button onClick={()=>setAnnee(a=>a-1)} style={{background:"none",border:"none",color:T.textSecondary,cursor:"pointer",fontSize:16,fontWeight:700,padding:"2px 4px",lineHeight:1}}>‹</button>
          <span style={{fontWeight:800,fontSize:13,color:T.teal,minWidth:30,textAlign:"center"}}>{annee}</span>
          <button onClick={()=>setAnnee(a=>a+1)} style={{background:"none",border:"none",color:T.textSecondary,cursor:"pointer",fontSize:16,fontWeight:700,padding:"2px 4px",lineHeight:1}}>›</button>
        </div>
        <button onClick={onMenu} style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",border:"none",cursor:"pointer",fontWeight:800,fontSize:15,color:"#fff",flexShrink:0}}>{user.nom[0]}</button>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ─────────────────────────────────────────────────────────────────

function BottomNav({tab,setTab,isAdmin,nbDemandes}){
  const items=isAdmin
    ?[{id:"periodes",icon:<IcoCalendar/>,label:"Périodes"},{id:"planning",icon:<IcoGrid/>,label:"Planning"},{id:"equite",icon:<IcoScale/>,label:"Équité"},{id:"besoins",icon:<IcoBesoins/>,label:"Besoins"},{id:"indispos",icon:<IcoSlash/>,label:"Indispos"},{id:"remplacants",icon:<IcoRemp/>,label:"Remplas"},{id:"echanges",icon:<IcoEchange/>,label:"Échanges"},{id:"contraintes",icon:<IcoSettings/>,label:"Réglages"}]
    :[{id:"monplanning",icon:<IcoUser/>,label:"Mon planning"},{id:"planning",icon:<IcoGrid/>,label:"Planning"},{id:"equite",icon:<IcoScale/>,label:"Équité"},{id:"besoins",icon:<IcoBesoins/>,label:"Besoins"},{id:"indispos",icon:<IcoSlash/>,label:"Indispos"},{id:"echanges",icon:<IcoEchange/>,label:"Échanges"},{id:"contraintes",icon:<IcoSettings/>,label:"Réglages"}];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"#fff",borderTop:"1px solid "+T.border,display:"flex",paddingBottom:"env(safe-area-inset-bottom,16px)",boxShadow:"0 -4px 20px rgba(79,110,247,0.08)"}}>
      {items.map(item=>{
        const active=tab===item.id;
        return (
          <button key={item.id} onClick={()=>setTab(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",color:active?T.teal:T.textMuted,position:"relative",transition:"color 0.15s"}}>
            {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:3,background:"linear-gradient(90deg,#4f6ef7,#7c3aed)",borderRadius:2}}/>}
            <div style={{opacity:active?1:0.5,position:"relative"}}>
              {item.icon}
              {item.id==="echanges"&&nbDemandes>0&&(
                <div style={{position:"absolute",top:-4,right:-6,width:16,height:16,borderRadius:"50%",background:"#f03e3e",color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(240,62,62,0.4)"}}>{nbDemandes}</div>
              )}
            </div>
            <span style={{fontSize:9,fontWeight:active?700:500}}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MenuModal({user,onClose,onLogout}){
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"16px 20px 40px",width:"100%",boxSizing:"border-box",boxShadow:"0 -8px 40px rgba(79,110,247,0.12)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid "+T.border,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:"#fff",flexShrink:0}}>{user.nom[0]}</div>
          <div>
            <div style={{fontWeight:700,fontSize:17,color:T.textPrimary}}>Dr {user.nom}</div>
            <div style={{fontSize:12,color:T.textMuted}}>{user.role==="admin"?"Administrateur":"Médecin anesthésiste"}</div>
          </div>
        </div>
        <Btn onClick={onLogout} variant="danger" full>Se déconnecter</Btn>
      </div>
    </div>
  );
}

// ── MODAL MODIFICATION GARDE ───────────────────────────────────────────────────

function ModalGarde({dateKey,gardeActuelle,onClose,onSave,remplacants,periodes,annee,titulaireActuelId}){
  // titulaireActuelId = le médecin titulaire de la colonne (même si PONCTUEL)
  const [mode,setMode]=useState("medecin"); // "medecin" | "remplacant"
  const [choix,setChoix]=useState(titulaireActuelId||"");
  const [nomRemp,setNomRemp]=useState("");
  const ferie=joursFeries(annee).has(dateKey);
  const date=dkToDate(dateKey);
  const periodeValidee=periodes.some(p=>p.annee===annee&&p.validee&&dateKey>=p.debut&&dateKey<=p.fin);

  // Nom du remplaçant actuel si PONCTUEL
  const rempActuel=(()=>{const g=gardeActuelle;if(g&&g.startsWith("PONCTUEL:")){return g.split(":").slice(2).join(":");}return null;})();

  const sauvegarder=()=>{
    if(mode==="remplacant"&&nomRemp.trim()){
      // Remplaçant ponctuel → stocké dans colonne du titulaire
      onSave(dateKey,null,nomRemp.trim(),titulaireActuelId);
    } else if(mode==="medecin"){
      onSave(dateKey,choix||null,null,null);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:500,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"16px 20px 40px",width:"100%",boxSizing:"border-box",boxShadow:"0 -8px 40px rgba(79,110,247,0.15)",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:"0 auto 16px"}}/>

        {/* En-tête */}
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:16,color:T.textPrimary}}>
            {JOURS[date.getDay()]} {date.getDate()} {MOIS[date.getMonth()]} {annee}
          </div>
          <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
            {ferie&&<span style={{fontSize:10,background:"#fef3c7",color:"#d97706",borderRadius:4,padding:"1px 6px",fontWeight:700}}>FÉRIÉ</span>}
            {periodeValidee&&<span style={{fontSize:10,background:"#fef3c7",color:"#b45309",borderRadius:4,padding:"1px 6px",fontWeight:700}}>⚠ Période validée</span>}
            {rempActuel&&<span style={{fontSize:10,background:"#f5f3ff",color:"#6d28d9",borderRadius:4,padding:"1px 6px",fontWeight:700}}>🔄 Actuellement : {rempActuel}</span>}
          </div>
        </div>

        {/* Choix du mode */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[["medecin","👤 Médecin","Titulaire ou autre"],["remplacant","🔄 Remplaçant","Nom affiché dans la colonne"]].map(([m,label,desc])=>(
            <button key={m} onClick={()=>setMode(m)}
              style={{padding:"10px 8px",borderRadius:10,border:"2px solid "+(mode===m?"#4f6ef7":T.border),background:mode===m?"#eff2ff":"#f8faff",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
              <div style={{fontSize:12,fontWeight:800,color:mode===m?"#4f6ef7":T.textPrimary,marginBottom:2}}>{label}</div>
              <div style={{fontSize:10,color:T.textMuted}}>{desc}</div>
            </button>
          ))}
        </div>

        {/* Mode médecin */}
        {mode==="medecin"&&(
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
            <button onClick={()=>setChoix("")}
              style={{padding:"10px 12px",borderRadius:9,border:"1px solid "+(choix===""?"#f03e3e":T.border),background:choix===""?"#fff0f0":"#f8faff",color:choix===""?"#f03e3e":T.textSecondary,fontWeight:600,cursor:"pointer",fontSize:13,textAlign:"left"}}>
              Aucun (supprimer)
            </button>
            {MEDECINS.map(m=>{
              const c=getCouleur(m.id);
              const sel=choix===m.id;
              return (
                <button key={m.id} onClick={()=>setChoix(m.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:"2px solid "+(sel?c.border:T.border),background:sel?c.bg:"#f8faff",cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:sel?c.text:"#e8ecf8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:sel?"#fff":T.textMuted,flexShrink:0}}>{m.nom[0]}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:sel?c.text:T.textPrimary}}>{m.nom}</div>
                    <div style={{fontSize:10,color:T.textMuted}}>{(m.etp*100)|0}%</div>
                  </div>
                  {sel&&<span style={{marginLeft:"auto",color:c.text,fontSize:16}}>✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Mode remplaçant */}
        {mode==="remplacant"&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:T.textSecondary,marginBottom:8,lineHeight:1.5}}>
              Le nom s'affichera dans la colonne de <strong style={{color:T.textPrimary}}>{MEDECINS.find(m=>m.id===titulaireActuelId)?.nom||"ce médecin"}</strong>. C'est lui qui est responsable du remplaçant.
            </div>
            <input type="text" value={nomRemp} onChange={e=>setNomRemp(e.target.value)}
              placeholder="Nom du remplaçant (ex: Dr Martin)"
              autoFocus
              style={{width:"100%",padding:"12px 14px",background:"#f8faff",border:"2px solid #4f6ef7",borderRadius:10,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none"}}/>
            {/* Remplaçants connus */}
            {remplacants.length>0&&(
              <div style={{marginTop:10}}>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:6}}>Remplaçants enregistrés :</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {remplacants.map(r=>(
                    <button key={r.id} onClick={()=>setNomRemp(r.nom)}
                      style={{padding:"4px 10px",borderRadius:20,border:"1px solid #c4b5fd",background:nomRemp===r.nom?"#f5f3ff":"#fff",color:"#6d28d9",fontWeight:600,cursor:"pointer",fontSize:11}}>
                      {r.nom}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={onClose} variant="ghost">Annuler</Btn>
          <Btn onClick={sauvegarder}
            disabled={mode==="remplacant"&&!nomRemp.trim()}
            full>
            Enregistrer
          </Btn>
        </div>
      </div>
    </div>
  );
}


// ── PÉRIODES ───────────────────────────────────────────────────────────────────

function VuePeriodes({periodes,setPeriodes,gardes,setGardes,bos,csbo,setCsbo,besoins,setStats,indispos,contraintes,annee,showToast}){
  const [deb,setDeb]=useState("");
  const [fin,setFin]=useState("");
  const [gen,setGen]=useState(null);
  const ja=useMemo(()=>tousJours(annee),[annee]);
  const pa=periodes.filter(p=>p.annee===annee);
  const couv=new Set(pa.flatMap(p=>{const ks=[],d=dkToDate(p.debut),f=dkToDate(p.fin);while(d<=f){ks.push(dk(d));d.setDate(d.getDate()+1);}return ks;}));
  const pct=Math.round(couv.size/ja.length*100);

  const ajouter=()=>{
    if(!deb||!fin||fin<deb)return;
    if(pa.some(p=>deb<=p.fin&&fin>=p.debut)){showToast("Chevauchement avec une période existante.","error");return;}
    setPeriodes(prev=>[...prev,{id:Date.now(),annee,debut:deb,fin,validee:false}].sort((a,b)=>a.debut.localeCompare(b.debut)));
    setDeb("");setFin("");showToast("Période ajoutée !");
  };
  const supprimer=id=>{
    const p=periodes.find(x=>x.id===id);
    if(p?.validee){showToast("Période validée, impossible de supprimer.","error");return;}
    const n={...gardes};const d=dkToDate(p.debut),f=dkToDate(p.fin);
    while(d<=f){delete n[dk(d)];d.setDate(d.getDate()+1);}
    setGardes(n);setPeriodes(prev=>prev.filter(x=>x.id!==id));showToast("Supprimée.","info");
  };
  const generer=p=>{
    if(p.validee){showToast("Déverrouillez d'abord.","error");return;}
    setGen(p.id);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      try{
        // Gardes remplaçants = gardes dont l'id commence par "remp_"
        const gardesRemp={};
        const dTmp=dkToDate(p.debut),fTmp=dkToDate(p.fin);
        while(dTmp<=fTmp){const key=dk(dTmp);if(gardes[key]&&gardes[key].startsWith("remp_"))gardesRemp[key]=gardes[key];dTmp.setDate(dTmp.getDate()+1);}
        const res=genererGardes(MEDECINS,indispos,contraintes,p.debut,p.fin,annee,gardesRemp);
        const n={...gardes};const d=dkToDate(p.debut),f=dkToDate(p.fin);
        // Supprimer seulement les gardes titulaires, garder les remplaçants
        while(d<=f){const key=dk(d);if(!gardesRemp[key])delete n[key];d.setDate(d.getDate()+1);}
        Object.assign(n,res.gardes);setGardes(n);setStats(res.stats);
        // La garde est prioritaire : retirer tout CS/BO d'un médecin les jours où il est de garde
        const ncsbo={...csbo};let nbConflits=0;
        const dC=dkToDate(p.debut),fC=dkToDate(p.fin);
        while(dC<=fC){
          const key=dk(dC);
          const g=n[key];
          const gid=g?(g.startsWith("PONCTUEL:")?g.split(":")[1]:g):null;
          if(gid&&ncsbo[key]){
            const v={...ncsbo[key]};let modif=false;
            ["cs1","cs2","bo1","bo2","bo3"].forEach(s=>{if(v[s]===gid){delete v[s];modif=true;nbConflits++;}});
            if(modif)ncsbo[key]=v;
          }
          dC.setDate(dC.getDate()+1);
        }
        if(nbConflits>0)setCsbo(ncsbo);
        if(res.gardesManquantes&&res.gardesManquantes.length>0){
          setJoursManquants(prev=>({...prev,[p.id+"_gardes"]:res.gardesManquantes}));
          showToast(res.gardesManquantes.length+" jour(s) sans garde !","error");
        } else {
          setJoursManquants(prev=>({...prev,[p.id+"_gardes"]:[]}));
          showToast("Planning généré !");
        }
      }catch(e){showToast("Erreur lors de la génération.","error");}
      setGen(null);
    }));
  };
  const [joursManquants,setJoursManquants]=useState({});

  const genererCSBOPeriode=p=>{
    if(p.validee){showToast("Déverrouillez d'abord.","error");return;}
    setGen(p.id);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      try{
        const res=genererCSBO(MEDECINS,gardes,bos,indispos,contraintes,csbo,besoins,p.debut,p.fin,annee);
        // Supprimer anciens CS/BO de la période puis mettre les nouveaux
        const newCsbo={...csbo};
        const d=dkToDate(p.debut),f=dkToDate(p.fin);
        while(d<=f){
          const key=dk(d);
          if(newCsbo[key]){
            // Garder uniquement les valeurs fixées manuellement (non générées)
            delete newCsbo[key];
          }
          d.setDate(d.getDate()+1);
        }
        Object.assign(newCsbo,res.csbo);
        setCsbo(newCsbo);setStats(res.stats);
        // Stocker les jours manquants pour affichage
        if(res.nonRemplis>0){
          const jm={};
          Object.entries(res.csbo||{}).forEach(([key,v])=>{
            if(v._manque&&v._manque.length>0)jm[key]=v._manque;
          });
          setJoursManquants(prev=>({...prev,[p.id]:jm}));
        } else {
          setJoursManquants(prev=>({...prev,[p.id]:{}}));
        }
        const msg=res.nonRemplis>0?res.nonRemplis+" poste(s) non rempli(s)":"CS/BO générés !";
        showToast(msg,res.nonRemplis>0?"error":"success");
      }catch(e){console.error(e);showToast("Erreur CS/BO.","error");}
      setGen(null);
    }));
  };
  const valider=id=>{setPeriodes(prev=>prev.map(p=>p.id===id?{...p,validee:true}:p));showToast("Période validée ✓");};
  const deverr=id=>{setPeriodes(prev=>prev.map(p=>p.id===id?{...p,validee:false}:p));showToast("Déverrouillée","info");};
  const nbG=p=>{let n=0;const d=dkToDate(p.debut),f=dkToDate(p.fin);while(d<=f){if(gardes[dk(d)])n++;d.setDate(d.getDate()+1);}return n;};

  return (
    <div>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>Couverture {annee}</div>
          <div style={{fontSize:22,fontWeight:800,color:T.teal}}>{pct}%</div>
        </div>
        <div style={{background:T.border,borderRadius:99,height:6,overflow:"hidden",marginBottom:10}}>
          <div style={{background:"linear-gradient(90deg,#4f6ef7,#00b86b)",width:pct+"%",height:"100%",borderRadius:99}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:2}}>
          {MOIS.map((m,mi)=>{
            const dm=dk(new Date(annee,mi,1)),fm=dk(new Date(annee,mi+1,0));
            const p=pa.find(x=>x.debut<=fm&&x.fin>=dm);
            const bg=!p?T.border:p.validee?T.green:T.teal;
            return <div key={mi} title={m} style={{background:bg+"44",border:"1px solid "+bg+"66",borderRadius:4,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:!p?T.textMuted:p.validee?T.green:T.teal}}>{m[0]}</div>;
          })}
        </div>
      </Card>

      <SectionTitle>Nouvelle période</SectionTitle>
      <Card style={{marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          {[["Début",deb,e=>{setDeb(e.target.value);if(!fin||e.target.value>fin)setFin(e.target.value);}],["Fin",fin,e=>setFin(e.target.value)]].map(([label,val,fn])=>(
            <div key={label}>
              <label style={{fontSize:11,fontWeight:600,color:T.textSecondary,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</label>
              <input type="date" value={val} min={annee+"-01-01"} max={annee+"-12-31"} onChange={fn}
                style={{width:"100%",padding:"10px",background:"#f8faff",border:"1.5px solid "+T.border,borderRadius:9,fontSize:13,color:T.textPrimary,boxSizing:"border-box",outline:"none"}}/>
            </div>
          ))}
        </div>
        {deb&&fin&&fin>=deb&&<div style={{fontSize:12,color:T.teal,fontWeight:600,marginBottom:10}}>↔ {dureeJ(deb,fin)} jours</div>}
        <Btn onClick={ajouter} full>+ Ajouter cette période</Btn>
      </Card>

      <SectionTitle>Périodes {annee}</SectionTitle>
      {pa.length===0&&<div style={{textAlign:"center",padding:"32px 16px",color:T.textMuted}}>
        <div style={{fontSize:36,marginBottom:8,opacity:0.3}}>📆</div>
        <p style={{fontSize:14,color:T.textSecondary,margin:"0 0 4px",fontWeight:600}}>Aucune période définie</p>
        <p style={{fontSize:12,margin:0}}>Créez des périodes pour découper l'année.</p>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {pa.map(p=>{
          const nb=nbG(p),isG=gen===p.id;
          return (
            <Card key={p.id} style={{borderColor:p.validee?T.green+"44":T.border}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:p.validee?T.green:nb>0?T.teal:T.textMuted,flexShrink:0,boxShadow:p.validee?"0 0 8px "+T.green:nb>0?"0 0 8px "+T.teal:"none"}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:T.textPrimary}}>{ffr(p.debut)} → {ffr(p.fin)}</div>
                  <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>
                    {dureeJ(p.debut,p.fin)} jours · <span style={{color:nb>0?T.teal:T.textMuted,fontWeight:700}}>{nb} gardes</span>
                    {p.validee&&<span style={{marginLeft:8,background:"rgba(16,185,129,0.1)",color:T.green,borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>✓ Validée</span>}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {!p.validee&&<Btn onClick={()=>generer(p)} disabled={!!gen} small>{isG?"⏳ Gardes...":"🔄 Gardes"}</Btn>}
                {nb>0&&!p.validee&&<Btn onClick={()=>genererCSBOPeriode(p)} disabled={!!gen} variant="ghost" small>{isG?"⏳":"📋 CS/BO"}</Btn>}
                {nb>0&&!p.validee&&<Btn onClick={()=>valider(p.id)} variant="success" small>✓ Valider</Btn>}
                {p.validee&&<Btn onClick={()=>deverr(p.id)} variant="warn" small>🔓 Déverrouiller</Btn>}
                {!p.validee&&<Btn onClick={()=>supprimer(p.id)} variant="danger" small>Supprimer</Btn>}
              </div>
              {joursManquants[p.id+"_gardes"]&&joursManquants[p.id+"_gardes"].length>0&&(
                <div style={{marginTop:10,background:"#fff0f0",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#b91c1c",marginBottom:6}}>⚠️ Jours sans garde :</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {joursManquants[p.id+"_gardes"].map(key=>{
                      const d=dkToDate(key);
                      return <div key={key} style={{fontSize:12,fontWeight:700,color:"#991b1b"}}>{JOURS[d.getDay()]} {d.getDate()} {MOIS[d.getMonth()]}</div>;
                    })}
                  </div>
                </div>
              )}
              {joursManquants[p.id]&&Object.keys(joursManquants[p.id]).length>0&&(
                <div style={{marginTop:10,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#b45309",marginBottom:6}}>⚠️ Jours non pourvus :</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {Object.entries(joursManquants[p.id]).sort(([a],[b])=>a.localeCompare(b)).map(([key,postes])=>{
                      const d=dkToDate(key);
                      return (
                        <div key={key} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                          <span style={{fontWeight:700,color:"#92400e"}}>{JOURS[d.getDay()]} {d.getDate()} {MOIS[d.getMonth()]}</span>
                          <span style={{color:"#b45309"}}>—</span>
                          <span style={{color:"#78350f"}}>{postes.map(s=>s.toUpperCase()).join(", ")} manquant{postes.length>1?"s":""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── PLANNING VISUEL ────────────────────────────────────────────────────────────

function VuePlanning({gardes,setGardes,bos,setBos,csbo,setCsbo,besoins,setStats,annee,remplacants,periodes,indispos,contraintes,isAdmin,showToast}){
  const [moisActif,setMoisActif]=useState(new Date().getMonth());
  const [modalDate,setModalDate]=useState(null);
  const ja=useMemo(()=>tousJours(annee),[annee]);

  const indispoParJour=useMemo(()=>{
    const map={};
    for(const ind of indispos){
      const d=dkToDate(ind.dateDebut),f=dkToDate(ind.dateFin);
      while(d<=f){const k=dk(d);(map[k]=map[k]||new Set()).add(ind.medecinId);d.setDate(d.getDate()+1);}
    }
    return map;
  },[indispos]);

  const jours=ja.filter(j=>dkToDate(j.key).getMonth()===moisActif);

  // Colonnes = titulaires + remplaçants pré-placés (id dans MEDECINS ou dans remplacants)
  // Les remplaçants ponctuels (mis après génération via ModalGarde avec nomRemp) 
  // restent dans la colonne du titulaire remplacé → stockés comme { garde: medecinId, remplacement: nomRemp }
  const colonnes=[
    ...MEDECINS,
    ...remplacants.filter(r=>jours.some(j=>gardes[j.key]===r.id||bos[j.key]===r.id))
  ];

  // Index: dateKey -> { titulaire: medecinId, remplacantNom: string } pour les remplacements ponctuels
  // On stocke dans gardes: "PONCTUEL:titulaireid:nomremp"
  const getRemplacement=(key)=>{
    const g=gardes[key];
    if(!g)return null;
    if(g.startsWith("PONCTUEL:")){
      const parts=g.split(":");
      return {titulaireId:parts[1], remplacantNom:parts.slice(2).join(":")};
    }
    return null;
  };

  const handleSave=(dateKey,medecinId,nomRemp,titulaireId)=>{
    const n={...gardes};
    if(medecinId===null&&!nomRemp){delete n[dateKey];} // Suppression explicite
    else if(medecinId===""&&!nomRemp){delete n[dateKey];} // Bouton "Aucun"
    else if(!medecinId&&!nomRemp){return;} // Annulation sans changement
    else if(nomRemp&&titulaireId){
      // Remplaçant ponctuel : stocké dans colonne du titulaire
      // S'assurer que titulaireId est bien un medecinId simple
      const tid=titulaireId.startsWith("PONCTUEL:")?titulaireId.split(":")[1]:titulaireId;
      n[dateKey]="PONCTUEL:"+tid+":"+nomRemp;
    } else if(nomRemp){
      // Pas de titulaire connu → chercher parmi remplaçants pré-placés
      const r=remplacants.find(x=>x.nom===nomRemp);
      if(r)n[dateKey]=r.id;
      else{
        // Remplaçant ponctuel sans titulaire clair → on prend la garde actuelle
        const current=gardes[dateKey]||"";
        const tid=current.startsWith("PONCTUEL:")?current.split(":")[1]:current;
        n[dateKey]="PONCTUEL:"+(tid||"inconnu")+":"+nomRemp;
      }
    } else{n[dateKey]=medecinId;}
    // La garde est prioritaire : retirer tout CS/BO du même médecin ce jour-là
    const gg=n[dateKey];
    const gid=gg?(gg.startsWith("PONCTUEL:")?gg.split(":")[1]:gg):null;
    if(gid&&csbo[dateKey]){
      const v={...csbo[dateKey]};let modif=false;
      ["cs1","cs2","bo1","bo2","bo3"].forEach(s=>{if(v[s]===gid){delete v[s];modif=true;}});
      if(modif)setCsbo({...csbo,[dateKey]:v});
    }
    setGardes(n);setModalDate(null);showToast("Garde mise à jour ✓");
  };

  const colW=Math.max(48,Math.floor(260/colonnes.length));

  // Grouper par semaine (lundi = debut)
  const semaines=[];
  let semCourante=[];
  jours.forEach((j,idx)=>{
    if(j.js===1&&semCourante.length>0){semaines.push(semCourante);semCourante=[];}
    semCourante.push(j);
    if(idx===jours.length-1) semaines.push(semCourante);
  });
  // Si le premier jour n'est pas lundi, on commence quand même
  if(semaines.length===0&&semCourante.length>0) semaines.push(semCourante);

  return (
    <div>
      {/* Sélecteur mois */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
        {MOIS.map((m,i)=>{
          const aG=ja.some(j=>dkToDate(j.key).getMonth()===i&&gardes[j.key]);
          const active=moisActif===i;
          return <button key={i} onClick={()=>setMoisActif(i)}
            style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(active?"#4f6ef7":T.border),background:active?"#4f6ef7":"#fff",color:active?"#fff":aG?T.textSecondary:T.textMuted,fontWeight:active?700:500,cursor:"pointer",fontSize:11,transition:"all 0.15s"}}>
            {m.slice(0,3)}
          </button>;
        })}
      </div>

      {/* Bouton export PDF */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <button onClick={()=>{
          const rows=semaines.map((sem)=>{
            const semRow=`<tr><td colspan="${colonnes.length+1}" style="background:#e8ecff;color:#3b55e0;font-weight:700;font-size:9px;padding:3px 6px">Semaine ${numSem(sem[0].key)}</td></tr>`;
            const dayRows=sem.map(j=>{
              const date=dkToDate(j.key);
              const estWE=[0,6].includes(j.js);
              const gardeId2=gardes[j.key];
              const csboJ2=csbo[j.key]||{};
              const bg=estWE||j.ferie?"#f0f2fa":"#fff";
              const dateCell=`<td style="padding:3px 6px;font-weight:700;background:#f7f9ff;border:1px solid #e0e4f4;white-space:nowrap;font-size:9px;color:${j.ferie?"#b45309":estWE?"#6b7280":"#333"}">${JOURS[j.js].slice(0,3)} ${date.getDate()}${j.ferie?" F":""}</td>`;
              const cells=colonnes.map(m=>{
                const remp2=gardeId2&&gardeId2.startsWith("PONCTUEL:")?{titulaireId:gardeId2.split(":")[1]}:null;
                const gardeReel2=remp2?remp2.titulaireId:gardeId2;
                const isG=gardeReel2===m.id;
                const isCS=csboJ2.cs1===m.id||csboJ2.cs2===m.id;
                const isBO=csboJ2.bo1===m.id||csboJ2.bo2===m.id||csboJ2.bo3===m.id;
                let content="";
                if(isG) content=`<span style="background:#fff0f0;color:#f03e3e;border:1px solid #fca5a5;border-radius:3px;padding:1px 5px;font-weight:800;font-size:9px">G</span>`;
                else if(isCS) content=`<span style="background:#f0fdf6;color:#00b86b;border:1px solid #6ee7b7;border-radius:3px;padding:1px 4px;font-weight:800;font-size:9px">CS</span>`;
                else if(isBO) content=`<span style="background:#eff2ff;color:#4f6ef7;border:1px solid #a5b4fc;border-radius:3px;padding:1px 4px;font-weight:800;font-size:9px">BO</span>`;
                return `<td style="padding:2px;border:1px solid #e0e4f4;text-align:center;background:${bg}">${content}</td>`;
              }).join("");
              return `<tr>${dateCell}${cells}</tr>`;
            }).join("");
            return semRow+dayRows;
          }).join("");
          const headers=colonnes.map(m=>`<th style="background:#4f6ef7;color:#fff;padding:5px 4px;font-size:9px;font-weight:700;text-align:center">${m.nom.slice(0,7)}</th>`).join("");
          const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Planning ${MOIS[moisActif]} ${annee}</title><style>body{font-family:Arial,sans-serif;margin:16px;}h2{margin:0 0 2px;font-size:16px;}table{width:100%;border-collapse:collapse;}@media print{@page{size:A4 landscape;margin:10mm;}}</style></head><body><h2>AnesPlanning — ${MOIS[moisActif]} ${annee}</h2><p style="color:#666;font-size:10px;margin:0 0 10px">Hôpital Privée d'Ambérieu</p><table><thead><tr><th style="background:#4f6ef7;color:#fff;padding:5px 6px;font-size:9px;text-align:left">Jour</th>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
          // Téléchargement direct
          const a=document.createElement("a");
          a.href="data:text/html;charset=utf-8,"+encodeURIComponent(html);
          a.download="Planning_"+MOIS[moisActif]+"_"+annee+".html";
          a.click();
        }}
          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1px solid #4f6ef7",background:"#eff2ff",color:"#4f6ef7",fontWeight:700,cursor:"pointer",fontSize:12}}>
          📄 Exporter PDF
        </button>
      </div>

      {/* Légende */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",background:"#fff",borderRadius:10,padding:"8px 12px",border:"1px solid "+T.border}}>
        {[["#f03e3e","Garde"],["#00b86b","CS"],["#4f6ef7","BO"],["#e879a0","Indispo"],["#e5e7f0","WE / Férié"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:13,height:13,borderRadius:4,background:c,border:c==="#e5e7f0"?"1px solid #c7d2ec":"none"}}/>
            <span style={{fontSize:11,color:T.textSecondary,fontWeight:600}}>{l}</span>
          </div>
        ))}
        {isAdmin&&<span style={{fontSize:10,color:T.textMuted,marginLeft:"auto"}}>✏️ Toucher une garde pour modifier</span>}
      </div>

      {/* Tableau scrollable */}
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",marginLeft:-16,marginRight:-16,paddingLeft:16}}>
        <div style={{minWidth:colonnes.length*colW+72}}>

          {/* En-tête médecins — sticky */}
          <div style={{display:"flex",position:"sticky",top:58,zIndex:10,background:T.bg,paddingBottom:6,paddingTop:4,boxShadow:"0 2px 8px rgba(79,110,247,0.08)"}}>
            <div style={{width:60,flexShrink:0,borderRight:"2px solid #e0e4f4"}}/>
            {colonnes.map(m=>{
              const c=getCouleur(m.id);
              return (
                <div key={m.id} style={{width:colW,flexShrink:0,padding:"0 2px",textAlign:"center",boxSizing:"border-box"}}>
                  <div style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:8,padding:"5px 3px",fontSize:10,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                    {m.nom.slice(0,6)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Semaines */}
          {semaines.map((sem,si)=>(
            <div key={si} style={{marginBottom:4,borderRadius:10,overflow:"hidden",border:"2px solid #d0d8f0",background:"#fff",boxShadow:"0 2px 8px rgba(79,110,247,0.06)"}}>
              {/* Barre de semaine */}
              <div style={{background:"linear-gradient(90deg,#4f6ef7,#7c3aed)",padding:"3px 10px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:9,fontWeight:800,color:"rgba(255,255,255,0.9)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                  Semaine {numSem(sem[0].key)}
                </span>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.6)"}}>
                  {dkToDate(sem[0].key).getDate()} – {dkToDate(sem[sem.length-1].key).getDate()} {MOIS[moisActif].slice(0,3)}.
                </span>
              </div>
              {/* En-tête prénoms dans chaque semaine */}
              <div style={{display:"flex",background:"#f0f4ff",borderBottom:"2px solid #d0d8f0"}}>
                <div style={{width:60,flexShrink:0,borderRight:"2px solid #e0e4f4"}}/>
                {colonnes.map(m=>{
                  const c=getCouleur(m.id);
                  return (
                    <div key={m.id} style={{width:colW,flexShrink:0,padding:"3px 2px",textAlign:"center",boxSizing:"border-box"}}>
                      <div style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:6,padding:"3px 2px",fontSize:9,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {m.nom.slice(0,6)}
                      </div>
                    </div>
                  );
                })}
                <div style={{width:28,flexShrink:0}}/>
              </div>

              {/* Lignes jours de la semaine */}
              {sem.map((j,ji)=>{
                const date=dkToDate(j.key);
                const estWE=[0,6].includes(j.js);
                const estF=j.ferie;
                const gardeId=gardes[j.key];
                const bosId=bos[j.key];
                const csboJ=csbo[j.key]||{};
                const indisposJ=indispoParJour[j.key]||new Set();
                const estGrise=estWE||estF;

                return (
                  <div key={j.key} style={{display:"flex",borderTop:ji>0?"1px solid #eef0f8":"none",background:estGrise?"#f0f2fa":"#fff",minHeight:34}}>
                    {/* Date */}
                    <div style={{width:60,flexShrink:0,padding:"5px 8px",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:"2px solid #e0e4f4",background:estGrise?"#e8ebf5":estWE||estF?"#f0f2fa":"#f7f9ff"}}>
                      <div style={{fontSize:11,fontWeight:800,color:estF?"#b45309":estWE?"#6b7280":T.textPrimary,lineHeight:1.2}}>
                        {JOURS[j.js].slice(0,3)} {date.getDate()}
                      </div>
                      {estF&&<div style={{fontSize:8,color:"#d97706",fontWeight:700,lineHeight:1.2}}>Férié</div>}
                    </div>

                    {/* Colonnes médecins */}
                    {colonnes.map((m,mi)=>{
                      const remp=getRemplacement(j.key);
                      // gardeReel = medecinId effectif (titulaire ou titulaire du ponctuel)
                      const gardeReel=remp?remp.titulaireId:gardeId;
                      const isGarde=gardeReel===m.id;
                      const isGardePonctuel=remp&&remp.titulaireId===m.id;
                      const isBosRemp=bosId===m.id;
                      const isCS=(csboJ.cs1===m.id||csboJ.cs2===m.id);
                      const isBO=(csboJ.bo1===m.id||csboJ.bo2===m.id||csboJ.bo3===m.id);
                      const isIndispo=indisposJ.has(m.id);

                      const cells=[];
                      const violation=!isGardePonctuel&&isGarde?gardeViolee(m.id,j.key,contraintes,gardes):null;
                      if(isGarde) cells.push({color:violation?"#f59e0b":"#f03e3e",label:isGardePonctuel?"🔄 "+(getRemplacement(j.key).remplacantNom.length>7?getRemplacement(j.key).remplacantNom.slice(0,7)+"…":getRemplacement(j.key).remplacantNom):"G",bg:violation?"#fffbeb":"#fff0f0",border:violation?"#fde68a":"#fca5a5",ponctuel:isGardePonctuel,violation});
                      if(isBosRemp) cells.push({color:"#4f6ef7",label:"BO",bg:"#eff2ff",border:"#a5b4fc"});
                      if(isCS) cells.push({color:"#00b86b",label:"CS",bg:"#f0fdf6",border:"#6ee7b7"});
                      if(isBO) cells.push({color:"#4f6ef7",label:"BO",bg:"#eff2ff",border:"#a5b4fc"});

                      // Poste manquant pour ce jour (pas spécifique à un médecin — affiché dans 1ère colonne vide)
                      const manqueJ=csboJ._manque||[];
                      const borderR=mi<colonnes.length-1?"1px solid #eef0f8":"none";
                      if(isIndispo&&cells.length===0){
                        return (
                          <div key={m.id} style={{width:colW,flexShrink:0,borderRight:borderR,background:"#fdf2f8",display:"flex",alignItems:"center",justifyContent:"center",padding:"2px"}}>
                            <div style={{width:"90%",background:"#fce7f3",border:"1px solid #f9a8d4",borderRadius:5,textAlign:"center",padding:"2px 0",fontSize:9,fontWeight:800,color:"#be185d"}}>✕</div>
                          </div>
                        );
                      }



                      if(estGrise&&cells.length===0){
                        return <div key={m.id} style={{width:colW,flexShrink:0,borderRight:borderR,background:"#eaecf5"}}/>;
                      }


                      return (
                        <div key={m.id}
                          onClick={()=>isAdmin&&cells.length>0&&setModalDate(j.key)}
                          style={{width:colW,flexShrink:0,borderRight:borderR,padding:"2px",display:"flex",flexDirection:"column",gap:2,justifyContent:"center",cursor:isAdmin&&cells.length>0?"pointer":"default",boxSizing:"border-box"}}>
                          {cells.length===0
                            ?<div style={{height:26}}/>
                            :cells.map((cell,ci)=>(
                              <div key={ci} title={cell.violation||""} style={{borderRadius:5,padding:"2px 3px",textAlign:"center",background:cell.bg,border:"1px solid "+cell.border,fontSize:cell.label.length>3?8:9,fontWeight:800,color:cell.color,lineHeight:1.4,boxShadow:"0 1px 2px rgba(0,0,0,0.04)",wordBreak:"break-word",whiteSpace:"normal",position:"relative"}}>
                                {cell.violation&&<span style={{position:"absolute",top:-3,right:-3,fontSize:8}}>⚠️</span>}
                                {cell.label}
                              </div>
                            ))
                          }
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}

          {jours.length===0&&<p style={{color:T.textMuted,fontSize:13,padding:"20px 0"}}>Aucune garde pour ce mois.</p>}
        </div>
      </div>

      {modalDate&&<ModalGarde dateKey={modalDate} gardeActuelle={gardes[modalDate]||""} onClose={()=>setModalDate(null)} onSave={handleSave} remplacants={remplacants} periodes={periodes} annee={annee} titulaireActuelId={(()=>{const g=gardes[modalDate];if(!g)return null;if(g.startsWith("PONCTUEL:")){return g.split(":")[1];}return g;})()}/>}
    </div>
  );
}


// ── REMPLAÇANTS ────────────────────────────────────────────────────────────────

function VueRemplacants({remplacants,setRemplacants,gardes,setGardes,bos,setBos,annee,showToast,isAdmin}){
  const [nom,setNom]=useState("");
  const [selRemp,setSelRemp]=useState(null);
  const [mois,setMois]=useState(new Date().getMonth());
  const feries=useMemo(()=>joursFeries(annee),[annee]);

  // Calendrier du mois
  const prem=new Date(annee,mois,1),dern=new Date(annee,mois+1,0);
  const off=(prem.getDay()+6)%7,cal=[];
  for(let i=0;i<off;i++)cal.push(null);
  for(let d=1;d<=dern.getDate();d++)cal.push(dk(new Date(annee,mois,d)));
  while(cal.length%7!==0)cal.push(null);

  const ajouter=()=>{
    if(!nom.trim())return;
    const id="remp_"+Date.now();
    setRemplacants(prev=>[...prev,{id,nom:nom.trim()}]);
    setNom("");setSelRemp(id);showToast("Remplaçant ajouté — sélectionnez ses jours sur le calendrier !");
  };

  const supprimerRemp=id=>{
    const ng={};for(const[k,v] of Object.entries(gardes)){if(v!==id)ng[k]=v;}
    setGardes(ng);
    const nb={};for(const[k,v] of Object.entries(bos)){if(v!==id)nb[k]=v;}
    setBos(nb);
    setRemplacants(prev=>prev.filter(x=>x.id!==id));
    if(selRemp===id)setSelRemp(null);
    showToast("Remplaçant supprimé.","info");
  };

  const toggleJour=(key,type)=>{
    if(!selRemp)return;
    if(type==="garde"){
      const n={...gardes};
      if(n[key]===selRemp){delete n[key];}
      else{n[key]=selRemp;}
      setGardes(n);
    } else {
      const n={...bos};
      if(n[key]===selRemp){delete n[key];}
      else{n[key]=selRemp;}
      setBos(n);
    }
  };

  const gardesRemp=(id)=>{
    const g=Object.entries(gardes).filter(([k,v])=>v===id&&k.startsWith(annee+"-")).length;
    const b=Object.entries(bos).filter(([k,v])=>v===id&&k.startsWith(annee+"-")).length;
    return g+b;
  };
  const gardesMois=(id)=>{
    const pfx=annee+"-"+String(mois+1).padStart(2,"0");
    const g=Object.entries(gardes).filter(([k,v])=>v===id&&k.startsWith(pfx)).length;
    const b=Object.entries(bos).filter(([k,v])=>v===id&&k.startsWith(pfx)).length;
    return g+b;
  };

  const rempActif=remplacants.find(r=>r.id===selRemp);

  return (
    <div>
      {/* Ajouter */}
      {isAdmin&&<Card style={{marginBottom:16}}>
        <SectionTitle>Nouveau remplaçant</SectionTitle>
        <div style={{display:"flex",gap:10}}>
          <input type="text" value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ajouter()} placeholder="Nom du remplaçant"
            style={{flex:1,padding:"12px",background:"#f8faff",border:"1.5px solid "+T.border,borderRadius:10,fontSize:14,color:T.textPrimary,outline:"none"}}/>
          <Btn onClick={ajouter} disabled={!nom.trim()}>+ Ajouter</Btn>
        </div>
      </Card>}

      {/* Liste remplaçants */}
      {remplacants.length>0&&(
        <div style={{marginBottom:16}}>
          <SectionTitle>Sélectionner un remplaçant pour placer ses gardes</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {remplacants.map(r=>{
              const nb=gardesRemp(r.id);
              const c=COULEURS.remplacant;
              const isActive=selRemp===r.id;
              return (
                <div key={r.id} onClick={()=>setSelRemp(isActive?null:r.id)}
                  style={{display:"flex",alignItems:"center",gap:12,background:isActive?T.tealGlow:T.surfaceUp,borderRadius:12,padding:"12px 14px",border:"1px solid "+(isActive?T.teal:T.border),cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:c.bg,border:"2px solid "+(isActive?T.teal:c.border),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:isActive?T.teal:c.text,flexShrink:0,transition:"all 0.15s"}}>{r.nom[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:isActive?T.teal:T.textPrimary}}>{r.nom}</div>
                    <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>
                      {nb>0?<span style={{color:T.teal,fontWeight:600}}>{nb} garde{nb>1?"s":""} en {annee}</span>:"Aucune garde placée"}
                    </div>
                  </div>
                  {isActive&&<div style={{fontSize:11,color:T.teal,fontWeight:700,background:"rgba(14,165,233,0.1)",borderRadius:6,padding:"3px 8px"}}>✓ Actif</div>}
                  <button onClick={e=>{e.stopPropagation();supprimerRemp(r.id);}}
                    style={{background:"rgba(244,63,94,0.08)",color:T.red,border:"1px solid rgba(244,63,94,0.2)",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,flexShrink:0}}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendrier */}
      {remplacants.length>0&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <SectionTitle style={{margin:0}}>{rempActif?`Gardes de ${rempActif.nom}`:"Calendrier"}</SectionTitle>
            {rempActif&&gardesMois(selRemp)>0&&(
              <span style={{fontSize:11,color:T.teal,fontWeight:700,background:"rgba(14,165,233,0.1)",borderRadius:6,padding:"3px 8px"}}>{gardesMois(selRemp)} ce mois</span>
            )}
          </div>

          {!selRemp&&(
            <div style={{background:T.surfaceUp,borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:12,color:T.textSecondary,border:"1px solid "+T.border}}>
              👆 Sélectionnez un remplaçant ci-dessus pour placer ses gardes sur le calendrier
            </div>
          )}
          {selRemp&&(
            <div style={{background:"rgba(14,165,233,0.05)",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:T.teal,border:"1px solid rgba(14,165,233,0.2)",fontWeight:600}}>
              Touchez les jours pour ajouter / retirer une garde de {rempActif?.nom}
            </div>
          )}

          {/* Sélecteur mois */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
            {MOIS.map((m,i)=>{
              const active=mois===i;
              const aGardes=selRemp&&Object.keys(gardes).some(k=>k.startsWith(annee+"-"+String(i+1).padStart(2,"0"))&&gardes[k]===selRemp);
              return <button key={i} onClick={()=>setMois(i)} style={{padding:"4px 8px",borderRadius:7,border:"1px solid "+(active?T.teal:T.border),background:active?T.tealGlow:aGardes?"rgba(14,165,233,0.04)":"transparent",color:active?T.teal:aGardes?T.textSecondary:T.textMuted,fontWeight:active?700:aGardes?600:400,cursor:"pointer",fontSize:10}}>{m.slice(0,3)}</button>;
            })}
          </div>

          {/* Grille calendrier */}
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid "+T.border}}>
              {["L","M","M","J","V","S","D"].map((j,i)=>(
                <div key={i} style={{padding:"8px 0",textAlign:"center",fontSize:11,fontWeight:700,color:i>=5?T.textMuted:T.textSecondary}}>{j}</div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {cal.map((key,idx)=>{
                if(!key)return <div key={idx} style={{minHeight:52,borderRight:"1px solid "+T.border+"22",borderBottom:"1px solid "+T.border+"22"}}/>;
                const date=dkToDate(key);
                const estWE=[0,6].includes(date.getDay());
                const estF=feries.has(key);
                const gardeIci=gardes[key];
                const estCeRemp=gardeIci===selRemp;
                const autreRemp=gardeIci&&gardeIci!==selRemp&&gardeIci.startsWith("remp_");
                const titr=gardeIci&&!gardeIci.startsWith("remp_");
                const autreM=remplacants.find(r=>r.id===gardeIci);
                const c=gardeIci?getCouleur(gardeIci):{};

                return (
                  <div key={key} onClick={()=>{}}
                    style={{minHeight:52,background:estCeRemp?T.tealGlow:estF?"rgba(245,158,11,0.06)":estWE?"rgba(255,255,255,0.01)":"transparent",borderRight:"1px solid "+T.border+"22",borderBottom:"1px solid "+T.border+"22",cursor:selRemp?"pointer":"default",padding:4,outline:estCeRemp?"2px solid "+T.teal:"none",outlineOffset:-2,transition:"background 0.1s",WebkitTapHighlightColor:"transparent",position:"relative"}}>
                    <div style={{fontSize:11,fontWeight:700,color:estF?"#f59e0b":estWE?T.textMuted:T.textSecondary,marginBottom:2,display:"flex",alignItems:"center",gap:2}}>
                      {date.getDate()}
                      {estF&&<span style={{fontSize:7,background:"rgba(245,158,11,0.2)",color:"#f59e0b",borderRadius:2,padding:"0 2px"}}>F</span>}
                    </div>
                    {/* Boutons Garde / BO */}
                    {selRemp&&!autreRemp&&!titr&&(
                      <div style={{display:"flex",gap:2,marginTop:2}}>
                        <button onClick={e=>{e.stopPropagation();toggleJour(key,"garde");}}
                          style={{flex:1,padding:"2px 0",borderRadius:3,border:"1px solid "+(gardes[key]===selRemp?T.red:"rgba(244,63,94,0.3)"),background:gardes[key]===selRemp?"rgba(244,63,94,0.2)":"transparent",color:gardes[key]===selRemp?T.red:T.textMuted,fontSize:7,fontWeight:700,cursor:"pointer",lineHeight:1.4}}>G</button>
                        <button onClick={e=>{e.stopPropagation();toggleJour(key,"bo");}}
                          style={{flex:1,padding:"2px 0",borderRadius:3,border:"1px solid "+(bos[key]===selRemp?T.teal:"rgba(14,165,233,0.3)"),background:bos[key]===selRemp?T.tealGlow:"transparent",color:bos[key]===selRemp?T.teal:T.textMuted,fontSize:7,fontWeight:700,cursor:"pointer",lineHeight:1.4}}>J</button>
                      </div>
                    )}
                    {(gardes[key]===selRemp)&&<div style={{background:"rgba(244,63,94,0.15)",borderRadius:3,padding:"1px 3px",fontSize:8,fontWeight:800,color:T.red,textAlign:"center",marginTop:1}}>Garde</div>}
                    {(bos[key]===selRemp)&&<div style={{background:T.tealGlow,borderRadius:3,padding:"1px 3px",fontSize:8,fontWeight:800,color:T.teal,textAlign:"center",marginTop:1}}>Journée</div>}
                    {autreRemp&&autreM&&(
                      <div style={{background:COULEURS.remplacant.bg,color:COULEURS.remplacant.text,borderRadius:3,padding:"1px 3px",fontSize:8,fontWeight:700,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",border:"1px solid "+COULEURS.remplacant.border}}>{autreM.nom.slice(0,4)}</div>
                    )}
                    {titr&&(()=>{const m=MEDECINS.find(x=>x.id===gardeIci);const cc=getCouleur(gardeIci);return m?<div style={{background:cc.bg,color:cc.text,borderRadius:3,padding:"1px 3px",fontSize:8,fontWeight:700,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",border:"1px solid "+cc.border,opacity:0.7}}>{m.nom.slice(0,4)}</div>:null;})()}
                  </div>
                );
              })}
            </div>
          </Card>

          <div style={{background:"rgba(14,165,233,0.04)",border:"1px solid rgba(14,165,233,0.1)",borderRadius:10,padding:"12px 14px",marginTop:12}}>
            <div style={{fontSize:12,fontWeight:700,color:T.teal,marginBottom:6}}>💡 Comment ça marche</div>
            <div style={{fontSize:12,color:T.textSecondary,lineHeight:1.7}}>
              1. Sélectionnez un remplaçant · 2. Touchez ses jours sur le calendrier<br/>
              3. Générez dans <strong style={{color:T.textPrimary}}>Périodes</strong> — les titulaires remplissent le reste<br/>
              4. L'équité est calculée sur les titulaires uniquement
            </div>
          </div>
        </div>
      )}

      {remplacants.length===0&&(
        <div style={{textAlign:"center",padding:"40px 16px",color:T.textMuted}}>
          <div style={{fontSize:40,marginBottom:10,opacity:0.3}}>👥</div>
          <p style={{fontWeight:600,fontSize:14,color:T.textSecondary,margin:"0 0 4px"}}>Aucun remplaçant</p>
          <p style={{fontSize:12,margin:0}}>Ajoutez un remplaçant et placez ses gardes avant de générer le planning.</p>
        </div>
      )}
    </div>
  );
}


// ── ÉCHANGES ───────────────────────────────────────────────────────────────────

function VueEchanges({echanges,setEchanges,gardes,setGardes,csbo,setCsbo,bos,setBos,currentUser,annee,showToast}){
  const [etape,setEtape]=useState("liste"); // liste | creer
  const [typeEchange,setTypeEchange]=useState("echange"); // echange | don
  const [etapeCreer,setEtapeCreer]=useState("monJour"); // monJour | leurJour
  const [donMode,setDonMode]=useState("medecin"); // medecin | remplacant
  const [nomRempDon,setNomRempDon]=useState("");
  const [moisSel,setMoisSel]=useState(new Date().getMonth());
  const [moisCible,setMoisCible]=useState(new Date().getMonth());
  const [monJour,setMonJour]=useState(null); // {key, poste}
  const [leurJour,setLeurJour]=useState(null); // {key, poste, medecinId} pour échange
  const [selCibles,setSelCibles]=useState([]); // pour don : plusieurs médecins
  const ja=useMemo(()=>tousJours(annee),[annee]);
  const feries=useMemo(()=>joursFeries(annee),[annee]);

  // Statut d'un médecin un jour donné
  const statutJour=(medId,key)=>{
    const g=gardes[key];
    const remp=g&&g.startsWith("PONCTUEL:")?g.split(":")[1]:null;
    if(g===medId||(remp&&remp===medId)) return "garde";
    const v=csbo[key]||{};
    if(v.cs1===medId||v.cs2===medId) return "cs";
    if(v.bo1===medId||v.bo2===medId||v.bo3===medId) return "bo";
    if(bos[key]===medId) return "bo";
    return "libre";
  };

  // Vérifie si un médecin peut recevoir un poste ce jour
  const peutRecevoir=(medId, key)=>{
    // Déjà affecté ce jour
    if(statutJour(medId,key)!=="libre") return false;
    // De garde la veille
    const d=dkToDate(key);
    const veille=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()-1));
    const gVeille=gardes[veille];
    const rVeille=gVeille&&gVeille.startsWith("PONCTUEL:")?gVeille.split(":")[1]:null;
    if(gVeille===medId||(rVeille&&rVeille===medId)) return false;
    // Indisponible ce jour (chercher dans indispos)
    // On n'a pas accès à indispos ici — on passe juste les deux premières règles
    return true;
  };

  const raisonIndispo=(medId, key)=>{
    if(statutJour(medId,key)!=="libre") return statutJour(medId,key)==="garde"?"Garde ce jour":statutJour(medId,key)==="cs"?"CS ce jour":"BO ce jour";
    const d=dkToDate(key);
    const veille=dk(new Date(d.getFullYear(),d.getMonth(),d.getDate()-1));
    const gVeille=gardes[veille];
    const rVeille=gVeille&&gVeille.startsWith("PONCTUEL:")?gVeille.split(":")[1]:null;
    if(gVeille===medId||(rVeille&&rVeille===medId)) return "Garde la veille";
    return null;
  };

  const statutLabel={garde:"Garde",cs:"CS",bo:"BO",libre:"Libre"};
  const statutColor={garde:"#f03e3e",cs:"#00b86b",bo:"#4f6ef7",libre:"#9ca3af"};
  const statutBg={garde:"#fff0f0",cs:"#f0fdf4",bo:"#eff2ff",libre:"transparent"};

  // Mes affectations ce mois
  const joursDuMois=(mois)=>ja.filter(j=>dkToDate(j.key).getMonth()===mois);

  const monStatutJour=(key)=>statutJour(currentUser.id,key);

  const posteLabel={garde:"Garde",cs:"Consultation",bo:"Bloc",libre:"Libre"};
  const posteColor={garde:"#f03e3e",cs:"#00b86b",bo:"#4f6ef7",libre:"#9ca3af"};

  // Calendrier compact pour choisir un jour
  function CalendrierChoix({mois,onSelectJour,jourSelectionne,medId,titre}){
    const prem=new Date(annee,mois,1),dern=new Date(annee,mois+1,0);
    const off=(prem.getDay()+6)%7,cal=[];
    for(let i=0;i<off;i++) cal.push(null);
    for(let d=1;d<=dern.getDate();d++) cal.push(dk(new Date(annee,mois,d)));
    while(cal.length%7!==0) cal.push(null);

    return (
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:12,fontWeight:700,color:T.textSecondary}}>{titre}</span>
          <div style={{display:"flex",gap:4}}>
            {MOIS.map((m,i)=>(
              <button key={i} onClick={()=>mois===i?null:onSelectJour&&null||setMoisSel&&null}
                style={{display:"none"}}/>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
          {MOIS.map((m,i)=>{
            const active=mois===i;
            return <button key={i}
              onClick={()=>medId?setMoisCible(i):setMoisSel(i)}
              style={{padding:"2px 6px",borderRadius:5,border:"none",background:active?"#4f6ef7":"#f0f4ff",color:active?"#fff":T.textMuted,fontWeight:active?700:400,cursor:"pointer",fontSize:9}}>
              {m.slice(0,3)}
            </button>;
          })}
        </div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+T.border,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"linear-gradient(90deg,#4f6ef7,#7c3aed)"}}>
            {["L","M","M","J","V","S","D"].map((j,i)=>(
              <div key={i} style={{padding:"6px 0",textAlign:"center",fontSize:9,fontWeight:700,color:i>=5?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.9)"}}>{j}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {cal.map((key,idx)=>{
              if(!key) return <div key={idx} style={{minHeight:44,background:"#f8f9fc",borderRight:"1px solid #eef0f8",borderBottom:"1px solid #eef0f8"}}/>;
              const date=dkToDate(key);
              const js=date.getDay();
              const estWE=[0,6].includes(js),estF=feries.has(key);
              const st=statutJour(medId||currentUser.id,key);
              const isSel=jourSelectionne?.key===key;
              const col=statutColor[st];
              const bg=isSel?"#4f6ef7":estWE||estF?"#f0f2fa":statutBg[st];
              // Filtrage disponibilité pour le calendrier cible (échange)
              const myStatut=statutJour(currentUser.id,key);
              const d2=dkToDate(key);
              const veille2=dk(new Date(d2.getFullYear(),d2.getMonth(),d2.getDate()-1));
              const gV2=gardes[veille2];
              const rV2=gV2&&gV2.startsWith("PONCTUEL:")?gV2.split(":")[1]:null;
              const gardeVeille2=gV2===currentUser.id||(rV2&&rV2===currentUser.id);
              const canTake=medId?myStatut==="libre"&&!gardeVeille2:true;
              const clickable=medId?(st!=="libre"&&canTake):st!=="libre";
              const bgFinal=!canTake&&medId?"#f8f9fc":bg;
              return (
                <div key={key} onClick={()=>clickable&&onSelectJour?onSelectJour(key,st):null}
                  style={{minHeight:44,background:bgFinal,borderRight:"1px solid #eef0f8",borderBottom:"1px solid #eef0f8",cursor:clickable&&onSelectJour?"pointer":"default",padding:4,outline:isSel?"2px solid #4f6ef7":"none",outlineOffset:-2,transition:"background 0.1s",WebkitTapHighlightColor:"transparent",position:"relative"}}>
                  {!canTake&&medId&&st!=="libre"&&(
                    <div style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:T.red}}/>
                  )}
                  <div style={{fontSize:10,fontWeight:700,color:isSel?"#fff":estWE||estF?"#9ca3af":T.textSecondary}}>{date.getDate()}</div>
                  {st!=="libre"&&(
                    <div style={{background:isSel?"rgba(255,255,255,0.25)":col+"15",border:"1px solid "+(isSel?"rgba(255,255,255,0.4)":col+"44"),borderRadius:4,textAlign:"center",fontSize:8,fontWeight:800,color:isSel?"#fff":col,marginTop:2,padding:"1px 0"}}>
                      {statutLabel[st]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const envoyer=()=>{
    if(!monJour)return;

    // Cas spécial : don avec remplaçant → automatique, pas de demande
    if(typeEchange==="don"&&donMode==="remplacant"&&nomRempDon.trim()){
      // Appliquer directement le remplaçant dans le planning
      const n={...gardes};
      const tid=monJour.poste==="garde"?(n[monJour.key]&&n[monJour.key].startsWith("PONCTUEL:")?n[monJour.key].split(":")[1]:n[monJour.key])||currentUser.id:currentUser.id;
      n[monJour.key]="PONCTUEL:"+tid+":"+nomRempDon.trim();
      setGardes(n);
      setEtape("liste");setMonJour(null);setNomRempDon("");setEtapeCreer("monJour");
      showToast("🔄 Remplaçant "+nomRempDon+" placé automatiquement !");
      return;
    }

    const cibles=typeEchange==="don"?selCibles:leurJour?[leurJour.medecinId]:[];
    if(cibles.length===0)return;

    cibles.forEach(cibleId=>{
      const m=MEDECINS.find(x=>x.id===cibleId);
      setEchanges(prev=>[{
        id:Date.now()+"_"+cibleId,
        type:typeEchange,
        demandeurId:currentUser.id,
        demandeurNom:currentUser.nom,
        cibleId,
        cibleNom:m?.nom||cibleId,
        dateKey:monJour.key,
        poste:monJour.poste,
        leurDateKey:leurJour?.key||null,
        leurPoste:leurJour?.poste||null,
        statut:"en_attente",
        dateCreation:new Date().toISOString(),
      },...prev]);
    });

    setEtape("liste");setMonJour(null);setLeurJour(null);setSelCibles([]);setEtapeCreer("monJour");setNomRempDon("");
    showToast(typeEchange==="don"?`🎁 Don proposé à ${cibles.length} médecin(s)`:"🔄 Demande envoyée !");
  };

  const appliquer=(ech)=>{
    // Appliquer l'échange dans le planning
    if(ech.poste==="garde"){
      const n={...gardes};
      // Le demandeur cède sa garde à la cible
      if(n[ech.dateKey]===ech.demandeurId) n[ech.dateKey]=ech.cibleId;
      // Si échange : la cible cède son jour au demandeur
      if(ech.type==="echange"&&ech.leurDateKey){
        const v=csbo[ech.leurDateKey]||{};
        if(n[ech.leurDateKey]===ech.cibleId) n[ech.leurDateKey]=ech.demandeurId;
      }
      setGardes(n);
    } else {
      const n={...csbo};
      const v={...(n[ech.dateKey]||{})};
      ["cs1","cs2","bo1","bo2","bo3"].forEach(s=>{if(v[s]===ech.demandeurId)v[s]=ech.cibleId;});
      n[ech.dateKey]=v;
      if(ech.type==="echange"&&ech.leurDateKey){
        const v2={...(n[ech.leurDateKey]||{})};
        ["cs1","cs2","bo1","bo2","bo3"].forEach(s=>{if(v2[s]===ech.cibleId)v2[s]=ech.demandeurId;});
        n[ech.leurDateKey]=v2;
      }
      setCsbo(n);
    }
    // Annuler les autres dons du même jour
    setEchanges(prev=>prev.map(e=>{
      if(e.id===ech.id)return{...e,statut:"accepte"};
      if(e.demandeurId===ech.demandeurId&&e.dateKey===ech.dateKey&&e.statut==="en_attente")
        return{...e,statut:"refuse"};
      return e;
    }));
    showToast("Échange appliqué ! Planning mis à jour ✓");
  };

  const refuser=(id)=>{setEchanges(prev=>prev.map(e=>e.id===id?{...e,statut:"refuse"}:e));showToast("Refusé","info");};
  const supprimer=(id)=>setEchanges(prev=>prev.filter(e=>e.id!==id));

  const recus=echanges.filter(e=>e.cibleId===currentUser.id&&e.statut==="en_attente");
  const envoyes=echanges.filter(e=>e.demandeurId===currentUser.id);
  const stCfg={en_attente:{bg:"#fef3c7",color:"#b45309",label:"⏳"},accepte:{bg:"#d1fae5",color:"#065f46",label:"✓"},refuse:{bg:"#fee2e2",color:"#991b1b",label:"✕"}};

  const formatD=(key)=>{if(!key)return"";const d=dkToDate(key);return JOURS[d.getDay()]+" "+d.getDate()+" "+MOIS[d.getMonth()].slice(0,4)+".";};

  return (
    <div>
      {/* Demandes reçues */}
      {recus.length>0&&(
        <div style={{background:"linear-gradient(135deg,#fef3c7,#fffbeb)",border:"2px solid #f59e0b",borderRadius:14,padding:16,marginBottom:16,boxShadow:"0 2px 12px rgba(245,158,11,0.2)"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#92400e",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🔔</span>{recus.length} demande{recus.length>1?"s":""} en attente
          </div>
          {recus.map(ech=>{
            const cD=getCouleur(ech.demandeurId);
            return (
              <div key={ech.id} style={{background:"#fff",borderRadius:10,padding:"12px",border:"1px solid #fde68a",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  <span style={{background:cD.bg,color:cD.text,border:"1px solid "+cD.border,borderRadius:6,padding:"2px 7px",fontWeight:700,fontSize:12}}>{ech.demandeurNom}</span>
                  <span style={{fontSize:11,background:ech.type==="don"?"#f5f3ff":"#eff6ff",color:ech.type==="don"?"#6d28d9":"#1d4ed8",borderRadius:20,padding:"2px 8px",fontWeight:700}}>{ech.type==="don"?"🎁 Don":"🔄 Échange"}</span>
                </div>
                <div style={{background:"#f8faff",borderRadius:8,padding:"8px 10px",marginBottom:10,fontSize:12}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:10,color:T.textMuted,marginBottom:2}}>Il donne</div>
                      <span style={{fontWeight:700,color:posteColor[ech.poste],background:posteColor[ech.poste]+"12",borderRadius:5,padding:"2px 7px",fontSize:11}}>{posteLabel[ech.poste]}</span>
                      <span style={{fontSize:11,color:T.textPrimary,fontWeight:600,marginLeft:6}}>{formatD(ech.dateKey)}</span>
                    </div>
                    {ech.leurDateKey&&<>
                      <span style={{color:T.textMuted,fontSize:16}}>⇄</span>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:2}}>Contre votre</div>
                        <span style={{fontWeight:700,color:posteColor[ech.leurPoste]||"#4f6ef7",background:(posteColor[ech.leurPoste]||"#4f6ef7")+"12",borderRadius:5,padding:"2px 7px",fontSize:11}}>{posteLabel[ech.leurPoste]||"Poste"}</span>
                        <span style={{fontSize:11,color:T.textPrimary,fontWeight:600,marginLeft:6}}>{formatD(ech.leurDateKey)}</span>
                      </div>
                    </>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn onClick={()=>appliquer(ech)} variant="success" small>✓ Accepter</Btn>
                  <Btn onClick={()=>refuser(ech.id)} variant="danger" small>✕ Refuser</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton créer */}
      {etape==="liste"&&<Btn onClick={()=>setEtape("creer")} full>+ Proposer un échange ou un don</Btn>}

      {/* Formulaire */}
      {etape==="creer"&&(
        <div style={{background:"#fff",borderRadius:14,border:"1px solid "+T.border,padding:16,marginBottom:16,boxShadow:"0 2px 12px rgba(79,110,247,0.08)"}}>
          <div style={{fontWeight:800,fontSize:15,color:T.textPrimary,marginBottom:14}}>Nouvelle demande</div>

          {/* Type */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[["echange","🔄 Échange","Contre un jour de quelqu'un","#1d4ed8","#eff6ff","#bfdbfe"],
              ["don","🎁 Don","Je donne sans contrepartie","#6d28d9","#f5f3ff","#ddd6fe"]].map(([t,label,desc,col,bg,border])=>(
              <button key={t} onClick={()=>{setTypeEchange(t);setLeurJour(null);setSelCibles([]);setEtapeCreer("monJour");}}
                style={{padding:"11px 8px",borderRadius:11,border:"2px solid "+(typeEchange===t?border:T.border),background:typeEchange===t?bg:"#f8faff",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <div style={{fontSize:13,fontWeight:800,color:typeEchange===t?col:T.textPrimary,marginBottom:2}}>{label}</div>
                <div style={{fontSize:10,color:T.textMuted}}>{desc}</div>
              </button>
            ))}
          </div>

          {/* Étape 1 : Mon jour */}
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:etapeCreer==="monJour"?"#4f6ef7":"#d1fae5",color:etapeCreer==="monJour"?"#fff":"#065f46",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,flexShrink:0}}>{monJour?"✓":"1"}</div>
              <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>Mon jour à {typeEchange==="don"?"donner":"échanger"}</span>
              {monJour&&<span style={{fontSize:11,background:posteColor[monJour.poste]+"12",color:posteColor[monJour.poste],borderRadius:6,padding:"2px 8px",fontWeight:700}}>{posteLabel[monJour.poste]} · {formatD(monJour.key)}</span>}
            </div>
            {etapeCreer==="monJour"&&(
              <CalendrierChoix mois={moisSel} titre="Touchez votre jour"
                onSelectJour={(key,st)=>{if(st==="libre")return;setMonJour({key,poste:st});setEtapeCreer(typeEchange==="echange"?"leurJour":"destinataires");}}
                jourSelectionne={monJour} medId={null}/>
            )}
          </div>

          {/* Étape 2 : Leur jour (échange) ou Destinataires (don) */}
          {monJour&&(
            <div style={{marginBottom:14}}>
              {typeEchange==="echange"?(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:etapeCreer==="leurJour"?"#4f6ef7":leurJour?"#d1fae5":"#e8ecf8",color:etapeCreer==="leurJour"?"#fff":leurJour?"#065f46":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,flexShrink:0}}>{leurJour?"✓":"2"}</div>
                    <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>Le jour de qui en échange ?</span>
                    {leurJour&&(()=>{const m=MEDECINS.find(x=>x.id===leurJour.medecinId);const c=getCouleur(leurJour.medecinId);return <span style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:6,padding:"2px 8px",fontWeight:700,fontSize:11}}>{m?.nom} · {posteLabel[leurJour.poste]} · {formatD(leurJour.key)}</span>;})()}
                  </div>

                  {(etapeCreer==="leurJour"||leurJour)&&(
                    <div>
                      {/* Sélecteur médecin cible */}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        {MEDECINS.filter(m=>m.id!==currentUser.id).map(m=>{
                          const c=getCouleur(m.id);
                          const isActive=leurJour?.medecinId===m.id;
                          const dispo=peutRecevoir(m.id,monJour.key);
                          return <button key={m.id} onClick={()=>{setLeurJour(prev=>({...prev,medecinId:m.id,key:null,poste:null}));setMoisCible(moisSel);}}
                            style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid "+(isActive?c.border:T.border),background:isActive?c.bg:"#f8faff",color:isActive?c.text:T.textSecondary,fontWeight:isActive?700:500,cursor:"pointer",fontSize:11,position:"relative"}}>
                            {m.nom}
                            {!dispo&&<span style={{position:"absolute",top:-4,right:-4,width:10,height:10,borderRadius:"50%",background:T.red,border:"1.5px solid #fff"}}/>}
                          </button>;
                        })}
                      </div>
                      <div style={{fontSize:10,color:T.textMuted,marginBottom:8}}>
                        🔴 = déjà affecté ce jour ou garde la veille (vous pouvez quand même proposer un échange sur un autre jour)
                      </div>
                      {/* Calendrier du médecin cible */}
                      {leurJour?.medecinId&&(
                        <CalendrierChoix mois={moisCible} titre={"Planning de "+MEDECINS.find(m=>m.id===leurJour.medecinId)?.nom}
                          onSelectJour={(key,st)=>setLeurJour(prev=>({...prev,key,poste:st}))}
                          jourSelectionne={leurJour?.key?{key:leurJour.key}:null} medId={leurJour.medecinId}/>
                      )}
                    </div>
                  )}
                </div>
              ):(
                /* Don : sélectionner destinataires ou remplaçant */
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"#4f6ef7",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,flexShrink:0}}>2</div>
                    <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>Donner à</span>
                  </div>
                  {/* Mode médecin ou remplaçant */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[["medecin","👤 Un médecin","Il reçoit la demande"],["remplacant","🔄 Un remplaçant","Automatique, reste dans votre colonne"]].map(([m,label,desc])=>(
                      <button key={m} onClick={()=>{setDonMode(m);setSelCibles([]);setNomRempDon("");}}
                        style={{padding:"9px 8px",borderRadius:9,border:"2px solid "+(donMode===m?"#4f6ef7":T.border),background:donMode===m?"#eff2ff":"#f8faff",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                        <div style={{fontSize:11,fontWeight:800,color:donMode===m?"#4f6ef7":T.textPrimary,marginBottom:1}}>{label}</div>
                        <div style={{fontSize:9,color:T.textMuted}}>{desc}</div>
                      </button>
                    ))}
                  </div>
                  {donMode==="remplacant"&&(
                    <div style={{marginBottom:10}}>
                      <input type="text" value={nomRempDon} onChange={e=>setNomRempDon(e.target.value)}
                        placeholder="Nom du remplaçant"
                        style={{width:"100%",padding:"11px 12px",background:"#f8faff",border:"2px solid #4f6ef7",borderRadius:9,fontSize:13,color:T.textPrimary,boxSizing:"border-box",outline:"none"}}/>
                      <div style={{fontSize:11,color:T.textMuted,marginTop:6}}>
                        ✓ Automatique — le remplaçant apparaîtra dans votre colonne
                      </div>
                    </div>
                  )}
                  {donMode==="medecin"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {(()=>{
                      const dispo=MEDECINS.filter(m=>m.id!==currentUser.id&&peutRecevoir(m.id,monJour.key));
                      const indispo=MEDECINS.filter(m=>m.id!==currentUser.id&&!peutRecevoir(m.id,monJour.key));
                      return <>
                        {dispo.length===0&&<p style={{color:T.textMuted,fontSize:12,textAlign:"center",padding:"12px 0"}}>Aucun médecin disponible ce jour.</p>}
                        {dispo.map(m=>{
                          const c=getCouleur(m.id);
                          const isActive=selCibles.includes(m.id);
                          return (
                            <button key={m.id} onClick={()=>setSelCibles(prev=>prev.includes(m.id)?prev.filter(x=>x!==m.id):[...prev,m.id])}
                              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"2px solid "+(isActive?c.border:T.border),background:isActive?c.bg:"#f8faff",cursor:"pointer",transition:"all 0.15s"}}>
                              <div style={{width:30,height:30,borderRadius:"50%",background:isActive?c.text:"#e8ecf8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:isActive?"#fff":T.textMuted,flexShrink:0}}>{m.nom[0]}</div>
                              <div style={{flex:1,textAlign:"left"}}>
                                <div style={{fontSize:12,fontWeight:700,color:isActive?c.text:T.textPrimary}}>{m.nom}</div>
                                <div style={{fontSize:10,color:T.green,fontWeight:600}}>✓ Disponible</div>
                              </div>
                              <div style={{width:18,height:18,borderRadius:4,border:"2px solid "+(isActive?c.border:T.border),background:isActive?c.text:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                {isActive&&<span style={{fontSize:10,color:"#fff",fontWeight:800}}>✓</span>}
                              </div>
                            </button>
                          );
                        })}
                        {indispo.length>0&&(
                          <div style={{marginTop:8,borderTop:"1px solid "+T.border,paddingTop:8}}>
                            <div style={{fontSize:10,color:T.textMuted,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Non disponibles</div>
                            {indispo.map(m=>{
                              const c=getCouleur(m.id);
                              const raison=raisonIndispo(m.id,monJour.key);
                              return (
                                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"#f8f9fc",opacity:0.6,marginBottom:4}}>
                                  <div style={{width:28,height:28,borderRadius:"50%",background:"#e8ecf8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:T.textMuted,flexShrink:0}}>{m.nom[0]}</div>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:12,fontWeight:600,color:T.textMuted}}>{m.nom}</div>
                                    <div style={{fontSize:10,color:T.red,fontWeight:600}}>✕ {raison}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>;
                    })()}
                  </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn onClick={()=>{setEtape("liste");setMonJour(null);setLeurJour(null);setSelCibles([]);setEtapeCreer("monJour");}} variant="ghost">Annuler</Btn>
            <Btn onClick={envoyer}
              disabled={!monJour||(typeEchange==="echange"?(!leurJour?.key):donMode==="remplacant"?!nomRempDon.trim():selCibles.length===0)} full>
              {typeEchange==="don"
                ?(donMode==="remplacant"?"🔄 Placer le remplaçant":`🎁 Proposer (${selCibles.length} pers.)`)
                :"🔄 Envoyer →"
              }
            </Btn>
          </div>
        </div>
      )}

      {/* Mes envois */}
      {envoyes.length>0&&(
        <div style={{marginTop:16}}>
          <SectionTitle>Mes demandes</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {envoyes.map(ech=>{
              const cC=getCouleur(ech.cibleId);
              const st=stCfg[ech.statut]||stCfg.en_attente;
              return (
                <div key={ech.id} style={{background:"#fff",borderRadius:11,padding:"11px 14px",border:"1px solid "+T.border,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,background:ech.type==="don"?"#f5f3ff":"#eff6ff",color:ech.type==="don"?"#6d28d9":"#1d4ed8",borderRadius:20,padding:"1px 7px",fontWeight:700}}>{ech.type==="don"?"🎁":"🔄"}</span>
                    <span style={{background:cC.bg,color:cC.text,border:"1px solid "+cC.border,borderRadius:6,padding:"1px 7px",fontWeight:700,fontSize:11}}>{ech.cibleNom}</span>
                    <span style={{marginLeft:"auto",background:st.bg,color:st.color,borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700}}>{st.label}</span>
                  </div>
                  <div style={{fontSize:11,color:T.textSecondary}}>
                    <span style={{fontWeight:700,color:posteColor[ech.poste],background:posteColor[ech.poste]+"12",borderRadius:5,padding:"1px 5px",marginRight:5}}>{posteLabel[ech.poste]}</span>
                    {formatD(ech.dateKey)}
                    {ech.leurDateKey&&<span style={{color:T.textMuted}}> ⇄ {formatD(ech.leurDateKey)}</span>}
                  </div>
                  {ech.statut!=="en_attente"&&<button onClick={()=>supprimer(ech.id)} style={{marginTop:5,fontSize:10,color:T.textMuted,background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>Supprimer</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {echanges.length===0&&etape==="liste"&&(
        <div style={{textAlign:"center",padding:"40px 16px",color:T.textMuted,marginTop:8}}>
          <div style={{fontSize:40,marginBottom:10,opacity:0.3}}>🔄</div>
          <p style={{fontWeight:600,fontSize:14,color:T.textSecondary,margin:"0 0 4px"}}>Aucun échange en cours</p>
          <p style={{fontSize:12,margin:0}}>Proposez un échange ou un don de garde.</p>
        </div>
      )}
    </div>
  );
}


// ── BESOINS ────────────────────────────────────────────────────────────────────

function getBesoinDefaut(key, annee) {
  const date = dkToDate(key);
  const js = date.getDay();
  const feries = joursFeries(annee);
  const estFerie = feries.has(key);
  const estSemaine = [1,2,3,4,5].includes(js) && !estFerie;
  return {
    garde: 1,
    cs1: estSemaine ? 1 : 0,
    bo1: estSemaine ? 1 : 0,
    bo2: estSemaine ? 1 : 0,
    cs2: 0,
    bo3: 0,
  };
}

function getBesoinEffectif(key, besoins, annee) {
  const defaut = getBesoinDefaut(key, annee);
  const override = besoins[key] || {};
  return {
    garde: override.garde !== undefined ? override.garde : defaut.garde,
    cs1:   override.cs1   !== undefined ? override.cs1   : defaut.cs1,
    cs2:   override.cs2   !== undefined ? override.cs2   : defaut.cs2,
    bo1:   override.bo1   !== undefined ? override.bo1   : defaut.bo1,
    bo2:   override.bo2   !== undefined ? override.bo2   : defaut.bo2,
    bo3:   override.bo3   !== undefined ? override.bo3   : defaut.bo3,
  };
}

const POSTES = [
  { id:'garde', label:'Garde', color:'#f43f5e',  desc:'Astreinte 24h' },
  { id:'cs1',   label:'CS1',   color:'#10b981',  desc:'Consultation 1' },
  { id:'cs2',   label:'CS2',   color:'#34d399',  desc:'Consultation 2' },
  { id:'bo1',   label:'BO1',   color:'#0ea5e9',  desc:'Bloc op. 1' },
  { id:'bo2',   label:'BO2',   color:'#38bdf8',  desc:'Bloc op. 2' },
  { id:'bo3',   label:'BO3',   color:'#7dd3fc',  desc:'Bloc op. 3' },
];

function VueBesoins({ besoins, setBesoins, annee, isAdmin }) {
  const [mois, setMois] = useState(new Date().getMonth());
  const [jourSel, setJourSel] = useState(null);
  const [editComment, setEditComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const feries = useMemo(() => joursFeries(annee), [annee]);

  const prem = new Date(annee, mois, 1), dern = new Date(annee, mois+1, 0);
  const off = (prem.getDay()+6)%7, cal = [];
  for (let i = 0; i < off; i++) cal.push(null);
  for (let d = 1; d <= dern.getDate(); d++) cal.push(dk(new Date(annee, mois, d)));
  while (cal.length % 7 !== 0) cal.push(null);

  const togglePoste = (key, poste) => {
    if (!isAdmin) return;
    const defaut = getBesoinDefaut(key, annee);
    const actuel = getBesoinEffectif(key, besoins, annee);
    const nouvelleVal = actuel[poste] ? 0 : 1;
    // Si la nouvelle valeur == défaut, on supprime l'override
    const newOverride = { ...(besoins[key] || {}) };
    if (nouvelleVal === defaut[poste]) {
      delete newOverride[poste];
    } else {
      newOverride[poste] = nouvelleVal;
    }
    const newBesoins = { ...besoins };
    if (Object.keys(newOverride).length === 0) {
      delete newBesoins[key];
    } else {
      newBesoins[key] = newOverride;
    }
    setBesoins(newBesoins);
  };

  const resetJour = (key) => {
    const n = { ...besoins };
    delete n[key];
    setBesoins(n);
    setJourSel(null);
  };

  // Compter les overrides du mois
  const nbOverrides = cal.filter(k => k && besoins[k] && Object.keys(besoins[k]).length > 0).length;

  return (
    <div>
      {/* Légende postes */}
      <Card style={{ marginBottom: 16, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, marginBottom: 10 }}>Postes par défaut</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {POSTES.map(p => {
            const defaut = p.id === 'garde' ? "Tous les jours" : ['cs1','bo1','bo2'].includes(p.id) ? "Lun–Ven (hors férié)" : "Aucun (exceptionnel)";
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.label}</span>
                <span style={{ fontSize: 10, color: T.textMuted }}>{defaut}</span>
              </div>
            );
          })}
        </div>
        {!isAdmin && (
          <div style={{ marginTop: 10, fontSize: 11, color: T.textMuted, borderTop: "1px solid " + T.border, paddingTop: 8 }}>
            👁 Vue lecture seule — seul l'administrateur peut modifier les besoins.
          </div>
        )}
      </Card>

      {/* Sélecteur mois */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {MOIS.map((m, i) => {
          const active = mois === i;
          const pfx = annee + "-" + String(i+1).padStart(2, "0");
          const aOverride = Object.keys(besoins).some(k => k.startsWith(pfx));
          return (
            <button key={i} onClick={() => { setMois(i); setJourSel(null); setEditComment(false); }}
              style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid " + (active ? T.amber : T.border), background: active ? "rgba(245,158,11,0.1)" : "transparent", color: active ? T.amber : aOverride ? T.textSecondary : T.textMuted, fontWeight: active ? 700 : aOverride ? 600 : 400, cursor: "pointer", fontSize: 10 }} onClick={() => { setMois(i); setJourSel(null); setEditComment(false); }}>
              {m.slice(0,3)}{aOverride && !active ? " •" : ""}
            </button>
          );
        })}
      </div>

      {nbOverrides > 0 && (
        <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginBottom: 8 }}>
          ⚡ {nbOverrides} jour{nbOverrides > 1 ? "s" : ""} modifié{nbOverrides > 1 ? "s" : ""} ce mois par rapport aux défauts
        </div>
      )}

      {/* Calendrier */}
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid " + T.border }}>
          {["L","M","M","J","V","S","D"].map((j,i) => (
            <div key={i} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: i >= 5 ? T.textMuted : T.textSecondary }}>{j}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {cal.map((key, idx) => {
            if (!key) return <div key={idx} style={{ minHeight: 60, borderRight: "1px solid " + T.border + "22", borderBottom: "1px solid " + T.border + "22" }} />;
            const date = dkToDate(key);
            const js = date.getDay();
            const estWE = [0,6].includes(js);
            const estF = feries.has(key);
            const b = getBesoinEffectif(key, besoins, annee);
            const hasOverride = besoins[key] && Object.keys(besoins[key]).length > 0;
            const isSel = jourSel === key;

            return (
              <div key={key} onClick={() => { if(isSel){setJourSel(null);setEditComment(false);}else{setJourSel(key);setEditComment(false);setCommentDraft((besoins[key]||{}).commentaire||'');} }}
                style={{ minHeight: 60, background: isSel ? "rgba(245,158,11,0.1)" : estF ? "rgba(245,158,11,0.04)" : estWE ? "rgba(255,255,255,0.01)" : "transparent", borderRight: "1px solid " + T.border + "22", borderBottom: "1px solid " + T.border + "22", cursor: "pointer", padding: 4, outline: isSel ? "2px solid " + T.amber : "none", outlineOffset: -2, transition: "background 0.1s", WebkitTapHighlightColor: "transparent" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: estF ? "#f59e0b" : estWE ? T.textMuted : T.textSecondary, marginBottom: 3, display: "flex", alignItems: "center", gap: 2 }}>
                  {date.getDate()}
                  {estF && <span style={{ fontSize: 7, background: "rgba(245,158,11,0.2)", color: "#f59e0b", borderRadius: 2, padding: "0 2px" }}>F</span>}
                  {hasOverride && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.amber, display: "inline-block", marginLeft: 1 }} />}
                </div>
                {/* Pastilles postes actifs */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                  {POSTES.filter(p => b[p.id]).map(p => (
                    <div key={p.id} style={{ width: 6, height: 6, borderRadius: 2, background: p.color }} title={p.label} />
                  ))}
                  {(besoins[key]||{}).commentaire && (
                    <div title={(besoins[key]||{}).commentaire} style={{ fontSize: 8, marginLeft: 1 }}>💬</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Panneau de modification du jour sélectionné */}
      {jourSel && (() => {
        const date = dkToDate(jourSel);
        const b = getBesoinEffectif(jourSel, besoins, annee);
        const hasOverride = besoins[jourSel] && Object.keys(besoins[jourSel]).length > 0;
        return (
          <Card style={{ marginBottom: 16, borderColor: T.amber + "44" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: T.textPrimary }}>
                  {JOURS[date.getDay()]} {date.getDate()} {MOIS[date.getMonth()]}
                </div>
                {hasOverride && <div style={{ fontSize: 11, color: T.amber, marginTop: 2 }}>⚡ Modifié par rapport au défaut</div>}
              </div>
              {isAdmin && hasOverride && (
                <Btn onClick={() => resetJour(jourSel)} variant="warn" small>↺ Réinitialiser</Btn>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {POSTES.map(p => {
                const actif = b[p.id] === 1;
                const defaut = getBesoinDefaut(jourSel, annee)[p.id];
                const modifie = besoins[jourSel]?.[p.id] !== undefined;
                return (
                  <button key={p.id} onClick={() => isAdmin && togglePoste(jourSel, p.id)}
                    style={{ padding: "10px 8px", borderRadius: 10, border: "1.5px solid " + (actif ? p.color : T.border), background: actif ? p.color + "18" : "transparent", cursor: isAdmin ? "pointer" : "default", transition: "all 0.15s", position: "relative" }}>
                    {modifie && <div style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: T.amber }} />}
                    <div style={{ fontSize: 13, fontWeight: 800, color: actif ? p.color : T.textMuted, marginBottom: 3 }}>{p.label}</div>
                    <div style={{ fontSize: 9, color: actif ? p.color : T.textMuted, opacity: 0.8 }}>{p.desc}</div>
                    <div style={{ marginTop: 6, width: 20, height: 20, borderRadius: "50%", background: actif ? p.color : T.border, display: "flex", alignItems: "center", justifyContent: "center", margin: "6px auto 0", transition: "all 0.15s" }}>
                      {actif && <span style={{ fontSize: 10, color: "#fff", fontWeight: 800 }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Commentaire */}
            <div style={{ marginTop: 14, borderTop: "1px solid " + T.border, paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  💬 Commentaire
                </span>
                {isAdmin && !editComment && (
                  <button onClick={() => { setEditComment(true); setCommentDraft((besoins[jourSel]||{}).commentaire||''); }}
                    style={{ fontSize: 11, color: T.teal, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    {(besoins[jourSel]||{}).commentaire ? "Modifier" : "+ Ajouter"}
                  </button>
                )}
              </div>
              {editComment ? (
                <div>
                  <textarea value={commentDraft} onChange={e => setCommentDraft(e.target.value)}
                    placeholder="Ex: Dr Martin absent, salle 3 fermée..."
                    rows={2}
                    style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid " + T.teal, borderRadius: 9, fontSize: 13, color: T.textPrimary, resize: "none", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Btn onClick={() => {
                      const n = { ...besoins };
                      const override = { ...(n[jourSel] || {}) };
                      if (commentDraft.trim()) {
                        override.commentaire = commentDraft.trim();
                      } else {
                        delete override.commentaire;
                      }
                      if (Object.keys(override).length === 0) delete n[jourSel];
                      else n[jourSel] = override;
                      setBesoins(n);
                      setEditComment(false);
                    }} small>Enregistrer</Btn>
                    <Btn onClick={() => { setEditComment(false); setCommentDraft(''); }} variant="ghost" small>Annuler</Btn>
                  </div>
                </div>
              ) : (
                <div>
                  {(besoins[jourSel]||{}).commentaire
                    ? <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: T.amber, fontStyle: "italic" }}>
                        "{(besoins[jourSel]||{}).commentaire}"
                        {isAdmin && <button onClick={() => {
                          const n = {...besoins};
                          const o = {...(n[jourSel]||{})};
                          delete o.commentaire;
                          if(Object.keys(o).length===0) delete n[jourSel]; else n[jourSel]=o;
                          setBesoins(n);
                        }} style={{ marginLeft: 8, fontSize: 10, color: T.red, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>✕</button>}
                      </div>
                    : <div style={{ fontSize: 12, color: T.textMuted, fontStyle: "italic" }}>
                        {isAdmin ? "Aucun commentaire — touchez « + Ajouter »" : "Aucun commentaire pour ce jour."}
                      </div>
                  }
                </div>
              )}
            </div>
            {!isAdmin && (
              <p style={{ fontSize: 11, color: T.textMuted, margin: "10px 0 0", textAlign: "center" }}>
                Seul l'administrateur peut modifier les besoins.
              </p>
            )}
          </Card>
        );
      })()}

      {/* Info génération */}
      <Card style={{ padding: "12px 14px", background: "rgba(14,165,233,0.04)", borderColor: "rgba(14,165,233,0.15)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 6 }}>💡 Comment utiliser</div>
        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7 }}>
          Touchez un jour pour voir et modifier ses besoins.<br/>
          Les <span style={{ color: T.amber, fontWeight: 600 }}>points dorés ●</span> indiquent un jour modifié par rapport aux défauts.<br/>
          Les besoins sont utilisés lors de la génération des <strong style={{ color: T.textPrimary }}>CS/BO</strong> dans l'onglet Périodes.
        </div>
      </Card>
    </div>
  );
}


// ── ÉQUITÉ ─────────────────────────────────────────────────────────────────────

function VueEquite({gardes,bos,csbo,annee}){
  const ja=useMemo(()=>tousJours(annee),[annee]);
  const [vue,setVue]=useState("gardes"); // gardes | cs | bo | unites

  const stats=useMemo(()=>{
    return MEDECINS.map(m=>{
      let gardeCount=0,semaine=0,vendDim=0,samedi=0,cs=0,bo=0,unites=0;
      for(const j of ja){
        const g=gardes[j.key];
        const gardeReel=g&&g.startsWith("PONCTUEL:")?g.split(":")[1]:g;
        if(gardeReel===m.id){
          gardeCount++;unites+=poids(j.key,j.ferie);
          const js=dkToDate(j.key).getDay();
          if([1,2,3,4].includes(js))semaine++;
          if(js===5)vendDim++;
          if(js===6)samedi++;
        }
        if(bos[j.key]===m.id){bo++;unites+=1;}
        const v=csbo[j.key]||{};
        if(v.cs1===m.id||v.cs2===m.id){cs++;unites+=1;}
        if(v.bo1===m.id||v.bo2===m.id||v.bo3===m.id){bo++;unites+=1;}
      }
      return{...m,gardes:gardeCount,semaine,vendDim,samedi,cs,bo,unites};
    });
  },[ja,gardes,bos,csbo]);

  const hasData=stats.some(m=>m.gardes>0||m.cs>0||m.bo>0);
  if(!hasData)return(
    <div style={{textAlign:"center",padding:"60px 16px",color:T.textMuted}}>
      <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>⚖️</div>
      <p style={{fontWeight:600,fontSize:15,color:T.textSecondary,margin:"0 0 6px"}}>Aucune donnée</p>
      <p style={{fontSize:13,margin:0}}>Générez d'abord une période.</p>
    </div>
  );

  const tu=stats.reduce((s,m)=>s+m.unites,0);
  const te=MEDECINS.reduce((s,m)=>s+m.etp,0);

  // Catégories affichables
  const categories=[
    {id:"gardes", label:"Gardes",    color:"#f03e3e", fn:m=>m.gardes},
    {id:"semaine",label:"Semaine",   color:"#6366f1", fn:m=>m.semaine},
    {id:"venddim",label:"Ven/Dim",   color:"#8b5cf6", fn:m=>m.vendDim},
    {id:"samedi", label:"Samedi",    color:"#f59e0b", fn:m=>m.samedi},
    {id:"cs",     label:"CS",        color:"#00b86b", fn:m=>m.cs},
    {id:"bo",     label:"BO",        color:"#4f6ef7", fn:m=>m.bo},
    {id:"unites", label:"Unités",    color:"#0ea5e9", fn:m=>m.unites},
  ];

  const catActive=categories.find(c=>c.id===vue)||categories[0];
  const maxVal=Math.max(1,...stats.map(catActive.fn));

  return (
    <div>
      {/* Totaux rapides */}
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {[
          ["Gardes",stats.reduce((s,m)=>s+m.gardes,0),"#f03e3e"],
          ["CS",stats.reduce((s,m)=>s+m.cs,0),"#00b86b"],
          ["BO",stats.reduce((s,m)=>s+m.bo,0),"#4f6ef7"],
          ["Unités",tu.toFixed(0),"#0ea5e9"],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"#fff",borderRadius:10,padding:"10px 14px",textAlign:"center",border:"1px solid "+T.border,flexShrink:0,minWidth:72,boxShadow:"0 1px 4px rgba(79,110,247,0.06)"}}>
            <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
            <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Sélecteur catégorie */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
        {categories.map(cat=>(
          <button key={cat.id} onClick={()=>setVue(cat.id)}
            style={{padding:"5px 11px",borderRadius:20,border:"1.5px solid "+(vue===cat.id?cat.color:T.border),background:vue===cat.id?cat.color+"12":"#fff",color:vue===cat.id?cat.color:T.textMuted,fontWeight:vue===cat.id?700:500,cursor:"pointer",fontSize:11,transition:"all 0.15s"}}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Vue barres comparatives */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid "+T.border,padding:16,marginBottom:16,boxShadow:"0 1px 4px rgba(79,110,247,0.06)"}}>
        <div style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:14,display:"flex",justifyContent:"space-between"}}>
          <span>{catActive.label} par médecin</span>
          <span style={{color:T.textMuted,fontWeight:400}}>Max : {maxVal}{catActive.id==="unites"?"":" "}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[...stats].sort((a,b)=>catActive.fn(b)-catActive.fn(a)).map(m=>{
            const val=catActive.fn(m);
            const pct=Math.round(val/maxVal*100);
            const cu=te>0?tu*m.etp/te:0;
            const ec=m.unites-cu;
            const c=getCouleur(m.id);
            return (
              <div key={m.id}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:6,padding:"2px 8px",fontWeight:700,fontSize:11,minWidth:64,textAlign:"center"}}>{m.nom}</span>
                  <div style={{flex:1,background:"#f0f4ff",borderRadius:99,height:22,overflow:"hidden",position:"relative"}}>
                    <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+catActive.color+","+catActive.color+"aa)",borderRadius:99,transition:"width 0.4s",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6}}>
                      {pct>20&&<span style={{fontSize:10,fontWeight:800,color:"#fff"}}>{catActive.id==="unites"?Number(val).toFixed(1):val}</span>}
                    </div>
                    {pct<=20&&<span style={{position:"absolute",left:pct+"%",top:"50%",transform:"translateY(-50%)",paddingLeft:6,fontSize:10,fontWeight:800,color:catActive.color}}>{catActive.id==="unites"?Number(val).toFixed(1):val}</span>}
                  </div>
                  {catActive.id==="unites"&&(
                    <span style={{fontSize:10,fontWeight:700,color:Math.abs(ec)<1?"#00b86b":ec>0?"#f03e3e":"#f59e0b",minWidth:32,textAlign:"right"}}>{ec>0?"+":""}{ec.toFixed(1)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tableau récap complet */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid "+T.border,overflow:"hidden",boxShadow:"0 1px 4px rgba(79,110,247,0.06)"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid "+T.border,fontSize:12,fontWeight:700,color:T.textSecondary}}>Tableau récapitulatif</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead>
              <tr style={{background:"#f8faff"}}>
                {["Médecin","G","Sem","V/D","Sam","CS","BO","Unités","Écart"].map(h=>(
                  <th key={h} style={{padding:"8px 6px",textAlign:"center",fontWeight:700,color:T.textMuted,borderBottom:"1px solid "+T.border,whiteSpace:"nowrap",fontSize:10}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((m,i)=>{
                const cu=te>0?tu*m.etp/te:0;
                const ec=m.unites-cu;
                const c=getCouleur(m.id);
                const ecColor=Math.abs(ec)<1?"#00b86b":ec>0?"#f03e3e":"#f59e0b";
                return (
                  <tr key={m.id} style={{borderBottom:"1px solid "+T.border+"44",background:i%2===0?"#fff":"#fafbff"}}>
                    <td style={{padding:"8px 6px",textAlign:"center"}}>
                      <span style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:5,padding:"1px 6px",fontWeight:700,fontSize:10}}>{m.nom.slice(0,6)}</span>
                    </td>
                    {[m.gardes,m.semaine,m.vendDim,m.samedi,m.cs,m.bo].map((v,j)=>(
                      <td key={j} style={{padding:"8px 6px",textAlign:"center",fontWeight:700,fontSize:12,color:v===0?T.textMuted:[
                        "#f03e3e","#6366f1","#8b5cf6","#f59e0b","#00b86b","#4f6ef7"
                      ][j]}}>{v}</td>
                    ))}
                    <td style={{padding:"8px 6px",textAlign:"center",fontWeight:700,fontSize:11,color:T.textPrimary}}>{m.unites.toFixed(1)}</td>
                    <td style={{padding:"8px 6px",textAlign:"center",fontWeight:800,fontSize:11,color:ecColor}}>{ec>0?"+":""}{ec.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ── INDISPOS ───────────────────────────────────────────────────────────────────

function VueIndispos({indispos,setIndispos,currentUser,annee}){
  const [mois,setMois]=useState(new Date().getMonth());
  const [selMed,setSelMed]=useState(currentUser.role==="medecin"?currentUser.id:"");
  const feries=useMemo(()=>joursFeries(annee),[annee]);

  const ipj=useMemo(()=>{
    const map={};
    for(const ind of indispos){
      const d=dkToDate(ind.dateDebut),f=dkToDate(ind.dateFin);
      while(d<=f){const k=dk(d);(map[k]=map[k]||[]).push(ind);d.setDate(d.getDate()+1);}
    }
    return map;
  },[indispos]);

  const prem=new Date(annee,mois,1),dern=new Date(annee,mois+1,0);
  const off=(prem.getDay()+6)%7,cal=[];
  for(let i=0;i<off;i++)cal.push(null);
  for(let d=1;d<=dern.getDate();d++)cal.push(dk(new Date(annee,mois,d)));
  while(cal.length%7!==0)cal.push(null);

  const estIndispoJour=(medId,key)=>indispos.some(i=>i.medecinId===medId&&key>=i.dateDebut&&key<=i.dateFin);

  const toggleIndispo=(key)=>{
    if(!selMed)return;
    if(estIndispoJour(selMed,key)){
      setIndispos(prev=>prev.filter(ind=>{
        if(ind.medecinId!==selMed)return true;
        return !(key>=ind.dateDebut&&key<=ind.dateFin);
      }));
    }else{
      setIndispos(prev=>[...prev,{id:Date.now()+"_"+key,medecinId:selMed,dateDebut:key,dateFin:key,motif:"Indisponible"}]);
    }
  };

  const supprimerTout=(medId)=>{setIndispos(prev=>prev.filter(i=>i.medecinId!==medId));};

  const cSel=selMed?getCouleur(selMed):{};
  const medSelActif=MEDECINS.find(m=>m.id===selMed);

  return (
    <div>
      {/* Sélecteur médecin — chips horizontaux */}
      <div style={{marginBottom:14}}>
        <SectionTitle>Sélectionner un médecin</SectionTitle>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {(currentUser.role==="admin"?MEDECINS:[MEDECINS.find(m=>m.id===currentUser.id)].filter(Boolean)).map(m=>{
            const c=getCouleur(m.id);
            const isActive=selMed===m.id;
            const nbJ=(()=>{const s=new Set();indispos.filter(i=>i.medecinId===m.id).forEach(i=>{const d=dkToDate(i.dateDebut),f=dkToDate(i.dateFin);while(d<=f){s.add(dk(d));d.setDate(d.getDate()+1);}});return s.size;})();
            return (
              <button key={m.id} onClick={()=>setSelMed(isActive?null:m.id)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:12,border:"2px solid "+(isActive?c.border:T.border),background:isActive?c.bg:"#fff",cursor:"pointer",transition:"all 0.15s",boxShadow:isActive?"0 2px 8px "+c.border+"66":"none"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:isActive?c.text:"#e8ecf8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:isActive?"#fff":T.textMuted,transition:"all 0.15s"}}>{m.nom[0]}</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:12,fontWeight:700,color:isActive?c.text:T.textPrimary}}>{m.nom}</div>
                  {nbJ>0&&<div style={{fontSize:9,color:isActive?c.text:T.textMuted,fontWeight:600}}>{nbJ} j. indispo</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instruction */}
      {selMed&&(
        <div style={{background:cSel.bg,border:"1.5px solid "+cSel.border,borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:12,color:cSel.text,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:cSel.text,flexShrink:0}}/>
          Touchez les jours pour marquer / démarquer une indispo de {medSelActif?.nom}
        </div>
      )}
      {!selMed&&(
        <div style={{background:"#f0f4ff",border:"1px solid #c7d2ec",borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:12,color:T.textMuted}}>
          👆 Sélectionnez un médecin ci-dessus
        </div>
      )}

      {/* Mois */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
        {MOIS.map((m,i)=>{
          const active=mois===i;
          const pfx=annee+"-"+String(i+1).padStart(2,"0");
          const aInd=selMed&&indispos.some(ind=>ind.medecinId===selMed&&(ind.dateDebut.startsWith(pfx)||ind.dateFin.startsWith(pfx)));
          return (
            <button key={i} onClick={()=>setMois(i)}
              style={{padding:"4px 8px",borderRadius:7,border:"1px solid "+(active?cSel.border||"#4f6ef7":T.border),background:active?cSel.bg||"#eff2ff":"#fff",color:active?cSel.text||"#4f6ef7":aInd?T.textSecondary:T.textMuted,fontWeight:active?700:aInd?600:400,cursor:"pointer",fontSize:10}}>
              {m.slice(0,3)}{aInd&&!active?" •":""}
            </button>
          );
        })}
      </div>

      {/* Calendrier */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid "+T.border,overflow:"hidden",marginBottom:16,boxShadow:"0 2px 12px rgba(79,110,247,0.06)"}}>
        {/* En-tête jours */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"linear-gradient(90deg,#4f6ef7,#7c3aed)"}}>
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((j,i)=>(
            <div key={j} style={{padding:"8px 0",textAlign:"center",fontSize:10,fontWeight:700,color:i>=5?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.9)"}}>{j}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {cal.map((key,idx)=>{
            if(!key)return <div key={idx} style={{minHeight:56,background:"#f8f9fc",borderRight:"1px solid #eef0f8",borderBottom:"1px solid #eef0f8"}}/>;
            const date=dkToDate(key);
            const js=date.getDay();
            const estWE=[0,6].includes(js),estF=feries.has(key);
            const estGrise=estWE||estF;
            const indsJour=ipj[key]||[];
            const estSelIndispo=selMed&&estIndispoJour(selMed,key);
            const autresInds=indsJour.filter(i=>i.medecinId!==selMed);

            return (
              <div key={key} onClick={()=>toggleIndispo(key)}
                style={{minHeight:56,background:estSelIndispo?cSel.bg||"#eff2ff":estGrise?"#f0f2fa":"#fff",borderRight:"1px solid #eef0f8",borderBottom:"1px solid #eef0f8",cursor:selMed?"pointer":"default",padding:5,outline:estSelIndispo?"2px solid "+(cSel.border||"#4f6ef7"):"none",outlineOffset:-2,transition:"background 0.12s",WebkitTapHighlightColor:"transparent",position:"relative"}}>
                <div style={{fontSize:12,fontWeight:700,color:estF?"#b45309":estWE?"#9ca3af":T.textSecondary,marginBottom:4}}>
                  {date.getDate()}
                  {estF&&<span style={{marginLeft:3,fontSize:7,background:"#fef3c7",color:"#d97706",borderRadius:3,padding:"0 3px",fontWeight:700}}>F</span>}
                </div>
                {/* Badge médecin actif indispo */}
                {estSelIndispo&&(
                  <div style={{background:cSel.border,borderRadius:5,padding:"2px 0",textAlign:"center",fontSize:9,fontWeight:800,color:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>✕ {medSelActif?.nom.slice(0,3)}</div>
                )}
                {/* Autres médecins */}
                <div style={{display:"flex",flexDirection:"column",gap:2,marginTop:estSelIndispo?3:0}}>
                  {autresInds.slice(0,2).map((ind,i)=>{
                    const c=getCouleur(ind.medecinId);
                    const m=MEDECINS.find(x=>x.id===ind.medecinId);
                    return <div key={i} style={{background:c.bg,color:c.text,borderRadius:3,padding:"1px 3px",fontSize:8,fontWeight:700,border:"1px solid "+c.border,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{m?.nom?.slice(0,4)}</div>;
                  })}
                  {autresInds.length>2&&<div style={{fontSize:7,color:T.textMuted,fontWeight:600,textAlign:"center"}}>+{autresInds.length-2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Récap global compact */}
      {indispos.length>0&&(
        <div>
          <SectionTitle>Récapitulatif</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {MEDECINS.map(m=>{
              const s=new Set();indispos.filter(i=>i.medecinId===m.id).forEach(i=>{const d=dkToDate(i.dateDebut),f=dkToDate(i.dateFin);while(d<=f){s.add(dk(d));d.setDate(d.getDate()+1);}});
              if(s.size===0)return null;
              const c=getCouleur(m.id);
              return (
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:10,padding:"10px 14px",border:"1px solid "+T.border,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <span style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:6,padding:"2px 8px",fontWeight:700,fontSize:12}}>{m.nom}</span>
                  <span style={{fontSize:12,color:T.textSecondary}}>{s.size} jour{s.size>1?"s":""} indisponible{s.size>1?"s":""}</span>
                  {(currentUser.role==="admin"||currentUser.id===m.id)&&(
                    <button onClick={()=>supprimerTout(m.id)} style={{marginLeft:"auto",background:"rgba(240,62,62,0.06)",color:"#f03e3e",border:"1px solid rgba(240,62,62,0.2)",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10,fontWeight:600}}>Tout effacer</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ── CONTRAINTES ────────────────────────────────────────────────────────────────

function VueContraintes({contraintes,setContraintes,currentUser}){
  const [mid,setMid]=useState(currentUser.id);
  const [type,setType]=useState("max_par_mois");
  const [val,setVal]=useState("mercredi");
  const [max,setMax]=useState(2);
  const ajouter=()=>{if(!mid)return;setContraintes(prev=>[...prev,{id:Date.now(),medecinId:mid,type,valeur:val,max:Number(max)}]);};
  // Tout le monde voit toutes les contraintes, triées par prénom
  const liste=[...contraintes].sort((a,b)=>{
    const mA=MEDECINS.find(m=>m.id===a.medecinId)?.nom||"";
    const mB=MEDECINS.find(m=>m.id===b.medecinId)?.nom||"";
    return mA.localeCompare(mB);
  });
  const sel={width:"100%",padding:"11px 12px",background:"#f8faff",border:"1.5px solid "+T.border,borderRadius:10,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",marginBottom:10};
  return (
    <div>
      <SectionTitle>Nouvelle contrainte</SectionTitle>
      <Card style={{marginBottom:16}}>
        {currentUser.role==="admin"&&(
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:T.textSecondary,display:"block",marginBottom:5,textTransform:"uppercase"}}>Médecin</label>
            <select value={mid} onChange={e=>setMid(e.target.value)} style={{...sel,background:"#f8faff"}}>
              <option value="" style={{background:T.surfaceUp}}>— Choisir —</option>
              {MEDECINS.map(m=><option key={m.id} value={m.id} style={{background:T.surfaceUp}}>{m.nom}</option>)}
            </select>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:T.textSecondary,display:"block",marginBottom:5,textTransform:"uppercase"}}>Type</label>
            <select value={type} onChange={e=>setType(e.target.value)} style={{...sel,marginBottom:0}}>
              <option value="max_par_mois" style={{background:T.surfaceUp}}>Max/mois</option>
              <option value="jour_interdit" style={{background:T.surfaceUp}}>Jour interdit</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:T.textSecondary,display:"block",marginBottom:5,textTransform:"uppercase"}}>Jour</label>
            <select value={val} onChange={e=>setVal(e.target.value)} style={{...sel,marginBottom:0}}>
              {["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"].map(j=><option key={j} value={j} style={{background:T.surfaceUp}}>{j.charAt(0).toUpperCase()+j.slice(1)}</option>)}
            </select>
          </div>
        </div>
        {type==="max_par_mois"&&(
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:T.textSecondary,display:"block",marginBottom:5,textTransform:"uppercase"}}>Maximum par mois</label>
            <input type="number" value={max} onChange={e=>setMax(e.target.value)} min={0} max={5} style={{...sel,marginBottom:0}}/>
          </div>
        )}
        <Btn onClick={ajouter} full>+ Ajouter</Btn>
      </Card>
      <SectionTitle>Contraintes actives</SectionTitle>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {liste.length===0&&<p style={{color:T.textMuted,fontSize:13}}>Aucune contrainte.</p>}
        {liste.map(con=>{
          const m=MEDECINS.find(x=>x.id===con.medecinId),c=getCouleur(con.medecinId);
          const ps=currentUser.role==="admin"||currentUser.id===con.medecinId;
          return (
            <Card key={con.id} style={{padding:"10px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:6,padding:"2px 8px",fontWeight:700,fontSize:11}}>{m?.nom}</span>
                <span style={{fontSize:12,color:T.textSecondary,fontWeight:600}}>{con.type==="max_par_mois"?"Max/mois":"Jour interdit"}</span>
                <span style={{fontSize:12,color:T.textMuted}}>{con.valeur.charAt(0).toUpperCase()+con.valeur.slice(1)}{con.type==="max_par_mois"?" — max "+con.max:""}</span>
                {ps&&<button onClick={()=>setContraintes(prev=>prev.filter(x=>x.id!==con.id))} style={{marginLeft:"auto",background:"rgba(244,63,94,0.08)",color:T.red,border:"1px solid rgba(244,63,94,0.2)",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10,fontWeight:600}}>Supprimer</button>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── MON PLANNING ───────────────────────────────────────────────────────────────

function VueMonPlanning({gardes,bos,csbo,currentUser,annee}){
  const ja=useMemo(()=>tousJours(annee),[annee]);
  const today=dk(new Date());
  const feries=useMemo(()=>joursFeries(annee),[annee]);

  // Statut du jour
  const statutAujourdhui=(()=>{
    const g=gardes[today];
    const gardeReel=g&&g.startsWith("PONCTUEL:")?g.split(":")[1]:g;
    if(gardeReel===currentUser.id) return "garde";
    if(bos&&bos[today]===currentUser.id) return "bo";
    const v=csbo[today]||{};
    if(v.cs1===currentUser.id||v.cs2===currentUser.id) return "cs";
    if(v.bo1===currentUser.id||v.bo2===currentUser.id||v.bo3===currentUser.id) return "bo";
    // Repos de garde = garde hier
    const hier=dk(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()-1));
    const gHier=gardes[hier];
    const gardeReelHier=gHier&&gHier.startsWith("PONCTUEL:")?gHier.split(":")[1]:gHier;
    if(gardeReelHier===currentUser.id) return "repos_garde";
    return "repos";
  })();

  const configs={
    garde:{
      gradient:"linear-gradient(145deg,#f03e3e,#c92a2a)",
      emoji:"🛡️",
      titre:"Vous êtes de garde",
      message:"Une nuit importante vous attend. Restez attentif, vous êtes le rempart de vos patients ce soir.",
      badge:"GARDE",
      badgeBg:"rgba(255,255,255,0.2)",
    },
    cs:{
      gradient:"linear-gradient(145deg,#00b86b,#087f5b)",
      emoji:"🩺",
      titre:"Vous êtes en consultation",
      message:"Une belle journée de consultations vous attend. Chaque patient compte sur votre expertise.",
      badge:"CS",
      badgeBg:"rgba(255,255,255,0.2)",
    },
    bo:{
      gradient:"linear-gradient(145deg,#4f6ef7,#3b55e0)",
      emoji:"⚕️",
      titre:"Vous êtes au bloc",
      message:"Le bloc opératoire vous attend. Concentration, précision, excellence — votre quotidien.",
      badge:"BO",
      badgeBg:"rgba(255,255,255,0.2)",
    },
    repos_garde:{
      gradient:"linear-gradient(145deg,#7c3aed,#5b21b6)",
      emoji:"😴",
      titre:"Repos post-garde",
      message:"Vous avez assuré hier soir. Reposez-vous bien, vous l'avez amplement mérité.",
      badge:"REPOS DE GARDE",
      badgeBg:"rgba(255,255,255,0.2)",
    },
    repos:{
      gradient:"linear-gradient(145deg,#0ea5e9,#0369a1)",
      emoji:"☀️",
      titre:"Vous êtes en repos",
      message:"Profitez pleinement de cette journée ! Déconnectez, rechargez les batteries, vous le méritez.",
      badge:"REPOS",
      badgeBg:"rgba(255,255,255,0.2)",
    },
  };

  const cfg=configs[statutAujourdhui];
  const dateAuj=new Date();
  const dateStr=JOURS[dateAuj.getDay()]+" "+dateAuj.getDate()+" "+MOIS[dateAuj.getMonth()]+" "+annee;
  const estFerie=feries.has(today);

  // Prochaines affectations
  const prochaines=ja.filter(j=>j.key>today).filter(j=>{
    const g=gardes[j.key];
    const gardeReel=g&&g.startsWith("PONCTUEL:")?g.split(":")[1]:g;
    if(gardeReel===currentUser.id) return true;
    if(bos&&bos[j.key]===currentUser.id) return true;
    const v=csbo[j.key]||{};
    return v.cs1===currentUser.id||v.cs2===currentUser.id||v.bo1===currentUser.id||v.bo2===currentUser.id||v.bo3===currentUser.id;
  }).slice(0,5).map(j=>{
    const g=gardes[j.key];
    const gardeReel=g&&g.startsWith("PONCTUEL:")?g.split(":")[1]:g;
    const v=csbo[j.key]||{};
    const postes=[];
    if(gardeReel===currentUser.id) postes.push({label:"Garde",color:"#f03e3e",bg:"#fff0f0",border:"#fca5a5"});
    if(bos&&bos[j.key]===currentUser.id) postes.push({label:"BO",color:"#4f6ef7",bg:"#eff2ff",border:"#a5b4fc"});
    if(v.cs1===currentUser.id||v.cs2===currentUser.id) postes.push({label:"CS",color:"#00b86b",bg:"#f0fdf6",border:"#6ee7b7"});
    if(v.bo1===currentUser.id||v.bo2===currentUser.id||v.bo3===currentUser.id) postes.push({label:"BO",color:"#4f6ef7",bg:"#eff2ff",border:"#a5b4fc"});
    const date=dkToDate(j.key);
    return {key:j.key,date,postes,js:j.js,ferie:j.ferie};
  });

  return (
    <div style={{paddingBottom:8}}>
      {/* Carte principale du jour */}
      <div style={{background:cfg.gradient,borderRadius:20,padding:"28px 20px 24px",marginBottom:20,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}}/>
        <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>

        <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>
          {dateStr}{estFerie&&" · Jour férié 🎉"}
        </div>

        <div style={{fontSize:52,marginBottom:8,lineHeight:1}}>{cfg.emoji}</div>

        <div style={{fontSize:11,fontWeight:700,background:cfg.badgeBg,color:"#fff",borderRadius:20,padding:"3px 10px",display:"inline-block",marginBottom:10,letterSpacing:"0.06em"}}>
          {cfg.badge}
        </div>

        <h2 style={{fontSize:22,fontWeight:800,color:"#fff",margin:"0 0 10px",lineHeight:1.2}}>
          Bonjour {currentUser.nom},<br/>{cfg.titre}
        </h2>

        <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",margin:0,lineHeight:1.6,fontStyle:"italic"}}>
          "{cfg.message}"
        </p>
      </div>

      {/* Prochaines affectations */}
      {prochaines.length>0?(
        <div>
          <SectionTitle>Prochaines affectations</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {prochaines.map(p=>{
              const date=p.date;
              const estWE=[0,6].includes(p.js);
              return (
                <div key={p.key} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:"1px solid "+T.border,display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 4px rgba(79,110,247,0.06)"}}>
                  <div style={{textAlign:"center",minWidth:44,background:estWE?"#f0f2fa":p.ferie?"#fef3c7":"#f0f4ff",borderRadius:10,padding:"6px 8px"}}>
                    <div style={{fontSize:10,fontWeight:600,color:p.ferie?"#b45309":estWE?"#6b7280":"#4f6ef7",textTransform:"uppercase"}}>{JOURS[date.getDay()].slice(0,3)}</div>
                    <div style={{fontSize:20,fontWeight:800,color:p.ferie?"#b45309":estWE?"#374151":T.textPrimary,lineHeight:1.1}}>{date.getDate()}</div>
                    <div style={{fontSize:9,color:T.textMuted}}>{MOIS[date.getMonth()].slice(0,3)}</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {p.postes.map((pos,i)=>(
                      <span key={i} style={{background:pos.bg,color:pos.color,border:"1px solid "+pos.border,borderRadius:6,padding:"4px 10px",fontWeight:800,fontSize:12}}>
                        {pos.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ):(
        <div style={{textAlign:"center",padding:"32px 16px",color:T.textMuted}}>
          <div style={{fontSize:36,marginBottom:8,opacity:0.3}}>📅</div>
          <p style={{fontWeight:600,fontSize:14,color:T.textSecondary,margin:"0 0 4px"}}>Aucune affectation à venir</p>
          <p style={{fontSize:12,margin:0}}>Contactez l'administrateur pour générer le planning.</p>
        </div>
      )}
    </div>
  );
}


// ── APP ────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "main";

export default function App(){
  const [user,setUser]=useState(null);
  const [tab,setTab]=useState("periodes");
  const [annee,setAnnee]=useState(new Date().getFullYear());
  const [gardes,setGardes]=useState({});
  const [stats,setStats]=useState([]);
  const [indispos,setIndispos]=useState([]);
  const [contraintes,setContraintes]=useState([]);
  const [periodes,setPeriodes]=useState([]);
  const [remplacants,setRemplacants]=useState([]);
  const [bos,setBos]=useState({});
  const [csbo,setCsbo]=useState({});
  const [besoins,setBesoins]=useState({});
  const [echanges,setEchanges]=useState([]);
  const [toast,setToast]=useState(null);
  const [menu,setMenu]=useState(false);
  const [loading,setLoading]=useState(true);
  const clientId=useRef(Math.random().toString(36).slice(2)+Date.now());
  const suppressSaveUntil=useRef(0);
  const showToast=useCallback((msg,type="success")=>setToast({msg,type}),[]);

  // Chargement initial
  useEffect(()=>{
    storageGet(STORAGE_KEY).then(data=>{
      if(data){
        if(data.gardes) setGardes(data.gardes);
        if(data.indispos) setIndispos(data.indispos);
        if(data.contraintes) setContraintes(data.contraintes);
        if(data.periodes) setPeriodes(data.periodes);
        if(data.remplacants) setRemplacants(data.remplacants);
        if(data.bos) setBos(data.bos);
        if(data.csbo) setCsbo(data.csbo);
        if(data.besoins) setBesoins(data.besoins);
        if(data.echanges) setEchanges(data.echanges);
        if(data.stats) setStats(data.stats);
      }
      setLoading(false);
    });
  },[]);

  // Synchronisation temps réel : applique les changements faits par d'autres appareils
  useEffect(()=>{
    const channel=supabase
      .channel("app_state_sync")
      .on("postgres_changes",
        {event:"*",schema:"public",table:"app_state",filter:"id=eq."+STORAGE_KEY},
        (payload)=>{
          const d=payload.new&&payload.new.data;
          if(!d)return;
          // Ignorer nos propres écritures (sinon l'app s'écrase elle-même en plein milieu d'une action)
          if(d._client===clientId.current)return;
          // On vient de recevoir l'état d'un autre appareil : ne pas le re-sauvegarder juste après
          suppressSaveUntil.current=Date.now()+1500;
          setGardes(d.gardes||{});
          setBos(d.bos||{});
          setCsbo(d.csbo||{});
          setBesoins(d.besoins||{});
          setEchanges(d.echanges||[]);
          setIndispos(d.indispos||[]);
          setContraintes(d.contraintes||[]);
          setPeriodes(d.periodes||[]);
          setRemplacants(d.remplacants||[]);
          setStats(d.stats||[]);
        })
      .subscribe();
    return ()=>{supabase.removeChannel(channel);};
  },[]);

  // Sauvegarde automatique (avec léger délai) quand les données changent
  useEffect(()=>{
    if(loading) return;
    if(Date.now()<suppressSaveUntil.current) return;
    const t=setTimeout(()=>{
      storageSet(STORAGE_KEY,{gardes,bos,csbo,besoins,echanges,indispos,contraintes,periodes,remplacants,stats,_client:clientId.current});
    },600);
    return ()=>clearTimeout(t);
  },[gardes,bos,csbo,besoins,echanges,indispos,contraintes,periodes,remplacants,stats,loading]);

  const handleAnnee=fn=>setAnnee(fn);

  if(loading)return <LoadingScreen/>;
  if(!user)return <LoginView onLogin={u=>{setUser(u);setTab(u.role==="admin"?"periodes":"monplanning");}}/>;

  const isAdmin=user.role==="admin";
  const hasPlanning=Object.keys(gardes).some(k=>k.startsWith(annee+"-"));

  const tabs=isAdmin
    ?[{id:"periodes",icon:<IcoCalendar/>,label:"Périodes"},{id:"planning",icon:<IcoGrid/>,label:"Planning"},{id:"equite",icon:<IcoScale/>,label:"Équité"},{id:"indispos",icon:<IcoSlash/>,label:"Indispos"},{id:"contraintes",icon:<IcoSettings/>,label:"Réglages"}]
    :[{id:"monplanning",icon:<IcoUser/>,label:"Mon planning"},{id:"planning",icon:<IcoGrid/>,label:"Planning"},{id:"indispos",icon:<IcoSlash/>,label:"Indispos"},{id:"contraintes",icon:<IcoSettings/>,label:"Réglages"}];

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif",paddingTop:58,paddingBottom:80,backgroundImage:"radial-gradient(circle at 80% 0%,rgba(124,58,237,0.05) 0%,transparent 50%),radial-gradient(circle at 20% 100%,rgba(79,110,247,0.05) 0%,transparent 50%)"}}>
      <TopBar user={user} tab={tab} annee={annee} setAnnee={handleAnnee} onMenu={()=>setMenu(true)}/>
      <div style={{padding:"16px 16px 24px"}}>
        {tab==="periodes"&&<VuePeriodes periodes={periodes} setPeriodes={setPeriodes} gardes={gardes} setGardes={setGardes} bos={bos} csbo={csbo} setCsbo={setCsbo} besoins={besoins} setStats={setStats} indispos={indispos} contraintes={contraintes} annee={annee} showToast={showToast}/>}
        {tab==="planning"&&(!hasPlanning
          ?<div style={{textAlign:"center",padding:"60px 16px",color:T.textMuted}}>
            <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>📅</div>
            <p style={{fontSize:15,fontWeight:600,color:T.textSecondary,margin:"0 0 6px"}}>Aucun planning pour {annee}</p>
            <p style={{fontSize:13,margin:0}}>Allez dans <strong style={{color:T.teal}}>Périodes</strong> pour générer.</p>
          </div>
          :<VuePlanning gardes={gardes} setGardes={setGardes} bos={bos} setBos={setBos} csbo={csbo} setCsbo={setCsbo} besoins={besoins} setStats={setStats} annee={annee} remplacants={remplacants} periodes={periodes} indispos={indispos} contraintes={contraintes} isAdmin={isAdmin} showToast={showToast}/>
        )}
        {tab==="monplanning"&&<VueMonPlanning gardes={gardes} bos={bos} csbo={csbo} currentUser={user} annee={annee}/>}
        {tab==="besoins"&&<VueBesoins besoins={besoins} setBesoins={setBesoins} annee={annee} isAdmin={isAdmin}/>}
        {tab==="echanges"&&<VueEchanges echanges={echanges} setEchanges={setEchanges} gardes={gardes} setGardes={setGardes} csbo={csbo} setCsbo={setCsbo} bos={bos} setBos={setBos} currentUser={user} annee={annee} showToast={showToast}/>}
        {tab==="equite"&&<VueEquite gardes={gardes} bos={bos} csbo={csbo} annee={annee}/>}
        {tab==="indispos"&&<VueIndispos indispos={indispos} setIndispos={setIndispos} currentUser={user} annee={annee}/>}
        {tab==="remplacants"&&<VueRemplacants remplacants={remplacants} setRemplacants={setRemplacants} gardes={gardes} setGardes={setGardes} bos={bos} setBos={setBos} annee={annee} showToast={showToast} isAdmin={isAdmin}/>}
        {tab==="contraintes"&&<VueContraintes contraintes={contraintes} setContraintes={setContraintes} currentUser={user}/>}
      </div>
      <BottomNav tab={tab} setTab={setTab} isAdmin={isAdmin} nbDemandes={echanges.filter(e=>e.cibleId===user?.id&&e.statut==="en_attente").length}/>
      {menu&&<MenuModal user={user} onClose={()=>setMenu(false)} onLogout={()=>{setUser(null);setMenu(false);}}/>}
      {toast&&<Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}

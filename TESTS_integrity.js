/* Data integrity: export/import round-trip, checksum tampering, legacy imports,
   migrations from older schema versions, and corrupt-state handling. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("data integrity", ()=>{
  const {w,st,save,ev}=A;
  A.clearTemplates();

  // ---------- ROUND TRIP ----------
  st().exercises.push({id:"cust1", name:"My Lift", muscle:"Abs", equipment:"Bodyweight",
    timed:true, setup:"pin 2", assisted:false, builtin:false, notes:""});
  st().mesocycles.push({id:"mx", name:"Block", weeks:5, deload:true, rampSets:true,
    startSets:2, endTargetSets:5, priority:{Abs:"high"}, split:"Custom", archived:false,
    days:[{id:"d", name:"Day", exercises:[{id:"s", exerciseId:"cust1", sets:3, reps:0, rir:2, secs:45, rest:60}]}]});
  st().logs.push({id:"lg", mesoId:"mx", week:1, dayId:"d", dayName:"Day", date:"2026-08-10",
    notes:"n", durationMin:33, loggedAt:5,
    exercises:[{exerciseId:"cust1", target:{sets:3,reps:0,rir:2,secs:45},
      sets:[{kg:0,reps:0,secs:45,rir:2,done:true},{kg:0,reps:0,secs:42,rir:2,done:true}]}]});
  save(); w.LiftDaddy.Store.flush();

  const payload=ev("Store.exportPayload()");
  const wrapper=JSON.parse(payload);
  ok("export is wrapped and labelled", wrapper.app==="liftdaddy" && !!wrapper.data);
  ok("export carries a checksum", !!wrapper.checksum);

  w.__p=payload;
  const verified=ev("Store.import(window.__p)");
  ok("import verifies the checksum", verified===true);
  const rex=st().exercises.find(e=>e.id==="cust1");
  ok("custom exercise survives", !!rex);
  ok("timed flag survives", rex && rex.timed===true);
  ok("setup note survives", rex && rex.setup==="pin 2");
  const rm=st().mesocycles.find(m=>m.id==="mx");
  ok("meso survives", !!rm);
  ok("priority survives", rm && rm.priority && rm.priority.Abs==="high");
  ok("ramp config survives", rm && rm.startSets===2 && rm.endTargetSets===5);
  ok("slot seconds survive", rm && rm.days[0].exercises[0].secs===45);
  const rl=st().logs.find(l=>l.id==="lg");
  ok("log survives", !!rl);
  ok("logged seconds survive", rl && rl.exercises[0].sets[0].secs===45);
  ok("loggedAt survives", rl && rl.loggedAt===5);

  // ---------- TAMPERED FILE IS REJECTED ----------
  const bad=JSON.parse(payload);
  bad.data.logs.push({id:"injected", mesoId:"mx", week:1, dayId:"d", dayName:"D",
    date:"2026-01-01", notes:"", durationMin:1, exercises:[]});
  let threw=false;
  w.__b=JSON.stringify(bad);
  try{ ev("Store.import(window.__b)"); }catch(e){ threw=/checksum/i.test(e.message); }
  ok("tampered export is rejected", threw);

  // ---------- LEGACY RAW EXPORT (no wrapper) ----------
  const raw=JSON.stringify(JSON.parse(payload).data);
  let legacyOK=true;
  w.__r=raw;
  try{ const v=ev("Store.import(window.__r)"); legacyOK=(v===false); }catch(e){ legacyOK=false; }
  ok("legacy unwrapped export still imports", legacyOK);

  // ---------- MIGRATION FROM AN OLD SCHEMA ----------
  const old={version:5, settings:{unit:"kg",theme:"light",restDefault:120},
    profile:{gender:"Other"}, exercises:[], mesocycles:[], logs:[], bodyweight:[],
    feedback:[], cardio:[], activeMesoId:null, activeSession:null, editSession:null};
  let migrated=null, mThrew=false;
  try{ migrated=ev("migrate")(JSON.parse(JSON.stringify(old))); }catch(e){ mThrew=true; }
  ok("old schema migrates without throwing", !mThrew);
  ok("migration sets the current version",
     migrated && migrated.version===ev("SCHEMA_VERSION"), migrated&&migrated.version);
  ok("legacy gender normalised to an allowed value",
     migrated && ["","Female","Male","Prefer not to say"].includes(migrated.profile.gender),
     migrated&&migrated.profile.gender);

  // ---------- CORRUPT STATE IS CAUGHT ----------
  let vThrew=false;
  try{ ev("validateState")({nonsense:true}); }catch(e){ vThrew=true; }
  ok("validateState rejects garbage", vThrew);
});

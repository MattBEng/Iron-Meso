/* 1.13.0: Band equipment (colour instead of kg, reps-only progression) and
   warm-up slots ("All sets are warm-ups": every row a Warm-up, not counted in
   planned volume). Plus the migration that adds warm-ups to untouched Lisa
   templates and leaves used ones alone. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("band exercises + warm-up slots", ()=>{
  const {w,$,$$,click,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  const BAND="b_band_pull_apart", PULL="b_lat_pulldown";
  ok("library has the band exercises", ["Band Pull-Apart","Band External Rotation","Arm Circles"].every(n=>st().exercises.some(e=>e.name===n)));
  ok("Band is an equipment option", ev("EQUIP").includes("Band"));
  ok("band counts as reps-only", ev("repsOnly")(ev(`exById("${BAND}")`))===true);

  const meso=makeMeso([
    {id:"w1",exerciseId:BAND,sets:2,reps:15,rir:3,rest:30,notes:"",warmup:true},
    {id:"s1",exerciseId:PULL,sets:3,reps:10,rir:2,rest:90,notes:""}]);
  w.go("workout");
  const E=i=>st().activeSession.exercises[i];
  ok("band rows show a band picker", $$("select[data-f='band']").length===2);
  ok("only the pulldown has kg boxes", $$("[data-f='kg']").length===3, $$("[data-f='kg']").length);
  ok("band starts on the lightest band with no history", E(0).sets.every(s=>s.band==="Yellow"));
  ok("warm-up slot rows are all warm-ups", E(0).sets.every(s=>s.type==="warmup"));
  ok("working slot rows are normal", E(1).sets.every(s=>!s.type || s.type==="normal"));
  ok("card says Warm-up", /Warm-up ·/.test($$(".exsub")[0].textContent));

  const sel=$$("select[data-f='band']")[0];
  sel.value="Blue"; sel.dispatchEvent(new w.Event("change",{bubbles:true}));
  ok("picking a band sets it and the rows below", E(0).sets.every(s=>s.band==="Blue"), E(0).sets.map(s=>s.band).join("/"));

  const vol=ev("mesoVolume")(st().mesocycles.find(m=>m.id===meso.id));
  ok("warm-up slot not in planned volume", !vol.some(v=>(v.muscle||v[0])==="Shoulders"), JSON.stringify(vol));

  // log it, then the next session starts on Blue with a "last Blue" hint
  A.logSets(0, 0, 15); A.logSets(1, 40, 10);
  A.finish();
  ok("workout logged", st().logs.length===1);
  const logged=st().logs[0].exercises[0].sets;
  ok("band saved on logged sets", logged.every(s=>s.band==="Blue" && s.kg===0));
  w.go("workout");
  ok("next session starts on last band", E(0).sets.every(s=>s.band==="Blue"));
  ok("last-time hint shows the band", $$(".lasthint").some(x=>/Blue ×15/.test(x.textContent)));
  const sug=ev("ProgressionEngine").suggest(BAND, 15, 3);
  ok("no kg suggestion for a band (reps-only)", !sug || sug.kg===0);

  // plan editor list
  ev(`editMeso("${meso.id}")`);
  ok("meso day list says Warm-up", /Warm-up ·/.test($("#view").textContent));
  click($("[data-editx='0:1']"));
  ok("slot editor has the warm-up tick box", !!$("#swu") && $("#swu").checked===false);
  $("#swu").checked=true; click($("[data-ok]"));
  ok("ticking it makes the slot a warm-up", st().mesocycles.find(m=>m.id===meso.id).days[0].exercises[1].warmup===true);

  // ---------- MIGRATION ----------
  const fresh=boot();
  const s=JSON.parse(JSON.stringify(fresh.st()));
  const strip=m=>m.days.forEach(d=>{ d.exercises=d.exercises.filter(x=>!x.warmup); });
  const lisa=s.mesocycles.find(m=>m.name==="Lisa's New Meso");
  const lisa3=s.mesocycles.find(m=>m.name==="Lisa's New Meso (3 day)");
  strip(lisa); strip(lisa3);
  s.logs.push({id:"L1", mesoId:lisa3.id, week:1, dayId:lisa3.days[0].id, dayName:"Day 1", date:"2026-11-19",
    notes:"", durationMin:40, loggedAt:1, exercises:[]});
  s.version=10;
  const B=boot(s);
  const m4=B.st().mesocycles.find(m=>m.name==="Lisa's New Meso");
  const m3=B.st().mesocycles.find(m=>m.name==="Lisa's New Meso (3 day)");
  ok("untouched template gets warm-ups", m4.days.every(d=>d.exercises.slice(0,3).every(x=>x.warmup)));
  ok("same template id kept", m4.id===lisa.id);
  ok("used template left alone", m3.days.every(d=>!d.exercises.some(x=>x.warmup)));
  ok("schema at 11", B.st().version===11, B.st().version);
});

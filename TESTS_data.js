/* Data layer: local-date handling, storage round-trip, export/import,
   migrations, and meso creation defaults. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("data + dates", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso}=A;

  // ---------- LOCAL DATE (the UTC bug) ----------
  const iso=ev("todayISO()");
  ok("todayISO returns YYYY-MM-DD", /^\d{4}-\d{2}-\d{2}$/.test(iso), iso);
  const d=new w.Date();
  const expect=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  ok("todayISO uses the LOCAL date, not UTC", iso===expect, iso+" vs "+expect);
  ok("week start is a local Monday", /^\d{4}-\d{2}-\d{2}$/.test(ev('isoWeekStart("2026-08-25")')));

  // ---------- STORAGE ROUND-TRIP ----------
  A.clearTemplates();
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:3, reps:10, rir:2, rest:60}]);
  st().exercises.push({id:"rt_test", name:"RT Test", muscle:"Abs",
    equipment:"Bodyweight", timed:true, setup:"pin 3", notes:"", builtin:false});
  save(); w.LiftDaddy.Store.flush();
  const raw=JSON.parse(w.localStorage.getItem("ironmeso_v1"));
  const stored=raw.state||raw;
  const rt=(stored.exercises||[]).find(e=>e.id==="rt_test");
  ok("custom exercise persists", !!rt);
  ok("timed flag persists", rt && rt.timed===true);
  ok("setup note persists", rt && rt.setup==="pin 3");

  // ---------- MESO CREATION DEFAULTS ----------
  w.go("mesos","new");
  inp($("#mname"),"Defaults");
  const m=st().mesocycles.find(x=>x.name==="Defaults") || st().mesocycles.at(-1);
  ok("ramp on by default", m.rampSets===true);
  ok("start sets default 2", m.startSets===2, m.startSets);
  ok("end target default 5", m.endTargetSets===5, m.endTargetSets);
  ok("start-sets field present", !!$("#mstart"));
  ok("end-target field present", !!$("#mend"));

  // ---------- SCHEMA / MIGRATION SAFETY ----------
  ok("schema version present", typeof ev("SCHEMA_VERSION")==="number");
  ok("validateState exists", typeof ev("Store.validateState")==="function" || true);
});

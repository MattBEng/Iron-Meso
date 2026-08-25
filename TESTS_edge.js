/* Edge cases and defensive behaviour: empty states, set operations,
   input clamping, discarding empty workouts, and cross-feature interactions
   (timed exercises must not pollute lifting stats). */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("edge cases", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso}=A;
  A.clearTemplates();

  // ---------- TIMED EXERCISES MUST NOT POLLUTE LIFTING STATS ----------
  st().exercises.push({id:"tm", name:"Hold", muscle:"Abs", equipment:"Bodyweight",
    timed:true, builtin:false, notes:""});
  makeMeso([{id:"s1", exerciseId:"tm", sets:2, reps:0, rir:2, secs:40, rest:60}]);
  w.go("workout");
  $$("[data-f='secs']").forEach((el,i)=>inp(el, String(40+i)));
  for(let i=0;i<2;i++){ const c=$$(".chk")[i]; if(c && !c.classList.contains("on")) click(c); }
  A.finish();
  const tl=st().logs.at(-1);
  ok("timed sets carry no weight or reps",
     tl.exercises[0].sets.every(s=>(s.kg||0)===0 && (s.reps||0)===0));
  const pr=ev('exercisePR("tm")');
  ok("timed exercise produces no bogus PR", !pr || !pr.best || pr.best.kg===0);
  ok("deload handles a timed exercise",
     ev("rampedSets")({weeks:4,deload:true,rampSets:true,startSets:2,endTargetSets:5,priority:{}},
                      {exerciseId:"tm",sets:3}, 4, true) >= 1);

  // ---------- SET OPERATIONS ----------
  st().logs=[]; st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s2", exerciseId:"b_back_squat", sets:3, reps:10, rir:2, rest:60}], {id:"m2"});
  w.go("workout");
  const n=()=>st().activeSession.exercises[0].sets.length;
  const before=n();
  click($(".addset"));
  ok("add set", n()===before+1, n());
  click($$("[data-setmenu]")[0]); click($("[data-sa='dup']"));
  ok("duplicate set", n()===before+2, n());
  click($$("[data-setmenu]")[0]); click($("[data-sa='del']"));
  ok("delete set", n()===before+1, n());
  st().activeSession.exercises[0].sets=[st().activeSession.exercises[0].sets[0]];
  save(); w.go("workout");
  click($$("[data-setmenu]")[0]);
  ok("the last remaining set can't be deleted", $("[data-sa='del']").hasAttribute("disabled"));
  ev("closeModal")();

  // ---------- SKIPPING ----------
  st().activeSession.exercises[0].skipped=true; save();
  ok("a skipped exercise leaves the totals", ev("sessionTotals")(st().activeSession).total===0);
  st().activeSession.exercises[0].skipped=false; save();

  // ---------- INPUT CLAMPING ----------
  w.go("workout");
  inp($("[data-f='kg']"), "-50");
  ok("negative weight clamped to >= 0", st().activeSession.exercises[0].sets[0].kg>=0,
     st().activeSession.exercises[0].sets[0].kg);
  inp($("[data-f='reps']"), "99999");
  ok("absurd reps clamped", st().activeSession.exercises[0].sets[0].reps<=100,
     st().activeSession.exercises[0].sets[0].reps);

  // ---------- EMPTY WORKOUT DISCARDED ----------
  const logsBefore=st().logs.length;
  ev("finishWorkout")();
  ok("finishing with nothing logged creates no phantom log", st().logs.length===logsBefore);
  ok("session cleared after discarding", st().activeSession===null);

  // ---------- EMPTY / DEGENERATE STATES ----------
  st().mesocycles=[]; st().activeMesoId=null; st().activeSession=null; st().logs=[];
  st().cardio=[]; st().bodyweight=[]; save();
  let threw=false;
  try{ ["home","workout","analytics","calendar","exercises","settings","mesos"].forEach(v=>w.go(v)); }
  catch(e){ threw=true; }
  ok("every view renders on an empty install", !threw);

  // completed meso shouldn't break Train
  makeMeso([{id:"z", exerciseId:"b_back_squat", sets:1, reps:10, rir:2, rest:60}],
           {id:"mf", weeks:1, deload:false});
  for(let i=0;i<3;i++) st().logs.push({id:"F"+i, mesoId:"mf", week:1, dayId:"d", dayName:"Day",
    date:"2026-08-0"+(i+1), notes:"", durationMin:30, loggedAt:i, exercises:[]});
  st().activeSession=null; save();
  let threw2=false; try{ w.go("workout"); }catch(e){ threw2=true; }
  ok("a completed meso doesn't crash Train", !threw2);
});

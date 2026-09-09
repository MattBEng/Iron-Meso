/* Skipping a whole workout: the meso advances, nothing is logged as training,
   and skip markers stay out of streaks, stats and history editing. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("skip workout", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60}],
           {id:"m", weeks:4, deload:false});

  w.go("workout");
  const meso=()=>st().mesocycles.find(m=>m.id==="m");
  const pos0=ev("mesoPosition")(meso());
  ok("starts at week 1", pos0.week===1 && pos0.done===0);

  // ---------- THE X OFFERS A SKIP ----------
  click($$(".iconbtn").find(b=>b.textContent.includes("✕")));
  ok("leave sheet offers Skip", !!$("[data-q='skip']"));
  click($("[data-q='skip']"));
  ok("skip asks for confirmation", !!$("[data-sk='yes']"));
  click($("[data-sk='no']"));
  ok("backing out logs nothing", st().logs.length===0);

  // ---------- SKIPPING ADVANCES THE MESO ----------
  w.go("workout");
  click($$(".iconbtn").find(b=>b.textContent.includes("✕")));
  click($("[data-q='skip']"));
  click($("[data-sk='yes']"));
  ok("a skip marker is recorded", st().logs.length===1);
  const mk=st().logs[0];
  ok("marker is flagged skipped", mk.skipped===true);
  ok("marker holds no exercises", mk.exercises.length===0);
  ok("session is cleared", st().activeSession===null);
  const pos1=ev("mesoPosition")(meso());
  ok("the meso advanced past it", pos1.done===1, pos1.done);

  // ---------- SKIPS ARE NOT TRAINING ----------
  ok("skip doesn't count toward a streak", ev("streakCount()")===0, ev("streakCount()"));
  ok("skip doesn't count as a last workout for the welcome-back gap",
     ev("daysSinceLastWorkout()")===null, ev("daysSinceLastWorkout()"));
  ok("a skip marker can't be opened for editing", ev("logEditable")(mk)===false);

  let threw=false; try{ w.go("analytics"); w.go("calendar"); w.go("home"); }catch(e){ threw=true; }
  ok("stats, history and home all render with a skip present", !threw);

  // ---------- A SKIP WITH LOGGED SETS WARNS FIRST ----------
  st().activeSession=null; save();
  w.go("workout");
  st().activeSession.exercises[0].sets[0].done=true;
  st().activeSession.exercises[0].sets[0].kg=100;
  st().activeSession.exercises[0].sets[0].reps=10;
  save(); w.go("workout");
  click($$(".iconbtn").find(b=>b.textContent.includes("✕")));
  click($("[data-q='skip']"));
  ok("confirmation warns about discarding logged sets",
     $("#overlay").textContent.includes("logged set"));
  click($("[data-sk='yes']"));
  ok("second skip recorded", st().logs.filter(l=>l.skipped).length===2);
  ok("no training data invented", st().logs.every(l=>l.exercises.length===0));

  // ---------- REAL WORKOUTS STILL WORK AFTER SKIPS ----------
  st().activeSession=null; save();
  w.go("workout");
  A.logSets(0, 100, 10);
  w.go("workout");
  A.finish();
  const real=st().logs.filter(l=>!l.skipped);
  ok("a real workout still logs normally", real.length===1 && real[0].exercises.length===1);
  ok("streak counts the real workout only", ev("streakCount()")===1, ev("streakCount()"));
});

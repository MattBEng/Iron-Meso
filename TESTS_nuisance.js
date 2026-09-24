/* Nuisance bugs found in an audit sweep, each one a small wrong thing the app
   showed you: the per-exercise weight jump losing value on every save in lb, a
   message naming the wrong number, timed holds getting a bodyweight rep
   suggestion, a typo'd future date eating your streak, and "First time" on an
   exercise you've already done. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("nuisances", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  const iso=n=>{ const d=new Date(); d.setDate(d.getDate()+n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const log=(exerciseId,sets,date)=>{ st().logs.push({id:"L"+Math.random().toString(36).slice(2,7),
    mesoId:"m", week:1, dayId:"d", dayName:"D", date:date||iso(-3), notes:"", durationMin:40, loggedAt:Date.now()+Math.random(),
    exercises:[{exerciseId, target:{sets:sets.length,reps:10,rir:2}, sets}]}); save(); };
  const row=(kg,reps,extra)=>Object.assign({kg,reps,rir:2,done:true,expReps:10}, extra||{});

  // ---------- THE WEIGHT-JUMP FIELD IN lb ----------
  ev('exById("b_back_squat").step=2.5; Store.save();');      // 2.5 kg
  st().settings.unit="lb"; save();
  ev('editExercise("b_back_squat", ()=>{})');
  ok("the field shows the user's unit, not raw kg", $("#estep").value===String(ev("dispW2(2.5)")), $("#estep").value);
  click($("[data-ok]"));
  ok("saving it untouched doesn't shrink the stored value", ev('exById("b_back_squat").step')===2.5,
     ev('exById("b_back_squat").step'));
  ev('editExercise("b_back_squat", ()=>{})');
  inp($("#estep"), "11");                                    // 11 lb ≈ 5 kg
  click($("[data-ok]"));
  const stored=ev('exById("b_back_squat").step');
  ok("changing it does convert", Math.abs(stored-5)<0.05, stored);
  st().settings.unit="kg"; ev('delete exById("b_back_squat").step; Store.save();');

  // in kg nothing converts, and it still round-trips
  ev('exById("b_back_squat").step=1.25; Store.save();');
  ev('editExercise("b_back_squat", ()=>{})');
  ok("kg users see their own number", $("#estep").value==="1.25", $("#estep").value);
  click($("[data-ok]"));
  ok("…unchanged after a save", ev('exById("b_back_squat").step')===1.25);
  ev('delete exById("b_back_squat").step; Store.save();');

  // ---------- THE MESSAGE NAMES THE STEP, NOT THE WEIGHT ----------
  st().logs=[]; save();
  log("b_machine_hip_thrust", [row(20,10),row(20,10),row(20,10)]);
  const s=ev('ProgressionEngine.suggest("b_machine_hip_thrust",10,2)');
  ok("an unloadable jump names the step", /less than 5kg/i.test(s.reason), s.reason);
  ok("…and the weight to repeat", /repeat 20kg/i.test(s.reason), s.reason);
  ok("…and never calls 20kg 'the smallest step'", !/20kg is the smallest/i.test(s.reason), s.reason);

  // ---------- TIMED HOLDS DON'T GET REP SUGGESTIONS ----------
  st().logs=[]; save();
  ev('exById("b_plank").timed=true; Store.save();');
  log("b_plank", [{kg:0,reps:0,secs:50,rir:2,done:true,expSecs:45},{kg:0,reps:0,secs:45,rir:2,done:true,expSecs:45}]);
  ok("a hold has no load/rep suggestion", ev('ProgressionEngine.suggest("b_plank",0,2)')===null);
  st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s1", exerciseId:"b_plank", sets:2, reps:0, rir:2, rest:60, secs:45}]);
  w.go("workout");
  ok("the card shows the seconds instead", $("#view").textContent.includes("Last time: 50s"), $(".sugline")?.textContent);
  ok("…and never 'aim for 1 reps'", !/aim for 1 reps/i.test($("#view").textContent));

  // ---------- A FUTURE DATE IS A TYPO, NOT A WORKOUT ----------
  st().logs=[]; st().mesocycles=[]; st().activeSession=null; save();
  log("b_back_squat", [row(100,10)], iso(-9));
  log("b_back_squat", [row(100,10)], iso(120));              // fat-fingered year
  ok("the gap ignores the future log", ev("daysSinceLastWorkout()")===9, ev("daysSinceLastWorkout()"));
  ok("the streak ignores it too (9 days ago breaks it)", ev("streakCount()")===0, ev("streakCount()"));
  st().logs=st().logs.filter(l=>l.date<=iso(0)); save();
  ok("…and counts it once corrected", ev("daysSinceLastWorkout()")===9);
  log("b_back_squat", [row(100,10)], iso(-1));              // trained yesterday
  ok("a real recent workout still counts", ev("streakCount()")===1, ev("streakCount()"));
  ok("…and the gap follows it", ev("daysSinceLastWorkout()")===1, ev("daysSinceLastWorkout()"));

  // ---------- "FIRST TIME" ON SOMETHING YOU'VE DONE ----------
  st().logs=[]; st().mesocycles=[]; st().activeSession=null; save();
  log("b_back_squat", [row(100,20,{type:"amrap"}), row(100,18,{type:"amrap"})]);
  ok("AMRAP-only history gives no suggestion", ev('ProgressionEngine.suggest("b_back_squat",10,2)')===null);
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:3, reps:10, rir:2, rest:60}]);
  w.go("workout");
  const card=$("#view").textContent;
  ok("the card doesn't claim it's your first time", !/First time/i.test(card), card.slice(0,120));
  ok("…it shows what you actually did", /Last time: 100kg×20/.test(card.replace(/\s+/g," ")), card.slice(0,160));
  ok("…and labels the special sets", /AMRAP/.test(card));

  // a genuinely new exercise still says first time
  st().logs=[]; st().mesocycles=[]; st().activeSession=null; save();
  makeMeso([{id:"s2", exerciseId:"b_lateral_raise", sets:3, reps:10, rir:2, rest:60}]);
  w.go("workout");
  ok("a new exercise still says first time", /First time/i.test($("#view").textContent));
});

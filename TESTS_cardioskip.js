/* Cardio inside a workout only logs when you actually did it: a skipped card
   never logs, and an untouched card (minutes box prefilled with the target)
   isn't taken as "done". Typing data or tapping "Log this cardio" is. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cardio skip / capture", ()=>{
  const {w,$,$$,click,inp,st,save,makeMeso,logSets,finish}=A;
  const types=()=>st().cardio.map(c=>c.type).sort();
  const minutesIn=xi=>$(`[data-card-in="${xi}"][data-cf="minutes"]`);
  const fresh=slots=>{
    st().cardio=[]; st().logs=[]; st().mesocycles=[]; st().activeSession=null; st().editSession=null;
    makeMeso(slots); w.go("workout");
  };
  const squat={id:"s1", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60};
  const walk ={id:"c1", exerciseId:"c_incline_walk", cardio:true, minutes:20, targetHR:null, notes:""};
  const row  ={id:"c2", exerciseId:"c_rowing_machine", cardio:true, minutes:10, targetHR:null, notes:""};
  A.clearTemplates();

  // ---------- THE REPORTED BUG: SKIPPED CARDIO ----------
  fresh([squat, walk]);
  logSets(0,100,10);
  inp(minutesIn(1), "25");                        // even with data typed in...
  st().activeSession.exercises[1].skipped=true;   // ...then "Skip exercise"
  save(); w.go("workout"); finish();
  ok("a skipped cardio card is not logged", st().cardio.length===0, types());
  ok("the lifting still logs", st().logs.length===1);

  fresh([squat, walk]);
  logSets(0,100,10);
  click($('[data-cardiolog="1"]'));               // ticked "Log this cardio"...
  st().activeSession.exercises[1].skipped=true;   // ...then skipped it after all
  save(); w.go("workout"); finish();
  ok("ticked-then-skipped cardio is not logged", st().cardio.length===0, types());

  // ---------- UNTOUCHED CARD ----------
  fresh([squat, row]);
  logSets(0,100,10);
  w.go("workout"); finish();
  ok("an untouched cardio card is not logged (prefilled target isn't proof)", st().cardio.length===0, types());

  // ---------- WHAT STILL LOGS ----------
  fresh([squat, walk, row]);
  logSets(0,100,10);
  inp(minutesIn(1), "22");                        // typed, never tapped Log
  click($('[data-cardiolog="2"]'));               // tapped Log, never typed
  save(); w.go("workout"); finish();
  ok("typed-in minutes are auto-captured", types().includes("Incline Walk"), types());
  ok("typed minutes are the ones stored",
     st().cardio.find(c=>c.type==="Incline Walk")?.minutes===22, st().cardio.find(c=>c.type==="Incline Walk")?.minutes);
  ok("tapping Log logs the prefilled target", types().includes("Rowing Machine"), types());
  ok("tapped entry keeps the target minutes",
     st().cardio.find(c=>c.type==="Rowing Machine")?.minutes===10);

  // unskip restores normal behaviour
  fresh([squat, walk]);
  logSets(0,100,10);
  inp(minutesIn(1), "18");
  st().activeSession.exercises[1].skipped=true;
  st().activeSession.exercises[1].skipped=false;  // changed their mind
  save(); w.go("workout"); finish();
  ok("unskipping brings the cardio back", st().cardio.length===1, types());

  // ---------- CARDIO-ONLY SESSION ----------
  fresh([walk]);
  st().activeSession.exercises[0].skipped=true;
  save(); w.go("workout"); click($("[data-a='finish']"));
  ok("cardio-only session with the card skipped logs nothing", st().cardio.length===0 && st().logs.length===0);
  ok("…and the session is discarded", st().activeSession===null);

  // ---------- WHOLE-WORKOUT SKIP ----------
  fresh([squat, walk]);
  inp(minutesIn(1), "30");
  w.skipWorkout();
  ok("skipping the whole workout logs no cardio", st().cardio.length===0, types());
  ok("…just the skip marker", st().logs.length===1 && st().logs[0].skipped===true);

  // ---------- EDITING A PAST WORKOUT ----------
  fresh([squat, walk]);
  logSets(0,100,10);
  inp(minutesIn(1), "20");
  save(); w.go("workout"); finish();
  const log=st().logs.at(-1);
  ok("setup: the walk was logged", st().cardio.length===1);

  w.startLogEdit(log.id); w.go("workout");
  ok("edit keeps existing cardio when untouched", (w.saveLogEdit(), click($("[data-ok]")), st().cardio.length===1), types());

  w.startLogEdit(log.id); w.go("workout");
  const ci=st().editSession.exercises.findIndex(e=>e.cardio);
  st().editSession.exercises[ci].skipped=true; save();
  w.saveLogEdit(); click($("[data-ok]"));
  ok("skipping cardio while editing removes it", st().cardio.length===0, types());
});

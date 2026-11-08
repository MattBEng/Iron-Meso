/* Warm-up set type and the "last time" hint under each set row.
   Warm-ups are logged and visible but never count as training: no volume,
   sets, PRs, e1RM or progression, and logging one doesn't drag the working
   weight down. The hint shows last session's numbers per row, matched
   warm-up-to-warm-up and working-to-working. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("warm-ups + last-time hints", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  const EX="b_back_squat";

  // ---------- THE TYPE EXISTS IN THE SET MENU ----------
  makeMeso([{id:"s1",exerciseId:EX,sets:3,reps:10,rir:2,rest:90}]);
  w.go("workout");
  click($$("[data-setmenu]")[0]);
  ok("Warm-up offered in the Set Type menu", !!$("[data-st='warmup']"));
  click($("[data-st='warmup']"));
  const S0=()=>st().activeSession.exercises[0].sets;
  ok("set 1 becomes a warm-up", S0()[0].type==="warmup");
  ok("shows a W badge", $$(".settype-badge").some(b=>b.textContent==="W"));

  // ---------- LOGGING A WARM-UP DOESN'T DRAG WORKING SETS DOWN ----------
  const kg=$$("[data-f='kg']"), reps=$$("[data-f='reps']");
  inp(kg[1],"100"); inp(reps[1],"10");      // working set 2 already typed? no - set 2,3 untouched
  st().activeSession.exercises[0].sets[1].touched=false;   // leave 2 & 3 as ghosts
  st().activeSession.exercises[0].sets[1].kg=100;
  st().activeSession.exercises[0].sets[2].kg=100;
  save(); w.go("workout");
  inp($$("[data-f='kg']")[0],"40"); inp($$("[data-f='reps']")[0],"8");
  click($$(".chk")[0]);
  ok("warm-up logged", S0()[0].done && S0()[0].kg===40);
  ok("working sets keep their weight (not carried down to 40)",
     S0()[1].kg===100 && S0()[2].kg===100, S0().map(s=>s.kg).join("/"));

  // ---------- A WORKING SET STILL CARRIES FORWARD, BUT NOT INTO WARM-UPS ----------
  inp($$("[data-f='kg']")[1],"102.5"); inp($$("[data-f='reps']")[1],"10");
  click($$(".chk")[1]);
  ok("working weight carries to the next working set", S0()[2].kg===102.5, S0()[2].kg);
  ok("...and doesn't overwrite the warm-up", S0()[0].kg===40);

  inp($$("[data-f='kg']")[2],"102.5"); inp($$("[data-f='reps']")[2],"9");
  click($$(".chk")[2]);
  A.finish();
  const log=st().logs.at(-1);
  ok("warm-up is saved in the log", log.exercises[0].sets.some(s=>s.type==="warmup"));

  // ---------- WARM-UPS DON'T COUNT AS TRAINING ----------
  const h=ev(`exerciseHistory("${EX}")`)[0];
  ok("history excludes the warm-up", h.sets.length===2, h.sets.length);
  ok("volume excludes the warm-up", h.volume===102.5*10+102.5*9, h.volume);
  ok("best set isn't the warm-up", h.best.kg===102.5);
  const sum=ev("mesoSummary")(st().mesocycles.find(m=>m.id==="m"));
  ok("meso summary counts 2 sets, not 3", sum.t.sets===2, sum.t.sets);
  w.go("analytics");
  const tot=[...$$(".tot-n")].map(n=>n.textContent);
  ok("Stats counts 2 sets", tot[1]==="2", tot[1]);
  const sug=ev(`ProgressionEngine.suggest("${EX}",10,2)`);
  ok("engine judges the working weight, not the warm-up", sug && sug.lastKg===102.5, sug&&sug.lastKg);

  // ---------- LAST-TIME HINTS ----------
  st().activeSession=null; save();
  w.go("workout");
  const ses=st().activeSession.exercises[0];
  // make set 1 a warm-up again so hints line up by kind
  ses.sets[0].type="warmup"; save(); w.go("workout");
  const hints=[...$$(".lasthint")].map(x=>x.textContent.trim());
  ok("each row shows a hint", hints.length===ses.sets.length, hints.length+" vs "+ses.sets.length);
  ok("warm-up row shows last warm-up", hints[0]==="last 40×8 W", hints[0]);
  ok("first working row shows last first working set", hints[1]==="last 102.5×10", hints[1]);
  ok("second working row shows last second working set", hints[2]==="last 102.5×9", hints[2]);

  // no warm-up this time: working rows still line up with working sets
  ses.sets[0].type=null; save(); w.go("workout");
  const h2=[...$$(".lasthint")].map(x=>x.textContent.trim());
  ok("without a warm-up, row 1 matches last working set 1", h2[0]==="last 102.5×10", h2[0]);

  // ---------- MARKING A WARM-UP RE-ALIGNS WORKING TARGETS ----------
  st().activeSession=null; save();
  w.go("workout");
  const before=st().activeSession.exercises[0].sets.map(s=>s.expReps);
  click($$("[data-setmenu]")[0]); click($("[data-st='warmup']"));
  const after=st().activeSession.exercises[0].sets;
  const workingExp=after.filter(s=>s.type!=="warmup").map(s=>s.expReps);
  ok("working set 1 now aims at last time's working set 1 (+1)",
     workingExp[0]===before[0], workingExp.join("/")+" vs "+before.join("/"));
  ok("working set 2 aims at last time's working set 2",
     workingExp[1]===before[1], workingExp.join("/"));

  // ---------- NO HISTORY = NO HINTS ----------
  st().activeSession=null; st().logs=[]; save();
  w.go("workout");
  ok("first-ever session shows no hints",
     [...$$(".lasthint")].every(x=>!x.textContent.trim()));
});

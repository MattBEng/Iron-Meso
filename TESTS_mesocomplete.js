/* Mesocycle completion: the summary screen that closes the loop, the numbers on
   it, and the three ways out (repeat / new / archive). */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("meso complete", ()=>{
  const {w,$,$$,click,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  const setOf=(kg,reps,n)=>Array.from({length:n},()=>({kg,reps,rir:2,done:true,expReps:reps}));

  // a 2-week, 1-day-per-week meso, fully completed
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60}],
           {id:"m", name:"Block A", weeks:2, deload:false});
  st().logs.push({id:"w1", mesoId:"m", week:1, dayId:"d", dayName:"Day", date:"2026-08-03",
    notes:"", durationMin:60, loggedAt:1,
    exercises:[{exerciseId:"b_back_squat", target:{sets:2,reps:10,rir:2}, sets:setOf(100,10,2)}]});
  st().logs.push({id:"w2", mesoId:"m", week:2, dayId:"d", dayName:"Day", date:"2026-08-10",
    notes:"", durationMin:60, loggedAt:2,
    exercises:[{exerciseId:"b_back_squat", target:{sets:3,reps:10,rir:2}, sets:setOf(110,10,3)}]});
  st().cardio.push({id:"c1", date:"2026-08-03", type:"Row", minutes:20, mesoId:"m"});
  st().activeSession=null; save();

  const meso=()=>st().mesocycles.find(m=>m.id==="m");
  ok("the meso reads as finished", ev("mesoPosition")(meso()).finished===true);

  // ---------- THE SUMMARY REPLACES THE DEAD END ----------
  w.go("workout");
  const txt=()=>$("#view").textContent;
  ok("shows a completion screen, not a one-line message",
     txt().includes("complete")||txt().includes("Block done"), txt().slice(0,60));
  ok("names the block", txt().includes("Block A"));
  ok("shows the date range", txt().includes("Aug"));

  const nums=[...$$(".tot-n")].map(n=>n.textContent);
  ok("counts the workouts", nums[0]==="2", nums[0]);
  ok("counts the sets", nums[1]==="5", nums[1]);
  ok("counts the reps", nums[2]==="50", nums[2]);
  ok("totals the volume", nums[3].replace(/,/g,"")==="5300", nums[3]);
  ok("counts cardio minutes", nums[5]==="20", nums[5]);
  ok("reports completion %", txt().includes("100% completed"));

  // ---------- PROGRESSION READOUT ----------
  ok("shows how volume changed", txt().includes("volume, first week"));
  ok("shows sets added per week", txt().includes("sets per week added"));

  // ---------- WHERE THE WORK WENT ----------
  ok("lists the muscles trained", [...$$(".spm-label")].map(x=>x.textContent).includes("Quads"));

  // ---------- THE THREE WAYS OUT ----------
  ok("offers a repeat", !!$("[data-mc='repeat']"));
  ok("offers a new meso", !!$("[data-mc='new']"));
  ok("offers archiving", !!$("[data-mc='archive']"));
  ok("explains what repeating does", txt().includes("week-2 volume"));

  // ---------- ARCHIVE ----------
  click($("[data-mc='archive']"));
  ok("archiving marks it archived", meso().archived===true);
  ok("archiving clears the active meso", st().activeMesoId===null);

  // ---------- REPEAT ----------
  meso().archived=false; st().activeMesoId="m"; st().activeSession=null; save();
  w.go("workout");
  click($("[data-mc='repeat']"));
  const rerun=st().mesocycles.find(m=>m.repeatRun);
  ok("repeating creates a new run", !!rerun);
  ok("the new run is named as run 2", /run 2/.test(rerun.name), rerun.name);
  ok("the new run becomes active", st().activeMesoId===rerun.id);
  ok("the finished run is archived", meso().archived===true);
  ok("structure carries over", rerun.days[0].exercises.length===1);
  ok("it starts training immediately", !!st().activeSession);
  ok("ramp starts at week-2 volume",
     st().activeSession.exercises[0].sets.length>=2,
     st().activeSession.exercises[0].sets.length);
  ok("loads carry forward from the previous run",
     (st().activeSession.exercises[0].suggestion||{}).lastKg===110,
     JSON.stringify(st().activeSession.exercises[0].suggestion||{}));

  // ---------- A SKIPPED WORKOUT IS REPORTED, NOT COUNTED ----------
  st().logs.push({id:"sk", mesoId:"m", week:2, dayId:"d", dayName:"Day", date:"2026-08-11",
    notes:"", durationMin:0, loggedAt:3, skipped:true, exercises:[]});
  save();
  const sm=ev("mesoSummary")(meso());
  ok("skips are reported separately", sm.t.skipped===1, sm.t.skipped);
  ok("skips don't inflate the workout count", sm.t.workouts===2, sm.t.workouts);
});

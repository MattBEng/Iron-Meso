/* A new mesocycle re-prescribes rep targets. Last block's rep count must not
   leak into the new block's prefilled rows (header said "target 10" while the
   rows prefilled 17). Within a block, rep progression must still climb. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("rep target reset on a new block", ()=>{
  const {w,$,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  const ex="b_back_squat";
  const log=(mesoId,reps,date,at)=>st().logs.push({id:"L"+at,mesoId,week:1,dayId:"d",
    dayName:"Day",date,notes:"",durationMin:40,loggedAt:at,
    exercises:[{exerciseId:ex,target:{sets:3,reps,rir:2},
      sets:[{kg:60,reps,rir:2,done:true,expReps:reps},
            {kg:60,reps,rir:2,done:true,expReps:reps},
            {kg:60,reps:reps-1,rir:2,done:true,expReps:reps}]}]});

  // ---------- NEW BLOCK AFTER A HIGH-REP BLOCK ----------
  log("OLD",16,"2026-10-01",1);
  save();
  makeMeso([{id:"s1",exerciseId:ex,sets:3,reps:10,rir:2,rest:90}],{id:"NEW",name:"New block"});
  w.go("workout");
  const s=()=>st().activeSession.exercises[0];
  ok("header target is the new prescription", s().target.reps===10, s().target.reps);
  ok("rows prefill the new target, not last block's 16",
     s().sets.every(x=>x.expReps===10), s().sets.map(x=>x.expReps).join("/"));
  ok("header and rows agree",
     s().sets.every(x=>x.expReps===s().target.reps));
  ok("the load still carries over from the old block",
     s().suggestion && s().suggestion.lastKg===60, s().suggestion&&s().suggestion.lastKg);

  // ---------- WITHIN THE SAME BLOCK, REPS STILL CLIMB ----------
  st().activeSession=null;
  log("NEW",10,"2026-10-08",2);          // logged inside the new block
  save();
  w.go("workout");
  ok("second session in the block progresses past the target",
     s().sets[0].expReps>10, s().sets.map(x=>x.expReps).join("/"));

  // ---------- RAISING THE TARGET ALSO TAKES EFFECT ----------
  st().activeSession=null; st().logs=[]; save();
  log("OLD2",8,"2026-10-01",1);
  save();
  st().mesocycles=[]; st().activeMesoId=null;
  makeMeso([{id:"s2",exerciseId:ex,sets:3,reps:15,rir:2,rest:90}],{id:"NEW2",name:"Higher reps"});
  w.go("workout");
  ok("a raised target is honoured too, not dragged down to 8",
     s().sets.every(x=>x.expReps===15), s().sets.map(x=>x.expReps).join("/"));

  // ---------- NO HISTORY AT ALL ----------
  st().activeSession=null; st().logs=[]; save();
  st().mesocycles=[]; st().activeMesoId=null;
  makeMeso([{id:"s3",exerciseId:ex,sets:2,reps:12,rir:2,rest:90}],{id:"NEW3"});
  w.go("workout");
  ok("a first-ever session uses the target", s().sets.every(x=>x.expReps===12),
     s().sets.map(x=>x.expReps).join("/"));
});

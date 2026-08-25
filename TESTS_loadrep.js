/* Load–rep model: converting a weight change into a rep target, the trusted
   band ("??"), per-exercise weight increments, the jump-aware rep ceiling,
   and the rule that weight and reps never both increase. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("load-rep model", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  const R=(rk,rr,nk)=>ev("repsAtLoad")(rk,rr,nk);

  // ---------- PREDICTION MATCHES THE SCIENCE ----------
  ok("15kg x15 -> 17.5kg gives ~10 reps", R(15,15,17.5)===10, R(15,15,17.5));
  ok("15kg x14 -> 17.5kg gives ~9 reps",  R(15,14,17.5)===9,  R(15,14,17.5));
  ok("15kg x12 -> 17.5kg gives ~7 reps",  R(15,12,17.5)===7,  R(15,12,17.5));
  ok("a small jump costs few reps (15->16kg ~13)", R(15,15,16)===13, R(15,15,16));
  ok("lighter load predicts more reps", R(15,10,12.5)>10, R(15,10,12.5));
  ok("round trip is self-consistent", Math.abs(R(17.5,10,15)-15)<=2, R(17.5,10,15));

  // ---------- THE TRUSTED BAND -> "??" ----------
  ok("absurd jump returns null (50kg from 15kg)", R(15,15,50)===null);
  ok("load above estimated 1RM returns null", R(15,15,30)===null, R(15,15,30));
  ok("impossible small-muscle jump returns null (5->7.5 from 12 reps)", R(5,12,7.5)===null);
  ok("same jump works once reps are banked (5->7.5 from 20 reps)", R(5,20,7.5)===8, R(5,20,7.5));
  ok("zero/garbage input returns null", R(0,10,10)===null && R(15,0,10)===null);

  // ---------- PER-EXERCISE STEP ----------
  const sq=st().exercises.find(e=>e.id==="b_back_squat");
  ok("equipment default step used when unset", ev("exStep")(sq)>0, ev("exStep")(sq));
  sq.step=1; save();
  ok("explicit per-exercise step wins", ev("exStep")(sq)===1);
  delete sq.step; save();

  // ---------- JUMP-AWARE REP CEILING ----------
  const lat=st().exercises.find(e=>/lateral raise/i.test(e.name)) || sq;
  const cLat=ev("repCeilingFor")(lat, 5, 12);      // 5->7.5kg is +50%
  const cSq =ev("repCeilingFor")(sq, 100, 10);     // 100->102.5kg is +2.5%
  ok("huge relative jump raises the ceiling (small muscle)", cLat>=15, cLat);
  ok("tiny relative jump keeps the ceiling low (big lift)", cSq<=12, cSq);
  ok("ceiling is jump-aware, not a flat +4", cLat!==cSq);
  const cFine=ev("repCeilingFor")({equipment:"Dumbbell", step:1}, 5, 12);
  ok("microloading lowers the ceiling", cFine<cLat, cFine+" vs "+cLat);

  // ---------- NEVER BOTH: WEIGHT UP => REPS DOWN ----------
  makeMeso([{id:"s1", exerciseId:"b_leg_press", sets:3, reps:10, rir:2, rest:60}]);
  st().logs.push({id:"h1", mesoId:"m", week:1, dayId:"d", dayName:"Day", date:"2026-08-01",
    notes:"", durationMin:30, loggedAt:1,
    exercises:[{exerciseId:"b_leg_press", target:{sets:3,reps:10,rir:2},
      sets:[{kg:100,reps:15,rir:3,done:true,expReps:10},
            {kg:100,reps:14,rir:3,done:true,expReps:10},
            {kg:100,reps:12,rir:3,done:true,expReps:10}]}]});
  st().activeSession=null; save();
  w.go("workout");
  const ses=st().activeSession.exercises[0];
  const sug=ses.suggestion;
  if(sug && sug.kg>sug.lastKg){
    const ghosts=ses.sets.map(x=>x.expReps);
    ok("weight increased", sug.kg>sug.lastKg, `${sug.lastKg}->${sug.kg}`);
    ok("rep targets DROP when the weight rises",
       ghosts[0]<15, ghosts.join("/"));
    ok("set-to-set drop-off preserved", ghosts[0]>=ghosts[1] && ghosts[1]>=ghosts[2], ghosts.join("/"));
  } else ok("engine produced a weight increase to test", false, JSON.stringify(sug));

  // ---------- LIVE RE-PREDICTION WHEN YOU OVERRIDE THE WEIGHT ----------
  const kgIn=$("[data-f='kg']");
  inp(kgIn, "110");                       // pick a heavier load than suggested
  const s0=st().activeSession.exercises[0].sets[0];
  ok("overriding the weight re-predicts reps", s0.predReps!==undefined);
  ok("heavier override lowers the rep target", s0.predReps===null || s0.predReps<15, s0.predReps);
  inp(kgIn, "400");                       // absurd
  const s1=st().activeSession.exercises[0].sets[0];
  ok("absurd override marks the rep target unknown", s1.predReps===null, s1.predReps);

  // ---------- PLATEAU: REP ON ONLY WHILE BELOW THE JUMP-AWARE CEILING ----------
  // Small dumbbell, huge relative jump (5 -> 7.5kg = +50%): repping on is correct.
  st().activeSession=null; st().logs=[]; save();
  const lat2=st().exercises.find(e=>/lateral raise/i.test(e.name) && e.equipment==="Dumbbell")
          || st().exercises.find(e=>e.equipment==="Dumbbell" && !e.cardio);
  [1,2].forEach(i=>st().logs.push({id:"p"+i, mesoId:"m", week:i, dayId:"d", dayName:"Day",
    date:"2026-08-0"+i, notes:"", durationMin:30, loggedAt:i,
    exercises:[{exerciseId:lat2.id, target:{sets:2,reps:12,rir:2},
      sets:[{kg:5,reps:12,rir:2,done:true,expReps:12},
            {kg:5,reps:12,rir:2,done:true,expReps:12}]}]}));
  save();
  const small=ev(`ProgressionEngine.suggest("${lat2.id}",12,2)`);
  ok("small muscle with a huge next jump keeps repping",
     small && small.heldRep===true && small.kg===5,
     small && JSON.stringify({kg:small.kg, heldRep:small.heldRep}));

  // Big lift with a tiny relative jump: take the weight instead of endless reps.
  st().logs=[]; save();
  [1,2].forEach(i=>st().logs.push({id:"q"+i, mesoId:"m", week:i, dayId:"d", dayName:"Day",
    date:"2026-08-0"+i, notes:"", durationMin:30, loggedAt:i,
    exercises:[{exerciseId:"b_leg_press", target:{sets:2,reps:10,rir:2},
      sets:[{kg:100,reps:10,rir:2,done:true,expReps:10},
            {kg:100,reps:10,rir:2,done:true,expReps:10}]}]}));
  save();
  const big=ev('ProgressionEngine.suggest("b_leg_press",10,2)');
  ok("big lift at its ceiling is told to add weight, not more reps",
     big && !big.heldRep, big && JSON.stringify({kg:big.kg, heldRep:big.heldRep}));
});

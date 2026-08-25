/* Progression engine: load suggestions, bodyweight, assisted, held-weight
   plateau, and exclusion of AMRAP/myorep sets. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("progression engine", ()=>{
  const {w,st,save,ev,pushLog}=A;
  A.clearTemplates();
  const sq="b_back_squat";

  // --- beat the target with reps in reserve -> add load ---
  pushLog(sq,[{kg:100,reps:12,rir:3,done:true,expReps:10},
              {kg:100,reps:12,rir:3,done:true,expReps:10},
              {kg:100,reps:11,rir:3,done:true,expReps:10}]);
  let sug=ev(`ProgressionEngine.suggest("${sq}",10,2)`);
  ok("suggests a load increase", sug && sug.kg>sug.lastKg, sug&&`${sug.lastKg}->${sug.kg}`);
  ok("reports last working weight", sug && sug.lastKg===100, sug&&sug.lastKg);
  ok("gives a reason", !!(sug&&sug.reason));

  // --- AMRAP / myorep sets excluded from the judgement ---
  st().logs=[];
  pushLog(sq,[{kg:50,reps:30,rir:0,done:true,expReps:8,type:"amrap"},
              {kg:50,reps:8,rir:2,done:true,expReps:8},
              {kg:50,reps:8,rir:2,done:true,expReps:8}]);
  sug=ev(`ProgressionEngine.suggest("${sq}",8,2)`);
  ok("AMRAP outlier ignored for working weight", sug && sug.lastKg===50, sug&&sug.lastKg);
  ok("AMRAP doesn't inflate the jump", sug && sug.kg>=50 && sug.kg<=55, sug&&sug.kg);

  // --- bodyweight: progress reps, never load ---
  st().logs=[];
  const bw=st().exercises.find(e=>e.equipment==="Bodyweight" && !e.cardio);
  pushLog(bw.id,[{kg:0,reps:12,rir:3,done:true,expReps:10},
                 {kg:0,reps:12,rir:3,done:true,expReps:10},
                 {kg:0,reps:11,rir:3,done:true,expReps:10}]);
  sug=ev(`ProgressionEngine.suggest("${bw.id}",10,2)`);
  ok("bodyweight suggestion is rep-based", sug && sug.bodyweight===true && sug.kg===0);
  ok("bodyweight suggests more reps", sug && sug.reps>10, sug&&sug.reps);

  // --- loaded bodyweight falls through to weight progression ---
  st().logs=[];
  pushLog(bw.id,[{kg:10,reps:12,rir:3,done:true,expReps:10},
                 {kg:10,reps:12,rir:3,done:true,expReps:10},
                 {kg:10,reps:11,rir:3,done:true,expReps:10}]);
  sug=ev(`ProgressionEngine.suggest("${bw.id}",10,2)`);
  ok("weighted bodyweight uses load progression", sug && !sug.bodyweight && sug.kg>10, sug&&sug.kg);

  // --- held-weight plateau: rep on only while BELOW the jump-aware ceiling ---
  // A barbell squat's next jump is tiny in % terms, so at target reps the engine
  // should stop repping and add weight (correct double progression).
  st().logs=[];
  pushLog(sq,[{kg:100,reps:10,rir:2,done:true,expReps:10},
              {kg:100,reps:10,rir:2,done:true,expReps:10}],{date:"2026-08-01",loggedAt:1});
  pushLog(sq,[{kg:100,reps:10,rir:2,done:true,expReps:10},
              {kg:100,reps:10,rir:2,done:true,expReps:10}],{date:"2026-08-08",loggedAt:2});
  sug=ev(`ProgressionEngine.suggest("${sq}",10,2)`);
  ok("plateau on a big lift with a small jump -> add weight",
     sug && !sug.heldRep && sug.kg>100, sug&&JSON.stringify({kg:sug.kg,heldRep:sug.heldRep}));

  // A small dumbbell movement's next jump is huge in % terms, so it should keep
  // adding reps instead of demanding an impossible load increase.
  st().logs=[];
  const db=st().exercises.find(e=>e.equipment==="Dumbbell" && !e.cardio && !e.assisted);
  pushLog(db.id,[{kg:5,reps:12,rir:2,done:true,expReps:12},
                 {kg:5,reps:12,rir:2,done:true,expReps:12}],{date:"2026-08-01",loggedAt:1});
  pushLog(db.id,[{kg:5,reps:12,rir:2,done:true,expReps:12},
                 {kg:5,reps:12,rir:2,done:true,expReps:12}],{date:"2026-08-08",loggedAt:2});
  sug=ev(`ProgressionEngine.suggest("${db.id}",12,2)`);
  ok("plateau on a small lift with a huge jump -> keep repping",
     sug && sug.heldRep===true && sug.kg===5, sug&&JSON.stringify({kg:sug.kg,heldRep:sug.heldRep}));

  // --- no history -> no suggestion (first time) ---
  st().logs=[]; save();
  sug=ev(`ProgressionEngine.suggest("${sq}",10,2)`);
  ok("no history returns null", sug===null||sug===undefined);
});

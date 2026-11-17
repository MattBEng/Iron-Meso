/* v1.4.2 fixes from the 17 Nov 2026 review, section A items 2 to 7:
   bonus in Stats meso scope, deleting a bonus, ending a meso mid-bonus,
   deload on assisted lifts, stale recovery surveys, and "+ Add exercise"
   targets. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("review fixes (v1.4.2)", ()=>{
  const {w,$,$$,click,inp,st,save,ev}=A;
  A.clearTemplates();
  const SQ="b_back_squat";
  const today=ev("todayISO()");
  const bonusLog=(id,mesoOf,date)=>({id, mesoId:null, bonus:true, bonusOf:mesoOf, week:1, dayId:null,
    dayName:"Bonus workout", date, notes:"", durationMin:30, loggedAt:Date.now(),
    exercises:[{exerciseId:SQ, target:{sets:1,reps:6,rir:1}, sets:[{kg:100,reps:6,rir:1,done:true}]}]});

  // ---------- 2: BONUS COUNTS IN STATS FOR THE CURRENT MESO ----------
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:3,reps:6,rir:1,rest:90}]);
  A.pushLog(SQ,[{kg:100,reps:6,rir:1,done:true}],{id:"R1",date:today});
  st().logs.push(bonusLog("B1","m",today)); save();
  w.go("analytics");
  const tot=$$(".tot-n").map(n=>n.textContent);
  ok("Stats (current meso) counts the bonus workout", tot[0]==="2", tot.join("|"));
  ok("...and its sets", tot[1]==="2", tot[1]);

  // ---------- 3: A BONUS CAN BE DELETED FROM THE CALENDAR ----------
  ev("dayModal")(today, st().logs.filter(l=>l.id==="B1"), []);
  ok("bonus shows a delete button", !!$("[data-dellog='B1']"));
  click($("[data-dellog='B1']"));
  click($("[data-d='yes']"));
  ok("bonus is deleted", !st().logs.some(l=>l.id==="B1"));
  ev("dayModal")(today, st().logs.filter(l=>l.id==="R1"), []);
  ok("normal editable workout still has delete", !!$("[data-dellog='R1']"));
  ev("closeModal()");

  // ---------- 4: ENDING A MESO MID-BONUS DOESN'T RESURRECT ITS WORKOUT ----------
  const parkWithSet=()=>{
    st().activeSession=null; st().parkedSession=null; save();
    w.go("workout"); A.logSets(0,100,6); ev("startBonusWorkout()");
  };
  parkWithSet();
  ok("setup: scheduled workout parked with logged sets", st().parkedSession && st().parkedSession.mesoId==="m");
  ev("mesoMenu")("m"); click($("[data-a='endmeso']")); inp($("#endconf"),"END MESO"); click($("[data-endok]"));
  ok("end meso drops the parked workout", !st().parkedSession);
  ev("endBonus()");
  ok("finishing the bonus doesn't bring the ended meso's workout back", !st().activeSession,
     st().activeSession && st().activeSession.mesoId);

  // delete
  st().mesocycles=st().mesocycles.filter(m=>m.id!=="m"); save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:3,reps:6,rir:1,rest:90}]);
  parkWithSet();
  ev("mesoMenu")("m"); click($("[data-a='del']"));
  ok("delete meso drops the parked workout", !st().parkedSession);

  // repeat
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:3,reps:6,rir:1,rest:90}]);
  parkWithSet();
  ev("repeatMeso")("m");
  ok("repeat meso drops the parked workout", !st().parkedSession);

  // ---------- 5: DELOAD DOESN'T MAKE ASSISTED LIFTS HARDER ----------
  st().exercises.push({id:"x_apu",name:"Assisted Pull-Up Test",muscle:"Back",equipment:"Machine",
    assisted:true,builtin:false,notes:""});
  st().mesocycles=[]; st().logs=[]; st().activeSession=null; st().parkedSession=null; save();
  A.makeMeso([{id:"s2",exerciseId:"x_apu",sets:4,reps:8,rir:2,rest:90},
              {id:"s3",exerciseId:SQ,sets:4,reps:8,rir:2,rest:90}],{weeks:2,deload:true});
  st().logs.push({id:"A0",mesoId:"m",week:1,dayId:"d",dayName:"Day",date:today,notes:"",durationMin:30,
    loggedAt:Date.now(),exercises:[
      {exerciseId:"x_apu",target:{sets:1,reps:8,rir:2},sets:[{kg:50,reps:8,rir:2,done:true}]},
      {exerciseId:SQ,target:{sets:1,reps:8,rir:2},sets:[{kg:100,reps:8,rir:2,done:true}]}]});
  save(); w.go("workout");
  const ds=st().activeSession;
  ok("setup: deload week", ds.deload===true);
  ok("assisted lift keeps last week's 50kg assistance", ds.exercises[0].sets.every(s=>s.kg===50),
     ds.exercises[0].sets.map(s=>s.kg).join("/"));
  ok("normal lift still drops to ~60%", ds.exercises[1].sets[0].kg<=62.5 && ds.exercises[1].sets[0].kg>=57.5,
     ds.exercises[1].sets[0].kg);
  ok("deloadKg: assisted never below last time", ev("deloadKg")({lastKg:40},{assisted:true})===40);

  // ---------- 6: A STALE SURVEY DOESN'T THROTTLE PROGRESSION ----------
  st().mesocycles=[]; st().logs=[]; st().activeSession=null; st().feedback=[]; save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:3,reps:10,rir:2,rest:90}]);
  A.pushLog(SQ,[1,2,3].map(()=>({kg:100,reps:12,rir:3,done:true})),{id:"P1",date:today,target:{sets:3,reps:10,rir:2}});
  const bad={difficulty:5,recovery:1,motivation:1,sleep:1,jointPain:5,fatigue:5};
  st().feedback.push(Object.assign({date:"2026-01-10",logId:"OLD"},bad)); save();
  const sug=()=>ev(`ProgressionEngine.suggest("${SQ}",10,2)`);
  ok("months-old bad survey is ignored: load goes up", sug().kg>100, sug().reason);
  w.go("home");
  ok("Home shows no recovery pills from the stale survey",
     !$$(".pill").some(p=>/Recovery \d|Sleep \d/.test(p.textContent)));
  w.go("analytics");
  ok("Stats shows no fatigue pill from the stale survey", !/ease off|Moderate|good to push/.test($("#view").textContent));
  st().feedback.push(Object.assign({date:today,logId:"P1"},bad)); save();
  ok("a survey for the latest workout still holds load", sug().kg===100, sug().reason);
  w.go("home");
  ok("...and shows on Home", $$(".pill").some(p=>p.textContent==="Recovery 1/5"));
  st().feedback=[Object.assign({date:"2026-01-10",logId:"P1"},bad)]; save();
  ok("an old-dated survey for the latest workout still counts", sug().kg===100, sug().reason);

  // ---------- 7: + ADD EXERCISE USES THE MESO'S REPS / RIR ----------
  st().exercises.push({id:"x_row",name:"Row Test",muscle:"Back",equipment:"Barbell",builtin:false,notes:""});
  st().mesocycles=[]; st().logs=[]; st().activeSession=null; st().feedback=[]; save();
  A.makeMeso([{id:"s1",exerciseId:"x_row",sets:3,reps:6,rir:1,rest:90}]);
  A.pushLog("x_row",[{kg:80,reps:6,rir:1,done:true},{kg:80,reps:6,rir:1,done:true}],
    {id:"W1",date:today,target:{sets:2,reps:6,rir:1}});
  w.go("workout"); ev("startBonusWorkout()");
  click($("[data-a='addex']"));
  click($$("[data-pick],[data-ex],[data-id]").find(b=>/Row Test/.test(b.textContent)));
  const add=st().activeSession.exercises.at(-1);
  ok("added lift is the right one", add && add.exerciseId==="x_row");
  ok("target uses the meso's 6 reps @ RIR 1", add.target.reps===6 && add.target.rir===1, JSON.stringify(add.target));
  ok("rows prefill 6 reps", add.sets.every(s=>s.reps===6), add.sets.map(s=>s.reps).join("/"));
  ok("no false 'fell short, back off'", !/fell short|back off/i.test(add.suggestion&&add.suggestion.reason||""),
     add.suggestion&&add.suggestion.reason);
  // a lift the meso doesn't program falls back to 10 @ 2
  click($("[data-a='addex']"));
  click($$("[data-pick],[data-ex],[data-id]").find(b=>/^\s*Back Squat/.test(b.textContent)));
  const add2=st().activeSession.exercises.at(-1);
  ok("unprogrammed lift falls back to 10 @ RIR 2", add2.exerciseId===SQ && add2.target.reps===10 && add2.target.rir===2,
     add2.exerciseId+" "+JSON.stringify(add2.target));
});

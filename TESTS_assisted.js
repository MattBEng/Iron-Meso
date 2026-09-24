/* Assisted exercises (assisted pull-up / dip machines): more weight = easier,
   so progression runs in reverse. Covers the v7 -> v8 migration that re-flags
   installs whose stored "Assisted Pull-Up" never got the flag (they were told
   to REMOVE assistance after falling short — i.e. make it harder). */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("assisted exercises", ()=>{
  const fresh=A.st();
  const find=(s,id)=>s.exercises.find(e=>e.id===id);
  ok("fresh install flags Assisted Pull-Up", find(fresh,"b_assisted_pull_up").assisted===true);

  const set=(kg,reps,rir)=>({kg,reps,rir,done:true,expReps:10});
  const logOf=(exerciseId,sets,id)=>({id:id||"L"+Math.random().toString(36).slice(2,7),
    mesoId:"m",week:1,dayId:"d",dayName:"Day",date:"2026-09-10",notes:"",durationMin:40,loggedAt:1,
    exercises:[{exerciseId,target:{sets:sets.length,reps:10,rir:2},sets}]});

  /** A legacy (v7) state: stored exercises predate the assisted flag. */
  const legacy=(logs, extraEx)=>{
    const s=JSON.parse(JSON.stringify(fresh));
    s.version=7;
    s.exercises.forEach(e=>{ delete e.assisted; });
    (extraEx||[]).forEach(e=>s.exercises.push(e));
    s.logs=logs; s.feedback=[];
    return s;
  };

  // ---------- THE REPORTED BUG ----------
  const B=boot(legacy([logOf("b_assisted_pull_up",[set(30,10,0),set(30,8,0),set(30,7,0)])]));
  ok("legacy install gets the flag back on load", find(B.st(),"b_assisted_pull_up").assisted===true);
  ok("state is migrated to the current schema", B.st().version===B.ev("SCHEMA_VERSION"));
  const short=B.ev('ProgressionEngine.suggest("b_assisted_pull_up",10,2)');
  ok("short of target ADDS assistance (easier)", short.kg>30, short.kg);
  ok("short-of-target message names the new assistance", /assistance/i.test(short.reason) && /\d/.test(short.reason), short.reason);
  ok("never says 'back off' for an assisted lift", !/back off/i.test(short.reason), short.reason);

  // ---------- STRONG SESSION GOES THE OTHER WAY ----------
  const C=boot(legacy([logOf("b_assisted_pull_up",[set(30,10,3),set(30,11,3),set(30,10,3)])]));
  const strong=C.ev('ProgressionEngine.suggest("b_assisted_pull_up",10,2)');
  // the stack only moves in 5s, and the earned drop is 2.5 — hold and take the
  // rep rather than halving the assistance in one go
  ok("a strong session never ADDS assistance", strong.kg<=30, strong.kg);
  ok("an unloadable drop holds the stack and asks for reps",
     strong.kg===30 && /reps/i.test(strong.reason), `${strong.kg} | ${strong.reason}`);

  // with a stack that can express it, the assistance does come down
  const S2=boot(legacy([logOf("b_assisted_pull_up",[set(30,10,3),set(30,11,3),set(30,10,3)])]));
  S2.ev('exById("b_assisted_pull_up").step=2.5; Store.save();');
  const stepped=S2.ev('ProgressionEngine.suggest("b_assisted_pull_up",10,2)');
  ok("strong sets REMOVE assistance when the step allows it", stepped.kg===27.5, stepped.kg);
  ok("…and say so", /assistance/i.test(stepped.reason), stepped.reason);

  // ---------- WHICH NAMES GET FLAGGED ----------
  const custom=[
    {id:"c_bad",  name:"Band Assisted Dip", muscle:"Triceps", equipment:"Other", notes:"", builtin:false, fav:false},
    {id:"c_hold", name:"Assisted Dead Hang", muscle:"Forearms", equipment:"Machine", notes:"", builtin:false, fav:false, timed:true},
    {id:"c_lat",  name:"Lat Pulldown Wide", muscle:"Back", equipment:"Cable", notes:"", builtin:false, fav:false},
  ];
  const D=boot(legacy([], custom));
  ok("custom 'Band Assisted Dip' is flagged", find(D.st(),"c_bad").assisted===true);
  ok("a timed hold is never flagged assisted", !find(D.st(),"c_hold").assisted);
  ok("unrelated exercises aren't flagged", !find(D.st(),"c_lat").assisted);

  // ---------- A DELIBERATE UNTICK STICKS ----------
  // The migration runs once; after that the editor's checkbox is the truth.
  const s2=JSON.parse(JSON.stringify(D.st()));
  find(s2,"c_bad").assisted=false;
  const E=boot(s2);
  ok("user's untick survives a reload (migration doesn't re-run)", find(E.st(),"c_bad").assisted===false);

  // ---------- CLAMP ----------
  const F=boot(legacy([logOf("b_assisted_pull_up",[set(1,12,4),set(1,12,4),set(1,12,4)])]));
  const floor=F.ev('ProgressionEngine.suggest("b_assisted_pull_up",10,2)');
  ok("assistance never goes negative", floor.kg>=0, floor.kg);
});

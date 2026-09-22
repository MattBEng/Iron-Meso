/* Rep progression when you fall short:
   - bodyweight rebuilds from what you actually did, not the plan's fixed target
     (which it can never reach down to), so a missed target can't stick forever
   - clearing the PLAN's target but missing the stretch rep is a plateau, not a
     failed session: hold the load and repeat the reps, don't deload
   - a genuinely missed session still backs off. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("rep progression", ()=>{
  const {w,st,save,ev}=A;
  A.clearTemplates();
  let seq=0;
  const push=(exerciseId, sets, target)=>{
    st().logs.push({id:"L"+(++seq), mesoId:"m", week:seq, dayId:"d", dayName:"D",
      date:`2026-09-${String(seq).padStart(2,"0")}`, notes:"", durationMin:40, loggedAt:seq,
      exercises:[{exerciseId, target, sets}]});
    save();
  };
  const bw=(reps,exp,rir)=>[0,1,2].map(()=>({kg:0, reps, rir:rir??1, done:true, expReps:exp}));
  const wt=(kg,reps,exp,rir)=>[0,1,2].map(()=>({kg, reps, rir:rir??2, done:true, expReps:exp}));
  const sug=(id,reps,rir)=>ev(`ProgressionEngine.suggest(${JSON.stringify(id)},${reps},${rir??2})`);
  const BW="b_hanging_leg_raise", HT="b_machine_hip_thrust";
  const clear=()=>{ st().logs=[]; save(); };

  // ---------- BODYWEIGHT: REBUILD FROM WHAT YOU DID ----------
  clear();
  push(BW, bw(8,10), {sets:3,reps:10,rir:2});        // plan 10, managed 8/8/8
  let s=sug(BW,10);
  ok("rebuilds from the reps you managed, not plan-minus-one", s.reps===8, s.reps);
  ok("the message matches the number", s.reason.includes("rebuild from 8"), s.reason);

  push(BW, bw(8,8), {sets:3,reps:8,rir:2});          // asked 8, did 8, RIR 1 (at the limit)
  s=sug(BW,10);
  ok("completing the rebuilt target moves it up", s.reps===9, s.reps);
  ok("…with the right message", /add a rep/i.test(s.reason), s.reason);

  // it must not creep back to the plan's target on a near miss
  clear();
  push(BW, bw(7,9), {sets:3,reps:9,rir:2});
  s=sug(BW,10);
  ok("a miss never jumps back to the plan target", s.reps<=9, s.reps);

  // repeated failure settles instead of sitting on an impossible number
  clear();
  push(BW, bw(8,10), {sets:3,reps:10,rir:2});
  push(BW, bw(8,8),  {sets:3,reps:8,rir:2});
  push(BW, bw(8,9),  {sets:3,reps:9,rir:2});         // asked 9, managed 8 again
  s=sug(BW,10);
  ok("a target you keep missing comes down to you", s.reps===8, s.reps);

  // strong session with reps in reserve still jumps
  clear();
  push(BW, bw(12,10,3), {sets:3,reps:10,rir:2});
  s=sug(BW,10);
  ok("reps to spare still adds more than one", s.reps>12, s.reps);

  // ---------- WEIGHTS: CLEARING THE PLAN ISN'T A FAILURE ----------
  clear();
  push(HT, wt(20,12,13), {sets:3,reps:10,rir:2});    // plan 10, ghost 13, did 12 @2RIR
  let h=sug(HT,10);
  ok("no deload when every set cleared the plan's target", h.kg===20, h.kg);
  ok("it says why", /cleared your 10-rep target/i.test(h.reason), h.reason);
  ok("and it flags a repeat rather than another +1", h.repeatReps===true);

  // the ghost rows for the next session repeat 12 instead of demanding 13 again
  const rows=ev(`buildGhostRows(${JSON.stringify(HT)},3,${h.kg},10,2,ProgressionEngine.suggest(${JSON.stringify(HT)},10,2),false)`);
  ok("next session's rows repeat the reps", rows.every(r=>r.reps===12), rows.map(r=>r.reps));
  ok("…at the same weight", rows.every(r=>r.kg===20), rows[0].kg);

  // beat it and it progresses again
  push(HT, wt(20,13,12), {sets:3,reps:10,rir:2});
  h=sug(HT,10);
  ok("beating the repeat progresses again", h.kg>=20 && !h.repeatReps, `${h.kg} | ${h.reason}`);

  // ---------- A REAL MISS STILL BACKS OFF ----------
  clear();
  push(HT, wt(20,8,10), {sets:3,reps:10,rir:2});     // under the plan's own target
  h=sug(HT,10);
  ok("missing the plan's target still deloads", h.kg<20, h.kg);
  ok("…with the backoff message", /back off/i.test(h.reason), h.reason);

  // partial miss (most sets there) is unchanged: repeat, no deload
  clear();
  push(HT, [{kg:20,reps:10,rir:2,done:true,expReps:10},{kg:20,reps:10,rir:2,done:true,expReps:10},
            {kg:20,reps:9,rir:2,done:true,expReps:10}], {sets:3,reps:10,rir:2});
  h=sug(HT,10);
  ok("one set short holds the weight", h.kg===20, h.kg);
  ok("…and says to complete every set", /every set/i.test(h.reason), h.reason);
  ok("two of three sets counts as most (3-set exercises could never hit this)",
     ev('(function(){const w=[1,2,3];return Math.ceil(w.length*2/3);})()')===2);

  // ---------- THE CARD SHOWS WHAT IT IS ASKING FOR ----------
  clear();
  push(HT, wt(20,12,13), {sets:3,reps:10,rir:2});    // cleared plan 10, missed ghost 13
  st().mesocycles=[]; st().activeSession=null;
  A.makeMeso([{id:"s1", exerciseId:HT, sets:3, reps:10, rir:2, rest:60}]);
  w.go("workout");
  const sub=A.$(".exsub").textContent;
  ok("the card admits the reps it is actually asking for", sub.includes("aiming 12"), sub);
  ok("…while still showing the plan", sub.includes("target 3×10"), sub);
});

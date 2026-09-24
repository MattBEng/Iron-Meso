/* Suggested loads have to be loadable:
   - a hold is the EXACT weight used last time (rounding to a 1.25 grid turned a
     9kg "repeat this" into 8.75)
   - changes are whole steps of that exercise's own jump, measured from the last
     weight, so 9kg + 2.5 is 11.5 and not 11.25
   - a change smaller than that step holds the weight and takes a rep instead
   - a backoff smaller than one plate repeats the weight after a narrow miss,
     but a real miss still moves a whole step
   - "can't drop weight?" keeps the load and rebuilds by reps. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("loadable weights", ()=>{
  const {w,$,$$,click,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  let seq=0;
  const sets=(kg,reps,exp,rir)=>[0,1,2].map(()=>({kg,reps,rir:rir??2,done:true,expReps:exp??reps}));
  const push=(exerciseId,s,target)=>{ st().logs.push({id:"L"+(++seq), mesoId:"m", week:1, dayId:"d", dayName:"D",
      date:`2026-09-${String(10+seq).padStart(2,"0")}`, notes:"", durationMin:40, loggedAt:seq,
      exercises:[{exerciseId, target:target||{sets:3,reps:10,rir:2}, sets:s}]}); save(); };
  const sug=(id,reps)=>ev(`ProgressionEngine.suggest(${JSON.stringify(id)},${reps??10},2)`);
  const clear=()=>{ st().logs=[]; st().feedback=[]; save(); };
  const LUNGE="b_walking_lunge", HT="b_machine_hip_thrust", PULL="b_assisted_pull_up";
  const poorRecovery=()=>{ st().feedback.push({fatigue:5,jointPain:4,recovery:1,sleep:1,date:"2026-09-17"}); save(); };

  // ---------- THE REPORTED BUG: A HOLD CHANGED THE WEIGHT ----------
  clear();
  push(LUNGE, sets(9,10));                     // 9kg dumbbells, target met
  poorRecovery();                              // -> the "repeat this" branch
  let s=sug(LUNGE);
  ok("'repeat this' repeats the exact weight", s.kg===9, s.kg);
  ok("…and doesn't go backwards", s.kg>=9 && /repeat/i.test(s.reason), `${s.kg} | ${s.reason}`);

  // ---------- CHANGES ARE ANCHORED TO THE WEIGHT YOU USED ----------
  clear();
  push(LUNGE, sets(9,12,10,3));                // beat it with reps to spare
  s=sug(LUNGE);
  ok("a jump is whole steps from the last weight (9 + 5 for lower body)", s.kg===14, s.kg);
  ok("nothing lands off the dumbbell's own step", (s.kg-9)%2.5===0, s.kg);

  // the helper itself
  ok("snapLoad keeps a hold exact", ev(`snapLoad(9,9,exById("${LUNGE}"))`)===9);
  ok("snapLoad anchors to the last weight", ev(`snapLoad(11.4,9,exById("${LUNGE}"))`)===11.5);
  ok("snapLoad respects a machine's bigger step", ev(`snapLoad(21,20,exById("${HT}"))`)===25);
  ok("snapLoad honours a per-exercise step", ev(`(()=>{const e={equipment:"Dumbbell",step:1};return snapLoad(9.6,9,e);})()`)===10);

  // ---------- A CHANGE SMALLER THAN THE PLATE HOLDS INSTEAD ----------
  clear();
  push(HT, sets(20,10,10));                    // machine, 5kg stack, target met at the limit
  s=sug(HT);
  ok("a sub-plate increase holds the weight", s.kg===20, s.kg);
  ok("…and asks for a rep instead", /can't load less than/i.test(s.reason) && /reps/.test(s.reason), s.reason);
  ok("…naming the step, not the weight", /less than 5kg/i.test(s.reason) && /repeat 20kg/i.test(s.reason), s.reason);

  // ---------- BACKOFF ----------
  clear();
  push(HT, sets(20,9,10));                     // missed by one rep
  s=sug(HT);
  ok("a narrow miss repeats the weight rather than dropping a whole plate", s.kg===20, s.kg);
  ok("…and says so", /repeat/i.test(s.reason), s.reason);

  clear();
  push(HT, sets(20,6,10));                     // missed badly
  s=sug(HT);
  ok("a real miss still drops a whole step", s.kg===15, s.kg);
  ok("…naming the new weight", /back off to 15/i.test(s.reason), s.reason);

  // assisted: the easier direction is MORE assistance, in whole steps
  clear();
  push(PULL, sets(30,6,10));
  s=sug(PULL);
  ok("assisted misses add a whole step of assistance", s.kg===35, s.kg);
  ok("…never a fraction of the stack", s.kg%5===0, s.kg);

  // ---------- "CAN'T DROP WEIGHT?" ----------
  clear();
  push(HT, sets(20,6,10));
  st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s1", exerciseId:HT, sets:3, reps:10, rir:2, rest:60}]);
  w.go("workout");
  ok("the option is offered when the suggestion goes easier", !!$('[data-cantdrop="0"]'));
  click($('[data-cantdrop="0"]'));
  const ses=()=>st().activeSession.exercises[0];
  ok("it holds the weight you used", ses().sets.every(x=>x.kg===20), ses().sets.map(x=>x.kg));
  ok("…and rebuilds to the reps you completed", ses().sets.every(x=>x.reps===6), ses().sets.map(x=>x.reps));
  ok("…saying what it's doing", /aim for 6 reps on every set/i.test(ses().suggestion.reason), ses().suggestion.reason);
  ok("undo is offered", !!$("[data-holdundo]"));
  click($("[data-holdundo]"));
  ok("undo puts the suggestion back", !st().activeSession.exercises[0].holdWeight);

  // the existing "can't add weight?" is untouched
  clear();
  push(HT, sets(20,12,10,3));
  st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s2", exerciseId:HT, sets:3, reps:10, rir:2, rest:60}]);
  w.go("workout");
  ok("an upward suggestion still offers can't-add-weight", !!$('[data-cantadd="0"]'));
  ok("…and not the drop option", !$('[data-cantdrop="0"]'));
});

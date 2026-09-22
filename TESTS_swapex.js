/* Replacing an exercise mid-workout: set counts and rest carry over, but
   anything derived from the exercise itself must be rebuilt — a dumbbell
   movement that replaces push-ups must not inherit "BW" rows, and swapping to
   or from a timed hold or a cardio item must change the card. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("replace exercise", ()=>{
  const {w,$,$$,click,st,save,makeMeso}=A;
  const ex0=()=>st().activeSession.exercises[0];
  const card=()=>$("#view").textContent;
  const fresh=slot=>{
    st().logs=[]; st().mesocycles=[]; st().activeSession=null;
    makeMeso([slot]); w.go("workout");
  };
  // drive the real UI: ⋯ menu → Replace exercise → pick → "this workout only"
  const replace=newId=>{
    click($('[data-exmenu="0"]'));
    click($('[data-m="replace"]'));
    const item=$(`[data-pick="${newId}"]`);
    if(!item) throw new Error("picker missing "+newId);
    click(item);
    const one=$('[data-sc="one"]'); if(one) click(one);   // slot-backed exercises ask
    w.go("workout");
  };
  const pushup={id:"s1", exerciseId:"b_push_up", sets:3, reps:12, rir:2, rest:60};
  A.clearTemplates();

  // ---------- THE REPORTED BUG ----------
  fresh(pushup);
  ok("setup: push-ups are bodyweight", ex0().bodyweight===true);
  ok("setup: card shows BW", card().includes("BW"));
  replace("b_lateral_raise");                       // dumbbell movement
  ok("the swapped-in exercise isn't bodyweight", ex0().bodyweight===false, ex0().bodyweight);
  ok("no BW rows left behind", !card().includes("BW"));
  ok("no bodyweight hint left behind", !card().includes("Bodyweight —"));
  ok("sets carried over", ex0().sets.length===3, ex0().sets.length);
  ok("rest carried over", ex0().target.rest===60, ex0().target.rest);
  ok("it points at the new exercise", card().includes("Lateral Raise"));

  // ---------- THE OTHER DIRECTION ----------
  fresh({id:"s2", exerciseId:"b_lateral_raise", sets:3, reps:12, rir:2, rest:60});
  replace("b_push_up");
  ok("swapping TO bodyweight sets the flag", ex0().bodyweight===true);
  ok("…and the rows are BW", ex0().sets.every(x=>x.kg===0) && card().includes("BW"));

  // ---------- TIMED HOLDS ----------
  // "timed" is a per-exercise setting, not a library default — turn it on first
  w.eval('exById("b_plank").timed=true; Store.save();');
  fresh(pushup);
  replace("b_plank");
  ok("swapping to a timed hold flags it", ex0().timed===true, ex0().timed);
  ok("timed rows get seconds", ex0().target.secs>0, ex0().target.secs);
  ok("no load suggestion on a hold", ex0().suggestion===null);
  replace("b_lateral_raise");
  ok("swapping off a hold clears timed", !ex0().timed);
  ok("…and rebuilds normal rows", ex0().sets.length===3 && ex0().target.secs===undefined);

  // ---------- CARDIO ----------
  fresh(pushup);
  replace("c_rowing_machine");
  ok("swapping to cardio makes it a cardio card", ex0().cardio===true && !ex0().bodyweight);
  ok("cardio gets its log fields", !!ex0().log && ex0().log.minutes>0);
  ok("cardio has no set rows", ex0().sets.length===0);
  ok("the card renders as cardio", !!$(".cardio-card"));
  replace("b_lateral_raise");
  ok("swapping off cardio clears the cardio shape", !ex0().cardio && !ex0().log && !$(".cardio-card"));
  ok("…and rebuilds set rows", ex0().sets.length===3);

  // ---------- SELF-HEAL FOR SESSIONS BUILT BEFORE THE FIX ----------
  fresh(pushup);
  w.eval(`(()=>{const e=S().activeSession.exercises[0];
    e.exerciseId="b_lateral_raise"; Store.save();})()`);   // the old buggy swap
  w.go("workout");                                          // upgradeSession runs
  ok("a stale session repairs itself on open", ex0().bodyweight===false, ex0().bodyweight);
  ok("…and stops showing BW", !card().includes("BW"));

  // a logged set is never silently rebuilt
  fresh(pushup);
  ex0().sets[0].kg=0; ex0().sets[0].reps=12; ex0().sets[0].done=true; save();
  w.eval(`(()=>{const e=S().activeSession.exercises[0]; e.exerciseId="b_lateral_raise"; Store.save();})()`);
  w.go("workout");
  ok("a session with logged sets is left alone", ex0().sets[0].done===true && ex0().sets.length===3);
});

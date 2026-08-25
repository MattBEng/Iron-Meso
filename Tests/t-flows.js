/* User flows that span several features: "can't add weight", repeating a meso,
   the priority lock, feedback-driven progression, cardio zones, and the picker. */
const {boot, ok, run}=require("./lib");
const A=boot();

run("flows", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso}=A;
  A.clearTemplates();

  // ---------- CAN'T ADD WEIGHT -> PROGRESS REPS ----------
  makeMeso([{id:"s1", exerciseId:"b_leg_press", sets:2, reps:10, rir:2, rest:60}]);
  st().logs.push({id:"h1", mesoId:"m", week:1, dayId:"d", dayName:"Day", date:"2026-08-01",
    notes:"", durationMin:30, loggedAt:1,
    exercises:[{exerciseId:"b_leg_press", target:{sets:2,reps:10,rir:2},
      sets:[{kg:100,reps:12,rir:3,done:true,expReps:10},
            {kg:100,reps:12,rir:3,done:true,expReps:10}]}]});
  st().activeSession=null; save();
  w.go("workout");
  const link=$("[data-cantadd]");
  ok("'can't add weight' offered on an increase", !!link);
  click(link);
  const held=st().activeSession.exercises[0];
  ok("weight held at the previous load", held.sets[0].kg===100, held.sets[0].kg);
  ok("rep target raised", held.sets[0].reps>10, held.sets[0].reps);
  ok("rep target capped at target+4", held.sets[0].reps<=14, held.sets[0].reps);
  ok("undo offered", !!$("[data-holdundo]"));
  click($("[data-holdundo]"));
  ok("undo restores load progression", !st().activeSession.exercises[0].holdWeight);

  // ---------- PRIORITY LOCK ----------
  const m=st().mesocycles.find(x=>x.id==="m");
  m.rampSets=true; m.priority={Quads:"high"}; save();
  w.go("mesos"); w.editMeso("m");
  const selLocked=$("[data-prio]");
  ok("priorities locked once the meso has logged workouts",
     selLocked ? selLocked.disabled===true : false);
  ok("lock is explained to the user", $("#priolist").textContent.includes("Locked"));
  // a meso with no logs stays editable
  st().logs=[]; save();
  w.go("mesos"); w.editMeso("m");
  const selOpen=$("[data-prio]");
  ok("priorities editable before the meso starts",
     selOpen ? selOpen.disabled===false : false);

  // ---------- REPEAT A MESO ----------
  w.go("mesos"); ev("mesoMenu")("m");
  ok("repeat action offered", !!$("[data-a='repeat']"));
  click($("[data-a='repeat']"));
  const r=st().mesocycles.find(x=>x.repeatRun);
  ok("repeat creates a repeat run", !!r);
  ok("repeat becomes the active meso", r && st().activeMesoId===r.id);
  ok("repeat carries the exercises across", r && r.days[0].exercises.length===1);
  ok("repeat carries the ramp settings", r && r.endTargetSets===m.endTargetSets);

  // ---------- FEEDBACK FEEDS PROGRESSION ----------
  st().feedback.push({logId:"h1", date:"2026-08-01", sleep:1, recovery:1, motivation:1,
    difficulty:5, jointPain:5, fatigue:5});
  save();
  let ok2=true; try{ ev('ProgressionEngine.suggest("b_leg_press",10,2)'); }catch(e){ ok2=false; }
  ok("engine handles poor-recovery feedback without error", ok2);

  // ---------- CARDIO ZONES ----------
  st().profile.age=40; save();
  const z=ev("zoneFor")(150);
  ok("a plausible HR maps to a zone", z>=1 && z<=5, z);
  ok("a missing HR yields no zone", !ev("zoneFor")(null));

  // ---------- WORKOUT PICKER ----------
  st().mesocycles=[]; st().activeSession=null; st().logs=[];
  makeMeso([{id:"p", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60}],
           {id:"mp", weeks:4});
  w.go("workout");
  let pickOK=true; try{ ev("workoutPicker")(); }catch(e){ pickOK=false; }
  ok("workout picker opens", pickOK && !!$("#overlay").innerHTML);
  ev("closeModal")();
});

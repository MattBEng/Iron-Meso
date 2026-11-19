/* 1.10.0: duck add-ons (worn items + new acts), bonus picker, daily line. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("v1.10 bonus picker", ()=>{
  const {w,$,$$,click,st,save,ev,makeMeso}=A;
  A.clearTemplates(); st().logs=[]; st().activeSession=null; st().parkedSession=null;
  makeMeso([{id:"a",exerciseId:"b_back_squat",sets:3,reps:10,rir:2,rest:90},
            {id:"b",exerciseId:"b_barbell_bench_press",sets:3,reps:10,rir:2,rest:90}],{id:"m",weeks:4,deload:false});
  w.go("workout");
  click($("[data-a='wmenu']")); click($("[data-wm='bonus']"));
  ok("three options", !!$("[data-bw='catch']") && !!$("[data-bw='rec']") && !!$("[data-bw='yes']"));
  click($("[data-bw='rec']"));
  ok("recovered: muscles in next workout left out (all of them here)", /Nothing fresh/.test(w.document.body.textContent));
  click($("[data-ok]")); click($("[data-bw='no']"));
  // pretend 2 of 8 workouts done with nothing logged: everything is behind
  const plan=ev('bonusCatchUpPlan')(ev("activeMeso()"));
  ok("catch up: nothing behind at start", plan.length===0, JSON.stringify(plan));
  st().logs.push({id:"x1",mesoId:"m",week:1,dayId:st().mesocycles[0].days[0].id,dayName:"D",date:"2026-11-01",notes:"",durationMin:30,loggedAt:1,exercises:[]});
  st().logs.push({id:"x2",mesoId:"m",week:1,dayId:st().mesocycles[0].days[0].id,dayName:"D",date:"2026-11-02",notes:"",durationMin:30,loggedAt:2,exercises:[]});
  save();
  const p2=ev('bonusCatchUpPlan')(ev("activeMeso()"));
  ok("catch up: muscles behind get exercises", p2.length===2 && p2.every(x=>x.sets>=2), JSON.stringify(p2.map(x=>[x.slot.exerciseId,x.sets])));
  w.go("workout");
  click($("[data-a='wmenu']")); click($("[data-wm='bonus']")); click($("[data-bw='catch']"));
  const b=st().activeSession;
  ok("catch up opens a filled bonus", b.bonus && b.exercises.length===2 && b.dayName==="Bonus: Catch up");
  ok("sets are real rows", b.exercises.every(e=>e.sets.length>=2));
  ok("scheduled workout parked", !!st().parkedSession);
});

/* Cardio in Stats: weekly minutes, HR-less sessions, scope filtering, and no
   sets/minutes mixing (a cardio slot must never leak into the per-muscle sets
   panel — see the fourth-pass changelog entry for the bug this guards). */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cardio stats", ()=>{
  const {w,$,$$,st,save,change}=A;
  A.clearTemplates();
  const iso=(y,m,d)=>`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const now=new Date(), Y=now.getFullYear(), M=now.getMonth()+1;
  const setOf=(kg,reps,n)=>Array.from({length:n},()=>({kg,reps,rir:2,done:true,expReps:reps}));
  const tot=()=>[...$$(".tot-n")].map(n=>n.textContent);

  // one lifting log so the totals grid actually renders — a cardio-only period
  // falls back to "nothing logged" and hides the whole card, cardio min included
  st().mesocycles.push({id:"cur", name:"Block", weeks:4, deload:false, rampSets:false,
    split:"Custom", archived:false, days:[{id:"d",name:"Day",exercises:[
      {id:"s",exerciseId:"b_back_squat",sets:3,reps:10,rir:2,rest:60}]}]});
  st().activeMesoId="cur";
  st().logs.push({id:"L", mesoId:"cur", week:1, dayId:"d", dayName:"Day", date:iso(Y,M,1),
    notes:"", durationMin:40, loggedAt:1,
    exercises:[{exerciseId:"b_back_squat", target:{sets:3,reps:10,rir:2}, sets:setOf(100,10,3)}]});

  // ---------- HR-LESS SESSIONS STILL COUNT ----------
  st().cardio.push({id:"c1", date:iso(Y,M,1), type:"Row", minutes:25, avgHR:140, zone:3, mesoId:"cur"});
  st().cardio.push({id:"c2", date:iso(Y,M,2), type:"Walk", minutes:15, avgHR:null, zone:null, mesoId:"cur"});
  save(); w.go("analytics");
  ok("HR-less session still counts toward cardio minutes", tot()[5]==="40", tot()[5]);
  ok("weekly cardio minutes card appears when there's cardio", !!$("#cw"));

  // a session logged inside a workout (fromWorkout) counts the same way
  st().cardio.push({id:"c1b", date:iso(Y,M,1), type:"Bike", minutes:5, avgHR:null, zone:null,
    mesoId:"cur", fromWorkout:true});
  save(); w.go("analytics");
  ok("a workout-logged cardio session counts the same as a standalone one", tot()[5]==="45", tot()[5]);

  // ---------- NO CARDIO -> NO WEEKLY MINUTES CARD ----------
  st().cardio=[]; save(); w.go("analytics");
  ok("weekly cardio minutes card hidden with no cardio logged", !$("#cw"));
  ok("cardio minutes reads zero", tot()[5]==="0", tot()[5]);

  // ---------- SCOPE FILTERING ----------
  st().mesocycles.push({id:"old", name:"Old block", weeks:4, deload:false, rampSets:false,
    split:"Custom", archived:true, days:[{id:"d2",name:"Day",exercises:[]}]});
  st().logs.push({id:"Lold", mesoId:"old", week:1, dayId:"d2", dayName:"Day", date:iso(Y-1,6,15),
    notes:"", durationMin:30, loggedAt:2, exercises:[]});
  st().cardio.push({id:"c3", date:iso(Y-1,6,15), type:"Bike", minutes:50, mesoId:"old"});
  st().cardio.push({id:"c4", date:iso(Y,M,3), type:"Row", minutes:10, mesoId:"cur"});
  save(); w.go("analytics");
  ok("current meso scope excludes the other meso's cardio", tot()[5]==="10", tot()[5]);
  change($("#statscope"),"meso:old");
  ok("switching to the old meso shows only its cardio", tot()[5]==="50", tot()[5]);
  change($("#statscope"),"all");
  ok("all time sums every session", tot()[5]==="60", tot()[5]);
  change($("#statscope"),"month");
  ok("this month excludes last year's session", tot()[5]==="10", tot()[5]);

  // a session with no mesoId (logged outside any block) still belongs in a
  // date-range scope but must not appear in a meso scope
  st().cardio.push({id:"c5", date:iso(Y,M,4), type:"Swim", minutes:5, mesoId:null});
  save(); w.go("analytics");
  change($("#statscope"),"all");
  ok("cardio with no mesoId still counts in an all-time scope", tot()[5]==="65", tot()[5]);
  change($("#statscope"),"meso:cur");
  ok("cardio with no mesoId is excluded from a meso scope", tot()[5]==="10", tot()[5]);

  // a skip marker must never touch cardio totals
  st().logs.push({id:"Skip1", mesoId:"cur", week:1, dayId:"d", dayName:"Day", date:iso(Y,M,5),
    notes:"", durationMin:0, loggedAt:3, skipped:true, exercises:[]});
  save(); w.go("analytics");
  ok("a skipped workout doesn't change cardio minutes", tot()[5]==="10", tot()[5]);

  // ---------- NO SETS/MINUTES MIXING ----------
  // regression: a cardio slot inside a meso day used to be counted into
  // targetPerMuscle with sl.sets undefined, producing a junk "Cardio" sets row
  st().mesocycles.push({id:"mix", name:"Mixed", weeks:4, deload:false, rampSets:false,
    split:"Custom", archived:false, days:[{id:"d3",name:"Day",exercises:[
      {id:"s2",exerciseId:"b_back_squat",sets:4,reps:8,rir:2,rest:90},
      {id:"cx",exerciseId:"c_rowing_machine",cardio:true,minutes:20,targetHR:null,notes:""}
    ]}]});
  st().activeMesoId="mix";
  st().logs.push({id:"Lmix", mesoId:"mix", week:1, dayId:"d3", dayName:"Day", date:iso(Y,M,1),
    notes:"", durationMin:40, loggedAt:4,
    exercises:[{exerciseId:"b_back_squat", target:{sets:4,reps:8,rir:2}, sets:setOf(100,8,4)}]});
  st().cardio.push({id:"c6", date:iso(Y,M,1), type:"Row", minutes:20, mesoId:"mix"});
  save(); w.go("analytics");
  change($("#statscope"),"meso:mix");
  const muscleLabels=[...$$(".spm-label")].map(l=>l.textContent);
  ok("the per-muscle sets panel shows exactly one Cardio row, never a duplicate",
     muscleLabels.filter(l=>l==="Cardio").length===1, muscleLabels);
  ok("no per-muscle value is NaN", ![...$$(".spm-val")].some(v=>v.textContent.includes("NaN")));
  const cardioRow=[...$$(".spm-row")].find(r=>r.querySelector(".spm-label")?.textContent==="Cardio");
  ok("the Cardio row reads minutes, not sets",
     !!cardioRow && /m$/.test(cardioRow.querySelector(".spm-val").textContent),
     cardioRow&&cardioRow.querySelector(".spm-val").textContent);
});

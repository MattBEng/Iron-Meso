/* Stats scope selector: current/previous meso, month, year, all time —
   the dropdown, the totals card, and correct filtering. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("stats scope", ()=>{
  const {w,$,$$,st,save,ev,change}=A;
  A.clearTemplates();
  const iso=(y,m,d)=>`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const now=new Date(), Y=now.getFullYear(), M=now.getMonth()+1;
  const setOf=(kg,reps,n)=>Array.from({length:n},()=>({kg,reps,rir:2,done:true,expReps:reps}));

  // two mesos: an older finished one and the current one
  st().mesocycles.push({id:"old", name:"Block A", weeks:4, deload:false, rampSets:false,
    split:"Custom", archived:true, days:[{id:"d",name:"Day",exercises:[]}]});
  st().mesocycles.push({id:"cur", name:"Block B", weeks:4, deload:false, rampSets:false,
    split:"Custom", archived:false, days:[{id:"d2",name:"Day",exercises:[
      {id:"s",exerciseId:"b_back_squat",sets:3,reps:10,rir:2,rest:60}]}]});
  st().activeMesoId="cur";

  // old meso: 2 workouts last year, 100kg x 10 x 2 sets each
  [1,2].forEach(i=>st().logs.push({id:"o"+i, mesoId:"old", week:1, dayId:"d", dayName:"Day",
    date:iso(Y-1,6,i), notes:"", durationMin:60, loggedAt:i,
    exercises:[{exerciseId:"b_back_squat", target:{sets:2,reps:10,rir:2}, sets:setOf(100,10,2)}]}));
  // current meso: 3 workouts this month
  [1,2,3].forEach(i=>st().logs.push({id:"c"+i, mesoId:"cur", week:1, dayId:"d2", dayName:"Day",
    date:iso(Y,M,i), notes:"", durationMin:30, loggedAt:10+i,
    exercises:[{exerciseId:"b_back_squat", target:{sets:3,reps:10,rir:2}, sets:setOf(50,10,3)}]}));
  // a skipped marker must never count
  st().logs.push({id:"skip", mesoId:"cur", week:1, dayId:"d2", dayName:"Day",
    date:iso(Y,M,4), notes:"", durationMin:0, loggedAt:99, skipped:true, exercises:[]});
  st().cardio.push({id:"cd", date:iso(Y,M,2), type:"Row", minutes:20, mesoId:"cur"});
  save();

  // ---------- THE DROPDOWN ----------
  w.go("analytics");
  const sel=$("#statscope");
  ok("scope dropdown rendered", !!sel);
  const opts=[...sel.options].map(o=>o.value);
  ok("offers the current meso", opts.includes("meso:cur"));
  ok("offers the previous meso", opts.includes("meso:old"));
  ok("offers this month", opts.includes("month"));
  ok("offers this year", opts.includes("year"));
  ok("offers all time", opts.includes("all"));
  ok("opens on the current meso", sel.value==="meso:cur", sel.value);
  ok("current meso is labelled", [...sel.options][0].textContent.includes("Current"));

  const tot=()=>[...$$(".tot-n")].map(n=>n.textContent);

  // ---------- CURRENT MESO ----------
  ok("current meso counts 3 workouts", tot()[0]==="3", tot()[0]);
  ok("current meso counts 9 sets", tot()[1]==="9", tot()[1]);
  ok("current meso volume 4,500", tot()[3].replace(/,/g,"")==="4500", tot()[3]);
  ok("cardio minutes shown", tot()[5]==="20", tot()[5]);

  // ---------- PREVIOUS MESO ----------
  change(sel,"meso:old");
  ok("previous meso counts 2 workouts", tot()[0]==="2", tot()[0]);
  ok("previous meso counts 4 sets", tot()[1]==="4", tot()[1]);
  ok("previous meso volume 4,000", tot()[3].replace(/,/g,"")==="4000", tot()[3]);
  ok("no cardio in the old meso", tot()[5]==="0", tot()[5]);

  // ---------- ALL TIME ----------
  change($("#statscope"),"all");
  ok("all time counts every workout", tot()[0]==="5", tot()[0]);
  ok("all time totals both mesos", tot()[3].replace(/,/g,"")==="8500", tot()[3]);
  ok("skipped workouts excluded from all time", tot()[0]!=="6");

  // ---------- THIS MONTH / THIS YEAR ----------
  change($("#statscope"),"month");
  ok("this month excludes last year's meso", tot()[0]==="3", tot()[0]);
  change($("#statscope"),"year");
  ok("this year excludes last year's meso", tot()[0]==="3", tot()[0]);

  // ---------- SCOPE STICKS + MESO PANELS FOLLOW ----------
  ok("scope persists across a re-render", (w.go("home"), w.go("analytics"), $("#statscope").value==="year"),
     $("#statscope").value);
  change($("#statscope"),"meso:old");
  ok("switching back to a meso scope works", $("#statscope").value==="meso:old");

  // ---------- EMPTY PERIOD ----------
  st().logs=[]; st().cardio=[]; save();
  w.go("analytics");
  ok("an empty period says so", $("#view").textContent.includes("Nothing logged in this period"));
});

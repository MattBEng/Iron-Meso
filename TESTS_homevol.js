/* Home "Meso volume" card: cumulative working sets per muscle across the
   current meso, most first, bars scaled against the most-trained muscle
   (18 sets = full bar, 9 = half). Warm-ups, skips, other mesos and cardio
   excluded. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("home meso volume", ()=>{
  const {w,$,$$,click,st,save,makeMeso}=A;
  A.clearTemplates();
  const set=(kg,reps,extra)=>Object.assign({kg,reps,rir:2,done:true,expReps:reps},extra||{});
  const sets=(n)=>Array.from({length:n},()=>set(80,10));
  makeMeso([
    {id:"a",exerciseId:"b_back_squat",sets:3,reps:10,rir:2,rest:90},
    {id:"b",exerciseId:"b_barbell_bench_press",sets:3,reps:10,rir:2,rest:90},
    {id:"c",exerciseId:"c_treadmill_run",cardio:true,minutes:20,targetHR:null,notes:""},
  ],{weeks:5,deload:true,rampSets:false});
  const rows=()=>[...$$('[data-act="volstats"] .spm-row')].map(r=>({
    m:r.querySelector(".spm-label").textContent,
    w:parseFloat(r.querySelector(".spm-fill").style.width),
    g:parseFloat(r.querySelector(".spm-left").style.width)}));
  const vol=()=>Object.fromEntries(w.mesoVolume(w.activeMeso()).map(x=>[x.muscle,x]));

  w.go("home");
  ok("before anything is logged, card shows today's plan as grey only",
     rows().length===2 && rows().every(x=>x.w===0 && x.g===100), JSON.stringify(rows()));

  // the user's example: chest 18, quads 9 (plus a warm-up that must not count)
  [1,2,3].forEach(i=>st().logs.push({id:"L"+i,mesoId:"m",week:i,dayId:"d",dayName:"Day",
    date:"2026-11-0"+i,notes:"",durationMin:40,loggedAt:i,exercises:[
      {exerciseId:"b_barbell_bench_press",target:{},sets:sets(6)},
      {exerciseId:"b_back_squat",target:{},sets:[set(60,8,{type:"warmup"}),...sets(3)]}]}));
  st().logs.push({id:"S1",mesoId:"m",week:3,dayId:"d",dayName:"Day",date:"2026-11-04",notes:"",durationMin:0,loggedAt:9,skipped:true,exercises:[]});
  st().logs.push({id:"X1",mesoId:"other",week:1,dayId:"z",dayName:"Z",date:"2026-11-05",notes:"",durationMin:30,loggedAt:10,exercises:[
    {exerciseId:"b_back_squat",target:{},sets:sets(20)}]});
  save(); w.go("home");

  const r=rows(), v=vol();
  ok("chest totals 18 across the meso", v.Chest.sets===18, JSON.stringify(v));
  ok("quads totals 9 (warm-ups, skips, other mesos excluded)", v.Quads.sets===9, JSON.stringify(v));
  ok("most sets listed first", r[0].m==="Chest");
  const L0=v.Chest.left;
  ok("next planned day shows as grey", L0>0 && v.Quads.left===L0, JSON.stringify(v));
  ok("biggest done + grey fills the bar", Math.abs(r[0].w+r[0].g-100)<0.2, JSON.stringify(r[0]));
  ok("no numbers on the right", $$('[data-act="volstats"] .spm-val').length===0);
  ok("all bars one colour", new Set([...$$('[data-act="volstats"] .spm-fill')].map(e=>e.style.background)).size===1);

  // open the workout: ticks count live, untick takes it back
  w.go("workout"); w.go("home");
  const ses=st().activeSession;
  ok("open workout: nothing ticked, all grey", vol().Chest.sets===18 && vol().Chest.left===L0, JSON.stringify(vol().Chest));
  const bench=ses.exercises.find(e=>e.exerciseId==="b_barbell_bench_press");
  const work=bench.sets.filter(s=>!(s.type==="warmup"||s.warmup));
  work[0].done=true; save();
  ok("tick a set: done +1, grey -1", vol().Chest.sets===19 && vol().Chest.left===L0-1, JSON.stringify(vol().Chest));
  work[0].done=false; save();
  ok("untick: back to where it was", vol().Chest.sets===18 && vol().Chest.left===L0, JSON.stringify(vol().Chest));
  bench.skipped=true; save();
  ok("skipped exercise drops its grey", vol().Chest.left===0, JSON.stringify(vol().Chest));
  st().activeSession=null; save(); w.go("home");
  ok("cardio not listed", !r.some(x=>x.m==="Cardio"));
  ok("no target ticks", $$('[data-act="volstats"] .spm-target').length===0);
  ok("header shows progress through the meso",
     /Wk \d of 5 · \d+ of \d+ workouts/.test($('[data-act="volstats"]').textContent));

  click($('[data-act="volstats"] .spm-row'));
  ok("tapping the card opens Stats", !!$("#statscope"));

  st().mesocycles=[]; st().activeMesoId=null; st().activeSession=null; save(); w.go("home");
  ok("no card without an active meso", !$('[data-act="volstats"]'));
});

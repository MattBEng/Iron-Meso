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
    v:r.querySelector(".spm-val").textContent,
    w:parseFloat(r.querySelector(".spm-fill").style.width)}));

  w.go("home");
  ok("no card until something is logged", !$('[data-act="volstats"]'));

  // the user's example: chest 18, quads 9 (plus a warm-up that must not count)
  [1,2,3].forEach(i=>st().logs.push({id:"L"+i,mesoId:"m",week:i,dayId:"d",dayName:"Day",
    date:"2026-11-0"+i,notes:"",durationMin:40,loggedAt:i,exercises:[
      {exerciseId:"b_barbell_bench_press",target:{},sets:sets(6)},
      {exerciseId:"b_back_squat",target:{},sets:[set(60,8,{type:"warmup"}),...sets(3)]}]}));
  st().logs.push({id:"S1",mesoId:"m",week:3,dayId:"d",dayName:"Day",date:"2026-11-04",notes:"",durationMin:0,loggedAt:9,skipped:true,exercises:[]});
  st().logs.push({id:"X1",mesoId:"other",week:1,dayId:"z",dayName:"Z",date:"2026-11-05",notes:"",durationMin:30,loggedAt:10,exercises:[
    {exerciseId:"b_back_squat",target:{},sets:sets(20)}]});
  save(); w.go("home");

  const r=rows();
  ok("chest totals 18 across the meso", r[0].m==="Chest" && r[0].v==="18", JSON.stringify(r));
  ok("quads totals 9 (warm-ups, skips, other mesos excluded)", r[1].m==="Quads" && r[1].v==="9", JSON.stringify(r));
  ok("most sets listed first", r[0].m==="Chest");
  ok("top muscle fills the bar", r[0].w===100, r[0].w);
  ok("quads at half of chest", r[1].w===50, r[1].w);
  ok("cardio not listed", !r.some(x=>x.m==="Cardio"));
  ok("no target ticks", $$('[data-act="volstats"] .spm-target').length===0);
  ok("header shows progress through the meso",
     /Wk \d of 5 · \d+ of \d+ workouts/.test($('[data-act="volstats"]').textContent));

  click($('[data-act="volstats"] .spm-row'));
  ok("tapping the card opens Stats", !!$("#statscope"));

  st().mesocycles=[]; st().activeMesoId=null; st().activeSession=null; save(); w.go("home");
  ok("no card without an active meso", !$('[data-act="volstats"]'));
});

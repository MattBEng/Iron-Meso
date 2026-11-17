/* 1.7.4 special unlocks: per-title showers, scheme effects layer, title frame,
   secret reveal, title lines, Glute Goddess finale. Rules in CUTIE-POINTS.md. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cutie special unlocks", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  A.clearTemplates();
  const SQ="b_back_squat", today=ev("todayISO()");
  st().settings.mode="fun"; st().profile.gender="Female"; save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:3,reps:8,rir:2,rest:90}],{weeks:20});
  const bulk=n=>Array.from({length:n},()=>({kg:2,reps:8,rir:2,done:true}));
  const big=(id,n,date)=>{ st().logs.push({id,mesoId:"m",week:1,dayId:"d",dayName:"Big",date:date||ev("isoShift")(today,-3),notes:"",
    durationMin:60,loggedAt:1,exercises:[{exerciseId:SQ,target:{sets:999,reps:8,rir:2},sets:bulk(n)}]}); save(); };

  // ---------- FRAME ----------
  const fr=ev("cutieFrame");
  ok("no frame at Gym Cutie", fr(0)==="");
  ok("bronze Hot Mumma to Strong Sweetheart", fr(1)==="bronze" && fr(3)==="bronze");
  ok("silver Iron Angel to Snack with Muscles", fr(4)==="silver" && fr(6)==="silver");
  ok("gold from Certified Powerpuff", fr(7)==="gold" && fr(9)==="gold");
  big("a",600);                                       // 6,100: Fit Queen
  w.go("home");
  ok("Home title wears its frame", !!$(".cutie-card .cutie-title.frame-bronze"));
  ok("effects layer in the Home card", !!$(".cutie-card .cfx"));
  w.go("analytics");
  ok("Stats title wears its frame", !!$(".cutie-card .cutie-title.frame-bronze"));

  // ---------- SHOWER PER TITLE ----------
  ev("titleUnlockModal(6)");
  ok("Snack with Muscles rains its own set", $$(".emoji-rain span").length>0 &&
     $$(".emoji-rain span").every(s=>ev("CUTIE_RAIN_BY_TITLE")[6].includes(s.textContent)));
  ok("unlock teases the next secret title", /secret title is waiting/.test($("#overlay").textContent));
  ev("closeModal()"); $$(".emoji-rain").forEach(x=>x.remove());

  // ---------- SECRET REVEAL ----------
  const c=ev("cutieState()");
  w.go("analytics");
  ok("first look records what's visible, no reveal", c.revealed===ev("cutieVisibleMax(true)") && !$(".cj-reveal"));
  big("b",250);                                       // 8,600: Strong Sweetheart -> one more title in view
  w.go("analytics");
  ok("a title coming into view animates once", $$(".cj-reveal").length===1 && /new 👀/.test($(".cj-reveal").textContent));
  w.go("analytics");
  ok("...and only once", !$(".cj-reveal"));
  const rev=c.revealed;
  w.go("settings"); for(let i=0;i<7;i++) click($("#appver"));
  click($("[data-dev='unlock']"));
  w.go("analytics");
  ok("dev points never spend a real reveal", c.revealed===rev);
  w.go("settings"); click($("[data-dev='reveal']"));
  ok("dev Secret reveal button animates a row", $$(".cj-reveal").length===1);
  w.go("settings"); for(let i=0;i<7;i++) click($("#appver"));

  // ---------- TITLE LINES ----------
  const lines=ev("titleLinesUnlocked()");
  ok("lines for reached titles only", lines.length>0 && lines.some(l=>/Hot Mumma/.test(l)) && !lines.some(l=>/Glute Goddess/.test(l)));
  const r=w.Math.random; w.Math.random=()=>0.01;
  ok("they join the rest-over messages", lines.includes(ev("restOverMsg()")));
  ok("and the finish-screen cheers", lines.includes(ev("cheerLine()")));
  w.Math.random=r;
  st().profile.gender="Male"; save();
  w.Math.random=()=>0.01;
  ok("never for non-Cutie profiles", !lines.includes(ev("restOverMsg()")));
  w.Math.random=r;
  st().profile.gender="Female"; save();

  // ---------- GODDESS FINALE ----------
  ok("no crown before Glute Goddess", (w.go("home"), !$(".goddess-crown")));
  big("c",1700);                                      // 25,600: Dumbbell Darling
  st().cutie.titles={0:today,1:today,2:today,3:today,4:today,5:today,6:today,7:today,8:today}; save();
  w.go("workout"); A.logSets(0,50,8);
  click($("[data-a='finish']"));
  if($("[data-ok]")) click($("[data-ok]"));
  if($("[data-skip]")) click($("[data-skip]"));
  click($("[data-ok]"));                               // Yay
  ok("crossing 26,000 opens the finale, not the normal unlock", !!$(".goddess-finale") && /Glute Goddess/.test($("#overlay").textContent));
  ok("crown shower", $$(".emoji-rain span").some(s=>s.textContent==="👑"));
  ok("finale recorded once", st().cutie.finaleShown===today);
  while($("#overlay").innerHTML) click($("[data-ok]"));
  w.go("home");
  ok("crown on the Home header for good", !!$(".brand .goddess-crown"));
  ok("points turn gold", !!$(".cutie-pill.goddess-pts"));
  ok("gold frame", !!$(".cutie-title.frame-gold"));
  ok("finale never shows again", (()=>{ ev("titleUnlockChain([9])"); return !$(".goddess-finale"); })());
  ev("closeModal()");
  st().cutie.finaleShown="x"; save();
  ev("goddessFinale(null, true)");
  ok("dev finale doesn't touch the record", st().cutie.finaleShown==="x");
  ev("closeModal()");
});

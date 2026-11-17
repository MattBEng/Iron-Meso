/* 1.7.1: Stats with Cutie on (Fun + Female) drops the PRs, strength across
   blocks, cardio and body sections and shows title progression, badges and
   Cutie stats instead. Everyone else keeps the original Stats page. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cutie stats page", ()=>{
  const {w,$,$$,st,save,ev}=A;
  A.clearTemplates();
  const SQ="b_back_squat", today=ev("todayISO()"), iso=d=>ev("isoShift")(today,d);
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:2,reps:5,rir:2,rest:90}],{id:"old",name:"Old",archived:true});
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:2,reps:5,rir:2,rest:90}]);
  A.pushLog(SQ,[{kg:60,reps:5,rir:2,done:true}],{mesoId:"old",date:iso(-30)});
  A.pushLog(SQ,[{kg:70,reps:5,rir:2,done:true}],{date:iso(-3)});
  A.pushLog(SQ,[{kg:80,reps:5,rir:2,done:true}],{date:iso(-1)});
  st().cardio.push({id:"c",date:iso(-2),type:"Bike",minutes:30,avgHR:130,zone:2,mesoId:"m"});
  st().bodyweight.push({date:iso(-2),kg:60},{date:iso(-1),kg:60.2});
  st().settings.mode="fun"; save();
  const kickers=()=>$$(".kicker").map(k=>k.textContent.trim());
  const secs=()=>$$("details.stat-sec").map(d=>d.dataset.sec);

  // ---------- EVERYONE ELSE: ORIGINAL PAGE ----------
  st().profile.gender="Male"; save(); w.go("analytics");
  ok("male: cardio and body sections present", secs().includes("cardio") && secs().includes("body"), secs().join(","));
  ok("male: PRs card present", kickers().some(k=>/^PRs this/.test(k)));
  ok("male: strength across blocks present", kickers().some(k=>/Strength progression/.test(k)));
  ok("male: no Cutie section", !secs().includes("cutie"));

  // ---------- CUTIE ON ----------
  st().profile.gender="Female"; save(); w.go("analytics");
  ok("cardio section gone", !secs().includes("cardio"), secs().join(","));
  ok("body section gone", !secs().includes("body"));
  ok("PRs this plan gone", !kickers().some(k=>/^PRs this/.test(k)));
  ok("strength across blocks gone", !kickers().some(k=>/Strength progression/.test(k)));
  ok("plan comparison kept", kickers().some(k=>/comparison/i.test(k)));
  ok("Cutie progress section added", secs().includes("cutie"));
  ok("title progression shows reached titles + the next 3", kickers().includes("Title progression") && $$(".cj-row").length===4, $$(".cj-row").length);
  ok("the rest are hidden as secret", /6 secret titles still to discover/.test($("[data-sec='cutie']").textContent));
  ok("next title shows points to go", /points to go/.test($("[data-sec='cutie']").textContent));
  ok("no time estimates (Matt: upsetting)", !/weeks? at your pace|weeks? to go/.test($("[data-sec='cutie']").textContent));
  ok("badges card with a tile per badge", kickers().includes("Badges unlocked") && $$(".badge-tile").length===10);
  ok("Cutie stats card", kickers().includes("Cutie stats") && /points per workout/.test($("[data-sec='cutie']").textContent));
  let threw=false; try{ w.go("analytics"); w.go("home"); w.go("analytics"); }catch(e){ threw=true; }
  ok("no errors redrawing without the cardio and body charts", !threw);
});

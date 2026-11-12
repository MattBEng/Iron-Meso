/* Bonus workout: an extra session that doesn't use up a meso day. The
   scheduled workout is parked and comes back as next; the bonus is logged and
   counted in stats, but never drives progression. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("bonus workout", ()=>{
  const {w,$,$$,click,st,save,ev,makeMeso}=A;
  A.clearTemplates();
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60}],
           {id:"m", weeks:4, deload:false});
  const meso=()=>st().mesocycles.find(m=>m.id==="m");
  const menuBtn=()=>$("[data-a='wmenu']");

  // ---------- MENU + CONFIRM ----------
  w.go("workout");
  const schedName=st().activeSession.dayName;
  ok("Train header has the ⋯ menu", !!menuBtn());
  click(menuBtn());
  ok("menu offers Bonus workout", !!$("[data-wm='bonus']"));
  click($("[data-wm='bonus']"));
  ok("bonus asks for confirmation", !!$("[data-bw='yes']"));
  click($("[data-bw='no']"));
  ok("cancel leaves the scheduled workout", !st().activeSession.bonus);

  click(menuBtn()); click($("[data-wm='bonus']")); click($("[data-bw='yes']"));
  const b=st().activeSession;
  ok("a blank bonus session opens", b.bonus===true && b.exercises.length===0);
  ok("the scheduled workout is parked", st().parkedSession && st().parkedSession.dayName===schedName);
  ok("header shows BONUS and what stays next",
     $(".wk-header").textContent.includes("BONUS") && $(".wk-header").textContent.includes(schedName));
  ok("no ⋯ menu on a bonus", !menuBtn());

  // ---------- LOG IT ----------
  b.exercises.push({slotId:null, exerciseId:"b_back_squat", target:{sets:2,reps:10,rir:2,rest:60,notes:""},
    suggestion:null, notes:"", skipped:false, rowsReady:true,
    sets:[{kg:60,reps:5,rir:2,done:true,touched:true,at:Date.now()},{kg:60,reps:5,rir:2,done:true,touched:true,at:Date.now()}]});
  save(); w.go("workout");
  A.finish();
  const log=st().logs.find(l=>l.bonus);
  ok("bonus is logged", !!log && log.exercises.length===1);
  ok("…flagged against the meso, not in it", log.mesoId===null && log.bonusOf==="m");
  ok("meso did not advance", ev("mesoPosition")(meso()).done===0);
  ok("parked slot cleared", st().parkedSession===null);
  ok("counts in meso volume", ev("mesoVolume")(meso()).some(r=>r.sets===2));
  ok("counts in meso summary", ev("mesoSummary")(meso()).t.sets===2, ev("mesoSummary")(meso()).t.sets);
  ok("counts toward streak", ev("streakCount()")===1, ev("streakCount()"));
  ok("excluded from progression history", ev("progHistory")("b_back_squat").length===0);
  ok("still in exercise history", ev("exerciseHistory")("b_back_squat").length===1);

  // ---------- SCHEDULED WORKOUT IS NEXT ----------
  w.go("workout");
  ok("the scheduled workout is back", !st().activeSession.bonus && st().activeSession.dayName===schedName);
  ok("no suggestion built from the bonus", st().activeSession.exercises[0].suggestion===null);

  // ---------- DISCARD KEEPS A STARTED SESSION ----------
  A.logSets(0, 100, 10); w.go("workout");
  click(menuBtn()); click($("[data-wm='bonus']"));
  ok("confirm mentions the kept sets", $("#overlay").textContent.includes("kept"));
  click($("[data-bw='yes']"));
  click($$(".iconbtn").find(x=>x.textContent.includes("✕")));
  ok("bonus leave sheet has no Skip", !$("[data-q='skip']"));
  click($("[data-q='discard']"));
  ok("discard restores the part-done workout",
     !st().activeSession.bonus && st().activeSession.exercises[0].sets.every(x=>x.done));
  ok("discard logs nothing", st().logs.length===1);

  let threw=false; try{ w.go("analytics"); w.go("calendar"); w.go("home"); }catch(e){ threw=true; }
  ok("stats, history and home render with a bonus present", !threw);
});

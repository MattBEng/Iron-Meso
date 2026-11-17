/* 1.7.5: assisted lifts score the right way round, deleting a meso keeps the
   full-workout bonus, a holiday pause can be added afterwards, a secret reveal
   waits for the section to be open, and the points ledger is cached. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cutie 1.7.5", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  A.clearTemplates();
  st().settings.mode="fun"; st().profile.gender="Female";
  st().cutie={titles:{}, bonusFrom:0}; save();
  const AP=st().exercises.find(e=>e.assisted).id, SQ="b_back_squat";
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:2,reps:5,rir:2,rest:90},{id:"s2",exerciseId:AP,sets:2,reps:8,rir:2,rest:90}]);
  const today=ev("todayISO()"), iso=d=>ev("isoShift")(today,d);
  const S=(kg,reps,n)=>Array.from({length:n||2},()=>({kg,reps,rir:2,done:true,at:null}));
  let seq=0;
  const add=(id,date,ex,o)=>{ st().logs.push(Object.assign({id,mesoId:"m",week:1,dayId:"d",dayName:"Day",date,notes:"",
    durationMin:40,loggedAt:++seq,exercises:ex.map(([e,sets])=>({exerciseId:e,target:{sets:2,reps:5,rir:2},sets}))},o||{})); save(); };
  const W=id=>ev("cutieWorkout")(id);

  // ---------- assisted lifts: less assistance is better ----------
  add("a1",iso(-30),[[AP,S(40,8)]]);
  add("a2",iso(-28),[[AP,S(50,8)]]);
  ok("more assistance is not a PR", W("a2").pr===0, W("a2").pr);
  ok("more assistance does not beat last time", W("a2").beat===0, W("a2").beat);
  add("a3",iso(-26),[[AP,S(30,8)]]);
  ok("less assistance than ever before is a PR", W("a3").pr===50, W("a3").pr);
  ok("less assistance beats last time", W("a3").beat===10, W("a3").beat);
  add("a4",iso(-24),[[AP,S(30,10)]]);
  ok("same assistance, more reps beats last time", W("a4").beat===10 && W("a4").pr===0, [W("a4").beat,W("a4").pr]);
  add("a5",iso(-22),[[AP,S(30,10)]]);
  ok("matching last time earns nothing", W("a5").beat===0 && W("a5").pr===0);
  add("n1",iso(-21),[[SQ,S(100,5)]]); add("n2",iso(-20),[[SQ,S(105,5)]]);
  ok("normal lifts still PR on more weight", W("n2").pr===50);

  // ---------- full-workout bonus survives deleting the meso ----------
  add("f1",iso(-10),[[SQ,S(100,5)],[AP,S(30,10)]]);
  ok("full workout earns the bonus", W("f1").full===30);
  const before=ev("cutieTotals()").real;
  w.go("mesos");
  click($$("[data-menu]").find(b=>b.dataset.menu==="m") || $("[data-menu]"));
  click($("[data-m='del']") || $$("#overlay button").find(b=>/Delete/.test(b.textContent)));
  ok("the meso is gone", !st().mesocycles.some(m=>m.id==="m"));
  ok("its logs carry the planned lift count", st().logs.find(l=>l.id==="f1").planned===2);
  ok("full bonus kept after the meso is deleted", W("f1").full===30);
  ok("lifetime points unchanged by the delete", ev("cutieTotals()").real===before, [before, ev("cutieTotals()").real]);

  // a finished workout is stamped with its planned lifts
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:2,reps:5,rir:2,rest:90}],{id:"m2"});
  w.go("workout"); A.logSets(0,110,5); w.go("workout"); A.finish();
  if($("[data-ok]")) click($("[data-ok]"));
  ok("finishing stamps planned lifts on the log", st().logs[st().logs.length-1].planned===1);

  // ---------- holiday pause after the fact ----------
  w.closeModal && w.closeModal();
  w.go("settings");
  $("#pfrom").value=iso(-20); $("#pto").value=iso(-12);
  click($("[data-a='addpause']"));
  ok("a pause that has already ended is accepted", (st().pauses||[]).some(p=>p.to===iso(-12)));
  ok("a past pause is listed so it can be removed", $("#view").textContent.includes("past") && !!$("[data-a='delpause']"));

  // ---------- secret reveal waits for the section to be open ----------
  st().cutie.revealed=0; st().settings.statsClosed=["cutie"]; save();
  w.go("analytics");
  ok("closed section does not spend the reveal", st().cutie.revealed===0, st().cutie.revealed);
  st().settings.statsClosed=[]; save();
  w.go("analytics");
  ok("open section reveals", st().cutie.revealed>0 && !!$(".cj-reveal"));

  // ---------- ledger cache ----------
  const L1=ev("cutieLedger()"), L2=ev("cutieLedger()");
  ok("ledger is reused while nothing changes", L1===L2);
  add("c1",today,[[SQ,S(60,5)]]);
  const L3=ev("cutieLedger()");
  ok("a new workout rebuilds the ledger", L3!==L1 && L3.workouts.some(x=>x.id==="c1"));
  st().logs.find(l=>l.id==="c1").exercises[0].sets.push({kg:60,reps:5,rir:2,done:true}); save();
  ok("an edit + save rebuilds it", ev("cutieWorkout")("c1").sets===3);
});

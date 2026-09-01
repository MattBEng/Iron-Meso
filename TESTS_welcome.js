/* Welcome-back messages: tiering by gap length, the cutie-layer gate
   (Fun mode + Female only), and the no-message cases. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("welcome back", ()=>{
  const {w,$,st,save,ev,makeMeso}=A;
  A.clearTemplates();

  // ---------- THE BANK ----------
  const s=ev("RETURN_MSGS_SHORT"), m=ev("RETURN_MSGS_MID"), l=ev("RETURN_MSGS_LONG");
  ok("30 messages in total", s.length+m.length+l.length===30, s.length+m.length+l.length);
  ok("all three tiers are populated", s.length&&m.length&&l.length);
  const all=[...s,...m,...l];
  ok("no duplicates", new Set(all).size===all.length);
  ok("every message is a non-empty string", all.every(x=>typeof x==="string" && x.trim().length>0));

  // ---------- TIERING ----------
  ok("under 3 days gets no message", ev("returnMessage")(2)===null);
  ok("no logged workouts gets no message", ev("returnMessage")(null)===null);
  ok("3 days -> short tier", s.includes(ev("returnMessage")(3)));
  ok("5 days -> short tier", s.includes(ev("returnMessage")(5)));
  ok("6 days -> mid tier", m.includes(ev("returnMessage")(6)));
  ok("13 days -> mid tier", m.includes(ev("returnMessage")(13)));
  ok("14 days -> long tier", l.includes(ev("returnMessage")(14)));
  ok("60 days -> long tier", l.includes(ev("returnMessage")(60)));

  // ---------- DAYS SINCE LAST WORKOUT ----------
  ok("no logs -> null", ev("daysSinceLastWorkout()")===null);
  const iso=d=>{ const x=new Date(); x.setDate(x.getDate()-d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; };
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60}]);
  st().logs.push({id:"L", mesoId:"m", week:1, dayId:"d", dayName:"Day", date:iso(4),
    notes:"", durationMin:30, loggedAt:1, exercises:[]});
  save();
  ok("counts whole days since the last log", ev("daysSinceLastWorkout()")===4,
     ev("daysSinceLastWorkout()"));

  // ---------- THE HOME CARD IS GATED TO THE CUTIE LAYER ----------
  st().settings.mode="fun"; st().profile.gender="Female"; save();
  w.go("home");
  ok("shows for Fun + Female after a 4-day gap", !!$(".welcome-back"));
  ok("card names the gap", $(".welcome-back").textContent.includes("4 days"));

  st().profile.gender="Male"; save(); w.go("home");
  ok("hidden for Male", !$(".welcome-back"));

  st().profile.gender="Female"; st().settings.mode="serious"; save(); w.go("home");
  ok("hidden in Serious mode", !$(".welcome-back"));

  // ---------- RECENT TRAINING = NO CARD ----------
  st().settings.mode="fun"; st().logs=[];
  st().logs.push({id:"L2", mesoId:"m", week:1, dayId:"d", dayName:"Day", date:iso(1),
    notes:"", durationMin:30, loggedAt:2, exercises:[]});
  save(); w.go("home");
  ok("no card when they trained yesterday", !$(".welcome-back"));

  st().logs=[]; save(); w.go("home");
  ok("no card for a brand-new user with no history", !$(".welcome-back"));

  // long gap shows the gentle tier
  st().logs.push({id:"L3", mesoId:"m", week:1, dayId:"d", dayName:"Day", date:iso(30),
    notes:"", durationMin:30, loggedAt:3, exercises:[]});
  save(); w.go("home");
  ok("long gap still shows a card", !!$(".welcome-back"));
  ok("long-gap card uses the gentle heading",
     $(".welcome-back").textContent.includes("Hey you"));
});

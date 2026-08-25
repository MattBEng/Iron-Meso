/* Workout lifecycle: rendering, logging, the finish flow (duration + date),
   date correctness, editing a past log, and the editability window. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("workout lifecycle", ()=>{
  const {w,$,$$,click,inp,st,save,ev,makeMeso,finish,logSets}=A;
  A.clearTemplates();
  makeMeso([
    {id:"s1", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60},
    {id:"s2", exerciseId:"c_treadmill", cardio:true, minutes:15, targetHR:null, notes:""}
  ]);

  w.go("workout");
  ok("workout header renders", !!$(".wk-header"));
  ok("set rows built", $$(".chk").length>=2, $$(".chk").length);
  ok("cardio card present", !!$(".cardio-card"));

  // --- the session date is stamped at CREATION, so it must not decide the log ---
  const s=st().activeSession;
  s.date="2026-08-01";                       // as if the Train tab was opened Aug 1
  logSets(0, 100, 10);                       // but training happens now
  st().activeSession.exercises[1].log.minutes=15;
  save();
  const realStart=ev("sessionStartDate")(st().activeSession);
  ok("start date comes from the logged set, not the stale session date",
     realStart===ev("todayISO()"), realStart);

  w.go("workout");
  click($("[data-a='finish']"));
  ok("finish asks for duration", !!$("#dur"));
  ok("finish asks for the date", !!$("#wdate"));
  ok("date prefilled to training start", $("#wdate").value===realStart, $("#wdate").value);
  inp($("#wdate"), "2026-08-20");            // user corrects it
  click($("[data-ok]"));
  ok("feedback survey appears", !!$("[data-done]"));
  click($("[data-done]"));
  if($("[data-ok]")) click($("[data-ok]"));

  const log=st().logs.at(-1);
  ok("log created", !!log);
  ok("chosen date is used", log.date==="2026-08-20", log.date);
  ok("loggedAt recorded", !!log.loggedAt);
  ok("sets persisted", log.exercises[0].sets.length===2, log.exercises[0].sets.length);
  ok("duration persisted", log.durationMin>0, log.durationMin);
  ok("cardio captured to store", st().cardio.length>0);
  ok("cardio date matches the log", st().cardio.at(-1).date===log.date);
  ok("active session cleared", st().activeSession===null);

  // --- editing a past log ---
  ok("recent log is editable", ev("logEditable")(log));
  w.startLogEdit(log.id);
  w.go("workout");
  ok("edit session opens", !!st().editSession);
  st().editSession.notes="edited note";
  w.saveLogEdit();
  ok("edit prompt offers the date", !!$("#wdate"));
  ok("edit date prefilled from the log", $("#wdate").value===log.date, $("#wdate").value);
  inp($("#wdate"), "2026-08-05");
  click($("[data-ok]"));
  const after=st().logs.find(l=>l.id===log.id);
  ok("edited date persists", after.date==="2026-08-05", after.date);
  ok("edited note persists", after.notes==="edited note");
  ok("still editable after changing the date", ev("logEditable")(after));

  // --- the editable window follows LOG ORDER, not the date field ---
  st().logs=[];
  for(let i=1;i<=6;i++) st().logs.push({id:"L"+i, mesoId:"m", week:1, dayId:"d", dayName:"Day",
    date:"2026-08-1"+i, notes:"", durationMin:40, loggedAt:1000+i, exercises:[]});
  st().logs.push({id:"BAD", mesoId:"m", week:1, dayId:"d", dayName:"Day",
    date:"2026-07-01", notes:"", durationMin:40, loggedAt:9999, exercises:[]});
  save();
  ok("a wrongly back-dated recent log stays editable",
     ev("logEditable")(st().logs.find(l=>l.id==="BAD")));
  ok("the oldest-logged workout drops out of the window",
     !ev("logEditable")(st().logs.find(l=>l.id==="L1")));

  // --- in-workout manual date change ---
  st().logs=[]; st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s9", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60}]);
  w.go("workout");
  ev("pickWorkoutDate")(st().activeSession);
  ok("in-workout date picker opens", !!$("#wd"));
  inp($("#wd"), "2026-08-10");
  click($("[data-ok]"));
  ok("in-workout date applied", st().activeSession.date==="2026-08-10", st().activeSession.date);
});

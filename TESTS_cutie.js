/* Cutie Points v2 (1.5.0): per-workout points, lifetime total, titles,
   top 3, best-workout celebrations, breakdown, dev mode. Rules in CUTIE-POINTS.md. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cutie points", ()=>{
  const {w,$,$$,click,inp,st,save,ev}=A;
  A.clearTemplates();
  const SQ="b_back_squat";
  st().settings.mode="fun"; st().profile.gender="Female"; save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:3,reps:8,rir:2,rest:90}]);
  const set=(t)=>Object.assign({kg:50,reps:8,rir:2,done:true},t?{type:t}:{});
  const add=(id,date,sets,o)=>{ st().logs.push(Object.assign({id,mesoId:"m",week:1,dayId:"d",dayName:"Day "+id,date,
    notes:"",durationMin:40,loggedAt:Date.parse(date),exercises:[{exerciseId:SQ,target:{sets:9,reps:8,rir:2},sets}]},o||{})); save(); };
  // target 9 sets: these fixtures never complete the plan, so no 1.7.0 "full workout" bonus muddies the base numbers
  const W=id=>ev("cutieWorkout")(id);

  // ---------- PER-WORKOUT FORMULA ----------
  add("a","2026-10-05",[set("warmup"),set(),set(),set()]);           // Mon wk A
  ok("100 + 10 per working set, warm-up excluded", W("a").total===130, W("a").total);
  st().cardio.push({id:"c1",date:"2026-10-05",type:"Bike",minutes:10,mesoId:"m",fromWorkout:true}); save();
  ok("in-workout cardio adds 3/min to its workout", W("a").total===160 && W("a").cardioMin===10, W("a").total);
  st().cardio.push({id:"c2",date:"2026-10-06",type:"Walk",minutes:20,fromWorkout:false}); save();
  ok("standalone cardio earns points too", ev("cutieTotals()").real===160+60, ev("cutieTotals()").real);
  st().logs.push({id:"sk",mesoId:"m",week:1,dayId:"d",dayName:"Skip",date:"2026-10-07",skipped:true,exercises:[],loggedAt:1}); save();
  ok("skipped workouts earn nothing", ev("cutieTotals()").count===1);

  // ---------- STREAK WEEK ----------
  add("b","2026-10-13",[set(),set()]);                                // next week
  ok("first workout of a week after an active week gets +50", W("b").streak===50 && W("b").total===170, W("b").total);
  add("c","2026-10-15",[set(),set()]);
  ok("...only the first workout that week", W("c").streak===0);
  add("e","2026-10-27",[set(),set()]);                                // gap week
  ok("no streak after an empty week", W("e").streak===0);
  add("bn","2026-11-03",[set(),set()],{mesoId:null,bonus:true,bonusOf:"m"});
  ok("bonus workout earns base + sets, no streak", W("bn").total===120 && W("bn").streak===0, W("bn").total);

  // ---------- TOTAL AND TITLES ----------
  const T=ev("cutieTotals()");
  const sum=T.ledger.workouts.reduce((t,x)=>t+x.total,0)+60;
  ok("lifetime total = workouts + standalone cardio", T.real===sum, T.real+" vs "+sum);
  const lv=ev("cutieLevel");
  ok("0 is Gym Cutie", lv(0).title==="Gym Cutie");
  ok("5,000 is Fit Queen", lv(5000).title==="Fit Queen" && lv(4999).title==="Hot Mumma");
  ok("23,000 is Glute Goddess", lv(23000).title==="Glute Goddess" && lv(99999).next===null);
  ok("10 thresholds for 10 titles", ev("CUTIE_THRESHOLDS").length===ev("CUTIE_TITLES").length);

  // ---------- TOP 3, TIES TO MOST RECENT ----------
  const top=ev("cutieTop")(3,T.ledger.workouts).map(x=>x.id);
  ok("top 3 by points", top[0]==="b" && top[1]==="a", top.join(","));
  ok("tie goes to the most recent workout (c, e, bn all 120)", top[2]==="bn", top.join(","));
  w.go("home");
  ok("Home shows the cutie card with 3 medals", $$(".cutie-top").length===3);
  w.go("analytics");
  ok("Stats shows the lifetime total", $(".cutie-total") && $(".cutie-total").textContent===T.real.toLocaleString());
  click($(".cutie-total"));
  ok("tapping the total opens the breakdown", /Your Cutie Points/.test($("#overlay").textContent));
  ok("breakdown lists sets and streak", /Sets/.test($("#overlay").textContent) && /Streak weeks/.test($("#overlay").textContent));
  ev("closeModal()");
  click($$(".cutie-top")[0]);
  ok("tapping a medal opens that workout read-only", st().editSession && st().editSession.logId==="b" && st().editSession.readonly);
  ok("workout header shows its points", $$("[data-cutie='workout']").length===1);
  st().editSession=null; save();

  // ---------- CALENDAR ----------
  ev("dayModal")("2026-10-13", st().logs.filter(l=>l.id==="b"), []);
  ok("calendar day shows points", /170 pts/.test($("#overlay").textContent), $("#overlay").textContent.replace(/\s+/g," ").slice(0,80));
  ev("closeModal()");

  // ---------- DELETE REMOVES POINTS ----------
  const before=ev("cutieTotals()").real;
  st().logs=st().logs.filter(l=>l.id!=="a"); save();
  // a (160) goes and b loses its streak week (50). a's 10 min of cardio stays in the
  // cardio log (review item 14) and now counts as standalone cardio (+30).
  ok("deleting a workout removes its points (and the streak it gave the next week)",
     ev("cutieTotals()").real===before-160-50+30, before+" -> "+ev("cutieTotals()").real);

  // ---------- BEST CHECKS ----------
  st().logs=[]; st().cardio=[]; save();
  const today=ev("todayISO()"), iso=d=>ev("isoShift")(today,d);
  add("f1",iso(-20),[set(),set(),set()]);
  ok("first ever workout is never a 'best'", ev("cutieBestCheck")("f1").best===null);
  add("f2",iso(-10),[set(),set(),set(),set(),set(),set()]);
  ok("beating every workout is an all-time best", ev("cutieBestCheck")("f2").best==="all");
  add("f3",iso(-3),[set(),set()]);
  add("f4",iso(-1),[set(),set(),set(),set()]);
  ok("beating the last 7 days is a weekly best", ev("cutieBestCheck")("f4").best==="week");
  add("f5",today,[set()]);
  ok("a smaller workout is no best", ev("cutieBestCheck")("f5").best===null);

  // ---------- FINISH SCREEN ----------
  st().logs=[]; st().activeSession=null; save();
  add("old",iso(-5),[set()]);
  w.go("workout"); A.logSets(0,50,8);
  click($("[data-a='finish']"));
  if($("[data-ok]")) click($("[data-ok]"));          // duration + date
  if($("[data-skip]")) click($("[data-skip]"));      // survey
  const txt=$("#overlay").textContent;
  ok("finish screen shows points earned", /\+\d+/.test(txt) && /Cutie Points/.test(txt), txt.replace(/\s+/g," ").slice(0,120));
  ok("...and the new best banner", /New personal best glow/.test(txt));
  ok("...and the per-workout lines", /working sets/.test(txt));
  ev("closeModal()");

  // ---------- NOT FOR EVERYONE ----------
  st().profile.gender="Male"; save();
  w.go("analytics");
  ok("no cutie card for a male profile", !$(".cutie-total"));
  w.go("home");
  ok("no cutie card on Home either", !$(".cutie-pill"));

  // ---------- DEV MODE ----------
  w.go("settings");
  for(let i=0;i<7;i++) click($("#appver"));
  ok("7 taps on the version turns dev mode on", ev("DEV.on")===true && !!w.localStorage.getItem("liftdaddy_dev"));
  ok("DEV badge shows", !!$("#devbadge"));
  ok("dev panel shows in Settings", !!$(".dev-card"));
  $("[data-dev='preview']").click();     // real click: toggles the checkbox, then bubbles
  ok("preview shows cutie features without changing gender", ev("cutieOn()")===true && st().profile.gender==="Male");
  inp($("#devpts"),"12345"); click($("[data-dev='setpts']"));
  ok("points override", ev("cutieTotals()").total===12345 && ev("cutieTotals()").real!==12345);
  ok("override drives the title", ev("cutieTitle")(ev("cutieTotals()").total)==="Iron Angel");
  click($("[data-dev='unlock']"));
  ok("unlock all = top title", ev("cutieTitle")(ev("cutieTotals()").total)==="Glute Goddess");
  ok("training data untouched by dev mode", !/liftdaddy_dev|12345|"preview"/.test(w.localStorage.getItem("ironmeso_v1")));
  click($("[data-dev='best']"));
  ok("fire new best shows the banner", /New personal best glow/.test($("#overlay").textContent));
  ev("closeModal()");
  w.go("settings");
  for(let i=0;i<7;i++) click($("#appver"));
  ok("7 taps again turns it off and clears overrides", !ev("DEV.on") && !w.localStorage.getItem("liftdaddy_dev"));
  ok("badge gone, preview gone", !$("#devbadge") && ev("cutieOn()")===false);
});

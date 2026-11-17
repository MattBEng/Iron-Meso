/* The duck (dev-only for now): a small creature that turns up on a page.
   Only shows with dev mode on AND the Duck switch on. On the Train tab it can't be
   tapped, and it reacts when an exercise is finished. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("duck", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  A.clearTemplates();
  A.makeMeso([{id:"s1",exerciseId:"b_back_squat",sets:2,reps:5,rir:2,rest:90}]);
  const duck=()=>w.document.getElementById("duck");
  const setDev=o=>w.eval("DEV="+JSON.stringify(o));

  // ---------- hidden from everyone by default ----------
  setDev({});
  ["home","analytics","calendar","settings","mesos"].forEach(v=>w.go(v));
  ok("no duck without dev mode", !duck());
  setDev({on:true}); w.go("home");
  ok("no duck with dev mode on but the switch off", !duck());
  st().settings.mode="fun"; st().profile.gender="Female"; save(); w.go("home");
  ok("no duck for a Cutie profile either (not released yet)", !duck());

  // ---------- dev switch ----------
  w.go("settings");
  ok("dev panel has the Duck switch", !!$("[data-dev='duck']"));
  $("[data-dev='duck']").checked=true; click($("[data-dev='duck']"));
  ok("switching it on shows the duck straight away", ev("DEV").duck===true && !!duck());

  // ---------- poses and pages ----------
  const poses=ev("DUCK_POSES");
  ok("every pose draws an svg", poses.every(p=>/^<svg[\s\S]*<\/svg>$/.test(ev("duckSVG")(p).trim())));
  const seen=new Set(); let repeat=false, last=null;
  for(let i=0;i<40;i++){ w.go(i%2? "home":"analytics"); const p=duck().dataset.pose; if(p===last) repeat=true; last=p; seen.add(p); }
  ok("a different pose on each page visit", !repeat);
  ok("all poses turn up", poses.every(p=>seen.has(p)), [...seen].join(","));
  ok("only ever one duck", $$("#duck").length===1);
  ["home","mesos","exercises","calendar","analytics","settings"].forEach(v=>{ w.go(v); ok(`duck on ${v}`, !!duck()); });

  // ---------- Train tab: there, still, and out of the way ----------
  w.go("workout");
  ok("duck is on the Train tab", !!duck());
  ok("…in the bottom-left corner", duck().dataset.spot==="bl");
  ok("…and can't be tapped, so it never steals a set tap", duck().classList.contains("dk-notap"));
  const trainPoses=new Set(); for(let i=0;i<20;i++){ w.go("workout"); trainPoses.add(duck().dataset.pose); }
  ok("only still poses on Train (no walking or peeking)", [...trainPoses].every(p=>["sit","stand","sleep"].includes(p)), [...trainPoses].join(","));

  // ---------- reacts when an exercise is finished ----------
  const s0=st().activeSession, n=s0.exercises[0].sets.length;
  const tick=i=>click($(`[data-chk="0:${i}"]`));
  s0.exercises[0].sets.forEach(x=>{ x.kg=100; x.reps=5; x.rir=3; }); save(); w.go("workout");
  for(let i=0;i<n-1;i++) tick(i);
  ok("no reaction while sets remain", !duck().dataset.gesture);
  tick(n-1);
  ok("finishing the exercise makes the duck react", ["flex","tired","cool"].includes(duck().dataset.gesture), duck().dataset.gesture);
  ok("…with an encouraging line", !!duck().querySelector(".dk-say") && duck().querySelector(".dk-say").textContent.length>2);
  ok("…drawn as that gesture", !!duck().querySelector(".dk-"+duck().dataset.gesture));
  ev("duckCheerEnd")();
  ok("then it goes back to a resting pose", !duck().dataset.gesture && ["sit","stand"].includes(duck().dataset.pose) && !duck().querySelector(".dk-say"));
  // a hard exercise usually gets the tired one
  const rnd=w.Math.random; w.Math.random=()=>0.1;
  ev("duckCheer")({sets:[{done:true,rir:0,kg:100,reps:5},{done:true,rir:1,kg:100,reps:5}]});
  ok("a hard exercise gets the tired gesture", duck().dataset.gesture==="tired");
  ev("duckCheerEnd")();
  ev("duckCheer")({sets:[{done:true,rir:3,kg:100,reps:5}]});
  ok("an easier one gets the strong gesture", duck().dataset.gesture==="flex");
  w.Math.random=rnd; ev("duckCheerEnd")();
  ok("every gesture draws", ["flex","tired","cool"].every(p=>/^<svg/.test(ev("duckSVG")(p).trim())));
  tick(n-1); tick(n-1);
  ok("un-ticking and re-ticking reacts again", !!duck().dataset.gesture);
  ev("duckCheerEnd")();
  w.go("home");
  ok("leaving Train puts it back to normal and tappable", !!duck() && !duck().classList.contains("dk-notap"));

  // ---------- tap ----------
  const force=p=>{ w.eval(`_duckPose=null; var __p=DUCK_POSES.splice(0); DUCK_POSES.push(${JSON.stringify(p)});`); w.go("home"); w.eval("DUCK_POSES.splice(0); __p.forEach(x=>DUCK_POSES.push(x));"); };
  force("sleep");
  ok("sleeping duck placed", duck().dataset.pose==="sleep" && !!duck().querySelector(".dk-zz"));
  click(duck());
  ok("tapping a sleeping duck wakes it", duck().dataset.pose==="sit" && !!duck().querySelector(".dk-say"));
  force("sit");
  const acts=new Set();
  for(let i=0;i<60;i++){ click(duck()); acts.add(duck().dataset.act); }
  ok("tapping does a mix of cute things", ["say","hop","spin","heart","wig"].every(a=>acts.has(a)), [...acts].join(","));
  ok("the duck tap doesn't navigate or open anything", w.eval("currentView")==="home" && !$("#overlay").innerHTML.trim());

  // ---------- off again ----------
  w.go("settings");
  $("[data-dev='duck']").checked=false; click($("[data-dev='duck']"));
  ok("switching it off removes the duck", !duck());
  setDev({on:true, duck:true}); w.go("home");
  click($("[data-dev='reset']") || (w.go("settings"), $("[data-dev='reset']")));
  ok("resetting dev overrides removes the duck", !duck() && !ev("DEV").duck);
  ok("nothing about the duck is saved in the app's data or backups", !/duck/i.test(w.LiftDaddy.Store.exportPayload()));
});

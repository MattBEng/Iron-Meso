/* Feature coverage: set types, setup notes, timed holds, bodyweight rows,
   workout notes, gender options, rest-over message bank. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("features", ()=>{
  const {w,$,$$,click,inp,change,st,save,ev,makeMeso}=A;
  A.clearTemplates();

  // ---------- SET TYPES ----------
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:3, reps:10, rir:2, rest:60}]);
  w.go("workout");
  click($$("[data-setmenu]")[0]);
  ok("set-type section in the set menu", !!$("[data-st]"));
  ok("four set types offered", $$("[data-st]").length===4, $$("[data-st]").length);
  click($("[data-st='amrap']"));
  ok("AMRAP stored on the set", st().activeSession.exercises[0].sets[0].type==="amrap");
  ok("AMRAP badge rendered", $$(".settype-badge").some(b=>b.textContent==="AMRAP"));
  click($$("[data-setmenu]")[0]);
  click($("[data-st='normal']"));
  ok("back to regular clears the type", st().activeSession.exercises[0].sets[0].type===null);
  ok("badge removed", !$$(".settype-badge").some(b=>b.textContent==="AMRAP"));

  // ---------- SETUP NOTE (library-level, carries across mesos) ----------
  click($$("[data-exmenu]")[0]);
  ok("setup-note option present", !!$("[data-m='setup']"));
  click($("[data-m='setup']"));
  inp($("#sn"), "Seat pin 4, back pad 2");
  click($("[data-ok]"));
  ok("setup note saved to the exercise library",
     ev('exById("b_back_squat")').setup==="Seat pin 4, back pad 2");
  ok("setup note pinned on the card", !!$(".setup-pin"));
  // a brand-new meso must still show it
  st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s2", exerciseId:"b_back_squat", sets:2, reps:10, rir:2, rest:60}], {id:"m2"});
  w.go("workout");
  ok("setup note carries into a new meso",
     $(".setup-pin") && $(".setup-pin").textContent.includes("Seat pin 4"));

  // ---------- WORKOUT NOTE ----------
  ok("no note bar before one is written", !$(".wk-note"));
  click($$(".iconbtn").find(b=>b.textContent.includes("📝")));
  inp($("#wn"), "Shoulder felt tight");
  click($("[data-ok]"));
  ok("workout note saved", st().activeSession.notes==="Shoulder felt tight");
  ok("note shows as a pinned bar", $(".wk-note") && $(".wk-note").textContent.includes("Shoulder"));
  ok("note button highlighted",
     $$(".iconbtn").some(b=>b.textContent.includes("📝") && b.classList.contains("has-note")));

  // ---------- BODYWEIGHT ROWS ----------
  st().exercises.push({id:"bw_test", name:"BW Test", muscle:"Abs",
    equipment:"Bodyweight", notes:"", builtin:false});
  st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s3", exerciseId:"bw_test", sets:2, reps:12, rir:2, rest:60}], {id:"m3"});
  w.go("workout");
  ok("bodyweight shows a BW cell", !!$(".bwcell"));
  ok("bodyweight has no weight input", $$("[data-f='kg']").length===0);

  // ---------- TIMED HOLDS ----------
  st().exercises.push({id:"plank_test", name:"Plank Test", muscle:"Abs",
    equipment:"Bodyweight", timed:true, notes:"", builtin:false});
  st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"s4", exerciseId:"plank_test", sets:3, reps:0, rir:2, secs:40, rest:60}], {id:"m4"});
  w.go("workout");
  ok("session flagged as timed", st().activeSession.exercises[0].timed===true);
  ok("seconds inputs rendered", $$("[data-f='secs']").length===3, $$("[data-f='secs']").length);
  ok("no weight input on a timed hold", $$("[data-f='kg']").length===0);
  ok("first-time hold prompt shown", $("#view").innerHTML.includes("First time — log your hold"));
  const secs=$$("[data-f='secs']");
  inp(secs[0],"45"); inp(secs[1],"42"); inp(secs[2],"38");
  const tset=st().activeSession.exercises[0].sets;
  ok("seconds captured per set", tset[0].secs===45 && tset[1].secs===42 && tset[2].secs===38);
  for(let i=0;i<3;i++){ const c=$$(".chk")[i]; if(c && !c.classList.contains("on")) click(c); }
  ok("timed sets log", st().activeSession.exercises[0].sets.every(x=>x.done));
  A.finish();
  const tlog=st().logs.at(-1);
  ok("seconds persist to the log",
     tlog.exercises[0].sets.map(x=>x.secs).join(",")==="45,42,38",
     tlog.exercises[0].sets.map(x=>x.secs).join(","));
  st().activeSession=null; save();
  w.go("workout");
  ok("last-time reference shown next session",
     $("#view").innerHTML.includes("45s · 42s · 38s"));

  // ---------- GENDER ----------
  w.go("settings");
  const opts=[...$("#pgender").options].map(o=>o.value);
  ok("gender options are exactly the three allowed",
     JSON.stringify(opts)===JSON.stringify(["","Female","Male","Prefer not to say"]), opts.join("|"));

  // ---------- PR TOAST IS FUN-MODE ONLY ----------
  st().settings.mode="serious"; save();
  st().logs=[]; st().mesocycles=[]; st().activeSession=null;
  makeMeso([{id:"pr1", exerciseId:"b_back_squat", sets:1, reps:5, rir:2, rest:60}], {id:"mpr"});
  st().logs.push({id:"prv", mesoId:"mpr", week:1, dayId:"d", dayName:"Day", date:"2026-08-01",
    notes:"", durationMin:30, loggedAt:1,
    exercises:[{exerciseId:"b_back_squat", target:{sets:1,reps:5,rir:2},
      sets:[{kg:100,reps:5,rir:2,done:true,expReps:5}]}]});
  save();
  let toasted=null;
  const realToast=w.toast; w.toast=(msg,kind)=>{ if(kind==="pr") toasted=msg; };
  ev("checkPR")("b_back_squat", 200, 5);        // a monster PR
  ok("Serious mode shows no PR popup", toasted===null, toasted);
  st().settings.mode="fun"; save();
  ev("checkPR")("b_back_squat", 200, 5);
  ok("Fun mode still celebrates a PR", toasted!==null);
  w.toast=realToast;

  // ---------- REST-OVER MESSAGES ----------
  ok("rest-over bank has 100 messages", ev("REST_OVER_MSGS").length===100, ev("REST_OVER_MSGS").length);
  const msg=ev("restOverMsg()");
  ok("rest-over message is a non-empty string", typeof msg==="string" && msg.length>0);
});

/* Cutie Points 1.6.0: title records, title unlock (hearts + emoji shower),
   colour scheme unlocks, progress bar, weekly/monthly totals, title list,
   dev mode for all of it. Rules in CUTIE-POINTS.md. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cutie titles + schemes", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  A.clearTemplates();
  const SQ="b_back_squat", today=ev("todayISO()");
  st().settings.mode="fun"; st().profile.gender="Female"; save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:3,reps:8,rir:2,rest:90}]);
  const bulk=n=>Array.from({length:n},()=>({kg:2,reps:8,rir:2,done:true}));   // light: stays under the Ton Up badge
  st().logs.push({id:"big",mesoId:"m",week:1,dayId:"d",dayName:"Big day",date:ev("isoShift")(today,-3),
    notes:"",durationMin:60,loggedAt:1,exercises:[{exerciseId:SQ,target:{sets:999,reps:8,rir:2},sets:bulk(475)}]});
  save();

  // ---------- FIRST RUN: EXISTING TITLES RECORDED SILENTLY ----------
  const c=ev("cutieState()");
  ok("setup: 4,850 points (First Step badge recorded, no points)", ev("cutieTotals()").real===4850, ev("cutieTotals()").real);
  ok("titles reached so far recorded, dated today", c.titles[0]===today && c.titles[1]===today && !c.titles[2]);
  w.LiftDaddy.Store.flush();
  ok("records are part of the saved data (backed up)", /"cutie"/.test(w.localStorage.getItem("ironmeso_v1")));

  // ---------- PROGRESS BAR ----------
  w.go("home");
  ok("progress shows points to the next title", /150 points to Fit Queen/.test($("#view").textContent));
  ok("a progress bar is drawn", !!$(".cutie-prog [role='progressbar']"));

  // ---------- SCHEMES LOCKED BELOW THEIR TITLE ----------
  w.go("settings");
  ok("10 schemes offered with Cutie on", $$("[data-scheme-pick]").length===10, $$("[data-scheme-pick]").length);
  ok("Mint Mojito locked until Fit Queen", $("[data-scheme-pick='mint']").disabled &&
     /Unlocks at Fit Queen/.test($("[data-scheme-pick='mint']").closest("label").textContent));
  ok("a locked scheme can't be applied", ev("schemeAllowed('mint')")===false);
  st().settings.funScheme="mint"; save(); ev("applyTheme()");
  ok("...even if set directly, the default shows", w.document.body.dataset.scheme==="default");
  st().settings.funScheme="default"; save(); ev("applyTheme()");

  // ---------- FINISH CROSSES A TITLE ----------
  w.go("workout"); A.logSets(0,50,8);
  click($("[data-a='finish']"));
  if($("[data-ok]")) click($("[data-ok]"));          // duration + date
  if($("[data-skip]")) click($("[data-skip]"));      // survey
  ok("finish screen first", /Workout done/.test($("#overlay").textContent));
  click($("[data-ok]"));                             // Yay
  const t=$("#overlay").textContent;
  ok("then the title unlock", /New title unlocked/.test(t) && /Fit Queen/.test(t), t.replace(/\s+/g," ").slice(0,90));
  ok("hearts and emojis shower down", !!$(".emoji-rain") && $$(".emoji-rain span").length>=30);
  ok("emoji shower uses the cute set", $$(".emoji-rain span").every(s=>ev("CUTIE_RAIN").includes(s.textContent)));
  ok("the unlocked scheme is offered", /Mint Mojito/.test(t) && !!$("[data-try='mint']"));
  click($("[data-try='mint']"));
  ok("Try it applies the scheme", st().settings.funScheme==="mint" && w.document.body.dataset.scheme==="mint");
  click($("[data-ok]"));
  ok("then the badge popup (Glow Up for the new title)", /Badge/.test($("#overlay").textContent) && /Glow Up/.test($("#overlay").textContent));
  click($("[data-ok]"));
  ok("tapping through goes Home", !$("#overlay").innerHTML);
  ok("Fit Queen recorded with today's date", ev("cutieState()").titles[2]===today);
  ok("no second celebration for the same title", ev("cutieSyncTitles()").length===0);

  // ---------- UNLOCKS STAY ----------
  st().logs=st().logs.filter(l=>l.id==="big"); save();      // delete the new workout: back under 5,000
  ok("points dropped below Fit Queen", ev("cutieTotals()").real<5000);
  ok("...but Mint Mojito stays unlocked", ev("schemeAllowed('mint')")===true && w.document.body.dataset.scheme==="mint");

  // ---------- TITLE LIST ----------
  w.go("analytics"); click($("[data-cutie='titles']"));
  ok("title list shows all 10", $$(".cutie-title-row").length===10);
  ok("unlocked ones show their date", $$(".cutie-title-row")[2].textContent.includes("Unlocked"));
  ok("locked ones are greyed with points to go", $$(".cutie-title-row")[5].classList.contains("locked") &&
     /points to go/.test($$(".cutie-title-row")[5].textContent));
  ok("rows name the scheme they unlock", /unlocks Angel Glow/.test($$(".cutie-title-row")[4].textContent));
  ev("closeModal()");

  // ---------- WEEK / MONTH ----------
  const P=ev("cutiePeriods()");
  ok("this week and best week", P.thisWeek>=0 && P.bestWeek>=P.thisWeek && P.bestWeek>=4800);
  ok("this month and best month", P.bestMonth>=P.thisMonth);
  ok("a bar per week is drawn", $$(".cutie-weeks .cw").length===P.bars.length && P.bars.length>=1);

  // ---------- NOT FOR MALE PROFILES ----------
  st().profile.gender="Male"; save(); ev("applyTheme()"); w.go("settings");   // Settings' gender change re-applies the theme
  ok("male fun profile sees only the 4 free schemes", $$("[data-scheme-pick]").length===4);
  ok("and a Cutie scheme falls back to the default look", w.document.body.dataset.scheme==="default");
  st().profile.gender="Female"; save(); ev("applyTheme()");

  // ---------- DEV MODE ----------
  const recordBefore=JSON.stringify(ev("cutieState()").titles);
  w.go("settings"); for(let i=0;i<7;i++) click($("#appver"));
  click($("[data-dev='unlock']"));
  ok("dev unlock opens every scheme", ev("schemeAllowed('goddess')")===true);
  w.go("settings");
  ok("...and they show unlocked in the picker", !$("[data-scheme-pick='goddess']").disabled);
  click($("[data-dev='title']"));
  ok("dev can fire the title unlock", /New title unlocked/.test($("#overlay").textContent) && !!$(".emoji-rain"));
  ev("closeModal()");
  ok("dev never writes title records", JSON.stringify(ev("cutieState()").titles)===recordBefore);
  st().settings.funScheme="goddess"; save(); ev("applyTheme()");
  ok("goddess applies in dev", w.document.body.dataset.scheme==="goddess");
  w.go("settings"); for(let i=0;i<7;i++) click($("#appver"));
  ok("dev off: a scheme she hasn't earned resets to default", st().settings.funScheme==="default" &&
     w.document.body.dataset.scheme==="default");
});

/* Cutie Points 1.7.0: bonus points (PR, full workout, beat last time,
   welcome back), badges, plan comparison, holiday pause. Rules in CUTIE-POINTS.md. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("cutie bonuses, badges, pause", ()=>{
  const {w,$,$$,click,inp,st,save,ev}=A;
  A.clearTemplates();
  const SQ="b_back_squat", BP="b_barbell_bench_press", DL="b_deadlift", OHP="b_overhead_press", RW="b_barbell_row";
  st().settings.mode="fun"; st().profile.gender="Female";
  st().cutie={titles:{}, bonusFrom:0};      // bonuses live for these fixtures (going-forward rule tested below)
  save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:2,reps:5,rir:2,rest:90},{id:"s2",exerciseId:BP,sets:2,reps:5,rir:2,rest:90}]);
  const today=ev("todayISO()"), iso=d=>ev("isoShift")(today,d);
  const S=(kg,reps,n,t)=>Array.from({length:n||1},()=>Object.assign({kg,reps,rir:2,done:true,at:null},t?{type:t}:{}));
  let seq=0;
  const add=(id,date,ex,o)=>{ st().logs.push(Object.assign({id,mesoId:"m",week:1,dayId:"d",dayName:"Day",date,notes:"",
    durationMin:40,loggedAt:++seq,exercises:ex.map(([e,sets,target])=>({exerciseId:e,target:{sets:target??9,reps:5,rir:2},sets}))},o||{})); save(); };
  const W=id=>ev("cutieWorkout")(id);

  // ---------- PR ----------
  add("p1",iso(-40),[[SQ,S(100,5,2)]]);
  ok("first time on a lift is not a PR", W("p1").pr===0);
  add("p2",iso(-38),[[SQ,S(105,5,2)]]);
  ok("heavier working set = PR, +50", W("p2").prs===1 && W("p2").pr===50, W("p2").pr);
  add("p3",iso(-36),[[SQ,S(105,5,2)]]);
  ok("matching the best is not a PR", W("p3").pr===0);
  add("p4",iso(-34),[[SQ,[...S(140,5,1,"warmup"),...S(100,5)]]]);
  ok("a warm-up never counts as a PR", W("p4").pr===0);
  add("p5",iso(-33),[[BP,S(50,5)],[DL,S(100,5)],[OHP,S(30,5)],[RW,S(60,5)]]);
  add("p6",iso(-32),[[BP,S(55,5)],[DL,S(110,5)],[OHP,S(35,5)],[RW,S(65,5)]]);
  ok("PRs capped at 3 a workout (150)", W("p6").prs===3 && W("p6").pr===150, W("p6").pr);

  // ---------- BEAT LAST TIME ----------
  ok("more volume than last time on a lift = +10 each", W("p6").beats===4 && W("p6").beat===40, W("p6").beat);
  ok("first time on a lift can't beat anything", W("p5").beat===0);
  ok("less volume = no beat bonus", W("p4").beat===0, W("p4").beat);

  // ---------- FULL WORKOUT ----------
  add("f1",iso(-31),[[SQ,S(100,5,2),2],[BP,S(50,5,2),2]]);
  ok("every planned lift with all its sets = +30", W("f1").full===30);
  add("f2",iso(-30),[[SQ,S(100,5,2),2],[BP,S(50,5,1),2]]);
  ok("a set short = no full bonus", W("f2").full===0);
  add("f3",iso(-29),[[SQ,S(100,5,2),2]]);
  ok("a planned lift missing = no full bonus", W("f3").full===0);
  add("f4",iso(-28),[[SQ,S(100,5,2),2],[BP,S(50,5,2),2]],{mesoId:null,bonus:true,bonusOf:"m"});
  ok("bonus workouts don't get the full bonus", W("f4").full===0);

  // ---------- WELCOME BACK ----------
  add("c1",iso(-14),[[SQ,S(60,5)]]);
  ok("14 days off = +75 welcome back", W("c1").comeback===75, W("c1").comeback);
  add("c2",iso(-1),[[SQ,S(60,5)]]);
  ok("13 days off = no bonus", W("c2").comeback===0);
  const T=ev("cutieTotals()");
  ok("bonuses add into the total", T.parts.bonus===T.ledger.workouts.reduce((t,x)=>t+x.bonusPts,0) && T.parts.bonus>0);
  ok("finish lines list the bonuses", /PRs/.test(ev("cutieLinesHTML")(W("p6"))) && /Beat last time on 4 lifts/.test(ev("cutieLinesHTML")(W("p6"))));

  // ---------- BADGES ----------
  const before=ev("cutieTotals()").real;
  ev("cutieState()");
  const B=()=>Object.keys(st().cutie.badges||{});
  ok("badges earned before 1.7.0 recorded silently", B().includes("first") && B().includes("triple") && B().includes("bonusbabe"), B().join(","));
  ok("not ones she hasn't earned", !B().includes("hundred") && !B().includes("ton"));
  ok("badges already earned on first run carry no points", ev("cutieTotals()").real===before, ev("cutieTotals()").real+" vs "+before);
  ok("10 badges, each named from MESSAGES.txt", ev("BADGE_DEFS").length===10 && ev("BADGE_NAMES")[4]==="Ton Up");
  add("t1",iso(-1),[[DL,S(250,10,4)]]);                                   // 10,000 kg
  const b0=ev("cutieTotals()").real-W("t1").total;
  ok("Ton Up for 10,000 kg in one workout", ev("cutieSyncBadges()").includes("ton"));
  ok("a badge earned from now on is worth 50", ev("cutieTotals()").real-W("t1").total===b0+50);
  const ea=new Date(); ea.setDate(ea.getDate()-1); ea.setHours(6,30,0,0);
  add("e1",iso(-1),[[SQ,[{kg:40,reps:5,rir:2,done:true,at:ea.getTime()}]]]);
  ok("Early Bird for a set before 7 am", ev("cutieSyncBadges()").includes("early"));
  st().cardio.push({id:"cx",date:iso(-2),type:"Bike",minutes:300,mesoId:"m",fromWorkout:false}); save();
  ok("Cardio Cutie for 300 min in one plan", ev("cutieSyncBadges()").includes("cardio"));
  st().logs=st().logs.filter(l=>l.id!=="t1"); save();
  ok("a badge is kept when the workout that earned it is deleted", !!st().cutie.badges.ton);

  // never missed + ten: a finished 1-day x 10-week plan with no skips
  st().mesocycles.push({id:"m2",name:"Done plan",weeks:10,deload:false,rampSets:false,split:"Custom",archived:true,
    days:[{id:"d2",name:"Only",exercises:[{id:"z",exerciseId:SQ,sets:1,reps:5,rir:2,rest:60}]}]}); save();
  for(let i=0;i<10;i++) add("n"+i,iso(-120+i*7),[[SQ,S(20,5)]],{mesoId:"m2",dayId:"d2"});
  ev("cutieSyncBadges()");
  ok("Ten Down and Never Missed recorded", B().includes("ten") && B().includes("never"), B().join(","));

  // ---------- TITLES & BADGES LIST ----------
  w.go("analytics"); click($("[data-cutie='titles']"));
  ok("badges listed under the titles", $$(".badge-row").length===10 && /Badges · \d+\/10/.test($("#overlay").textContent));
  ok("unearned badges greyed with what earns them", $$(".badge-row.locked").some(r=>/100 workouts all-time/.test(r.textContent)));
  ev("closeModal()");

  // ---------- FINISH: BADGE POPUP ----------
  st().cutie.badges={}; st().cutie.badgesInit=true; st().activeSession=null; save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:2,reps:5,rir:2,rest:90},{id:"s2",exerciseId:BP,sets:2,reps:5,rir:2,rest:90}],{id:"m3",weeks:10});
  w.go("workout");
  const ses=st().activeSession; ses.exercises.forEach(e=>e.sets.forEach(x=>{ x.kg=60; x.reps=5; x.done=true; x.at=null; })); save();
  click($("[data-a='finish']"));
  if($("[data-ok]")) click($("[data-ok]"));
  if($("[data-skip]")) click($("[data-skip]"));
  ok("finish screen shows the bonus lines", /Full workout/.test($("#overlay").textContent));
  click($("[data-ok]"));                                  // Yay
  while(/New title unlocked/.test($("#overlay").textContent)) click($("[data-ok]"));
  ok("badge popup after the finish screen", /Badges? earned/.test($("#overlay").textContent) && /\+50/.test($("#overlay").textContent));
  click($("[data-ok]"));
  ok("then Home", !$("#overlay").innerHTML);

  // ---------- PLAN COMPARISON ----------
  w.go("analytics");
  ok("Stats compares this plan with the most recent other one", !!$(".cutie-compare") && /Test/.test($(".cutie-compare").textContent), $(".cutie-compare")&&$(".cutie-compare").textContent.replace(/\s+/g," "));

  // ---------- HOLIDAY PAUSE ----------
  st().logs=[]; st().pauses=[]; save();
  add("h1",iso(-20),[[SQ,S(60,5)]]);
  add("h2",today,[[SQ,S(60,5)]]);
  ok("without a pause a 20-day gap breaks the streak", ev("streakCount()")===1);
  st().pauses=[{id:"x",from:iso(-19),to:iso(-1)}]; save();
  ok("paused days don't break it", ev("streakCount()")===2);
  st().logs=[]; save();
  const wk=ev("isoWeekStart")(today);
  add("w1",ev("isoShift")(wk,-21),[[SQ,S(60,5)]]);
  add("w2",wk,[[SQ,S(60,5)]]);
  st().pauses=[]; save();
  ok("2 empty weeks = no streak week bonus", W("w2").streak===0);
  st().pauses=[{id:"y",from:ev("isoShift")(wk,-14),to:ev("isoShift")(wk,-1)}]; save();
  ok("paused weeks keep the streak week going", W("w2").streak===50);

  st().pauses=[{id:"z",from:iso(-2),to:iso(5)}]; save();
  w.go("home");
  ok("Home shows the holiday card", /On holiday/.test($("#view").textContent) && /paused until/.test($("#view").textContent));
  ok("streak pill says paused", /paused/.test($(".pill.acc").textContent));
  ok("no welcome-back card while away", !$(".welcome-back"));

  st().pauses=[]; save(); w.go("settings");
  inp($("#pfrom"),iso(10)); inp($("#pto"),iso(5)); click($("[data-a='addpause']"));
  ok("end before start is refused", !(st().pauses||[]).length);
  w.go("settings"); inp($("#pfrom"),iso(10)); inp($("#pto"),iso(20)); click($("[data-a='addpause']"));
  ok("a valid pause is saved", st().pauses.length===1 && st().pauses[0].to===iso(20));
  ok("and listed in Settings", /🏝️/.test($("#view").textContent));
  click($("[data-a='delpause']"));
  ok("and can be removed", st().pauses.length===0);

  // ---------- NOT RETROACTIVE ----------
  st().logs=[]; st().cutie={titles:{}}; save();
  add("r1",iso(-10),[[SQ,S(60,5)]]); add("r2",iso(-9),[[SQ,S(80,5)]]);
  ev("cutieState()");
  ok("workouts from before 1.7.0 get no bonuses", W("r2").pr===0 && W("r2").beat===0, JSON.stringify([W("r2").pr,W("r2").beat]));
  st().logs.push({id:"r3",mesoId:"m",week:1,dayId:"d",dayName:"Day",date:today,notes:"",durationMin:40,loggedAt:Date.now()+1000,
    exercises:[{exerciseId:SQ,target:{sets:9,reps:5,rir:2},sets:S(90,5)}]}); save();
  ok("workouts finished after it do", W("r3").pr===50 && W("r3").beat===10, JSON.stringify([W("r3").pr,W("r3").beat]));

  // ---------- DEV ----------
  for(let i=0;i<7;i++) click($("#appver"));
  click($("[data-dev='badge']"));
  ok("dev can fire the badge popup", /Badges earned/.test($("#overlay").textContent));
  ev("closeModal()");
});

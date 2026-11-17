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
  ok("only still poses on Train (no walking, skating or peeking)", [...trainPoses].every(p=>["sit","stand","sleep"].includes(p)), [...trainPoses].join(","));

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
  // a controllable clock, so "quick" and "slow" taps can be told apart
  let clock=1e6; const realNow=w.Date.now; w.Date.now=()=>clock;
  const tap=gap=>{ clock+=gap; click(duck()); return duck().dataset.act; };
  force("sit");
  const acts=new Set();
  for(let i=1;i<=80;i++){ const a=tap(3000); if(i%5) acts.add(a); }
  ok("slow taps do a mix of cute things", ["say","hop","spin","heart","wig"].every(a=>acts.has(a)), [...acts].join(","));
  ok("slow taps never bring out the knife", !acts.has("stab") && duck().dataset.gesture!=="stab");
  ok("the duck tap doesn't navigate or open anything", w.eval("currentView")==="home" && !$("#overlay").innerHTML.trim());

  // ---------- every fifth tap: an egg, or the flock ----------
  const rnd0=w.Math.random;
  force("sit"); w.Math.random=()=>0.1;
  for(let i=0;i<4;i++) tap(3000);
  ok("four taps: nothing special yet", !duck().querySelector(".dk-egg") && !$(".pet-rain"));
  ok("fifth tap lays an egg", tap(3000)==="egg" && duck().querySelectorAll(".dk-egg").length===1);
  for(let i=0;i<20;i++) tap(3000);
  ok("at most three eggs", duck().querySelectorAll(".dk-egg").length===3);
  force("sit"); w.Math.random=()=>0.9;
  for(let i=0;i<4;i++) tap(3000);
  ok("…or the flock rains down", tap(3000)==="flock" && $$(".pet-rain i").length===18);
  ok("the flock never blocks taps", $(".pet-rain").className==="pet-rain");
  w.Math.random=rnd0;
  w.go("analytics"); 
  ok("eggs are gone on the next page", !duck().querySelector(".dk-egg"));

  // ---------- ten quick taps: it has had enough ----------
  force("sit");
  for(let i=0;i<9;i++) tap(200);
  ok("nine quick taps: still friendly", duck().dataset.gesture!=="stab");
  tap(200);
  ok("ten quick taps: cross, with a little knife", duck().dataset.gesture==="stab" && !!duck().querySelector(".dk-stab .dk-knife"));
  ok("…and a line to match", /🔪/.test(duck().querySelector(".dk-say").textContent));
  const before=duck().querySelector(".dk-wrap").innerHTML; tap(200); tap(200);
  ok("tapping it while cross does nothing more", duck().querySelector(".dk-wrap").innerHTML===before);
  ev("duckCheerEnd")();
  ok("then it calms down again", !duck().dataset.gesture && !duck().querySelector(".dk-knife"));
  force("sit");
  for(let i=0;i<9;i++) tap(200); tap(2500);
  ok("a pause in the middle resets the count", duck().dataset.gesture!=="stab");
  w.Date.now=realNow;

  // ---------- off again ----------
  w.go("settings");
  $("[data-dev='duck']").checked=false; click($("[data-dev='duck']"));
  ok("switching it off removes the duck", !duck());
  setDev({on:true, duck:true}); w.go("home");
  click($("[data-dev='reset']") || (w.go("settings"), $("[data-dev='reset']")));
  ok("resetting dev overrides removes the duck", !duck() && !ev("DEV").duck);
  ok("nothing about the duck is saved until a pet is chosen", !/duck/i.test(w.LiftDaddy.Store.exportPayload()) && st().settings.pet===undefined);

  // ---------- skateboard add-on ----------
  setDev({on:true, duck:true});
  ok("skating is one of the poses", ev("DUCK_POSES").includes("skate") && !ev("DUCK_TRAIN_POSES").includes("skate"));
  force("skate");
  ok("the skating duck has a board and rolls across", !!duck().querySelector(".dk-skate .dk-board") && duck().dataset.spot==="walk");
  setDev({on:true});

  // ---------- only the duck is live; the other birds are hidden work in progress ----------
  const PETS=ev("PETS"), TITLES=ev("CUTIE_TITLES");
  ok("only Daisy the duck is live", ev("petsLive()").length===1 && ev("petsLive()")[0].id==="daisy" && PETS.slice(1).every(p=>p.wip));
  st().cutie={titles:{0:"2026-11-01",1:"2026-11-02",2:"2026-11-03",3:"2026-11-04"}, init:true, badgesInit:true, bonusFrom:0, badges:{}}; save();
  setDev({on:true, duck:true}); w.go("settings");
  ok("Settings offers just the duck, or no pet", $$("[data-pet]").length===2 && !!$('[data-pet="daisy"]') && !!$('[data-pet=""]'));
  ok("no hint of other pets", !/secret pet/.test($("#view").textContent) && !$('[data-pet="peep"]'));
  ok("a higher title doesn't swap in an unfinished pet", ev("petPick()").id==="daisy");
  ev("titleUnlockModal")(2);
  ok("title unlocks don't mention unfinished pets", !/New pet unlocked/.test($("#overlay").textContent));
  w.closeModal();
  click($('[data-pet=""]'));
  ok("No pet turns the duck off", st().settings.pet==="" && !duck());
  click($('[data-pet="daisy"]'));
  ok("and she can be brought back", st().settings.pet==="daisy" && !!duck());
  delete st().settings.pet; save();
  ok("dev panel can show the unfinished pets", !!$("[data-dev='allpets']"));

  // ---------- with unfinished pets shown (dev): one per title, one active at most ----------
  setDev({on:true, duck:true, allPets:true});
  ok("one pet for every title", PETS.length===TITLES.length && PETS.every((p,i)=>p.at===i));
  ok("every pet draws in every pose", PETS.every(p=>["sit","stand","sleep","peek","waddle","flex","tired","cool","stab"].every(q=>{ const v=ev("petSVG")(q,p); return /^<svg[\s\S]*<\/svg>$/.test(v) && !/NaN|undefined/.test(v); })));
  st().cutie={titles:{0:"2026-11-01"}, init:true, badgesInit:true, bonusFrom:0, badges:{}}; save();
  setDev({on:true, duck:true, allPets:true}); w.go("settings");
  ok("Settings has a Pets card", $("#view").textContent.includes("Pets") && !!$("[data-pet]"));
  ok("starts with the first pet", ev("petPick()").id===PETS[0].id && duck().getAttribute("aria-label")===PETS[0].name);
  ok("locked pets are shown but can't be picked", !!$(`[data-pet="${PETS[1].id}"]`) && $(`[data-pet="${PETS[1].id}"]`).disabled);
  ok("pets for secret titles stay hidden", !$(`[data-pet="${PETS[9].id}"]`) && /secret pet/.test($("#view").textContent));
  click($(`[data-pet="${PETS[1].id}"]`)); 
  ok("tapping a locked pet does nothing", st().settings.pet===undefined);
  st().cutie.titles[1]="2026-11-10"; st().cutie.titles[2]="2026-11-12"; save(); w.go("settings");
  ok("the newest unlocked pet comes out by default", ev("petPick()").id===PETS[2].id);
  click($(`[data-pet="${PETS[1].id}"]`));
  ok("picking a pet makes it the one that's out", st().settings.pet===PETS[1].id && ev("petPick()").id===PETS[1].id);
  ok("only one is marked active", $$(".pet-opt.on").length===1 && $(".pet-opt.on").dataset.pet===PETS[1].id);
  ok("the pet on screen is the chosen one", duck().getAttribute("aria-label")===PETS[1].name);
  click($('[data-pet=""]'));
  ok("No pet turns it off everywhere", st().settings.pet==="" && !duck());
  w.go("home"); w.go("workout");
  ok("…including Train", !duck());
  w.go("settings"); click($(`[data-pet="${PETS[0].id}"]`));
  ok("and a pet can be brought back", !!duck() && ev("petPick()").id===PETS[0].id);
  // unlock moment
  ev("titleUnlockModal")(2);
  ok("a title unlock introduces its pet", /New pet unlocked/.test($("#overlay").textContent) && $("#overlay").textContent.includes(PETS[2].name));
  click($(`#overlay [data-pet="${PETS[2].id}"]`));
  ok("…and Bring along switches to it", st().settings.pet===PETS[2].id);
  w.closeModal();
  // not released: without the dev switch there is no Pets card and no unlock line
  setDev({on:true}); w.go("settings");
  ok("no Pets card without the dev switch", !$("[data-pet]") && !duck());
  ev("titleUnlockModal")(2);
  ok("no pet line on title unlocks without it", !/New pet unlocked/.test($("#overlay").textContent));
  w.closeModal();
});

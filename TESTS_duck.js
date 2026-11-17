/* The duck (1.9.0). Live for Cutie profiles only (Fun mode + Female): on every
   page except Plans, switched on or off in Settings. On the Train tab it can't
   be tapped and it reacts when an exercise is finished. The skateboard unlocks
   at Strong Sweetheart. The other birds are unfinished and hidden. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("duck", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  A.clearTemplates();
  A.makeMeso([{id:"s1",exerciseId:"b_back_squat",sets:2,reps:5,rir:2,rest:90}]);
  const duck=()=>w.document.getElementById("duck");
  const setDev=o=>w.eval("DEV="+JSON.stringify(o));
  const titles=n=>{ const t={}; for(let i=0;i<=n;i++) t[i]="2026-11-01"; st().cutie={titles:t, init:true, badgesInit:true, bonusFrom:0, badges:{}}; save(); };
  const SKATE_AT=ev("PET_ADDONS").find(a=>a.id==="skate").at;
  setDev({});

  // ---------- who gets it ----------
  st().settings.mode="fun"; st().profile.gender="Male"; save();
  ["home","analytics","calendar","settings"].forEach(v=>w.go(v));
  ok("no duck in Fun mode without a Cutie profile", !duck());
  ok("…and no duck card in Settings", !$("#petcard"));
  st().profile.gender="Female"; st().settings.mode="serious"; save(); w.go("home");
  ok("no duck in Serious mode", !duck());
  w.go("settings");
  ok("the duck card is hidden in Serious mode", !$("#petcard"));
  st().settings.mode="fun"; titles(0); w.go("home");
  ok("a Cutie profile has the duck from the start, no dev mode needed", !!duck() && duck().getAttribute("aria-label")==="Daisy");
  ok("nothing is saved about it until she changes a setting", st().settings.pet===undefined && st().settings.petAddons===undefined);

  // ---------- pages ----------
  ["home","exercises","calendar","analytics","settings","workout"].forEach(v=>{ w.go(v); ok(`duck on ${v}`, !!duck()); });
  w.go("mesos");
  ok("not on Plans", !duck());
  w.go("mesos","new");
  ok("not while setting up a meso", !duck());
  w.go("home");
  ok("back after leaving Plans", !!duck());
  ok("only ever one duck", $$("#duck").length===1);

  // ---------- poses ----------
  const poses=ev("DUCK_POSES");
  ok("every pose draws an svg", poses.every(p=>/^<svg[\s\S]*<\/svg>$/.test(ev("duckSVG")(p).trim())));
  let seen=new Set(), repeat=false, last=null;
  for(let i=0;i<60;i++){ w.go(i%2? "home":"analytics"); const p=duck().dataset.pose; if(p===last) repeat=true; last=p; seen.add(p); }
  ok("a different pose on each page visit", !repeat);
  ok("all the starting poses turn up", ["sit","stand","sleep","peek","waddle"].every(p=>seen.has(p)), [...seen].join(","));

  // ---------- skateboard: unlocks at Strong Sweetheart ----------
  ok("the skateboard is tied to Strong Sweetheart", ev("CUTIE_TITLES")[SKATE_AT]==="Strong Sweetheart");
  ok("no skating before that title", !seen.has("skate") && !ev("addonOn")("skate"));
  titles(SKATE_AT);
  seen=new Set(); for(let i=0;i<80;i++){ w.go(i%2? "home":"analytics"); seen.add(duck().dataset.pose); }
  ok("skating turns up once the title is earned", seen.has("skate") && ev("addonOn")("skate"));
  const force=p=>w.eval(`_duckPose=null; duckPlace("home", ${JSON.stringify(p)})`);
  w.go("home"); force("skate");
  ok("the skating duck has a board and rolls across", !!duck().querySelector(".dk-skate .dk-board") && duck().dataset.spot==="walk");
  ev("titleUnlockModal")(SKATE_AT);
  ok("that title's unlock announces the skateboard", /got a skateboard/.test($("#overlay").textContent));
  w.closeModal();
  ev("titleUnlockModal")(SKATE_AT-1);
  ok("other titles don't", !/skateboard/i.test($("#overlay").textContent));
  w.closeModal();

  // ---------- Settings: on/off, including the unlocks ----------
  w.go("settings");
  ok("Settings has the duck card", !!$("#petcard") && !!$("[data-petshow]") && $("[data-petshow]").checked);
  ok("…with the skateboard switch, on by default", !!$("[data-addon='skate']") && $("[data-addon='skate']").checked && !$("[data-addon='skate']").disabled);
  $("[data-addon='skate']").checked=false; click($("[data-addon='skate']"));
  ok("skateboard can be switched off", st().settings.petAddons.skate===false && !ev("addonOn")("skate"));
  seen=new Set(); for(let i=0;i<80;i++){ w.go(i%2? "home":"analytics"); seen.add(duck().dataset.pose); }
  ok("…and then she never skates", !seen.has("skate"));
  w.go("settings");
  $("[data-addon='skate']").checked=true; click($("[data-addon='skate']"));
  ok("and back on", ev("addonOn")("skate"));
  $("[data-petshow]").checked=false; click($("[data-petshow]"));
  ok("the duck can be switched off", st().settings.pet==="" && !duck());
  ["home","workout","analytics"].forEach(v=>w.go(v));
  ok("…everywhere, including Train", !duck());
  w.go("settings");
  ok("her things are greyed out while she's off", $("[data-addon='skate']").disabled);
  $("[data-petshow]").checked=true; click($("[data-petshow]"));
  ok("and back on", st().settings.pet==="daisy" && !!duck());
  titles(0); w.go("settings");
  ok("before the title, the skateboard shows as locked", $("[data-addon='skate']").disabled && /Unlocks at Strong Sweetheart/.test($("#petcard").textContent));
  click($("[data-addon='skate']"));
  ok("a locked add-on can't be switched on", !ev("addonOn")("skate"));
  titles(SKATE_AT);

  // ---------- Train tab: there, still, and out of the way ----------
  w.go("workout");
  ok("on the Train tab it sits bottom-left", duck().dataset.spot==="bl");
  ok("…and can be tapped there like anywhere else", !duck().classList.contains("dk-notap") && w.getComputedStyle(duck()).pointerEvents!=="none");
  const trainPoses=new Set(); for(let i=0;i<30;i++){ w.go("workout"); trainPoses.add(duck().dataset.pose); }
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
  const rnd=w.Math.random; w.Math.random=()=>0.1;
  ev("duckCheer")({sets:[{done:true,rir:0,kg:100,reps:5},{done:true,rir:1,kg:100,reps:5}]});
  ok("a hard exercise gets the tired gesture", duck().dataset.gesture==="tired");
  ev("duckCheerEnd")();
  ev("duckCheer")({sets:[{done:true,rir:3,kg:100,reps:5}]});
  ok("an easier one gets the strong gesture", duck().dataset.gesture==="flex");
  w.Math.random=rnd; ev("duckCheerEnd")();
  st().settings.pet=""; save(); w.go("workout"); tick(n-1); tick(n-1);
  ok("no reaction when the duck is switched off", !duck());
  delete st().settings.pet; save();
  w.go("home");
  ok("leaving Train it's still there", !!duck());

  // ---------- taps ----------
  let clock=1e6; const realNow=w.Date.now; w.Date.now=()=>clock;
  const tap=gap=>{ clock+=gap; click(duck()); return duck().dataset.act; };
  force("sleep");
  ok("sleeping duck placed", duck().dataset.pose==="sleep" && !!duck().querySelector(".dk-zz"));
  tap(3000);
  ok("tapping a sleeping duck wakes it", duck().dataset.pose==="sit" && !!duck().querySelector(".dk-say"));
  force("sit");
  const acts=new Set();
  for(let i=1;i<=80;i++){ const a=tap(3000); if(i%5) acts.add(a); }
  ok("slow taps do a mix of cute things", ["say","hop","spin","heart","wig"].every(a=>acts.has(a)), [...acts].join(","));
  ok("slow taps never bring out the knife", !acts.has("stab") && duck().dataset.gesture!=="stab");
  ok("the duck tap doesn't navigate or open anything", w.eval("currentView")==="home" && !$("#overlay").innerHTML.trim());
  // every fifth tap: an egg, or the flock
  w.go("home"); force("sit"); w.Math.random=()=>0.1;
  for(let i=0;i<4;i++) tap(3000);
  ok("four taps: nothing special yet", !duck().querySelector(".dk-egg") && !$(".pet-rain"));
  ok("fifth tap lays an egg", tap(3000)==="egg" && duck().querySelectorAll(".dk-egg").length===1);
  for(let i=0;i<20;i++) tap(3000);
  ok("at most three eggs", duck().querySelectorAll(".dk-egg").length===3);
  w.go("home"); force("sit"); w.Math.random=()=>0.9;
  for(let i=0;i<4;i++) tap(3000);
  ok("…or ducks rain down the screen", tap(3000)==="flock" && $$(".pet-rain i").length===18);
  w.Math.random=rnd;
  w.go("analytics");
  ok("eggs and the flock are gone on the next page", !duck().querySelector(".dk-egg") && !$(".pet-rain"));
  // after the fifth-tap trick she moves to the other corner, out of the way
  w.go("home"); force("sit");
  const corner=duck().dataset.spot;
  for(let i=0;i<5;i++) tap(3000);
  ev("duckMove")(duck());
  ok("after the fifth-tap trick she swaps corners", ["bl","br"].includes(corner) && duck().dataset.spot!==corner && ["bl","br"].includes(duck().dataset.spot));
  ok("…and faces the right way for that corner", duck().classList.contains("dk-flip")===(duck().dataset.spot==="br"));
  // ten quick taps
  w.go("home"); force("sit");
  for(let i=0;i<9;i++) tap(200);
  ok("nine quick taps: still friendly", duck().dataset.gesture!=="stab");
  tap(200);
  ok("ten quick taps: cross, with a little knife", duck().dataset.gesture==="stab" && !!duck().querySelector(".dk-stab .dk-knife"));
  ok("…and a line to match", /🔪/.test(duck().querySelector(".dk-say").textContent));
  const before=duck().querySelector(".dk-wrap").innerHTML; tap(200); tap(200);
  ok("tapping it while cross does nothing more", duck().querySelector(".dk-wrap").innerHTML===before);
  const d0=duck(); ev("duckLeave")(d0);
  ok("then she storms off", d0.classList.contains("dk-leave") && /I'm out/.test(d0.textContent));
  d0.remove();
  w.go("analytics"); w.go("home");
  ok("…and stays off that page", !duck());
  w.go("analytics");
  ok("other pages still have her", !!duck());
  clock+=2*60*1000+1000; w.go("home");
  ok("she's back on that page after two minutes", !!duck());
  force("sit");
  for(let i=0;i<9;i++) tap(200); tap(2500);
  ok("a pause in the middle resets the count", duck().dataset.gesture!=="stab");
  w.Date.now=realNow;

  // ---------- only the duck is live; the other birds are hidden work in progress ----------
  const PETS=ev("PETS"), TITLES=ev("CUTIE_TITLES");
  ok("only Daisy the duck is live", ev("petsLive()").length===1 && ev("petsLive()")[0].id==="daisy" && PETS.slice(1).every(p=>p.wip));
  titles(TITLES.length-1); w.go("settings");
  ok("no other birds in Settings, even at the top title", !$(".pet-grid") && !$('[data-pet="peep"]') && !/secret pet/.test($("#view").textContent));
  ok("a higher title doesn't swap in an unfinished pet", ev("petPick()").id==="daisy");
  ev("titleUnlockModal")(2);
  ok("title unlocks don't mention unfinished pets", !/New pet unlocked/.test($("#overlay").textContent));
  w.closeModal();
  ok("every pet draws in every pose", PETS.every(p=>["sit","stand","sleep","peek","waddle","skate","flex","tired","cool","stab"].every(q=>{ const v=ev("petSVG")(q,p); return /^<svg[\s\S]*<\/svg>$/.test(v) && !/NaN|undefined/.test(v); })));
  // dev: show the unfinished pets
  setDev({on:true, allPets:true}); titles(2); w.go("settings");
  ok("dev can show the unfinished pets as a picker", !!$(".pet-grid") && !!$('[data-pet="peep"]') && !!$("[data-dev='allpets']"));
  ok("one pet per title", PETS.every((p,i)=>p.at===i));
  ok("the newest unlocked pet comes out by default", ev("petPick()").id===PETS[2].id);
  ok("locked ones can't be picked", $(`[data-pet="${PETS[3].id}"]`).disabled);
  click($(`[data-pet="${PETS[1].id}"]`));
  ok("picking one makes it the only one out", st().settings.pet===PETS[1].id && $$(".pet-opt.on").length===1 && duck().getAttribute("aria-label")===PETS[1].name);
  click($('[data-pet=""]'));
  ok("No pet turns it off", st().settings.pet==="" && !duck());
  setDev({}); delete st().settings.pet; save(); w.go("home");
  ok("with dev off it's just Daisy again", ev("petPick()").id==="daisy" && duck().getAttribute("aria-label")==="Daisy");
});

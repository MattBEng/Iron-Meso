/* 1.8.0 share cards: Cutie only. A Share button on the finish screen and the
   unlock popups draws a picture card and hands it to the phone's share sheet.
   jsdom has no canvas, so drawing is stubbed; the card DATA is what's checked. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("share cards", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  // ---- stubs: canvas, blob, share sheet ----
  const ctx=new Proxy({}, {get:(t,k)=> k==="measureText"? (s=>({width:String(s).length*30})) : (k in t? t[k] : ()=>{}), set:(t,k,v)=>{ t[k]=v; return true; }});
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.HTMLCanvasElement.prototype.toBlob=function(cb){ cb(new w.Blob(["png"],{type:"image/png"})); };
  let shared=null, saved=0;
  const setShare=on=>{
    Object.defineProperty(w.navigator,"canShare",{value:on? (d=>!!(d&&d.files&&d.files.length)) : undefined, configurable:true});
    Object.defineProperty(w.navigator,"share",{value:on? (d=>{ shared=d; return Promise.resolve(); }) : undefined, configurable:true});
  };
  w.URL.createObjectURL=()=>{ saved++; return "blob:x"; };

  A.clearTemplates();
  const SQ="b_back_squat";
  st().settings.mode="fun"; st().profile.gender="Female";
  st().cutie={titles:{}, bonusFrom:0}; save();
  A.makeMeso([{id:"s1",exerciseId:SQ,sets:2,reps:5,rir:2,rest:90}]);

  // ---------- card data ----------
  const log={id:"w1",mesoId:"m",week:1,dayId:"d",dayName:"Pull day",date:ev("todayISO()"),notes:"",durationMin:52,loggedAt:5,
    exercises:[{exerciseId:SQ,target:{sets:2,reps:5,rir:2},sets:[{kg:100,reps:5,rir:2,done:true},{kg:100,reps:5,rir:2,done:true}]}]};
  st().logs.push(log); save();
  const names=ev("FUN_WEIGHTS").map(f=>f[0]);
  const card=ev("shareWorkoutCard")(log);
  ok("headline is a comical comparison", names.some(n=>card.big.includes(n)), card.big);
  ok("kicker says what it is", card.kicker==="Today I lifted");
  ok("no kilos anywhere on the card", !/kg|\b1,?000\b/.test([card.head,card.kicker,card.big,card.stats,card.left,card.right].join(" ")), card.stats);
  ok("stats line has sets, time and points", /2 sets/.test(card.stats) && /52 min/.test(card.stats) && /pts/.test(card.stats), card.stats);
  ok("head names the day", card.head==="Pull day, done");
  ok("footer carries her title", card.left.includes(ev("CUTIE_TITLES")[0]));
  const again=card.reroll();
  ok("reroll gives a different comparison", again.big!==card.big && names.some(n=>again.big.includes(n)), again.big);
  const fixed=ev("shareWorkoutCard")(log, {n:"corgis", em:"🐕", count:83});
  ok("uses the comparison already shown on the finish screen", fixed.big==="83 corgis 🐕");
  const bw={...log, id:"w1", exercises:[{exerciseId:SQ,target:{sets:1},sets:[{kg:0,reps:10,rir:2,done:true}]}]};
  const bcard=ev("shareWorkoutCard")(bw);
  ok("no weight lifted falls back to points", bcard.kicker==="Today I earned" && /Cutie Points/.test(bcard.big) && !bcard.reroll, bcard.big);
  const tcard=ev("shareTitleCard")(2);
  ok("title card headlines the title", tcard.big.includes(ev("CUTIE_TITLES")[2]) && /Cutie Points/.test(tcard.stats));
  const gcard=ev("shareBadgeCard")(["ton","early"]);
  ok("badge card headlines the badge", gcard.big.includes(ev("BADGE_NAMES")[4]) && gcard.head==="Badges earned");

  // ---------- finish screen: button, preview, reroll, send ----------
  w.go("workout"); A.logSets(0,100,5); w.go("workout");
  click($("[data-a='finish']"));
  if($("[data-dur-ok]")) click($("[data-dur-ok]"));
  for(let i=0;i<4 && !$("[data-share='open']"); i++){ const b=$("#overlay [data-fb='skip'], #overlay [data-skip], #overlay .btn-ghost, #overlay [data-ok]"); if(!b) break; click(b); }
  ok("finish screen has a Share button", !!$("[data-share='open']"));
  click($("[data-share='open']"));
  ok("Share opens a preview picture", !!$("#sharezone canvas"));
  ok("…with Another one and Send it", !!$("[data-share='again']") && !!$("[data-share='send']"));
  ok("the finish screen is still there behind it", !!$("#overlay [data-ok]"));
  const before=$("#sharezone canvas").getAttribute("aria-label");
  click($("[data-share='again']"));
  ok("Another one redraws with a new comparison", $("#sharezone canvas").getAttribute("aria-label")!==before);
  setShare(true);
  click($("[data-share='send']"));
  ok("Send it opens the share sheet with a PNG", !!shared && shared.files.length===1 && shared.files[0].type==="image/png");
  ok("only the picture is shared, no text", shared && !shared.text && !shared.url);
  setShare(false); saved=0;
  click($("[data-share='send']"));
  ok("no share sheet: the picture is saved instead", saved===1);

  // ---------- unlock popups ----------
  w.closeModal(); ev("titleUnlockModal")(2);
  ok("title unlock has a Share button", !!$("[data-share='open']"));
  click($("[data-share='open']"));
  ok("title preview has no reroll", !!$("#sharezone canvas") && !$("[data-share='again']"));
  w.closeModal(); ev("badgeModal")(["first"]);
  ok("badge popup has a Share button", !!$("[data-share='open']"));

  // ---------- Cutie only ----------
  w.closeModal(); st().profile.gender="Male"; save();
  ok("no share zone outside Cutie", ev("shareZoneHTML")(()=>null)==="");
  ev("celebrate")(log);
  ok("Fun mode without Cutie: no Share button", !$("[data-share='open']"));
  w.closeModal(); st().profile.gender="Female"; st().settings.mode="serious"; save();
  ok("Serious mode: no share zone", ev("shareZoneHTML")(()=>null)==="");

  // ---------- pounds on the finish-screen fact ----------
  st().settings.unit="lb"; save();
  const f=ev("funFact")(1000, {n:"corgis",em:"🐕",count:83});
  ok("lifted total shows in pounds when that's the unit", /2,205 lb/.test(f) && !/kg/.test(f), f);
});

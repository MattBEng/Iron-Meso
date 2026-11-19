/* 1.10.0: duck add-ons (worn items + new acts), bonus picker, daily line. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("v1.10 duck add-ons", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  st().profile=Object.assign(st().profile||{}, {gender:"Female"}); st().settings.mode="fun"; save();
  ev('DEV={on:true,points:CUTIE_THRESHOLDS[CUTIE_THRESHOLDS.length-1]}');
  ok("all nine add-ons", ev("PET_ADDONS.length")===9);
  ok("bubble bath at Certified Powerpuff", ev('CUTIE_TITLES[PET_ADDONS.find(a=>a.id==="bath").at]')==="Certified Powerpuff");
  w.go("settings");
  ok("head and outfit choices shown", $$("[data-wear^='head:']").length===4 && $$("[data-wear^='outfit:']").length===3);
  click($("[data-wear='head:cap']"));
  ok("hat saved", st().settings.petWear.head==="cap");
  click($("[data-wear='head:sunhat']"));
  ok("one head item at a time", st().settings.petWear.head==="sunhat");
  click($("[data-wear='outfit:dress']"));
  ok("outfit saved", st().settings.petWear.outfit==="dress");
  ok("duck draws hat and dress", /dk-hat/.test(ev('duckSVG("sit")')) && /dk-dress/.test(ev('duckSVG("sit")')));
  ["lift","lounge","bath"].forEach(p=>ok(p+" pose draws", ev(`duckSVG("${p}")`).includes("dk-"+p)));
  click($("[data-wear='head:']"));
  ok("None takes it off", !/dk-hat/.test(ev('duckSVG("sit")')));
  ev('DEV={on:true,points:0}');
  ok("locked items not worn", Object.keys(ev("petWear()")).length===0);
  ok("locked acts off", !ev('addonOn("bath")'));
  ev('DEV={}'); st().settings.petWear={}; save();
});

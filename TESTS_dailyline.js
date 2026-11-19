/* 1.10.0: duck add-ons (worn items + new acts), bonus picker, daily line. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("v1.10 daily line", ()=>{
  const {w,$,st,save,ev}=A;
  st().profile=Object.assign(st().profile||{}, {gender:"Male"}); st().settings.mode="fun"; save();
  ev('DEV={}'); w.go("home");
  ok("off unless dev toggle", !$(".daily-card"));
  ev('DEV={on:true,daily:true}'); w.go("home");
  ok("shows on Home", !!$(".daily-card") && $(".daily-card").textContent.length>10);
  ok("no 'Today' label", !/Today/.test($(".daily-card").textContent));
  ok("quote italic, source on its own line", !!$(".daily-q") && $(".daily-q").style.fontStyle==="italic" && /AD|BC/.test($(".daily-who").textContent));
  ok("every line has a source", ev('DAILY_LINES.every(l=>l.split("|").length===2)'));
  ok("same line all day", ev('dailyLine("2026-11-19")')===ev('dailyLine("2026-11-19")'));
  ok("bank has lines", ev("DAILY_LINES.length")>=15);
  st().settings.mode="serious"; save(); w.go("home");
  ok("never in Serious mode", !$(".daily-card"));
  st().settings.mode="fun"; st().profile.gender="Female"; save(); w.go("home");
  ok("not on Cutie", !$(".daily-card"));
  ev('DEV={}');
});

/* 1.13.1: pull-to-refresh keeps the tab you were on (a fresh launch still
   opens Train if a workout is open), and re-drawing More after a tick keeps
   the scroll position instead of jumping to the top. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("reload view + More scroll", ()=>{
  const {w,ev}=A;
  const sv=ev("startView");
  ok("refresh on Home stays on Home even with a workout open", sv(true,"home",true)==="home");
  ok("refresh on More stays on More", sv(true,"settings",true)==="settings");
  ok("fresh launch with a workout open goes to Train", sv(false,"home",true)==="workout");
  ok("fresh launch, no workout, goes Home", sv(false,"settings",false)==="home");
  ok("unknown saved view falls back", sv(true,"mesosummary",true)==="workout");
  w.go("analytics");
  ok("last tab is saved", ev(`localStorage.getItem("liftdaddy_view")`)==="analytics", ev(`localStorage.getItem("liftdaddy_view")`));

  // scroll: stub scrollTo / scrollY
  const calls=[]; w.scrollTo=(x,y)=>{ calls.push(y); };
  w.go("settings");
  Object.defineProperty(w,"scrollY",{value:640, configurable:true});
  calls.length=0;
  w.go("settings");
  ok("re-drawing More returns to where you were", calls[calls.length-1]===640, calls.join(","));
  calls.length=0;
  w.go("home");
  ok("going to another tab still starts at the top", calls.length && calls.every(y=>y===0), calls.join(","));
  calls.length=0;
  w.go("settings");
  ok("arriving at More from another tab starts at the top", calls.every(y=>y===0), calls.join(","));
});

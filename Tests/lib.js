/* Shared test harness for Lift Daddy.
   Usage:  node tests/t-<name>.js        (run one suite)
           node tests/run-all.js         (run everything)
   Requires: npm install jsdom
*/
const {JSDOM}=require("jsdom");
const fs=require("fs"), path=require("path");

const APP=path.join(__dirname,"..","index.html");

let pass=0, fail=0;
function ok(label, cond, detail){
  if(cond){ pass++; console.log("  OK   "+label); }
  else { fail++; console.log("  FAIL "+label+(detail!==undefined?"  ("+detail+")":"")); }
}
function summary(name){
  console.log(`\n${name}: ${pass} passed, ${fail} failed`);
  return fail;
}

/** Boot the app in jsdom. seed = optional state object written to localStorage. */
function boot(seed){
  const html=fs.readFileSync(APP,"utf8");
  const opts={runScripts:"dangerously", pretendToBeVisual:true, url:"http://localhost/"};
  if(seed) opts.beforeParse=w=>w.localStorage.setItem("ironmeso_v1", JSON.stringify(seed));
  const dom=new JSDOM(html, opts);
  const w=dom.window;
  w.confirm=()=>true;
  const api={
    w,
    $:s=>w.document.querySelector(s),
    $$:s=>[...w.document.querySelectorAll(s)],
    click:el=>el&&el.dispatchEvent(new w.Event("click",{bubbles:true})),
    inp:(el,v)=>{ if(!el) return; el.value=v; el.dispatchEvent(new w.Event("input",{bubbles:true})); },
    change:(el,v)=>{ if(!el) return; el.value=v; el.dispatchEvent(new w.Event("change",{bubbles:true})); },
    st:()=>w.LiftDaddy.Store.state,
    save:()=>w.LiftDaddy.Store.save(),
    ev:expr=>w.eval(expr),
    /** Remove the seeded starter templates so mesocycles[0] is YOUR test meso. */
    clearTemplates(){ const s=api.st(); s.mesocycles=s.mesocycles.filter(m=>!m.archived); api.save(); },
    /** Build a simple active meso. exercises = array of slot objects. */
    makeMeso(exercises, extra){
      const s=api.st();
      const meso=Object.assign({id:"m",name:"Test",weeks:6,deload:false,rampSets:false,
        split:"Custom",archived:false,days:[{id:"d",name:"Day",exercises}]}, extra||{});
      s.mesocycles.push(meso); s.activeMesoId=meso.id; s.activeSession=null; api.save();
      return meso;
    },
    /** Complete the whole finish flow (duration+date prompt, survey, celebrate). */
    finish(dateOverride){
      api.click(api.$("[data-a='finish']"));
      if(api.$("#wdate") && dateOverride) api.inp(api.$("#wdate"), dateOverride);
      if(api.$("[data-ok]")) api.click(api.$("[data-ok]"));       // duration+date
      if(api.$("[data-done]")) api.click(api.$("[data-done]"));   // survey
      if(api.$("[data-ok]")) api.click(api.$("[data-ok]"));       // fun-mode celebrate
    },
    /** Log every set in an exercise with given kg/reps. */
    logSets(exIdx, kg, reps){
      const s=api.st().activeSession.exercises[exIdx];
      s.sets.forEach(x=>{ x.kg=kg; x.reps=reps; x.done=true; x.touched=true; x.at=Date.now(); });
      api.save();
    },
    /** Push a completed log directly (for history-dependent tests). */
    pushLog(exerciseId, sets, opts){
      const o=opts||{};
      api.st().logs.push({id:o.id||("L"+Math.random().toString(36).slice(2,7)),
        mesoId:o.mesoId||"m", week:o.week||1, dayId:"d", dayName:"Day",
        date:o.date||"2026-08-01", notes:"", durationMin:40, loggedAt:o.loggedAt||Date.now(),
        exercises:[{exerciseId, target:o.target||{sets:sets.length,reps:10,rir:2}, sets}]});
      api.save();
    },
  };
  return api;
}

/** Run fn after the app's boot timers settle. */
function run(name, fn, delay){
  setTimeout(()=>{
    console.log("\n=== "+name+" ===");
    try{ fn(); }
    catch(e){ fail++; console.log("  EXCEPTION: "+e.message+"\n    "+(e.stack||"").split("\n")[1]); }
    const f=summary(name);
    process.exit(f>0?1:0);
  }, delay||400);
}

module.exports={boot, ok, run, summary, get pass(){return pass;}, get fail(){return fail;}};

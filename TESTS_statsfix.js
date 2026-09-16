/* Stats screen: the number fixes (skips in completion, PR bleed from later
   blocks, skips in block comparison, per-week averages over the real span,
   every card following the scope, the in-progress week, lb volume) and the
   decluttered layout (sections, empty cards hidden, merged weekly chart,
   remembered collapsed sections). */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("stats fixes + layout", ()=>{
  const {w,$,$$,click,change,st,save,ev}=A;
  const ago=n=>{ const d=new Date(); d.setDate(d.getDate()-n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const sets=(kg,reps,n)=>Array.from({length:n},()=>({kg,reps,rir:2,done:true,expReps:reps}));
  let seq=0;
  const log=(mesoId,date,week,exs,extra)=>Object.assign({id:"L"+(++seq), mesoId, week, dayId:"d", dayName:"Day",
    date, notes:"", durationMin:40, loggedAt:seq, exercises:exs}, extra||{});
  const squat=(kg,reps,n)=>({exerciseId:"b_back_squat", target:{sets:n,reps,rir:2}, sets:sets(kg,reps,n)});
  const meso=(id,name,extra)=>Object.assign({id, name, weeks:4, deload:false, rampSets:false, split:"Custom",
    archived:false, days:[{id:"d",name:"Day",exercises:[{id:"s",exerciseId:"b_back_squat",sets:3,reps:10,rir:2,rest:60}]}]}, extra||{});
  const reset=()=>{ const s=st(); s.mesocycles=[]; s.logs=[]; s.cardio=[]; s.bodyweight=[]; s.feedback=[];
    s.activeSession=null; s.settings.unit="kg"; s.settings.statsClosed=[]; w.eval("_statScope=null; _weeklyMetric='vol'"); };
  const view=()=>$("#view").textContent;
  const tot=()=>[...$$(".tot-n")].map(n=>n.textContent.replace(/,/g,""));
  const sec=id=>$(`details.stat-sec[data-sec="${id}"]`);

  // ---------- 1. COMPLETION IGNORES SKIPS ----------
  reset();
  st().mesocycles.push(meso("m","Block"));          // 1 day x 4 weeks = 4 workouts
  st().activeMesoId="m";
  st().logs.push(log("m",ago(14),1,[squat(100,10,3)]), log("m",ago(7),2,[squat(100,10,3)]),
                 log("m",ago(1),3,[],{skipped:true}));
  save(); w.go("analytics");
  ok("completion counts only real workouts (2 of 4 = 50%)", $("#stat-completion").textContent==="50%", $("#stat-completion").textContent);
  ok("skips are reported separately", view().includes("2/4 workouts") && view().includes("1 skipped"));

  // ---------- 2. PRs DON'T BLEED IN FROM LATER BLOCKS ----------
  reset();
  st().mesocycles.push(meso("a","Alpha",{archived:true}), meso("b","Bravo",{archived:true}), meso("c","Charlie"));
  st().activeMesoId="c";
  st().logs.push(log("a",ago(120),1,[squat(100,10,3)]),
                 log("b",ago(80),1,[squat(110,10,3)]),
                 log("c",ago(10),1,[squat(130,10,3)]));
  save(); w.go("analytics"); change($("#statscope"),"meso:b");
  const pr=[...$$('details[data-sec="block"] .pill.grn')].map(p=>p.textContent).join(" | ");
  const e110=ev("dispW(epley(110,10))"), e130=ev("dispW(epley(130,10))");
  ok("a previous block's PR is its own best", pr.includes(`→ ${e110}`), pr);
  ok("…not a later block's", !pr.includes(`${e130}`), pr);

  // ---------- 3. BLOCK COMPARISON IGNORES SKIPS ----------
  change($("#statscope"),"all");
  st().logs.push(log("b",ago(79),1,[],{skipped:true}), log("b",ago(78),1,[],{skipped:true}));
  save(); w.go("analytics");
  const rows=[...$$('details[data-sec="blocks"] .row.split')].map(r=>r.textContent.replace(/\s+/g," "));
  ok("skip markers aren't counted as workouts", rows.some(r=>r.includes("Bravo") && r.includes("1 workouts")), rows);

  // ---------- 4. PER-WEEK AVERAGES USE THE REAL SPAN ----------
  reset();
  st().mesocycles.push(meso("m","Block")); st().activeMesoId="m";
  st().logs.push(log("m",ago(21),1,[squat(100,10,3)]));
  st().cardio.push({id:"k1",date:ago(21),type:"Row",minutes:60,mesoId:"m"},
                   {id:"k2",date:ago(0), type:"Row",minutes:60,mesoId:"m"});
  save(); w.go("analytics"); change($("#statscope"),"all");
  const span=ev(`weekKeysBetween("${ago(21)}","${ago(0)}")`).length;
  ok("cardio avg divides by every week in the span, not just weeks with cardio",
     view().includes(`${Math.round(120/span)} min/wk avg`), `span ${span}: `+(view().match(/\d+ min\/wk avg/)||[""])[0]);
  ok("weekKeysBetween fills the gaps",
     JSON.stringify(ev('weekKeysBetween("2026-09-01","2026-09-20")'))===JSON.stringify(["2026-08-31","2026-09-07","2026-09-14"]));

  // ---------- 5. EVERY CARD FOLLOWS THE SCOPE ----------
  reset();
  st().mesocycles.push(meso("old","Old",{archived:true}), meso("cur","Cur"));
  st().activeMesoId="cur";
  st().logs.push(log("old",ago(400),1,[squat(90,10,3)]), log("cur",ago(3),1,[squat(100,10,3)]));
  st().cardio.push({id:"z1",date:ago(400),type:"Run",minutes:30,avgHR:150,zone:3,mesoId:"old"},
                   {id:"z2",date:ago(3),  type:"Row",minutes:20,avgHR:null,zone:null,mesoId:"cur"});
  st().bodyweight.push({date:ago(400),kg:90});
  save(); w.go("analytics");                        // opens on the current block
  ok("zone card hidden when the scope has no HR cardio (old block has some)", !view().includes("Minutes by zone"));
  ok("bodyweight hidden when none falls in the block", !sec("body"));
  change($("#statscope"),"meso:old");
  ok("old block shows its own zones", view().includes("Minutes by zone") && view().includes("30 min with HR"));
  ok("old block shows its own bodyweight", !!sec("body"));
  change($("#statscope"),"year");
  ok("this year hides last year's zones", !view().includes("Minutes by zone"));
  ok("totals sets list isn't labelled 'all time'", !view().includes("(all time)") && view().includes("Sets per muscle"));

  // ---------- 6. THE WEEK IN PROGRESS ISN'T AVERAGED IN ----------
  reset();
  const two=meso("p","Push",{days:[
    {id:"d1",name:"A",exercises:[{id:"s1",exerciseId:"b_back_squat",sets:3,reps:10,rir:2,rest:60}]},
    {id:"d2",name:"B",exercises:[{id:"s2",exerciseId:"b_back_squat",sets:3,reps:10,rir:2,rest:60}]}]});
  st().mesocycles.push(two); st().activeMesoId="p";
  st().logs.push(log("p",ago(9),1,[squat(100,10,3)]), log("p",ago(8),1,[squat(100,10,3)]),
                 log("p",ago(1),2,[squat(100,10,3)]));   // week 2: 1 of 2 done
  save(); w.go("analytics");
  const val=[...$$(".spm-row")].find(r=>r.querySelector(".spm-label").textContent!=="Cardio")?.querySelector(".spm-val").textContent;
  ok("weekly sets average = the full week (6/6), not diluted to 4.5", val==="6/6", val);
  ok("says the current week isn't counted yet", view().includes("Week 2 is in progress"));

  // ---------- 7. LB VOLUME IS CONVERTED ----------
  st().settings.unit="lb"; save(); w.go("analytics");
  const kgVol=100*10*9;
  ok("lb volume is converted, not kg with an lb label",
     tot()[3]===String(Math.round(ev(`dispW(${kgVol})`))) && tot()[3]!==String(kgVol), tot()[3]);
  st().settings.unit="kg"; save();

  // ---------- LAYOUT ----------
  reset();
  st().mesocycles.push(meso("m","Block")); st().activeMesoId="m";
  st().logs.push(log("m",ago(2),1,[squat(100,10,3)]));
  save(); w.go("analytics");
  ok("the four weekly charts are one", !!$("#cweek") && !$("#cv") && !$("#cs") && !$("#cf") && !$("#cd"));
  ok("four metric toggles", $$("[data-wm]").length===4);
  ok("no cardio section without cardio", !sec("cardio"));
  ok("no body section without bodyweight", !sec("body"));
  ok("no block comparison with one block", !sec("blocks"));
  ok("block section shown in a block scope", !!sec("block"));
  ok("block scope doesn't repeat the total sets list", !$('details[data-sec="trends"]').textContent.includes("Sets per muscle"));
  click($('[data-wm="sets"]'));
  ok("toggle moves the selection", $('[data-wm="sets"]').classList.contains("sel") && !$('[data-wm="vol"]').classList.contains("sel"));
  ok("toggle updates the average", $("#wkavg").textContent.includes("sets/wk"), $("#wkavg").textContent);
  change($("#statscope"),"month");
  ok("no block section in a date range", !sec("block"));

  // collapse remembered
  const tr=sec("trends");
  tr.open=false; tr.dispatchEvent(new w.Event("toggle"));
  ok("collapsing saves the section", st().settings.statsClosed.includes("trends"));
  w.go("home"); w.go("analytics");
  ok("a collapsed section stays collapsed", sec("trends") && !sec("trends").open);
  sec("trends").open=true; sec("trends").dispatchEvent(new w.Event("toggle"));
  ok("reopening forgets it", !st().settings.statsClosed.includes("trends"));

  // bar charts: axis starts at 0 and an empty week draws nothing
  const calls={bars:0, labels:[]};
  const cv=w.document.createElement("canvas");
  cv.getContext=()=>new Proxy({}, {get:(t,k)=>{
    if(k==="roundRect"||k==="rect") return ()=>calls.bars++;
    if(k==="fillText") return s=>calls.labels.push(String(s));
    if(k==="createLinearGradient") return ()=>({addColorStop(){}});
    return typeof t[k]!=="undefined"? t[k] : ()=>{};
  }, set:(t,k,v)=>{ t[k]=v; return true; }});
  ev("ChartManager").draw(cv, [{x:"a",y:25},{x:"b",y:0},{x:"c",y:15}], {type:"bar"});
  ok("a zero week draws no bar", calls.bars===2, calls.bars);
  ok("bar axis never goes below zero", !calls.labels.some(s=>/^-/.test(s)), calls.labels.join(","));

  // cardio-only period still shows totals
  st().logs=[]; st().cardio=[{id:"x",date:ago(0),type:"Row",minutes:15,mesoId:"m"}]; save();
  w.go("analytics");
  ok("a cardio-only period shows totals, not 'nothing logged'",
     !view().includes("Nothing logged") && tot()[5]==="15", tot()[5]);
});

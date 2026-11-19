/* "Lisa's New Meso" template (1.11.0). Fresh installs and existing installs
   (via migration 8) both get it once, archived like the starters, with every
   slot resolved: no exercise silently dropped. */
const {boot, ok, run}=require("./TESTS_lib");

const NAME="Lisa's New Meso";
function check(label, st){
  const ms=st.mesocycles.filter(m=>m.name===NAME);
  ok(label+": template present once", ms.length===1, ms.length);
  const m=ms[0]; if(!m) return;
  ok(label+": archived, 4 weeks, deload on", m.archived===true && m.weeks===4 && m.deload===true);
  ok(label+": 4 days", m.days.length===4, m.days.length);
  const counts=m.days.map(d=>d.exercises.length).join(",");
  ok(label+": no slot dropped (6,8,8,8)", counts==="6,8,8,8", counts);
  const ids=new Set(st.exercises.map(e=>e.id));
  ok(label+": every slot points at a real exercise", m.days.every(d=>d.exercises.every(x=>ids.has(x.exerciseId))));
  const name=id=>(st.exercises.find(e=>e.id===id)||{}).name;
  ok(label+": every day has Pallof + 5-min bike", m.days.every(d=>
    d.exercises.some(x=>name(x.exerciseId)==="Pallof Press") &&
    d.exercises.some(x=>x.cardio && x.minutes===5 && name(x.exerciseId)==="Stationary Bike")));
  ok(label+": warm-up note on first lift each day", m.days.every(d=>/FORWARDS only/.test(d.exercises[0].notes)));
  ok(label+": Dead Bug + Hanging Knee Raise in library", ["Dead Bug","Hanging Knee Raise"].every(n=>st.exercises.some(e=>e.name===n)));
  ok(label+": assisted pull-up flagged", st.exercises.find(e=>e.name==="Assisted Pull-Up").assisted===true);
}

run("Lisa's New Meso template", ()=>{
  check("fresh", boot().st());
  const A0=boot();
  const s=JSON.parse(JSON.stringify(A0.st()));
  s.version=8; delete s._lisaSeeded;
  s.mesocycles=s.mesocycles.filter(m=>m.name!==NAME);
  s.exercises=s.exercises.filter(e=>!["Dead Bug","Hanging Knee Raise"].includes(e.name));
  const A=boot(s);
  check("migrated", A.st());
  // second load must not duplicate it
  const again=JSON.parse(JSON.stringify(A.st()));
  const B=boot(again);
  ok("reload does not duplicate", B.st().mesocycles.filter(m=>m.name===NAME).length===1);
  // a user who deleted it doesn't get it back
  const del=JSON.parse(JSON.stringify(A.st())); del.mesocycles=del.mesocycles.filter(m=>m.name!==NAME);
  const C=boot(del);
  ok("deleted template stays deleted", C.st().mesocycles.filter(m=>m.name===NAME).length===0);
});

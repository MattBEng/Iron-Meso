/* "Lisa's New Meso" template (1.11.0). Fresh installs and existing installs
   (via migration 8) both get it once, archived like the starters, with every
   slot resolved: no exercise silently dropped. */
const {boot, ok, run}=require("./TESTS_lib");

const NAME="Lisa's New Meso", NAME3="Lisa's New Meso (3 day)";
/* First three slots are the warm-up (flagged), and no other slot's notes
   carry the old shared warm-up text. */
function warmOK(d, name){
  const w=d.exercises.slice(0,3);
  return w.map(x=>name(x.exerciseId)).join(",")==="Arm Circles,Band Pull-Apart,Band External Rotation"
    && w.every(x=>x.warmup===true) && d.exercises.slice(3).every(x=>!x.warmup && !/band pull-aparts/i.test(x.notes||""));
}
function check3(label, st){
  const ms=st.mesocycles.filter(m=>m.name===NAME3);
  ok(label+": 3-day present once", ms.length===1, ms.length);
  const m=ms[0]; if(!m) return;
  ok(label+": 3-day archived, 4 weeks, deload on", m.archived===true && m.weeks===4 && m.deload===true);
  const counts=m.days.map(d=>d.exercises.length).join(",");
  ok(label+": 3-day no slot dropped (10,11,12)", counts==="10,11,12", counts);
  const ids=new Set(st.exercises.map(e=>e.id));
  ok(label+": 3-day slots all real", m.days.every(d=>d.exercises.every(x=>ids.has(x.exerciseId))));
  const name=id=>(st.exercises.find(e=>e.id===id)||{}).name;
  ok(label+": 3-day Pallof + bike + warm-up every day", m.days.every(d=>
    d.exercises.some(x=>name(x.exerciseId)==="Pallof Press") &&
    d.exercises.some(x=>x.cardio && x.minutes===5) && warmOK(d, name)));
}
function check(label, st){
  check3(label, st);
  const ms=st.mesocycles.filter(m=>m.name===NAME);
  ok(label+": template present once", ms.length===1, ms.length);
  const m=ms[0]; if(!m) return;
  ok(label+": archived, 4 weeks, deload on", m.archived===true && m.weeks===4 && m.deload===true);
  ok(label+": 4 days", m.days.length===4, m.days.length);
  const counts=m.days.map(d=>d.exercises.length).join(",");
  ok(label+": no slot dropped (9,11,11,11)", counts==="9,11,11,11", counts);
  const ids=new Set(st.exercises.map(e=>e.id));
  ok(label+": every slot points at a real exercise", m.days.every(d=>d.exercises.every(x=>ids.has(x.exerciseId))));
  const name=id=>(st.exercises.find(e=>e.id===id)||{}).name;
  ok(label+": every day has Pallof + 5-min bike", m.days.every(d=>
    d.exercises.some(x=>name(x.exerciseId)==="Pallof Press") &&
    d.exercises.some(x=>x.cardio && x.minutes===5 && name(x.exerciseId)==="Stationary Bike")));
  ok(label+": warm-up slots first, notes exercise-specific", m.days.every(d=>warmOK(d, name)));
  ok(label+": Dead Bug + Hanging Knee Raise in library", ["Dead Bug","Hanging Knee Raise"].every(n=>st.exercises.some(e=>e.name===n)));
  ok(label+": assisted pull-up flagged", st.exercises.find(e=>e.name==="Assisted Pull-Up").assisted===true);
}

run("Lisa's New Meso template", ()=>{
  check("fresh", boot().st());
  const A0=boot();
  const s=JSON.parse(JSON.stringify(A0.st()));
  s.version=8; delete s._lisaSeeded; delete s._lisa3Seeded;
  s.mesocycles=s.mesocycles.filter(m=>m.name!==NAME && m.name!==NAME3);
  s.exercises=s.exercises.filter(e=>!["Dead Bug","Hanging Knee Raise"].includes(e.name));
  const A=boot(s);
  check("migrated", A.st());
  // second load must not duplicate it
  const again=JSON.parse(JSON.stringify(A.st()));
  const B=boot(again);
  ok("reload does not duplicate", B.st().mesocycles.filter(m=>m.name===NAME).length===1 &&
     B.st().mesocycles.filter(m=>m.name===NAME3).length===1);
  // a 1.11.0 install (v9, has the 4-day) gets only the 3-day added
  const v9=JSON.parse(JSON.stringify(A.st())); v9.version=9; delete v9._lisa3Seeded;
  v9.mesocycles=v9.mesocycles.filter(m=>m.name!==NAME3);
  const D=boot(v9);
  ok("v9 install: 4-day not duplicated", D.st().mesocycles.filter(m=>m.name===NAME).length===1);
  check3("v9", D.st());
  // a user who deleted it doesn't get it back
  const del=JSON.parse(JSON.stringify(A.st())); del.mesocycles=del.mesocycles.filter(m=>m.name!==NAME && m.name!==NAME3);
  const C=boot(del);
  ok("deleted templates stay deleted", C.st().mesocycles.filter(m=>m.name===NAME||m.name===NAME3).length===0);
});

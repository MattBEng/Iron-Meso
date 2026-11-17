/* Editing a past workout must not damage it (v1.4.1 fix).
   startLogEdit used to copy only kg/reps/RIR per set, so Save changes wiped
   warm-up / AMRAP / myorep types and hold seconds, and the edit view lost the
   bodyweight and timed flags. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("edit past workout keeps set data", ()=>{
  const {w,$,$$,click,st,save}=A;
  A.clearTemplates();
  st().exercises.push({id:"x_hold", name:"Test Hold", muscle:"Abs", equipment:"Bodyweight",
    timed:true, builtin:false, notes:""});
  A.makeMeso([{id:"s1",exerciseId:"b_back_squat",sets:3,reps:8,rir:2,rest:90}]);
  st().logs.push({id:"LE",mesoId:"m",week:1,dayId:"d",dayName:"Day",date:"2026-11-10",notes:"",
    durationMin:40,loggedAt:Date.now(),exercises:[
      {exerciseId:"b_back_squat",target:{sets:3,reps:8,rir:2},sets:[
        {kg:40,reps:8,rir:3,done:true,type:"warmup"},
        {kg:100,reps:8,rir:2,done:true},
        {kg:100,reps:12,rir:0,done:true,type:"amrap"},
        {kg:80,reps:5,rir:1,done:true,type:"my"}]},
      {exerciseId:"x_hold",target:{sets:1,reps:0,rir:2,secs:45},sets:[
        {kg:0,reps:0,rir:2,secs:45,expSecs:45,done:true}]},
      {exerciseId:"b_dips",target:{sets:1,reps:10,rir:2},sets:[
        {kg:0,reps:10,rir:2,done:true}]}]});
  save();

  // ---------- THE EDIT VIEW ----------
  w.eval("startLogEdit('LE', false)");
  const es=st().editSession;
  ok("edit session opened, editable", es && !es.readonly);
  ok("bodyweight flag set on edit", es.exercises[2].bodyweight===true, es.exercises[2].bodyweight);
  ok("timed flag set on edit", es.exercises[1].timed===true, es.exercises[1].timed);
  ok("lifting exercise not flagged bodyweight/timed",
     es.exercises[0].bodyweight===false && es.exercises[0].timed===false);
  ok("hold renders a seconds box", $$('[data-f="secs"]').length===1, $$('[data-f="secs"]').length);
  ok("warm-up still shows its W badge", $$(".settype-badge").some(b=>b.textContent==="W"));

  // ---------- SAVE CHANGES, UNTOUCHED ----------
  click($("[data-a='finish']"));
  if($("[data-ok]")) click($("[data-ok]"));
  ok("edit session closed", !st().editSession);
  const L=st().logs.find(l=>l.id==="LE");
  const sq=L.exercises[0].sets, hold=L.exercises[1].sets[0], dip=L.exercises[2].sets[0];
  ok("warm-up type kept", sq[0].type==="warmup", sq[0].type);
  ok("AMRAP type kept", sq[2].type==="amrap", sq[2].type);
  ok("myorep type kept", sq[3].type==="my", sq[3].type);
  ok("working set stays untyped", !sq[1].type, sq[1].type);
  ok("weights and reps unchanged", sq.map(s=>s.kg+"x"+s.reps).join(",")==="40x8,100x8,100x12,80x5");
  ok("hold keeps its 45 s", hold.secs===45, hold.secs);
  ok("bodyweight set unchanged", dip.kg===0 && dip.reps===10);

  // ---------- AND THE NUMBERS DOWNSTREAM ----------
  const h=w.eval(`exerciseHistory("b_back_squat")`).find(x=>x.logId==="LE"||x.date==="2026-11-10");
  ok("warm-up still excluded from history after edit", h && h.sets.length===3, h&&h.sets.length);
});

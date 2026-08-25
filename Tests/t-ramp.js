/* Volume ramp: per-muscle priority ceilings, meso-length awareness,
   repeat runs, deload, and ramp-off. */
const {boot, ok, run}=require("./lib");
const A=boot();

run("volume ramp", ()=>{
  const {st,ev}=A;
  const chest=st().exercises.find(e=>e.muscle==="Chest" && !e.cardio);
  const slot={exerciseId:chest.id, sets:3};
  const M=chest.muscle;

  // sequence of prescribed sets across the REAL (non-deload) weeks
  const seq=meso=>{
    const rw=meso.weeks-(meso.deload?1:0), out=[];
    for(let wk=1;wk<=rw;wk++) out.push(ev("rampedSets")(meso, slot, wk, false));
    return out.join(",");
  };
  const base={weeks:5, deload:true, rampSets:true, startSets:2, endTargetSets:5};

  ok("5wk HIGH ramps 2,3,4,5",
     seq({...base, priority:{[M]:"high"}})==="2,3,4,5", seq({...base,priority:{[M]:"high"}}));
  const norm=seq({...base, priority:{[M]:"normal"}});
  ok("5wk NORMAL lands on 4", norm.endsWith("4") && norm.startsWith("2"), norm);
  const low=seq({...base, priority:{[M]:"low"}});
  ok("5wk LOW (maintain) lands on 3", low.endsWith("3") && low.startsWith("2"), low);

  const eight=seq({weeks:8, deload:true, rampSets:true, startSets:2, endTargetSets:5, priority:{[M]:"high"}});
  ok("8wk HIGH still lands on 5", eight.endsWith("5"), eight);
  ok("8wk spreads over 7 real weeks", eight.split(",").length===7, eight);
  ok("8wk ramps gradually (holds sets)", /(\d),\1/.test(eight), eight);

  ok("repeat run starts a week in (3,4,5,5)",
     seq({...base, repeatRun:true, priority:{[M]:"high"}})==="3,4,5,5",
     seq({...base, repeatRun:true, priority:{[M]:"high"}}));

  const dl=ev("rampedSets")({weeks:5,deload:true,rampSets:true,startSets:2,endTargetSets:5,priority:{[M]:"high"}},
                            {exerciseId:chest.id, sets:5, baseSets:5}, 5, true);
  ok("deload halves the sets", dl>=2 && dl<=3, dl);

  ok("ramp off = flat template sets",
     seq({weeks:5, deload:true, rampSets:false, priority:{}})==="3,3,3,3",
     seq({weeks:5, deload:true, rampSets:false, priority:{}}));

  // legacy meso with none of the new fields must not crash
  const legacy={weeks:4, deload:true, rampSets:true, days:[]};
  const legSeq=seq(legacy);
  ok("legacy meso falls back safely", legSeq.split(",").every(n=>+n>=1 && +n<=5), legSeq);
});

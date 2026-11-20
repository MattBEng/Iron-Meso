/* 1.14.0: each wearable has its own animation. It joins Daisy's random moves
   only while she's wearing it (hat and outfit both), a tap can set it off,
   and the cape run never happens on Train. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("outfit animations", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  st().profile=Object.assign(st().profile||{}, {gender:"Female"}); st().settings.mode="fun"; save();
  ev('DEV={on:true,points:CUTIE_THRESHOLDS[CUTIE_THRESHOLDS.length-1]}');
  const map={shades:"wink",cap:"capflip",sunhat:"daisies",dress:"twirl",cape:"wizard"};
  ok("every wearable has an animation", ev("PET_ADDONS.filter(a=>a.slot!=='act').every(a=>WEAR_ANIMS[a.id])"));
  Object.entries(map).forEach(([id,p])=>{
    const svg=ev(`duckSVG("${p}")`);
    ok(`${p} draws, with its item`, svg.includes("dk-"+p) && (id==="shades"? svg.includes("dk-shd") : id==="dress"? svg.includes("dk-dress") : id==="cape"? svg.includes("dk-cape") : svg.includes("dk-hat")));
  });

  // 1.14.2: the dress hangs below the body (it used to be a band over her bottom)
  const dsvg=ev(`petSVG("stand", PETS[0], {outfit:"dress"})`);
  const hemY=+((dsvg.match(/51\.500 ([\d.]+)q/)||[])[1]);   // skirt hem y (standing body: cy 43, ry 12 -> bottom 55)
  ok("dress skirt hangs past the body (body bottom 55)", hemY>55, hemY);
  ok("dress has the strap and sash", (dsvg.match(/#FF8FB8/g)||[]).length>=2 && dsvg.includes("#E0567F"));
  st().settings.petWear={}; save();
  ok("nothing worn: no outfit moves", ev("wornPoses(false)").length===0);
  st().settings.petWear={head:"sunhat", outfit:"cape"}; save();
  ok("hat + outfit: both in the mix", JSON.stringify(ev("wornPoses(false)"))==='["daisies","wizard"]', JSON.stringify(ev("wornPoses(false)")));
  ok("Train: no cape run", JSON.stringify(ev("wornPoses(true)"))==='["daisies"]');

  // random pool: count what duckPlace picks over many tries
  const seen={};
  for(let i=0;i<400;i++){ ev('duckPlace("home")'); const d=$("#duck"); if(d) seen[d.dataset.pose]=(seen[d.dataset.pose]||0)+1; }
  ok("worn moves turn up at random", seen.daisies>0 && seen.wizard>0, JSON.stringify(seen));
  ok("roughly even odds with the rest", seen.daisies>15 && seen.sit>15, JSON.stringify(seen));
  ok("never the same move twice in a row", (()=>{ let last=null; for(let i=0;i<200;i++){ ev('duckPlace("home")'); const p=$("#duck").dataset.pose; if(p===last) return false; last=p; } return true; })());
  ev('duckPlace("home","wizard")');
  ok("cape run walks across the page", $("#duck").dataset.spot==="walk");
  const trainSeen=new Set();
  for(let i=0;i<200;i++){ ev('duckPlace("workout")'); const d=$("#duck"); if(d) trainSeen.add(d.dataset.pose); }
  ok("Train never gets the cape run", !trainSeen.has("wizard") && trainSeen.has("daisies"), [...trainSeen].join(","));

  st().settings.petWear={outfit:"dress"}; save();
  const hits=[];
  for(let i=0;i<40;i++){
    ev('duckPlace("home","sit")'); const d=$("#duck");
    d.dispatchEvent(new w.Event("click",{bubbles:true}));
    hits.push(d.dataset.pose);
  }
  ok("a tap can set off the outfit move", hits.includes("twirl"), hits.join(","));

  st().settings.petWear={head:"shades"}; save();
  ev('DEV={on:true,points:0}');
  ok("locked item: no move", ev("wornPoses(false)").length===0);
  ev('DEV={}'); st().settings.petWear={}; save();
});

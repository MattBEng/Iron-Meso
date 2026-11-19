/* 1.13.2: Daisy's skateboard wheels were hidden by the nav bar and the board's
   outline. The skate pose sits higher than other poses, and the wheels hang
   clearly below the board. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();
run("skateboard wheels visible", ()=>{
  const {w,ev}=A;
  const css=[...w.document.querySelectorAll("style")].map(s=>s.textContent).join("\n");
  const m=css.match(/#duck\[data-pose="skate"\]\{[^}]*bottom:calc\((\d+)px/);
  ok("skate pose sits above the nav bar", m && +m[1]>=72, m&&m[1]);
  const svg=ev(`petSVG("skate", (PETS[0]||{}).skin||{})`);
  const wheels=[...svg.matchAll(/class="dk-wheel" cx="[\d.]+" cy="([\d.]+)" r="([\d.]+)"/g)].map(x=>+x[1]+ +x[2]);
  // board path bottom is y=59, outline 6.4 wide -> lowest edge 62.2
  ok("two wheels drawn", wheels.length===2);
  ok("wheels hang at least 2 units below the board", wheels.every(b=>b>=62.2+2), wheels.join(","));
});

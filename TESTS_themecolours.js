/* 1.7.5 theme colours. Cutie colouring follows each theme (one main colour per
   theme). Two things must NEVER follow the theme (Matt's rules):
   - the LIFT DADDY logo is branding: always coral
   - each muscle has its own fixed colour, so he learns to recognise them */
const fs=require("fs");
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();
const src=fs.readFileSync(__dirname+"/index.html","utf8");

run("theme colours", ()=>{
  const {w,$,$$,st,save,ev}=A;
  // ---------- CUTIE FOLLOWS THE THEME ----------
  ok("Cutie colour = theme accent in Fun mode", /body\[data-fun="1"\]\{--cutie:var\(--accent\)\}/.test(src));
  ok("no fixed magenta tints left", !/rgba\(224,\s*85,\s*156/.test(src));

  // ---------- LOGO NEVER THEMED ----------
  ok("logo uses the brand coral", /\.brand\{[^}]*color:var\(--brand-coral\)/.test(src) && /--brand-coral:#FF7A6E/.test(src));
  ok("no rule themes the logo", !/[^-]\.brand[^{]*\{[^}]*--accent/.test(src) && !/\.brand em\{[^}]*--accent/.test(src));

  // ---------- MUSCLE COLOURS FIXED ----------
  const MC=ev("MUSCLE_COLORS");
  const pinned={Cardio:"#53DDD0",Chest:"#E05EC3",Back:"#5B8DEF",Shoulders:"#B36BFF",Biceps:"#4FD1C5",Triceps:"#FF8A5C",
    Quads:"#FFC24B",Hamstrings:"#3ECF8E",Glutes:"#FF5C7A",Calves:"#53DDD0",Abs:"#8BD46B",Forearms:"#9CA3AF",Traps:"#C084FC"};
  ok("muscle colours unchanged", JSON.stringify(MC)===JSON.stringify(pinned), JSON.stringify(MC));
  ok("no rule overrides the muscle tag colour", !/\.mgtag\{[^}]*--mgc:var\(--accent\)/.test(src) && !/\.mgtag svg\{[^}]*fill:var\(--accent\)/.test(src));
  A.clearTemplates();
  A.makeMeso([{id:"s1",exerciseId:"b_back_squat",sets:2,reps:8,rir:2,rest:90}]);
  st().settings.mode="fun"; st().profile.gender="Female"; st().settings.funScheme="mint"; save();
  w.go("workout");
  ok("muscle tag keeps its own colour on another theme", $(".mgtag").getAttribute("style").includes(MC.Quads), $(".mgtag").getAttribute("style"));

  // ---------- FEEL BUTTON FITS ----------
  const opts=$$('select[data-f="rir"]')[0].options;
  ok("Fun set rows use short Feel labels", [...opts].map(o=>o.textContent).join(",").includes("Hard") && ![...opts].some(o=>/Challenging/.test(o.textContent)));
  ok("Feel column is wider in Fun mode", /body\[data-fun="1"\] \.setgrid\{grid-template-columns:24px 1fr 1fr 76px 42px\}/.test(src));
  ok("full labels still used for targets", ev("feelLabel(2)").includes("Challenging"));
});

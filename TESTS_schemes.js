/* Fun colour schemes: four options, single-select, Fun-mode only,
   applied to the body and persisted. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("colour schemes", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  const body=w.document.body;

  // ---------- THE SET ----------
  const S=ev("FUN_SCHEMES");
  ok("four schemes offered", S.length===4, S.length);
  ok("first is the default", S[0].id==="default");
  ok("includes a pastel option", S.some(x=>x.id==="pastel"));
  ok("includes a super-pink option", S.some(x=>x.id==="pink"));
  ok("every scheme has a name, hint and swatch",
     S.every(x=>x.name && x.hint && /^#[0-9A-Fa-f]{6}$/.test(x.swatch)));

  // ---------- PICKER SHOWS ONLY IN FUN MODE ----------
  st().settings.mode="fun"; save();
  w.go("settings");
  ok("picker rendered in Fun mode", $$("[data-scheme-pick]").length===4,
     $$("[data-scheme-pick]").length);
  st().settings.mode="serious"; save();
  w.go("settings");
  ok("picker hidden in Serious mode", $$("[data-scheme-pick]").length===0);

  // ---------- SELECTING ----------
  st().settings.mode="fun"; save();
  w.go("settings");
  const pick=id=>{ const cb=$(`[data-scheme-pick="${id}"]`); cb.checked=true;
    cb.dispatchEvent(new w.Event("change",{bubbles:true})); };

  pick("pink");
  ok("choosing pink stores it", st().settings.funScheme==="pink");
  ok("body reflects the scheme", body.dataset.scheme==="pink", body.dataset.scheme);
  ok("only one checkbox stays ticked",
     $$("[data-scheme-pick]").filter(c=>c.checked).length===1);
  ok("the ticked one is pink", $('[data-scheme-pick="pink"]').checked);

  pick("pastel");
  ok("switching to pastel replaces pink", st().settings.funScheme==="pastel");
  ok("body updated", body.dataset.scheme==="pastel");
  ok("pink is now unticked", !$('[data-scheme-pick="pink"]').checked);

  // unticking the active scheme is a no-op — one must always be selected
  const active=$('[data-scheme-pick="pastel"]');
  active.checked=false; active.dispatchEvent(new w.Event("change",{bubbles:true}));
  ok("can't untick the active scheme", active.checked===true);
  ok("scheme unchanged after the no-op", st().settings.funScheme==="pastel");

  pick("default");
  ok("default can be chosen back", st().settings.funScheme==="default");

  // ---------- FUN GATE ON THE BODY ----------
  st().settings.funScheme="pink"; st().settings.mode="fun"; save(); ev("applyTheme()");
  ok("fun flag set on the body in Fun mode", body.dataset.fun==="1");
  st().settings.mode="serious"; save(); ev("applyTheme()");
  ok("fun flag cleared in Serious mode", body.dataset.fun==="0");
  ok("scheme still stored while Serious", st().settings.funScheme==="pink");

  // ---------- PERSISTENCE ----------
  st().settings.mode="fun"; save(); w.LiftDaddy.Store.flush();
  const raw=JSON.parse(w.localStorage.getItem("ironmeso_v1"));
  const stored=(raw.state||raw).settings.funScheme;
  ok("scheme survives a save", stored==="pink", stored);

  // ---------- CSS ACTUALLY DEFINES THE SCHEMES ----------
  const css=w.document.documentElement.innerHTML;
  ok("pastel palette defined", css.includes('data-scheme="pastel"'));
  ok("pink palette defined", css.includes('data-scheme="pink"'));
  ok("peach palette defined", css.includes('data-scheme="peach"'));
  ok("schemes are gated behind the fun flag", css.includes('body[data-fun="1"][data-scheme='));
});

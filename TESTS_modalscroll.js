/* 1.7.2: popups open at the top. modal() used to focus the first button, which
   on a long list (What's new, titles) is at the bottom, so the phone scrolled
   to the end and hid the newest release. jsdom has no layout, so this checks
   the mechanism: buttons are focused with preventScroll, fields normally. */
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("popups open at the top", ()=>{
  const {w,$,ev}=A;
  const calls=[]; const orig=w.HTMLElement.prototype.focus;
  w.HTMLElement.prototype.focus=function(o){ calls.push({tag:this.tagName, text:(this.textContent||"").trim(), o}); return orig.call(this,o); };

  calls.length=0; ev("whatsNewModal()");
  const f=calls[0];
  ok("What's new focuses its button without scrolling", f && f.tag==="BUTTON" && f.o && f.o.preventScroll===true, JSON.stringify(f));
  ok("and the list starts at the top", $(".modal").scrollTop===0);
  ok("newest release is first in the list", $(".modal .kicker").textContent.includes(ev("APP_VERSION")));
  ev("closeModal()");

  calls.length=0; ev("modal('<input id=x><button data-ok>OK</button>')");
  ok("a popup with a field still focuses the field normally", calls[0] && calls[0].tag==="INPUT" && !(calls[0].o && calls[0].o.preventScroll));
  ev("closeModal()");
  w.HTMLElement.prototype.focus=orig;
});

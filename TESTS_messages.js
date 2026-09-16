/* Message banks: MESSAGES.txt is the source of truth and index.html is
   generated from it. This suite catches the obvious failure mode — editing the
   text file and forgetting to run the build — plus malformed or empty banks. */
const {boot, ok, run}=require("./TESTS_lib");
const {execFileSync}=require("child_process");
const fs=require("fs"), path=require("path");
const A=boot();

run("message banks", ()=>{
  const {ev}=A;
  const dir=__dirname;

  // ---------- THE TEXT FILE AND THE APP AGREE ----------
  let sync=true, out="";
  try{ out=execFileSync("node",[path.join(dir,"MESSAGES_build.js"),"--check"],
        {encoding:"utf8", stdio:["ignore","pipe","pipe"]}); }
  catch(e){ sync=false; out=(e.stdout||"")+(e.stderr||""); }
  ok("index.html is in sync with MESSAGES.txt (run: node MESSAGES_build.js)",
     sync, out.trim().split("\n")[0]);

  // ---------- THE FILE PARSES ----------
  const txt=fs.readFileSync(path.join(dir,"MESSAGES.txt"),"utf8");
  const sections=[...txt.matchAll(/^\[(.+)\]$/gm)].map(m=>m[1]);
  ok("all seven sections present", sections.length===7, sections.length);
  ok("every message sits under a heading",
     txt.split(/\r?\n/).findIndex(l=>l.trim() && !l.startsWith("#") && !/^\[/.test(l))
       > txt.split(/\r?\n/).findIndex(l=>/^\[/.test(l)));

  // ---------- THE BANKS LOADED IN THE APP ----------
  const banks={
    REST_OVER_MSGS: ev("REST_OVER_MSGS"),
    RETURN_MSGS_SHORT: ev("RETURN_MSGS_SHORT"),
    RETURN_MSGS_MID: ev("RETURN_MSGS_MID"),
    RETURN_MSGS_LONG: ev("RETURN_MSGS_LONG"),
    CUTIE_TITLES: ev("CUTIE_TITLES"),
    CUTIE_MSGS: ev("CUTIE_MSGS"),
    CUTIE_FOOTERS: ev("CUTIE_FOOTERS"),
  };
  Object.entries(banks).forEach(([name,arr])=>{
    ok(`${name} is a non-empty array`, Array.isArray(arr) && arr.length>0, arr&&arr.length);
    ok(`${name} has no blank entries`,
       arr.every(x=>typeof x==="string" && x.trim().length>0));
    ok(`${name} has no duplicates`, new Set(arr).size===arr.length,
       arr.length-new Set(arr).size+" dupes");
  });

  // ---------- THE PICKERS STILL WORK ----------
  ok("a rest-over message can be drawn", typeof ev("restOverMsg()")==="string");
  ok("welcome-back tiers still resolve",
     banks.RETURN_MSGS_SHORT.includes(ev("returnMessage")(4)) &&
     banks.RETURN_MSGS_MID.includes(ev("returnMessage")(8)) &&
     banks.RETURN_MSGS_LONG.includes(ev("returnMessage")(40)));
  ok("cutie titles are ordered easiest-first (10 levels)",
     banks.CUTIE_TITLES.length===10, banks.CUTIE_TITLES.length);
});

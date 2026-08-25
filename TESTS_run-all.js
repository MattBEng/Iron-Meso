#!/usr/bin/env node
/* Runs every TESTS_*.js suite in the repo root and reports a combined total.
   Usage:  node TESTS_run-all.js */
const {execFileSync}=require("child_process");
const fs=require("fs"), path=require("path");

const dir=__dirname;
const SKIP=new Set(["TESTS_lib.js","TESTS_run-all.js"]);
const suites=fs.readdirSync(dir)
  .filter(f=>/^TESTS_.*\.js$/.test(f) && !SKIP.has(f))
  .sort();
let pass=0, fail=0, failed=[];

for(const f of suites){
  let out="";
  try{ out=execFileSync("node",[path.join(dir,f)],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}); }
  catch(e){ out=(e.stdout||"")+(e.stderr||""); }
  process.stdout.write(out);
  const m=out.match(/(\d+) passed, (\d+) failed/);
  if(m){ pass+=+m[1]; fail+=+m[2]; if(+m[2]>0) failed.push(f); }
  else { fail++; failed.push(f+" (no result)"); }
}

console.log("\n" + "=".repeat(46));
console.log(`TOTAL: ${pass} passed, ${fail} failed  (${suites.length} suites)`);
if(failed.length) console.log("Suites with failures: "+failed.join(", "));
console.log("=".repeat(46));
process.exit(fail>0?1:0);

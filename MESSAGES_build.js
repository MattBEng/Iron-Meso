#!/usr/bin/env node
/* Inject MESSAGES.txt into index.html.
   The app is one self-contained offline file, so the messages can't be loaded
   at runtime from a separate file — this writes them into index.html instead.
   MESSAGES.txt is the source of truth; index.html is generated from it.

   Usage:  node MESSAGES_build.js          rebuild index.html from MESSAGES.txt
           node MESSAGES_build.js --check  report drift, change nothing (exit 1)
*/
const fs=require("fs"), path=require("path");
const DIR=__dirname;
const TXT=path.join(DIR,"MESSAGES.txt");
const APP=path.join(DIR,"index.html");

/** Section heading in MESSAGES.txt -> the const it populates in index.html. */
const SECTIONS={
  "REST OVER":                      "REST_OVER_MSGS",
  "WELCOME BACK - 3 TO 5 DAYS":     "RETURN_MSGS_SHORT",
  "WELCOME BACK - 6 TO 13 DAYS":    "RETURN_MSGS_MID",
  "WELCOME BACK - 14 DAYS OR MORE": "RETURN_MSGS_LONG",
  "CUTIE LEVEL TITLES":             "CUTIE_TITLES",
  "CUTIE STATS MESSAGES":           "CUTIE_MSGS",
  "CUTIE FOOTERS":                  "CUTIE_FOOTERS",
};

function parse(){
  const banks={}; let current=null;
  fs.readFileSync(TXT,"utf8").split(/\r?\n/).forEach((raw,i)=>{
    const line=raw.trim();
    if(!line || line.startsWith("#")) return;
    const head=line.match(/^\[(.+)\]$/);
    if(head){
      const name=SECTIONS[head[1].trim()];
      if(!name) throw new Error(`Unknown section "[${head[1]}]" on line ${i+1}. Known: ${Object.keys(SECTIONS).join(" | ")}`);
      current=name; banks[current]=[]; return;
    }
    if(!current) throw new Error(`Message on line ${i+1} is not under a [SECTION] heading.`);
    banks[current].push(line);
  });
  const missing=Object.values(SECTIONS).filter(v=>!banks[v] || !banks[v].length);
  if(missing.length) throw new Error("Empty or missing section(s): "+missing.join(", "));
  return banks;
}

/** Rewrite one `const NAME=[...]` array in the app source. */
function inject(src, name, items){
  const re=new RegExp("const "+name+"=\\[.*?\\];","s");
  if(!re.test(src)) throw new Error(`Could not find "const ${name}=[...]" in index.html`);
  const body=items.map(s=>JSON.stringify(s)).join(",\n ");
  return src.replace(re, `const ${name}=[\n ${body}];`);
}

const check=process.argv.includes("--check");
try{
  const banks=parse();
  const before=fs.readFileSync(APP,"utf8");
  let after=before;
  for(const name of Object.values(SECTIONS)) after=inject(after, name, banks[name]);

  if(check){
    if(after===before){ console.log("in sync — index.html matches MESSAGES.txt"); process.exit(0); }
    console.error("OUT OF SYNC — index.html does not match MESSAGES.txt.\nRun: node MESSAGES_build.js");
    process.exit(1);
  }
  if(after===before){ console.log("already up to date — nothing to write"); process.exit(0); }
  fs.writeFileSync(APP, after);
  const counts=Object.entries(SECTIONS).map(([h,v])=>`${v} ${banks[v].length}`).join(" · ");
  console.log("index.html updated →", counts);
  console.log("Remember to bump the BUILD stamp in sw.js before deploying.");
}catch(e){ console.error("MESSAGES_build failed: "+e.message); process.exit(1); }

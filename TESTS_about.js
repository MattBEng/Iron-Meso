/* Version + What's new: the in-app notes must match WHATS-NEW.md (the app is one
   offline file, so they're embedded rather than fetched), the About card shows
   the version, and the Home update card appears once after an update. */
const {boot, ok, run}=require("./TESTS_lib");
const fs=require("fs"), path=require("path");
const A=boot();

run("version + what's new", ()=>{
  const {w,$,$$,click,st,save,ev}=A;
  const VER=ev("APP_VERSION"), RELEASES=ev("RELEASES");

  // ---------- VERSION ----------
  ok("app version is set and looks like a version", /^\d+\.\d+\.\d+$/.test(VER), VER);
  ok("it is separate from the data schema version", VER!==String(ev("SCHEMA_VERSION")));
  ok("releases are newest first", RELEASES.length>0 && RELEASES[0].v===VER, RELEASES[0]&&RELEASES[0].v);
  ok("every release has a date and notes", RELEASES.every(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.notes.length));

  // ---------- IT MATCHES WHATS-NEW.md ----------
  const md=fs.readFileSync(path.join(__dirname,"WHATS-NEW.md"),"utf8");
  const head=md.match(/^##\s*([\d.]+)\s*[—-]\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  ok("WHATS-NEW.md has a version heading", !!head, head&&head[0]);
  ok("…with the app's version", head && head[1]===VER, head&&head[1]);
  ok("…and the app's release date", head && head[2]===RELEASES[0].date, head&&head[2]);
  const body=md.slice(md.indexOf(head[0])+head[0].length);
  const bullets=body.split(/\n##\s/)[0].split("\n").filter(l=>l.startsWith("- ")).map(l=>l.slice(2).trim());
  ok("the file and the app list the same number of notes",
     bullets.length===RELEASES[0].notes.length, `${bullets.length} vs ${RELEASES[0].notes.length}`);
  const drift=bullets.filter((b,i)=>b!==RELEASES[0].notes[i]);
  ok("every note matches word for word", drift.length===0, drift[0]);

  // ---------- SETTINGS ----------
  w.go("settings");
  ok("About card shows the version", $("#appver")?.textContent===VER, $("#appver")?.textContent);
  click($('[data-a="whatsnew"]'));
  const sheet=()=>$("#overlay").textContent;
  ok("What's new opens from Settings", sheet().includes("What's new"));
  ok("…and lists the latest notes", sheet().includes(RELEASES[0].notes[0]));
  ok("…under its version heading", sheet().includes("Version "+VER));
  click($("[data-ok]"));
  ok("closing it marks the version as seen", st().settings.lastSeenVersion===VER, st().settings.lastSeenVersion);

  // ---------- THE HOME CARD ----------
  st().settings.lastSeenVersion="0"; save();            // as an older install would be
  w.go("home");
  ok("an updated install gets a card on Home", !!$(".update-card"));
  ok("…naming the version", $(".update-card").textContent.includes(VER));
  click($('[data-act="seenupdate"]'));
  ok("dismissing records the version", st().settings.lastSeenVersion===VER);
  w.go("home");
  ok("…and the card doesn't come back", !$(".update-card"));

  // reading the notes from the card also counts as seen
  st().settings.lastSeenVersion="0"; save(); w.go("home");
  click($('[data-act="whatsnew"]'));
  ok("opening the notes from the card marks it seen", st().settings.lastSeenVersion===VER);
  if($("[data-ok]")) click($("[data-ok]"));
  w.go("home");
  ok("card is gone after reading", !$(".update-card"));

  // ---------- A FRESH INSTALL ISN'T "UPDATED" ----------
  const fresh=boot();
  ok("a new install starts on the current version", fresh.st().settings.lastSeenVersion===VER,
     fresh.st().settings.lastSeenVersion);
  fresh.w.go("home");
  ok("…and sees no update card", !fresh.$(".update-card"));
});

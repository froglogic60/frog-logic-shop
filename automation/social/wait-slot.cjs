// Holds a scheduled post until its UK clock time (3 Nov 2026).
//
// GitHub starts scheduled jobs late, often by hours (the 1pm product post went
// out at 9:47pm on 2 Nov and the 7pm fun post at 1:29am on 3 Nov). So each
// posting workflow now has several schedules that fire EARLY, and this script
// makes the run wait until the real time. Whichever run starts first waits and
// posts; the later ones find it already done and stop.
//
//   node wait-slot.cjs 13:00 21:30
//     13:00 = when the post should go out (UK time, so BST/GMT is handled)
//     21:30 = latest sensible time; a run that starts after this posts nothing
//             that day, because a post at 1am is not seen by anyone
//
// Writes go=yes / go=no to GITHUB_OUTPUT. A run started by hand always posts now.
const fs = require("fs");

const [target, latest] = process.argv.slice(2);
const MAX_WAIT_MIN = 330; // GitHub stops a job at 6 hours; leave room to post

function ukMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get("hour") * 60 + get("minute");
}
const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const out = (v) => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `go=${v}\n`); };

if (process.env.GITHUB_EVENT_NAME === "workflow_dispatch") {
  console.log("Started by hand: posting now.");
  out("yes");
} else {
  const now = ukMinutesNow();
  const t = toMin(target);
  if (now > toMin(latest)) {
    console.log(`It is after ${latest} UK time, too late to be seen. Nothing posted from this run.`);
    out("no");
  } else if (now >= t) {
    console.log(`${now - t} min after ${target} UK time: posting now.`);
    out("yes");
  } else if (t - now > MAX_WAIT_MIN) {
    console.log(`${t - now} min before ${target} UK time, too early to wait. A later scheduled run will post.`);
    out("no");
  } else {
    console.log(`Waiting ${t - now} min until ${target} UK time.`);
    setTimeout(() => { console.log("Time reached."); out("yes"); }, (t - now) * 60000);
  }
}

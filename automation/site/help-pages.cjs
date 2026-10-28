// Help pages (28 Oct 2026, Sam: "yes do 1 and 3").
//
// The same few questions come up again and again on r/autismUK and Mumsnet:
// how do I explain PDA to my family, how do I explain autism to the
// grandparents before Christmas, my family won't accept my diagnosis, is an
// adult diagnosis worth it, how do I explain ADHD to my parents. Google sends
// the shop almost nothing because no page answered those questions in the
// words people type. Each page here answers one of them properly and points to
// the free Pond Guide that goes with it, so the help is real even if nobody
// buys anything.
//
// Called by build-pages.cjs after the product pages are written. Writes
// /p/<slug>/index.html for each page and returns sitemap entries. A linked
// guide or product that no longer exists fails the build loudly.

const fs = require("fs");
const path = require("path");

const PAGES = [
  {
    slug: "how-to-explain-pda-to-family",
    title: "How to explain PDA to family — plain-English help for grandparents, partners and friends",
    h1: "How to explain PDA to your family",
    description: "PDA (a demand-avoidant profile of autism) explained for family: why it isn't defiance or spoiling, what makes it worse, what helps, and a free plain-English guide to hand over.",
    guide: "pda",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. PDA is the one people find hardest to explain, because from the outside it can look exactly like a child, or an adult, who just won't. These are the points that tend to land with grandparents, partners and friends.",
    ],
    sections: [
      { h: "Start with this: it isn't won't, it's can't", p: [
        "PDA usually stands for Pathological Demand Avoidance. Many people prefer Persistent Drive for Autonomy. In the UK it's often described as a demand-avoidant profile within autism, not a separate diagnosis.",
        "The key idea for family: an everyday demand can land like a threat, even a kind one, even one the person wants to meet. A child can badly want to go to the party and still be unable to go the moment it becomes expected. The \"no\" comes from anxiety, not from being spoilt or defiant.",
      ] },
      { h: "Why the usual advice backfires", list: [
        "<strong>\"Be firmer.\"</strong> More pressure means more threat, and things reliably get worse.",
        "<strong>\"They're fine at school, so it's the parenting.\"</strong> Holding it together all day is often why it falls apart at home, where it's safe.",
        "<strong>\"Just praise them when they do it.\"</strong> Praise can raise the expectation for next time, which makes the next time harder.",
      ] },
      { h: "What family can actually do", list: [
        "Offer choices, not instructions: \"Would you like the blue cup or the green one?\"",
        "Say things indirectly: \"I wonder if…\" works better than \"You need to…\"",
        "Drop the demands that don't matter, so there's room for the ones that do.",
        "Treat a meltdown or a shutdown as distress, not naughtiness.",
        "Follow the parent's lead, even when it looks too gentle. They've usually tried firm already.",
      ] },
      { h: "If they still don't get it", p: [
        "Some relatives take it better from a page than from you, especially if you're tired of explaining. That's what the free guide below is for: two pages, plain English, written to be printed or forwarded before a visit. The PDA Society's website is excellent too if they want more.",
      ] },
    ],
    faq: [
      ["Is PDA a real diagnosis in the UK?", "It isn't in the DSM or ICD as a standalone diagnosis. In the UK it's often noted as a demand-avoidant profile within an autism diagnosis. It's still a useful description of a real, recognisable pattern."],
      ["Is PDA just bad behaviour?", "No. Defiance is a choice. In PDA, everyday demands trigger a threat response, so the avoidance sits largely outside conscious control. Pressure tends to make it worse, not better."],
      ["What helps most with PDA?", "Reducing demands, offering real choices, indirect wording, giving control over timing, and treating collapse as distress rather than defiance."],
    ],
    related: ["autism", "audhd", "the-pond-guides"],
  },
  {
    slug: "explaining-autism-to-grandparents",
    title: "Explaining autism to grandparents (before Christmas) — what to say and a free guide to hand over",
    h1: "Explaining autism to grandparents",
    description: "How to explain your child's autism to grandparents before Christmas: what to say, what to ask them to do, what to ask them not to do, and a free plain-English guide you can print or forward.",
    guide: "autism",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. Christmas is when a lot of parents end up explaining their child to relatives all day. It's easier if you do it once, before the visit, in plain words, with a couple of clear requests.",
    ],
    sections: [
      { h: "Keep the explanation short", p: [
        "Grandparents often grew up with a narrow picture of autism, so start by replacing it: \"Autism means her brain takes in the world differently. Noise, crowds, surprises and being touched can be a lot more intense for her than for us. When it gets too much, she isn't being naughty, she's overloaded.\"",
        "One or two sentences like that beat a long talk. You can hand them something to read later.",
      ] },
      { h: "Give them a few clear things to do", list: [
        "Let them know the plan for the day in advance, and tell them if it changes.",
        "Leave a quiet room free where they can go without anyone following.",
        "Ask before hugs or kisses, and take no for an answer.",
        "Let them eat what they eat. Christmas dinner is not the day to try new food.",
        "Ear defenders, a tablet or repetitive play aren't rude. They're how your child stays OK.",
      ] },
      { h: "And a couple of things not to do", list: [
        "Don't say \"they don't look autistic\" or \"they're fine with me\". Coping in a short visit isn't the same as coping all day.",
        "Don't comment on a meltdown in front of them. Give space and let the parent handle it.",
        "Don't compare them with cousins.",
      ] },
      { h: "Let a page do the explaining", p: [
        "If you're tired of being the only one explaining, the free guide below is written for exactly this: for the grandparents, aunties and uncles, not the child. Print it or forward it before the big day. There are separate guides for ADHD, AuDHD, PDA, sensory differences and more.",
      ] },
    ],
    faq: [
      ["How do I explain autism to grandparents who don't believe it?", "Keep it short and practical: what's hard for your child, what it looks like when it's too much, and two or three things you need them to do. A written guide they can read on their own often goes down better than a conversation."],
      ["What should grandparents not say to an autistic child?", "Avoid \"you don't look autistic\", comparisons with other children, and commenting on meltdowns. Ask before touching, and follow the parent's lead."],
      ["How can Christmas be easier for an autistic child?", "Share the plan in advance, keep a quiet room, don't push new food, allow ear defenders or screens, and keep visits shorter than you think you need to."],
    ],
    related: ["sensory-differences", "adhd", "the-pond-guides"],
  },
  {
    slug: "family-wont-accept-autism-diagnosis",
    title: "When your family won't accept your autism diagnosis — for late-diagnosed adults",
    h1: "When your family won't accept your autism diagnosis",
    description: "Late-diagnosed and your family brushes it off, jokes about it or tells you to keep it quiet? Why it happens, what you don't owe them, and a free guide you can give them.",
    guide: "autism",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. A lot of people go through a whole assessment, get their answer, and then hear \"you're not autistic\", \"everyone's a bit autistic\" or \"don't tell anyone\" from the people closest to them. If that's you, you're not being dramatic, and you're not alone.",
    ],
    sections: [
      { h: "Why families react badly", list: [
        "<strong>An old picture of autism.</strong> If they only know one kind, you won't fit it, especially if you mask well.",
        "<strong>Guilt.</strong> A diagnosis can feel to a parent like proof they missed something. Denial is easier than that.",
        "<strong>Their own stuff.</strong> Sometimes a parent sees themselves in it and isn't ready.",
        "<strong>Fear of a label.</strong> \"Don't tell anyone\" is usually about their worries, not about you having done something wrong.",
      ] },
      { h: "What you don't owe them", list: [
        "You don't have to prove it. The assessment did that.",
        "You don't have to debate it every time it comes up. \"I'm not going to argue about it\" is a full sentence.",
        "You decide who knows and when. It's your diagnosis, not theirs.",
      ] },
      { h: "What sometimes helps", p: [
        "Give it time. Many families come round slowly, often after something clicks: a memory from childhood, an article, a programme. Find the one person who does get it (a grandparent, a sibling, a friend) and lean on them.",
        "If they'll read rather than listen, hand them something short. The free autism guide below was written for the people around us, in plain English, without the clinical words. It's easier than explaining your whole life again.",
      ] },
      { h: "For you", p: [
        "Looking back at things you were told off for, and seeing them differently, is a lot to process. Be gentle with yourself. If you'd like something for the months after, <a href=\"/p/after-the-diagnosis/\">After The Diagnosis</a> is a printable workbook I made for that.",
      ] },
    ],
    faq: [
      ["Why won't my parents accept my autism diagnosis?", "Common reasons are an outdated picture of autism, guilt about not noticing, seeing themselves in it, or fear of a label. It is usually about their feelings, not your evidence."],
      ["Do I have to tell my family I'm autistic?", "No. Who knows, and when, is your decision."],
      ["How do I explain my late autism diagnosis to family?", "Keep it short, give one or two examples from your own life, and offer them something to read on their own. Many families take a written guide better than a conversation."],
    ],
    related: ["audhd", "adhd", "the-pond-guides"],
  },
  {
    slug: "is-an-adult-autism-diagnosis-worth-it",
    title: "Is an adult autism diagnosis worth it? What actually changes in the UK",
    h1: "Is an adult autism diagnosis worth it?",
    description: "What an adult autism diagnosis actually changes in the UK: work adjustments, Access to Work, healthcare, benefits evidence, Right to Choose waits, and the honest downsides.",
    guide: "autism",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. \"Would it change anything?\" is one of the most common questions from adults wondering whether to get assessed, especially when they've already got other health things to deal with. This is what tends to change in practice in the UK.",
    ],
    sections: [
      { h: "Practical things it can help with", list: [
        "<strong>Work.</strong> It makes asking for reasonable adjustments much easier: a quieter space, written instructions, flexible hours. It can support an Access to Work application.",
        "<strong>Healthcare.</strong> You can ask for longer appointments, written information and contact by text or email, and it helps clinicians understand your other health problems in context.",
        "<strong>Benefits and support.</strong> It's useful evidence, though PIP and Universal Credit look at how things affect you day to day, not the label itself.",
        "<strong>Education.</strong> If you're studying, it can unlock support through disability services.",
      ] },
      { h: "The less practical things people say mattered most", p: [
        "Finally having a reason for things you'd blamed yourself for. Permission to stop forcing yourself into situations that drain you. Finding other autistic people and realising you're not the only one.",
      ] },
      { h: "The honest downsides", list: [
        "NHS waiting lists for adults can be very long. In England, asking your GP for a Right to Choose referral can be much quicker, and it's still NHS-funded.",
        "Private assessments usually cost well over £1,000.",
        "The assessment itself can be draining, and looking back at your childhood can stir things up.",
        "You don't need a diagnosis to use what works for autistic people. Ear defenders, routines and saying no don't need paperwork.",
      ] },
      { h: "If you're still deciding", p: [
        "Reading about how autism actually feels from the inside can help you decide. The free guide below is plain English, two pages, no sign-up.",
      ] },
    ],
    faq: [
      ["What are the benefits of an adult autism diagnosis in the UK?", "Easier reasonable adjustments at work, support for Access to Work, healthcare adjustments, evidence for benefits, and often a clearer understanding of yourself."],
      ["How can I get an adult autism assessment faster in England?", "Ask your GP for a referral under Right to Choose, which lets you choose an NHS-funded provider that may have a shorter wait."],
      ["Do I need a diagnosis to get adjustments at work?", "Not always. The Equality Act can apply if your condition has a substantial, long-term effect on day-to-day life, but a diagnosis usually makes asking much easier."],
    ],
    related: ["adhd", "audhd", "the-pond-guides"],
  },
  {
    slug: "how-to-explain-adhd-to-family",
    title: "How to explain ADHD to family — what to say to parents, partners and friends",
    h1: "How to explain ADHD to your family",
    description: "How to explain ADHD to parents, partners and friends who think you're lazy or just need to try harder: what ADHD actually is, what to ask for, and a free plain-English guide.",
    guide: "adhd",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. ADHD gets explained badly a lot: \"can't sit still\", \"easily distracted\", \"everyone's a bit ADHD\". If your family still thinks you just need to try harder, these are the points that tend to help.",
    ],
    sections: [
      { h: "The one-sentence version", p: [
        "\"ADHD isn't a lack of attention, it's trouble steering it. I can't make my brain start, stop or switch just because something matters.\"",
      ] },
      { h: "What it looks like in real life", list: [
        "<strong>Time blindness.</strong> Five minutes and an hour can feel the same. Being late is not not caring.",
        "<strong>Starting is the hard bit.</strong> Knowing what to do and being able to begin are different things.",
        "<strong>Hyperfocus.</strong> The same brain that can't start the washing up can lose six hours to something interesting.",
        "<strong>Out of sight, out of mind.</strong> If it's in a drawer, it may as well not exist.",
        "<strong>Feelings run hot.</strong> Criticism and rejection can hit very hard.",
      ] },
      { h: "What to ask your family for", list: [
        "Reminders without the sigh.",
        "Body doubling: just being in the room while you do a boring task.",
        "Written plans over verbal ones.",
        "Credit for the effort, not only the result.",
      ] },
      { h: "Let something else explain it", p: [
        "If you're tired of making the case, the free guide below is plain English, for the people around someone with ADHD. Print it or forward it. There are separate guides for autism, AuDHD, dyspraxia and more.",
      ] },
    ],
    faq: [
      ["How do I explain ADHD to my parents?", "Keep it short: ADHD is trouble steering attention, not a lack of it. Give one or two real examples, say what helps, and offer them a short guide to read on their own."],
      ["Is ADHD just being lazy?", "No. People with ADHD often try much harder than others for the same result. The difficulty is starting, switching and timing, not caring."],
      ["What can family do to help someone with ADHD?", "Kind reminders, body doubling, written plans, and noticing effort as well as results."],
    ],
    related: ["autism", "audhd", "the-pond-guides"],
  },
];

function build({ pages, shell, esc, attr, OUT, SITE }) {
  const bySlug = new Map(pages.map((p) => [p.slug, p]));
  const need = (slug, from) => {
    if (!fs.existsSync(path.join(OUT, slug, "index.html")) && !bySlug.has(slug)) throw new Error(`Help page ${from} links /p/${slug}/, which no longer exists — update help-pages.cjs`);
  };
  const out = [];
  for (const g of PAGES) {
    need(g.guide, g.slug);
    g.related.forEach((s) => need(s, g.slug));
    const guide = bySlug.get(g.guide);
    const guideName = guide && guide.item ? guide.item.word || guide.item.title : g.guide.toUpperCase();
    const url = `${SITE}/p/${g.slug}/`;
    const image = `${SITE}/p/${g.guide}/og.png`;
    const name = (s) => { const p = bySlug.get(s); return p && p.item ? (p.item.word || p.item.title || s) : s.replace(/-/g, " "); };
    const sections = g.sections.map((s) => `
      <h2>${esc(s.h)}</h2>
      ${(s.p || []).map((x) => `<p>${x}</p>`).join("\n      ")}
      ${s.list ? `<ul>${s.list.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}`).join("\n");
    const body = `
<section class="collection product-page help-page" id="help">
  <div class="wrap">
    <p class="crumbs"><a href="/">Frog Logic</a> › <a href="/p/the-pond-guides/">The Pond Guides</a> › ${esc(g.h1)}</p>
    <h1>${esc(g.h1)}</h1>
    ${g.intro.map((x) => `<p class="section-sub">${x}</p>`).join("\n    ")}
    <div class="product-about">
      ${sections}
      <h2>The free guide</h2>
      <p>Plain English, two pages, free to read, print or forward. No email address, no sign-up.</p>
      <p><a class="btn" href="/p/${g.guide}/?ref=help">Read the free ${esc(String(guideName))} guide</a></p>
      <h2>Questions people ask</h2>
      ${g.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("\n      ")}
      <h2>More from the pond</h2>
      <p>${g.related.map((s) => `<a href="/p/${s}/">${esc(String(name(s)))}</a>`).join(" &middot; ")} &middot; ${PAGES.filter((x) => x !== g).map((x) => `<a href="/p/${x.slug}/">${esc(x.h1)}</a>`).join(" &middot; ")}</p>
      <p class="section-sub">A friendly explainer written by a neurodivergent person, not medical or legal advice.</p>
    </div>
  </div>
</section>`;
    const jsonld = {
      "@context": "https://schema.org", "@type": "FAQPage", name: g.h1, description: g.description, url, inLanguage: "en-GB",
      isPartOf: { "@type": "WebSite", name: "Frog Logic", url: SITE },
      mainEntity: g.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    };
    fs.mkdirSync(path.join(OUT, g.slug), { recursive: true });
    fs.writeFileSync(path.join(OUT, g.slug, "index.html"), shell({ title: g.title, description: g.description, url, image, imageAlt: g.h1, body, jsonld }));
    out.push({ slug: g.slug, group: "help" });
    console.log(`help page ${g.slug}`);
  }
  return out;
}

module.exports = { build, PAGES };

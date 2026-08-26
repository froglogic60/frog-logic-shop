// ===== Frog Logic — the collection =====
// Each product's artwork is a custom typographic treatment: the lettering
// enacts the feeling rather than just sitting in a nice font.
// The real Frog Logic logo appears small in the top-right of every piece.
// `link` becomes a real Stripe Payment Link once set up (see README).

const CREAM = "#F4EFE3";
const INK   = "#1A1A1A";
const GOLD  = "#E8B63C";

const LOGO = "assets/frog-logic-mark-sm.png";

// Small logo mark, same size and position on every product.
function mark(){
  return `<image href="${LOGO}" x="240" y="16" width="46" height="40" preserveAspectRatio="xMidYMid meet"/>`;
}

// Halftone dot texture — gives everything a printed rather than digital feel.
function grain(id, opacity){
  return `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="1.5" cy="1.5" r="1.5" fill="${INK}" opacity="${opacity}"/>
  </pattern></defs>`;
}

function caption(text, fill){
  return `<text x="28" y="284" font-family="Space Grotesk, sans-serif" font-weight="500"
    font-size="8.5" fill="${fill}" opacity="0.8" letter-spacing="0.18em">${text}</text>`;
}

const PRODUCTS = [
  {
    num: "01 — Tee", word: "Overstimulated",
    line: "Every input arriving at the same volume.",
    price: "£19.00", link: "#", bg: "#D14A26",
    // Letters refuse to line up; a gold echo layer bleeds out behind.
    svg: `<svg viewBox="0 0 300 300">${grain("g1", 0.13)}
      <g font-family="Fraunces, serif" font-size="44" fill="${GOLD}" opacity="0.35">
        <text x="46" y="104" transform="rotate(-7 46 104)">O</text>
        <text x="96" y="96" transform="rotate(5 96 96)">V</text>
        <text x="146" y="108" transform="rotate(-11 146 108)">E</text>
        <text x="192" y="98" transform="rotate(8 192 98)">R</text>
      </g>
      <g font-family="Fraunces, serif" font-size="46" fill="${CREAM}">
        <text x="40" y="100" transform="rotate(-8 40 100)">O</text>
        <text x="92" y="92" transform="rotate(6 92 92)">V</text>
        <text x="142" y="104" transform="rotate(-13 142 104)">E</text>
        <text x="188" y="94" transform="rotate(9 188 94)">R</text>
      </g>
      <g font-family="Fraunces, serif" font-size="40" fill="${CREAM}">
        <text x="30" y="164" transform="rotate(7 30 164)">S</text>
        <text x="70" y="154" transform="rotate(-9 70 154)">T</text>
        <text x="106" y="168" transform="rotate(12 106 168)">I</text>
        <text x="128" y="156" transform="rotate(-5 128 156)">M</text>
        <text x="180" y="166" transform="rotate(10 180 166)">U</text>
      </g>
      <g font-family="Fraunces, serif" font-size="43" fill="${CREAM}">
        <text x="52" y="228" transform="rotate(-6 52 228)">L</text>
        <text x="90" y="238" transform="rotate(11 90 238)">A</text>
        <text x="136" y="226" transform="rotate(-10 136 226)">T</text>
        <text x="176" y="236" transform="rotate(4 176 236)">E</text>
        <text x="216" y="226" transform="rotate(-12 216 226)">D</text>
      </g>
      <rect width="300" height="300" fill="url(#g1)"/>
      ${caption("EVERY INPUT, SAME VOLUME", CREAM)}${mark()}</svg>`
  },
  {
    num: "02 — Tote", word: "Hyperfocused",
    line: "Four hours gone. Worth it, probably.",
    price: "£16.00", link: "#", bg: "#0E4F4F",
    // The word spirals inward and disappears into a single point.
    svg: `<svg viewBox="0 0 300 300">${grain("g2", 0.12)}
      <defs><path id="sp2" fill="none" d="M 150,32 A 118,118 0 1 1 149,32
        M 149,60 A 90,90 0 1 1 148,60 M 148,88 A 62,62 0 1 1 147,88"/></defs>
      <use href="#sp2" stroke="${GOLD}" stroke-width="0.8" opacity="0.35"/>
      <text font-family="Syne, sans-serif" font-size="21" fill="${CREAM}" letter-spacing="1.5">
        <textPath href="#sp2" startOffset="2%">HYPERFOCUSED · HYPERFOCUSED · HYPERFOCUSED · HYPERFOCUSED ·</textPath>
      </text>
      <circle cx="150" cy="150" r="15" fill="${GOLD}"/>
      <rect width="300" height="300" fill="url(#g2)"/>
      ${caption("FOUR HOURS GONE. WORTH IT.", CREAM)}${mark()}</svg>`
  },
  {
    num: "03 — Notebook", word: "Shutdown Mode",
    line: "Everything still on. Nothing responding.",
    price: "£12.00", link: "#", bg: "#2F3A56",
    // The word powers down letter by letter until it's gone.
    svg: `<svg viewBox="0 0 300 300">${grain("g3", 0.12)}
      <g font-family="Instrument Serif, serif" font-size="44" fill="${CREAM}">
        <text x="24" y="126" opacity="1">S</text><text x="52" y="126" opacity="0.92">H</text>
        <text x="84" y="126" opacity="0.78">U</text><text x="115" y="126" opacity="0.6">T</text>
        <text x="141" y="126" opacity="0.42">D</text><text x="172" y="126" opacity="0.26">O</text>
        <text x="204" y="126" opacity="0.14">W</text><text x="243" y="126" opacity="0.07">N</text>
      </g>
      <g font-family="Instrument Serif, serif" font-size="44" fill="${CREAM}">
        <text x="24" y="184" opacity="0.09">M</text><text x="62" y="184" opacity="0.05">O</text>
        <text x="94" y="184" opacity="0.03">D</text><text x="126" y="184" opacity="0.02">E</text>
      </g>
      <g stroke="${GOLD}" stroke-width="2.5" opacity="0.7">
        <circle cx="150" cy="228" r="2.5" fill="${GOLD}" stroke="none"/>
        <circle cx="164" cy="228" r="2.5" fill="${GOLD}" stroke="none" opacity="0.5"/>
        <circle cx="178" cy="228" r="2.5" fill="${GOLD}" stroke="none" opacity="0.25"/>
      </g>
      <rect width="300" height="300" fill="url(#g3)"/>
      ${caption("STILL ON. NOT RESPONDING.", CREAM)}${mark()}</svg>`
  },
  {
    num: "04 — Mug", word: "47 Things at Once",
    line: "All of them urgent. None of them started.",
    price: "£14.00", link: "#", bg: "#C77D22",
    // A huge 47 with the other thoughts swarming around it.
    svg: `<svg viewBox="0 0 300 300">${grain("g4", 0.12)}
      <g font-family="Abril Fatface, serif" font-size="11" fill="${CREAM}" opacity="0.55">
        <text x="24" y="52" transform="rotate(-14 24 52)">the email</text>
        <text x="188" y="46" transform="rotate(9 188 46)">that thing</text>
        <text x="20" y="132" transform="rotate(-6 20 132)">bins?</text>
        <text x="214" y="128" transform="rotate(12 214 128)">reply later</text>
        <text x="30" y="212" transform="rotate(8 30 212)">did I lock it</text>
        <text x="196" y="216" transform="rotate(-11 196 216)">2003 cringe</text>
        <text x="112" y="42" transform="rotate(4 112 42)">eat something</text>
        <text x="104" y="252" transform="rotate(-5 104 252)">the other thing</text>
      </g>
      <text x="150" y="178" text-anchor="middle" font-family="Abril Fatface, serif" font-size="91" fill="${INK}">47</text>
      <text x="150" y="204" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700"
        font-size="13" fill="${INK}" letter-spacing="0.2em">THINGS AT ONCE</text>
      <rect width="300" height="300" fill="url(#g4)"/>
      ${caption("ALL URGENT. NONE STARTED.", INK)}${mark()}</svg>`
  },
  {
    num: "05 — Wall print", word: "Info Dump Incoming",
    line: "You asked one question. Sorry in advance.",
    price: "£12.00", link: "#", bg: "#3F5E33",
    // The text overflows the frame — more words than the space allows.
    svg: `<svg viewBox="0 0 300 300">${grain("g5", 0.12)}
      <g font-family="Anton, sans-serif" font-size="28" fill="${CREAM}">
        <text x="-30" y="72" opacity="0.22">INFO DUMP INCOMING</text>
        <text x="-58" y="112" opacity="0.4">INFO DUMP INCOMING</text>
        <text x="14" y="158" opacity="1" font-size="27">INFO DUMP INCOMING</text>
        <text x="-64" y="202" opacity="0.4">INFO DUMP INCOMING</text>
        <text x="-36" y="242" opacity="0.22">INFO DUMP INCOMING</text>
      </g>
      <rect width="300" height="300" fill="url(#g5)"/>
      ${caption("ONE QUESTION. SORRY IN ADVANCE.", CREAM)}${mark()}</svg>`
  },
  {
    num: "06 — Sticker", word: "Infinity",
    line: "The symbol, drawn out of the word itself.",
    // Was "Pin / sticker" at £6.50, from when this was going to be an enamel
    // pin. It is made as the same 3" kiss-cut sticker as every other sticker
    // here, so it is priced like one — a customer should not pay £6.50 for the
    // thing sitting next to it at £3.50.
    price: "£3.50", link: "#", bg: "#5B3A62",
    // The neurodiversity infinity, written rather than drawn.
    svg: `<svg viewBox="0 0 300 300">${grain("g6", 0.12)}
      <path d="M150,136 C118,92 52,92 52,136 C52,180 118,180 150,136
        C182,92 248,92 248,136 C248,180 182,180 150,136 Z"
        fill="none" stroke="${CREAM}" stroke-width="11" stroke-linecap="round"/>
      <path d="M150,136 C118,92 52,92 52,136 C52,180 118,180 150,136
        C182,92 248,92 248,136 C248,180 182,180 150,136 Z"
        fill="none" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/>
      <text x="150" y="222" text-anchor="middle" font-family="Fraunces, serif"
        font-size="30" fill="${CREAM}">Neurodivergent</text>
      <text x="150" y="248" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="10" fill="${GOLD}" letter-spacing="0.24em">NO CURE REQUIRED</text>
      <rect width="300" height="300" fill="url(#g6)"/>
      ${mark()}</svg>`
  },
  {
    num: "07 — Sticker", word: "Touched Out",
    line: "Nothing personal. Everything sensory.",
    price: "£3.50", link: "#", bg: "#C4614F",
    // The two words recoil from each other, leaving a gap of space.
    svg: `<svg viewBox="0 0 300 300">${grain("g7", 0.12)}
      <text x="14" y="118" font-family="Instrument Serif, serif" font-size="55" fill="${CREAM}">TOUCHED</text>
      <g stroke="${CREAM}" stroke-width="1.4" opacity="0.5">
        <line x1="60" y1="150" x2="104" y2="150"/><line x1="196" y1="150" x2="240" y2="150"/>
        <path d="M104,150 l-9,-6 M104,150 l-9,6" fill="none"/>
        <path d="M196,150 l9,-6 M196,150 l9,6" fill="none"/>
      </g>
      <text x="286" y="204" text-anchor="end" font-family="Instrument Serif, serif" font-size="55" fill="${CREAM}">OUT</text>
      <rect width="300" height="300" fill="url(#g7)"/>
      ${caption("NOTHING PERSONAL. ALL SENSORY.", CREAM)}${mark()}</svg>`
  },
  {
    num: "08 — Sticker", word: "Low Spoons Today",
    line: "Operating at reduced capacity. Still operating.",
    price: "£3.50", link: "#", bg: "#E0A81C",
    // The word runs out of energy and sinks down the page.
    svg: `<svg viewBox="0 0 300 300">${grain("g8", 0.11)}
      <g font-family="Fraunces, serif" font-size="52" fill="${INK}">
        <text x="40" y="92">L</text><text x="80" y="94">O</text><text x="134" y="96">W</text>
      </g>
      <g font-family="Fraunces, serif" font-size="50">
        <text x="34" y="164" fill="${INK}" opacity="0.95" transform="rotate(2 34 164)">S</text>
        <text x="72" y="176" fill="${INK}" opacity="0.85" transform="rotate(6 72 176)">P</text>
        <text x="112" y="192" fill="${INK}" opacity="0.7" transform="rotate(11 112 192)">O</text>
        <text x="158" y="210" fill="${INK}" opacity="0.55" transform="rotate(16 158 210)">O</text>
        <text x="202" y="230" fill="${INK}" opacity="0.4" transform="rotate(21 202 230)">N</text>
        <text x="242" y="252" fill="${INK}" opacity="0.25" transform="rotate(26 242 252)">S</text>
      </g>
      <rect width="300" height="300" fill="url(#g8)"/>
      ${caption("REDUCED CAPACITY, STILL RUNNING", INK)}${mark()}</svg>`
  },
  {
    num: "09 — Hoodie", word: "Special Interest",
    line: "Ask me one question. Clear your afternoon.",
    price: "£36.99", link: "#", bg: "#29527A",
    // The subject repeats obsessively behind the words.
    svg: `<svg viewBox="0 0 300 300">${grain("g9", 0.12)}
      <g font-family="Space Grotesk, sans-serif" font-size="9" fill="${CREAM}" opacity="0.22" letter-spacing="0.1em">
        <text x="10" y="30">TELL ME MORE TELL ME MORE TELL ME MORE TELL ME MORE</text>
        <text x="-14" y="52">TELL ME MORE TELL ME MORE TELL ME MORE TELL ME MORE</text>
        <text x="6" y="74">TELL ME MORE TELL ME MORE TELL ME MORE TELL ME MORE</text>
        <text x="-20" y="96">TELL ME MORE TELL ME MORE TELL ME MORE TELL ME MORE</text>
        <text x="10" y="212">TELL ME MORE TELL ME MORE TELL ME MORE TELL ME MORE</text>
        <text x="-14" y="234">TELL ME MORE TELL ME MORE TELL ME MORE TELL ME MORE</text>
        <text x="6" y="256">TELL ME MORE TELL ME MORE TELL ME MORE TELL ME MORE</text>
      </g>
      <text x="150" y="140" text-anchor="middle" font-family="Anton, sans-serif" font-size="49" fill="${CREAM}">SPECIAL</text>
      <text x="150" y="184" text-anchor="middle" font-family="Anton, sans-serif" font-size="49" fill="${GOLD}">INTEREST</text>
      <rect width="300" height="300" fill="url(#g9)"/>
      ${mark()}</svg>`
  },
  {
    num: "10 — Wall print", word: "Executive Dysfunction",
    line: "The list exists. The doing does not.",
    price: "£12.00", link: "#", bg: "#8C3B4A",
    // The word starts solid and trails off unfinished — outline only.
    svg: `<svg viewBox="0 0 300 300">${grain("g10", 0.12)}
      <g font-family="Anton, sans-serif" font-size="47">
        <text x="26" y="120" fill="${CREAM}">EXEC</text>
        <text x="140" y="120" fill="none" stroke="${CREAM}" stroke-width="1" opacity="0.55">UTIVE</text>
      </g>
      <g font-family="Anton, sans-serif" font-size="38">
        <text x="26" y="176" fill="none" stroke="${CREAM}" stroke-width="1" opacity="0.4">DYSFUNCTION</text>
      </g>
      <g stroke="${CREAM}" stroke-width="2" opacity="0.5">
        <rect x="28" y="204" width="13" height="13" fill="none"/>
        <path d="M31,211 l3.5,4 6,-8" fill="none"/>
        <rect x="28" y="228" width="13" height="13" fill="none"/>
        <rect x="28" y="252" width="13" height="13" fill="none"/>
        <line x1="52" y1="211" x2="180" y2="211"/>
        <line x1="52" y1="235" x2="150" y2="235"/>
        <line x1="52" y1="259" x2="196" y2="259"/>
      </g>
      <rect width="300" height="300" fill="url(#g10)"/>
      ${mark()}</svg>`
  },
  {
    num: "11 — Wall print", word: "Waiting Mode",
    line: "One appointment at 2pm. The whole day, gone.",
    price: "£12.00", link: "#", bg: "#4A6670",
    // One small block swallows the entire day.
    svg: `<svg viewBox="0 0 300 300">${grain("g11", 0.12)}
      <g font-family="Space Grotesk, sans-serif" font-size="8" fill="${CREAM}" opacity="0.45" letter-spacing="0.1em">
        <text x="22" y="60">09:00</text><text x="22" y="82">10:00</text><text x="22" y="104">11:00</text>
        <text x="22" y="126">12:00</text><text x="22" y="148">13:00</text>
        <text x="22" y="192">15:00</text><text x="22" y="214">16:00</text><text x="22" y="236">17:00</text>
      </g>
      <g stroke="${CREAM}" stroke-width="0.8" opacity="0.28">
        <line x1="58" y1="56" x2="278" y2="56"/><line x1="58" y1="78" x2="278" y2="78"/>
        <line x1="58" y1="100" x2="278" y2="100"/><line x1="58" y1="122" x2="278" y2="122"/>
        <line x1="58" y1="144" x2="278" y2="144"/><line x1="58" y1="188" x2="278" y2="188"/>
        <line x1="58" y1="210" x2="278" y2="210"/><line x1="58" y1="232" x2="278" y2="232"/>
      </g>
      <rect x="58" y="152" width="220" height="30" fill="${GOLD}"/>
      <text x="168" y="173" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="11" fill="${INK}" letter-spacing="0.14em">14:00 — THE THING</text>
      <text x="150" y="272" text-anchor="middle" font-family="Space Mono, monospace" font-size="25" fill="${CREAM}">Waiting Mode</text>
      <rect width="300" height="300" fill="url(#g11)"/>
      ${mark()}</svg>`
  },
  {
    num: "12 — Tee", word: "Time Blind",
    line: "It was five minutes ago. It was four hours ago.",
    price: "£19.00", link: "#", bg: "#6B4E8C",
    // A clock whose numbers have come loose.
    svg: `<svg viewBox="0 0 300 300">${grain("g12", 0.12)}
      <circle cx="150" cy="140" r="86" fill="none" stroke="${CREAM}" stroke-width="2.5" opacity="0.55"/>
      <g font-family="Fraunces, serif" font-size="19" fill="${CREAM}">
        <text x="146" y="76" transform="rotate(-18 146 76)">12</text>
        <text x="206" y="104" transform="rotate(24 206 104)">7</text>
        <text x="222" y="164" transform="rotate(-9 222 164)">3</text>
        <text x="176" y="222" transform="rotate(31 176 222)">11</text>
        <text x="112" y="214" transform="rotate(-26 112 214)">2</text>
        <text x="74" y="158" transform="rotate(14 74 158)">9</text>
        <text x="88" y="100" transform="rotate(-33 88 100)">5</text>
      </g>
      <g stroke="${GOLD}" stroke-width="3" stroke-linecap="round">
        <line x1="150" y1="140" x2="150" y2="96"/><line x1="150" y1="140" x2="188" y2="158"/>
      </g>
      <circle cx="150" cy="140" r="4" fill="${GOLD}"/>
      <text x="150" y="268" text-anchor="middle" font-family="Fraunces, serif" font-size="38" fill="${CREAM}">Time Blind</text>
      <rect width="300" height="300" fill="url(#g12)"/>
      ${mark()}</svg>`
  },
  {
    num: "13 — Sticker", word: "Rejection Sensitive",
    line: "They said 'ok'. I have been thinking about it since.",
    price: "£3.50", link: "#", bg: "#A63D5A",
    // The word takes the hit and fractures.
    svg: `<svg viewBox="0 0 300 300">${grain("g13", 0.12)}
      <g font-family="Fraunces, serif" font-size="40" fill="${CREAM}">
        <text x="26" y="118" transform="rotate(-3 26 118)">REJEC</text>
        <text x="176" y="130" transform="rotate(9 176 130)">TION</text>
      </g>
      <g stroke="${GOLD}" stroke-width="1.4" opacity="0.85">
        <path d="M150,132 l14,16 -8,10 12,14" fill="none"/>
        <path d="M118,140 l-12,18 10,8" fill="none"/>
      </g>
      <g font-family="Fraunces, serif" font-size="34" fill="${CREAM}">
        <text x="34" y="196" transform="rotate(4 34 196)">SENSI</text>
        <text x="168" y="208" transform="rotate(-7 168 208)">TIVE</text>
      </g>
      <rect width="300" height="300" fill="url(#g13)"/>
      ${caption("THEY SAID OK. I AM STILL THINKING.", CREAM)}${mark()}</svg>`
  },
  {
    num: "14 — Mug", word: "Object Permanence",
    line: "If I put it in a drawer, it no longer exists.",
    price: "£14.00", link: "#", bg: "#2E6B5E",
    // The middle of the word simply stops existing.
    svg: `<svg viewBox="0 0 300 300">${grain("g14", 0.12)}
      <g font-family="Fraunces, serif" font-size="42" fill="${CREAM}">
        <text x="30" y="120">OB</text>
        <text x="96" y="120" opacity="0.16">JE</text>
        <text x="158" y="120" opacity="0.05">C</text>
        <text x="196" y="120" opacity="0.55">T</text>
      </g>
      <g font-family="Fraunces, serif" font-size="32" fill="${CREAM}">
        <text x="30" y="176" opacity="0.9">PERMA</text>
        <text x="152" y="176" opacity="0.1">NEN</text>
        <text x="234" y="176" opacity="0.7">CE</text>
      </g>
      <g stroke="${GOLD}" stroke-width="1.5" opacity="0.6" stroke-dasharray="4 5" fill="none">
        <rect x="96" y="196" width="108" height="46" rx="3"/>
      </g>
      <text x="150" y="224" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="500" font-size="9" fill="${GOLD}" letter-spacing="0.14em">IN THE DRAWER</text>
      <rect width="300" height="300" fill="url(#g14)"/>
      ${caption("OUT OF SIGHT, GENUINELY GONE", CREAM)}${mark()}</svg>`
  },
  {
    num: "15 — Tote", word: "Auditory Processing",
    line: "I heard you. Give me four seconds.",
    price: "£16.00", link: "#", bg: "#B5541F",
    // The words arrive, then arrive again, slightly late.
    svg: `<svg viewBox="0 0 300 300">${grain("g15", 0.12)}
      <g font-family="Fraunces, serif" font-size="32">
        <text x="24" y="104" fill="${GOLD}" opacity="0.4">AUDITORY</text>
        <text x="34" y="112" fill="${CREAM}">AUDITORY</text>
      </g>
      <g font-family="Fraunces, serif" font-size="32">
        <text x="24" y="164" fill="${GOLD}" opacity="0.4">PROCESSING</text>
        <text x="34" y="172" fill="${CREAM}">PROCESSING</text>
      </g>
      <g font-family="Fraunces, serif" font-size="32">
        <text x="24" y="224" fill="${GOLD}" opacity="0.4">DELAY</text>
        <text x="34" y="232" fill="${CREAM}">DELAY</text>
      </g>
      <g stroke="${CREAM}" stroke-width="1.2" opacity="0.5">
        <line x1="204" y1="228" x2="270" y2="228"/>
        <path d="M270,228 l-8,-5 M270,228 l-8,5" fill="none"/>
      </g>
      <rect width="300" height="300" fill="url(#g15)"/>
      ${caption("I HEARD YOU. GIVE ME FOUR SECONDS.", CREAM)}${mark()}</svg>`
  },
  {
    num: "16 — Sticker", word: "Stimming",
    line: "It's regulating, not fidgeting.",
    price: "£3.50", link: "#", bg: "#1F6F8B",
    // A repeating rhythm the eye can follow.
    svg: `<svg viewBox="0 0 300 300">${grain("g16", 0.12)}
      <g font-family="Fraunces, serif" font-size="30" fill="${CREAM}">
        <text x="26" y="108" opacity="0.3">stim</text>
        <text x="94" y="94" opacity="0.5">stim</text>
        <text x="162" y="112" opacity="0.7">stim</text>
        <text x="228" y="96" opacity="0.9">stim</text>
      </g>
      <text x="150" y="176" text-anchor="middle" font-family="Fraunces, serif" font-size="46" fill="${GOLD}">STIMMING</text>
      <g font-family="Fraunces, serif" font-size="30" fill="${CREAM}">
        <text x="26" y="232" opacity="0.9">stim</text>
        <text x="94" y="246" opacity="0.7">stim</text>
        <text x="162" y="228" opacity="0.5">stim</text>
        <text x="228" y="244" opacity="0.3">stim</text>
      </g>
      <rect width="300" height="300" fill="url(#g16)"/>
      ${caption("REGULATING, NOT FIDGETING", CREAM)}${mark()}</svg>`
  },
  {
    num: "17 — Wall print", word: "Decision Paralysis",
    line: "Six good options. Therefore, nothing.",
    price: "£12.00", link: "#", bg: "#7A4E2D",
    // The word forks into options and never resolves.
    svg: `<svg viewBox="0 0 300 300">${grain("g17", 0.12)}
      <text x="150" y="72" text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="${CREAM}">DECIDE</text>
      <g stroke="${CREAM}" stroke-width="1.3" opacity="0.55" fill="none">
        <path d="M150,84 L86,116 M150,84 L214,116"/>
        <path d="M86,128 L52,164 M86,128 L120,164"/>
        <path d="M214,128 L180,164 M214,128 L248,164"/>
        <path d="M52,176 L38,208 M52,176 L66,208"/>
        <path d="M120,176 L106,208 M120,176 L134,208"/>
        <path d="M180,176 L166,208 M180,176 L194,208"/>
        <path d="M248,176 L234,208 M248,176 L262,208"/>
      </g>
      <g font-family="Space Grotesk, sans-serif" font-size="9" fill="${GOLD}" text-anchor="middle" opacity="0.9">
        <text x="38" y="222">?</text><text x="66" y="222">?</text><text x="106" y="222">?</text>
        <text x="134" y="222">?</text><text x="166" y="222">?</text><text x="194" y="222">?</text>
        <text x="234" y="222">?</text><text x="262" y="222">?</text>
      </g>
      <text x="150" y="264" text-anchor="middle" font-family="Fraunces, serif" font-size="30" fill="${CREAM}">…nothing, then</text>
      <rect width="300" height="300" fill="url(#g17)"/>
      ${mark()}</svg>`
  },
  {
    num: "18 — Tee", word: "Parallel Play",
    line: "Same room. Different worlds. Perfect.",
    price: "£19.00", link: "#", bg: "#3A5F8A",
    // Two columns, side by side, never touching — and that's the point.
    svg: `<svg viewBox="0 0 300 300">${grain("g18", 0.12)}
      <g font-family="Fraunces, serif" font-size="26" fill="${CREAM}" text-anchor="middle">
        <text x="88" y="90">P</text><text x="88" y="122">L</text><text x="88" y="154">A</text>
        <text x="88" y="186">Y</text>
      </g>
      <g font-family="Fraunces, serif" font-size="26" fill="${GOLD}" text-anchor="middle">
        <text x="212" y="90">P</text><text x="212" y="122">L</text><text x="212" y="154">A</text>
        <text x="212" y="186">Y</text>
      </g>
      <line x1="150" y1="64" x2="150" y2="200" stroke="${CREAM}" stroke-width="1" opacity="0.3" stroke-dasharray="3 6"/>
      <text x="150" y="248" text-anchor="middle" font-family="Fraunces, serif" font-size="32" fill="${CREAM}">Parallel Play</text>
      <rect width="300" height="300" fill="url(#g18)"/>
      ${caption("SAME ROOM. DIFFERENT WORLDS.", CREAM)}${mark()}</svg>`
  },
  {
    num: "19 — Sticker", word: "Demand Avoidant",
    line: "The moment it became compulsory, it became impossible.",
    price: "£3.50", link: "#", bg: "#5E7A2E",
    // The word pushes back against the instruction.
    svg: `<svg viewBox="0 0 300 300">${grain("g19", 0.12)}
      <text x="150" y="94" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="13" fill="${GOLD}" letter-spacing="0.2em">YOU HAVE TO</text>
      <g stroke="${CREAM}" stroke-width="1.6" opacity="0.7" fill="none">
        <line x1="150" y1="108" x2="150" y2="132"/>
        <path d="M150,132 l-6,-8 M150,132 l6,-8"/>
      </g>
      <text x="150" y="176" text-anchor="middle" font-family="Fraunces, serif" font-size="42" fill="${CREAM}">Well now</text>
      <text x="150" y="216" text-anchor="middle" font-family="Fraunces, serif" font-size="42" fill="${CREAM}">I can't.</text>
      <rect width="300" height="300" fill="url(#g19)"/>
      ${caption("DEMAND AVOIDANT, NOT DIFFICULT", CREAM)}${mark()}</svg>`
  },
  {
    num: "20 — Mug", word: "Snacks and Spite",
    line: "The two-ingredient fuel blend.",
    price: "£14.00", link: "#", bg: "#C2432F",
    // A fuel gauge with an honest breakdown.
    svg: `<svg viewBox="0 0 300 300">${grain("g20", 0.12)}
      <text x="150" y="78" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="10" fill="${CREAM}" opacity="0.8" letter-spacing="0.2em">CURRENTLY RUNNING ON</text>
      <text x="150" y="132" text-anchor="middle" font-family="Abril Fatface, serif" font-size="34" fill="${CREAM}">SNACKS</text>
      <text x="150" y="166" text-anchor="middle" font-family="Abril Fatface, serif" font-size="20" fill="${GOLD}" font-style="italic">and</text>
      <text x="150" y="212" text-anchor="middle" font-family="Abril Fatface, serif" font-size="34" fill="${CREAM}">SPITE</text>
      <g stroke="${CREAM}" stroke-width="2" opacity="0.6" fill="none">
        <rect x="60" y="234" width="180" height="14"/>
        <rect x="63" y="237" width="72" height="8" fill="${GOLD}" stroke="none"/>
        <rect x="135" y="237" width="102" height="8" fill="${CREAM}" stroke="none" opacity="0.55"/>
      </g>
      <rect width="300" height="300" fill="url(#g20)"/>
      ${caption("40% SNACKS. 60% SPITE.", CREAM)}${mark()}</svg>`
  },
  {
    num: "21 — Wall print", word: "Autistic Joy",
    line: "The good bit nobody writes leaflets about.",
    price: "£12.00", link: "#", bg: "#2A6E4F",
    // The letters themselves radiate out from the centre.
    svg: `<svg viewBox="0 0 300 300">${grain("g21", 0.11)}
      <g font-family="Abril Fatface, serif" font-size="17" fill="${GOLD}" opacity="0.9">
        <text x="150" y="40" text-anchor="middle" transform="rotate(0 150 150)">joy</text>
        <text x="150" y="40" text-anchor="middle" transform="rotate(45 150 150)">joy</text>
        <text x="150" y="40" text-anchor="middle" transform="rotate(90 150 150)">joy</text>
        <text x="150" y="40" text-anchor="middle" transform="rotate(135 150 150)">joy</text>
        <text x="150" y="40" text-anchor="middle" transform="rotate(180 150 150)">joy</text>
        <text x="150" y="40" text-anchor="middle" transform="rotate(225 150 150)">joy</text>
        <text x="150" y="40" text-anchor="middle" transform="rotate(270 150 150)">joy</text>
        <text x="150" y="40" text-anchor="middle" transform="rotate(315 150 150)">joy</text>
      </g>
      <g font-family="Abril Fatface, serif" font-size="13" fill="${CREAM}" opacity="0.55">
        <text x="150" y="74" text-anchor="middle" transform="rotate(22 150 150)">joy</text>
        <text x="150" y="74" text-anchor="middle" transform="rotate(112 150 150)">joy</text>
        <text x="150" y="74" text-anchor="middle" transform="rotate(202 150 150)">joy</text>
        <text x="150" y="74" text-anchor="middle" transform="rotate(292 150 150)">joy</text>
      </g>
      <text x="150" y="145" text-anchor="middle" font-family="Abril Fatface, serif" font-size="25" fill="${CREAM}">AUTISTIC</text>
      <text x="150" y="176" text-anchor="middle" font-family="Abril Fatface, serif" font-size="25" fill="${GOLD}">JOY</text>
      <rect width="300" height="300" fill="url(#g21)"/>
      ${caption("YES, IT IS A WHOLE THING", CREAM)}${mark()}</svg>`
  },
  {
    num: "22 — Mug", word: "Interoception",
    line: "Hungry? Thirsty? Sad? Unclear. Possibly all three.",
    price: "£14.00", link: "#", bg: "#4C5D8A",
    // The body's status readout, all question marks.
    svg: `<svg viewBox="0 0 300 300">${grain("g22", 0.12)}
      <g font-family="Space Grotesk, sans-serif" font-size="10" fill="${CREAM}" letter-spacing="0.12em">
        <text x="46" y="86">HUNGRY</text><text x="230" y="86" text-anchor="end">?</text>
        <text x="46" y="114">THIRSTY</text><text x="230" y="114" text-anchor="end">?</text>
        <text x="46" y="142">TIRED</text><text x="230" y="142" text-anchor="end">?</text>
        <text x="46" y="170">SAD, OR COLD</text><text x="230" y="170" text-anchor="end">?</text>
        <text x="46" y="198">NEED THE LOO</text><text x="230" y="198" text-anchor="end">?</text>
      </g>
      <g stroke="${CREAM}" stroke-width="0.8" opacity="0.3">
        <line x1="46" y1="94" x2="230" y2="94"/><line x1="46" y1="122" x2="230" y2="122"/>
        <line x1="46" y1="150" x2="230" y2="150"/><line x1="46" y1="178" x2="230" y2="178"/>
        <line x1="46" y1="206" x2="230" y2="206"/>
      </g>
      <text x="150" y="252" text-anchor="middle" font-family="Space Mono, monospace" font-size="24" fill="${GOLD}">Interoception</text>
      <rect width="300" height="300" fill="url(#g22)"/>
      ${mark()}</svg>`
  },
  {
    num: "23 — Sticker", word: "Do Not Perceive Me",
    line: "I'm fine. I just need everyone to look elsewhere.",
    price: "£3.50", link: "#", bg: "#3D4A42",
    // The words shrink into the corner of an enormous empty field.
    svg: `<svg viewBox="0 0 300 300">${grain("g23", 0.12)}
      <text x="150" y="128" text-anchor="middle" font-family="Instrument Serif, serif" font-size="30" fill="${CREAM}" opacity="0.9">please</text>
      <text x="150" y="156" text-anchor="middle" font-family="Instrument Serif, serif" font-size="22" fill="${CREAM}" opacity="0.65">do not</text>
      <text x="150" y="178" text-anchor="middle" font-family="Instrument Serif, serif" font-size="16" fill="${CREAM}" opacity="0.45">perceive</text>
      <text x="150" y="194" text-anchor="middle" font-family="Instrument Serif, serif" font-size="12" fill="${CREAM}" opacity="0.3">me</text>
      <rect width="300" height="300" fill="url(#g23)"/>
      ${caption("PERCEPTION: DECLINED", CREAM)}${mark()}</svg>`
  },
  {
    num: "24 — Tee", word: "Late Diagnosed",
    line: "Thirty years of evidence, reviewed in one afternoon.",
    price: "£19.00", link: "#", bg: "#7A3E86",
    // Decades of faint, unreadable years — then the word, in full.
    svg: `<svg viewBox="0 0 300 300">${grain("g24", 0.12)}
      <g font-family="Space Grotesk, sans-serif" font-size="11" fill="${CREAM}" opacity="0.28">
        <text x="16" y="52">so sensitive · too quiet · away with the fairies</text>
        <text x="16" y="76">just shy · dramatic · fussy eater · gifted but</text>
        <text x="16" y="100">lazy · rude · doesn't apply herself · odd</text>
        <text x="16" y="124">too much · not trying · attention seeking</text>
        <text x="16" y="148">difficult · oversensitive · could do better</text>
      </g>
      <line x1="16" y1="170" x2="284" y2="170" stroke="${GOLD}" stroke-width="1.5" opacity="0.8"/>
      <text x="150" y="212" text-anchor="middle" font-family="Fraunces, serif" font-size="38" fill="${CREAM}">Late Diagnosed</text>
      <text x="150" y="242" text-anchor="middle" font-family="Fraunces, serif" font-size="18" fill="${GOLD}" font-style="italic">not late to being it</text>
      <rect width="300" height="300" fill="url(#g24)"/>
      ${mark()}</svg>`
  },
  {
    num: "25 — Tote", word: "Monotropic",
    line: "One channel, wide open. The rest, closed.",
    price: "£16.00", link: "#", bg: "#175E75",
    // Everything else fades out; one word runs the full depth of the page.
    svg: `<svg viewBox="0 0 300 300">${grain("g25", 0.12)}
      <g font-family="Syne, sans-serif" font-size="14" fill="${CREAM}" opacity="0.2">
        <text x="14" y="46">the washing</text><text x="196" y="46">emails</text>
        <text x="10" y="86">someone talking</text><text x="216" y="86">hunger</text>
        <text x="16" y="126">the time</text><text x="222" y="126">the door</text>
        <text x="12" y="176">a message</text><text x="212" y="176">the news</text>
        <text x="18" y="222">tomorrow</text><text x="206" y="222">the plan</text>
        <text x="24" y="262">everything</text><text x="204" y="262">else</text>
      </g>
      <rect x="118" y="20" width="64" height="260" fill="#175E75"/>
      <g font-family="Syne, sans-serif" font-size="24" fill="${GOLD}" text-anchor="middle">
        <text x="150" y="48">M</text><text x="150" y="72">O</text><text x="150" y="96">N</text>
        <text x="150" y="120">O</text><text x="150" y="144">T</text><text x="150" y="168">R</text>
        <text x="150" y="192">O</text><text x="150" y="216">P</text><text x="150" y="240">I</text>
        <text x="150" y="264">C</text>
      </g>
      <rect width="300" height="300" fill="url(#g25)"/>
      ${mark()}</svg>`
  },
  {
    num: "26 — Wall print", word: "Justice Sensitive",
    line: "It was small. It was also wrong.",
    price: "£12.00", link: "#", bg: "#8A5A1C",
    // The word itself is the beam, and it will not sit level.
    svg: `<svg viewBox="0 0 300 300">${grain("g26", 0.12)}
      <text x="150" y="126" text-anchor="middle" font-family="Fraunces, serif" font-size="34"
        fill="${CREAM}" transform="rotate(-11 150 126)">JUSTICE</text>
      <text x="150" y="186" text-anchor="middle" font-family="Fraunces, serif" font-size="34"
        fill="${GOLD}" transform="rotate(-11 150 186)">SENSITIVE</text>
      <line x1="150" y1="96" x2="150" y2="238" stroke="${CREAM}" stroke-width="1.5" opacity="0.35" stroke-dasharray="4 5"/>
      <text x="150" y="264" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="9" fill="${CREAM}" opacity="0.7" letter-spacing="0.18em">STILL NOT LEVEL</text>
      <rect width="300" height="300" fill="url(#g26)"/>
      ${mark()}</svg>`
  },
  {
    num: "27 — Notebook", word: "Regulation: Loading",
    line: "Please do not close this window.",
    price: "£12.00", link: "#", bg: "#2E4A63",
    // A progress bar that has been at 31% for some time.
    svg: `<svg viewBox="0 0 300 300">${grain("g27", 0.12)}
      <text x="150" y="110" text-anchor="middle" font-family="Space Mono, monospace" font-size="22" fill="${CREAM}">EMOTIONAL</text>
      <text x="150" y="146" text-anchor="middle" font-family="Space Mono, monospace" font-size="22" fill="${CREAM}">REGULATION</text>
      <rect x="52" y="176" width="196" height="20" fill="none" stroke="${CREAM}" stroke-width="2"/>
      <rect x="55" y="179" width="58" height="14" fill="${GOLD}"/>
      <text x="150" y="222" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="11" fill="${CREAM}" opacity="0.85" letter-spacing="0.2em">31% — LOADING</text>
      <text x="150" y="250" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-size="9" fill="${CREAM}" opacity="0.5" letter-spacing="0.14em">TIME REMAINING: UNKNOWN</text>
      <rect width="300" height="300" fill="url(#g27)"/>
      ${mark()}</svg>`
  },
  {
    num: "28 — Sticker", word: "Sensory Seeking",
    line: "More pressure, more texture, more of that sound.",
    price: "£3.50", link: "#", bg: "#B03A6E",
    // The word crushed inward, letters piling up under the pressure.
    svg: `<svg viewBox="0 0 300 300">${grain("g28", 0.12)}
      <g font-family="Fraunces, serif" font-size="34" fill="${CREAM}">
        <text x="10" y="114">M</text><text x="46" y="119">O</text>
        <text x="78" y="124">R</text><text x="106" y="128">E</text>
        <text x="150" y="128">M</text><text x="186" y="124">O</text>
        <text x="218" y="119">R</text><text x="250" y="114">E</text>
      </g>
      <g font-family="Fraunces, serif" font-size="34" fill="${GOLD}">
        <text x="20" y="176">M</text><text x="56" y="180">O</text>
        <text x="88" y="184">R</text><text x="116" y="187">E</text>
        <text x="156" y="187">M</text><text x="192" y="184">O</text>
        <text x="224" y="180">R</text><text x="256" y="176">E</text>
      </g>
      <g stroke="${CREAM}" stroke-width="1.6" opacity="0.6" fill="none">
        <path d="M40,214 L142,214 M142,214 l-11,-5 M142,214 l-11,5"/>
        <path d="M260,214 L158,214 M158,214 l11,-5 M158,214 l11,5"/>
      </g>
      <text x="150" y="264" text-anchor="middle" font-family="Fraunces, serif" font-size="24" fill="${CREAM}">sensory seeking</text>
      <rect width="300" height="300" fill="url(#g28)"/>
      ${mark()}</svg>`
  },
  {
    num: "29 — Tee", word: "No Idea What My Face Is Doing",
    line: "It's not a mood. It's just the face.",
    price: "£19.00", link: "#", bg: "#B5461F",
    // A long sentence set as a solid block — deadpan by density.
    svg: `<svg viewBox="0 0 300 300">${grain("g29", 0.12)}
      <text x="26" y="94" font-family="Fraunces, serif" font-size="40" fill="${CREAM}">I HAVE</text>
      <text x="26" y="136" font-family="Fraunces, serif" font-size="40" fill="${CREAM}">NO IDEA</text>
      <text x="26" y="172" font-family="Fraunces, serif" font-size="27" fill="${CREAM}" opacity="0.85">WHAT MY FACE</text>
      <text x="26" y="204" font-family="Fraunces, serif" font-size="27" fill="${GOLD}">IS DOING</text>
      <g stroke="${CREAM}" stroke-width="1.4" opacity="0.5" fill="none">
        <circle cx="228" cy="238" r="20"/>
        <line x1="221" y1="232" x2="221" y2="232.5" stroke-linecap="round" stroke-width="3"/>
        <line x1="235" y1="232" x2="235" y2="232.5" stroke-linecap="round" stroke-width="3"/>
        <line x1="219" y1="247" x2="237" y2="247"/>
      </g>
      <rect width="300" height="300" fill="url(#g29)"/>
      ${caption("NOT A MOOD. JUST THE FACE.", CREAM)}${mark()}</svg>`
  },
  {
    num: "30 — Sticker", word: "Recharging",
    line: "Not antisocial. Just at 4%.",
    price: "£3.50", link: "#", bg: "#3C6E5A",
    // The word fills up like a battery — solid at the start, hollow after.
    svg: `<svg viewBox="0 0 300 300">${grain("g30", 0.12)}
      <g font-family="Space Mono, monospace" font-size="33">
        <text x="22" y="150" fill="${GOLD}">R</text>
        <text x="56" y="150" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.6">E</text>
        <text x="86" y="150" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.55">C</text>
        <text x="120" y="150" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.5">H</text>
        <text x="158" y="150" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.45">A</text>
        <text x="192" y="150" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.4">R</text>
        <text x="226" y="150" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.35">G</text>
      </g>
      <g font-family="Space Mono, monospace" font-size="33">
        <text x="88" y="206" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.3">I</text>
        <text x="108" y="206" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.25">N</text>
        <text x="146" y="206" fill="none" stroke="${CREAM}" stroke-width="1.1" opacity="0.2">G</text>
      </g>
      <rect x="22" y="230" width="256" height="9" fill="none" stroke="${CREAM}" stroke-width="1.4" opacity="0.6"/>
      <rect x="24" y="232" width="12" height="5" fill="${GOLD}"/>
      <text x="150" y="268" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="10" fill="${CREAM}" opacity="0.75" letter-spacing="0.2em">4% — DO NOT UNPLUG</text>
      <rect width="300" height="300" fill="url(#g30)"/>
      ${mark()}</svg>`
  },
  {
    num: "31 — Tee", word: "Ask Me About It",
    line: "A genuine invitation. Clear your afternoon.",
    price: "£19.00", link: "#", bg: "#E8952C",
    // An open invitation rather than an apology.
    svg: `<svg viewBox="0 0 300 300">${grain("j1", 0.11)}
      <path d="M40,72 h220 a6,6 0 0 1 6,6 v92 a6,6 0 0 1 -6,6 h-96 l-26,26 -8,-26 h-90 a6,6 0 0 1 -6,-6 v-92 a6,6 0 0 1 6,-6 z"
        fill="${CREAM}"/>
      <text x="150" y="116" text-anchor="middle" font-family="Fraunces, serif" font-size="30" fill="${INK}">ASK ME</text>
      <text x="150" y="152" text-anchor="middle" font-family="Fraunces, serif" font-size="30" fill="${INK}">ABOUT IT</text>
      <text x="150" y="240" text-anchor="middle" font-family="Fraunces, serif" font-size="19" fill="${CREAM}" font-style="italic">go on, I've got so much</text>
      <rect width="300" height="300" fill="url(#j1)"/>
      ${caption("YES, REALLY. ASK.", CREAM)}${mark()}</svg>`
  },
  {
    num: "32 — Wall print", word: "Unreasonably Delighted",
    line: "By something very small, once again.",
    price: "£12.00", link: "#", bg: "#D6437A",
    // Delight, radiating outward in every direction.
    svg: `<svg viewBox="0 0 300 300">${grain("j2", 0.11)}
      <g fill="${GOLD}" opacity="0.95">
        <path d="M52,60 l3.5,8 8,3.5 -8,3.5 -3.5,8 -3.5,-8 -8,-3.5 8,-3.5 Z"/>
        <path d="M248,88 l3,7 7,3 -7,3 -3,7 -3,-7 -7,-3 7,-3 Z"/>
        <path d="M40,214 l3,7 7,3 -7,3 -3,7 -3,-7 -7,-3 7,-3 Z"/>
        <path d="M256,228 l4,9 9,4 -9,4 -4,9 -4,-9 -9,-4 9,-4 Z"/>
        <path d="M150,42 l4,9 9,4 -9,4 -4,9 -4,-9 -9,-4 9,-4 Z"/>
      </g>
      <text x="150" y="132" text-anchor="middle" font-family="Abril Fatface, serif" font-size="25" fill="${CREAM}">deeply,</text>
      <text x="150" y="170" text-anchor="middle" font-family="Abril Fatface, serif" font-size="25" fill="${CREAM}">unreasonably</text>
      <text x="150" y="212" text-anchor="middle" font-family="Abril Fatface, serif" font-size="35" fill="${GOLD}">DELIGHTED</text>
      <rect width="300" height="300" fill="url(#j2)"/>
      ${caption("BY SOMETHING VERY SMALL", CREAM)}${mark()}</svg>`
  },
  {
    num: "33 — Tote", word: "I Notice Everything",
    line: "The detail you missed? I have it.",
    price: "£16.00", link: "#", bg: "#1E6B8C",
    // A field of near-identical marks — and the one that isn't.
    svg: `<svg viewBox="0 0 300 300">${grain("g33", 0.11)}
      <g font-family="Space Grotesk, sans-serif" font-size="13" fill="${CREAM}" opacity="0.4">
        ${[0,1,2,3,4,5,6,7].map(r => [0,1,2,3,4,5,6,7,8].map(c =>
          `<text x="${24+c*32}" y="${44+r*26}">o</text>`).join('')).join('')}
      </g>
      <text x="184" y="122" font-family="Space Grotesk, sans-serif" font-size="13" fill="${GOLD}">e</text>
      <circle cx="188" cy="117" r="13" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
      <line x1="197" y1="126" x2="208" y2="137" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round"/>
      <text x="150" y="272" text-anchor="middle" font-family="Fraunces, serif" font-size="30" fill="${CREAM}">I notice everything</text>
      <rect width="300" height="300" fill="url(#g33)"/>
      ${mark()}</svg>`
  },
  {
    num: "34 — Sticker", word: "Happy Flappy",
    line: "Joy, with the whole body.",
    price: "£3.50", link: "#", bg: "#F0B429",
    // The word won't hold still either — caught mid-flap.
    svg: `<svg viewBox="0 0 300 300">${grain("g34", 0.11)}
      <g text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="${INK}">
        <text x="150" y="118" opacity="0.18" transform="rotate(-9 150 118)">HAPPY</text>
        <text x="150" y="124" opacity="0.38" transform="rotate(-5 150 124)">HAPPY</text>
        <text x="150" y="130" opacity="1" transform="rotate(-1 150 130)">HAPPY</text>
      </g>
      <g text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="${INK}">
        <text x="150" y="186" opacity="0.18" transform="rotate(9 150 186)">FLAPPY</text>
        <text x="150" y="192" opacity="0.38" transform="rotate(5 150 192)">FLAPPY</text>
        <text x="150" y="198" opacity="1" transform="rotate(1 150 198)">FLAPPY</text>
      </g>
      <g stroke="${CREAM}" stroke-width="3.5" fill="none" stroke-linecap="round">
        <path d="M40,140 q-15,18 0,36"/><path d="M22,132 q-22,26 0,52"/>
        <path d="M260,140 q15,18 0,36"/><path d="M278,132 q22,26 0,52"/>
      </g>
      <rect width="300" height="300" fill="url(#g34)"/>
      ${caption("JOY, WITH THE WHOLE BODY", INK)}${mark()}</svg>`
  },
  {
    num: "35 — Wall print", word: "Found My People",
    line: "Turns out they were out there.",
    price: "£12.00", link: "#", bg: "#2F7A63",
    // Scattered, isolated words — then a cluster that found each other.
    svg: `<svg viewBox="0 0 300 300">${grain("g35", 0.11)}
      <g font-family="Fraunces, serif" font-size="15" fill="${CREAM}" opacity="0.3">
        <text x="18" y="40" transform="rotate(-12 18 40)">me</text>
        <text x="248" y="52" transform="rotate(14 248 52)">me</text>
        <text x="26" y="252" transform="rotate(9 26 252)">me</text>
        <text x="256" y="248" transform="rotate(-11 256 248)">me</text>
        <text x="142" y="30" transform="rotate(6 142 30)">me</text>
        <text x="20" y="146" transform="rotate(-6 20 146)">me</text>
        <text x="262" y="150" transform="rotate(8 262 150)">me</text>
      </g>
      <g font-family="Fraunces, serif" font-size="20" fill="${GOLD}">
        <text x="118" y="126" transform="rotate(-6 118 126)">me</text>
        <text x="158" y="120" transform="rotate(7 158 120)">me</text>
        <text x="106" y="152" transform="rotate(5 106 152)">me</text>
        <text x="152" y="156" transform="rotate(-8 152 156)">me</text>
        <text x="134" y="178" transform="rotate(3 134 178)">me</text>
        <text x="176" y="148" transform="rotate(10 176 148)">me</text>
      </g>
      <text x="150" y="244" text-anchor="middle" font-family="Fraunces, serif" font-size="32" fill="${CREAM}">Found my people</text>
      <rect width="300" height="300" fill="url(#g35)"/>
      ${caption("TURNS OUT THEY WERE OUT THERE", CREAM)}${mark()}</svg>`
  },
  {
    num: "36 — Mug", word: "Comfort Rewatch",
    line: "I know what happens. That is the point.",
    price: "£14.00", link: "#", bg: "#6B5CA8",
    // The words run round and round, never getting off.
    svg: `<svg viewBox="0 0 300 300">${grain("g36", 0.11)}
      <defs><path id="loop36" fill="none" d="M150,42 A108,108 0 1 1 149,42"/></defs>
      <use href="#loop36" stroke="${CREAM}" stroke-width="0.8" opacity="0.3"/>
      <text font-family="Fraunces, serif" font-size="21" fill="${CREAM}" letter-spacing="1">
        <textPath href="#loop36" startOffset="0%">AGAIN · AGAIN · AGAIN · AGAIN · AGAIN · AGAIN · AGAIN ·</textPath>
      </text>
      <text x="150" y="142" text-anchor="middle" font-family="Fraunces, serif" font-size="26" fill="${GOLD}">comfort</text>
      <text x="150" y="176" text-anchor="middle" font-family="Fraunces, serif" font-size="26" fill="${GOLD}">rewatch</text>
      <text x="150" y="278" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="9" fill="${CREAM}" opacity="0.7" letter-spacing="0.2em">I KNOW WHAT HAPPENS</text>
      <rect width="300" height="300" fill="url(#g36)"/>
      ${mark()}</svg>`
  },
  {
    num: "37 — Sticker", word: "Same Meal, Still Perfect",
    line: "Day forty-one. No notes.",
    price: "£3.50", link: "#", bg: "#D96C3F",
    // The same line, seven times, deliberately identical.
    svg: `<svg viewBox="0 0 300 300">${grain("g37", 0.11)}
      <g font-family="Caveat, cursive" font-size="25" fill="${CREAM}">
        <text x="26" y="60">the same thing</text>
        <text x="26" y="90">the same thing</text>
        <text x="26" y="120">the same thing</text>
        <text x="26" y="150">the same thing</text>
        <text x="26" y="180">the same thing</text>
        <text x="26" y="210">the same thing</text>
        <text x="26" y="240" fill="${GOLD}">and still perfect</text>
      </g>
      <g font-family="Space Grotesk, sans-serif" font-size="8" fill="${CREAM}" opacity="0.5" text-anchor="end">
        <text x="274" y="60">MON</text><text x="274" y="90">TUE</text><text x="274" y="120">WED</text>
        <text x="274" y="150">THU</text><text x="274" y="180">FRI</text><text x="274" y="210">SAT</text>
        <text x="274" y="240">SUN</text>
      </g>
      <rect width="300" height="300" fill="url(#g37)"/>
      ${caption("DAY FORTY-ONE. NO NOTES.", CREAM)}${mark()}</svg>`
  },
  {
    num: "38 — Hoodie", word: "Pattern Recognition",
    line: "I saw it three steps ago. I did say.",
    price: "£36.99", link: "#", bg: "#1F5E52",
    // The word hides in the noise until you see it — then you can't unsee it.
    svg: `<svg viewBox="0 0 300 300">${grain("g38", 0.11)}
      <g font-family="Space Grotesk, sans-serif" font-size="14" fill="${CREAM}" opacity="0.28">
        ${(() => {
          const junk = "XKVZQWNRJBTHYFMDGPLSCX";
          let out = "";
          for(let r=0;r<9;r++){ for(let c=0;c<11;c++){
            out += `<text x="${20+c*26}" y="${44+r*26}">${junk[(r*7+c*3)%junk.length]}</text>`;
          }}
          return out;
        })()}
      </g>
      <g font-family="Space Grotesk, sans-serif" font-size="15" fill="${GOLD}" font-weight="700">
        ${"PATTERN".split("").map((ch,i) =>
          `<text x="${20+i*26}" y="${44+i*26}">${ch}</text>`).join("")}
      </g>
      <text x="150" y="284" text-anchor="middle" font-family="Syne, sans-serif" font-size="23" fill="${CREAM}">Pattern recognition</text>
      <rect width="300" height="300" fill="url(#g38)"/>
      ${mark()}</svg>`
  },
  {
    num: "39 — Tee", word: "Enthusiasm, Unmasked",
    line: "Turns out this is what I'm like.",
    price: "£19.00", link: "#", bg: "#C93F5E",
    // The word finally allowed to take up the whole space.
    svg: `<svg viewBox="0 0 300 300">${grain("j9", 0.11)}
      <text x="150" y="96" text-anchor="middle" font-family="Anton, sans-serif" font-size="29" fill="${CREAM}" opacity="0.6">no longer</text>
      <text x="150" y="126" text-anchor="middle" font-family="Anton, sans-serif" font-size="29" fill="${CREAM}" opacity="0.6">turning it down</text>
      <text x="150" y="190" text-anchor="middle" font-family="Anton, sans-serif" font-size="39" fill="${GOLD}">ENTHUSIASM</text>
      <text x="150" y="232" text-anchor="middle" font-family="Anton, sans-serif" font-size="38" fill="${CREAM}">unmasked</text>
      <g stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
        <line x1="34" y1="204" x2="52" y2="196"/><line x1="266" y1="204" x2="248" y2="196"/>
        <line x1="30" y1="176" x2="50" y2="176"/><line x1="270" y1="176" x2="250" y2="176"/>
      </g>
      <rect width="300" height="300" fill="url(#j9)"/>
      ${caption("THIS IS WHAT I'M LIKE", CREAM)}${mark()}</svg>`
  },
  {
    num: "40 — Wall print", word: "Small Things, Enormous Joy",
    line: "The scale is correct, actually.",
    price: "£12.00", link: "#", bg: "#3E7CB1",
    // The typography does the maths: small thing, enormous feeling.
    svg: `<svg viewBox="0 0 300 300">${grain("j10", 0.11)}
      <text x="150" y="76" text-anchor="middle" font-family="Abril Fatface, serif" font-size="13" fill="${CREAM}" opacity="0.85">small things,</text>
      <text x="150" y="164" text-anchor="middle" font-family="Abril Fatface, serif" font-size="37" fill="${CREAM}">ENORMOUS</text>
      <text x="150" y="222" text-anchor="middle" font-family="Abril Fatface, serif" font-size="49" fill="${GOLD}">JOY</text>
      <rect width="300" height="300" fill="url(#j10)"/>
      ${caption("THE SCALE IS CORRECT", CREAM)}${mark()}</svg>`
  },
  {
    num: "41 — Wall print", word: "Never Too Much",
    line: "The room was too small. That's a different problem.",
    price: "£12.00", link: "#", bg: "#C23A5B",
    // The words genuinely don't fit the frame — and that's the argument.
    svg: `<svg viewBox="0 0 300 300">${grain("a1", 0.11)}
      <text x="150" y="94" text-anchor="middle" font-family="Anton, sans-serif" font-size="27" fill="${CREAM}" opacity="0.8">you were never</text>
      <text x="150" y="168" text-anchor="middle" font-family="Anton, sans-serif" font-size="50" fill="${CREAM}">TOO MUCH</text>
      <text x="150" y="216" text-anchor="middle" font-family="Anton, sans-serif" font-size="25" fill="${GOLD}" font-style="italic">the room was too small</text>
      <rect width="300" height="300" fill="url(#a1)"/>
      ${caption("A DIFFERENT PROBLEM ENTIRELY", CREAM)}${mark()}</svg>`
  },
  {
    num: "42 — Tee", word: "Nothing Needs Fixing",
    line: "Every correction they made, returned to sender.",
    price: "£19.00", link: "#", bg: "#2F6B57",
    // Proofreading marks all over you — then every one of them struck out.
    svg: `<svg viewBox="0 0 300 300">${grain("a2", 0.11)}
      <g font-family="Space Grotesk, sans-serif" font-size="11" fill="${CREAM}" opacity="0.35">
        <text x="26" y="60">too literal</text><text x="192" y="56">too loud</text>
        <text x="30" y="196">too quiet</text><text x="188" y="206">too honest</text>
        <text x="34" y="240">too slow</text><text x="196" y="248">too fast</text>
      </g>
      <g stroke="${GOLD}" stroke-width="2" opacity="0.9" stroke-linecap="round">
        <line x1="22" y1="56" x2="94" y2="56"/><line x1="188" y1="52" x2="248" y2="52"/>
        <line x1="26" y1="192" x2="90" y2="192"/><line x1="184" y1="202" x2="256" y2="202"/>
        <line x1="30" y1="236" x2="92" y2="236"/><line x1="192" y1="244" x2="250" y2="244"/>
      </g>
      <text x="150" y="126" text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="${CREAM}">NOTHING HERE</text>
      <text x="150" y="164" text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="${GOLD}">NEEDS FIXING</text>
      <rect width="300" height="300" fill="url(#a2)"/>
      ${mark()}</svg>`
  },
  {
    num: "43 — Wall print", word: "Not Broken",
    line: "Different wiring is not a fault report.",
    price: "£12.00", link: "#", bg: "#3B4E8C",
    // Only one of these two words is allowed to fall apart.
    svg: `<svg viewBox="0 0 300 300">${grain("a3", 0.11)}
      <text x="150" y="118" text-anchor="middle" font-family="Instrument Serif, serif" font-size="67" fill="${CREAM}">NOT</text>
      <g font-family="Instrument Serif, serif" font-size="53" fill="${CREAM}" opacity="0.45">
        <text x="22" y="192" transform="rotate(-9 22 192)">B</text>
        <text x="60" y="200" transform="rotate(7 60 200)">R</text>
        <text x="98" y="186" transform="rotate(-14 98 186)">O</text>
        <text x="140" y="204" transform="rotate(11 140 204)">K</text>
        <text x="180" y="188" transform="rotate(-6 180 188)">E</text>
        <text x="214" y="202" transform="rotate(15 214 202)">N</text>
      </g>
      <g stroke="${GOLD}" stroke-width="1.3" opacity="0.7" fill="none">
        <path d="M92,214 l14,16 -9,10"/><path d="M168,216 l-12,14 8,10"/>
      </g>
      <rect width="300" height="300" fill="url(#a3)"/>
      ${caption("DIFFERENT WIRING, NOT A FAULT", CREAM)}${mark()}</svg>`
  },
  {
    num: "44 — Notebook", word: "Functioning As Designed",
    line: "Checked against spec. No defects found.",
    price: "£12.00", link: "#", bg: "#4A6E33",
    // A technical spec sheet that comes back clean.
    svg: `<svg viewBox="0 0 300 300">${grain("a4", 0.11)}
      <g stroke="${CREAM}" stroke-width="1" opacity="0.5">
        <line x1="40" y1="104" x2="40" y2="86"/><line x1="260" y1="104" x2="260" y2="86"/>
        <line x1="40" y1="95" x2="260" y2="95"/>
        <path d="M40,95 l7,-4 M40,95 l7,4 M260,95 l-7,-4 M260,95 l-7,4" fill="none"/>
      </g>
      <rect x="40" y="112" width="220" height="86" fill="none" stroke="${CREAM}" stroke-width="1.6" opacity="0.75"/>
      <text x="150" y="150" text-anchor="middle" font-family="Space Mono, monospace" font-size="19" fill="${CREAM}">FUNCTIONING</text>
      <text x="150" y="182" text-anchor="middle" font-family="Space Mono, monospace" font-size="19" fill="${GOLD}">AS DESIGNED</text>
      <g font-family="Space Grotesk, sans-serif" font-size="8.5" fill="${CREAM}" opacity="0.65" letter-spacing="0.14em">
        <text x="40" y="224">UNIT: YOU</text>
        <text x="260" y="224" text-anchor="end">DEFECTS FOUND: 0</text>
        <text x="40" y="242">SPEC: ORIGINAL</text>
        <text x="260" y="242" text-anchor="end">STATUS: CORRECT</text>
      </g>
      <rect width="300" height="300" fill="url(#a4)"/>
      ${mark()}</svg>`
  },
  {
    num: "45 — Tee", word: "Enough",
    line: "No qualifier. No conditions. Just the word.",
    price: "£19.00", link: "#", bg: "#B8562C",
    // The word takes the whole frame. There is no room for a caveat.
    svg: `<svg viewBox="0 0 300 300">${grain("a5", 0.11)}
      <text x="150" y="180" text-anchor="middle" font-family="Anton, sans-serif" font-size="60" fill="${CREAM}">ENOUGH</text>
      <g font-family="Space Grotesk, sans-serif" font-size="10" fill="${CREAM}" opacity="0.3" letter-spacing="0.16em">
        <text x="150" y="60" text-anchor="middle">NO "IF" · NO "WHEN" · NO "ONCE YOU"</text>
      </g>
      <rect width="300" height="300" fill="url(#a5)"/>
      ${caption("THAT IS THE WHOLE SENTENCE", CREAM)}${mark()}</svg>`
  },
  {
    num: "46 — Tote", word: "It Was Precision",
    line: "They called it difficult. They were wrong.",
    price: "£16.00", link: "#", bg: "#1F5F6B",
    // The old word struck out, the accurate one underneath.
    svg: `<svg viewBox="0 0 300 300">${grain("a6", 0.11)}
      <text x="150" y="86" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="500" font-size="10" fill="${CREAM}" opacity="0.6" letter-spacing="0.18em">THEY WROTE</text>
      <text x="150" y="132" text-anchor="middle" font-family="Fraunces, serif" font-size="38" fill="${CREAM}" opacity="0.45">difficult</text>
      <line x1="66" y1="122" x2="234" y2="122" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
      <text x="150" y="184" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="500" font-size="10" fill="${GOLD}" letter-spacing="0.18em">IT WAS</text>
      <text x="150" y="232" text-anchor="middle" font-family="Fraunces, serif" font-size="46" fill="${CREAM}">PRECISION</text>
      <rect width="300" height="300" fill="url(#a6)"/>
      ${mark()}</svg>`
  },
  {
    num: "47 — Wall print", word: "You Were Paying Attention",
    line: "To all of it. That was never the failure.",
    price: "£12.00", link: "#", bg: "#6B4A8C",
    // Attention going everywhere at once — presented as the skill it is.
    svg: `<svg viewBox="0 0 300 300">${grain("a7", 0.11)}
      <g stroke="${CREAM}" stroke-width="0.9" opacity="0.4">
        <line x1="150" y1="150" x2="34" y2="46"/><line x1="150" y1="150" x2="150" y2="34"/>
        <line x1="150" y1="150" x2="266" y2="46"/><line x1="150" y1="150" x2="30" y2="150"/>
        <line x1="150" y1="150" x2="270" y2="150"/><line x1="150" y1="150" x2="40" y2="252"/>
        <line x1="150" y1="150" x2="150" y2="266"/><line x1="150" y1="150" x2="262" y2="252"/>
      </g>
      <g font-family="Space Grotesk, sans-serif" font-size="9" fill="${GOLD}" opacity="0.95">
        <text x="34" y="42" text-anchor="middle">the tone shift</text>
        <text x="150" y="30" text-anchor="middle">the hum</text>
        <text x="266" y="42" text-anchor="middle">the pause</text>
        <text x="26" y="153" text-anchor="start">the label</text>
        <text x="274" y="153" text-anchor="end">the flicker</text>
        <text x="40" y="264" text-anchor="middle">the smell</text>
        <text x="150" y="278" text-anchor="middle">the inconsistency</text>
        <text x="262" y="264" text-anchor="middle">the look</text>
      </g>
      <circle cx="150" cy="150" r="52" fill="#6B4A8C"/>
      <text x="150" y="144" text-anchor="middle" font-family="Syne, sans-serif" font-size="18" fill="${CREAM}">you were</text>
      <text x="150" y="168" text-anchor="middle" font-family="Syne, sans-serif" font-size="18" fill="${CREAM}">paying</text>
      <text x="150" y="192" text-anchor="middle" font-family="Syne, sans-serif" font-size="18" fill="${GOLD}">attention</text>
      <rect width="300" height="300" fill="url(#a7)"/>
      ${mark()}</svg>`
  },
  {
    num: "48 — Sticker", word: "You Made It This Far",
    line: "Every single hard day. Undefeated.",
    price: "£3.50", link: "#", bg: "#2E6B4F",
    // A long difficult route — and the gold marker sitting at the end of it.
    svg: `<svg viewBox="0 0 300 300">${grain("a8", 0.11)}
      <path d="M24,68 C70,68 60,102 106,102 C152,102 140,136 186,136 C232,136 220,170 266,170"
        fill="none" stroke="${CREAM}" stroke-width="2" stroke-dasharray="5 6" opacity="0.6"/>
      <g fill="${CREAM}" opacity="0.5">
        <circle cx="24" cy="68" r="3.5"/><circle cx="106" cy="102" r="3.5"/><circle cx="186" cy="136" r="3.5"/>
      </g>
      <circle cx="266" cy="170" r="8" fill="${GOLD}"/>
      <text x="266" y="152" text-anchor="end" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="9" fill="${GOLD}" letter-spacing="0.16em">HERE</text>
      <text x="150" y="228" text-anchor="middle" font-family="Fraunces, serif" font-size="32" fill="${CREAM}">you made it</text>
      <text x="150" y="262" text-anchor="middle" font-family="Fraunces, serif" font-size="32" fill="${CREAM}">this far</text>
      <rect width="300" height="300" fill="url(#a8)"/>
      ${mark()}</svg>`
  },
  {
    num: "49 — Sticker", word: "Loved As Standard",
    line: "Not an upgrade. Not conditional.",
    price: "£3.50", link: "#", bg: "#C2456E",
    // Every condition anyone ever attached, struck off.
    svg: `<svg viewBox="0 0 300 300">${grain("a9", 0.11)}
      <g font-family="Fraunces, serif" font-size="21" fill="${CREAM}" opacity="0.4">
        <text x="150" y="72" text-anchor="middle">loved, if you're easier</text>
        <text x="150" y="104" text-anchor="middle">loved, when you're calm</text>
        <text x="150" y="136" text-anchor="middle">loved, once you improve</text>
      </g>
      <g stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round">
        <line x1="52" y1="66" x2="248" y2="66"/>
        <line x1="46" y1="98" x2="254" y2="98"/>
        <line x1="44" y1="130" x2="256" y2="130"/>
      </g>
      <text x="150" y="204" text-anchor="middle" font-family="Fraunces, serif" font-size="42" fill="${CREAM}">LOVED</text>
      <text x="150" y="242" text-anchor="middle" font-family="Fraunces, serif" font-size="26" fill="${GOLD}">as standard</text>
      <rect width="300" height="300" fill="url(#a9)"/>
      ${mark()}</svg>`
  },
  {
    num: "50 — Mug", word: "The Right Amount of You",
    line: "Measured properly this time.",
    price: "£14.00", link: "#", bg: "#8C6A1F",
    // A scale where the needle lands exactly where it should.
    svg: `<svg viewBox="0 0 300 300">${grain("a10", 0.11)}
      <line x1="30" y1="150" x2="270" y2="150" stroke="${CREAM}" stroke-width="2" opacity="0.7"/>
      <g stroke="${CREAM}" stroke-width="1.4" opacity="0.45">
        <line x1="54" y1="140" x2="54" y2="160"/><line x1="102" y1="142" x2="102" y2="158"/>
        <line x1="198" y1="142" x2="198" y2="158"/><line x1="246" y1="140" x2="246" y2="160"/>
      </g>
      <g font-family="Space Grotesk, sans-serif" font-size="8.5" fill="${CREAM}" opacity="0.55" letter-spacing="0.14em">
        <text x="54" y="180" text-anchor="middle">TOO LITTLE</text>
        <text x="246" y="180" text-anchor="middle">TOO MUCH</text>
      </g>
      <line x1="150" y1="122" x2="150" y2="178" stroke="${GOLD}" stroke-width="3.5"/>
      <circle cx="150" cy="150" r="7" fill="${GOLD}"/>
      <text x="150" y="106" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="9" fill="${GOLD}" letter-spacing="0.18em">EXACTLY HERE</text>
      <text x="150" y="230" text-anchor="middle" font-family="Fraunces, serif" font-size="28" fill="${CREAM}">the right amount</text>
      <text x="150" y="262" text-anchor="middle" font-family="Fraunces, serif" font-size="28" fill="${CREAM}">of you</text>
      <rect width="300" height="300" fill="url(#a10)"/>
      ${mark()}</svg>`
  },
  {
    num: "51 — Tee", word: "In Writing, Please",
    line: "Said out loud, it's gone. Written down, it's mine.",
    price: "£19.00", link: "#", bg: "#25566B",
    // The same sentence twice: spoken falls apart, written holds.
    svg: `<svg viewBox="0 0 300 300">${grain("n1", 0.11)}
      <text x="26" y="78" font-family="Space Grotesk, sans-serif" font-size="8.5" fill="${CREAM}" opacity="0.55" letter-spacing="0.18em">SAID OUT LOUD</text>
      <g font-family="Fraunces, serif" font-size="21" fill="${CREAM}">
        <text x="26" y="112" opacity="0.75" transform="rotate(-4 26 112)">can</text>
        <text x="70" y="118" opacity="0.5" transform="rotate(6 70 118)">you</text>
        <text x="122" y="108" opacity="0.32" transform="rotate(-8 122 108)">just</text>
        <text x="170" y="120" opacity="0.18" transform="rotate(9 170 120)">quickly</text>
        <text x="240" y="110" opacity="0.08" transform="rotate(-5 240 110)">…</text>
      </g>
      <text x="26" y="164" font-family="Space Grotesk, sans-serif" font-size="8.5" fill="${GOLD}" letter-spacing="0.18em">PUT IN WRITING</text>
      <rect x="22" y="176" width="256" height="52" fill="none" stroke="${CREAM}" stroke-width="1.6"/>
      <text x="150" y="210" text-anchor="middle" font-family="Fraunces, serif" font-size="25" fill="${CREAM}">can you just quickly</text>
      <rect width="300" height="300" fill="url(#n1)"/>
      ${caption("IN WRITING, PLEASE", CREAM)}${mark()}</svg>`
  },
  {
    num: "52 — Wall print", word: "I Accommodated You First",
    line: "Every day, all day, unremarked.",
    price: "£12.00", link: "#", bg: "#8C4A2F",
    // A ledger nobody has ever bothered to total up.
    svg: `<svg viewBox="0 0 300 300">${grain("n2", 0.11)}
      <g font-family="Space Grotesk, sans-serif" font-size="8" fill="${CREAM}" opacity="0.75" letter-spacing="0.14em">
        <text x="76" y="84" text-anchor="middle">THEY ADJUSTED</text>
        <text x="216" y="84" text-anchor="middle">I ADJUSTED</text>
      </g>
      <line x1="150" y1="92" x2="150" y2="222" stroke="${CREAM}" stroke-width="1.2" opacity="0.45"/>
      <g stroke="${CREAM}" stroke-width="2.2" stroke-linecap="round" opacity="0.85">
        <line x1="62" y1="104" x2="62" y2="124"/><line x1="72" y1="104" x2="72" y2="124"/>
      </g>
      <g stroke="${GOLD}" stroke-width="2.2" stroke-linecap="round">
        ${[0,1,2,3,4,5].map(r => [0,1,2,3,4,5,6,7,8].map(c =>
          `<line x1="${166+c*13}" y1="${104+r*21}" x2="${166+c*13}" y2="${124+r*21}"/>`).join('')).join('')}
      </g>
      <text x="150" y="252" text-anchor="middle" font-family="Fraunces, serif" font-size="22" fill="${CREAM}">I accommodated you first</text>
      <text x="150" y="274" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-size="8" fill="${CREAM}" opacity="0.6" letter-spacing="0.14em">NOBODY EVER MENTIONS THIS COLUMN</text>
      <rect width="300" height="300" fill="url(#n2)"/>
      ${mark()}</svg>`
  },
  {
    num: "53 — Sticker", word: "Believe Me The First Time",
    line: "I shouldn't have to say it four ways.",
    price: "£3.50", link: "#", bg: "#7A2E4E",
    // The same sentence, over and over, until finally one lands.
    svg: `<svg viewBox="0 0 300 300">${grain("n3", 0.11)}
      <g font-family="Instrument Serif, serif" font-size="20" fill="${CREAM}" opacity="0.3">
        <text x="24" y="58">this is hard for me</text>
        <text x="24" y="86">this is hard for me</text>
        <text x="24" y="114">this is hard for me</text>
        <text x="24" y="142">this is hard for me</text>
        <text x="24" y="170">this is hard for me</text>
        <text x="24" y="198">this is hard for me</text>
      </g>
      <text x="24" y="226" font-family="Instrument Serif, serif" font-size="20" fill="${GOLD}">this is hard for me</text>
      <text x="276" y="226" text-anchor="end" font-family="Space Grotesk, sans-serif"
        font-weight="700" font-size="9" fill="${GOLD}" letter-spacing="0.14em">— oh, ok</text>
      <text x="150" y="266" text-anchor="middle" font-family="Instrument Serif, serif" font-size="28" fill="${CREAM}">believe me the first time</text>
      <rect width="300" height="300" fill="url(#n3)"/>
      ${mark()}</svg>`
  },
  {
    num: "54 — Notebook", word: "Asking Is Not Failing",
    line: "Support isn't a probation period you graduate from.",
    price: "£12.00", link: "#", bg: "#345E45",
    // A false equation, corrected.
    svg: `<svg viewBox="0 0 300 300">${grain("n4", 0.11)}
      <text x="150" y="112" text-anchor="middle" font-family="Fraunces, serif" font-size="27" fill="${CREAM}" opacity="0.5">asking for help</text>
      <text x="150" y="152" text-anchor="middle" font-family="Fraunces, serif" font-size="27" fill="${CREAM}" opacity="0.5">= failing</text>
      <g stroke="${GOLD}" stroke-width="3" stroke-linecap="round">
        <line x1="60" y1="104" x2="240" y2="104"/>
        <line x1="86" y1="144" x2="214" y2="144"/>
      </g>
      <text x="150" y="208" text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="${CREAM}">asking for help</text>
      <text x="150" y="246" text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="${GOLD}">= asking</text>
      <rect width="300" height="300" fill="url(#n4)"/>
      ${mark()}</svg>`
  },
  {
    num: "55 — Sticker", word: "You Noticed Without Me Asking",
    line: "The rarest kindness there is.",
    price: "£3.50", link: "#", bg: "#3E6E8C",
    // The moment someone clocks it before you've said a word.
    svg: `<svg viewBox="0 0 300 300">${grain("n5", 0.11)}
      <g font-family="Instrument Serif, serif" font-size="17" fill="${CREAM}" opacity="0.28">
        <text x="20" y="60">I didn't say anything</text>
        <text x="20" y="88">I didn't say anything</text>
        <text x="20" y="116">I didn't say anything</text>
        <text x="20" y="144">I didn't say anything</text>
      </g>
      <line x1="20" y1="164" x2="280" y2="164" stroke="${GOLD}" stroke-width="1.4" opacity="0.8"/>
      <text x="150" y="204" text-anchor="middle" font-family="Instrument Serif, serif" font-size="35" fill="${CREAM}">and you still</text>
      <text x="150" y="242" text-anchor="middle" font-family="Instrument Serif, serif" font-size="35" fill="${GOLD}">noticed</text>
      <rect width="300" height="300" fill="url(#n5)"/>
      ${caption("THE RAREST KINDNESS", CREAM)}${mark()}</svg>`
  },
  {
    num: "56 — Tote", word: "Yes, I Want Friends",
    line: "Wanting them was never the difficult part.",
    price: "£16.00", link: "#", bg: "#B03F55",
    // The stereotype, struck out; the truth, plain.
    svg: `<svg viewBox="0 0 300 300">${grain("n6", 0.11)}
      <text x="150" y="76" text-anchor="middle" font-family="Space Grotesk, sans-serif"
        font-size="9" fill="${CREAM}" opacity="0.55" letter-spacing="0.16em">THEY ASSUMED</text>
      <text x="150" y="116" text-anchor="middle" font-family="Anton, sans-serif" font-size="27" fill="${CREAM}" opacity="0.45">"not interested in people"</text>
      <line x1="34" y1="108" x2="266" y2="108" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>
      <text x="150" y="182" text-anchor="middle" font-family="Anton, sans-serif" font-size="45" fill="${CREAM}">YES, I WANT</text>
      <text x="150" y="224" text-anchor="middle" font-family="Anton, sans-serif" font-size="45" fill="${GOLD}">FRIENDS</text>
      <text x="150" y="256" text-anchor="middle" font-family="Anton, sans-serif" font-size="19" fill="${CREAM}" opacity="0.8" font-style="italic">that was never the hard part</text>
      <rect width="300" height="300" fill="url(#n6)"/>
      ${mark()}</svg>`
  },
  {
    num: "57 — Hoodie", word: "Trust Me With It",
    line: "Give me the work. Then leave me alone.",
    price: "£36.99", link: "#", bg: "#2C4A6E",
    // The ask is simple and rarely granted.
    svg: `<svg viewBox="0 0 300 300">${grain("n7", 0.11)}
      <g font-family="Space Grotesk, sans-serif" font-size="10" fill="${CREAM}" opacity="0.45" letter-spacing="0.12em">
        <text x="26" y="66">CHECKING IN AGAIN</text>
        <text x="26" y="92">JUST TO CONFIRM</text>
        <text x="26" y="118">QUICK CATCH-UP?</text>
        <text x="26" y="144">HOW'S IT GOING?</text>
      </g>
      <g stroke="${GOLD}" stroke-width="2" stroke-linecap="round" opacity="0.9">
        <line x1="22" y1="62" x2="196" y2="62"/><line x1="22" y1="88" x2="180" y2="88"/>
        <line x1="22" y1="114" x2="172" y2="114"/><line x1="22" y1="140" x2="176" y2="140"/>
      </g>
      <text x="150" y="200" text-anchor="middle" font-family="Anton, sans-serif" font-size="45" fill="${CREAM}">TRUST ME</text>
      <text x="150" y="240" text-anchor="middle" font-family="Anton, sans-serif" font-size="45" fill="${GOLD}">WITH IT</text>
      <rect width="300" height="300" fill="url(#n7)"/>
      ${caption("IT WILL BE DONE. PROPERLY.", CREAM)}${mark()}</svg>`
  },
  {
    num: "58 — Mug", word: "Shared Interest, Not Small Talk",
    line: "Sit next to me and care about the same thing.",
    price: "£14.00", link: "#", bg: "#5E7A2E",
    // Two ways to connect; only one of them survives.
    svg: `<svg viewBox="0 0 300 300">${grain("n8", 0.11)}
      <g font-family="Caveat, cursive" font-size="24" fill="${CREAM}">
        <text x="24" y="70" opacity="0.5">"how was your weekend"</text>
        <text x="24" y="100" opacity="0.3">"bit cold isn't it"</text>
        <text x="24" y="130" opacity="0.15">"busy week?"</text>
        <text x="24" y="158" opacity="0.07">"any plans?"</text>
      </g>
      <line x1="20" y1="176" x2="280" y2="176" stroke="${CREAM}" stroke-width="1" opacity="0.4"/>
      <text x="24" y="212" font-family="Caveat, cursive" font-size="29" fill="${GOLD}">"so about that thing</text>
      <text x="24" y="242" font-family="Caveat, cursive" font-size="29" fill="${GOLD}">you love —"</text>
      <rect width="300" height="300" fill="url(#n8)"/>
      ${caption("THAT'S HOW YOU REACH ME", CREAM)}${mark()}</svg>`
  },
  {
    num: "59 — Sticker", word: "Tell Me Before You Change It",
    line: "I'd already built the whole day around the old plan.",
    price: "£3.50", link: "#", bg: "#6B4A8C",
    // The plan, carefully assembled — then rearranged without warning.
    svg: `<svg viewBox="0 0 300 300">${grain("n9", 0.11)}
      <g font-family="Caveat, cursive" font-size="35" fill="${CREAM}" opacity="0.85">
        <text x="30" y="92">T</text><text x="58" y="92">H</text><text x="90" y="92">E</text>
        <text x="126" y="92">P</text><text x="154" y="92">L</text><text x="178" y="92">A</text><text x="208" y="92">N</text>
      </g>
      <g font-family="Caveat, cursive" font-size="35" fill="${CREAM}" opacity="0.45">
        <text x="34" y="152" transform="rotate(-14 34 152)">N</text>
        <text x="76" y="164" transform="rotate(11 76 164)">A</text>
        <text x="118" y="146" transform="rotate(-8 118 146)">L</text>
        <text x="152" y="166" transform="rotate(17 152 166)">P</text>
        <text x="192" y="148" transform="rotate(-12 192 148)">E</text>
        <text x="224" y="162" transform="rotate(9 224 162)">H</text>
        <text x="252" y="146" transform="rotate(-6 252 146)">T</text>
      </g>
      <text x="150" y="220" text-anchor="middle" font-family="Caveat, cursive" font-size="31" fill="${GOLD}">tell me before</text>
      <text x="150" y="250" text-anchor="middle" font-family="Caveat, cursive" font-size="31" fill="${GOLD}">you change it</text>
      <rect width="300" height="300" fill="url(#n9)"/>
      ${mark()}</svg>`
  },
  {
    num: "60 — Wall print", word: "Recovery Is Part Of The Plan",
    line: "Not the gap between plans. Part of them.",
    price: "£12.00", link: "#", bg: "#2E6659",
    // The recovery block, booked in as firmly as everything else.
    svg: `<svg viewBox="0 0 300 300">${grain("n10", 0.11)}
      <g stroke="${CREAM}" stroke-width="0.9" opacity="0.3">
        <line x1="26" y1="70" x2="274" y2="70"/><line x1="26" y1="100" x2="274" y2="100"/>
        <line x1="26" y1="130" x2="274" y2="130"/><line x1="26" y1="190" x2="274" y2="190"/>
        <line x1="26" y1="220" x2="274" y2="220"/>
      </g>
      <g font-family="Space Grotesk, sans-serif" font-size="9" fill="${CREAM}" opacity="0.6" letter-spacing="0.1em">
        <text x="30" y="64">THE EVENT</text>
        <text x="30" y="94">THE OTHER EVENT</text>
        <text x="30" y="124">THE THING AFTER</text>
        <text x="30" y="214">TOMORROW</text>
      </g>
      <rect x="26" y="138" width="248" height="44" fill="${GOLD}"/>
      <text x="150" y="166" text-anchor="middle" font-family="Fraunces, serif" font-size="24" fill="${INK}">recovery</text>
      <text x="150" y="262" text-anchor="middle" font-family="Fraunces, serif" font-size="21" fill="${CREAM}">booked in, not squeezed in</text>
      <rect width="300" height="300" fill="url(#n10)"/>
      ${mark()}</svg>`
  },
  {
    num: "61 — Wall print", word: "Nobody Asked How You Were",
    line: "Every appointment was about them. Fair enough. And still.",
    price: "£12.00", link: "#", bg: "#3F5C6B",
    // Every question in the room went somewhere else.
    svg: `<svg viewBox="0 0 300 300">${grain("c1", 0.11)}
      <g font-family="Space Mono, monospace" font-size="9" fill="${CREAM}" opacity="0.4" letter-spacing="0.08em">
        <text x="24" y="56">HOW IS HE SLEEPING?</text>
        <text x="24" y="80">HOW IS SHE EATING?</text>
        <text x="24" y="104">HOW ARE THEY AT SCHOOL?</text>
        <text x="24" y="128">HOW ARE THEY COPING?</text>
        <text x="24" y="152">HOW IS HE GETTING ON?</text>
        <text x="24" y="176">AND HOW ARE THEY?</text>
      </g>
      <line x1="20" y1="196" x2="280" y2="196" stroke="${GOLD}" stroke-width="1.6"/>
      <text x="150" y="240" text-anchor="middle" font-family="Instrument Serif, serif" font-size="42" fill="${CREAM}">But how are</text>
      <text x="150" y="278" text-anchor="middle" font-family="Instrument Serif, serif" font-size="42" fill="${GOLD}">you?</text>
      <rect width="300" height="300" fill="url(#c1)"/>${mark()}</svg>`
  },
  {
    num: "62 — Mug", word: "Twenty Minutes Counts",
    line: "It doesn't have to be a fortnight in Crete.",
    price: "£14.00", link: "#", bg: "#4A7A5E",
    // Respite, at the only scale that's actually available.
    svg: `<svg viewBox="0 0 300 300">${grain("c2", 0.11)}
      <circle cx="150" cy="128" r="72" fill="none" stroke="${CREAM}" stroke-width="2.5" opacity="0.6"/>
      <path d="M150,128 L150,56 A72,72 0 0 1 218,152 Z" fill="${GOLD}" opacity="0.9"/>
      <circle cx="150" cy="128" r="6" fill="${CREAM}"/>
      <text x="150" y="228" text-anchor="middle" font-family="Anton, sans-serif" font-size="38" fill="${CREAM}">TWENTY MINUTES</text>
      <text x="150" y="262" text-anchor="middle" font-family="Caveat, cursive" font-size="30" fill="${GOLD}">still counts as a break</text>
      <rect width="300" height="300" fill="url(#c2)"/>${mark()}</svg>`
  },
  {
    num: "63 — Tee", word: "Guilt Is Not Evidence",
    line: "Feeling like you failed is not the same as failing.",
    price: "£19.00", link: "#", bg: "#7A3A5E",
    // Feeling it proves nothing. The word gets struck from the record.
    svg: `<svg viewBox="0 0 300 300">${grain("c3", 0.11)}
      <text x="150" y="118" text-anchor="middle" font-family="Instrument Serif, serif" font-size="60" fill="${CREAM}" opacity="0.5">guilt</text>
      <line x1="72" y1="104" x2="228" y2="104" stroke="${GOLD}" stroke-width="3.4" stroke-linecap="round"/>
      <text x="150" y="176" text-anchor="middle" font-family="Space Mono, monospace" font-size="10" fill="${CREAM}" opacity="0.7" letter-spacing="0.18em">IS NOT EVIDENCE OF</text>
      <text x="150" y="230" text-anchor="middle" font-family="Anton, sans-serif" font-size="52" fill="${CREAM}">ANYTHING</text>
      <rect width="300" height="300" fill="url(#c3)"/>
      ${caption("YOU ARE DOING THE THING", CREAM)}${mark()}</svg>`
  },
  {
    num: "64 — Tote", word: "I Learned Their Language",
    line: "Fluent in one person. No qualification for it.",
    price: "£16.00", link: "#", bg: "#2E5F5A",
    // The dictionary only you have.
    svg: `<svg viewBox="0 0 300 300">${grain("c4", 0.11)}
      <g font-family="Space Mono, monospace" font-size="9.5" fill="${CREAM}" opacity="0.75">
        <text x="24" y="66">the hum</text><text x="276" y="66" text-anchor="end">= nearly full</text>
        <text x="24" y="94">gone quiet</text><text x="276" y="94" text-anchor="end">= go slow</text>
        <text x="24" y="122">one word answers</text><text x="276" y="122" text-anchor="end">= almost done</text>
        <text x="24" y="150">the good flapping</text><text x="276" y="150" text-anchor="end">= happy</text>
        <text x="24" y="178">tugging the sleeve</text><text x="276" y="178" text-anchor="end">= leave now</text>
      </g>
      <g stroke="${CREAM}" stroke-width="0.7" opacity="0.25">
        <line x1="20" y1="74" x2="280" y2="74"/><line x1="20" y1="102" x2="280" y2="102"/>
        <line x1="20" y1="130" x2="280" y2="130"/><line x1="20" y1="158" x2="280" y2="158"/>
      </g>
      <text x="150" y="234" text-anchor="middle" font-family="Instrument Serif, serif" font-size="36" fill="${GOLD}">I learned their language</text>
      <text x="150" y="264" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${CREAM}" opacity="0.6" letter-spacing="0.14em">NOBODY GAVE ME A DICTIONARY</text>
      <rect width="300" height="300" fill="url(#c4)"/>${mark()}</svg>`
  },
  {
    num: "65 — Wall print", word: "A Different Route",
    line: "Not behind. Not late. Elsewhere, on purpose.",
    price: "£12.00", link: "#", bg: "#5E4A8C",
    // Two ways to the same place; only one of them is on the map.
    svg: `<svg viewBox="0 0 300 300">${grain("c5", 0.11)}
      <line x1="34" y1="104" x2="266" y2="104" stroke="${CREAM}" stroke-width="2" opacity="0.35" stroke-dasharray="6 6"/>
      <g font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.45" letter-spacing="0.12em">
        <text x="34" y="92">THE EXPECTED ROUTE</text>
      </g>
      <path d="M34,168 C86,120 92,214 148,166 C198,124 208,216 266,168"
        fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="266" cy="104" r="5" fill="${CREAM}" opacity="0.5"/>
      <circle cx="266" cy="168" r="7" fill="${GOLD}"/>
      <text x="150" y="234" text-anchor="middle" font-family="Anton, sans-serif" font-size="42" fill="${CREAM}">NOT BEHIND</text>
      <text x="150" y="268" text-anchor="middle" font-family="Instrument Serif, serif" font-size="28" fill="${GOLD}">a different route entirely</text>
      <rect width="300" height="300" fill="url(#c5)"/>${mark()}</svg>`
  },
  {
    num: "66 — Sticker", word: "I See You Too",
    line: "For the sibling who got very good at not needing things.",
    price: "£3.50", link: "#", bg: "#8C5A2E",
    // The one who learned to take up less room.
    svg: `<svg viewBox="0 0 300 300">${grain("c6", 0.11)}
      <g font-family="Instrument Serif, serif" fill="${CREAM}">
        <text x="150" y="112" text-anchor="middle" font-size="54" opacity="0.9">them</text>
        <text x="150" y="160" text-anchor="middle" font-size="16" opacity="0.35">you</text>
      </g>
      <g stroke="${GOLD}" stroke-width="1.8" fill="none" opacity="0.9">
        <circle cx="150" cy="153" r="22"/>
        <line x1="166" y1="169" x2="180" y2="183" stroke-linecap="round"/>
      </g>
      <text x="150" y="234" text-anchor="middle" font-family="Instrument Serif, serif" font-size="40" fill="${GOLD}">I see you too</text>
      <rect width="300" height="300" fill="url(#c6)"/>
      ${caption("YOU WERE NEVER THE EASY ONE", CREAM)}${mark()}</svg>`
  },
  {
    num: "67 — Notebook", word: "You're Allowed To Find It Hard",
    line: "Loving them and struggling are not opposites.",
    price: "£12.00", link: "#", bg: "#B5432F",
    // Two things held at once, with nothing crossed out.
    svg: `<svg viewBox="0 0 300 300">${grain("c7", 0.11)}
      <text x="150" y="104" text-anchor="middle" font-family="Instrument Serif, serif" font-size="40" fill="${CREAM}">I love them</text>
      <text x="150" y="152" text-anchor="middle" font-family="Space Mono, monospace" font-size="13" fill="${GOLD}" letter-spacing="0.24em">AND</text>
      <text x="150" y="204" text-anchor="middle" font-family="Instrument Serif, serif" font-size="40" fill="${CREAM}">it is hard</text>
      <g stroke="${CREAM}" stroke-width="1" opacity="0.35">
        <line x1="60" y1="122" x2="240" y2="122"/><line x1="60" y1="170" x2="240" y2="170"/>
      </g>
      <text x="150" y="252" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${CREAM}" opacity="0.7" letter-spacing="0.14em">BOTH TRUE. NEITHER CANCELS THE OTHER.</text>
      <rect width="300" height="300" fill="url(#c7)"/>${mark()}</svg>`
  },
  {
    num: "68 — Sticker", word: "Their Person",
    line: "The one they look for first in a crowded room.",
    price: "£3.50", link: "#", bg: "#255E75",
    // Out of everyone in the room, you.
    svg: `<svg viewBox="0 0 300 300">${grain("c8", 0.11)}
      <g fill="${CREAM}" opacity="0.28">
        ${[0,1,2,3,4,5].map(r => [0,1,2,3,4,5,6].map(c =>
          `<circle cx="${34+c*39}" cy="${58+r*30}" r="7"/>`).join('')).join('')}
      </g>
      <circle cx="151" cy="148" r="12" fill="${GOLD}"/>
      <circle cx="151" cy="148" r="21" fill="none" stroke="${GOLD}" stroke-width="1.6" opacity="0.7"/>
      <text x="150" y="266" text-anchor="middle" font-family="Instrument Serif, serif" font-size="44" fill="${CREAM}">their person</text>
      <rect width="300" height="300" fill="url(#c8)"/>${mark()}</svg>`
  },
];

function renderProducts(){
  const grid = document.getElementById('product-grid');
  if(!grid) return;
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="card">
      <div class="stage" style="background:${p.bg}">${p.svg}</div>
      <div class="card-meta">
        <p class="card-num">${p.num}</p>
        <h3>${p.word}</h3>
        <p class="card-line">${p.line}</p>
        <p class="card-price">${p.price}</p>
        <button class="btn btn-primary" data-checkout-num="${p.num}" data-checkout-word="${p.word}" data-checkout-kind="physical">Get this piece</button>
      </div>
    </article>
  `).join('');
}

// ===== Digital products =====
// Instant downloads — no Printify, no shipping. `link` becomes a Payhip or
// Gumroad product link once set up (see README Part 3b). These are calmer
// than the physical line on purpose: a meltdown plan should be legible and
// low-stimulation, not a joke.
const DIGITAL_PRODUCTS = [
  {
    num: "D18 — Printable PDF", word: "When Words Go",
    line: "For the moment speech goes and you're stood in a shop. Twenty-two point-and-show cards — the toilet, help finding something, somewhere quieter, please don't touch me — sized to fit a standard lanyard card holder, plus blanks and a contact card.",
    price: "£4.50", link: "#", bg: "#1A1A1A",
    // A card being held out, because the words aren't available.
    svg: `<svg viewBox="0 0 300 300">${grain("d18", 0.09)}
      <g>
        <rect x="34" y="70" width="196" height="118" rx="5" fill="${CREAM}" opacity="0.2" transform="rotate(-6 132 129)"/>
        <rect x="44" y="82" width="196" height="118" rx="5" fill="${CREAM}" opacity="0.4" transform="rotate(-2.5 142 141)"/>
        <rect x="52" y="94" width="196" height="118" rx="5" fill="${CREAM}"/>
      </g>
      <text x="70" y="132" font-family="Fraunces, serif" font-size="20" fill="${INK}">I can't speak</text>
      <text x="70" y="158" font-family="Fraunces, serif" font-size="20" fill="${INK}">right now.</text>
      <text x="70" y="182" font-family="DM Sans, sans-serif" font-size="10" fill="#6B6355">I can hear and understand you.</text>
      <text x="150" y="252" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">WHEN WORDS GO</text>
      <text x="150" y="276" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${GOLD}" letter-spacing="0.14em">FOR WHEN THE WORDS HAVE GONE</text>
      <rect width="300" height="300" fill="url(#d18)"/>${mark()}</svg>`
  },
  {
    num: "D1 — Printable PDF", word: "Low Spoons Day Planner",
    line: "No hourly grid, no streaks, no scoring. One main task, rough time-of-day blocks, and explicit permission to leave boxes blank.",
    price: "£4.00", link: "#", bg: "#E0A81C",
    // A day with almost nothing in it, and that being fine.
    svg: `<svg viewBox="0 0 300 300">${grain("d1", 0.11)}
      <g stroke="${INK}" stroke-width="0.9" opacity="0.3">
        <line x1="26" y1="74" x2="274" y2="74"/><line x1="26" y1="100" x2="274" y2="100"/>
        <line x1="26" y1="126" x2="274" y2="126"/><line x1="26" y1="178" x2="274" y2="178"/>
        <line x1="26" y1="204" x2="274" y2="204"/><line x1="26" y1="230" x2="274" y2="230"/>
      </g>
      <rect x="26" y="138" width="150" height="30" fill="${INK}"/>
      <text x="36" y="159" font-family="Space Mono, monospace" font-weight="700" font-size="11" fill="${GOLD}" letter-spacing="0.1em">THE ONE THING</text>
      <text x="150" y="264" text-anchor="middle" font-family="Anton, sans-serif" font-size="35" fill="${INK}">LOW SPOONS</text>
      <text x="150" y="52" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${INK}" opacity="0.6" letter-spacing="0.18em">BLANK IS A VALID ANSWER</text>
      <rect width="300" height="300" fill="url(#d1)"/>${mark()}</svg>`
  },
  {
    num: "D2 — Printable PDF", word: "My Pond Plan",
    line: "A shutdown/meltdown support plan, filled in on a calm day: early signs, what helps, and a page you can hand to someone who wants to help.",
    price: "£4.00", link: "#", bg: "#2E5F73",
    // Ripples going out from a still centre.
    svg: `<svg viewBox="0 0 300 300">${grain("d2", 0.11)}
      <g fill="none" stroke="${CREAM}" stroke-width="1.4" opacity="0.45">
        <ellipse cx="150" cy="132" rx="120" ry="34"/><ellipse cx="150" cy="132" rx="92" ry="26"/>
        <ellipse cx="150" cy="132" rx="64" ry="18"/><ellipse cx="150" cy="132" rx="36" ry="10"/>
      </g>
      <circle cx="150" cy="132" r="7" fill="${GOLD}"/>
      <text x="150" y="212" text-anchor="middle" font-family="Instrument Serif, serif" font-size="46" fill="${CREAM}">My Pond Plan</text>
      <text x="150" y="244" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${GOLD}" letter-spacing="0.16em">WRITTEN ON A CALM DAY</text>
      <rect width="300" height="300" fill="url(#d2)"/>${mark()}</svg>`
  },
  {
    num: "D3 — Printable PDF", word: "Say It — Communication Scripts",
    line: "Twelve hard conversations, two tones each — cancelling plans, asking for accommodation, correcting a misread tone, disclosing if you choose to.",
    price: "£4.50", link: "#", bg: "#B5432F",
    // The words are already written for you.
    svg: `<svg viewBox="0 0 300 300">${grain("d3", 0.11)}
      <text x="20" y="112" font-family="Abril Fatface, serif" font-size="120" fill="${CREAM}" opacity="0.28">"</text>
      <g font-family="Fraunces, serif" font-size="17" fill="${CREAM}">
        <text x="70" y="86" opacity="0.75">I need to cancel today.</text>
        <text x="70" y="114" opacity="0.6">Can you say that slower?</text>
        <text x="70" y="142" opacity="0.45">I need some quiet.</text>
        <text x="70" y="170" opacity="0.3">That doesn't work for me.</text>
      </g>
      <text x="150" y="234" text-anchor="middle" font-family="Anton, sans-serif" font-size="56" fill="${CREAM}">SAY IT</text>
      <text x="150" y="262" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${GOLD}" letter-spacing="0.16em">TWELVE HARD CONVERSATIONS</text>
      <rect width="300" height="300" fill="url(#d3)"/>${mark()}</svg>`
  },
  {
    num: "D4 — Spreadsheet", word: "Weekly Spoon Tracker",
    line: "A week of energy check-ins with what drained you and what helped, plus an automatic at-a-glance summary. No streaks to keep up.",
    price: "£3.50", link: "#", bg: "#4A7A4E",
    // Seven days, none of them the same, and no streak to break.
    svg: `<svg viewBox="0 0 300 300">${grain("d4", 0.11)}
      <g>
        <rect x="30" y="140" width="24" height="50" fill="${CREAM}" opacity="0.85"/>
        <rect x="64" y="106" width="24" height="84" fill="${CREAM}" opacity="0.85"/>
        <rect x="98" y="164" width="24" height="26" fill="${GOLD}"/>
        <rect x="132" y="128" width="24" height="62" fill="${CREAM}" opacity="0.85"/>
        <rect x="166" y="80" width="24" height="110" fill="${CREAM}" opacity="0.85"/>
        <rect x="200" y="156" width="24" height="34" fill="${GOLD}"/>
        <rect x="234" y="118" width="24" height="72" fill="${CREAM}" opacity="0.85"/>
      </g>
      <line x1="26" y1="190" x2="274" y2="190" stroke="${CREAM}" stroke-width="1.6"/>
      <g font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.6" text-anchor="middle">
        <text x="42" y="206">M</text><text x="76" y="206">T</text><text x="110" y="206">W</text>
        <text x="144" y="206">T</text><text x="178" y="206">F</text><text x="212" y="206">S</text><text x="246" y="206">S</text>
      </g>
      <text x="150" y="248" text-anchor="middle" font-family="Anton, sans-serif" font-size="33" fill="${CREAM}">SPOON TRACKER</text>
      <text x="150" y="272" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${GOLD}" letter-spacing="0.16em">NO STREAKS TO KEEP UP</text>
      <rect width="300" height="300" fill="url(#d4)"/>${mark()}</svg>`
  },
  {
    num: "D5 — Printable PDF", word: "Unmasking Recovery",
    line: "A wind-down for after the performance ends: what the day cost, what you held back, and one small place you could mask less next time.",
    price: "£3.50", link: "#", bg: "#5B3A72",
    // The performed version lifting away from the real one.
    svg: `<svg viewBox="0 0 300 300">${grain("d5", 0.11)}
      <text x="150" y="106" text-anchor="middle" font-family="Instrument Serif, serif" font-size="52" fill="${CREAM}" opacity="0.22" transform="rotate(-3 150 106)">the version</text>
      <text x="150" y="146" text-anchor="middle" font-family="Instrument Serif, serif" font-size="52" fill="${CREAM}" opacity="0.4" transform="rotate(-1.5 150 146)">of me</text>
      <text x="150" y="192" text-anchor="middle" font-family="Instrument Serif, serif" font-size="52" fill="${CREAM}">they got</text>
      <line x1="40" y1="212" x2="260" y2="212" stroke="${GOLD}" stroke-width="1.6"/>
      <text x="150" y="248" text-anchor="middle" font-family="Anton, sans-serif" font-size="30" fill="${GOLD}">UNMASKING RECOVERY</text>
      <rect width="300" height="300" fill="url(#d5)"/>${mark()}</svg>`
  },
  {
    num: "D6 — Printable PDF", word: "My Sensory Profile",
    line: "Map yourself across eight senses on an avoid-to-seek scale, then note your hard no's and what actually regulates you. A maintenance manual, not a diagnosis.",
    price: "£4.00", link: "#", bg: "#1F6B75",
    // Eight scales, all landing differently — which is the point.
    svg: `<svg viewBox="0 0 300 300">${grain("d6", 0.11)}
      <g>
        ${[[60,3],[82,1],[104,4],[126,2],[148,5],[170,1],[192,3],[214,4]].map(([y,pos]) =>
          `<line x1="52" y1="${y}" x2="248" y2="${y}" stroke="${CREAM}" stroke-width="1" opacity="0.35"/>
           <circle cx="${52+(pos-1)*49}" cy="${y}" r="6" fill="${GOLD}"/>`).join('')}
      </g>
      <g font-family="Space Mono, monospace" font-size="7.5" fill="${CREAM}" opacity="0.55" letter-spacing="0.12em">
        <text x="52" y="46">AVOID</text><text x="248" y="46" text-anchor="end">SEEK</text>
      </g>
      <text x="150" y="256" text-anchor="middle" font-family="Anton, sans-serif" font-size="32" fill="${CREAM}">SENSORY PROFILE</text>
      <text x="150" y="278" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${GOLD}" letter-spacing="0.14em">A MAINTENANCE MANUAL</text>
      <rect width="300" height="300" fill="url(#d6)"/>${mark()}</svg>`
  },
  {
    num: "D7 — Printable PDF", word: "Appointment Prep",
    line: "Get the words ready before you need them — the one thing you need from the appointment, your questions, and a tick-list of what helps you in the room.",
    price: "£4.00", link: "#", bg: "#8C5A1C",
    // The words, prepared in advance, so they're there when you need them.
    svg: `<svg viewBox="0 0 300 300">${grain("d7", 0.11)}
      <rect x="46" y="46" width="208" height="164" fill="${CREAM}" opacity="0.12" stroke="${CREAM}" stroke-width="1.4"/>
      <g stroke="${CREAM}" stroke-width="1" opacity="0.5">
        <line x1="66" y1="86" x2="234" y2="86"/><line x1="66" y1="112" x2="200" y2="112"/>
        <line x1="66" y1="138" x2="234" y2="138"/><line x1="66" y1="164" x2="188" y2="164"/>
      </g>
      <rect x="66" y="60" width="94" height="14" fill="${GOLD}"/>
      <text x="150" y="248" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">APPOINTMENT PREP</text>
      <text x="150" y="272" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${GOLD}" letter-spacing="0.14em">THE WORDS, READY IN ADVANCE</text>
      <rect width="300" height="300" fill="url(#d7)"/>${mark()}</svg>`
  },
  {
    num: "D8 — Printable PDF", word: "Permission Cards",
    line: "Twelve cut-out cards for wallet, mirror or desk. “Rest is not something you earn first.” “Cancelling is kinder than resenting it.”",
    price: "£3.00", link: "#", bg: "#C4456B",
    // Cards waiting to be cut out.
    svg: `<svg viewBox="0 0 300 300">${grain("d8", 0.11)}
      <g fill="${CREAM}" opacity="0.14" stroke="${CREAM}" stroke-width="1.3" stroke-dasharray="5 4">
        <rect x="30" y="52" width="112" height="66"/><rect x="158" y="52" width="112" height="66"/>
        <rect x="30" y="132" width="112" height="66"/><rect x="158" y="132" width="112" height="66"/>
      </g>
      <text x="42" y="86" font-family="Fraunces, serif" font-size="13" fill="${CREAM}">you are allowed</text>
      <text x="42" y="104" font-family="Fraunces, serif" font-size="13" fill="${CREAM}">to leave early</text>
      <text x="170" y="86" font-family="Fraunces, serif" font-size="13" fill="${CREAM}" opacity="0.7">rest is not</text>
      <text x="170" y="104" font-family="Fraunces, serif" font-size="13" fill="${CREAM}" opacity="0.7">something you earn</text>
      <text x="42" y="166" font-family="Fraunces, serif" font-size="13" fill="${CREAM}" opacity="0.5">no explanation</text>
      <text x="42" y="184" font-family="Fraunces, serif" font-size="13" fill="${CREAM}" opacity="0.5">required</text>
      <text x="170" y="166" font-family="Fraunces, serif" font-size="13" fill="${CREAM}" opacity="0.35">cancelling is</text>
      <text x="170" y="184" font-family="Fraunces, serif" font-size="13" fill="${CREAM}" opacity="0.35">kinder than resenting</text>
      <text x="150" y="248" text-anchor="middle" font-family="Anton, sans-serif" font-size="36" fill="${CREAM}">PERMISSION CARDS</text>
      <rect width="300" height="300" fill="url(#d8)"/>${mark()}</svg>`
  },
  {
    num: "D9 — Printable PDF", word: "The Joy Log",
    line: "The one that isn't about coping. Textures, sounds and tastes you love, your current special interest, and a stim that feels genuinely good.",
    price: "£3.50", link: "#", bg: "#2E7A55",
    // The only worksheet here with nothing to fix.
    svg: `<svg viewBox="0 0 300 300">${grain("d9", 0.11)}
      <g fill="${GOLD}">
        <path d="M54,62 l4,10 10,4 -10,4 -4,10 -4,-10 -10,-4 10,-4 Z"/>
        <path d="M246,88 l3,8 8,3 -8,3 -3,8 -3,-8 -8,-3 8,-3 Z"/>
        <path d="M40,206 l3,8 8,3 -8,3 -3,8 -3,-8 -8,-3 8,-3 Z"/>
        <path d="M252,212 l4,9 9,4 -9,4 -4,9 -4,-9 -9,-4 9,-4 Z"/>
      </g>
      <text x="150" y="146" text-anchor="middle" font-family="Abril Fatface, serif" font-size="52" fill="${CREAM}">The Joy</text>
      <text x="150" y="196" text-anchor="middle" font-family="Abril Fatface, serif" font-size="52" fill="${GOLD}">Log</text>
      <text x="150" y="252" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${CREAM}" opacity="0.7" letter-spacing="0.14em">NOTHING HERE NEEDS FIXING</text>
      <rect width="300" height="300" fill="url(#d9)"/>${mark()}</svg>`
  },
  {
    num: "D10 — Printable PDF", word: "One Task, Broken Down",
    line: "Turn “tidy the kitchen” into steps small enough to start. Names the first physical action, then nine steps, then what might block you.",
    price: "£4.00", link: "#", bg: "#3A4E8C",
    // One impossible word, split into things you can actually do.
    svg: `<svg viewBox="0 0 300 300">${grain("d10", 0.11)}
      <text x="150" y="74" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">ONE TASK</text>
      <g stroke="${CREAM}" stroke-width="1.2" opacity="0.5" fill="none">
        <path d="M150,86 L150,104 M60,104 L240,104 M60,104 L60,120 M105,104 L105,120
                 M150,104 L150,120 M195,104 L195,120 M240,104 L240,120"/>
      </g>
      <g fill="${GOLD}">
        <rect x="50" y="122" width="20" height="20"/><rect x="95" y="122" width="20" height="20"/>
        <rect x="140" y="122" width="20" height="20"/><rect x="185" y="122" width="20" height="20"/>
        <rect x="230" y="122" width="20" height="20"/>
      </g>
      <g stroke="${CREAM}" stroke-width="1" opacity="0.35">
        <line x1="50" y1="158" x2="250" y2="158"/><line x1="50" y1="176" x2="215" y2="176"/>
        <line x1="50" y1="194" x2="245" y2="194"/>
      </g>
      <text x="150" y="248" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${GOLD}">BROKEN DOWN</text>
      <rect width="300" height="300" fill="url(#d10)"/>${mark()}</svg>`
  },
  {
    num: "D11 — Printable PDF", word: "Safe Foods Planner",
    line: "Built around eating the same thing on purpose. Safe foods, zero-effort options, a loose week with a backup column, and a repeat shopping list.",
    price: "£4.00", link: "#", bg: "#C77A22",
    // The same thing, all week, entirely on purpose.
    svg: `<svg viewBox="0 0 300 300">${grain("d11", 0.11)}
      <g>
        ${[0,1,2,3,4,5,6].map(i =>
          `<circle cx="${44+ (i%4)*72}" cy="${80+Math.floor(i/4)*72}" r="26" fill="none" stroke="${CREAM}" stroke-width="1.8" opacity="${i===6?0.9:0.55}"/>
           <circle cx="${44+ (i%4)*72}" cy="${80+Math.floor(i/4)*72}" r="11" fill="${i===6?GOLD:CREAM}" opacity="${i===6?1:0.5}"/>`).join('')}
      </g>
      <text x="150" y="216" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">SAFE FOODS</text>
      <text x="150" y="252" text-anchor="middle" font-family="Caveat, cursive" font-size="26" fill="${CREAM}">fed is the goal, variety is optional</text>
      <rect width="300" height="300" fill="url(#d11)"/>${mark()}</svg>`
  },
  {
    num: "D12 — Printable PDF", word: "Access Needs Cards",
    line: "Six cut-out cards to hand over instead of explaining out loud, plus a sheet of blanks to write your own.",
    price: "£3.50", link: "#", bg: "#25607A",
    // A card handed over, so you don't have to say it.
    svg: `<svg viewBox="0 0 300 300">${grain("d12", 0.11)}
      <g>
        <rect x="52" y="76" width="180" height="66" rx="3" fill="${CREAM}" opacity="0.2" transform="rotate(-7 142 109)"/>
        <rect x="60" y="88" width="180" height="66" rx="3" fill="${CREAM}" opacity="0.35" transform="rotate(-3 150 121)"/>
        <rect x="66" y="102" width="180" height="66" rx="3" fill="${CREAM}"/>
      </g>
      <text x="156" y="130" text-anchor="middle" font-family="Fraunces, serif" font-size="14" fill="${INK}">I communicate better</text>
      <text x="156" y="150" text-anchor="middle" font-family="Fraunces, serif" font-size="14" fill="${INK}">in writing</text>
      <text x="150" y="222" text-anchor="middle" font-family="Anton, sans-serif" font-size="32" fill="${CREAM}">ACCESS NEEDS</text>
      <text x="150" y="252" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${GOLD}" letter-spacing="0.14em">HAND IT OVER, DON'T EXPLAIN</text>
      <rect width="300" height="300" fill="url(#d12)"/>${mark()}</svg>`
  },
  {
    num: "D13 — Printable PDF", word: "What I'm Actually Good At",
    line: "The page nobody hands you after an assessment. What you do better than most, what people come to you for, and a table for reframing every trait you've been criticised for.",
    price: "£4.00", link: "#", bg: "#7A2E4E",
    // The other column of the report.
    svg: `<svg viewBox="0 0 300 300">${grain("d13", 0.11)}
      <line x1="150" y1="52" x2="150" y2="182" stroke="${CREAM}" stroke-width="1.2" opacity="0.45"/>
      <g font-family="Fraunces, serif" font-size="15" fill="${CREAM}" opacity="0.4" text-anchor="end">
        <text x="136" y="76">"obsessive"</text><text x="136" y="106">"too intense"</text>
        <text x="136" y="136">"blunt"</text><text x="136" y="166">"rigid"</text>
      </g>
      <g font-family="Fraunces, serif" font-size="15" fill="${GOLD}">
        <text x="164" y="76">devoted</text><text x="164" y="106">wholehearted</text>
        <text x="164" y="136">honest</text><text x="164" y="166">principled</text>
      </g>
      <text x="150" y="222" text-anchor="middle" font-family="Anton, sans-serif" font-size="31" fill="${CREAM}">ACTUALLY GOOD AT</text>
      <text x="150" y="252" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${CREAM}" opacity="0.65" letter-spacing="0.14em">THE OTHER HALF OF THE REPORT</text>
      <rect width="300" height="300" fill="url(#d13)"/>${mark()}</svg>`
  },
  {
    num: "D14 — Printable PDF", word: "Good Day Blueprint",
    line: "Work backwards from a day that actually felt right, and pull out the ingredients you can repeat. Good days aren't luck — they have components.",
    price: "£4.00", link: "#", bg: "#1F5A6B",
    // A good day, drawn up like a technical plan.
    svg: `<svg viewBox="0 0 300 300">${grain("d14", 0.11)}
      <g stroke="${CREAM}" stroke-width="0.5" opacity="0.25">
        ${[0,1,2,3,4,5,6,7].map(i => `<line x1="${28+i*32}" y1="40" x2="${28+i*32}" y2="212"/>`).join('')}
        ${[0,1,2,3,4,5].map(i => `<line x1="28" y1="${40+i*34}" x2="252" y2="${40+i*34}"/>`).join('')}
      </g>
      <g stroke="${GOLD}" stroke-width="2.2" fill="none">
        <rect x="60" y="74" width="64" height="68"/>
        <rect x="156" y="108" width="64" height="68"/>
        <line x1="124" y1="108" x2="156" y2="142"/>
      </g>
      <g stroke="${CREAM}" stroke-width="0.8" opacity="0.6">
        <line x1="60" y1="60" x2="124" y2="60"/>
        <path d="M60,60 l5,-3 M60,60 l5,3 M124,60 l-5,-3 M124,60 l-5,3" fill="none"/>
      </g>
      <text x="150" y="248" text-anchor="middle" font-family="Anton, sans-serif" font-size="32" fill="${CREAM}">GOOD DAY BLUEPRINT</text>
      <text x="150" y="274" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${GOLD}" letter-spacing="0.14em">GOOD DAYS HAVE COMPONENTS</text>
      <rect width="300" height="300" fill="url(#d14)"/>${mark()}</svg>`
  },
  {
    num: "D15 — Printable PDF", word: "Ask For It Properly",
    line: "Builds a workplace accommodations request line by line — the situation, the effect on the work, the specific ask, and what it costs them (usually nothing). Plus ten common asks to tick.",
    price: "£4.50", link: "#", bg: "#4A6E2E",
    // Four parts. Assembled, it's hard to refuse.
    svg: `<svg viewBox="0 0 300 300">${grain("d15", 0.11)}
      <g font-family="Space Mono, monospace" font-size="10" fill="${GOLD}" font-weight="700">
        <text x="34" y="76">1</text><text x="34" y="112">2</text>
        <text x="34" y="148">3</text><text x="34" y="184">4</text>
      </g>
      <g stroke="${CREAM}" stroke-width="1" opacity="0.4">
        <line x1="56" y1="72" x2="266" y2="72"/><line x1="56" y1="108" x2="240" y2="108"/>
        <line x1="56" y1="180" x2="222" y2="180"/>
      </g>
      <rect x="52" y="128" width="214" height="26" fill="${GOLD}"/>
      <text x="62" y="146" font-family="Space Mono, monospace" font-size="10" fill="${INK}" font-weight="700" letter-spacing="0.08em">WHAT I'M ASKING FOR</text>
      <text x="150" y="234" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">ASK FOR IT</text>
      <text x="150" y="266" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${GOLD}">PROPERLY</text>
      <rect width="300" height="300" fill="url(#d15)"/>${mark()}</svg>`
  },
  {
    num: "D16 — Printable PDF", word: "After The Diagnosis",
    line: "The part nobody hands you. Relief, grief and anger all at once, what suddenly made sense, who you've told, and who doesn't need to know.",
    price: "£4.50", link: "#", bg: "#5E4A8C",
    // One line, and everything before it rereads differently.
    svg: `<svg viewBox="0 0 300 300">${grain("d16", 0.11)}
      <g font-family="Instrument Serif, serif" font-size="20" fill="${CREAM}" opacity="0.32">
        <text x="26" y="62">so sensitive</text><text x="170" y="62">too quiet</text>
        <text x="26" y="94">difficult</text><text x="150" y="94">not applying herself</text>
        <text x="26" y="126">dramatic</text><text x="140" y="126">attention seeking</text>
      </g>
      <line x1="20" y1="150" x2="280" y2="150" stroke="${GOLD}" stroke-width="2.4"/>
      <text x="150" y="204" text-anchor="middle" font-family="Instrument Serif, serif" font-size="52" fill="${CREAM}">oh.</text>
      <text x="150" y="252" text-anchor="middle" font-family="Anton, sans-serif" font-size="30" fill="${GOLD}">AFTER THE DIAGNOSIS</text>
      <rect width="300" height="300" fill="url(#d16)"/>${mark()}</svg>`
  },
  {
    num: "D17 — Printable PDF", word: "Finding My People",
    line: "Connection built on shared interests and side-by-side time rather than small talk. Places organised around a thing, a low-effort contact list, and one small move.",
    price: "£4.00", link: "#", bg: "#B5432F",
    // Scattered, then together.
    svg: `<svg viewBox="0 0 300 300">${grain("d17", 0.11)}
      <g fill="${CREAM}" opacity="0.3">
        <circle cx="34" cy="52" r="6"/><circle cx="262" cy="64" r="6"/><circle cx="26" cy="146" r="6"/>
        <circle cx="272" cy="152" r="6"/><circle cx="46" cy="208" r="6"/><circle cx="256" cy="204" r="6"/>
      </g>
      <g fill="${GOLD}">
        <circle cx="132" cy="112" r="10"/><circle cx="164" cy="104" r="10"/>
        <circle cx="122" cy="142" r="10"/><circle cx="156" cy="138" r="10"/>
        <circle cx="182" cy="128" r="10"/><circle cx="146" cy="166" r="10"/>
      </g>
      <text x="150" y="232" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">FINDING MY PEOPLE</text>
      <text x="150" y="262" text-anchor="middle" font-family="Caveat, cursive" font-size="25" fill="${CREAM}" opacity="0.85">wanting them was never the hard part</text>
      <rect width="300" height="300" fill="url(#d17)"/>${mark()}</svg>`
  },
  {
    num: "D19 — Printable PDF", word: "The Handover Sheet",
    line: "For respite, a hospital stay, a sitter, or the day you're ill. Everything the next person needs — how they communicate, what a good hour looks like, early warning signs, and a do / don't table. Fill it in once.",
    price: "£4.50", link: "#", bg: "#2E5F5A",
    svg: `<svg viewBox="0 0 300 300">${grain("d19", 0.11)}
      <g stroke="${CREAM}" stroke-width="1.4" opacity="0.75" fill="none">
        <path d="M70,142 q-18,-22 4,-34 q16,-8 28,6 l18,20"/>
        <path d="M230,142 q18,-22 -4,-34 q-16,-8 -28,6 l-18,20"/>
      </g>
      <rect x="112" y="120" width="76" height="50" rx="3" fill="${GOLD}"/>
      <g stroke="${INK}" stroke-width="1.2" opacity="0.55">
        <line x1="122" y1="136" x2="178" y2="136"/><line x1="122" y1="147" x2="168" y2="147"/>
        <line x1="122" y1="158" x2="174" y2="158"/>
      </g>
      <text x="150" y="228" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">THE HANDOVER SHEET</text>
      <text x="150" y="256" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${GOLD}" letter-spacing="0.14em">FILL IT IN ONCE. PHOTOCOPY IT.</text>
      <rect width="300" height="300" fill="url(#d19)"/>${mark()}</svg>`
  },
  {
    num: "D20 — Printable PDF", word: "Your Sheet, For Once",
    line: "Every form you've filled in this year has been about someone else. This one isn't — your own warning signs, twenty minutes of respite named properly, and scripts for asking without apologising.",
    price: "£4.00", link: "#", bg: "#7A3A5E",
    svg: `<svg viewBox="0 0 300 300">${grain("d20", 0.11)}
      <g font-family="Instrument Serif, serif" font-size="30" fill="${CREAM}" opacity="0.25">
        <text x="26" y="70">about them</text><text x="26" y="106">about them</text>
        <text x="26" y="142">about them</text><text x="26" y="178">about them</text>
      </g>
      <line x1="20" y1="196" x2="280" y2="196" stroke="${GOLD}" stroke-width="2"/>
      <text x="26" y="234" font-family="Instrument Serif, serif" font-size="40" fill="${CREAM}">about you</text>
      <text x="150" y="270" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${GOLD}" letter-spacing="0.14em">FOR ONCE</text>
      <rect width="300" height="300" fill="url(#d20)"/>${mark()}</svg>`
  },
  {
    num: "D21 — Printable PDF", word: "How To Help Me",
    line: "Hand it to the people who keep asking. A please-don't-say / try-instead table, what helps day to day, exactly what to do if you shut down, and one blank for the thing you most want them to know.",
    price: "£4.00", link: "#", bg: "#B5432F",
    svg: `<svg viewBox="0 0 300 300">${grain("d21", 0.11)}
      <line x1="150" y1="56" x2="150" y2="192" stroke="${CREAM}" stroke-width="1.2" opacity="0.45"/>
      <g font-family="Fraunces, serif" font-size="14" fill="${CREAM}" opacity="0.4" text-anchor="end">
        <text x="136" y="82">"you don't seem it"</text>
        <text x="136" y="118">"everyone's a bit"</text>
        <text x="136" y="154">"tried yoga?"</text>
      </g>
      <g font-family="Fraunces, serif" font-size="14" fill="${GOLD}">
        <text x="164" y="82">"thanks for telling me"</text>
        <text x="164" y="118">"what's it like?"</text>
        <text x="164" y="154">"anything that helps?"</text>
      </g>
      <text x="150" y="230" text-anchor="middle" font-family="Anton, sans-serif" font-size="38" fill="${CREAM}">HOW TO HELP ME</text>
      <text x="150" y="258" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${CREAM}" opacity="0.7" letter-spacing="0.14em">JUST BELIEVE ME</text>
      <rect width="300" height="300" fill="url(#d21)"/>${mark()}</svg>`
  },
  {
    num: "D22 — Printable PDF", word: "For The Sibling",
    line: "For the one who got very good at being fine. What you got good at, what you wanted but didn't ask for, what you love about them, and what you'd like more of now.",
    price: "£3.50", link: "#", bg: "#8C5A2E",
    svg: `<svg viewBox="0 0 300 300">${grain("d22", 0.11)}
      <text x="150" y="126" text-anchor="middle" font-family="Instrument Serif, serif" font-size="66" fill="${CREAM}" opacity="0.85">them</text>
      <text x="150" y="176" text-anchor="middle" font-family="Instrument Serif, serif" font-size="19" fill="${CREAM}" opacity="0.3">you</text>
      <g stroke="${GOLD}" stroke-width="1.8" fill="none">
        <circle cx="150" cy="168" r="25"/><line x1="168" y1="186" x2="184" y2="202" stroke-linecap="round"/>
      </g>
      <text x="150" y="252" text-anchor="middle" font-family="Anton, sans-serif" font-size="36" fill="${GOLD}">FOR THE SIBLING</text>
      <text x="150" y="276" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.65" letter-spacing="0.14em">YOU WERE NEVER THE EASY ONE</text>
      <rect width="300" height="300" fill="url(#d22)"/>${mark()}</svg>`
  },
  {
    num: "D23 — Printable PDF", word: "Lily Pad Planner",
    line: "Seven days, three big rocks instead of twenty, and a wins column for anything that counts — even the tiny hops.",
    price: "£4.00", link: "#", bg: "#2E6B4A",
    // Stepping-stone lily pads across the week, not a straight line.
    svg: `<svg viewBox="0 0 300 300">${grain("d23", 0.11)}
      <g fill="${CREAM}" opacity="0.85">
        <ellipse cx="52" cy="150" rx="19" ry="13"/><ellipse cx="98" cy="128" rx="19" ry="13"/>
        <ellipse cx="146" cy="152" rx="19" ry="13"/><ellipse cx="194" cy="126" rx="19" ry="13"/>
        <ellipse cx="242" cy="150" rx="19" ry="13"/>
      </g>
      <g stroke="${GOLD}" stroke-width="1.4" stroke-dasharray="1 7" stroke-linecap="round" opacity="0.7">
        <path d="M52,150 Q75,110 98,128 Q122,90 146,152 Q170,108 194,126 Q218,88 242,150" fill="none"/>
      </g>
      <text x="150" y="204" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${CREAM}" opacity="0.7" letter-spacing="0.16em">NO NEED TO LEAP AHEAD</text>
      <text x="150" y="248" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">LILY PAD PLANNER</text>
      <text x="150" y="272" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" fill="${GOLD}" letter-spacing="0.14em">WEEKLY + DAILY</text>
      <rect width="300" height="300" fill="url(#d23)"/>${mark()}</svg>`
  },
  {
    num: "D24 — Printable PDF", word: "The Pocket Pond",
    line: "Three rituals for hard moments, a comfort menu sorted by spoons, a sensory reset checklist, and a permission slip for the days you need it most.",
    price: "£4.50", link: "#", bg: "#1F6B75",
    // A small kit, packed and ready.
    svg: `<svg viewBox="0 0 300 300">${grain("d24", 0.1)}
      <rect x="86" y="96" width="128" height="98" rx="10" fill="none" stroke="${CREAM}" stroke-width="2.2"/>
      <path d="M86,124 h128 M150,96 v98" stroke="${CREAM}" stroke-width="1.4" opacity="0.6"/>
      <circle cx="118" cy="80" r="4" fill="${GOLD}"/><circle cx="150" cy="72" r="4" fill="${GOLD}"/><circle cx="182" cy="80" r="4" fill="${GOLD}"/>
      <path d="M110,80 Q150,44 190,80" fill="none" stroke="${GOLD}" stroke-width="1.6" opacity="0.7"/>
      <text x="150" y="228" text-anchor="middle" font-family="Space Mono, monospace" font-size="9" fill="${CREAM}" opacity="0.7" letter-spacing="0.16em">A CARE PACKAGE</text>
      <text x="150" y="258" text-anchor="middle" font-family="Anton, sans-serif" font-size="33" fill="${CREAM}">THE POCKET POND</text>
      <rect width="300" height="300" fill="url(#d24)"/>${mark()}</svg>`
  },
  {
    num: "D25 — Printable PDF", word: "Hoppy Thoughts — Issue 01",
    line: "A zine of one-liners and gentle truths for brains that run sideways. Focus, executive function, sensory everything, social battery, rest — read front to back, or flip to whatever page calls to you.",
    price: "£3.50", link: "#", bg: "#7A3A5E",
    svg: `<svg viewBox="0 0 300 300">${grain("d25", 0.12)}
      <rect x="74" y="66" width="152" height="188" fill="none" stroke="${CREAM}" stroke-width="2"/>
      <line x1="90" y1="94" x2="210" y2="94" stroke="${CREAM}" stroke-width="1.2" opacity="0.55"/>
      <line x1="90" y1="112" x2="196" y2="112" stroke="${CREAM}" stroke-width="1.2" opacity="0.35"/>
      <text x="150" y="168" text-anchor="middle" font-family="Instrument Serif, serif" font-size="21" fill="${GOLD}" opacity="0.9">ISSUE</text>
      <text x="150" y="204" text-anchor="middle" font-family="Anton, sans-serif" font-size="54" fill="${GOLD}">01</text>
      <text x="150" y="272" text-anchor="middle" font-family="Anton, sans-serif" font-size="26" fill="${CREAM}">HOPPY THOUGHTS</text>
      <text x="150" y="292" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.6" letter-spacing="0.12em">A FROG LOGIC ZINE</text>
      <rect width="300" height="300" fill="url(#d25)"/>${mark()}</svg>`
  },
  {
    num: "D26 — Printable PDF", word: "Hoppy Thoughts — Issue 02",
    line: "The slow season edition: work and school accommodations, relationships, holidays and big gatherings, an advice column, and a horoscope that only applies to frogs.",
    price: "£3.50", link: "#", bg: "#5E4A8C",
    svg: `<svg viewBox="0 0 300 300">${grain("d26", 0.12)}
      <rect x="74" y="66" width="152" height="188" fill="none" stroke="${CREAM}" stroke-width="2"/>
      <line x1="90" y1="94" x2="210" y2="94" stroke="${CREAM}" stroke-width="1.2" opacity="0.55"/>
      <line x1="90" y1="112" x2="196" y2="112" stroke="${CREAM}" stroke-width="1.2" opacity="0.35"/>
      <text x="150" y="168" text-anchor="middle" font-family="Instrument Serif, serif" font-size="21" fill="${GOLD}" opacity="0.9">ISSUE</text>
      <text x="150" y="204" text-anchor="middle" font-family="Anton, sans-serif" font-size="54" fill="${GOLD}">02</text>
      <text x="150" y="272" text-anchor="middle" font-family="Anton, sans-serif" font-size="26" fill="${CREAM}">HOPPY THOUGHTS</text>
      <text x="150" y="292" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.6" letter-spacing="0.12em">THE SLOW SEASON EDITION</text>
      <rect width="300" height="300" fill="url(#d26)"/>${mark()}</svg>`
  },
  {
    num: "D27 — Printable PDF", word: "30 Days at the Pond",
    line: "One prompt a day, in any order, skip freely. A month of honest, unhurried questions — the pond will wait.",
    price: "£4.00", link: "#", bg: "#2C4A6E",
    // A month grid with most days left open on purpose.
    svg: `<svg viewBox="0 0 300 300">${grain("d27", 0.1)}
      <g>
        <rect x="60" y="92" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="90" y="92" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="120" y="92" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.85"/><rect x="150" y="92" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="180" y="92" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="210" y="92" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="60" y="122" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="90" y="122" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.85"/><rect x="120" y="122" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="150" y="122" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="180" y="122" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="210" y="122" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="60" y="152" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="90" y="152" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.85"/><rect x="120" y="152" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="150" y="152" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="180" y="152" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="210" y="152" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="60" y="182" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.85"/><rect x="90" y="182" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="120" y="182" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="150" y="182" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="180" y="182" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="210" y="182" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="60" y="212" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.85"/><rect x="90" y="212" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="120" y="212" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="150" y="212" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="180" y="212" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.22"/><rect x="210" y="212" width="24" height="24" rx="3" fill="${CREAM}" opacity="0.85"/>
      </g>
      <text x="150" y="252" text-anchor="middle" font-family="Anton, sans-serif" font-size="27" fill="${CREAM}">30 DAYS AT</text>
      <text x="150" y="278" text-anchor="middle" font-family="Anton, sans-serif" font-size="27" fill="${CREAM}">THE POND</text>
      <rect width="300" height="300" fill="url(#d27)"/>${mark()}</svg>`
  },
  {
    num: "D28 — Printable PDF", word: "Affirmation Cards",
    line: "Twenty-four lines to cut out and keep somewhere you'll actually see them. Nothing here needs to be earned first.",
    price: "£3.00", link: "#", bg: "#8C5A1C",
    svg: `<svg viewBox="0 0 300 300">${grain("d28", 0.09)}
      <g>
        <rect x="40" y="76" width="150" height="90" rx="6" fill="${CREAM}" opacity="0.18" transform="rotate(-7 115 121)"/>
        <rect x="52" y="90" width="150" height="90" rx="6" fill="${CREAM}" opacity="0.35" transform="rotate(-2 127 135)"/>
        <rect x="64" y="106" width="150" height="90" rx="6" fill="${CREAM}"/>
      </g>
      <text x="88" y="140" font-family="Fraunces, serif" font-size="15" fill="${INK}">My pace is</text>
      <text x="88" y="162" font-family="Fraunces, serif" font-size="15" fill="${INK}">not a flaw.</text>
      <text x="88" y="184" font-family="Space Mono, monospace" font-size="7.5" fill="#8C5A1C" letter-spacing="0.12em">FROG LOGIC</text>
      <text x="150" y="250" text-anchor="middle" font-family="Anton, sans-serif" font-size="30" fill="${CREAM}">AFFIRMATION CARDS</text>
      <text x="150" y="272" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.65" letter-spacing="0.12em">TWENTY-FOUR, CUT OUT AND KEEP</text>
      <rect width="300" height="300" fill="url(#d28)"/>${mark()}</svg>`
  },
  {
    num: "D29 — Printable PDF", word: "Habit Stacking Cards",
    line: "Attach one small habit to something you already do without thinking. Fill in the blank, then stop thinking about it.",
    price: "£3.00", link: "#", bg: "#4A6E2E",
    svg: `<svg viewBox="0 0 300 300">${grain("d29", 0.1)}
      <text x="150" y="118" text-anchor="middle" font-family="Space Mono, monospace" font-size="12" fill="${CREAM}" opacity="0.8">After I</text>
      <line x1="110" y1="128" x2="190" y2="128" stroke="${GOLD}" stroke-width="1.6"/>
      <g stroke="${GOLD}" stroke-width="2.4" fill="none" stroke-linecap="round">
        <path d="M150,146 v18"/><path d="M141,155 l9,9 9,-9"/>
      </g>
      <text x="150" y="196" text-anchor="middle" font-family="Space Mono, monospace" font-size="12" fill="${CREAM}" opacity="0.8">I will</text>
      <line x1="110" y1="206" x2="190" y2="206" stroke="${GOLD}" stroke-width="1.6"/>
      <text x="150" y="252" text-anchor="middle" font-family="Anton, sans-serif" font-size="27" fill="${CREAM}">HABIT STACKING</text>
      <text x="150" y="274" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.65" letter-spacing="0.12em">BUILD YOUR OWN, TOO</text>
      <rect width="300" height="300" fill="url(#d29)"/>${mark()}</svg>`
  },
  {
    num: "D30 — Printable PDF", word: "Translation Cards",
    line: "The harsh thing you say about yourself, and a truer sentence to put next to it. Twelve swaps, ready to use.",
    price: "£3.00", link: "#", bg: "#8C4A2F",
    svg: `<svg viewBox="0 0 300 300">${grain("d30", 0.1)}
      <text x="150" y="122" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="17" fill="${CREAM}" opacity="0.6">"I'm lazy."</text>
      <g stroke="${GOLD}" stroke-width="1.6" fill="none">
        <line x1="150" y1="136" x2="150" y2="156"/><path d="M143,149 l7,7 7,-7"/>
      </g>
      <text x="150" y="188" text-anchor="middle" font-family="Fraunces, serif" font-size="15" fill="${CREAM}">"I'm conserving pond</text>
      <text x="150" y="208" text-anchor="middle" font-family="Fraunces, serif" font-size="15" fill="${CREAM}">energy for what matters."</text>
      <text x="150" y="252" text-anchor="middle" font-family="Anton, sans-serif" font-size="30" fill="${GOLD}">TRANSLATION CARDS</text>
      <text x="150" y="274" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${CREAM}" opacity="0.65" letter-spacing="0.12em">TWELVE SWAPS, READY TO USE</text>
      <rect width="300" height="300" fill="url(#d30)"/>${mark()}</svg>`
  },
  {
    num: "D31 — Printable PDF", word: "Frog Logic Stickers",
    line: "Every design in the sticker collection, to print at home on whatever paper you already have. Eighteen designs across two sheets, 54mm square.",
    price: "£4.50", link: "#", bg: "#2F5D50",
    svg: `<svg viewBox="0 0 300 300">${grain("d31", 0.1)}
      <g stroke="${CREAM}" stroke-width="1" stroke-dasharray="4 4" opacity="0.55" fill="none">
        <rect x="42" y="52" width="66" height="66"/><rect x="117" y="52" width="66" height="66"/><rect x="192" y="52" width="66" height="66"/>
        <rect x="42" y="127" width="66" height="66"/><rect x="192" y="127" width="66" height="66"/>
      </g>
      <rect x="117" y="127" width="66" height="66" fill="${GOLD}"/>
      <text x="150" y="167" text-anchor="middle" font-family="Anton, sans-serif" font-size="17" fill="#1A1A1A">CUT</text>
      <text x="150" y="228" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="${CREAM}">PRINT YOUR OWN</text>
      <text x="150" y="252" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="${GOLD}" letter-spacing="0.12em">EIGHTEEN DESIGNS · TWO SHEETS</text>
      <rect width="300" height="300" fill="url(#d31)"/>${mark()}</svg>`
  },
];

// Any SVG text wider than the artboard gets scaled down until it fits.
// Measured from the real rendering rather than estimated, so it works
// across every typeface in the library.
function fitSvgText(root){
  const MAX = 272;      // 300 artboard minus a little breathing room
  const KEEP = ['OVER','STIMU','LATED','TOO MUCH'];  // deliberate bleeds
  root.querySelectorAll('.stage svg text').forEach(t => {
    const txt = (t.textContent || '').trim();
    if(!txt) return;
    let len;
    try { len = t.getComputedTextLength(); } catch(e){ return; }
    if(len <= MAX) return;
    const cur = parseFloat(t.getAttribute('font-size') ||
                window.getComputedStyle(t).fontSize) || 16;
    const scaled = Math.max(8, Math.floor(cur * (MAX / len)));
    t.setAttribute('font-size', scaled);
  });
}

function renderDigital(){
  const grid = document.getElementById('digital-grid');
  if(!grid) return;
  grid.innerHTML = DIGITAL_PRODUCTS.map(p => `
    <article class="card">
      <div class="stage" style="background:${p.bg}">${p.svg}</div>
      <div class="card-meta">
        <p class="card-num">${p.num}</p>
        <h3>${p.word}</h3>
        <p class="card-line">${p.line}</p>
        <p class="card-price">${p.price}</p>
        <button class="btn btn-primary" data-checkout-num="${p.num}" data-checkout-word="${p.word}" data-checkout-kind="digital">Download</button>
      </div>
    </article>
  `).join('');
}

// ===== The Pond Guides =====
// One warm explainer per neurotype. Covers share a layout on purpose — it's a
// series, so they should look like a set on a shelf rather than 11 one-offs.
const GUIDES = [
  {
    num: "Pond Guide", word: "Autism", line: "No look, no cure, no growing out of it. What it's like from inside, what people get wrong, and what actually helps.",
    price: "£3.50", link: "#", bg: "#B5432F", slug: "Autism",
  },
  {
    num: "Pond Guide", word: "ADHD", line: "Not a shortage of attention — attention that won't take instructions. Interest, urgency and novelty instead of importance.",
    price: "£3.50", link: "#", bg: "#E0A81C", slug: "ADHD",
  },
  {
    num: "Pond Guide", word: "AuDHD", line: "Autistic and ADHD together: two nervous systems asking for opposite things. Not the two lists added up.",
    price: "£3.50", link: "#", bg: "#5E4A8C", slug: "AuDHD",
  },
  {
    num: "Pond Guide", word: "Dyslexia", line: "Nothing to do with intelligence, and nothing to do with letters being backwards. It's the sounds inside words.",
    price: "£3.50", link: "#", bg: "#25607A", slug: "Dyslexia",
  },
  {
    num: "Pond Guide", word: "Dyspraxia", line: "Usually reduced to clumsiness, which misses most of it. Planning and sequencing — of movement, and of everything else.",
    price: "£3.50", link: "#", bg: "#2E6B5E", slug: "Dyspraxia",
  },
  {
    num: "Pond Guide", word: "Dyscalculia", line: "Dyslexia's less famous sibling, and it gets far less patience. A different relationship with quantity altogether.",
    price: "£3.50", link: "#", bg: "#8C5A1C", slug: "Dyscalculia",
  },
  {
    num: "Pond Guide", word: "Dysgraphia", line: "When the ideas are all there and the last six inches, hand to paper, is what costs.",
    price: "£3.50", link: "#", bg: "#4A6E2E", slug: "Dysgraphia",
  },
  {
    num: "Pond Guide", word: "Tourette's & Tics", line: "Almost everything you think you know came from one rare symptom used as a punchline. Swearing affects around one in ten.",
    price: "£3.50", link: "#", bg: "#7A3A5E", slug: "Tourettes",
  },
  {
    num: "Pond Guide", word: "OCD", line: "The most misused word in the vocabulary. Not tidiness — a distressing loop the person wants out of.",
    price: "£3.50", link: "#", bg: "#2C4A6E", slug: "OCD",
  },
  {
    num: "Pond Guide", word: "PDA", line: "Demands landing as threats, including wanted ones. Even the name is contested — both sides are here.",
    price: "£3.50", link: "#", bg: "#8C4A2F", slug: "PDA",
  },
  {
    num: "Pond Guide", word: "Sensory Differences", line: "Eight senses, any of which can arrive far too loud, far too quiet, or unpredictably both.",
    price: "£3.50", link: "#", bg: "#1F6B75", slug: "Sensory",
  },
  { num: "Pond Guide", word: "Bipolar", line: "A difference in how the brain regulates mood and energy — not moodiness. Episodes last weeks, not hours.", price: "£3.50", link: "#", bg: "#4A5E8C", slug: "Bipolar" },
  { num: "Pond Guide", word: "CPTSD", line: "Harm that repeated over time, when you were too young or too trapped to leave. Your nervous system learned to keep you alive.", price: "£3.50", link: "#", bg: "#3F5C6B", slug: "CPTSD" },
  { num: "Pond Guide", word: "BPD / EUPD", line: "Few labels carry as much unfair stigma, including from professionals. Also one of the diagnoses people genuinely recover from.", price: "£3.50", link: "#", bg: "#8C3A5E", slug: "BPD" },
  { num: "Pond Guide", word: "Anxiety", line: "Often the result of being neurodivergent in a world that isn't built for you, rather than a separate thing.", price: "£3.50", link: "#", bg: "#2E6B5E", slug: "Anxiety" },
  { num: "Pond Guide", word: "Depression", line: "Very often the accumulated cost of years of masking and unmet needs. Not a mood, and not an attitude.", price: "£3.50", link: "#", bg: "#3A4E6B", slug: "Depression" },
  { num: "Pond Guide", word: "Misophonia", line: "Small sounds provoking instant, disproportionate rage or panic. Increasingly well evidenced, including on brain imaging.", price: "£3.50", link: "#", bg: "#B5432F", slug: "Misophonia" },
  { num: "Pond Guide", word: "Aphantasia", line: "No mental pictures at all. Most people find out in adulthood that “picture it” was never a figure of speech.", price: "£3.50", link: "#", bg: "#4A6E7A", slug: "Aphantasia" },
  { num: "Pond Guide", word: "Synaesthesia", line: "Letters with colours, sounds with shapes, Tuesday being yellow-green. Extra channels, permanently on.", price: "£3.50", link: "#", bg: "#7A4A8C", slug: "Synaesthesia" },
  { num: "Pond Guide", word: "Alexithymia", line: "Not the absence of feelings — having them at full strength with no reliable way to name them. Common alongside autism.", price: "£3.50", link: "#", bg: "#5E6B2E", slug: "Alexithymia" },
  { num: "Pond Guide", word: "Face Blindness", line: "Prosopagnosia — difficulty recognising faces, including familiar ones. Nothing to do with memory or caring.", price: "£3.50", link: "#", bg: "#8C6A2E", slug: "Prosopagnosia" },
  { num: "Pond Guide", word: "Situational Mutism", line: "Still often called selective mutism, which is unfortunate — nothing about it is selected. A freeze, not a refusal.", price: "£3.50", link: "#", bg: "#2E5F73", slug: "SelectiveMutism" },
  { num: "Pond Guide", word: "Auditory Processing", line: "The hearing test is perfect and the pub is still impossible. The ears are fine; it's the sorting office.", price: "£3.50", link: "#", bg: "#6B4A2E", slug: "APD" },
];

function renderGuides(){
  const grid = document.getElementById('guides-grid');
  if(!grid) return;
  grid.innerHTML = GUIDES.map(g => `
    <article class="card">
      <div class="stage" style="background:${g.bg}">
        <svg viewBox="0 0 300 300">
          <defs><pattern id="pg${g.slug}" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="${INK}" opacity="0.11"/></pattern></defs>
          <text x="26" y="62" font-family="Space Mono, monospace" font-size="8.5"
            fill="${CREAM}" opacity="0.6" letter-spacing="0.22em">THE POND GUIDES</text>
          <line x1="24" y1="76" x2="276" y2="76" stroke="${CREAM}" stroke-width="1" opacity="0.4"/>
          <text x="150" y="168" text-anchor="middle" font-family="Fraunces, serif"
            font-size="46" fill="${CREAM}">${g.word}</text>
          <line x1="110" y1="196" x2="190" y2="196" stroke="${GOLD}" stroke-width="2.4"/>
          <text x="150" y="240" text-anchor="middle" font-family="Space Mono, monospace"
            font-size="8.5" fill="${CREAM}" opacity="0.65" letter-spacing="0.16em">EXPLAINED WARMLY</text>
          <text x="150" y="272" text-anchor="middle" font-family="Caveat, cursive"
            font-size="24" fill="${GOLD}">take what fits, leave the rest</text>
          <rect width="300" height="300" fill="url(#pg${g.slug})"/>
          <image href="${LOGO}" x="240" y="16" width="46" height="40" preserveAspectRatio="xMidYMid meet"/>
        </svg>
      </div>
      <div class="card-meta">
        <p class="card-num">${g.num}</p>
        <h3>${g.word}</h3>
        <p class="card-line">${g.line}</p>
        <p class="card-price">${g.price}</p>
        <button class="btn btn-primary" data-checkout-num="${g.num}" data-checkout-word="${g.word}" data-checkout-kind="digital">Download</button>
      </div>
    </article>
  `).join('');
}

function wireLowStimToggle(){
  const btn = document.getElementById('low-stim-toggle');
  if(!btn) return;
  btn.addEventListener('click', () => {
    const on = document.body.classList.toggle('low-stim');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Low-stim: on' : 'Low-stim mode';
  });
}

function wireNewsletterForm(){
  const form = document.getElementById('newsletter-form');
  const note = document.getElementById('form-note');
  if(!form) return;
  form.addEventListener('submit', () => {
    // The form posts to the Google Form behind the subscriber list, into a
    // hidden iframe (Google doesn't send CORS headers, so fetch() can't do it).
    setTimeout(() => {
      form.reset();
      note.textContent = "You're on the list. One email a month, easy to leave. 🐸";
    }, 400);
  });
}


// Turns a product's num+word into the same id catalog.json uses server-side
// (netlify/functions/catalog.json is generated from these exact fields, so
// keep this logic in sync if that generator ever changes).
function checkoutId(num, word, kind){
  const numPart = num.includes('\u2014') ? num.split('\u2014')[0].trim() : num;
  const base = (numPart + '-' + word).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return kind === 'guide' ? 'guide-' + base : base;
}

function wireCheckoutButtons(){
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-checkout-num]');
    if(!btn) return;
    e.preventDefault();
    const isGuide = btn.closest('#guides-grid') !== null;
    const id = checkoutId(btn.dataset.checkoutNum, btn.dataset.checkoutWord, isGuide ? 'guide' : btn.dataset.checkoutKind);
    const original = btn.textContent;
    btn.textContent = 'One moment…';
    btn.disabled = true;
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if(!res.ok || !data.url){
        alert(data.error || "Sorry, checkout isn't available right now.");
        btn.textContent = original;
        btn.disabled = false;
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      alert("Sorry, something went wrong reaching checkout. Please try again in a moment.");
      btn.textContent = original;
      btn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderDigital();
  renderGuides();
  // fonts load asynchronously, so measure once they're ready
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => fitSvgText(document));
  } else {
    fitSvgText(document);
  }
  wireLowStimToggle();
  wireNewsletterForm();
  wireCheckoutButtons();
});

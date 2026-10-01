// Maulti, the mascot: a Maultasche with a face. A close port of design/Maskottchen.dc.html:
// same SVG, same order; each `{show.x && …}` replaces a `display="{{ v.x }}"` from the prototype.
// Without a client:* directive Astro renders it to plain SVG, no JS. Islands can use it too.
//
// The character's own colors are part of the artwork and stay in this file.
// Only the accent follows the theme (--mascot-accent in tokens.css).

export type MaultiPose = 'wave' | 'think' | 'cook' | 'cheer' | 'sleep' | 'heart' | 'alarm' | 'lock';

type Props = {
  pose?: MaultiPose;
  /** Width and height in px at default text size (design values: 64–170) */
  size?: number;
};

const ACCENT = 'var(--mascot-accent)';
const FONT = 'var(--font-display)';

// Fork marks pressed into the dough edge
function forks(): string {
  let d = '';
  for (let x = 24; x <= 96; x += 6) d += `M${x} 43.5v4.5M${x} 98v4.5`;
  for (let y = 52; y <= 94; y += 6) d += `M17.5 ${y}h4.5M98 ${y}h4.5`;
  return d;
}
const FORKS = forks();

function brows(pose: MaultiPose): [string, string] {
  switch (pose) {
    case 'think':
      return ['M42 59 Q47 55 53 58', 'M67 56 Q73 54 78 57'];
    case 'alarm':
      return ['M42 56 Q47 59 53 58', 'M67 58 Q73 59 78 56'];
    case 'cheer':
      return ['M42 58 Q47 53 53 57', 'M67 57 Q73 53 78 58'];
    case 'sleep':
      return ['M43 63 Q48 62 52 63', 'M68 63 Q72 62 77 63'];
    default:
      return ['M43 59 Q48 56 52 59', 'M68 59 Q72 56 77 59'];
  }
}

export default function Maulti({ pose = 'wave', size = 96 }: Props) {
  const show = {
    eyesOpen: pose !== 'sleep',
    eyesClosed: pose === 'sleep',
    rightEye: pose !== 'lock',
    wink: pose === 'lock',
    smile: pose === 'wave' || pose === 'cook' || pose === 'heart' || pose === 'lock',
    open: pose === 'cheer' || pose === 'alarm',
    oh: pose === 'think' || pose === 'sleep',
    wave: pose === 'wave',
    think: pose === 'think',
    cook: pose === 'cook',
    cheer: pose === 'cheer',
    sleep: pose === 'sleep',
    heart: pose === 'heart',
    alarm: pose === 'alarm',
    lock: pose === 'lock',
  };
  const eyeY = pose === 'think' ? 66 : 69;
  const highlightY = pose === 'think' ? 63.8 : 66.8;
  const [browL, browR] = brows(pose);
  const sizeRem = `${size / 16}rem`;

  return (
    <svg
      viewBox="0 0 120 120"
      style={{ width: sizeRem, height: sizeRem, display: 'block', overflow: 'visible' }}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="60" cy="116" rx="32" ry="4" fill="rgba(0,0,0,.14)" />
      <ellipse cx="45" cy="109" rx="8" ry="5" fill="#e3b777" stroke="#3b2a1d" stroke-width="3" />
      <ellipse cx="75" cy="109" rx="8" ry="5" fill="#e3b777" stroke="#3b2a1d" stroke-width="3" />
      <rect
        x="14"
        y="40"
        width="92"
        height="66"
        rx="11"
        fill="#f8e4bb"
        stroke="#3b2a1d"
        stroke-width="3"
      />
      <path d={FORKS} fill="none" stroke="#d2a86a" stroke-width="2.2" stroke-linecap="round" />
      <rect
        x="24"
        y="50"
        width="72"
        height="46"
        rx="17"
        fill="#f0cc8c"
        stroke="#c9985a"
        stroke-width="2"
      />
      <path
        d="M30 60 C33 55 38 53 44 53"
        fill="none"
        stroke="#fff6df"
        stroke-width="3"
        stroke-linecap="round"
      />
      <g fill="#7ea45b" opacity=".75">
        <circle cx="31" cy="88" r="1.6" />
        <circle cx="36" cy="91" r="1.1" />
        <circle cx="88" cy="86" r="1.5" />
        <circle cx="84" cy="91" r="1.1" />
        <circle cx="89" cy="60" r="1.2" />
      </g>
      <g fill="none" stroke="#3b2a1d" stroke-width="2.6" stroke-linecap="round">
        <path d={browL} />
        <path d={browR} />
      </g>
      {show.eyesOpen && (
        <g>
          <ellipse cx="48" cy={eyeY} rx="4.6" ry="5.6" fill="#3b2a1d" />
          <circle cx="49.6" cy={highlightY} r="1.8" fill="#fff" />
          {show.rightEye && (
            <g>
              <ellipse cx="72" cy={eyeY} rx="4.6" ry="5.6" fill="#3b2a1d" />
              <circle cx="73.6" cy={highlightY} r="1.8" fill="#fff" />
            </g>
          )}
        </g>
      )}
      {show.eyesClosed && (
        <g fill="none" stroke="#3b2a1d" stroke-width="3" stroke-linecap="round">
          <path d="M43 70 Q48 74 53 70" />
          <path d="M67 70 Q72 74 77 70" />
        </g>
      )}
      <ellipse cx="37" cy="80" rx="6" ry="3.6" fill="#f39a8c" opacity=".9" />
      <ellipse cx="83" cy="80" rx="6" ry="3.6" fill="#f39a8c" opacity=".9" />
      {show.smile && (
        <path
          d="M54 80 Q60 87 66 80"
          fill="none"
          stroke="#3b2a1d"
          stroke-width="3"
          stroke-linecap="round"
        />
      )}
      {show.open && (
        <g>
          <path
            d="M52 79 Q60 93 68 79 Z"
            fill="#3b2a1d"
            stroke="#3b2a1d"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M56 86 Q60 89.5 64 86" fill="#f39a8c" />
        </g>
      )}
      {show.oh && <ellipse cx="60" cy="84" rx="3.2" ry="3.8" fill="#3b2a1d" />}
      <g fill="none" stroke="#3b2a1d" stroke-width="5" stroke-linecap="round">
        {show.wave && (
          <g>
            <path d="M15 78 Q6 84 9 95" />
            <path d="M105 68 Q114 58 111 43" />
          </g>
        )}
        {show.think && (
          <g>
            <path d="M15 78 Q6 86 9 97" />
            <path d="M105 80 Q104 94 84 92" />
          </g>
        )}
        {show.cook && (
          <g>
            <path d="M15 78 Q6 86 9 97" />
            <path d="M105 76 Q112 74 113 65" />
          </g>
        )}
        {show.cheer && (
          <g>
            <path d="M16 64 Q6 52 10 36" />
            <path d="M104 64 Q114 52 110 36" />
          </g>
        )}
        {show.sleep && (
          <g>
            <path d="M15 82 Q7 90 13 99" />
            <path d="M105 82 Q113 90 107 99" />
          </g>
        )}
        {show.heart && (
          <g>
            <path d="M16 80 Q24 97 48 95" />
            <path d="M104 80 Q96 97 72 95" />
          </g>
        )}
        {show.alarm && (
          <g>
            <path d="M16 66 Q6 58 9 44" />
            <path d="M104 70 Q110 64 108 56" />
          </g>
        )}
        {show.lock && (
          <g>
            <path d="M15 78 Q6 86 9 97" />
            <path d="M104 76 Q113 80 112 90" />
          </g>
        )}
      </g>
      <g fill="#f8e4bb" stroke="#3b2a1d" stroke-width="3">
        {show.wave && <circle cx="111" cy="41" r="5.5" />}
        {show.think && <circle cx="83" cy="92" r="5.5" />}
        {show.cheer && (
          <g>
            <circle cx="10" cy="34" r="5.5" />
            <circle cx="110" cy="34" r="5.5" />
          </g>
        )}
        {show.alarm && <circle cx="9" cy="42" r="5.5" />}
      </g>
      {show.wave && (
        <path
          d="M118 31 l6 -4 M120 42 l7 0"
          style={{ stroke: ACCENT }}
          stroke-width="3"
          stroke-linecap="round"
        />
      )}
      {show.think && (
        <text
          x="100"
          y="34"
          font-size="24"
          font-weight="700"
          style={{ fill: ACCENT, fontFamily: FONT }}
        >
          ?
        </text>
      )}
      {show.cook && (
        <g>
          <path d="M113 66 L117 30" stroke="#b07a45" stroke-width="4" stroke-linecap="round" />
          <ellipse
            cx="117.5"
            cy="25"
            rx="5"
            ry="7"
            fill="#b07a45"
            stroke="#3b2a1d"
            stroke-width="2"
          />
          <circle cx="46" cy="25" r="10" fill="#fff" stroke="#3b2a1d" stroke-width="3" />
          <circle cx="74" cy="25" r="10" fill="#fff" stroke="#3b2a1d" stroke-width="3" />
          <circle cx="60" cy="18" r="12" fill="#fff" stroke="#3b2a1d" stroke-width="3" />
          <rect x="41" y="23" width="38" height="10" fill="#fff" />
          <rect
            x="40"
            y="30"
            width="40"
            height="12"
            rx="3"
            fill="#fff"
            stroke="#3b2a1d"
            stroke-width="3"
          />
        </g>
      )}
      {show.cheer && (
        <g>
          <rect
            x="30"
            y="14"
            width="6"
            height="6"
            rx="1"
            style={{ fill: ACCENT }}
            transform="rotate(20 33 17)"
          />
          <circle cx="60" cy="14" r="3.5" fill="#f2c94c" />
          <rect
            x="84"
            y="16"
            width="6"
            height="6"
            rx="1"
            fill="#6fcf97"
            transform="rotate(-25 87 19)"
          />
          <circle cx="44" cy="30" r="2.5" fill="#6fcf97" />
          <circle cx="78" cy="30" r="2.5" style={{ fill: ACCENT }} />
        </g>
      )}
      {show.sleep && (
        <g style={{ fill: ACCENT, fontFamily: FONT }} font-weight="700">
          <text x="92" y="34" font-size="16">
            z
          </text>
          <text x="104" y="22" font-size="12">
            z
          </text>
          <text x="113" y="12" font-size="9">
            z
          </text>
        </g>
      )}
      {show.heart && (
        <path
          d="M60 106 C47 98 47 87 54 87 C57.5 87 60 90 60 90 C60 90 62.5 87 66 87 C73 87 73 98 60 106 Z"
          style={{ fill: ACCENT }}
          stroke="#3b2a1d"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
      )}
      {show.lock && (
        <g>
          <path
            d="M106 92 V86 a7 7 0 0 1 14 0 V92"
            fill="none"
            stroke="#3b2a1d"
            stroke-width="4"
            stroke-linecap="round"
          />
          <rect
            x="101"
            y="91"
            width="24"
            height="19"
            rx="5"
            style={{ fill: ACCENT }}
            stroke="#3b2a1d"
            stroke-width="3"
          />
          <circle cx="113" cy="98.5" r="2.6" fill="#3b2a1d" />
          <path d="M113 100 V104" stroke="#3b2a1d" stroke-width="2.6" stroke-linecap="round" />
          <path
            d="M129 84 l5 -3 M130 94 l6 0 M126 76 l2 -5"
            stroke="#f2c94c"
            stroke-width="3"
            stroke-linecap="round"
          />
        </g>
      )}
      {show.wink && (
        <g fill="none" stroke="#3b2a1d" stroke-width="3" stroke-linecap="round">
          <path d="M67 69 Q72 73 77 69" />
        </g>
      )}
      {show.alarm && (
        <g>
          <circle cx="106" cy="40" r="15" fill="#fff" stroke="#3b2a1d" stroke-width="3" />
          <circle
            cx="96"
            cy="25"
            r="4.5"
            style={{ fill: ACCENT }}
            stroke="#3b2a1d"
            stroke-width="2.5"
          />
          <circle
            cx="116"
            cy="25"
            r="4.5"
            style={{ fill: ACCENT }}
            stroke="#3b2a1d"
            stroke-width="2.5"
          />
          <path
            d="M106 31 V40 L112 44"
            fill="none"
            stroke="#3b2a1d"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <path
            d="M88 30 l-5 -4 M86 40 l-6 0"
            style={{ stroke: ACCENT }}
            stroke-width="3"
            stroke-linecap="round"
          />
        </g>
      )}
    </svg>
  );
}

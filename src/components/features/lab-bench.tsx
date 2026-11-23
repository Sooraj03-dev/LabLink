export function LabBench() {
  return (
    <figure className="lab-bench">
      <svg
        viewBox="0 0 640 420"
        role="img"
        aria-labelledby="bench-title bench-description"
      >
        <title id="bench-title">Campus lab bench</title>
        <desc id="bench-description">
          An oscilloscope reading a signal beside a development board and a
          beaker.
        </desc>
        <defs>
          <pattern
            id="bench-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path d="M24 0H0v24" fill="none" stroke="var(--bench-grid)" />
          </pattern>
          <pattern
            id="scope-grid"
            width="25"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M25 0H0v20"
              fill="none"
              stroke="var(--bench-stroke)"
              opacity=".45"
            />
          </pattern>
        </defs>

        <rect width="640" height="420" fill="var(--bench-background)" />
        <rect
          x="24"
          y="24"
          width="592"
          height="372"
          fill="url(#bench-grid)"
          stroke="var(--bench-grid)"
        />
        <path
          d="M24 46V24h22m548 0h22v22m0 328v22h-22m-548 0H24v-22"
          fill="none"
          stroke="var(--bench-stroke)"
        />
        <path
          d="M46 333h548m-507 13h467m-442 11h418"
          stroke="var(--bench-grid)"
          fill="none"
        />
        <ellipse
          cx="321"
          cy="324"
          rx="241"
          ry="20"
          fill="var(--bench-shadow)"
        />

        <g stroke="var(--bench-stroke)" strokeWidth="2" strokeLinejoin="round">
          <path
            d="M104 109l26-23h308l27 23v172l-32 19H105Z"
            fill="var(--bench-instrument-dark)"
          />
          <path d="M433 111l32-2m-32 191V111l-303-25" fill="none" />
          <rect
            x="88"
            y="108"
            width="345"
            height="192"
            rx="9"
            fill="var(--bench-instrument)"
          />
          <path
            d="M105 301h31v12h-31zm271 0h31v12h-31z"
            fill="var(--bench-instrument-dark)"
          />
          <rect
            x="104"
            y="126"
            width="234"
            height="141"
            rx="5"
            fill="var(--bench-shadow)"
          />
          <rect
            x="121"
            y="142"
            width="200"
            height="110"
            fill="url(#scope-grid)"
            stroke="var(--bench-grid)"
          />
          <path d="M221 142v110m-100-55h200" opacity=".55" />
          <path
            d="M122 198h22c23 0 19-38 39-38s21 76 41 76 20-63 41-63 15 40 33 40h22"
            fill="none"
            stroke="var(--signal)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle
            cx="367"
            cy="148"
            r="11"
            fill="var(--bench-instrument-dark)"
          />
          <circle
            cx="404"
            cy="148"
            r="11"
            fill="var(--bench-instrument-dark)"
          />
          <circle
            cx="367"
            cy="184"
            r="11"
            fill="var(--bench-instrument-dark)"
          />
          <circle
            cx="404"
            cy="184"
            r="11"
            fill="var(--bench-instrument-dark)"
          />
          <path
            d="M367 144v-6m38 10l6-4m-47 43l-4 4m44-5l3 6"
            stroke="var(--bench-highlight)"
            strokeLinecap="round"
          />
          <path
            d="M354 216h24v9h-24zm36 0h24v9h-24zm-36 19h24v9h-24zm36 0h24v9h-24z"
            fill="var(--bench-instrument-dark)"
          />
          <circle cx="367" cy="270" r="9" fill="var(--bench-shadow)" />
          <circle cx="404" cy="270" r="9" fill="var(--bench-shadow)" />
          <circle
            cx="367"
            cy="270"
            r="3"
            fill="var(--signal)"
            stroke="var(--signal)"
          />
          <path
            d="M110 283h18m8 0h18m8 0h18m8 0h18m8 0h18"
            strokeLinecap="round"
          />
        </g>

        <path
          d="M374 270c22 6 40 21 39 45-2 26-50 33-101 21"
          fill="none"
          stroke="var(--signal)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <g
          transform="translate(164 288) rotate(-7 75 34)"
          stroke="var(--bench-stroke)"
          strokeWidth="1.5"
        >
          <rect
            x="5"
            y="5"
            width="151"
            height="65"
            rx="6"
            fill="var(--bench-shadow)"
          />
          <rect width="151" height="65" rx="6" fill="var(--bench-board)" />
          <path
            d="M27 20h36l10 10h20m-66 15h23l10-10h33m19-13h13l9 10h17m-39 13h13l9-9h17"
            fill="none"
            opacity=".75"
          />
          <path
            d="M17 12h42m-42 41h42m55-41h22m-22 41h22"
            strokeDasharray="2 4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect
            x="66"
            y="19"
            width="34"
            height="28"
            rx="2"
            fill="var(--bench-shadow)"
          />
          <rect
            x="-6"
            y="22"
            width="24"
            height="21"
            rx="2"
            fill="var(--bench-instrument)"
          />
          <circle cx="111" cy="33" r="3" fill="var(--signal)" stroke="none" />
        </g>

        <g transform="translate(476 142)">
          <path
            d="M1 0h91l-12 17v130a17 17 0 0 1-17 17H19a17 17 0 0 1-17-17V13L-7 0Z"
            fill="var(--bench-instrument)"
            fillOpacity=".46"
            stroke="var(--bench-highlight)"
            strokeWidth="2"
          />
          <path
            d="M8 93c13 6 22-7 37-4 13 4 18 7 29 2v55c0 7-5 12-12 12H20c-7 0-12-5-12-12Z"
            fill="var(--signal)"
            opacity=".84"
          />
          <path
            d="M12 43h15m-15 17h9m-9 17h15m-15 17h9m-9 17h15m-15 17h9"
            fill="none"
            stroke="var(--bench-highlight)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <g
            className="bench-bubbles"
            fill="none"
            stroke="var(--bench-highlight)"
            opacity=".7"
          >
            <circle cx="42" cy="118" r="4" />
            <circle cx="54" cy="104" r="3" />
            <circle cx="55" cy="134" r="5" />
          </g>
        </g>
      </svg>
    </figure>
  );
}

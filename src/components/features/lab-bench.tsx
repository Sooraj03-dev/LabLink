"use client";
import { ScopeControls, BenchPlayback } from "./scope-controls";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { inventory } from "@/lib/inventory";
import { useMotionPreference } from "@/components/ui/motion-preference";

type Hotspot = "scope" | "esp32" | "beaker" | null;

function useBenchHotspots() {
  const [active, setActive] = useState<Hotspot>(null);
  const reduced = useMotionPreference();
  const [ledOn, setLedOn] = useState(false);
  const [bubbling, setBubbling] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleESP = useCallback(() => {
    setActive((prev) => (prev === "esp32" ? null : "esp32"));
    setLedOn((v) => !v);
  }, []);

  const triggerBubbles = useCallback(() => {
    setActive((prev) => (prev === "beaker" ? null : "beaker"));
    if (!reduced) {
      setBubbling(true);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubbling(false), 800);
    }
  }, [reduced]);

  useEffect(() => {
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, []);

  return { active, setActive, ledOn, bubbling, toggleESP, triggerBubbles };
}

export function LabBench() {
  const { active, setActive, ledOn, bubbling, toggleESP, triggerBubbles } =
    useBenchHotspots();

  const dimClass = (target: Hotspot) =>
    active && active !== target ? " bench-dim" : "";

  return (
    <figure className="lab-bench">
      <div className="bench-drawing">
        <svg
          viewBox="0 0 640 420"
          role="group"
          aria-label="Interactive oscilloscope"
        >
          <title id="bench-title">Campus lab bench</title>
          <desc id="bench-description">
            An oscilloscope reads a development board beside a beaker and a
            compact spectrometer.
          </desc>
          <defs>
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

          <path d="M46 333h548" stroke="var(--bench-grid)" fill="none" />
          <ellipse
            cx="321"
            cy="324"
            rx="241"
            ry="20"
            fill="var(--bench-shadow)"
          />

          {/* Oscilloscope body */}
          <g
            className={"scope-group" + dimClass("scope")}
            stroke="var(--bench-stroke)"
            strokeWidth="2"
            strokeLinejoin="round"
          >
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
              d="M118 150v-11h12m183 116h11v-12"
              fill="none"
              stroke="var(--bench-highlight)"
            />
            <ScopeControls />
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
              d="M364 187l-4 4m44-5l3 6"
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

          {/* Probe wire */}
          <path
            d="M374 270c22 6 40 21 39 45-2 26-50 33-101 21"
            fill="none"
            stroke="var(--signal)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="probe-pulse"
            d="M374 270c22 6 40 21 39 45-2 26-50 33-101 21"
            pathLength="100"
            fill="none"
            stroke="var(--bench-highlight)"
            strokeWidth="3"
            strokeDasharray="4 100"
          />

          {/* ESP32 board — interactive */}
          <g
            className={
              "esp32-group bench-hotspot" +
              dimClass("esp32") +
              (active === "esp32" ? " bench-hotspot--active" : "")
            }
            transform="translate(164 288) rotate(-7 75 34)"
            stroke="var(--bench-stroke)"
            strokeWidth="1.5"
            role="button"
            tabIndex={0}
            aria-label="ESP32 prototyping kit — click to toggle status LED"
            onClick={toggleESP}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleESP();
              }
            }}
            onMouseEnter={() => setActive("esp32")}
            onMouseLeave={() => {
              if (active === "esp32") setActive(null);
            }}
            onFocus={() => setActive("esp32")}
            onBlur={() => {
              if (active === "esp32") setActive(null);
            }}
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
            <circle
              className={"board-led" + (ledOn ? " board-led--on" : "")}
              cx="111"
              cy="33"
              r="3"
              fill="var(--signal)"
              stroke="none"
            />
          </g>

          {/* Beaker — interactive */}
          <g
            className={
              "beaker-group bench-hotspot" +
              dimClass("beaker") +
              (active === "beaker" ? " bench-hotspot--active" : "")
            }
            transform="translate(476 142)"
            role="button"
            tabIndex={0}
            aria-label="Visible-light spectrometer beaker — click for bubble burst"
            onClick={triggerBubbles}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                triggerBubbles();
              }
            }}
            onMouseEnter={() => setActive("beaker")}
            onMouseLeave={() => {
              if (active === "beaker") setActive(null);
            }}
            onFocus={() => setActive("beaker")}
            onBlur={() => {
              if (active === "beaker") setActive(null);
            }}
          >
            <path
              d="M1 0h91l-12 17v130a17 17 0 0 1-17 17H19a17 17 0 0 1-17-17V13L-7 0Z"
              fill="var(--bench-instrument)"
              fillOpacity=".46"
              stroke="var(--bench-highlight)"
              strokeWidth="2"
            />
            <defs>
              <clipPath id="beaker-interior">
                <rect x="8" y="81" width="66" height="77" rx="9" />
              </clipPath>
            </defs>
            <g clipPath="url(#beaker-interior)">
              <path
                className="liquid-surface"
                d="M-24 93q12-5 24 0t24 0t24 0t24 0t24 0v72H-24Z"
                fill="var(--bench-stroke)"
                opacity=".84"
              />
            </g>
            <path
              d="M12 43h15m-15 17h9m-9 17h15m-15 17h9m-9 17h15m-15 17h9"
              fill="none"
              stroke="var(--bench-highlight)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <g
              className={
                "bench-bubbles" + (bubbling ? " bench-bubbles--burst" : "")
              }
              fill="none"
              stroke="var(--bench-highlight)"
              opacity=".7"
            >
              <circle cx="42" cy="118" r="4" />
              <circle cx="54" cy="104" r="3" />
              <circle cx="55" cy="134" r="5" />
              {/* Extra burst bubbles */}
              <circle className="burst-b" cx="38" cy="126" r="2.5" />
              <circle className="burst-b" cx="60" cy="114" r="2" />
              <circle className="burst-b" cx="48" cy="98" r="3" />
            </g>
          </g>

          {/* Spectrometer */}
          <g
            className={"spectrometer-group" + dimClass("beaker")}
            transform="translate(445 282)"
            stroke="var(--bench-stroke)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <path d="M0 13 17 2h74l-13 11Z" fill="var(--bench-instrument)" />
            <path d="M0 13h78v25H0Z" fill="var(--bench-instrument-dark)" />
            <path d="m78 13 13-11v25L78 38Z" fill="var(--bench-shadow)" />
            <circle cx="17" cy="26" r="5" fill="var(--bench-shadow)" />
            <path d="M32 24h29m-29 4h22" />
          </g>

          {/* Leader lines with pathLength for draw-in */}
          <g
            className={"leaders" + (active ? " leaders--highlight" : "")}
            aria-hidden="true"
            fill="none"
            stroke="var(--bench-stroke)"
          >
            <path
              className={active === "scope" ? "leader-active" : ""}
              d="M153 108l-24-40H62"
              pathLength="100"
            />
            <path
              className={active === "esp32" ? "leader-active" : ""}
              d="M277 313l-32 56h-83"
              pathLength="100"
            />
            <path
              className={active === "beaker" ? "leader-active" : ""}
              d="M497 306l36 39h57"
              pathLength="100"
            />
            <g fill="var(--bench-highlight)">
              <circle cx="153" cy="108" r="3" />
              <circle cx="277" cy="313" r="3" />
              <circle cx="497" cy="306" r="3" />
            </g>
          </g>

          {/* ESP32 tooltip */}
          {active === "esp32" && (
            <foreignObject x="60" y="358" width="200" height="60">
              <div className="bench-tooltip">
                <span>
                  {inventory("esp32-prototyping-kit").free} free · LED{" "}
                  {ledOn ? "ON" : "OFF"}
                </span>
                <a href="/discover?q=ESP32">View in catalogue →</a>
              </div>
            </foreignObject>
          )}
        </svg>
        <div
          className={
            "bench-annotations" + (active ? " bench-annotations--hotspot" : "")
          }
        >
          {[
            ["mixed-signal-oscilloscope", "Mixed-signal oscilloscope", "scope"],
            ["esp32-prototyping-kit", "ESP32 prototyping kit", "esp32"],
            ["optical-spectrometer", "Visible-light spectrometer", "beaker"],
          ].map(
            ([id, name, hotspot]) =>
              id && (
                <Link
                  prefetch={false}
                  key={id}
                  href={"/resources/" + id}
                  className={active === hotspot ? "annotation--active" : ""}
                  onMouseEnter={() => setActive(hotspot as Hotspot)}
                  onMouseLeave={() => setActive(null)}
                >
                  {name}
                  <small>{inventory(id).free} free · sample</small>
                </Link>
              ),
          )}
        </div>
      </div>
      <figcaption className="bench-caption">
        <span>Drag a dial or use the arrow keys</span>
        <BenchPlayback />
      </figcaption>
    </figure>
  );
}

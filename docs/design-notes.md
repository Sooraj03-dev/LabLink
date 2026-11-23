# LabLink visual and motion plan

## Three design principles

1. **Let the instrument explain itself.** Turning the time knob should spread or compress the waveform horizontally. Turning the voltage knob should change its height. A visitor should understand what they changed by looking at the screen.
2. **Give orange a job.** Reserve the signal colour for the powered trace, activity indicators and actionable controls. Let type, spacing and hairlines establish hierarchy.
3. **Give the reader control of the pace.** Power up the bench once per session. Tie notebook turns to scrolling. Keep the catalogue readable while filters change and give the scope a pause control.

## Colour and type

| Existing token                        | Hex       | Placement                                                     |
| ------------------------------------- | --------- | ------------------------------------------------------------- |
| Paper `--paper` in the light theme    | `#F4F1E8` | Notebook sheets and headline lettering against the dark bench |
| Ink `--ink` in the light theme        | `#14202B` | Body copy on paper and the night-lab base                     |
| Bench background `--bench-background` | `#152431` | Full-width work surface behind the hero                       |
| Instrument `--bench-instrument`       | `#314955` | Raised scope housing                                          |
| Bench stroke `--bench-stroke`         | `#708C9A` | Engraved divisions and leader lines                           |
| Signal `--signal`                     | `#E8590C` | Powered trace, active indicators and primary actions          |

Fraunces sets the headline and notebook titles. Public Sans carries instructions, buttons and resource names. JetBrains Mono sets the scope scales, measured specs and inventory counts. The dark work surface provides contrast for the paper-coloured headline in either theme.

## Hero at 1440 px

```text
LabLink                                       My workspace    Browse catalogue
-----------------------------------------------------------------------------
                                             Mixed-signal oscilloscope
The right kit                                  / 200 MHz
for every project.                   +--------o--------------+     optics bench
                                     |   /\      /\    T   V |         /
Find equipment across campus ...     |  /  \____/  \   o   o |        o
                                     +-----------------------+   [optics][beaker]
[Explore the catalogue]                [ESP32 board]---probe
See how it works                           o
                                            \ ESP32 prototyping kit
----------------------------------------------------------------------------- bench
On the bench                                  8 sample resources across 7 labs
```

Centre the composition in the available viewport height beneath the header. The bench extends to the right edge. The surface line spans the page and introduces the catalogue at the fold. Leave at least 1.5rem beneath the headline and limit supporting copy to 52ch.

## Hero at 390 px

```text
LabLink             My workspace
                    Browse catalogue
-------------------------------------
The right kit
for every project.

Find equipment across campus ...
[Explore the catalogue]
See how it works

     +------------------------+
     |    /\     /\     T   V |  [jar]
     | __/  \___/  \    o   o | [optics]
     +------------------------+
        [ESP32]---probe
-------------------------------------
Mixed-signal oscilloscope      200 MHz
ESP32 prototyping kit      Wi-Fi / BLE
Visible-light spectrometer  380-780 nm
```

Keep both knobs inside the viewport with generous touch targets. Move long link text beneath the drawing on narrow screens. Allow the bench to flow lower on short screens and at increased text sizes.

## Catalogue annotations

Derive resource and lab totals from the catalogue. Each leader links to its resource detail page and uses the recorded spec shown above. The inventory has no daily availability field. Use the spec until a real free-unit count exists. Place the third leader on the visible-light spectrometer beside the beaker so the glassware is identified correctly.

## Motion and implementation order

1. **Landing page.** Draw the 24px grid and 120px major divisions over static paper grain. Remove the outer illustration frame and retain two screen registration marks. Over about 1.2 seconds, draw the major grid, lift headline lines from their line boxes, power up the screen, sweep the trace and reveal its labels. Keep the headline, links and copy in the server HTML. Skip the entrance on repeat visits and when reduced motion is selected.
2. **Playable bench.** Make the upper knobs labelled sliders with drag, wheel and arrow-key input, a visible focus ring and scale readouts. Run the seamless trace on an eight-second loop. Keep the beaker surface, bubbles, board LED and probe pulse within the bench. Pause autonomous motion offscreen, in a hidden tab, when manually paused, and for reduced motion. Both knobs still change the static waveform.
3. **Lab notebook.** Show discovery with a catalogue example, approval with an assigned review request, and allocation with a clearly labelled scheduling example. On wide screens, turn the three sheets around their left spine as the reader scrolls. Stack them below 768px, for reduced motion and in browsers without the scroll-animation enhancement.
4. **App shell and catalogue.** Give navigation a drawn underline on focus or hover. Add a header rule on scroll, a short press response on buttons, and a success stamp after confirmed actions. Preserve the shareable GET filter form and browser history. Roll changed result digits and use a 150ms opacity transition for changed resources. Keep the specimen-tag swing on resource cards and cap it at three degrees. Use the shared motion preference throughout. Load any Motion features through LazyMotion with domAnimation.

## Review of the current design

Removed the uppercase hero eyebrow and the orange headline phrase from the proposed composition. Replaced the framed drawing with an instrument resting on the same surface as the copy. Neutral glass and liquid give the live trace the strongest contrast. The notebook uses a spine and ruled paper. Catalogue entries use alignment and type to group information. Gradients, repeated section entrances, card lifts, soft card shadows and appended button arrows are excluded from the plan.

## Verification after approval

Capture the start, middle and end at 1440×900, 1024×768 and 390×844 in paper and night themes. Check headline clearance, knob reach, annotation overlap and reflow. Remove one detail that competes with the scope after visual review.

Add Playwright checks for a trace that stays still for 500ms with reduced motion, ArrowRight increasing the knob value, and axe results in both themes. Measure the production build against mobile LCP ≤2.5s, CLS 0, hero client code ≤12KB gzip, total added JavaScript ≤25KB gzip and zero animation-caused tasks over 50ms. Run Lighthouse CI, lint, type checking and tests, and record measured results alongside the corresponding changes.

## Implemented and checked

The expanded brief adds illustrative inventory counts. The three bench labels now link to the corresponding catalogue entries and show their sample stock. On desktop the labels sit at the ends of the leader lines. On narrower screens they sit below the drawing. Visual review covered the start, midpoint and end of the entrance in both themes at all three planned sizes. The final layout keeps the headline to three lines at the reference sizes, removes two redundant bench-surface strokes and fits the tablet viewport.

The browser suite checks all three main-page demo roles, a student submission and faculty approval, catalogue filters and layout, the equipment gallery, mobile navigation, keyboard input and reduced motion. The homepage passed axe in paper and night themes. A separate exercise against the local Firebase emulators verified that the reviewed request persisted with the assigned reviewer's ID.

Compared with a clean production build of `2423937`, the sum of gzipped JavaScript files in `.next/static/chunks` grew by 22,661 bytes including the equipment assistant. The homepage-specific client chunk is 2,105 bytes gzip. On the local phone-sized Edge viewport, a PerformanceObserver recorded zero tasks over 50 ms during the power-on sequence and a subsequent eight-second trace cycle.

With the assistant included, the final three-run Lighthouse CI check measured a median mobile largest contentful paint of 761 ms and cumulative layout shift of zero on the local production build.

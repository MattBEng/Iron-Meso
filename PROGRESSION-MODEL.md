# Progression model — the reasoning behind the numbers

Why the app suggests what it suggests. Written so a future session (human or
AI) can re-derive or challenge these choices without starting from scratch.

---

## 1. The core claim: reps and load are interchangeable for growth

Hypertrophy is essentially equivalent across a wide rep range — roughly
**5 to 30 reps** — *provided sets are taken close to failure*. This is
well-replicated in the literature (Schoenfeld's meta-analyses; Morton et al.).
Heavier loads favour maximal strength, but for muscle growth **effort and
proximity to failure matter more than the number on the dumbbell**.

**Consequence for this app:** when the next weight isn't available, adding reps
is not a holding pattern or a consolation prize — it is a fully valid
progression. The app says so plainly rather than nagging for load.

**Double progression** follows directly and is what the app implements: work a
rep range at a fixed load, add reps until the top of the range, then take the
weight jump and land back near the bottom. Repeat.

---

## 2. Converting a load change into a rep change

### Why not just pick one equation

1RM prediction equations (Epley, Brzycki, Wathan, Mayhew, Lombardi, O'Conner)
are the standard tool. **They disagree badly at the rep ranges this app lives
in.** From a real example — 15 kg × 15 reps:

| Equation | Estimated 1RM |
|---|---|
| Lombardi | 19.7 kg |
| O'Conner | 20.6 kg |
| Mayhew | 21.3 kg |
| Epley | 22.5 kg |
| Wathan | 22.6 kg |
| Brzycki | 24.6 kg |

A ~25 % spread. Predicted reps at 17.5 kg range from **7.3 to 12.1** depending
on the equation. No single one is defensible on its own here.

These equations are validated mainly at **1–10 reps** and degrade beyond ~12.
Brzycki over-predicts at high reps (it has an asymptote at 37 reps); Epley
under-predicts (it is linear where reality curves).

### What the app does

**Average Epley and Brzycki, applied consistently in both directions.** They
bracket the true value from opposite sides, and averaging several equations is
a documented way to reduce individual-equation error.

```
e1RM  = ( w·(1 + r/30)  +  w·36/(37 − r) ) / 2
reps  = ( 30·(1RM/w − 1) + (37 − 36·w/1RM) ) / 2
```

Implemented as `e1rmAvg()` and `repsAtLoad()`.

**Honest error bar: about ±2 reps** at 12–15 reps. The app does not pretend
otherwise — see the trusted band below.

### Worked example (the one this was designed against)

Session: **15 kg × 15 / 14 / 12**

| Next load | Change | Suggested reps |
|---|---|---|
| 16 kg | +6.7 % | 13 / 12 / 10 |
| **17.5 kg** | **+16.7 %** | **10 / 9 / 7** |
| 20 kg | +33 % | 6 / 5 / ?? |
| 50 kg | +233 % | ?? / ?? / ?? |
| hold 15 kg | 0 % | 16 / 15 / 13 |

Each set is predicted from **its own** performance, which preserves the natural
set-to-set drop-off.

### Rule of thumb it produces

Roughly **3 % of load ≈ 1 rep** in this range, which agrees with the standard
%1RM–rep tables. Rep cost from a 12-rep set:

| Load jump | Reps kept | Reps lost |
|---|---|---|
| +2.5 % | 11.3 | 0.7 |
| +5 % | 10.5 | 1.5 |
| +10 % | 8.9 | 3.1 |
| +20 % | 6.0 | 6.0 |
| +33 % | 2.7 | 9.3 |
| +50 % | — | not survivable |

---

## 3. The trusted band — when the app says "??"

Predictions outside validated territory return `null`, rendered as **`??`**
rather than a confident-looking number. Triggers:

- predicted reps below **3** or above **25** (`E1RM_MIN_REPS` / `E1RM_MAX_REPS`)
- the requested load is **at or above the estimated 1RM** (mathematically
  undefined — e.g. asking for 50 kg when the estimate is 23.5 kg)

Admitting uncertainty beats printing "1 rep" and looking foolish.

---

## 4. Small muscles vs big muscles

**Percentages handle this automatically.** A 2.5 kg jump is +16.7 % on a 15 kg
curl and +1.25 % on a 200 kg leg press. Working in percentage of the load means
no separate small/large-muscle rule is needed.

**The one real caveat:** research on reps-at-%1RM across different exercises
found large differences — big lower-body compounds allow substantially more
reps at a given %1RM than small isolation movements. So a generic equation
slightly under-predicts leg press and over-predicts curls. This is *not*
hard-coded as muscle modifiers (weak evidence, more knobs to get wrong). The
better fix, if ever wanted, is fitting each exercise's own load–rep
relationship from the user's logged history.

---

## 5. The granularity problem, and the jump-aware ceiling

### The problem

For small-muscle work the smallest available jump is enormous in relative
terms. A lateral raise going 5 → 7.5 kg is **+50 %**:

| From 5 kg × … | Lands at 7.5 kg × … |
|---|---|
| 12 reps | not possible |
| 15 reps | 2 reps |
| **20 reps** | **8 reps** ← first viable point |
| 25 reps | 16 reps |

You must **bank reps to ~20 before that jump is even physically available.**
A flat "ceiling = target + 4" would cap you at 16 reps, push weight anyway, and
prescribe something undoable.

### The fix

`repCeilingFor(ex, kg, targetReps)` derives the ceiling from **the size of the
next available jump**: keep adding reps until the jump would land at a
trainable rep count (`LANDING_REPS = 8`), then stop and take the weight.

- Big lift, tiny % jump (100 → 102.5 kg) → ceiling ≈ **10** → add weight soon.
- Small dumbbell, huge % jump (5 → 7.5 kg) → ceiling ≈ **20** → keep repping.

This is ordinary double progression, made aware of your equipment.

### Reps needed before a jump lands at ~10 reps

| Situation | Reps to bank first |
|---|---|
| Barbell +2.5 % | ~11 |
| +10 % | ~13 |
| 15 → 17.5 kg dumbbell | ~15 |
| 10 → 12.5 kg | ~17 |
| 5 → 7.5 kg lateral raise | ~22 |

### Microloading changes the picture materially

Same lateral raise with a 1 kg jump (5 → 6 kg, +20 %) instead of 2.5 kg:
from 15 reps you land at **9 reps** instead of 2. Fractional plates, magnetic
add-ons, and cable stacks with finer increments are the cleanest fix for
small-muscle progression — which is exactly what the per-exercise
**"smallest weight jump"** field is for.

---

## 6. Never both at once

Weight and reps are two routes to the same overload. Demanding both in the same
week is a double increase and too aggressive.

- Weight **held** → add a rep to each set.
- Weight **raised** → carry the same effort to the new load, which means
  **fewer** reps, predicted by the model above.

The old behaviour carried last week's reps forward onto a heavier bar. That was
wrong and is fixed in `buildGhostRows()`.

**Exception:** when the user explicitly taps *"can't add weight?"*, they have
declared the next load unavailable, so the ceiling must never clamp them below
what they already did — the target is always at least `lastReps + 1`.

---

## 7. Where this lives in the code

| Thing | Function |
|---|---|
| Averaged 1RM estimate | `e1rmAvg(kg, reps)` |
| Predicted reps at a load | `repsAtLoad(refKg, refReps, kg)` → `null` = `??` |
| Per-exercise increment | `exStep(ex)`, defaults in `DEFAULT_STEP` |
| Jump-aware ceiling | `repCeilingFor(ex, kg, targetReps)` |
| Ghost reps for next session | `buildGhostRows()` |
| Live re-prediction on override | the `data-f="kg"` branch in the input handler |
| Explicit hold-weight route | `holdWeightRepProgress()` |
| Constants | `E1RM_MIN_REPS`, `E1RM_MAX_REPS`, `LANDING_REPS`, `CEILING_MIN/MAX` |

Tests: `TESTS_loadrep.js` (25 checks) covers prediction accuracy, the trusted
band, per-exercise steps, the jump-aware ceiling, the never-both rule, and live
re-prediction.

---

## 8. Known limitations

- Prediction error is **±2 reps** at 12–15 reps. Unavoidable with generic
  equations.
- The model assumes sets are taken to a similar proximity to failure. Sandbagged
  sets in, garbage out.
- Exercise-specific load–rep differences are not modelled (see §4).
- `LANDING_REPS = 8` is a judgement call, not a research finding — it is the rep
  count judged "worth training at" after a jump. Adjustable in one place.

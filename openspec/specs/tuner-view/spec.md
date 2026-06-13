# tuner-view Specification

## Purpose

Redesigned instrument tuner view with radial gauge visualization, enhanced string reference, and polished interaction feedback — replacing the current linear meter with a circular gauge.

## Requirements

### Requirement: Radial Gauge Visualization

The tuner MUST display a radial gauge (semicircle or full arc) that visualizes pitch deviation. The indicator needle or dot MUST move left (flat), center (in-tune), or right (sharp) along the arc with smooth animation.

#### Scenario: Gauge needle responds to pitch

- GIVEN the tuner is active and receiving audio input
- WHEN the detected pitch is within ±5 cents of the target
- THEN the gauge indicator MUST rest at center position, and the gauge fill MUST be accent color
- WHEN the pitch is > 10 cents flat
- THEN the indicator MUST shift left along the arc proportionally
- WHEN the pitch is > 10 cents sharp
- THEN the indicator MUST shift right along the arc proportionally

#### Scenario: Gauge colors indicate tuning state

- GIVEN the gauge indicator is at center (in-tune)
- THEN the gauge arc/fill MUST be `--color-accent` (#c8f65a)
- GIVEN the indicator is more than 10 cents off-center
- THEN the gauge arc/fill MUST transition to a warm color (amber for slight, orange/red for far)

#### Scenario: Gauge renders via Canvas

- GIVEN the tuner view is mounted
- WHEN inspecting the tuner container
- THEN a `<canvas>` element MUST render the radial gauge
- AND it MUST NOT use external chart libraries — pure Canvas 2D API

### Requirement: String Reference Display

The tuner MUST show a row of string buttons (6 for guitar, 4 for bass) that the user can tap to set the target note. The active string MUST be highlighted, and the detected note SHALL be displayed near the gauge center.

#### Scenario: String buttons are tappable

- GIVEN the tuner view is visible
- THEN string buttons MUST be displayed in a horizontal row
- WHEN the user taps/selects a string
- THEN that string MUST be visually highlighted (active state)
- AND the target note SHALL update to match the string's standard tuning

#### Scenario: Detected note appears in gauge center

- GIVEN the tuner is running and detecting pitch
- THEN the detected note name + octave (e.g., "A4") MUST be displayed prominently (large font) in the center of the radial gauge
- AND the frequency in Hz MUST be shown below the note name in smaller muted text

### Requirement: Tuner Start/Stop Button

A start/stop toggle button MUST control the audio stream. The button SHOULD show "Comenzar" when stopped and "Detener" when running.

#### Scenario: Button toggles audio capture

- GIVEN the tuner is stopped
- WHEN the user clicks the start button
- THEN the browser MUST request microphone permission via `getUserMedia`
- AND the button MUST change to the stop state

#### Scenario: Microphone permission denied

- GIVEN the user denies microphone access
- WHEN the tuner attempts to start
- THEN an inline error message MUST be displayed (e.g., "Permiso de micrófono denegado")
- AND the button MUST remain in the start (stopped) state

### Requirement: Status Indicator

A status label MUST show the current tuning condition: "In Tune", "Baja" (flat, slide left indicator), or "Alta" (sharp, slide right indicator).

#### Scenario: Labels reflect pitch deviation

- GIVEN the detected pitch is within ±5 cents of target
- THEN the status MUST read "In Tune" and display in accent color
- GIVEN the pitch is > 10 cents below target
- THEN the status MUST read "Baja" and display in amber
- GIVEN the pitch is > 10 cents above target
- THEN the status MUST read "Alta" and display in orange

### Requirement: Hint Text

A contextual hint SHOULD guide the user: "Toca una cuerda para empezar" when idle, and "Sigue tocando..." while the tuner is active.

#### Scenario: Hint updates with state

- GIVEN the tuner is not yet receiving pitch data
- THEN the hint MUST read "Toca una cuerda para empezar"
- GIVEN pitch data is being received
- THEN the hint MUST update to "Sigue tocando..."

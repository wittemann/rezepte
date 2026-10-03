# 0012 – Installable web app, no timers

**Status:** Accepted (2026-09-26, timers removed 2026-10-03)

## Context

The design targets the iPhone, with the app added to the home screen. Cooking mode had timers, and the design wants them to ring even when the phone is locked. On iOS that's only possible with Web Push (iOS 16.4+, and only for web apps added to the home screen). Web Push needs a service worker, VAPID keys, a way to store push subscriptions, and a server-side scheduler that sends the notification at the right time. On Vercel Hobby and Airtable that's a noticeable amount of extra moving parts.

v1 first shipped timers that ran in the page (overlay, sound, vibration while the app was open). In use they were fragile: they went silent after leaving cooking mode (each navigation is a full page load) and never rang with the phone locked. Starting a timer with Siri or Alexa is easier and rings reliably. A web app can't start the iPhone's own timer; the only route, an Apple Shortcut per phone, was too much setup.

## Decision

- **Installable:** a web app manifest (`name` „Kochbuch“, `display: standalone`, theme `#fff6e8`) and icons (180 px from the design, 192/512 px generated from the Maulti SVG)
- **No service worker, no offline mode** in v1 (non-goal in [00-vision](../specs/00-vision.md))
- **No timers in the app** (removed 2026-10-03): no timer chips, no timer button in cooking mode, no time parsing in the steps. Timers are set with Siri, Alexa or the Clock app
- **No Web Push**

## Consequences

- No extra keys, storage or scheduled jobs; nothing extra to secure or pay for
- Less code: no timer store, sound, alarm overlay or `localStorage` state
- The design's timers are a deviation (noted in [05-design-integration](../specs/05-design-integration.md))

## Revisit when

Family members miss timers in the app. Then start with the Shortcuts route or Web Push (verify the current iOS support first).

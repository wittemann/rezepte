# 0012 – Installable web app, timers without push in v1

**Status:** Accepted (2026-09-26)

## Context

The design targets the iPhone, with the app added to the home screen. Cooking mode has timers, and the design wants them to ring even when the phone is locked. On iOS that's only possible with Web Push (iOS 16.4+, and only for web apps added to the home screen). Web Push needs a service worker, VAPID keys, a way to store push subscriptions, and a server-side scheduler that sends the notification at the right time. On Vercel Hobby and Airtable that's a noticeable amount of extra moving parts.

In cooking mode the screen stays on anyway (Wake Lock), so a timer rings while the app is open.

## Decision

- **Installable:** a web app manifest (`name` „Kochbuch“, `display: standalone`, theme `#fff6e8`) and icons (180 px from the design, 192/512 px generated from the Maulti SVG)
- **No service worker, no offline mode** in v1 (non-goal in [00-vision](../specs/00-vision.md))
- **Timers run in the page:** several in parallel; when one ends, the app shows the overlay, plays a sound and vibrates. This works while the app is open, which cooking mode ensures with the Wake Lock
- **No Web Push in v1**

## Consequences

- No extra keys, storage or scheduled jobs; nothing extra to secure or pay for
- A timer does **not** ring if the app is closed or the phone is locked by hand. The design's push behavior is deferred (noted as a deviation in [05-design-integration](../specs/05-design-integration.md))

## Revisit when

Missed timers are a real annoyance in daily use. Then add a service worker and Web Push (verify the current iOS support first).

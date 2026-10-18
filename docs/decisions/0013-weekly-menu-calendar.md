# 0013 – Weekly menu: add a recipe to the calendar as an `.ics` file

**Status:** Proposed (2026-10-18)

## Context

On Sundays the family picks the meals for the coming week and enters them in a shared calendar by hand. The recipe page should help with that: buttons Mo–So that add the recipe as an all-day event on that day. No menu suggestions, no planner in the app: the calendar stays the place where the week is planned.

A web app can't write to the phone's calendar directly. The options:

- **`.ics` file** (iCalendar): served by the app; iOS shows the system "add event" sheet, the user taps „Hinzufügen“. Works with every calendar the phone has (iCloud, Google, Exchange). The calendar **can't be preselected**: iOS uses the default calendar, the user can switch it in the sheet
- **Google Calendar link** (`calendar.google.com/calendar/render?action=TEMPLATE…`): opens Google Calendar with the event filled in. Only works if the family calendar is a Google calendar, and opens a third-party site
- **Calendar subscription** (webcal feed of the planned week): needs a place to store the plan (Airtable table) and a planner UI. That's the planner we don't want

Unclear: whether iOS opens an `.ics` link from a web app on the home screen (`display: standalone`, [ADR 0012](0012-pwa-and-timers.md)) the same way as in Safari, and whether the login cookie is sent with that request.

## Decision

- **`.ics` file per recipe and date:** `GET /recipes/[id]/calendar.ics?date=YYYY-MM-DD`, behind the login like every page. One `VEVENT`: all-day (`DTSTART;VALUE=DATE`, `DTEND` the next day), summary = recipe name, URL = the recipe page. Served with `Content-Type: text/calendar`
- **Which date a button means:** the next occurrence of that weekday after today (tomorrow up to a week from today). On a Sunday, Mo–So are exactly the coming week. The date is computed in the browser (phone's time zone) and shown on the button
- **No calendar choice in the app.** Set the family calendar as the default calendar on the phone (iOS settings: Calendar → Default Calendar)
- **No stored plan:** nothing is written to Airtable

## Consequences

- Small: one route, one pure function that builds the `.ics` text (unit-tested), one button and a sheet
- No third-party requests, no new keys or storage
- One tap more than a direct write (the iOS sheet)
- The design has no such buttons: a round calendar button in the header card (next to the heart) opens a bottom sheet „Wann gibt’s das?“ with one row per day (Montag–Sonntag, with date). Chosen by the project owner from a Claude Design sketch, noted as a deviation in [05-design-integration](../specs/05-design-integration.md)

## To accept

A spike on the iPhone (project owner): a hard-coded `.ics` link opens the "add event" sheet both in Safari and in the home-screen app, with the user logged in. If the home-screen app fails, try a `data:`/blob link or `webcal://` before falling back to Google Calendar links.

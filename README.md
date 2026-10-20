# Snipiko — browser playtest

Play: https://cebakz.github.io/snipiko/

Draw rectangles that match one number, clear rows and columns, and build combos.

This repository contains the deployable browser build. Extra hints and one continue per game are free in this playtest. No AdMob ads are shown in the browser. Saved progress and detailed local play history stay on the player's device/browser. Settings includes a play-history export for voluntary feedback.

The public game sends gameplay events and active-time statistics to PostHog using a pseudonymous browser ID. Usage analytics can be turned off in Settings; Do Not Track is respected. Session replay and automatic click capture are disabled. Local development does not collect. Technical QA visits use `?analytics_test=1` and are excluded from the Snipiko production dashboard. No personal administrative API key is included in this build.

This is a prototype for testing, not the Android/iOS store release.

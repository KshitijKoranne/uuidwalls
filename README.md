# UUIDWalls

**Turn any UUID into a one-of-a-kind generative wallpaper.**

Every device carries a UUID — a fingerprint shared with no machine on earth. UUIDWalls renders it into a deterministic, permanent wallpaper that belongs to no one else.

## Features

- Four pattern families: Flow Field, Voronoi, Geometric, ASCII
- Fully deterministic — same UUID always produces the same wall
- Runs entirely in the browser — no server, no upload, no tracking
- Download at Screen, 2K, or 4K resolution
- Works on any device — Mac, Windows, Linux, iPhone, Android

## How to find your UUID

| Device | Where |
|--------|-------|
| Mac | System Settings → General → About → Hardware UUID |
| Windows | `wmic csproduct get UUID` in Command Prompt |
| Linux | `cat /etc/machine-id` |
| iPhone | Settings → General → About → scroll to UUID |
| Android | Settings → About phone → Status → Android ID |

## Tech

Vanilla HTML/CSS/JS. No dependencies. No build step. No framework.
Generative rendering via Canvas 2D API with seeded Perlin noise, Voronoi distance fields, and geometric tessellation.

---

Built by [KJR Labs](https://kjrlabs.in)

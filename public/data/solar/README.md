# Solar System — data and credits

This bundle covers **2026-01-01 00:00 UTC to 2027-01-01 00:00 UTC**, with all eight planets and **21 selected moons**, not every known moon. No runtime requests to a scientific API are needed. Solar System positions are geometric, not the apparent light-time-corrected view from Earth.

## Position data

Source: [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/), retrieved September 9, 2026. Rebuild with `python3 scripts/prepare-solar.py /tmp/solar-source`. Each JSON includes the exact query, source header and SHA-256 of the source response. The source service is queried sequentially. See the [Horizons API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and [manual](https://ssd.jpl.nasa.gov/horizons/manual.html).

State rows contain `[x, y, z, vx, vy, vz]`, kilometers and kilometers/second, at `start + rowIndex * step` milliseconds since the Unix epoch. The frame is ecliptic J2000. Planets use the Sun as center and daily samples. Moons use their planet as center and hourly samples; their parent-relative positions are added to the planet’s simultaneous heliocentric position. Cubic Hermite interpolation uses both sampled positions and velocities. Between samples this is an approximation, not a fresh numerical ephemeris or a navigation product. Hourly interpolation has its largest relative error for the shortest-period moons, such as Phobos.

Planet path guides show instantaneous osculating two-body ellipses from the dated position and velocity, using solar GM 132712440018 km³/s². Planet positions follow the bundled JPL vectors, not these simplified ellipses. A moon guide traces one representative orbital period from the data near the selected date; a perturbed orbit need not close exactly. At the time-window edges the guide window shifts inward to stay within the available data.

Selected satellites: Moon; Phobos and Deimos; Io, Europa, Ganymede and Callisto; Mimas, Enceladus, Tethys, Dione, Rhea, Titan and Iapetus; Ariel, Umbriel, Titania, Oberon and Miranda; Triton and Proteus.

Mean radii and representative periods: [JPL planetary physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html), [satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/), and [satellite ephemerides](https://ssd.jpl.nasa.gov/sats/ephem/). The default orbital atlas compresses orbital radii with a monotonic logarithmic mapping and enlarges planet meshes for visibility; dated directions and motion follow the JPL samples. A True scale control restores physical distances and radii. Planet close-ups and moon systems always use physical scale, with a floating rendering origin to retain precision. Small dots in true-scale views are visibility markers. Recent-motion trails use the sampled positions. Surface spin is illustrative and independent of orbital playback speed. Playback stops at the end of the available year; it never silently wraps the ephemeris. Moon bundles load locally on demand when selecting their parent system.

## Surface imagery

`/textures/solar/`: **Solar System Scope / INOVE**, [texture library](https://www.solarsystemscope.com/textures/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Based on NASA imagery; colors are adjusted and incomplete areas may be filled. No pixel modifications were made. Textures are mapped to spheres; the ring texture is mapped radially to an illustrative flat ring.

Files: `mercury.jpg`, `venus.jpg` (source `2k_venus_atmosphere.jpg`), `mars.jpg`, `jupiter.jpg`, `saturn.jpg`, `saturn_ring_alpha.png`, `uranus.jpg`, `neptune.jpg`, `sun.jpg`. Source filenames otherwise use `2k_` followed by the local filename, at `https://www.solarsystemscope.com/textures/download/`.

Earth reuses the existing NASA Earth texture and clouds. The Moon reuses its existing photographic map; original attribution is retained in [lunar credits](../moon/README.md). Other selected moons have **schematic colored surfaces**, not photographic detail. Surface rotation, pole orientation, Saturn’s ring orientation and lighting exposure are illustrative. They are not dated physical models. Actual sizes, distances and dated orbital positions are the scientific layer.

Background stars use the existing catalog directions with camera translation removed. They are a distant sky, not a finite nearby shell. Stellar proper motion and parallax are not modeled.

# Credits and asset terms

Original application code: © 2026 [Ethan Rogers](https://x.com/ethanplusai), MIT. Original project: [earth.ethanplus.ai](https://earth.ethanplus.ai).

The code license does not replace the following asset terms. Preserve these credits and linked licenses when redistributing the corresponding files. No endorsement by NASA, JPL, or the other source organizations is implied.

| Assets | Attribution and source | Terms and transformations |
| --- | --- | --- |
| Earth surface, relief, water and cloud maps | NASA-derived imagery distributed through [WebGL Earth](https://github.com/turban/webgl-earth) | [NASA media guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/). Static maps; displayed shading and cloud motion are illustrative. |
| Earth night map | NASA-derived composite distributed through [three-globe](https://github.com/vasturiano/three-globe/tree/master/example/img) | Preserve NASA attribution. Static composite, with brightness and color adjusted in the renderer. |
| `public/textures/moon/` | [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720): NASA SVS / Ernie Wright; LROC / Arizona State University; LOLA | Color converted to JPEG; elevation converted and quantized. [Preparation details](public/data/moon/README.md). |
| `public/textures/solar/` | [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Bundled texture pixels are unmodified; rendering changes exposure and lighting. Provider maps adjust colors and fill some unmapped regions with illustrative terrain. |
| `public/data/solar/*.json` | [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | Prepared state-vector subset with source queries and hashes. [Coverage, preparation, and limitations](public/data/solar/README.md). |
| `public/data/stars.json` | David Nash / Astronomy Nexus, [HYG Database 4.1](https://github.com/astronexus/HYG-Database) | Adapted subset: magnitude ≤ 6.5, selected fields and rounded coordinates. [CC BY-SA 4.0](public/data/HYG-LICENSE.md). Share adaptations of this dataset under that license. |

Three.js (MIT), Vite (MIT), and Playwright (Apache-2.0), and their dependencies retain the licenses shipped in their npm packages. The interface uses system fonts.

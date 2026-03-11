import { BaseAsset } from '../../templates/BaseAsset.js';

/**
 * BulletAsset.js
 * 
 * Modular 2.5D Ammo.
 */
/**
 * BulletAsset.js
 *
 * Procedural 2.5D gun bullet — brass casing, lead tip, metallic sheen.
 * Oriented vertically (tip pointing up) by default.
 * Inherits generate(), testInScene() from BaseAsset.
 */

/**
 * BulletAsset.js
 *
 * Procedural 2.5D gun bullet — brass casing, lead tip, metallic sheen.
 * Supports both horizontal and vertical orientations via a single
 * coordinate-transform system. All geometry is authored in horizontal
 * space (tip → RIGHT) and rotated 90° CW on demand.
 */

export class BulletAsset extends BaseAsset {
  // ── ORIENTATION TOGGLE ────────────────────────────────────────────────────
  //  'horizontal'  →  tip points RIGHT  (default)
  //  'vertical'    →  tip points UP
  //
  //  Change this static property to flip ALL bullets globally,
  //  OR pass { orientation: 'vertical' } per-call in config.
  // ─────────────────────────────────────────────────────────────────────────
  static ORIENTATION = "horizontal";

  static draw(g, c, config = {}) {
    const {
      orientation = BulletAsset.ORIENTATION,

      // ── Geometry ──────────────────────────────────────────────────────────
      halfW = 7, // half-width perpendicular to the barrel axis
      casingLen = 22, // length of the brass casing section
      tipLen = 14, // length of the lead tip section

      // ── Colors : drop shadow ──────────────────────────────────────────────
      colorShadow = 0x000000,

      // ── Colors : brass casing ─────────────────────────────────────────────
      colorCasingDark = 0x7a4e00, // far/shadow side of casing
      colorCasingMid = 0xb87818, // base brass tone
      colorCasingLight = 0xd4a030, // lit face of casing
      colorCasingSheen = 0xf0cc50, // specular strip on casing

      // ── Colors : primer cap ───────────────────────────────────────────────
      colorPrimerRim = 0x8a5c00, // outer primer annulus
      colorPrimerFace = 0xc49020, // primer cap face
      colorPrimerDot = 0x7a4400, // firing-pin strike dent

      // ── Colors : crimp groove ─────────────────────────────────────────────
      colorCrimp = 0x6a3e00,

      // ── Colors : lead tip ─────────────────────────────────────────────────
      colorTipDark = 0x4a4540, // shadow side of ogive
      colorTipMid = 0x7a7268, // base lead tone
      colorTipLight = 0xa09888, // lit face of ogive
      colorTipSheen = 0xd0c8bc, // specular sliver on tip

      // ── Colors : specular ─────────────────────────────────────────────────
      colorGlint = 0xffffff,
    } = config;

    const cx = c.x;
    const cy = c.y;

    // ── COORDINATE TRANSFORM SYSTEM ──────────────────────────────────────────
    //
    // Every shape is written for HORIZONTAL orientation (tip → RIGHT).
    // When orientation === 'vertical', all authored points are rotated
    // 90° CW around the canvas centre (cx, cy) using:
    //
    //   T(x, y)  →  [ cx + (y - cy),   cy - (x - cx) ]
    //
    // Consequences after rotation:
    //   Authored axis    │ H result      │ V result
    //   ─────────────────┼───────────────┼──────────────
    //   +X  (→ tip)      │ right         │ up
    //   -X  (→ primer)   │ left          │ down
    //   +Y  (near/lit)   │ bottom        │ right
    //   -Y  (far/dark)   │ top           │ left
    //
    // For rects and ellipses, width ↔ height swap automatically.

    const isH = orientation !== "vertical";

    /** Transform a single point from authored H-space → screen space. */
    const T = (x, y) =>
      isH ? [x, y] : [cx + (y - cy), cy - (x - cx)];

    /**
     * Filled rectangle.
     * (rx, ry) = top-left corner in H-space, (rw, rh) = dimensions.
     * In V-space the rect is repositioned and width ↔ height are swapped.
     */
    const fillR = (rx, ry, rw, rh) => {
      if (isH) {
        g.fillRect(rx, ry, rw, rh);
      } else {
        const [nx, ny] = T(rx + rw / 2, ry + rh / 2);
        g.fillRect(nx - rh / 2, ny - rw / 2, rh, rw);
      }
    };

    /**
     * Stroked rectangle — same transform as fillR.
     */
    const strokeR = (rx, ry, rw, rh) => {
      if (isH) {
        g.strokeRect(rx, ry, rw, rh);
      } else {
        const [nx, ny] = T(rx + rw / 2, ry + rh / 2);
        g.strokeRect(nx - rh / 2, ny - rw / 2, rh, rw);
      }
    };

    /**
     * Filled ellipse.
     * (ex, ey) = centre, (ew, eh) = full width and height in H-space.
     * In V-space the centre is transformed and ew ↔ eh swap.
     */
    const fillE = (ex, ey, ew, eh) => {
      const [nx, ny] = T(ex, ey);
      g.fillEllipse(nx, ny, isH ? ew : eh, isH ? eh : ew);
    };

    /**
     * Filled triangle — each vertex is individually transformed.
     */
    const fillTri = (x1, y1, x2, y2, x3, y3) => {
      const [ax, ay] = T(x1, y1);
      const [bx, by] = T(x2, y2);
      const [fx, fy] = T(x3, y3);
      g.fillTriangle(ax, ay, bx, by, fx, fy);
    };

    // ── ANCHOR POINTS  (authored in horizontal frame) ─────────────────────
    //
    //  primerX          crimpX       apexX
    //     |<── casingLen ──>|<─ tipLen ─>|
    //     │████████████████│╲           /
    //  topY│████████████████│  ╲       /
    //  botY│████████████████│    ╲___/
    //
    const totalLen = casingLen + tipLen; // 36 px  →  fits in 48 px canvas
    const primerX = cx - totalLen / 2; // primer/base end  (LEFT  in H)
    const crimpX = primerX + casingLen; // casing→tip junction
    const apexX = crimpX + tipLen; // tip apex          (RIGHT in H)
    const topY = cy - halfW; // far/dark edge     (TOP   in H)
    const botY = cy + halfW; // near/lit edge     (BOT   in H)

    // ── 1. DROP SHADOW ────────────────────────────────────────────────────
    // Soft ellipse offset to the lit side to anchor the bullet visually.
    g.fillStyle(colorShadow, 0.22);
    fillE(cx, cy + halfW + 3, totalLen + 4, 6);

    // ── 2. CASING BODY ────────────────────────────────────────────────────
    // Three layered rects simulate a lit cylindrical surface:
    //   dark band at the far edge → mid tone → light at the near edge.

    g.fillStyle(colorCasingDark, 1);
    fillR(primerX, topY, casingLen, halfW * 2); // full rect (dark base)

    g.fillStyle(colorCasingMid, 1);
    fillR(primerX, topY + 2, casingLen, halfW * 2 - 2); // strip 2 px in

    g.fillStyle(colorCasingLight, 1);
    fillR(primerX, topY + 4, casingLen, halfW * 2 - 5); // strip 4 px in

    // Bright specular sheen — 2 px strip running along the near (lit) edge.
    g.fillStyle(colorCasingSheen, 1);
    fillR(primerX + 2, botY - 3, casingLen - 4, 2);

    // ── 3. CASING END CAPS ────────────────────────────────────────────────
    // Narrow ellipses close off both ends of the cylinder.
    // The narrow axis (0.9 × halfW) = the foreshortened circular face.

    // Primer end cap  (LEFT in H / BOTTOM in V)
    g.fillStyle(colorCasingDark, 1);
    fillE(primerX, cy, halfW * 0.9 * 2, halfW * 2);

    g.fillStyle(colorCasingMid, 1);
    fillE(primerX, cy, halfW * 0.6 * 2, halfW * 1.6);

    // Crimp end cap  (right edge of casing)
    g.fillStyle(colorCasingDark, 1);
    fillE(crimpX, cy, halfW * 0.9 * 2, halfW * 2);

    g.fillStyle(colorCasingLight, 1);
    fillE(crimpX, cy, halfW * 0.6 * 2, halfW * 1.4);

    // ── 4. CRIMP / NECK BAND ──────────────────────────────────────────────
    // Indented 3 px groove at the casing→tip junction.
    g.fillStyle(colorCrimp, 1);
    fillR(crimpX - 1, topY, 3, halfW * 2);

    g.lineStyle(1, colorCrimp, 0.8);
    strokeR(crimpX - 1, topY, 3, halfW * 2);

    // ── 5. LEAD TIP ───────────────────────────────────────────────────────
    // Four triangles build a tapered ogive with convincing 2.5D shading:
    //   • dark far-half  (top in H)
    //   • mid near-half  (bottom in H)
    //   • lit strip on the near half
    //   • specular sliver at the very edge

    // Dark far-side half
    g.fillStyle(colorTipDark, 1);
    fillTri(crimpX, topY, crimpX, cy, apexX, cy);

    // Mid near-side half
    g.fillStyle(colorTipMid, 1);
    fillTri(crimpX, cy, crimpX, botY, apexX, cy);

    // Lit strip on near half
    g.fillStyle(colorTipLight, 1);
    fillTri(crimpX, cy + 1, crimpX, botY - 1, apexX - 2, cy);

    // Specular sliver at the very near edge
    g.fillStyle(colorTipSheen, 1);
    fillTri(crimpX, botY - 2, crimpX, botY, apexX - 4, cy);

    // Smooth the crimp→tip junction with an ellipse cap
    g.fillStyle(colorTipMid, 1);
    fillE(crimpX, cy, halfW * 0.9 * 2, halfW * 2);

    g.fillStyle(colorTipLight, 1);
    fillE(crimpX, cy, halfW * 0.5 * 2, halfW * 1.4);

    // ── 6. PRIMER ─────────────────────────────────────────────────────────
    // Three concentric circles on the case-head face:
    //   outer rim → face → firing-pin strike dent.
    // fillCircle is radially symmetric so only the centre needs transform.
    const [prX, prY] = T(primerX, cy);

    g.fillStyle(colorPrimerRim, 1);
    g.fillCircle(prX, prY, 4);

    g.fillStyle(colorPrimerFace, 1);
    g.fillCircle(prX, prY, 2.8);

    g.fillStyle(colorPrimerDot, 1);
    g.fillCircle(prX, prY, 1.2);

    // ── 7. SPECULAR GLINT ─────────────────────────────────────────────────
    // Short bright stroke along the near (lit) edge of the casing body.
    g.lineStyle(1.5, colorGlint, 0.85);
    g.beginPath();
    const [mx, my] = T(primerX + 5, botY - 1);
    const [lx, ly] = T(primerX + 14, botY - 1);
    g.moveTo(mx, my);
    g.lineTo(lx, ly);
    g.strokePath();

    // Hard glint dot at the tip apex — sharpest specular point
    const [gx, gy] = T(apexX - 1, cy - 1);
    g.fillStyle(colorGlint, 0.8);
    g.fillCircle(gx, gy, 1.2);
  }
}
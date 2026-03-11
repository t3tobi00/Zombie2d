import { BaseAsset } from '../../templates/BaseAsset.js';

/**
 * CoinAsset.js
 * 
 * Modular 2.5D Gold Coin.
 * Supports customization of size, colors, and orientation.
 */
/**
 * CoinAsset.js
 *
 * Procedural 2.5D gold coin — chunky cylinder viewed from slight top-down angle.
 * Looks like an actual coin with visible thickness, face, ring, and specular glint.
 */
export class CoinAsset extends BaseAsset {
  static draw(g, c, config = {}) {
    const {
      // Coin geometry
      radiusX = 12,   // horizontal radius of the ellipse, default 18
      radiusY = 11,   // vertical radius of top face (foreshortening), default 11
      depth = 3,      // how many pixels tall the side/edge is, default 7

      // Colors
      colorShadow     = 0x3d1f00,  // darkest underside shadow
      colorEdgeDark   = 0x7a3a00,  // dark bronze side band
      colorEdgeMid    = 0xb86010,  // mid bronze side
      colorEdgeLight  = 0xd4821a,  // lightest side catch
      colorFaceBase   = 0xd4900a,  // base gold face
      colorFaceMid    = 0xf0aa18,  // mid gold
      colorFaceLight  = 0xffd040,  // bright gold highlight zone
      colorRing       = 0xb07010,  // engraved inner ring
      colorEmblem     = 0xc88010,  // central emblem fill
      colorEmblemHi   = 0xffe060,  // emblem bright spot
      colorGlint      = 0xffffff,  // specular white
    } = config;

    // Coin top face sits at cy; side hangs below by `depth` pixels.
    // Slight upward nudge so the whole coin is centered in the 48x48 canvas.
    const cx = c.x;
    const cy = c.y - depth / 2;   // nudge top face up so side fits below

    // ── 1. UNDERSIDE SHADOW ──────────────────────────────────────────────────
    // Soft dark ellipse below the coin to anchor it visually.
    g.fillStyle(colorShadow, 0.45);
    g.fillEllipse(cx, cy + depth + 3, radiusX * 2 + 4, radiusY * 2 * 0.6);

    // ── 2. COIN SIDE / EDGE (the "thickness") ───────────────────────────────
    // Stack several ellipses from bottom to top to fake a lit curved edge.
    // Each layer is slightly higher and brighter, simulating a cylinder side.

    // Bottom (darkest) — forms the bottom rim of the edge
    g.fillStyle(colorEdgeDark, 1);
    g.fillEllipse(cx, cy + depth, radiusX * 2, radiusY * 2);

    // Step up — mid tone
    g.fillStyle(colorEdgeMid, 1);
    g.fillEllipse(cx, cy + depth - 2, radiusX * 2, radiusY * 2);

    // Step up — lighter side catch
    g.fillStyle(colorEdgeLight, 1);
    g.fillEllipse(cx, cy + depth - 4, radiusX * 2, radiusY * 2);

    // ── 3. TOP FACE — BASE FILL ──────────────────────────────────────────────
    // The main gold ellipse. Covers the top of the edge layers.
    g.fillStyle(colorFaceBase, 1);
    g.fillEllipse(cx, cy, radiusX * 2, radiusY * 2);

    // ── 4. TOP FACE — SHADING ────────────────────────────────────────────────
    // Overpaint with a lighter ellipse shifted top-left to fake a light source.
    // Then a smaller bright zone even further top-left for the brightest region.

    // Mid-tone fill (covers most of face, slightly offset)
    g.fillStyle(colorFaceMid, 1);
    g.fillEllipse(cx - 1, cy - 1, radiusX * 1.8, radiusY * 1.8);

    // Bright highlight zone — upper-left quadrant
    g.fillStyle(colorFaceLight, 1);
    g.fillEllipse(cx - 4, cy - 3, radiusX * 1.2, radiusY * 1.2);

    // Blend back to mid-gold in center so the face isn't blown out
    g.fillStyle(colorFaceMid, 1);
    g.fillEllipse(cx, cy + 1, radiusX * 1.0, radiusY * 1.0);

    // ── 5. ENGRAVED INNER RING ───────────────────────────────────────────────
    // A slightly darker elliptical stroke inside the face edge —
    // simulates a debossed border engraving common on coins.
    g.lineStyle(1.5, colorRing, 1);
    g.strokeEllipse(cx, cy, radiusX * 1.55, radiusY * 1.55);

    // ── 6. CENTRAL EMBLEM ────────────────────────────────────────────────────
    // Small filled ellipse at center — acts as a stamped motif placeholder.
    g.fillStyle(colorEmblem, 1);
    g.fillEllipse(cx, cy, 10, 6);

    g.fillStyle(colorEmblemHi, 1);
    g.fillEllipse(cx - 1, cy - 1, 6, 3.5);

    // ── 7. SPECULAR GLINT ARC ────────────────────────────────────────────────
    // A short bright arc near the top-left edge of the face ellipse.
    // This sells the "metallic" read more than anything else.
    g.lineStyle(2, colorGlint, 0.92);
    g.beginPath();
    g.arc(
      cx,
      cy,
      radiusX - 2,                    // just inside the face rim
      Phaser.Math.DegToRad(195),      // start: left side, slightly below top
      Phaser.Math.DegToRad(255),      // end:   upper-left arc
      false
    );
    g.strokePath();

    // Tiny hard glint dot — sharpest point of specular highlight
    g.fillStyle(colorGlint, 0.95);
    g.fillEllipse(cx - radiusX + 5, cy - 2, 3, 2);
  }
}
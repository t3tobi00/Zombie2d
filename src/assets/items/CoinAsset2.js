import { BaseAsset } from '../../templates/BaseAsset.js';

/**
 * CoinAsset2.js
 * 
 * New 3D Resource Coin with better shading and outlines.
 */
export class CoinAsset2 extends BaseAsset {
    static draw(g, c, config) {
        // Configuration & Defaults
        const w = config.faceWidth || 44;       // Width of the coin face (ellipse width)
        const h = config.faceHeight || 28;      // Height of the coin face (ellipse height)
        const d = config.depth || 14;           // 3D Thickness of the coin
        const o = config.outlineThickness || 3; // Thick cartoon outline

        // Center adjustments so the full 3D object stays within the texture center
        const cx = c.x;
        const cy = c.y - d / 2;

        // Colors extracted from screenshot
        const colorOutline   = config.colorOutline   !== undefined ? config.colorOutline   : 0x473012; // Dark brown
        const colorSide      = config.colorSide      !== undefined ? config.colorSide      : 0xd99a2b; // Dark gold
        const colorHighlight = config.colorHighlight !== undefined ? config.colorHighlight : 0xffca5e; // Light bright gold
        const colorTop       = config.colorTop       !== undefined ? config.colorTop       : 0xffcf40; // Main yellow
        const colorInnerRing = config.colorInnerRing !== undefined ? config.colorInnerRing : 0xde9c28; // Orange/Dark gold ring

        // 1. BOTTOM & SIDE SILHOUETTE (Thick Dark Outline)
        g.fillStyle(colorOutline, 1);
        g.fillEllipse(cx, cy + d, w + o*2, h + o*2);      // Bottom curve
        g.fillRect(cx - w/2 - o, cy, w + o*2, d);         // Side block to connect top/bottom

        // 2. SIDE BODY (Base dark gold color)
        g.fillStyle(colorSide, 1);
        g.fillEllipse(cx, cy + d, w, h);                  // Bottom face (hidden mostly, forms bottom curve)
        g.fillRect(cx - w/2, cy, w, d);                   // Main side cylinder wall

        // 3. SIDE HIGHLIGHT (The bright curve on the left side to give it 3D shine)
        g.fillStyle(colorHighlight, 1);
        const hlWidth = w * 0.12;       // Highlight strip width
        const hlX = cx - w/2 + o*1.5;   // Position slightly inset from the left edge
        g.fillRect(hlX, cy, hlWidth, d);
        
        // To cap the bottom of the highlight strip so it curves with the cylinder,
        // we draw a tiny ellipse with the same aspect ratio as the main face.
        const ratio = h / w;
        g.fillEllipse(hlX + hlWidth/2, cy + d, hlWidth, hlWidth * ratio);

        // 4. TOP OUTLINE (The dark ring around the top face)
        g.fillStyle(colorOutline, 1);
        g.fillEllipse(cx, cy, w + o*2, h + o*2);

        // 5. TOP FACE BASE (Main bright yellow)
        g.fillStyle(colorTop, 1);
        g.fillEllipse(cx, cy, w, h);

        // 6. TOP FACE INNER RING (Darker concentric ring)
        g.fillStyle(colorInnerRing, 1);
        g.fillEllipse(cx, cy, w * 0.65, h * 0.65);

        // 7. TOP FACE CENTER (Bright yellow center dot)
        g.fillStyle(colorTop, 1);
        g.fillEllipse(cx, cy, w * 0.35, h * 0.35);
    }
}

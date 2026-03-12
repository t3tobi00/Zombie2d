import { BaseAsset } from '../../templates/BaseAsset.js';

/**
 * RoomAsset.js
 * 
 * Ported from room.html - ROOM 1: Left-Entry Room
 * A clean, modular 2.5D room with an open left side.
 */
export class RoomAsset extends BaseAsset {
    static draw(g, c, config = {}) {
        // --- Configuration & Constants from room.html ---
        const thickness = config.wallThickness || 15;
        const bevel = config.bevel || 3;
        
        // Art Style Colors
        const colorBase = config.colorBase || 0x6c7a89;  // Mid-grey/blue
        const colorLight = config.colorLight || 0xabb7b7; // Bright highlight
        const colorDark = config.colorDark || 0x2e3131;  // Deep shadow
        
        // Dimensions
        const floorWidth = config.floorWidth || 200;
        const floorHeight = config.floorHeight || 160;

        // Positioning: We want center (c.x, c.y) to be the center of the total footprint
        // The total footprint includes the floor and the walls on North, East, South.
        // Left side is open.
        
        // Total width includes floor + right wall thickness
        // Total height includes floor + top wall thickness + bottom wall thickness
        const totalW = floorWidth + thickness;
        const totalH = floorHeight + thickness * 2;

        const startX = c.x - totalW / 2;
        const startY = c.y - totalH / 2;

        // --- Helper Methods (Internal to draw) ---

        const drawHorizontalWall = (x, y, length, t) => {
            // Base
            g.fillStyle(colorBase, 1);
            g.fillRect(x, y, length, t);
            // Top Highlight
            g.fillStyle(colorLight, 1);
            g.fillRect(x, y, length, bevel);
            // Bottom Shadow
            g.fillStyle(colorDark, 1);
            g.fillRect(x, y + t - bevel, length, bevel);
        };

        const drawVerticalWall = (x, y, length, t) => {
            // Base
            g.fillStyle(colorBase, 1);
            g.fillRect(x, y, t, length);
            // Left Highlight
            g.fillStyle(colorLight, 1);
            g.fillRect(x, y, bevel, length);
            // Right Shadow
            g.fillStyle(colorDark, 1);
            g.fillRect(x + t - bevel, y, bevel, length);
        };

        const drawCorner = (x, y, size, type) => {
            // Base Floor Block
            g.fillStyle(colorBase, 1);
            g.fillRect(x, y, size, size);

            if (type === 'TR') {
                g.fillStyle(colorLight, 1);
                g.fillRect(x, y, size, bevel); // Top
                g.fillStyle(colorDark, 1);
                g.fillRect(x + size - bevel, y, bevel, size); // Right
                // Inner Corner Miter
                g.fillStyle(colorLight, 1);
                g.fillTriangle(x, y + size - bevel, x + bevel, y + size - bevel, x + bevel, y + size);
                g.fillStyle(colorDark, 1);
                g.fillTriangle(x, y + size - bevel, x + bevel, y + size, x, y + size);
            }
            else if (type === 'BR') {
                g.fillStyle(colorDark, 1);
                g.fillRect(x, y + size - bevel, size, bevel); // Bottom
                g.fillRect(x + size - bevel, y, bevel, size); // Right
                // Inner Corner Miter
                g.fillStyle(colorLight, 1);
                g.fillRect(x, y, bevel, bevel);
            }
        };

        // --- Execute Drawing (ROOM 1 Pattern) ---

        // 0. FLOOR (Draw first so walls sit on top)
        const colorFloor = config.colorFloor || 0xc0c8cc; // Solid concrete floor color
        g.fillStyle(colorFloor, 1);
        g.fillRect(startX, startY, totalW, totalH);

        // Optional: Subtle grid or texture on floor to match your game style
        g.lineStyle(1, 0x000000, 0.05);
        for(let x = startX + 20; x < startX + totalW; x += 20) {
            g.lineBetween(x, startY, x, startY + totalH);
        }
        for(let y = startY + 20; y < startY + totalH; y += 20) {
            g.lineBetween(startX, y, startX + totalW, y);
        }

        // 1. North Wall (Top)
        drawHorizontalWall(startX, startY, floorWidth, thickness);
        
        // 2. TR Corner
        drawCorner(startX + floorWidth, startY, thickness, 'TR');
        
        // 3. East Wall (Right)
        drawVerticalWall(startX + floorWidth, startY + thickness, floorHeight, thickness);
        
        // 4. BR Corner
        drawCorner(startX + floorWidth, startY + thickness + floorHeight, thickness, 'BR');
        
        // 5. South Wall (Bottom)
        drawHorizontalWall(startX, startY + thickness + floorHeight, floorWidth, thickness);

        // 6. Cap the open West ends with a Left-Highlight
        g.fillStyle(colorLight, 1);
        g.fillRect(startX, startY, bevel, thickness);
        g.fillRect(startX, startY + thickness + floorHeight, bevel, thickness);
    }
}

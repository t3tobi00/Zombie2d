import { BaseAsset } from '../../templates/BaseAsset.js';

export class IconHouse extends BaseAsset {
    static draw(g, c, config) {
        const w = config.width || 48;
        const h = config.height || 48;
        const color = config.color !== undefined ? config.color : 0xffffff;
        const windowBg = config.windowBg !== undefined ? config.windowBg : 0x484641; 

        g.fillStyle(color, 1);
        g.fillRect(c.x + w*0.1, c.y - h*0.4, w*0.15, h*0.3); // Chimney
        g.fillTriangle(c.x, c.y - h*0.5, c.x - w*0.55, c.y, c.x + w*0.55, c.y); // Roof
        g.fillRect(c.x - w*0.4, c.y - h*0.05, w*0.8, h*0.45); // Body
        
        g.fillStyle(windowBg, 1);
        g.fillRect(c.x - w*0.15, c.y + h*0.05, w*0.3, h*0.3); // Window Cutout
        
        g.fillStyle(color, 1);
        g.fillRect(c.x - w*0.15, c.y + h*0.18, w*0.3, h*0.04); // Window Pane H
        g.fillRect(c.x - w*0.02, c.y + h*0.05, w*0.04, h*0.3); // Window Pane V
    }
}

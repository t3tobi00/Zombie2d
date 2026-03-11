import { BaseAsset } from '../../templates/BaseAsset.js';

export class IconPlus extends BaseAsset {
    static draw(g, c, config) {
        const w = config.width || 48;
        const h = config.height || 48;
        const color = config.color || 0xffffff;

        g.fillStyle(color, 1);
        g.fillRect(c.x - w*0.15, c.y - h*0.4, w*0.3, h*0.8);
        g.fillRect(c.x - w*0.4, c.y - h*0.15, w*0.8, h*0.3);
    }
}

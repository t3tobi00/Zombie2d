import { BaseAsset } from '../../templates/BaseAsset.js';

export class IconSyringe extends BaseAsset {
    static draw(g, c, config) {
        const w = config.width || 48;
        const h = config.height || 48;
        const color = config.color || 0xffffff;
        const tickColor = config.tickColor || 0x484641;

        g.save();
        g.translateCanvas(c.x, c.y);
        g.rotateCanvas(-Math.PI / 4);

        g.fillStyle(color, 1);
        g.fillRect(-w*0.15, -h*0.25, w*0.3, h*0.5); // Barrel
        g.fillRect(-w*0.25, -h*0.35, w*0.5, h*0.1); // Plunger Top
        g.fillRect(-w*0.05, -h*0.45, w*0.1, h*0.1); // inner rod
        g.fillRect(-w*0.2, -h*0.45, w*0.4, h*0.05); // pusher handle
        g.fillRect(-w*0.03, h*0.25, w*0.06, h*0.25); // Needle

        g.fillStyle(tickColor, 1);
        g.fillRect(-w*0.15, -h*0.1, w*0.15, h*0.05);
        g.fillRect(-w*0.15, 0, w*0.15, h*0.05);
        g.fillRect(-w*0.15, h*0.1, w*0.15, h*0.05);

        g.restore();
    }
}

import { BaseAsset } from '../../templates/BaseAsset.js';

export class UnlockZonePlate extends BaseAsset {
    static generate(scene, key, config = {}) {
        const width = config.width || 110;
        const faceHeight = config.height || 85;
        const depth = config.depth !== undefined ? config.depth : 8;
        const totalHeight = faceHeight + depth;

        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        this.draw(g, { x: 0, y: 0 }, { ...config, width, faceHeight, depth });
        
        g.generateTexture(key, width, totalHeight);
        g.destroy();
        console.log(`[AssetFactory] Generated Plate Texture: "${key}"`);
        return key;
    }

    static draw(g, c, config) {
        const w = config.width;
        const h = config.faceHeight;
        const d = config.depth;
        const r = config.radius || 14;
        
        const topColor = config.topColor || 0x484641;
        const shadowColor = config.shadowColor || 0x2e2c29;
        const isPressed = config.pressed || false;

        const faceY = isPressed ? d : 0;

        g.fillStyle(shadowColor, 1);
        g.fillRoundedRect(0, d, w, h, r);

        g.fillStyle(topColor, 1);
        g.fillRoundedRect(0, faceY, w, h, r);
    }
}

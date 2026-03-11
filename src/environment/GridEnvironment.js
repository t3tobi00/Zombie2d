import { COLORS } from '../utils/AssetFactory.js';

export class GridEnvironment {
    static create(scene) {
        // 1. Set the background color (Sand)
        scene.cameras.main.setBackgroundColor(COLORS.SAND);

        // 2. Add a road through the center
        // We repeat the road texture to create a vertical path
        for (let y = 0; y < 600; y += 128) {
            scene.add.image(400, y + 64, 'road_tile');
        }

        // 3. Keep a very subtle grid for building alignment
        scene.add.grid(400, 300, 800, 600, 32, 32, 0x000000, 0, COLORS.GRID, 0.05).setDepth(0);
    }
}
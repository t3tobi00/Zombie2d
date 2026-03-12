import { COLORS } from '../utils/AssetFactory.js';

export class GridEnvironment {
    static create(scene, centerX, centerY, worldWidth, worldHeight) {
        // 1. Set the background color (Sand)
        scene.cameras.main.setBackgroundColor(COLORS.SAND);

        // 2. Add a road through the world center
        // We repeat the road texture vertically across the entire map height
        for (let y = 0; y < worldHeight; y += 128) {
            scene.add.image(centerX, y, 'road_tile');
        }

        // 3. Add floor grid across the entire map
        scene.add.grid(centerX, centerY, worldWidth, worldHeight, 32, 32, 0x000000, 0, COLORS.GRID, 0.05).setDepth(0);
    }
}
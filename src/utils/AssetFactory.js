// We will define the colors here so the whole game feels consistent.
export const COLORS = {
    SAND: 0xdfb07e,
    ROAD: 0x7a716c,
    WALL: 0x5a5a5a,
    PLAYER: 0x00ffcc,
    LEG: 0x111111, // Very dark for high contrast
    EYE: 0xffffff,
    GRID: 0x000000
};

export class AssetFactory {
    static generateAll(scene) {
        this.generatePlayerTextures(scene);
        this.generateEnvironmentTextures(scene);
        this.generateItemTextures(scene);
    }

    static generatePlayerTextures(scene) {
        const g = scene.add.graphics();

        // Body
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillRoundedRect(0, 0, 32, 32, 8);
        g.fillStyle(COLORS.EYE, 1);
        g.fillCircle(10, 10, 3);
        g.fillCircle(22, 10, 3);
        g.generateTexture('body_player', 32, 32);
        g.clear();

        // Legs (Now even darker for contrast)
        g.fillStyle(COLORS.LEG, 1);
        g.fillRoundedRect(0, 0, 10, 12, 4);
        g.generateTexture('leg_player', 10, 12);
        g.clear();

        g.destroy();
    }

    static generateEnvironmentTextures(scene) {
        const g = scene.add.graphics();

        // Road segment
        g.fillStyle(COLORS.ROAD, 1);
        g.fillRect(0, 0, 128, 128);
        // Optional: Add a light dashed line in middle
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(60, 10, 8, 40);
        g.fillRect(60, 70, 8, 40);
        g.generateTexture('road_tile', 128, 128);
        g.clear();

        // Simple Wall
        g.fillStyle(COLORS.WALL, 1);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x333333, 1);
        g.strokeRect(2, 2, 28, 28);
        g.generateTexture('wall_tile', 32, 32);

        g.destroy();
    }

    static generateItemTextures(scene) {
        const g = scene.add.graphics();
        
        // A glowing green cube for the essence
        g.fillStyle(COLORS.ESSENCE, 1);
        g.fillRect(0, 0, 16, 16);
        
        // Add a darker border for depth
        g.lineStyle(2, 0x11aa11, 1);
        g.strokeRect(0, 0, 16, 16);
        
        g.generateTexture('item_essence', 16, 16);
        g.destroy();
    }
}
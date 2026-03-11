export const COLORS = {
    SAND: 0xdfb07e,
    ROAD: 0x7a716c,
    WALL: 0x5a5a5a,
    PLAYER: 0x00ffcc,
    PLAYER_DARK: 0x009977,
    PLAYER_MID: 0x00bbaa,
    HAIR: 0x1b3d8f,
    HAIR_HIGHLIGHT: 0x3060d0,
    LEG: 0x0d0d0d,
    SHOE: 0x333333,
    EYE: 0xffffff,
    PUPIL: 0x001122,
    GRID: 0x000000,
    ESSENCE: 0x00ff44,
};

export class AssetFactory {
    static generateAll(scene) {
        this.generatePlayerTextures(scene);
        this.generateEnvironmentTextures(scene);
        this.generateItemTextures(scene);
    }

    static generatePlayerTextures(scene) {
        const g = scene.add.graphics();

        // ── LEG ─────────────────────────────────────────────────────────
        // 10×18 px: rounded shin + darker foot block
        g.fillStyle(COLORS.LEG, 1);
        g.fillRoundedRect(0, 0, 10, 14, 3);
        g.fillStyle(COLORS.SHOE, 1);
        g.fillRoundedRect(-1, 11, 12, 5, 2);
        g.generateTexture('leg_player', 11, 16);
        g.clear();

        // ── TORSO ────────────────────────────────────────────────────────
        // 32×22 px: body panel + shoulder pads + collar notch
        const TW = 32, TH = 22;
        // Main body panel
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillRoundedRect(0, 5, TW, TH - 5, 6);
        // Collar strip (darker)
        g.fillStyle(COLORS.PLAYER_DARK, 1);
        g.fillRoundedRect(8, 0, TW - 16, 12, 4);
        // Left shoulder
        g.fillStyle(COLORS.PLAYER_MID, 1);
        g.fillRoundedRect(0, 3, 11, 10, 4);
        // Right shoulder
        g.fillRoundedRect(TW - 11, 3, 11, 10, 4);
        // Chest stripe (highlight line)
        g.lineStyle(1.5, COLORS.PLAYER_MID, 0.7);
        g.lineBetween(TW / 2, 6, TW / 2, TH);
        g.generateTexture('torso_player', TW, TH);
        g.clear();

        // ── HEAD BASE ────────────────────────────────────────────────────
        // 28×28 px: filled circle, slight chin shadow
        const HW = 28, HH = 28;
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillCircle(HW / 2, HH / 2, HW / 2);
        // Chin shadow gives 3-D depth
        g.fillStyle(COLORS.PLAYER_DARK, 0.35);
        g.fillEllipse(HW / 2, HH * 0.8, HW * 0.55, HH * 0.28);
        // Forehead highlight
        g.fillStyle(0xffffff, 0.12);
        g.fillEllipse(HW / 2 - 2, HH * 0.3, HW * 0.45, HH * 0.22);
        g.generateTexture('head_player', HW, HH);
        g.clear();

        // ── FACE FRONT (two eyes) ────────────────────────────────────────
        // Transparent bg, 28×28 px
        const drawEye = (cx, cy) => {
            g.fillStyle(COLORS.EYE, 1);
            g.fillCircle(cx, cy, 4.5);
            g.fillStyle(COLORS.PUPIL, 1);
            g.fillCircle(cx + 0.5, cy + 0.8, 2.5);
            // specular
            g.fillStyle(0xffffff, 1);
            g.fillCircle(cx + 1.2, cy - 0.8, 1);
        };
        drawEye(9, 13);
        drawEye(19, 13);
        g.generateTexture('face_front', HW, HH);
        g.clear();

        // ── FACE SIDE (one eye, right side of canvas) ────────────────────
        // Flip scaleX=-1 on the sprite for left-facing
        drawEye(18, 13);
        // Subtle profile nose bridge
        g.lineStyle(1.5, COLORS.PLAYER_DARK, 0.5);
        g.beginPath();
        g.arc(HW - 1, 18, 5, Math.PI * 1.4, Math.PI * 0.6, true);
        g.strokePath();
        g.generateTexture('face_side', HW, HH);
        g.clear();

        // ── HAIR BACK (full head coverage) ──────────────────────────────
        // Covers the entire head circle; used in BACK view (rendered on top of head)
        // and partially in FRONT (rendered behind head at low alpha)
        g.fillStyle(COLORS.HAIR, 1);
        g.fillCircle(HW / 2, HH / 2 - 1, HW / 2 + 1);
        // Hair sheen
        g.fillStyle(COLORS.HAIR_HIGHLIGHT, 0.45);
        g.fillEllipse(HW / 2 - 3, HH * 0.28, HW * 0.38, HH * 0.22);
        // Expose neck area (same colour as head so it blends)
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillEllipse(HW / 2, HH - 3, HW * 0.42, 10);
        g.generateTexture('hair_back', HW, HH);
        g.clear();

        // ── HAIR FRONT (small top-tuft seen in FRONT view) ───────────────
        const FHW = 24, FHH = 12;
        g.fillStyle(COLORS.HAIR, 1);
        g.fillRoundedRect(0, 3, FHW, FHH - 3, 5);
        // A couple of individual strand bumps on top
        g.fillCircle(6, 4, 4);
        g.fillCircle(12, 2, 5);
        g.fillCircle(18, 4, 4);
        // Sheen
        g.fillStyle(COLORS.HAIR_HIGHLIGHT, 0.4);
        g.fillEllipse(FHW / 2, 4, FHW * 0.45, 5);
        g.generateTexture('hair_front', FHW, FHH);
        g.clear();

        // ── HAIR SIDE (crescent covering back of head in profile) ────────
        // Right-facing variant. Set scaleX=-1 on sprite for left-facing.
        g.fillStyle(COLORS.HAIR, 1);
        // Full circle offset to the right, so it covers the back half
        g.fillCircle(HW * 0.6, HH / 2 - 1, HW * 0.52);
        // Sheen
        g.fillStyle(COLORS.HAIR_HIGHLIGHT, 0.4);
        g.fillEllipse(HW * 0.65, HH * 0.28, HW * 0.32, HH * 0.22);
        g.generateTexture('hair_side', HW, HH);
        g.clear();

        g.destroy();
    }

    static generateEnvironmentTextures(scene) {
        const g = scene.add.graphics();

        g.fillStyle(COLORS.ROAD, 1);
        g.fillRect(0, 0, 128, 128);
        g.fillStyle(0xffffff, 0.25);
        g.fillRect(60, 8, 8, 44);
        g.fillRect(60, 72, 8, 44);
        g.generateTexture('road_tile', 128, 128);
        g.clear();

        g.fillStyle(COLORS.WALL, 1);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x333333, 1);
        g.strokeRect(2, 2, 28, 28);
        g.generateTexture('wall_tile', 32, 32);

        g.destroy();
    }

    static generateItemTextures(scene) {
        const g = scene.add.graphics();

        g.fillStyle(COLORS.ESSENCE, 1);
        g.fillRect(1, 1, 14, 14);
        g.lineStyle(2, 0x11aa11, 1);
        g.strokeRect(0, 0, 16, 16);
        // Inner glow cross
        g.fillStyle(0xaaffaa, 0.6);
        g.fillRect(6, 2, 4, 12);
        g.fillRect(2, 6, 12, 4);
        g.generateTexture('item_essence', 16, 16);
        g.clear();

        // ── PARTICLE SPARK ───────────────────────────────────────────────
        // 8×8 bright circle — tinted at emitter level for metal-clash sparks
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle_spark', 8, 8);

        g.destroy();
    }
}
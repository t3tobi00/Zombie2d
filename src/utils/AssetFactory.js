import { CoinAsset } from '../assets/items/CoinAsset.js';
import { BulletAsset } from '../assets/items/BulletAsset.js';

/**
 * AssetFactory.js (Refactored)
 * 
 * Central coordinator and registry for all game assets.
 * Now modular! Each asset is its own class, following the BaseAsset template.
 */
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
    /**
     * Called in MainScene preload() to initialize all primary textures.
     * This is the "Production" registry. 
     */
    static generateAll(scene) {
        // --- 1. PLAYER MODULE (Pending Modularization, but using the existing logic for now) ---
        this.generatePlayerTextures(scene);
        
        // --- 2. MODULAR ITEMS ---
        // Gold Coin (Default Flat Stackable)
        CoinAsset.generate(scene, 'item_coin', { radiusX: 12, depth: 3, width: 48, height: 48 });
        // Larger icon version for UI
        CoinAsset.generate(scene, 'icon_coin', { radiusX: 16, depth: 4, width: 48, height: 48 });
        
        // Bullets (Default Top-Down Ammo)
        BulletAsset.generate(scene, 'item_bullet', { width: 32, height: 32, orientation: 'vertical' });
        BulletAsset.generate(scene, 'icon_bullet', { width: 48, height: 48, orientation: 'vertical', halfW: 9, casingLen: 28 });

        // --- 3. LEGACY ENVIRONMENT (To be modularized) ---
        this.generateEnvironmentTextures(scene);
        this.generateItemTextures(scene); // Essence, sparks, ui_bubble
    }

    // --- RE-IMPLEMENTING REMAINING LEGACY CODE BELOW FOR STABILITY ---
    // (We can modularize these one by one into the /assets subfolders)

    static generatePlayerTextures(scene) {
        const g = scene.add.graphics();

        // ── LEG ─────────────────────────────────────────────────────────
        g.fillStyle(COLORS.LEG, 1);
        g.fillRoundedRect(0, 0, 10, 14, 3);
        g.fillStyle(COLORS.SHOE, 1);
        g.fillRoundedRect(-1, 11, 12, 5, 2);
        g.generateTexture('leg_player', 11, 16);
        g.clear();

        // ── TORSO ────────────────────────────────────────────────────────
        const TW = 32, TH = 22;
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillRoundedRect(0, 5, TW, TH - 5, 6);
        g.fillStyle(COLORS.PLAYER_DARK, 1);
        g.fillRoundedRect(8, 0, TW - 16, 12, 4);
        g.fillStyle(COLORS.PLAYER_MID, 1);
        g.fillRoundedRect(0, 3, 11, 10, 4);
        g.fillRoundedRect(TW - 11, 3, 11, 10, 4);
        g.lineStyle(1.5, COLORS.PLAYER_MID, 0.7);
        g.lineBetween(TW / 2, 6, TW / 2, TH);
        g.generateTexture('torso_player', TW, TH);
        g.clear();

        // ── HEAD BASE ────────────────────────────────────────────────────
        const HW = 28, HH = 28;
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillCircle(HW / 2, HH / 2, HW / 2);
        g.fillStyle(COLORS.PLAYER_DARK, 0.35);
        g.fillEllipse(HW / 2, HH * 0.8, HW * 0.55, HH * 0.28);
        g.fillStyle(0xffffff, 0.12);
        g.fillEllipse(HW / 2 - 2, HH * 0.3, HW * 0.45, HH * 0.22);
        g.generateTexture('head_player', HW, HH);
        g.clear();

        // ── FACE FRONT ───────────────────────────────────────────────
        const drawEye = (cx, cy) => {
            g.fillStyle(COLORS.EYE, 1);
            g.fillCircle(cx, cy, 4.5);
            g.fillStyle(COLORS.PUPIL, 1);
            g.fillCircle(cx + 0.5, cy + 0.8, 2.5);
            g.fillStyle(0xffffff, 1);
            g.fillCircle(cx + 1.2, cy - 0.8, 1);
        };
        drawEye(9, 13);
        drawEye(19, 13);
        g.generateTexture('face_front', HW, HH);
        g.clear();

        // ── FACE SIDE ───────────────────────────────────────────────
        drawEye(18, 13);
        g.lineStyle(1.5, COLORS.PLAYER_DARK, 0.5);
        g.beginPath();
        g.arc(HW - 1, 18, 5, Math.PI * 1.4, Math.PI * 0.6, true);
        g.strokePath();
        g.generateTexture('face_side', HW, HH);
        g.clear();

        // ── HAIR BACK ────────────────────────────────────────────────
        g.fillStyle(COLORS.HAIR, 1);
        g.fillCircle(HW / 2, HH / 2 - 1, HW / 2 + 1);
        g.fillStyle(COLORS.HAIR_HIGHLIGHT, 0.45);
        g.fillEllipse(HW / 2 - 3, HH * 0.28, HW * 0.38, HH * 0.22);
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillEllipse(HW / 2, HH - 3, HW * 0.42, 10);
        g.generateTexture('hair_back', HW, HH);
        g.clear();

        // ── HAIR FRONT ───────────────────────────────────────────────
        const FHW = 24, FHH = 12;
        g.fillStyle(COLORS.HAIR, 1);
        g.fillRoundedRect(0, 3, FHW, FHH - 3, 5);
        g.fillCircle(6, 4, 4);
        g.fillCircle(12, 2, 5);
        g.fillCircle(18, 4, 4);
        g.fillStyle(COLORS.HAIR_HIGHLIGHT, 0.4);
        g.fillEllipse(FHW / 2, 4, FHW * 0.45, 5);
        g.generateTexture('hair_front', FHW, FHH);
        g.clear();

        // ── HAIR SIDE ───────────────────────────────────────────────
        g.fillStyle(COLORS.HAIR, 1);
        g.fillCircle(HW * 0.6, HH / 2 - 1, HW * 0.52);
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
        g.destroy();
    }

    static generateItemTextures(scene) {
        const g = scene.add.graphics();
        
        // ── ESSENCE ─────────────────────────────────────────────────
        g.fillStyle(COLORS.ESSENCE, 1);
        g.fillRect(1, 1, 14, 14);
        g.generateTexture('item_essence', 16, 16);
        g.clear();

        // ── UI BUBBLE ───────────────────────────────────────────────
        g.fillStyle(0x222222, 0.85);
        g.fillRoundedRect(0, 0, 90, 45, 12);
        g.lineStyle(2, 0xffffff, 0.2);
        g.strokeRoundedRect(0, 0, 90, 45, 12);
        g.generateTexture('ui_bubble', 90, 45);
        g.clear();

        // ── PARTICLE SPARK ─────────────────────────────────────────
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle_spark', 8, 8);
        g.clear();
        
        g.destroy();
    }
}
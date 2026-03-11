/**
 * ResourceAnimator.js
 * 
 * Reusable utility for Phaser 3 resource animations (Collect, Deposit, Unlock).
 * Includes "Flight" (Pop up + Arc + Flip) and "Impact" (Squash + Stretch + Settle).
 */
export class ResourceAnimator {
    /**
     * Handles the initial "pop up," "parabolic arc," and "360-flip" of an item.
     * 
     * @param {Phaser.GameObjects.GameObject} item - The item to animate.
     * @param {Object} targetPos - The destination {x, y} relative to the item's current parent.
     * @param {Object} config - Animation configuration.
     * @param {number} [config.duration=400] - Total duration of the animation.
     * @param {number} [config.popHeight=30] - Height of the initial pop-up.
     * @param {string} [config.ease='Power2.easeInOut'] - Ease function for the arc.
     * @param {Function} [config.onComplete] - Callback when flight is finished.
     */
    static flyTo(item, targetPos, config = {}) {
        const {
            duration = 400,
            popHeight = 30,
            ease = 'Power2.easeInOut',
            onComplete = null
        } = config;

        const scene = item.scene;
        const popDuration = duration * 0.3;
        const arcDuration = duration * 0.7;

        // Step 1: Pop Up Phase
        scene.tweens.add({
            targets: item,
            y: item.y - popHeight,
            scaleY: 0.75,
            duration: popDuration,
            ease: 'Sine.easeOut',
            onComplete: () => {
                // Step 2: Arc Phase (Movement to target)
                scene.tweens.add({
                    targets: item,
                    x: targetPos.x,
                    y: targetPos.y,
                    duration: arcDuration,
                    ease: ease,
                    onComplete: () => {
                        if (onComplete) onComplete();
                    },
                });

                // Step 3: 360-Flip Phase (Parallel to Arc)
                scene.tweens.add({
                    targets: item,
                    scaleX: -1,
                    scaleY: 1,
                    duration: arcDuration * 0.5,
                    ease: 'Sine.easeIn',
                    onComplete: () => {
                        scene.tweens.add({
                            targets: item,
                            scaleX: 1,
                            duration: arcDuration * 0.5,
                            ease: 'Sine.easeOut',
                        });
                    },
                });
            },
        });
    }

    /**
     * Handles the squash-stretch-elastic settle impact animation.
     * 
     * @param {Phaser.GameObjects.GameObject} item - The item to animate.
     * @param {Object} config - Animation configuration.
     * @param {Function} [config.onComplete] - Callback when impact is finished.
     */
    static playImpact(item, config = {}) {
        const { onComplete = null } = config;
        const scene = item.scene;

        // Kill any existing scale tweens to prevent clashing
        scene.tweens.killTweensOf(item, 'scaleX');
        scene.tweens.killTweensOf(item, 'scaleY');

        // Squash
        scene.tweens.add({
            targets: item,
            scaleX: 1.4,
            scaleY: 0.55,
            duration: 55,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Stretch
                scene.tweens.add({
                    targets: item,
                    scaleX: 0.82,
                    scaleY: 1.25,
                    duration: 75,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Settle
                        scene.tweens.add({
                            targets: item,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 160,
                            ease: 'Elastic.easeOut',
                            onComplete: () => {
                                if (onComplete) onComplete();
                            }
                        });
                    },
                });
            },
        });
    }
}

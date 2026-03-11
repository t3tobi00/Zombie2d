📂 src/templates/: Houses our standardized code patterns.

BaseAsset.js
: The master template for all procedural graphics.
📂 src/assets/: Contains the specific asset implementations.
📂 items/: CoinAsset.js, BulletAsset.js.
📂 zones/: UnlockPadAsset.js.
📂 src/utils/:

AssetFactory.js
: The central registry where all modular assets are initialized.


How to Prototyping now:
Ask an LLM to write code following the BaseAsset template.
Create a new file in the appropriate src/assets/ subfolder.
One-line check in your MainScene.js using the test utility:

// Instant visual check without registering a permanent texture
NewAssetClass.testInScene(this, 100, 100, { some: 'config' });
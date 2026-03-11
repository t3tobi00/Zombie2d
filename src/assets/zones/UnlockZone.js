export class UnlockZone {
    static create(scene, x, y, config) {
        const {
            output_icon,       
            input_icon,        
            number,            
            plate_normal,      
            plate_pressed,     
            depth = 8,         
            onClick = () => {} 
        } = config;

        const container = scene.add.container(x, y);

        const plate = scene.add.image(0, 0, plate_normal);
        container.add(plate);

        const outIcon = scene.add.image(0, -14, output_icon);
        container.add(outIcon);

        const text = scene.add.text(0, 0, String(number), {
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontSize: '26px',
            color: '#ffffff',
            stroke: '#111111',
            strokeThickness: 6
        }).setOrigin(0, 0.5);

        const inIcon = scene.add.image(0, 0, input_icon);

        const gap = 4;
        const totalContentWidth = inIcon.displayWidth + gap + text.width;
        const startX = -totalContentWidth / 2;
        const bottomY = 22; 

        inIcon.setPosition(startX + inIcon.displayWidth / 2, bottomY);
        text.setPosition(startX + inIcon.displayWidth + gap, bottomY);

        container.add([inIcon, text]);

        plate.setInteractive();

        plate.on('pointerdown', () => {
            plate.setTexture(plate_pressed);
            outIcon.y += depth;
            inIcon.y += depth;
            text.y += depth;
            text.setTint(0xdddddd);
        });

        const releaseButton = () => {
            if (plate.texture.key === plate_pressed) {
                plate.setTexture(plate_normal);
                outIcon.y -= depth;
                inIcon.y -= depth;
                text.y -= depth;
                text.clearTint();
            }
        };

        plate.on('pointerup', () => {
            releaseButton();
            onClick(); 
        });

        plate.on('pointerout', releaseButton);

        return container;
    }
}

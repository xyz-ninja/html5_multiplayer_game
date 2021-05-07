

class Canvas {
    constructor(game) {
        this.x = 0;
        this.y = 0;

        this.game = game;

        // elements
        this.elements = [];
        this.multiElements = [];

        // надпись Cosmobase.top
        this.intro = new eLabel(
            game, this.x, this.y, 20, 20);
        this.intro.setupText(
            'CosmoBase.top', {
                font: '30px Tahoma',
                align: 'center'
            });
        this.intro.setupTextStyle("#558CB3", "#111");

        // select planet targets
        this.selectedPersonalPlanet = new PlanetTarget(game , 0 , 'guiSelectPlanet');
        this.selectedEnemyPlanet = new PlanetTarget(game , 1 , 'guiSelectPlanet');

        // меню управления ( кнопки и т.д )
        let bgRectWidth = 500;
        let bgRectHeight = 120;
        this.bgRect = new eRectSprite(
            game,
            20,
            game.camera.view.height - bgRectHeight, 0, 0, 'guiBg');
        this.bgRect.setOpacity(0.3);

        // текст в меню
        this.buttonDesc = new eLabel(
            game, 0, 0,
            this.bgRect.startX + 20,
            this.bgRect.startY + 3);
        this.buttonDesc.setupText(
            'select units count :', {
                font: '18px Tahoma',
                align: 'center'
            });
        this.buttonDesc.setupTextStyle("#fff", "#111");

        // кнопки
        let buttonsOffset = 50;
        this.btNum1 = new eTriggerButton(game,
            0, 0, this.bgRect.startX, this.bgRect.startY,
            20, 30, 'number', 1 , '1', 'shipsCount', this);
        this.btNum2 = new eTriggerButton(game,
            0, 0, this.bgRect.startX, this.bgRect.startY,
            70, 30, 'number', 2 , '2', 'shipsCount', this);
        this.btNum3 = new eTriggerButton(game,
            0, 0, this.bgRect.startX, this.bgRect.startY,
            120, 30, 'number', 5 , '5', 'shipsCount', this);
        this.btNum4 = new eTriggerButton(game,
            0, 0, this.bgRect.startX, this.bgRect.startY,
            25, 70, 'numberWithPercents', 20 , '20%', 'shipsCount', this);
        this.btNum5 = new eTriggerButton(game,
            0, 0, this.bgRect.startX, this.bgRect.startY,
            93, 70, 'numberWithPercents', 50 , '50%', 'shipsCount', this);

        this.elements.push(this.intro);
        this.elements.push(this.bgRect);
        this.elements.push(this.buttonDesc);
        this.multiElements.push(this.btNum1);
        this.multiElements.push(this.btNum2);
        this.multiElements.push(this.btNum3);
        this.multiElements.push(this.btNum4);
        this.multiElements.push(this.btNum5);

        // обновления вложенных обьектов в multielements
        for (let i = 0; i < this.multiElements.length; i++) {
            if (this.multiElements[i].elements) {
                for (let j = 0; j < this.multiElements[i].elements.length; j++) {
                    let currentElement = this.multiElements[i].elements[j];
                    this.elements.push(currentElement);
                }
            }
        }
    }

    move(x, y) {
        this.x = x;
        this.y = y;
        this.updateGUICoords(this.x, this.y);
    }

    updateGUICoords(x, y) {
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].setCoords(x, y);

            this.game.world.bringToTop(this.elements[i].obj);
        }
    }

    getMultiElementsByGroupName(groupname) {
        let multiElements = this.multiElements;
        let groupElements = []; // возвращаемый массив
        for (let i = 0; i < multiElements.length; i++) {
            if (multiElements[i].groupname == groupname) {
                groupElements.push(multiElements[i]);
            }
        }
        return groupElements;
    }

    disableAllTriggerButtonsInGroup(groupname) {
        let group = this.getMultiElementsByGroupName(groupname);
        for (let i = 0; i < group.length; i++) {
            group[i].setActive(false);
        }
    }
}

class PlanetTarget {
    constructor(game , type , sprite) {
        
        this.obj = game.add.sprite(0,0,sprite);
        this.obj.opacity = 0;
        this.obj.scale.setTo(0.6);

        this.type = type;
        
        if (this.type == 0) { // player planet
            this.obj.frame = 0;
        } else { // enemy planet
            this.obj.frame = 1;
        }
    }

    moveTo(x , y) {
        this.obj.opacity = 1;

        this.obj.x = x;
        this.obj.y = y;
    }
}

class CanvasElement {
    constructor(game, startX, startY, offsetX, offsetY) {
        this.haveParent = false;
        this.parentCoords = {
            x: 0,
            y: 0
        };

        this.x = startX + offsetX;
        this.y = startY + offsetY;
        this.startX = startX;
        this.startY = startY;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
    setCoords(newX, newY) {
        this.obj.x = newX + this.startX + this.offsetX;
        this.obj.y = newY + this.startY + this.offsetY;
    }
    setParent(parent) {
        this.x = parent.x;
        this.y = parent.y;
        this.haveParent = true;
    }
}

class eLabel extends CanvasElement {
    constructor(game, startX, startY, offsetX, offsetY) {
        super(game, startX, startY, offsetX, offsetY);
        this.obj = game.add.text(this.x, this.y, 'loading');
        //this.obj.anchor.setTo(0.5);

    }

    setupText(labelText, style) {
        this.obj.setText(labelText);
        this.obj.setStyle(style);
    }

    setupTextStyle(color, strokeColor) {
        this.obj.stroke = strokeColor;
        this.obj.strokeThickness = 4;
        this.obj.fill = color;
    }
}

class eRect extends CanvasElement {
    constructor(game, startX, startY, offsetX, offsetY, width, height) {
        super(game, startX, startY, offsetX, offsetY);

        this.width = width;
        this.height = height;


        this.obj = new Phaser.Rectangle(
            this.x,
            this.y,
            this.width,
            this.height);
        game.debug.geom(this.obj, 'rgba(0,0,50,0.8)');
    }
    setSize(width, height) {
        this.obj.resize(width, height);
    }
    setColor(color) {
        game.debug.geom(this.obj, color);
    }
    getObjectPosition() {
        return {
            x: this.x,
            y: this.y
        };
    }
}

class eRectSprite extends CanvasElement {
    constructor(game, startX, startY, offsetX, offsetY, sprite) {
        super(game, startX, startY, offsetX, offsetY);

        this.obj = game.add.sprite(this.x, this.y, sprite);
        this.obj.frame = 0;
    }
    setOpacity(opacity) {
        this.obj.alpha = opacity;
    }
}

class eTriggerButton extends CanvasElement {
    constructor(game, startX, startY, offsetX, offsetY,
        addOffsetX, addOffsetY, type, count , text, groupname, canvas) {
        super(game, startX, startY, offsetX, offsetY);

        this.elements = [];

        this.groupname = groupname;

        this.bg = new eRectSprite(
            game,
            startX,
            startY,
            offsetX + addOffsetX,
            offsetY + addOffsetY,
            'buttons'
        );
        this.bg.setOpacity(0.6);
        this.bg.obj.inputEnabled = true;
        this.bg.obj.input.useHandCursor = true;
        this.bg.obj.events.onInputDown.add(() => {

            Client.inputChangeSelectedShipsCount( Game.player.id , this.count , this.inPercents );
            canvas.disableAllTriggerButtonsInGroup(this.groupname);
            this.setActive(true);

        }, this);

        this.buttonLabel = new eLabel(
            game,
            this.bg.startX,
            this.bg.startY,
            this.bg.offsetX,
            this.bg.offsetY);
        this.buttonLabel.setupText(
            'newButton', {
                font: '18px Tahoma',
                align: 'center'
            });
        this.setType(type, text , count);
        this.elements.push(this.bg);
        this.elements.push(this.buttonLabel);
    }

    setActive(isActive) {
        if (isActive) {
            this.bg.obj.frame = 1;
        } else {
            this.bg.obj.frame = 0;
        }
    }

    setType(type, text, count) {

        this.type = type;

        this.count = count;
        this.inPercents = false;

        let bgScaleW = 1;
        let bgScaleH = 1;

        if (type == 'number') {
            bgScaleW = 0.25;
            bgScaleH = 0.5;
            this.inPercents = false;
        } else if (type == 'numberWithPercents') {
            bgScaleW = 0.35;
            bgScaleH = 0.5;
            this.inPercents = true;
        } else if (type == 'button') {
            bgScaleW = 0.5;
            bgScaleH = 0.6;
        }

        let bgObj = this.bg.obj;
        bgObj.scale.setTo(bgScaleW, bgScaleH);
        this.buttonLabel.setupText(text, {
            font: '18px Tahoma',
            align: 'center'
        })
        this.buttonLabel.setupTextStyle("#fff", "#111");
        this.buttonLabel.offsetX += (bgObj.width * bgObj.scale.x) / 2;
        this.buttonLabel.offsetY += (bgObj.height * bgObj.scale.y) / 2;
    }
}
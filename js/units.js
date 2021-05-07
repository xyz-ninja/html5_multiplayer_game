
class ingamePlanet{
	constructor( game , serverPlanet ) {
		
		this.game = game;

		this.id = serverPlanet.id;

		this.x = serverPlanet.x;
		this.y = serverPlanet.y;
		this.spriteImage = serverPlanet.sprite;

		this.player = serverPlanet.player;

		////////////
		// FIELDS //
		////////////

		this.shipsCount = serverPlanet.shipsCount;
		this.maxShipsCount = serverPlanet.maxShipsCount;
		this.updateArr = []; // array to obj which need update

		// setup graphics
		this.sprite = game.add.sprite(this.x , this.y , this.spriteImage);
		this.sprite.scale.setTo(0.6);

		// setup labels
		this.shipCountText = game.add.text(
		 	this.x + 46 , this.y + 36 , 'loading' ,
			{ font : '22px Tahoma' , align : 'center' });
		this.playerText = game.add.text(
		 	this.x + 46 , this.y + 63 , 'empty' ,
			{ font : '15px Tahoma' , align : 'center' });

		this.colorGREEN = "#49AC3F";
		this.colorRED = "#DF8282";
		this.colorGRAY = "#BFBEC5";
		this.colorDARKGRAY = "#44444D";

		this.setupTextStyle( this.shipCountText , "#fff" , "#000000");
		this.setupTextStyle( this.playerText , this.colorGRAY , this.colorDARKGRAY);

		this.checkShipsCount();

		this.spawnMultipleShips( 'ships',this.shipsCount );

	}

	/////////

	clickAction( sprite , pointer ) {

		// здесь this = Game
		if ( pointer.leftButton.isDown ) {
			Client.moveToPlanet( Game.player.id , sprite.spriteID );
		} else if ( pointer.rightButton.isDown ) {
			Client.inputSelectPlanet( Game.player.id , sprite.spriteID );
		}

	}

	/////////

	setPlayer( player ) {
		this.player = player;
		this.checkPlayers();
	}

	clear() {
		this.player = null;
		this.checkPlayers();
		this.shipsCount = 0;
		this.checkShipsCount();

		for (let i = 0; i < this.updateArr.length ; i++) 
			this.updateArr[i].destroy();
		this.updateArr.splice(0,this.updateArr.length); // очищаем массив обновления
	}
	
	/////////

	spawnShip( sprite ) {
		this.shipsCount++;
		this.createShip( sprite );
	}
	spawnMultipleShips( sprite , count ) {
		for (let i = 0 ; i < count ; i++ ){
			this.createShip( sprite );
		}
	}
	createShip( sprite ) {
		
		let ship = new Ship (this , sprite);

		this.updateArr.push(ship);
		this.checkShipsCount();
		// set z-index
		this.game.world.swap(this.shipCountText , ship.sprite);
		this.game.world.swap(this.playerText , ship.sprite);
	}

	removeShips( count ) {
		Client.removeShips( count , this.id );
	}

	removeShipByDistance( distPosition ) {
		// убирает корабль с минимальным расстоянием до distPosition

		let minimalDist = 0; // минимальное расстояние
		let arrPosOfShipWithMinimalDist = 0; // позиция в массиве ближайшего корабля

		for ( let i = 0 ; i < this.updateArr.length ; i++ ) {
			
			let currentShip = this.updateArr[i];

			if ( currentShip.needMoveToPoint && ! currentShip.movePoint.isReturn ) {
				
				let dist = currentShip.calculateDist(
					{ x : currentShip.x , y : currentShip.y } ,
					{ x : distPosition.x , y : distPosition.y }
				);

				if ( dist < minimalDist ) {
					minimalDist = dist;
					arrPosOfShipWithMinimalDist = i;
				}
			}
		}

		// убираем полученный корабль
		this.updateArr[arrPosOfShipWithMinimalDist].destroy();
		this.updateArr.splice(this.updateArr[arrPosOfShipWithMinimalDist] , 1);	

		this.checkShipsCount();
	}

	sendShipsToPlanet( planet , count ) {
		let shipsToSend = [];
		// ищем ближайшие к планете корабли
		for (let i = 0; i < this.updateArr.length; i++) {
			let currentShip = this.updateArr[i];
			currentShip.distToMovePlanet = (
				currentShip.calculateDist(
					{x : currentShip.x , y : currentShip.y} , { x : planet.x , y : planet.y}));
		}
		// выбираем из массива ближайшие корабли
		for (let i = 0; i < count; i++) {
			let minimalDist = 1000;
			let minimalElementArrayPos = 0;
			for (let j = 0; j < this.updateArr.length; j++) {
				let currentShip = this.updateArr[j];
				if ( !currentShip.needMoveToPoint && !shipsToSend.includes(currentShip)) {
					if ( currentShip.distToMovePlanet < minimalDist ) {
						minimalDist = currentShip.distToMovePlanet;
						minimalElementArrayPos = j;
					}
				}
			}
			shipsToSend.push(this.updateArr[minimalElementArrayPos]);
		}
		// отправляем ближайшие корабли
		for (let i = 0; i < shipsToSend.length; i++) {
			shipsToSend[i].moveTo(
				{ 	
					fromPlanetID : this.id ,
					toPlanetID : planet.id ,
					currentPlayerID : this.player.id , 
					x : planet.sprite.x ,
					y : planet.sprite.y ,
					isReturn : false 
			});
		}
	}

	// SERVER responses

	shipsRemoved( count ) {
		for (let i = updateArrLenWithNull; i > this.updateArr.length - count; i--)
			this.updateArr[i].destroy();
		this.updateArr.splice(this.updateArr.length , count);
	}

	/////////
	
	setupTextStyle(text , color , strokeColor) {
		text.stroke = strokeColor;
    	text.strokeThickness = 6;
    	text.fill = color;

    	text.anchor.set(0.5);
	}

	checkShipsCount() {
		this.shipCountText.text = String(this.shipsCount);
		if ( this.shipsCount < this.maxShipsCount ) {
			this.setupTextStyle( this.shipCountText , "#fff" , "#000000");
		} else {
			this.setupTextStyle(this.shipCountText , this.colorRED , "#000000" )
		}
	}

	checkPlayers() {
		if (this.player == null) {
			this.playerText.text = 'empty';
			this.setupTextStyle( this.playerText , this.colorGRAY , this.colorDARKGRAY);
		}
		if ( this.player.id == Game.player.id ) {
			this.playerText.text = 'Player '+String(this.player.id);
			this.setupTextStyle( this.playerText , this.colorGREEN , "#000000");
		} else {
			this.playerText.text = 'Player '+String(this.player.id);
			this.setupTextStyle( this.playerText , this.colorRED , "#000000");
		}
	}
}

class Ship {
	constructor( planet , sprite ) {
		
		this.x = planet.x + planet.sprite.width / 2;
		this.y = planet.y + planet.sprite.height / 2;

		this.radius = planet.sprite.width / 2;
		
		// выбираем скорость и переводим в десятичный вид
		this.movingSpeed = randomInt(8,18) / 10;
		this.xInterval = ( randomInt(15,35) ) / 100;

		this.sprite = planet.game.add.sprite(
			this.x ,
			this.y ,
			sprite);

		this.needMoveToPoint = false;
		this.movePoint = { 
			x : 0 , y : 0 ,
			isFriendly : false , isReturn : false ,
			fromPlanetID : null , toPlanetID : null ,
			currentPlayerID : null };

		this.game = planet.game;

		// направление движения
		if ( randomInt(0,10) < 5 )
			this.movingSpeed = -this.movingSpeed;

		this.standardScale = 0.45;
		this.largerScale = 0.8;

		this.sprite.scale.setTo(this.standardScale);
		this.sprite.anchor.setTo(0.5);

		this.currentPlanetID = planet.id;

		this.angleMultiplier = 0;

		this.distToMovePlanet = 0;

		this.loopTimer = randomInt(380,680);

		const normalSpeed = 60;
		this.speed = randomInt(normalSpeed , normalSpeed + 20) / 10;

		this.pathArr = []; // array of points with bezier curve
		this.needMoveByPath = false;

		// автоматический возврат корабля на планету
		
		planet.game.time.events.loop( this.loopTimer , () => {
			if ( !this.needMoveByPath && !this.needMoveToPoint ) {
				if (this.angleMultiplier > 20) {
					if (!this.needMoveToPoint) {
						this.angleMultiplier = 0;
						this.moveTo({ 
							x : this.x ,
							y : this.y ,
							isReturn : true  
						});
					}
				} else {
					this.angleMultiplier += this.movingSpeed;
				}
			}
		}, this);
	}

	update( dt ) {

		// если корабль двигается к планете
		
		let dx = 0;
		let dy = 0;

		// если нужно двигаться к точке
		if ( this.needMoveToPoint && !this.needMoveByPath ) {

			this.sprite.alpha = 1.0;

			let pointReached = this.transpose( this.movePoint.x , this.movePoint.y , 25 , true );

			// если есть пересечение с точкой
			if ( pointReached ) {
				
				if (this.movePoint.isReturn) {
					this.enterPlanet({ id : this.currentPlanetID , sprite : 'ships'});
				} else {
					// переместить корабль на планету
					Client.shipEnterPlanet(
						this.movePoint.fromPlanetID ,
						this.movePoint.toPlanetID ,
						this.movePoint.currentPlayerID );
				}
			}

		// если нужно двигаться по массиву точек
		} else if ( this.needMoveByPath && !this.needMoveToPoint ) {

			this.sprite.alpha = 1.0;

			// если еще есть непройденные точки
			if ( this.currentPathIndex != this.finishPathIndex ) {
				let movePointX = this.pathArr[ this.currentPathIndex ].x;
				let movePointY = this.pathArr[ this.currentPathIndex ].y;


				let pointReached = this.transpose( movePointX , movePointY , 40 , true);
				if ( pointReached ) {
					this.currentPathIndex += 1;
				}
				
			} else {
				// переместить корабль на планету
				Client.shipEnterPlanet(
					this.movePoint.fromPlanetID ,
					this.movePoint.toPlanetID ,
					this.movePoint.currentPlayerID );
			}

		} else {
			this.sprite.alpha = 0.6;
			this.sprite.scale.setTo( this.standardScale );

			dx = 2.5 * Math.cos(this.angleMultiplier);
			dy = 1 * Math.sin(this.angleMultiplier);
			
			let angle = Math.atan2(dy , dx) * 180 / Math.PI;
			this.sprite.angle = angle + 90;
			
			this.sprite.x += dx;
			this.sprite.y += dy;
		}
	}

	moveTo( planetInfo ) {
		
		// если корабль возвращается на планету по таймеру
		if (planetInfo.isReturn) 
			this.setMoveMode( "point" , planetInfo );
		else {
			planetInfo.x += randomInt(40,80);
			planetInfo.y += randomInt(40,70);
			this.setMoveMode( "path" , planetInfo );
		}
		//else if (!planetInfo.isFriendly) 
				
	}

	transpose( x , y , _rangeToCollision , _rotateToPoint , _pathPointIndex) {

		let haveCollision = false;

		let dx = 0;
		let dy = 0;

		let shipX = this.sprite.x; let shipY = this.sprite.y;
		let moveX = x; let moveY = y;

		let rangeToCollision;

		if ( _rangeToCollision ) {
			rangeToCollision = _rangeToCollision;
		} else {
			rangeToCollision = 10;
		}

		let bufferZone = 4;

		if ( moveX > shipX + bufferZone )
			dx += this.speed;
		else if ( moveX < shipX - bufferZone )
			dx -= this.speed;
		if ( moveY > shipY + bufferZone )
			dy += this.speed;
		else if ( moveY < shipY - bufferZone )
			dy -= this.speed;

		if ( _rotateToPoint ) {
			if ( _pathPointIndex ) {
				// поворачивать корабль каждую 3 точку
				if ( _pathPointIndex % 5 == 0 ) {
					// поворачиваем корабль в сторону точки
					let angle = Math.atan2(dy , dx) * 180 / Math.PI;
					//this.sprite.angle = angle + 90;
					this.sprite.angle = this.game.math.rotateToAngle(this.sprite.angle , angle , 0.25) + 90;
				}
			} else {
				// поворачиваем корабль в сторону точки
				let angle = Math.atan2(dy , dx) * 180 / Math.PI;
				//this.sprite.angle = angle + 90;
				this.sprite.angle = this.game.math.rotateToAngle(this.sprite.angle , angle , 0.25) + 90;
			}
		}

		this.sprite.x += dx;
		this.sprite.y += dy;

		// проверка столкновений

		let dist = this.calculateDist( {x : moveX , y : moveY} , {x : shipX , y : shipY} );

		if ( dist <= rangeToCollision ) {
			haveCollision = true;
		}

		return haveCollision;

	}

	setMoveMode( moveMode , planetInfo ) {
		if ( moveMode == "point" ) {
			
			console.log("selected point mode");

			this.needMoveToPoint = true;
			this.needMoveByPath = false;
			
			this.movePoint = planetInfo;
		
		} else if ( moveMode == "path" ) {
			
			console.log("selected path mode");

			this.needMoveByPath = true;
			this.needMoveToPoint = false;

			this.movePoint = planetInfo;
			this.currentPathIndex = 0;

			this.calculatePathArrayWithBezier3Curve(
				{ x : this.x , y : this.y } ,
				{ x : planetInfo.x , y : planetInfo.y }
			);
		
		}
	}

	enterPlanet( info ) {
		this.needMoveToPoint = false;
	}

	destroy() {
		this.sprite.destroy();
	}

	calculateDist( fromPos , toPos ) {
		return Math.sqrt(Math.pow(toPos.x - fromPos.x , 2) + Math.pow(toPos.y - fromPos.y , 2));
	}

	calculatePathArrayWithBezier3Curve( fromPos , toPos ) {
		this.pathArr.splice(0 , this.pathArr.length );

		let t = 0;
		let tStep = 0.05;

		let widthRandomizer = 200;

		let curvePoint = {
			x : ( (fromPos.x + toPos.x) / 2 + randomInt(-widthRandomizer , widthRandomizer) ) ,
			y : ( (fromPos.y + toPos.y) / 2 + randomInt(-widthRandomizer , widthRandomizer) )
		}

		while ( t < 1 ) {	
			let generatedPoint = this.calculateBezierCurve3(fromPos , toPos , curvePoint , t);
			this.pathArr.push(generatedPoint);

			t += tStep;
		}

		this.finishPathIndex = this.pathArr.length;
	}

	calculateBezierCurve3(p1, p2, curveP, t) {
		let calculatedX = 0;
		let calculatedY = 0;

		calculatedX = (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * curveP.x + t ** 2 * p2.x;
		calculatedY = (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * curveP.y + t ** 2 * p2.y;

		/*
		let graphics = this.game.add.graphics( 0 , 0 );
		graphics.lineStyle(2, 0xffd900, 1);
    	graphics.beginFill(0xFF0000, 1);
    	graphics.drawCircle(calculatedX, calculatedY, 2); */

		return { x : calculatedX , y : calculatedY };
	}
}

////////////////////////////

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
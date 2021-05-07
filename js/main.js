
var game = new Phaser.Game(
	window.innerWidth * window.devicePixelRatio ,
	window.innerHeight * window.devicePixelRatio ,
	Phaser.AUTO , document.getElementById("game"));

var Game = {};

Game.init = function() {
	game.stage.disableVisibilityChange = true;

};

Game.preload = function() {
	game.load.image('planet','assets/sprites/hqPlanets.png');
	game.load.image('ships', 'assets/sprites/ships.png');
	
	game.load.image('guiBg', 'assets/sprites/guiBg.png');
	
	game.load.spritesheet('guiSelectPlanet', 'assets/sprites/hqTargets.png' , 150 , 150 , 2);
	game.load.spritesheet('buttons', 'assets/sprites/buttons.png' , 180 , 70 , 2);
};

Game.create = function() {

	game.world.setBounds(-500, -500, 9500, 10000);

	this.planets = [];
	this.players = [];

	this.player = null; 

	Client.connectNewPlayer( this );

	// spawn ships
	this.shipTimer = game.time.create(false);
	this.shipTimer.loop(1000 , function(){
		Client.spawnShip(this.player.id);
	} , this);

	this.canvas = new Canvas(game);
};

Game.update = function() {
	
	this.dt = game.time.totalElapsedSeconds(); 

	this.updateInput();

	// update ships
	for (let i = 0 ; i < this.planets.length ; i++) {
		for (let j = 0 ; j < this.planets[i].updateArr.length ; j++) {
			this.planets[i].updateArr[j].update( this.dt );
		}
	}
}

//////////////

Game.updatePlayersArr = function ( players ) {
	this.players = players;
};

// спаунит планеты игроков
// так-же при null очищает их
Game.spawnPlayer = function ( planet ) {
	let localPlanet = this.getIngamePlanetByID(planet.id);
	localPlanet.setPlayer(planet.player);
}

Game.spawnPlayerAtStartPlanet = function ( planet ) {
	// рисуем всех игроков
	for (let i = 0 ; i < this.planets.length ; i++) {
		if (this.planets[i].player != null) {
			this.planets[i].checkPlayers();
			this.planets[i].checkShipsCount();
		}
	}

	let startPlanet = this.getIngamePlanetByID (planet.id);
	startPlanet.setPlayer(planet.player);
	this.updatePlayer(planet.player);

	Client.inputSelectPlanet( this.player.id , startPlanet.id , false );

	this.canvas.selectedPersonalPlanet.moveTo(startPlanet.x , startPlanet.y);

	this.setCameraXY( planet.x , planet.y , true );
	this.shipTimer.start();	
}

Game.updatePlayer = function ( player ) {
	this.player = player;
	
	console.log(this.player);
}

Game.updatePlayerByID = function ( id , player ) {
	
	console.log(this.players);

	for (let i = 0 ; i < this.players.length ; i++) {
		let currentPlayer = this.players[i];
		if ( currentPlayer.id == id ) {
			
			if ( id == this.player.id ) {
				this.player = player;
			}

			currentPlayer = player;
		}
	}
}

Game.clearPlanet = function ( planet ) {
	let localPlanet = this.getIngamePlanetByID(planet.id);
	localPlanet.clear();
}


Game.drawMap = function ( mapData ) {

	for (let i = 0; i < mapData.length; i++) {
		var planet = new ingamePlanet(
			this , mapData[i]); // спауним планету с сервера в игре

		// рисуем планеты и назначаем управление
		this.planets.push(planet);
		
		let planetSprite = this.planets[i].sprite;
		planetSprite.inputEnabled = true;
		planetSprite.input.useHandCursor = true;
		planetSprite.spriteID = this.planets[i].id;
		planetSprite.events.onInputDown.add(
			this.planets[i].clickAction , this );
	}

	game.input.mouse.capture = true;
}

Game.spawnShip = function ( planetID ) {
	let planet = this.getIngamePlanetByID( planetID );
	if (planet)
		planet.spawnShip('ships');
}

Game.spawnShips = function ( planetID , count) {
	let planet = this.getIngamePlanetByID( planetID );
	if (planet)
		planet.spawnMultipleShips('ships', count);
}

Game.removeShips = function ( planetID , count ) {
	let planet = this.getIngamePlanetByID( planetID );
	if (planet)
		planet.shipsRemoved( count );
}

Game.removeMovingShipWithDistance = function ( fromPlanetID , toPlanetID ) {
	let fromPlanet = this.getIngamePlanetByID( fromPlanetID );
	let toPlanet = this.getIngamePlanetByID( toPlanetID );
	fromPlanet.removeShipByDistance( { x : toPlanet.x , y : toPlanet.y } );
}

Game.changeShipsCount = function ( planetID , count ) {
	let planet = this.getIngamePlanetByID(planetID);
	if (planet) {
		planet.shipsCount = count;
		planet.checkShipsCount();
	}
}

Game.sendShipsToPlanet = function( fromPlanetID , planetID , count  ){
	let fromPlanet = this.getIngamePlanetByID( fromPlanetID );
	let toPlanet = this.getIngamePlanetByID( planetID );
	fromPlanet.sendShipsToPlanet( toPlanet , count );
}

Game.selectPlanet = function( planetID , isEnemy ) {
	let planet = this.getIngamePlanetByID(planetID);
	if (planet)	{
		
		let personalPlanetTarget = this.canvas.selectedPersonalPlanet;
		let enemyPlanetTarget = this.canvas.selectedEnemyPlanet;

		if (isEnemy) {
			enemyPlanetTarget.moveTo( planet.sprite.x , planet.sprite.y );
		} else {
			personalPlanetTarget.moveTo( planet.sprite.x , planet.sprite.y );
			let dist = Math.sqrt(
				Math.pow(personalPlanetTarget.obj.x - enemyPlanetTarget.obj.x , 2) + Math.pow(
					personalPlanetTarget.obj.y - enemyPlanetTarget.obj.y , 2));
			if ( dist < 15 ) {
				enemyPlanetTarget.moveTo( 0 , 0 );
			}
		}
	}
}

Game.updatePlanetInfo = function( planetID , info ) {
	let planet = this.getIngamePlanetByID(planetID);
	if (planet)	{
		planet.player = info.player;

		planet.checkShipsCount();
		planet.checkPlayers();
	}
}

//////////////

Game.getIngamePlanetByID = function( id ) {
	if ( this.planets ) {
		for (let i = 0 ; i < this.planets.length ; i++) {
			if (this.planets[i].id == id) {
				return this.planets[i];
			}
		}
	}
}

//////////////

Game.updateInput = function() {
	
	if (this.game.input.activePointer.isDown) {	
		if (this.game.origDragPoint) {		
			this.game.camera.x += this.game.origDragPoint.x - this.game.input.activePointer.position.x;
			this.game.camera.y += this.game.origDragPoint.y - this.game.input.activePointer.position.y;	
		}
			this.game.origDragPoint = this.game.input.activePointer.position.clone();
	} else {
		this.game.origDragPoint = null;
	}
	this.canvas.move(game.camera.x , game.camera.y);

	// camera scale
	if (this.game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
		this.game.world.scale.setTo(0.5);
	}

}

Game.setCameraXY = function (x,y,isCenter) {
	game.camera.x = x;
	game.camera.y = y;
	if (isCenter) {
		game.camera.x -= game.camera.view.width / 2;
		game.camera.y -= game.camera.view.height / 2;
	}

	this.canvas.move(game.camera.x , game.camera.y);
}

game.state.add('Game',Game);
game.state.start('Game');

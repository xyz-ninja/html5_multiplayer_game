var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function(req , res){
	res.sendFile(__dirname + '/index.html');
});

server.listen(9000 , function() {
	console.log('Listening on '+ server.address().port);
});

class Player {
	constructor (id , arrayPos) {
		this.id = id;

		this.personalPlanets = [];

		// input
		this.selectedPersonalPlanetID = null;
		this.selectedEnemyPlanetID = null;

		this.selectedShipsCount = 1;
		this.selectedShipsInPercents = false;
	}

	// input 
	selectPlanet( id ) {

		let isEnemy = false;

		if ( this.personalPlanets.includes(id)) {
			this.selectedPersonalPlanetID = id;
			isEnemy = false;
		} else {
			this.selectedEnemyPlanetID = id;
			isEnemy = true;
		}
		
		return isEnemy; // если нужно только выбрать планету
  	}

  	moveToPlanet( id ) {
  		if (this.personalPlanets.includes(id)) {
  			// если нужно отправить юнитов к себе
			if ( this.selectedPersonalPlanetID == id ) {
				return "transport";
			}
		} else {
			// если нужно атаковать
			if ( this.selectedEnemyPlanetID == id ) {
				return "attack";		
			}
		}

		return undefined;
  	}

	changeSelectedShipsCount( count , inPercents ) {
		this.selectedShipsCount = count;
		this.selectedShipsInPercents = inPercents;
	}
}

class Planet {
	constructor (id,sprite,x,y,player) {
		this.id = id;
		this.sprite = sprite;
		this.x = x;
		this.y = y;
		this.player = player;

		this.shipsCount = 0;
		this.maxShipsCount = 64;
	}
}

function generateMap() {
	let planetID = 0;
	let planets = [];
	let planetsPositions = []; // для проверки пересечений планет
	let planetsCount = 115;

	console.log('[GENERATION STARTED...]');
	for (let i = 2; i <= planetsCount + 20; i++) {
		let planetX;
		let planetY;

		// проверка для того что-бы планеты не пересекались
		let positionFound = false;
		while (!positionFound) {
			
			planetX = randomInt(25,60) * i + 35;
			planetY = randomInt(25,45) * i;
			
			let haveCollide = false;
			for (let j = 0 ; j < planetsPositions.length; j++) {
				let currentPlanet = planetsPositions[j];
				let currentDist = Math.sqrt( 
					Math.pow(currentPlanet.x - planetX , 2) + Math.pow(currentPlanet.y - planetY , 2)  )
				
				let minimumDist = 70;
				
				if (currentDist <= minimumDist) {
					haveCollide = true;
					console.log(
						'planet id'+planetID+' have colliding,dist = '+
						currentDist + ' [search for another pos...]');
					break;
				}
			}

			if (!haveCollide) {
				positionFound = true;
			}
		}
		if (i > 20) {
			var planet = new Planet(
				planetID++ ,
				'planet' ,
				planetX ,
				planetY ,
				null );
			planetsPositions.push({x : planetX , y : planetY});
			planets.push(planet);
		}
	}
	console.log('[GENERATION COMPLETE]');
	return planets;
}

var planetsArr = generateMap();
var playersArr = [];

server.lastPlayerID = 0;
server.lastPlanetID = 0;

io.on('connection' , (socket) => {
	socket.on('newConnection', () => {

	    socket.player = new Player(server.lastPlayerID++);
		
		playersArr.push( socket.player );
		socket.emit('successfulConnection' , socket.player);
		console.log('Player id:' , socket.player.id , ' connected');

		// отсылаем клиенту карту
		socket.on('requestMapData', () => {
			socket.emit('acceptMapData' , planetsArr);
		});

		// спауним игрока
		socket.on('requestStartPlanet', () => {
			var isPlanetFound = false;
			var planetID = 0;
			while ( ! isPlanetFound ) {
				if (planetsArr) {
					// test
					if (server.lastPlanetID == 0) {
						planetID = randomInt(0,planetsArr.length);
						server.lastPlanetID = planetID;
					}
					else {
						planetID = server.lastPlanetID + 1;
						server.lastPlanetID++;
					}

					if (planetsArr[planetID].player == null) {
						planetsArr[planetID].player = socket.player;
						isPlanetFound = true;
					} else {
						isPlanetFound = false;
					}
					console.log('[ONLINE PLAYERS :]');
					console.log(playersArr);
				}
			}

			planetsArr[planetID].player.personalPlanets[0] = planetsArr[planetID].id;

			socket.emit('acceptStartPlanet' , planetsArr[planetID]);
			socket.broadcast.emit('spawnPlayer' , planetsArr[planetID]);

			io.emit('updatePlayersArr' , playersArr);
			
		
		});

		socket.on('disconnect', () => {
			console.log('Player id:' , socket.player.id , ' disconnected');
			// очищаем все планеты игрока
			let remPlanets = socket.player.personalPlanets;
			for (let i = 0; i < remPlanets.length; i++){
				let currentRemove = remPlanets[i];
				planetsArr[currentRemove].player = null;
				planetsArr[currentRemove].shipsCount = 0;
				socket.broadcast.emit(
					'clearPlanet' , planetsArr[currentRemove]);
			}
			
			playersArr.splice( getPlayerArrayPosByID(socket.player.id) , 1 );
			
			io.emit('updatePlayersArr' , playersArr);

			console.log(playersArr);
		});

		// PLAYERS ACTIONS

		socket.on('inputChangeSelectedShipsCount' , ( playerID , count , inPercents ) => {
			let currentPlayer = getPlayerByID( playerID );
			currentPlayer.changeSelectedShipsCount( count , inPercents );
			socket.emit('updatePlayer' , currentPlayer);
		}); 

		socket.on('inputSelectPlanet' , ( playerID , planetID ) => {

			let currentPlayer = getPlayerByID( playerID );

			let fromPlanetID = currentPlayer.selectedPersonalPlanetID;

			let isEnemy = currentPlayer.selectPlanet( planetID );

			socket.emit('selectPlanet' , planetID , isEnemy );	

		});

		socket.on('moveToPlanet' , ( playerID , planetID ) => {
			
			let currentPlayer = getPlayerByID( playerID );

			let fromPlanetID = currentPlayer.selectedPersonalPlanetID;

			let action = currentPlayer.moveToPlanet( planetID );

			if ( action == "attack" ) {
				io.emit('sendShipsToPlanet' ,
					fromPlanetID , planetID , calculateSendShipsCount( currentPlayer.id ) , true);
			} else if ( action == "transport" ) {
				io.emit('sendShipsToPlanet' ,
					fromPlanetID , planetID , calculateSendShipsCount( currentPlayer.id ) , false);
			} 

		});

		// спауним корабли
		socket.on('spawnShip', (playerID) => {
			let player = getPlayerByID(playerID);
			for (let i = 0; i < player.personalPlanets.length; i++ ) {
				let currentPlanet = planetsArr[player.personalPlanets[i]];

				if ( currentPlanet.shipsCount < currentPlanet.maxShipsCount ) {
					currentPlanet.shipsCount++;
					io.emit('spawnShip', currentPlanet.id);
					socket.broadcast.emit(
						'changeShipsCount' ,
						currentPlanet.id ,
						currentPlanet.shipsCount );
				}
			}
		});

		socket.on('removeShips' , (count , planetID) => {
			let currentPlanet = getPlanetByID( planetID );
			
			currentPlanet.shipsCount -= count;
			io.emit(
				'changeShipsCount' ,
				currentPlanet.id,
				currentPlanet.shipsCount );
			io.emit( 'removeShips' , currentPlanet.id , count );
			

		});

		socket.on('shipEnterPlanet' , (fromPlanetID , toPlanetID , playerID ) => {
			let currentPlanet = getPlanetByID( toPlanetID );
			let currentPlayer = getPlayerByID( playerID );
			let fromPlanet = getPlanetByID( fromPlanetID );

			let isAttack;

			if ( currentPlayer.personalPlanets.includes(toPlanetID) )
				isAttack = false;
			else 
				isAttack = true;

			if (isAttack) { // если это атака
				
				if (currentPlanet.shipsCount > 1) {
					// атакуем юнитов
					currentPlanet.shipsCount -= 1;
					io.emit(
						'changeShipsCount' ,
						currentPlanet.id,
						currentPlanet.shipsCount );
					io.emit('removeMovingShipWithDistance' , fromPlanetID , toPlanetID);

				} else {
					// захватываем планету
					// получаем прошлого владельца если он есть
					if ( currentPlanet.player ) {
						let prevPlanetPlayer = getPlayerByID(currentPlanet.player.id);
						// удаляем планету из его массива доступных планет
						for (let i = 0; i < prevPlanetPlayer.personalPlanets.length ; i++) {
							if ( prevPlanetPlayer.personalPlanets[i] == toPlanetID ) {
								prevPlanetPlayer.personalPlanets.splice(i,1);
								io.emit('updatePlayersArr' , playersArr);
								io.emit('updatePlayerByID' , prevPlanetPlayer.id , prevPlanetPlayer);
							}
						}
					}

					// добавляем планету новому владельцу
					let newPlanetPlayer = getPlayerByID(playerID);
					console.log(newPlanetPlayer);
					
					currentPlanet.player = newPlanetPlayer;
					newPlanetPlayer.personalPlanets.push(currentPlanet.id);

					io.emit('updatePlayersArr' , playersArr);
					io.emit('updatePlayerByID' , newPlanetPlayer.id , newPlanetPlayer);

					// убираем атакующий корабль
					io.emit('removeMovingShipWithDistance' , fromPlanetID , toPlanetID);
					io.emit('updatePlanetInfo' , toPlanetID , {
						player : newPlanetPlayer
					});
					io.emit(
						'changeShipsCount' ,
						fromPlanet.id ,
						fromPlanet.shipsCount );

					socket.emit('updateSelection' , playerID , toPlanetID);
				}
			} else { // если это транспортировка
				if ( currentPlanet.shipsCount < currentPlanet.maxShipsCount ) {
					
					currentPlanet.shipsCount++;
					io.emit('spawnShip', currentPlanet.id);
					socket.broadcast.emit(
						'changeShipsCount' ,
						currentPlanet.id ,
						currentPlanet.shipsCount );

					fromPlanet.shipsCount -= 1;
					
					io.emit('removeMovingShipWithDistance' , fromPlanetID , toPlanetID);
					io.emit(
						'changeShipsCount' ,
						fromPlanet.id ,
						fromPlanet.shipsCount );

				} else {
					io.emit('removeMovingShipWithDistance' , fromPlanetID , toPlanetID);
					io.emit(
						'changeShipsCount' ,
						fromPlanet.id ,
						fromPlanet.shipsCount );
				}
			}
		});
	});
});

////////////////////////////////////

function getPlayerByID( id ) {
	for ( let i = 0; i < playersArr.length; i++ ) {
		if ( playersArr[i].id == id ) {
			return playersArr[i];
		}		
	}
}
function getPlayerArrayPosByID( id ) {
	for (let i = 0 ; i < playersArr.length ; i++) {
		if ( playersArr[i].id == id ) {
			return i;
		}
	}
}

function getPlanetByID( id ) {
	for ( let i = 0; i < planetsArr.length; i++ ) {
		if ( planetsArr[i].id == id ) {
			return planetsArr[i];
		}		
	}
}

function calculateSendShipsCount( playerID ) {
	let currentPlayer = getPlayerByID(playerID);
	let currentPlanet = getPlanetByID(currentPlayer.selectedPersonalPlanetID);

	let result = currentPlayer.selectedShipsCount;
	
	// если выбраны юниты в процентах 
	if ( currentPlayer.selectedShipsInPercents ) {
		let planetUnitsCount = currentPlanet.shipsCount;
		result = Math.floor(planetUnitsCount * (currentPlayer.selectedShipsCount / 100));
	}

	if ( result > currentPlanet.shipsCount ) {
		return 0;
	} else {
		return result;
	}
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
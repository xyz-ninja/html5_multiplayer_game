var Client = {};

Client.socket = io.connect();

Client.connectNewPlayer = function () {
	Client.socket.emit('newConnection');
}

Client.spawnShip = function( playerID ) {
	Client.socket.emit('spawnShip' , playerID);
}

Client.removeShips = function( count , planetID ) {
	Client.socket.emit('removeShips' , count , planetID );
}

Client.shipEnterPlanet = function( fromPlanetID , toPlanetID , playerID) {
	Client.socket.emit('shipEnterPlanet', fromPlanetID , toPlanetID , playerID);
}

Client.moveToPlanet = function( playerID , planetID ) {
	Client.socket.emit('moveToPlanet' , playerID , planetID );
}

Client.inputSelectPlanet = function( playerID , planetID ) {
	Client.socket.emit('inputSelectPlanet' , playerID , planetID );
}

Client.inputChangeSelectedShipsCount = function( playerID , count , inPercents ) {
	Client.socket.emit('inputChangeSelectedShipsCount' , playerID , count , inPercents);
}

//////////

Client.socket.on('successfulConnection' , ( player ) => {
	Game.updatePlayer(player);
	Client.socket.emit('requestMapData');
});

//////

Client.socket.on('updatePlayersArr' , ( players ) => {
	Game.updatePlayersArr( players );
});

Client.socket.on('spawnPlayer' , ( planet ) => {
	Game.spawnPlayer(planet);
});

Client.socket.on('spawnShip' , ( planetID ) => {
	Game.spawnShip(planetID);
});

Client.socket.on('removeShips' , (planetID , count , playerID) => {
	Game.removeShips(planetID , count , playerID);
});

Client.socket.on('removeMovingShipWithDistance' , ( fromPlanetID , toPlanetID ) => {
	// убирает ближайший к планете(toPlanet) корабль
	Game.removeMovingShipWithDistance(fromPlanetID , toPlanetID);

});

Client.socket.on('sendShipsToPlanet' , ( fromPlanetID , planetID , count , isAttack ) => {
	Game.sendShipsToPlanet(fromPlanetID , planetID , count , isAttack);
});

Client.socket.on('clearPlanet' , ( planet ) => {
	Game.clearPlanet( planet );
});

Client.socket.on('changeShipsCount' , ( planetID , count ) => {
	Game.changeShipsCount(planetID , count);
});

Client.socket.on('selectPlanet' , ( planetID , isEnemy ) => {
	Game.selectPlanet( planetID , isEnemy );
});

Client.socket.on('updatePlayer' , ( player ) => {
	Game.updatePlayer( player );
});

Client.socket.on('updatePlayerByID' , ( id , player ) => {
	Game.updatePlayerByID( id , player );
});

Client.socket.on('updatePlanetInfo' , ( planetID , info ) => {
	Game.updatePlanetInfo( planetID , info );
});

//////

Client.socket.on('acceptMapData', ( mapData ) => {
	Game.drawMap(mapData);
	Client.socket.emit('requestStartPlanet');
});

Client.socket.on('acceptStartPlanet' , ( planet ) => {
	Game.spawnPlayerAtStartPlanet( planet );
});

/////

Client.socket.on('updateSelection' , ( playerID , planetID ) => {
	Client.inputSelectPlanet( playerID , planetID );
});
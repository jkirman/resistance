/***************************/
/* Room Controlling Script */
/***************************/

// Module stuff
var exports = module.exports = {};

var PlayerType = {
	NONE : "NONE",
	RESISTANCE : "RESISTANCE",
	SPY : "SPY"
};

exports.getPlayerTypes = function() { return PlayerType; };

var gamemaster = require("./gamemaster.js");

// The RoomType object contains different game types, each with relevant parameters
var RoomType = {

	NONE : {
		maxPlayers : 1,
		maxMissions : 0
	},

	RESISTANCE : {
		maxPlayers : 10,
		maxMissions : 5
	}

};

/***** Main room master variables and functions **********/

var AllRooms = [];

var genericNames = [
			"Blue Whale", "Clown Fish", "Electric Eel",
			"Hammerhead Shark", "King Mackerel", "Manatee", 
			"Platypus",	"Queen Conch", "Sea Otter", "Velvet Crab"
		];

var closeRoom = function(room) {
	var index = AllRooms.indexOf(room);
	if (index > -1) {
		AllRooms.splice(index, 1);
	} else {
		console.log("Attempted to close non-exixstant room: \n" + room);
	}
};

/***********************************************************/

/******************* Exported functions ********************/

exports.addRoom = function(room) { AllRooms.push(room); };

// This function creates a new room and returns it
exports.createRoom = function() {

    var rID;

    // Ensures that the created game id is not already in use by another room
    do{ rID = Math.floor(Math.random() * 10000); }
    while(findById(AllRooms, rID) !== null);

    var newRoom = new Room(rID);
    newRoom.changeRoomType(RoomType.RESISTANCE);
    /** TODO : Update the room URL here **/
    exports.addRoom(newRoom);

	return newRoom;

};

// Creates a new room and 
exports.startNewRoom = function() {
	var newRoom = exports.createRoom();
	var player = newRoom.addNewPlayer();
	return [newRoom, player];
};

exports.findRoom = function(rID) {
    return findById(AllRooms, rID);
};

exports.createPlayer = function(playerName) {
	var newPlayer = new Player(playerName);
	return newPlayer;
};

exports.getRoomList = function() {
	return AllRooms;
};

/**************************************************************************/

/************ Objects ****************/


// Player object constructor
function Player(pName, pID) {

	// Object variables
	var _genericName = pName;
	var _name = pName;
	var _pID = pID;
	var _isLeader = false;
	var _type = PlayerType.RESISTANCE;
	var _ready = false;

	this.getName = function() { return _name; };
	this.getGenericName = function() { return _genericName; };
	this.getId = function() { return _pID; };
	this.changeName = function(name) { _name = name; };
	this.setLeader = function(isLeader) { _isLeader = isLeader; };
	this.getIsLeader = function() {return _isLeader; };
	this.setType = function(type) { _type = type; };
	this.getType = function() { return _type; };
	this.isReady = function() { return _ready; };
	this.setReady = function(ready) { _ready = ready; };
	this.toggleReady = function() { _ready =! _ready };
}

// Room object constructor
function Room(ID) {

	// Room parameters
	var _ID = ID;
	var _players = [];
	var _type = RoomType.NONE;
	var _roomURL = ""; // Generate URL here
	var _genericPlayerNames = genericNames.slice();
	var _spies = [];
	var _gameMaster = gamemaster.createGame();
	
	// Add a new player with a generic name
	this.addNewPlayer = function(pID) {
		if (this.isFull()) {
			console.log("The room is full!");
			return;			
		} else {
			var newName = _genericPlayerNames.pop();
			_players.push(new Player(newName, pID));
			return newName;
		}
	};
	
	// Toggles a player's ready status and if there are at least 5 players in
	// the room and all of them say they are ready, the game is started
	this.toggleReady = function(player) {
		player.toggleReady();
		if (this.gameCanStart()) {
			this.startGame();			
		}
	};
	
	this.startGame = function(){
		_gameMaster.startGame(_players);
		_gameMaster.nextMission();
		this.updateSpies();
	};
	
	this.updateSpies = function(){
		_players.forEach(function(p){
			if (p.getType() == PlayerType.SPY){
				_spies.push(p);
			}
		});
	};
	
	// Given a player object and a name string, this function changes
	// the name of the player if it is not used by another player in the 
	// current room
	this.changePlayerName = function(player, newName) {
		if (genericNames.indexOf(newName) > -1) {
			throw new Error(newName + " is a restricted name!");
		} else if (findPlayerByName(_players, newName) === null) {
			player.changeName(newName);
		} else {
			throw new Error("A player with the name " + newName + " already exists in this room!");
		}
		return player.getName();
	};
	
	this.setPlayerReady = function(player, readyStatus) {
		// @jeff we need to check if room is in a state where players are allowed to change their readyStatus before calling this
		player.setReady(readyStatus);
	};
	
	this.gameCanStart = function() {
		var gameCanStart = true;
		_players.forEach(function(p){
			if (!p.isReady()) {
				gameCanStart = false;
			}
		});
		if(_players.length < 5) {
			gameCanStart = false;
		}
		return gameCanStart;
	};
	
	// GAMEMASTER FUNCTIONS //
	
	this.togglePlayerForMission = function(triggeredId, playerID) { _gameMaster.togglePlayerForMission(triggeredId, playerID); };
	this.voteOnMissionAttempt = function(playerID, vote) { _gameMaster.voteOnMissionAttempt(playerID, vote); };
	this.submitPlayersForMission = function() { _gameMaster.startVoting(); };
	this.voteOnMissionSuccess = function(playerID, vote) { _gameMaster.voteOnMissionSuccess(playerID, vote); };
	
	//////////////////////////
	
	// Given a Player object, this function removes them from the current room
	this.removePlayer = function(playerID) {
		var player = findById(_players, playerID);
		var index = _players.indexOf(player);
		if (player != null) {
			_genericPlayerNames.push(player.getGenericName());
			_players.splice(index, 1);
		} else {
			console.log("Attempted to remove non-existant player: \n" + player);
		}
	};
	
	this.changeRoomType = function(rType) {
		_type = rType;
	};

	// This function removes the current Room object from the list of rooms
	// if there are no players in it
	this.validateRoom = function() {
		if (_players.length == 0) {
			closeRoom(this);
		}
	};
	
	this.getId = function() { return _ID; };
	
	this.isFull = function() {
		return (_players.length >= _type.maxPlayers);
	};
	
	this.getPlayerByName = function(name) {
		return findPlayerByName(_players, name);
	};
	
	this.getPlayerById = function(id) {
		return findById(_players, id);
	};
	
/*	// TODO: Figure out a clean way to send room info as JSON and parse it on the client
	this.toString = function() {
		var plList = {};
		_players.forEach(function(player) {plList[player.getId()] =  {name: player.getName(), ready: player.isReady()} });
		return {ID: _ID, players: plList, type: _type, roomURL: _roomURL, gameStart: this.gameCanStart(), playerId: null};
	};*/
	
	this.getSpyList = function() { return _spies; };
	
	this.getPlayerList = function() { return _players; };
	
	this.getSerialPlayerList = function() {
		var playerList = this.getPlayerList();
		var serialList = {};
		playerList.forEach(function(player) {serialList[player.getId()] = {Name: player.getName(), Ready: player.isReady(), Type: player.getType()} });
		return serialList;
	};
	
	this.getSerialSpyList = function() {
		var spyList = this.getSpyList();
		var serialList = [];
		spyList.forEach(function(player) { serialList.push(player.getId())});
		return serialList;
	};
	
	this.getSerialRoomInfo = function(player) {
		//parameters
		var _playerList = this.getSerialPlayerList();
		var _spyList = this.getSerialSpyList();
		var _gameInfo;
		var _score;
		var _gameWinner;
		
		this.updateSpies;
		if (player.getType() == PlayerType.SPY){
			_spyList = 	this.getSerialSpyList();				
		} else {
			_spyList = [];
		}
		
		_gameInfo = _gameMaster.getGameInfo();
		_score = _gameMaster.getScore();
		_gameWinner = _gameMaster.getGameWinner();
		
		return {
			PlayerList : _playerList,
			SpyList : _spyList,
			GameInfo : _gameInfo,
			ResistancePoints : _score[0],
			SpyPoints : _score[1],
			GameWinner : _gameWinner
		};
		
	}
	
	
	this.getRoomInfo = function(player) {
		//parameters
		var _playerList = this.getPlayerList();
		var _spyList;
		var _gameInfo;
		var _score;
		var _gameWinner;
		
		this.updateSpies;
		if (player.getType() == PlayerType.SPY){
			_spyList = 	this.getSpyList();				
		} else {
			_spyList = [];
		}
		
		_gameInfo = _gameMaster.getGameInfo();
		_score = _gameMaster.getScore();
		_gameWinner = _gameMaster.getGameWinner();
		
		return {
			PlayerList : _playerList,
			SpyList : _spyList,
			GameInfo : _gameInfo,
			ResistancePoints : _score[0],
			SpyPoints : _score[1],
			GameWinner : _gameWinner
		};
	};
	
		// ADDED FOR UNIT TESTS //
	
	// Add a new player with a generic name (for testing)
	this.addNewPlayerTest = function() {
		
		if (_players.length >= _type.maxPlayers) {
			console.log("The room is full!");
			return;			
		} else {
			var newName = _genericPlayerNames.pop();
			var p = new Player(newName);
			_players.push(p);
			return p;
		}
	};
	
	this.getGameMaster = function() {
		return _gameMaster;	
	};
	 //////////////////////////////

}

///////////////////////////
// Useful helper methods //
///////////////////////////


// Finds in a list objects by ID
// source : http://stackoverflow.com/questions/7364150/find-object-by-id-in-an-array-of-javascript-objects
function findById(source, id) {
  for (var i = 0; i < source.length; i++) {
    if (source[i].getId() === id) {
      return source[i];
    }
  }
  return null;
}

function findPlayerByName(source, name) {
  for (var i = 0; i < source.length; i++) {
    if (source[i].getName() === name) {
      return source[i];
    }
  }
  return null;
}

////////////////////////////////////
////// GAME LOGIC UNIT TESTS ///////
////////////////////////////////////

var test = require("unit.js");
var assert = test.assert;

// ---------------------------------
// Unit tests for stories 1, 2 and 3
// ---------------------------------

	// Test setup
	var troom = null;
	var tplayer = null;

	// Test that a room is created (createRoom() function)
	assert.strictEqual(AllRooms.length, 0, 'Room list not initially empty.');
	exports.startNewRoom();
	assert.strictEqual(AllRooms.length, 1, 'Room was not created.');
	
	troom = AllRooms[0];
	
	assert.equal(findById(AllRooms, troom.getId()), troom, 'Room finding does not work.');

	// Test if new player has been added to the room
	assert.notEqual(troom.getPlayerList().length, 0, 'No players in room.');
	
	tplayer = troom.getPlayerList()[0];

	// Test if you can change the player's name
	var newTestName = "Test";
	troom.changePlayerName(tplayer, newTestName);
	assert.equal(tplayer.getName(), newTestName);
	
	// Test if you can't change to a restricted name
	for(var i = 0; i < genericNames.length; i++){
		try{troom.changePlayerName(tplayer, newTestName);}
		catch (e) {}
	}
	assert.equal(tplayer.getName(), newTestName);
	
	// Test if you can't change to a name already in use
	var newTestName2 = "Test2";
	var tplayer2 = troom.addNewPlayerTest();
	try {
		troom.changePlayerName(tplayer2, newTestName2);
		troom.changePlayerName(tplayer, newTestName2);
	} catch (e) {}
	assert.notEqual(tplayer.getName(), newTestName2);

// -----------------------------
// User story 4, assigning teams
// -----------------------------
	for (var i = 5; i <= 10; i++) {
		var testRoom = exports.createRoom();
		for (var j = 0; j < i; j++) {
			testRoom.addNewPlayer(j);
		}
		testRoom.startGame();
		assert.equal(testRoom.getSpyList().length, gamemaster.spiesInGame(i));
	}


// ----------------------------------------------
// User stories 5 and 6, revealing spies to spies
// ----------------------------------------------
	var testRoom = exports.createRoom();
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	testRoom.startGame();
	testRoom.getPlayerList().forEach(function(p) {
		var gi = testRoom.getRoomInfo(p);
		assert.equal(p.getType() == PlayerType.SPY, gi.SpyList.length != 0);
	});

// ----------------------------------------------------------
// User story 7, only the leader is notified to be the leader
// ----------------------------------------------------------
	
	// Normal case
	testRoom = exports.createRoom();
	var lastLeaderID;
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	testRoom.startGame();
	testRoom.getPlayerList().forEach(function(p) {
		var gi = testRoom.getRoomInfo(p).GameInfo.slice().pop();
		lastLeaderID = gi.leaderID;
		assert.equal(lastLeaderID == p.getId(), p.getIsLeader());
	});
	
	// Next mission
	testRoom.getGameMaster().nextMission();
	testRoom.getPlayerList().forEach(function(p) {
		var gi = testRoom.getRoomInfo(p).GameInfo.slice().pop();
		assert.notEqual(lastLeaderID, gi.leaderID);
		assert.equal(gi.leaderID == p.getId(), p.getIsLeader());
	});
	
	lastLeaderID = testRoom.getGameMaster().getGameInfo().leaderID;
	
	// Next attempt
	testRoom.getGameMaster().nextAttempt();
	testRoom.getPlayerList().forEach(function(p) {
		var gi = testRoom.getRoomInfo(p).GameInfo.slice().pop();
		assert.notEqual(lastLeaderID, gi.leaderID);
		assert.equal(gi.leaderID == p.getId(), p.getIsLeader());
	});

// -----------------------
// User story 8 and 9 test
// -----------------------

	testRoom = exports.createRoom();
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	
	testRoom.startGame();
	var pList = testRoom.getPlayerList();
	var gm = testRoom.getGameMaster();
	
	// 8 Alternate scenario too few
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[0].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[1].getId());
	
	assert.throws(function() {gm.startVoting()});
	
	// 8 too many
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[2].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[3].getId());
	
	assert.throws(function() {gm.startVoting()});
	
	// 8 normal case
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[3].getId());
	
	gm.startVoting();
	assert.equal(gm.getGameInfo().pop().playersChosen, true);
	
	// no > yes
	var attemptno = gm.getGameInfo().peek().attemptNumber;
	for (var i = 0; i < pList.length; i++) {
		gm.voteOnMissionAttempt(pList[i].getId(), false);
	}
	
	assert.notEqual(gm.getGameInfo().peek().attemptNumber, attemptno);
	
	// yes = no
	gm.togglePlayerForMission(pList[0].getId());
	gm.togglePlayerForMission(pList[1].getId());
	gm.togglePlayerForMission(pList[2].getId());
	
	var attemptno = gm.getGameInfo().peek().attemptNumber;
	var missionno = gm.getGameInfo().peek().missionNumber;
	for (var i = 0; i < pList.length/2; i++) {
		gm.voteOnMissionAttempt(pList[i].getId(), false);
	}
	for (var i = pList.length/2; i < pList.length; i++) {
		gm.voteOnMissionAttempt(pList[i].getId(), true);
	}
	
	assert.equal(gm.getGameInfo().peek().attemptNumber, attemptno);
	assert.equal(gm.getGameInfo().peek().missionNumber, missionno);
	
	// yes > no
	testRoom = exports.createRoom();
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	
	testRoom.startGame();
	pList = testRoom.getPlayerList();
	gm = testRoom.getGameMaster();
	
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[0].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[1].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[2].getId());
	
	attemptno = gm.getGameInfo().peek().attemptNumber;
	missionno = gm.getGameInfo().peek().missionNumber;
	for (var i = 0; i < pList.length; i++) {
		gm.voteOnMissionAttempt(pList[i].getId(), true);
	}
	
	assert.equal(gm.getGameInfo().peek().attemptNumber, attemptno);
	assert.equal(gm.getGameInfo().peek().missionNumber, missionno);

// ------------------
// User story 10 test
// ------------------

	// Mission success all players
	for (var i = 0; i < 3; i++) {
		gm.voteOnMissionSuccess(pList[i].getId(),true);
	}
	
	assert.equal(gm.getScore()[0], 1);
	
	// Mission failure with one no vote
	testRoom = exports.createRoom();
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	
	testRoom.startGame();
	pList = testRoom.getPlayerList();
	gm = testRoom.getGameMaster();
	
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[0].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[1].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[2].getId());
	
	for (var i = 0; i < pList.length; i++) {
		gm.voteOnMissionAttempt(pList[i].getId(), true);
	}
	
	for (var i = 0; i < 2; i++) {
		gm.voteOnMissionSuccess(pList[i].getId(), true);
	}
	gm.voteOnMissionSuccess(pList[2].getId(), false);
	
	assert.equal(gm.getScore()[1], 1);
	
	// Pass with one no
	testRoom = exports.createRoom();
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	
	testRoom.startGame();
	pList = testRoom.getPlayerList();
	gm = testRoom.getGameMaster();
	gm._gameInfo[0].missionNumber = 4;
	
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[0].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[1].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[2].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[3].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[4].getId());
	
	for (var i = 0; i < 4; i++) {
		gm.voteOnMissionSuccess(pList[i].getId(), true);
	}
	gm.voteOnMissionSuccess(pList[4].getId(), false);
	
	assert.equal(gm.getScore()[0], 1);
	
	// Fail with 2 mission that requires 1 less to win
	testRoom = exports.createRoom();
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	
	testRoom.startGame();
	pList = testRoom.getPlayerList();
	gm = testRoom.getGameMaster();
	gm._gameInfo[0].missionNumber = 4;
	
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[0].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[1].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[2].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[3].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[4].getId());
	
	for (var i = 0; i < 3; i++) {
		gm.voteOnMissionSuccess(pList[i].getId(), true);
	}
	gm.voteOnMissionSuccess(pList[3].getId(), false);
	gm.voteOnMissionSuccess(pList[4].getId(), false);
	
	assert.equal(gm.getScore()[1], 1);

// -------------
// User story 12
// -------------

	testRoom = exports.createRoom();
	for (var j = 0; j < 10; j++) {
		testRoom.addNewPlayer(j);
	}
	
	testRoom.startGame();
	pList = testRoom.getPlayerList();
	gm = testRoom.getGameMaster();
	
	assert.equal(testRoom.getRoomInfo(pList[0]).ResistancePoints,0);
	assert.equal(testRoom.getRoomInfo(pList[0]).SpyPoints,0);
	
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[0].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[1].getId());
	gm.togglePlayerForMission(gm.getGameInfo().peek().leaderID, pList[2].getId());
	
	for (var i = 0; i < pList.length; i++) {
		gm.voteOnMissionAttempt(pList[i].getId(), true);
	}
	
	for (var i = 0; i < 2; i++) {
		gm.voteOnMissionSuccess(pList[i].getId(), true);
	}
	gm.voteOnMissionSuccess(pList[2].getId(), false);
	
	assert.equal((testRoom.getRoomInfo(pList[0]).ResistancePoints != 0) ||
		(testRoom.getRoomInfo(pList[0]).SpyPoints != 0), true);
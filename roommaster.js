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
	var newPlayer = new Player(playerName)
	return newPlayer;
}

exports.getRoomList = function() {
	return AllRooms;
}

/**************************************************************************/

/************ Objects ****************/


// Player object constructor
function Player(pName, pID) {

	// Object variables
	var _genericName = pName;
	var _name = pName;
	var _pID = pID

	this.getName = function() { return _name; };
	this.getGenericName = function() { return _genericName; };
	this.getId = function() { return _pID}
	this.changeName = function(name) { _name = name; };

}

// Room object constructor
function Room(ID) {

	// Room parameters
	var _ID = ID;
	var _players = [];
	var _type = RoomType.NONE;
	var _roomURL = ""; // Generate URL here
	var _genericPlayerNames = genericNames.slice();
	
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
	
	// Given a player object and a name string, this function changes
	// the name of the player if it is not used by another player in the 
	// current room
	this.changePlayerName = function(player, newName) {
		if (genericNames.indexOf(newName) > -1) {
		} else if (findPlayerByName(_players, newName) === null) {
			player.changeName(newName);
		} else {
			console.log("A player with the name " + newName + " already exists in this room!");
		}
		return player.getName();
	};
	
	// Given a Player object, this function removes them from the current room
	this.removePlayer = function(player) {
		var index = _players.indexOf(player);
		if (index > -1) {
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
		if (_players.length === 0) {
			closeRoom(this);
		}
	};
	
	this.getId = function() { return _ID; };
	
	this.isFull = function() {
		return (_players.length >= _type.maxPlayers)
	}
	
	this.getPlayerByName = function(name) {
		return findPlayerByName(_players, name);
	}
	
	this.getPlayerById = function(id) {
		return findById(_players, id);
	}
	
	// TODO: Figure out a clean way to send room info as JSON and parse it on the client
	this.toString = function() {
		var plList = []
		_players.forEach(function(player) {plList = plList.concat(player.getName() )})
		return {ID: _ID, players: plList, type: _type, roomURL: _roomURL}
	}
	
		// ADDED FOR UNIT TESTS //
	
	this.getPlayerList = function() { return _players; };
	
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

// Unit tests for stories 1, 2 and 3

var test = require("unit.js");

// Test setup
var assert = test.assert;

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
	troom.changePlayerName(tplayer, newTestName);
}
assert.equal(tplayer.getName(), newTestName);

// Test if you can't change to a name already in use
var newTestName2 = "Test2";
var tplayer2 = troom.addNewPlayerTest();
troom.changePlayerName(tplayer2, newTestName2);
troom.changePlayerName(tplayer, newTestName2);
assert.notEqual(tplayer.getName(), newTestName2);

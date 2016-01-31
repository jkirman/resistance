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

/***** Main room master variables and functions that are exported **********/

var AllRooms = [];

exports.addRoom = function(room) { AllRooms.push(room); };

// This function creates a new room and returns it
exports.createRoom = function() {

    var rID;

    // Ensures that the created game id is not already in use by another room
    do{ rID = Math.floor(Math.random() * 10000); }
    while(findRoomById(AllRooms, rID) !== null);

    var newRoom = new Room(rID);
    newRoom.changeRoomType(RoomType.RESISTANCE);
    /** TODO : Update the room URL here **/
    exports.addRoom(newRoom);

	return newRoom;

};

exports.startNewRoom = function(playerName) {
	var newRoom = exports.createRoom();
	var newPlayer = new Player(playerName);
	newRoom.addPlayer(newPlayer);
};

exports.findRoom = function(rID) {
    return findRoomById(AllRooms, rID);
};

/**************************************************************************/

/************ Objects ****************/


// Player object constructor
function Player(pName) {

	// Object variables
	var _name = pName;

	this.getName = function() { return _name; };

}

// Room object constructor
function Room(ID) {

	// Room parameters
	var _ID = ID;
	var _players = [];
	var _type = RoomType.NONE;
	var _roomURL = ""; // Generate URL here

	this.addPlayer = function(player) {
		if (findPlayerByName(_players,player.getName()) !== null) { 
			console.log("A player with that name is already in this room.");
			return;
		} else if (_players.length >= _type.maxPlayers) {
			console.log("The room is full!");
			return;
		} else { 
			_players.push(player); 
		}
		
	};

	this.changeRoomType = function(rType) {
		_type = rType;
	};

	this.getID = function() { return _ID; };

}

///////////////////////////
// Useful helper methods //
///////////////////////////


// Finds in a list objects by ID
// source : http://stackoverflow.com/questions/7364150/find-object-by-id-in-an-array-of-javascript-objects
function findRoomById(source, id) {
  for (var i = 0; i < source.length; i++) {
    if (source[i].getID() === id) {
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
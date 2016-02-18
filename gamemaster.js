/**
 * ----------------------
 * Game Controller Script
 * ----------------------
 * 
 * This script has all the functions to control a game datatype
 * 
**/

// The game datatype for reference
var Game = {
  roomID : 0
  
};

// Module stuff
var exports = module.exports = {};


// Variables
var _roomID = 0;
var _playerIDList = [];

var _gameInfo = []; // Main array that contains all game data (to be sent to client for info)
// It contains several arrays, each array having the following information at their indicies:
// 0: Mission #
// 1: Mission Attempt #
// 2: Leader Player ID (for that attempt)
// 3: List of Player ID of the players selected for the mission
// 4: Boolean indicating whether the players chosen have been locked in
// 5: Voting results for going on the mission [[PlayerID1, YES], [PlayerID2, YES], ...]
// 6: Boolean indicating whether the mission attempt will go with the current players chosen (null if the mission does not happen)
// 7: The yes and no votes for the mission [3,0]
// 8: Boolean indicating whether the mission has passed (null if them mission has not happened)

// Accumulates the required variables for the game controller to run properly
exports.initializeGame = function(roomID, playerIDList) {
	_roomID = roomID;
	_playerIDList = playerIDList;
}

// This function goes to the next mission
exports.nextMission = function(leaderID) {
	if (_gameInfo.length == 0) {
		_gameInfo.push(newMission(1,1,leaderID));
	} else {
		var lastMission = _gameInfo.peek();
		_gameInfo.push(newMission(lastMission[0]+1, 1, leaderID));
	}
};

// This function goes to the next mission attempt
exports.nextAttempt = function(leaderID) {
	if (_gameInfo.length == 0) {
		// TODO Error here
		console.log("Error, no mission has started!");
	} else {
		var lastMission = _gameInfo.peek();
		if (lastMission[1] < 3) {
			_gameInfo.push(newMission(lastMission[0], lastMission[1]+1, leaderID));
		} else {
			// TODO Error here
			console.log("Maximum amount of attempts reached");
		}
	}
};

// This function loops the list of players based on the last leader
// and returns the player id of the next leader
exports.nextLeader = function(playerIDList) {
	var currentIndex = playerIDList.indexOf(_gameInfo.peek()[3]);
	if (currentIndex == playerIDList.length-1) {
		return playerIDList[0];
	} else {
		return playerIDList[currentIndex+1]
	}
};

// Enters the player into the list of selected players of the current mission attempt
exports.selectPlayerForMission = function(playerID) {
	// TODO To be implemented
};

// Removes a player from the list of selected players of the current mission attempt
exports.removePlayerForMission = function(playerID) {
	// TODO To be implemented
};

// Checks to make sure that the right amount of players have been selected and
// subsequently lets client know the voting to go on the mission has started
// Checks to see if voting is even required (ie 3rd attempt)
exports.startVoting = function() {
	// TODO To be implemented
};

// Adds a players vote to the list of votes for the mission attempt
// Checks to see if the player already voted, and also checks to see if the
// last player voted and subsequently calls the mission attempt function
exports.voteOnMissionAttempt = function(playerID, vote) {
	// TODO To be implemented
};

// Updates the mission attempt to either go on the attempt or not
// If voted no, triggers the next mission attempt
function missionAttempt() {
	// TODO To be implemented	
}

// Adds a players vote to the list of votes for the mission success
// Checks to see if the player that voted is on the list of players that are
// able to vote
// Checks to see if the player already voted, and also checks to see if the
// last player voted and subsequently calls the mission success function
exports.voteOnMissionSuccess = function(playerID, vote) {
	// TODO To be implemented
};

// Updates the mission success
function missionAttempt() {
	// TODO To be implemented	
}

// Checks to see if a team won the game
function checkGameWinner() {
	// TODO To be implemented	
}

exports.getGameInfo = function() {
	_gameInfo.splice(-1);
}

var newMission = function(mno, ano, leaderID) {
	var newInfo = [mno, ano, leaderID, false, null, null, null, null, null];
	return newInfo;
}

var calculateAmountOfPlayersOnMission = function(missionNumber) {
	var playerLookUp = [
		[2,3,2,3,3],
		[2,3,3,3,4],
		[2,3,3,4,4],
		[3,4,4,5,5],
		[3,4,4,5,5],
		[3,4,4,5,5]];
		return playerLookUp[_playerIDList.length-5][missionNumber-1];
};

var gameInfo = function() {
	
}

//////////////////////
// Helper functions //
//////////////////////

Array.prototype.peek = function() {
    return this[this.length-1];
}
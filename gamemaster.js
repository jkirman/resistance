/**
 * ----------------------
 * Game Controller Script
 * ----------------------
 * 
 * This script has all the functions to control a game datatype
 * 
**/

var roommaster = require("./roommaster.js");

//////////////////////
// Helper functions //
//////////////////////

Array.prototype.peek = function() {
    return this[this.length - 1];
};

// Finds in a list objects by ID
// source : http://stackoverflow.com/questions/7364150/find-object-by-id-in-an-array-of-javascript-objects
function indexById(source, id) {
  for (var i = 0; i < source.length; i++) {
    if (source[i].getId() === id) {
      return i;
    }
  }
  return null;
}

//*******************************//

// Module stuff
var exports = module.exports = {};

// Game object
var Game = function(players) {
	this._playerList = players;
	this._numberOfPlayers = players.length;
	this._gameInfo = [];
	// Main array that contains all game attempts history (to be sent to client for info)
	// It contains several attempt objects (AttemptsInfo)
	this._gameWinner = roommaster.PlayerType.NONE;
};

// The attempt object
var AttemptInfo = function() {
	this.missionNumber = null; 		// Mission #
	this.attemptNumber = null; 		// Mission Attempt #
	this.leaderID = null; 			// Leader Player ID (for that attempt)
	this.selectedPlayers = []; 		// List of Player ID of the players selected for the mission
	this.playersChosen = false;		// Boolean indicating whether the players chosen have been locked in
	this.attemptVote = [];			// Voting results for going on the mission [[PlayerID1, YES], [PlayerID2, YES], ...]
	this.attemptAllowed = false;	// Boolean indicating whether the mission attempt will go with the current players chosen (null if the mission does not happen)
	this.missionVote = [0,0];		// The yes and no votes for the mission [3,0]
	this.missionPassed = null;		// Boolean indicating whether the mission has passed (null if them mission has not happened)
};

// Export Constructor
exports.Game = Game;

// This function sets the player types for the players in the game randomly
Game.prototype.setPlayerTypes = function() {
	var playersIndeces = [];
	
	do {
		var newIndex = Math.floor(Math.random() * this._playerList.length);
		if (playersIndeces.indexOf(newIndex) == -1) {
			playersIndeces.push(newIndex);
		}
	} while (playersIndeces < spysInGame(this._playerList.length));
	
	for (var i = 0; i < playersIndeces.length; i++) {
		this._playerList[playersIndeces[i]].setType(roommaster.PlayerType.SPY);
	}
	
};

// This function goes to the next mission
// Attempts set to 1
// If it is the first mission, it sets the spies to spies
Game.prototype.nextMission = function() {
	if (this._gameInfo.length == 0) {
		this.setPlayerTypes();
		this._gameInfo.push(newAttempt(1, 1, this.nextLeader()));
	} else {
		var lastMission = this._gameInfo.peek();
		this._gameInfo.push(newAttempt(lastMission.missionNumber + 1, 1, this.nextLeader()));
	}
};

// This function goes to the next mission attempt
// Sets the current attempt leader and increments the attempt number
Game.prototype.nextAttempt = function() {
	if (this._gameInfo.length == 0) {
		// TODO Error here
		console.log("Error, no mission has started!");
	} else {
		var lastMission = this._gameInfo.peek();
		if (lastMission.attemptNumber < 3) {
			this._gameInfo.push(newAttempt(lastMission.missionNumber, lastMission.attemptNumber + 1, this.nextLeader()));
		} else {
			// TODO Error here
			console.log("Maximum amount of attempts reached");
		}
	}
};

// This function loops the list of players based on the last leader
// and sets the next player as the leader also returning their id
Game.prototype.nextLeader = function() {
	var currentAttempt = this._gameInfo.peek();
	if (currentAttempt == undefined) {
		this._playerList[0].setLeader(true);
		return this._playerList[0].getId();
	} else {
		var currentIndex = indexById(this._playerList, currentAttempt.leaderID);
		this._playerList[currentIndex].setLeader(false);
		if (currentIndex == this._playerList.length - 1) {
			this._playerList[0].setLeader(true);
			return this._playerList[0].getId();
		} else {
			this._playerList[currentIndex + 1].setLeader(true);
			return this._playerList[currentIndex + 1].getId();
		}
	}
};

// Toggles a player into the list of selected players of the current mission attempt
Game.prototype.togglePlayerForMission = function(playerID) {
	var selectedPlayers = this._gameInfo.peek().selectedPlayers;
	var index = selectedPlayers.indexOf(playerID);
	if (index == -1) {
		selectedPlayers.push(playerID);
	} else {
		selectedPlayers = selectedPlayers.splice(index, 1);
	}
};

// Checks to make sure that the right amount of players have been selected and
// subsequently lets client know the voting to go on the mission has started
// Checks to see if voting is even required (ie 3rd attempt)
Game.prototype.startVoting = function() {
	var currentAttempt = this._gameInfo.peek();
	if (currentAttempt.selectedPlayers.length != amountOnMission(this._numberOfPlayers, currentAttempt.missionNumber)) {
		return null; // NEED TO IMPLEMENT ERROR HERE
	} else {
		currentAttempt.playersChosen = true;
		
		// Automatically go to a mission if it is the third attempt
		if (currentAttempt.attemptNumber == 3) {
			currentAttempt.attemptAllowed = true;
		}
		
	}
};

// Adds a players vote to the list of votes for the mission attempt
// Checks to see if the player already voted, and also checks to see if the
// last player voted and subsequently calls the mission attempt function
Game.prototype.voteOnMissionAttempt = function(playerID, vote) {
	var currentVotes = this._gameInfo.peek().attemptVote;
	currentVotes.push([playerID, vote]);
	
	if (currentVotes.length == this.numberOfPlayers) {
		this.missionAttempt();
	}
	
	
};

// Updates the mission attempt to either go on the attempt or not
// If voted no, triggers the next mission attempt
Game.prototype.missionAttempt = function() {
	var currentAttempt = this._gameInfo.peek();
	var votes = currentAttempt.attemptVote;
	var yesVotes = 0;
	var noVotes = 0;
	votes.forEach(function(vote) {
		if (vote == true) {
			yesVotes++;
		} else {
			noVotes++;
		}
	});
	if (yesVotes >= noVotes) {
		currentAttempt.attemptAllowed = true;
	} else {
		currentAttempt.attemptAllowed = false;
		this.nextAttempt();
	}
};

// Adds a players vote to the list of votes for the mission success
// Checks to see if the player that voted is on the list of players that are
// able to vote
// Checks to see if the player already voted, and also checks to see if the
// last player voted and subsequently calls the mission success function
Game.prototype.voteOnMissionSuccess = function(playerID, vote) {
	var currentAttempt = this._gameInfo.peek();
	if (currentAttempt.selectedPlayers.indexOf(playerID) != -1) {
		
		if (vote) {
			currentAttempt.missionVote[0]++;
		} else {
			currentAttempt.missionVote[1]++;
		}
		
		if (currentAttempt.missionVote[0] + currentAttempt.missionVote[1] == amountOnMission(this._numberOfPlayers, currentAttempt.missionNumber)) {
			this.missionSuccess();			
		}
	}
};

// Updates the mission success
Game.prototype.missionSuccess = function() {
	var currentMission = this._gameInfo.peek().missionNumber;
	if (currentMission.missionVote[0] >= toWinMission(this._numberOfPlayers, currentMission.missionNumber)) {
		currentMission.missionPassed = true;
	} else {
		currentMission.missionPassed = false;
	}
	this.checkGameWinner();
};

// Checks to see if a team won the game
// if not it will trigger the next mission
Game.prototype.checkGameWinner = function() {
	var resistancePoints = 0;
	var spyPoints = 0;
	this._gameInfo.forEach(function(attempt) {
		if (attempt.missionPassed) {
			resistancePoints++;
		} else if (!attempt.missionPassed) {
			spyPoints++;
		}
	});
	
	if (resistancePoints == 3) {
		this._gameWinner = roommaster.PlayerType.RESISTANCE;
	} else if (spyPoints == 3) {
		this._gameWinner = roommaster.PlayerType.SPY;
	} else {
		this.nextMission();
	}
};

Game.prototype.getGameInfo = function() {
	return this._gameInfo.splice(-1);
};

var newAttempt = function(mno, ano, leaderID) {
	var newInfo = new AttemptInfo();
	newInfo.missionNumber = mno;
	newInfo.attemptNumber = ano;
	newInfo.leaderID = leaderID;
	return newInfo;
}

var spysInGame = function(numberOfPlayers) {
	var spyCount = [2,2,3,3,3,4];
	return spyCount[numberOfPlayers - 5];
};

var amountOnMission = function(numberOfPlayers, missionNumber) {
	var playerLookUp = [
		[2,3,2,3,3],
		[2,3,3,3,4],
		[2,3,3,4,4],
		[3,4,4,5,5],
		[3,4,4,5,5],
		[3,4,4,5,5]];
		return playerLookUp[numberOfPlayers - 5][missionNumber - 1];
};

var toWinMission = function(numberOfPlayers, missionNumber) {
	var playerLookUp = [
		[2,3,2,3,3],
		[2,3,3,3,4],
		[2,3,3,4,4],
		[3,4,4,4,5],
		[3,4,4,4,5],
		[3,4,4,4,5]];
		return playerLookUp[this.numberOfPlayers - 5][missionNumber - 1];
};
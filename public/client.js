/* global io */

var currentGameInfo; // @cecile remove once all this logic is in the clientController

var socket = io.connect();

var IO_redirectToHome = function() {
    var link = window.location.host
    window.location = link;
}

var IO_joinGame = function(gameId) {
    socket.emit('join', gameId)
}

var IO_changePlayerName = function(newName) {
     if(newName != "") {
        socket.emit("changePlayerName", newName);
    }
}

var IO_setPlayerReady = function(readyStatus) {
    socket.emit("setPlayerReady", readyStatus)
}

socket.on('connect', function() {
    var gameId = window.location.pathname.replace('/', '')
    document.getElementById("link").innerHTML = window.location.href;    // @cecile Change this to a function call to clientController that updates the "link" value on the client (we dont want to do it here)
    IO_joinGame(gameId)
});

socket.on('gameInfo', function(gameInfo) {
    // @cecile Change this to a function call to clientController for updating gameInfo based on a received object, then remove all this code
    // The gameInfo will be based on Jeff's object, here's a generic example using made up fields that we need to discuss later:
    // gameInfo = {playerList = {player1Id: player1name, player2Id: player2Name....}, gameStarted: false, missions = [], etc etc...}
    // When this function is called with a gameInfo object where gameInfo.gameStarted == false, then call the right UI functions to show the waiting room and update the player list, etc
    // If it's called where gameInfo.gameStarted == true, then look at the missions table and update info properly, etc etc..
    // We can slowly add functionality as we go
    
    var plList = document.getElementById("playerList");
    while (plList.hasChildNodes()) {   
        plList.removeChild(plList.firstChild);
    }

    for(var pID in gameInfo.players) {
        var node = document.createElement("LI");                 // Create a <li> node
        node.className = "list-group-item list-item-dark";
        var playerString = gameInfo.players[pID].name + ": "
        if(gameInfo.players[pID].ready) {
            playerString += "Ready"
        } else {
            playerString += "Not Ready"
        }
        var textnode = document.createTextNode(playerString);         // Create a text node
        node.appendChild(textnode);                              // Append the text to <li>
        plList.appendChild(node);
    }
    
    if(gameInfo.gameStart == true && currentGameInfo.gameStart == false) {
        // @cecile call whatever function sets the waiting room invisible and the game visible
    }
    
        currentGameInfo = gameInfo

})

socket.on('roomDeleted', function() {
    alert("Room does not exist. Redirecting to homepage.");
    IO_redirectToHome()
})

socket.on('roomFull', function() {
    alert("Room is full. Redirecting to homepage.");
    IO_redirectToHome()
})

// @cecile, put these document element hooks in clientController, then call the appropriate IO_* functions from them
document.getElementById("changeName-button").onclick = function() {
    var newName = document.getElementById("changeName-text").value;
    IO_changePlayerName(newName)
}

document.getElementById("ready-button").onclick = function() {
    if (currentGameInfo != null && currentGameInfo.playerId != null) {
        IO_setPlayerReady(!currentGameInfo.players[currentGameInfo.playerId].ready)
    }
}
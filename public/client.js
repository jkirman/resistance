/* global io */
var currentGameInfo; // @cecile remove once all this logic is in the clientController

var socket = io.connect();

// *********************************
// UI HOOKS
// *********************************

$("#card").click(function() {
    UI_showCard()
});

// @cecile, rework these to use JQuery
document.getElementById("changeName-button").onclick = function() {
    UI_changePlayerName()
}

document.getElementById("ready-button").onclick = function() {
    IO_toggleReady()
}

// *********************************
// UI CALLS
// *********************************

function UI_startGame() {
    $(".waiting-room").hide();
    $(".room").show(); // @cecile not sure if inherit is the right property
}

function UI_showCard() {
    $("#card").toggle();
    $("#card-flip").toggle();
}

function UI_changeScore(team, score) {
    var r = $(team + "-score");
    r.change(r.text(score + 1));
}

function UI_setPlayerReady(newState) {
    if(newState) {
        $("ready-button").attr("value", "Ready")
    }
    else {
        $("ready-button").attr("value", "Not Ready")
    }
}

function UI_updatePlayerList(players) { //@cecile change this function to use JQuery and also to update the correct list of players
    var plList = document.getElementById("playerList");
    while (plList.hasChildNodes()) {   
        plList.removeChild(plList.firstChild);
    }

    for(var pID in players) {
        var node = document.createElement("LI");                 // Create a <li> node
        node.className = "list-group-item list-item-dark";
        var playerString = players[pID].Name + ": "
        if(players[pID].Ready) {
            playerString += "Ready"
        } else {
            playerString += "Not Ready"
        }
        var textnode = document.createTextNode(playerString);         // Create a text node
        node.appendChild(textnode);                              // Append the text to <li>
        plList.appendChild(node);
    }
}

function UI_changePlayerName() {
    var newName = document.getElementById("changeName-text").value; // @cecile call a UI function instead of doing the work inside this hook
    // var newName = $("changeName-text").val(); // @jasfour this doesn't work, it just says null
    IO_changePlayerName(newName)
}

// *********************************
// IO CALLS
// *********************************

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

var IO_toggleReady = function() {
    socket.emit("toggleReady")
}

// *********************************
// IO HOOKS
// *********************************

socket.on('connect', function() {
    var gameId = window.location.pathname.replace('/', '')
    document.getElementById("link").innerHTML = window.location.href;    // @cecile Change this to a function call to clientController that updates the "link" value on the client (we dont want to do it here)
    IO_joinGame(gameId)
});

socket.on('gameInfo', function(gameInfo) {
    console.log(gameInfo)
    
    UI_updatePlayerList(gameInfo.PlayerList)
    
    if(gameInfo.GameInfo.length > 0 && currentGameInfo.GameInfo.length == 0) {
        UI_startGame();
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
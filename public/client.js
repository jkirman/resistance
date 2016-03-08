/* global io */
var currentGameInfo; // @cecile remove once all this logic is in the clientController

var socket = io.connect();

// *********************************
// UI HOOKS
// *********************************

$("#card").click(function() {
    UI_showCard();
});


$("#changeName-button").click(function() {
    UI_changePlayerName();
});

$("#ready-button").click(function() {
    IO_toggleReady();
});

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
    var r = $("#" + team + "-score");
    r.change(r.text(score + 1));
}

function UI_updatePlayerList(players) { //@cecile change this function to use JQuery and also to update the correct list of players
    var plList = $("#playerList".li);
    
    for (var pID in players) {
        plList.each(function(i) {
            if (pID == this.value) {
                if (players[pID].Ready) {
                    console.log("ready");   
                } else {
                    console.log("not ready");
                    
                }
            }
        });
    }
}

function UI_createPlayerList(players) {
    var plList = $("#playerList");
    for(var pID in players) {
        var li_player = $("<li>");
        var ul = $("<ul>");
        var li_name = $("<li>").text(players[pID].Name);;
        var li_ready = $("<li>").text("Not Ready");
        ul.addClass("list-inline");

        // if(pID == "/#" + socket.id)
        // {
        li_player.addClass("list-group-item list-item-light");
        li_player.attr("value", pID);
        // }
        // else {
        //     li_player.addClass("list-group-item list-item-dark");
        // }
        
        ul.append(li_name);
        ul.append(li_ready);
        li_player.append(ul);
        plList.append(li_player);
    }
}

function UI_changePlayerName() {
    var newName = $("#changeName-text").val();
    IO_changePlayerName(newName)
}

// *********************************
// IO CALLS
// *********************************

var IO_redirectToHome = function() {
    var link = window.location.host;
    window.location = link;
};

var IO_joinGame = function(gameId) {
    socket.emit('join', gameId);
};

var IO_changePlayerName = function(newName) {
     if(newName != "") {
        socket.emit("changePlayerName", newName);
    }
};

var IO_toggleReady = function() {
    socket.emit("toggleReady");
};

// *********************************
// IO HOOKS
// *********************************

socket.on('connect', function() {
    var gameId = window.location.pathname.replace('/', '')
    document.getElementById("link").innerHTML = window.location.href;    // @cecile Change this to a function call to clientController that updates the "link" value on the client (we dont want to do it here)
    IO_joinGame(gameId);
});

socket.on('gameInfo', function(gameInfo) {
    console.log(gameInfo);
    
    UI_updatePlayerList(gameInfo.PlayerList); // need to find a way to separate these two functions
    UI_createPlayerList(gameInfo.PlayerList); //Jonah this needs to happen when the waiting room gets created for that player
    
    if(gameInfo.GameInfo.length > 0 && currentGameInfo.GameInfo.length == 0) {
        UI_startGame();
    }
    
    currentGameInfo = gameInfo;

});

socket.on('roomDeleted', function() {
    alert("Room does not exist. Redirecting to homepage.");
    IO_redirectToHome();
});

socket.on('roomFull', function() {
    alert("Room is full. Redirecting to homepage.");
    IO_redirectToHome();
});

socket.on('error', function(message) {
    window.alert(message);
})
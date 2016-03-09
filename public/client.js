/* global io */
var currentGameInfo; // @cecile remove once all this logic is in the clientController

var socket = io.connect();

// *********************************
// UI HOOKS
// *********************************

$("#card").click(function() {
    UI_showCard();
    $("#card-text").text("Click to Hide");
});

$("#card-flip").click(function() {
    UI_showCard();
    $("#card-text").text("Click to Reveal");
});

$("#changeName-button").click(function() {
    UI_changePlayerName();
});

$("#ready-button").click( function() {
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
    var r = $(team + "-score");
    r.change(r.text(score + 1));
}

function UI_setCardText(players,spies) {
    for (var pID in players) {
        if(pID == "/#" + socket.id){
            var type = players[pID].Type;
        }
    }
    if (type == "SPY") {
        $("#other-spies").text("Spy List:");
    }
    
    $("#card-text-flip").text(type);
    
    for (var sID in spies) {
        var spyName = players[spies[sID]].Name;
        $("#card-spylist").append("<li>" + spyName + "</li>");
    }
}

function UI_updateVoteOnMissionPlayers(players) {
    var plList = $("#missionList");
    
    while (plList.children().length > 0) {   
        plList.find(":first-child").remove();
    }
    
    for(var pID in players) {
        var li_player = $("<li>");
        var ul = $("<ul>");
        var li_name = $("<li>").text(players[pID].Name);
        ul.addClass("list-inline");

        li_player.addClass("list-group-item list-item-dark");
        li_player.attr("value", pID);
        
        ul.append(li_name);
        
        li_player.append(ul);
        plList.append(li_player);
    }
}

function UI_showVote() {
    $(".mission-vote").show();
}

function UI_hideVote() {
    $(".mission-vote").hide();
}


function UI_createAndUpdatePlayerList(players) {
    var plList = $("#playerList");
    
    while (plList.children().length > 0) {   
        plList.find(":first-child").remove();
    }
    
    for(var pID in players) {
        var li_player = $("<li>");
        var ul = $("<ul>");
        var li_name = $("<li>").text(players[pID].Name);
        var li_notReady = $("<li>").text("Not Ready");
        var li_Ready = $("<li>").text("Ready");
        ul.addClass("list-inline");

        if(pID == "/#" + socket.id)
        {
            li_player.addClass("list-group-item list-item-light");
            li_player.attr("value", pID);
        }
        else {
            li_player.addClass("list-group-item list-item-dark");
            li_player.attr("value", pID);
        }
        
        ul.append(li_name);
        
        if (players[pID].Ready) {
            ul.append(li_Ready);
        } else {
            ul.append(li_notReady);
        }
        
        li_player.append(ul);
        plList.append(li_player);
    }
}

function UI_createInGamePlayerList(players, gameInfo) {
    var plList = $("#inGamePlayerList");
    
    for (var pID in players) {
        var player = $("<tr>");
        var td = $("<td>");
        
        if(pID == "/#" + socket.id)
        {
            player.addClass("list-item-light");
        }
        
        td.text(players[pID].Name);
        player.append(td);
        plList.append(player);
        if(pID == gameInfo[gameInfo.length-1].leaderID){
            var td2 = $("<td2>");
            td2.text("[LEADER]");
            player.append(td2);
        }
    }
            
}

function UI_changePlayerName() {
    var newName = $("#changeName-text").val();
    IO_changePlayerName(newName);
}

function UI_showLeaderVotingScreen(players, gameinfo) {
    var missionSelection = $("#players-for-mission");
    
    for (var pID in players) {
        var input = $("<input>");
        var label = $("<ul>");
        input.attr("type", "checkbox");
        label.text(players[pID].Name + "\t");
        label.append(input);
        missionSelection.append(label);
    }
    
    for (var pID in players) {
        console.log(gameinfo[0].leaderID);
        if (pID == gameinfo[0].leaderID) {
            console.log("leader")
            $("#Select-Mission").show();
            missionSelection.show();
        } else {
            console.log("not leader")
            $("#Select-Mission").hide();
            missionSelection.hide();
        }
    }
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
    var gameId = window.location.pathname.replace('/', '');
    document.getElementById("link").innerHTML = window.location.href;    // @cecile Change this to a function call to clientController that updates the "link" value on the client (we dont want to do it here)
    IO_joinGame(gameId);
});

socket.on('gameInfo', function(gameInfo) {
    console.log(gameInfo);
    
    UI_createAndUpdatePlayerList(gameInfo.PlayerList);
    if(gameInfo.GameInfo.length > 0 && currentGameInfo.GameInfo.length == 0) {
        UI_startGame();
        UI_setCardText(gameInfo.PlayerList, gameInfo.SpyList);
        UI_createInGamePlayerList(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_createInGamePlayerList(gameInfo.PlayerList);
        UI_showLeaderVotingScreen(gameInfo.PlayerList, gameInfo.GameInfo);
        if (gameInfo.GameInfo[gameInfo.GameInfo.length-1].playersChosen == true) {
            UI_updateVoteOnMissionPlayers(gameInfo.GameInfo[gameInfo.GameInfo.length-1].selectedPlayers);
            UI_showVote();
        } else {
            UI_hideVote();
        }
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
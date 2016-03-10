/* global io */
var currentGameInfo; // @cecile remove once all this logic is in the clientController
var currentPlayers;

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

$("#Submit-Team-Button").click( function() {
    IO_submitPlayersForMission(UI_getSelectedPlayersByLeader());
});

$("#vote-yes-button").click( function() {
    IO_voteOnMissionAttempt(true);
});

$("#vote-no-button").click( function() {
    IO_voteOnMissionAttempt(false);
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
    
    $("#inGamePlayerList tr").remove();
    
    for (var pID in players) {
        var player = $("<tr>");
        var td = $("<td>");
        var td2 = $("<td2>");
        
        if(pID == "/#" + socket.id)
        {
            player.addClass("list-item-light");
        } else {
            player.addClass("list-item-dark");
        }
        if(pID == gameInfo[gameInfo.length-1].leaderID){
            td2.text("[LEADER]");
        }
        
        td.text(players[pID].Name);
        player.append(td);
        player.append(td2);
        plList.append(player);
    }
}

$('#inGamePlayerList').on('click', 'tr', function(){
    IO_togglePlayerForMission(UI_getPlayerByName($(this).find('td:first').text()));
});

function UI_updatePlayersOnMission(gameinfo) {
    
    $('#inGamePlayerList tr').each(function(){
        if (gameinfo.GameInfo[gameinfo.GameInfo.length - 1].selectedPlayers.indexOf(UI_getPlayerByName($(this).find('td:first').text())) != -1) {
            if ($(this).hasClass('list-item-light')) {
                $(this).toggleClass("list-item-light list-item-selected-you");
            } else if ($(this).hasClass('list-item-dark')){
               $(this).toggleClass("list-item-dark list-item-selected");
            } 
        } else {
            if ($(this).hasClass('list-item-selected-you')) {
                $(this).toggleClass("list-item-selected-you list-item-light");
            } else if ($(this).hasClass('list-item-selected') ){
                $(this).toggleClass("list-item-selected list-item-dark");
            }
        }
    });

}

function UI_changePlayerName() {
    var newName = $("#changeName-text").val();
    IO_changePlayerName(newName);
}

function UI_showLeaderVotingScreen(players, gameinfo) {
    var missionSelection = $("#players-for-mission");
    
/*    for (var pID in players) {
        var input = $("<input>");
        var label = $("<ul>");
        input.attr("type", "checkbox");
        input.attr("id", pID);
        label.text(players[pID].Name + "\t");
        label.append(input);
        missionSelection.append(label);
    }
*/
    
    if (("/#" + socket.id) == gameinfo[gameinfo.length - 1].leaderID && !gameinfo[gameinfo.length - 1].playersChosen) {
            $("#Select-Mission").show();
            missionSelection.show();
    } else {
            $("#Select-Mission").hide();
            missionSelection.hide();
    }
    
}

function UI_getSelectedPlayersByLeader() {
    var missionSelection = $("#players-for-mission ul input")
    var selectedPlayers = [];
    missionSelection.each(function(index, element) {
        if(element.checked) {
            selectedPlayers.push(element.id)
        }
    });
    return selectedPlayers;
}

function UI_getPlayerByName(name) {
    for (var pID in currentPlayers) {
       if (name == currentPlayers[pID].Name) {
           return pID;
       } 
    };
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

var IO_togglePlayerForMission = function(playerID) {
    socket.emit("togglePlayerForMission", playerID);
}

var IO_submitPlayersForMission = function(players) {
    socket.emit("submitPlayersForMission");
};

var IO_voteOnMissionAttempt = function(vote) {
    socket.emit("voteOnMissionAttempt", vote);
    UI_hideVote();
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
    
    var currentAttempt = gameInfo.GameInfo[gameInfo.GameInfo.length - 1];
    
    currentPlayers = gameInfo.PlayerList;
    UI_createAndUpdatePlayerList(gameInfo.PlayerList);
    if(gameInfo.GameInfo.length > 0 && currentGameInfo.GameInfo.length == 0) {
        UI_startGame();
        UI_setCardText(gameInfo.PlayerList, gameInfo.SpyList);
        UI_createInGamePlayerList(gameInfo.PlayerList, gameInfo.GameInfo);
    } else if (gameInfo.GameInfo.length > 0) {
        UI_updatePlayersOnMission(gameInfo);
        UI_showLeaderVotingScreen(gameInfo.PlayerList, gameInfo.GameInfo);
        
        console.log(currentAttempt.attemptVote.every(function(vote) {console.log(vote); vote[0] != '/#' + socket.id}));
        console.log(currentAttempt.attemptAllowed);
        if (currentAttempt.playersChosen &&
            currentAttempt.attemptVote.every(function(vote) {vote[0] != '/#' + socket.id}) &&
            currentAttempt.attemptAllowed != true) {
            UI_updateVoteOnMissionPlayers(currentAttempt.selectedPlayers);
            UI_showVote();
        } else if (currentAttempt.attemptAllowed || currentAttempt.attemptVote.find(function(vote) {vote[0] == socket.id}) != undefined) {
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

socket.on('sendError', function(message) {
    window.alert(message);
})
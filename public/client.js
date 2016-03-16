/* global io */
var currentGameInfo; // @cecile remove once all this logic is in the clientController
var currentPlayers;
var votedOnMission;

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

$("#success").click( function() {
    IO_voteOnMissionSuccess(true);
});

$("#fail").click( function() {
    IO_voteOnMissionSuccess(false);
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

function UI_updateVoteOnMissionPlayers(players, selectedPlayers) {
    var plList = $("#missionList");
    
    while (plList.children().length > 0) {   
        plList.find(":first-child").remove();
    }
    
    for(var pID in selectedPlayers) {
        var li_player = $("<li>");
        var ul = $("<ul>");
        var li_name = $("<li>").text(players[selectedPlayers[pID]].Name);
        ul.addClass("list-inline");

        li_player.addClass("list-group-item list-item-dark");
        li_player.attr("value", pID);
        
        ul.append(li_name);
        
        li_player.append(ul);
        plList.append(li_player);
    }
}

function UI_showMissionPassFail(gameinfo) {
    
    var currentAttempt = gameinfo.GameInfo[gameinfo.GameInfo.length - 1];
    for (var pID in currentAttempt.selectedPlayers) {
       if (currentAttempt.selectedPlayers[pID] == "/#" + socket.id) {
            $("#pass-fail").show();
        }
    }
}

function UI_hideMissionPassFail() {
    $("#pass-fail").hide();
    $("#pass-fail input").prop("disabled", false);
}

function UI_disableMissionPassFail() {
    $("#pass-fail input").prop("disabled", true);
}

function UI_showVote() {
    $(".mission-vote").show();
}

function UI_hideVote() {
    $(".mission-vote").hide();
}

function UI_updateScore(gameinfo) {
     var lastAttempt = gameinfo.GameInfo[gameinfo.GameInfo.length - 2];
     var missionNumber = lastAttempt.missionNumber;
     var resistanceScore = gameinfo.ResistancePoints;
     var spyScore = gameinfo.SpyPoints;
     if (lastAttempt.missionPassed == true) {
         console.log("resistance wins");
         switch (missionNumber) {
             case 1:
                 console.log("mission 1 being changed");
                 $("#mission-one-circle").css("background", "blue");
                 $("#resistance-score").text(resistanceScore);
                 break;
             case 2:
                 console.log("mission 2 being changed");
                 $("#mission-two-circle").css("background", "blue");
                 $("#resistance-score").text(resistanceScore);
                 break;
             case 3:
                 $("#mission-three-circle").css("background", "blue");
                 $("#resistance-score").text(resistanceScore);
                 break;
             case 4:
                 $("#mission-four-circle").css("background", "blue");
                 $("#resistance-score").text(resistanceScore);
                 break;
             case 5:
                 $("#mission-five-circle").css("background", "blue");
                 $("#resistance-score").text(resistanceScore);
                 break;
            default:
                console.log("default happened");
                break;
         }
     }
     else if (lastAttempt.missionPassed == false){
         console.log("spies win");
         switch (missionNumber) {
             case 1:
                 console.log("mission 1 being changed");
                 $("#mission-one-circle").css("background", "red");
                 $("#spy-score").text(spyScore);
                 break;
             case 2:
                 console.log("mission 2 being changed");
                 $("#mission-two-circle").css("background", "red");
                 $("#resistance-score").text(spyScore);
                 break;
             case 3:
                 $("#mission-three-circle").css("background", "red");
                 $("#resistance-score").text(spyScore);
                 break;
             case 4:
                 $("#mission-four-circle").css("background", "red");
                 $("#resistance-score").text(spyScore);
                 break;
             case 5:
                 $("#mission-five-circle").css("background", "red");
                 $("#resistance-score").text(spyScore);
                 break;
            default:
                console.log("default happened");    
                break;
                
         }
     }
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
        var td2 = $("<td>");
        
        if(pID == "/#" + socket.id)
        {
            player.addClass("list-item-light");
        } else {
            player.addClass("list-item-dark");
        }

        td.text(players[pID].Name);
        td2.css( "color", "yellow" )
        player.append(td);
        player.append(td2);
        plList.append(player);
    }
}

$('#inGamePlayerList').on('click', 'tr', function(){
    IO_togglePlayerForMission(UI_getPlayerByName($(this).find('td:first').text()));
});

function UI_updateLeader(gameInfo) {
    $('#inGamePlayerList tr').each(function(){
        if ((gameInfo[gameInfo.length-1].leaderID) == UI_getPlayerByName($(this).find('td:first').text())) {
            $(this).find('td:eq(1)').text("LEADER");
        } else {
            $(this).find('td:eq(1)').text("");
        }
    });
}

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

function UI_showLeaderSelectingScreen(players, gameinfo) {
    var missionSelection = $("#players-for-mission");
    var instructions = $("#selectInstructions");
    var playerLookUp = [
		[2,3,2,3,3],
		[2,3,3,3,4],
		[2,3,3,4,4],
		[3,4,4,5,5],
		[3,4,4,5,5],
		[3,4,4,5,5]];
	var numberOfPlayers = 0;
	for (var pID in players) {
	    numberOfPlayers++;
	}
	//var number = playerLookUp[players.length - 5][0];
	var number = playerLookUp[numberOfPlayers - 5][ gameinfo[gameinfo.length-1].missionNumber - 1];
    instructions.text("Select " + number + " players for this mission");
    
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

var IO_voteOnMissionSuccess = function(vote) {
    socket.emit("voteOnMissionSuccess", vote);
    UI_disableMissionPassFail();
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
        UI_hideVote();
        UI_setCardText(gameInfo.PlayerList, gameInfo.SpyList);
        UI_createInGamePlayerList(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_showLeaderSelectingScreen(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_updateLeader(gameInfo.GameInfo);
    } else if (gameInfo.GameInfo.length > 0) {
        UI_updatePlayersOnMission(gameInfo);
        UI_showLeaderSelectingScreen(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_updateLeader(gameInfo.GameInfo);
        
        if (gameInfo.GameInfo.length > 1) {
            UI_updateScore(gameInfo);
        }
        
        
        // if (currentAttempt.missionPassed != null){
        //     UI_updateScore(gameInfo);
        // }
        
        if (currentAttempt.playersChosen &&
            currentAttempt.attemptVote.every(function(vote) {vote[0] != '/#' + socket.id}) &&
            currentAttempt.attemptAllowed != true) {
            UI_updateVoteOnMissionPlayers(gameInfo.PlayerList, currentAttempt.selectedPlayers);
            UI_showVote();
            // || currentAttempt.attemptVote.find(function(vote) {vote[0] == '\#' + socket.id}) != undefined
        } else if (currentAttempt.attemptAllowed) {
            UI_hideVote();
            votedOnMission = false;
        }
        
        if (currentAttempt.attemptAllowed && !votedOnMission) {
            UI_showMissionPassFail(gameInfo);
        } else {
            UI_hideMissionPassFail();
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
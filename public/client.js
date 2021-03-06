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

$('#inGamePlayerList').on('click', 'tr', function(){
    IO_togglePlayerForMission(UI_getPlayerByName($(this).find('td:first').text()));
});

$("#O1").click( function() {
    UI_pastMissionResults(1);
});

$("#O2").click( function() {
    UI_pastMissionResults(2);
});

$("#O3").click( function() {
    UI_pastMissionResults(3);
});

$("#O4").click( function() {
    UI_pastMissionResults(4);
});

$("#O5").click( function() {
    UI_pastMissionResults(5);
});

// *********************************
// UI CALLS
// *********************************

function UI_pastMissionResults(missionNumber) {
    for (var i = 0; i < currentGameInfo.GameInfo.length; i++) {
        var outcome = currentGameInfo.GameInfo[i].missionPassed
        if ((outcome != null) && (currentGameInfo.GameInfo[i].missionNumber == missionNumber)) {
            var playersOnMission = currentGameInfo.GameInfo[i].selectedPlayers;
            var text = "";
            var outcomeText = "";
            for (var pID in playersOnMission) {
                text += currentGameInfo.PlayerList[playersOnMission[pID]].Name + ", ";
            }
            if (outcome == true) {
                outcomeText = "passed"
            }
            else if (outcome == false) {
                outcomeText = "failed"
            }
            alert("The players " + text + "were on mission " + missionNumber +  ", and the mission " + outcomeText);
        }
    }
}

function UI_showOverlay(show) {
    if(show) {
        $("#overlay").show();
    } else {
        $("#overlay").hide();
    }
}

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
    
    $("#card-spylist").empty();
    
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

function UI_showHideMissionDescription(gameinfo) {
    if (gameinfo.GameWinner != "NONE") {
        $("#mission-details").hide();
    } else {
        console.log("POOP");
    var currentAttempt = gameinfo.GameInfo[gameinfo.GameInfo.length - 1];
    var playerLookUp = [
		[2,3,2,3,3],
		[2,3,3,3,4],
		[2,3,3,4,4],
		[3,4,4,4,5],
		[3,4,4,4,5],
		[3,4,4,4,5]];
	var winLookUp = [
		[2,3,2,3,3],
		[2,3,3,3,4],
		[2,3,3,4,4],
		[3,4,4,4,5],
		[3,4,4,4,5],
		[3,4,4,4,5]];
    var numberOfPlayers = 0;
	for (var pID in gameinfo.PlayerList) {
	    numberOfPlayers++;
	}
	var pnumber = playerLookUp[numberOfPlayers - 5][currentAttempt.missionNumber - 1];
	var wnumber = winLookUp[numberOfPlayers - 5][currentAttempt.missionNumber - 1];
        
        $("#mission-description").text("Mission " + currentAttempt.missionNumber + " (Attempt " + currentAttempt.attemptNumber + "/5): " + pnumber + " players selected and " +
          wnumber  + " players need to pass for mission success.");
          
        $("#mission-details").show();
    }
}

function UI_showMissionPassFail(gameinfo) {
    
    var currentAttempt = gameinfo.GameInfo[gameinfo.GameInfo.length - 1];
    for (var pID in currentAttempt.selectedPlayers) {
       if (currentAttempt.selectedPlayers[pID] == "/#" + socket.id) {
            $("#pass-fail").show();
            $("#not-on-mission").hide();
        }
        $("#not-on-mission").text("The players selected are on the mission...");
        $("#not-on-mission").show();
    }
}

function UI_hideMissionPassFail() {
    $("#pass-fail").hide();
    $("#on-mission").hide();
    $("#not-on-mission").hide();
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

function UI_showMissionResults(gameinfo) {
    var index = gameinfo.GameInfo.length - 1;
    if (gameinfo.GameWinner == "NONE") { index--; }
    var lastAttempt = gameinfo.GameInfo[index];
    var numPassed = lastAttempt.missionVote[0];
    var numFailed = lastAttempt.missionVote[1];
    if (lastAttempt.missionPassed == true) {
        $("#mission-results-text").text("The mission passed! " + numPassed + 
            " players wanted the mission to pass and " + numFailed + " wanted it to fail");
    }
    else if (lastAttempt.missionPassed == false) {
        $("#mission-results-text").text("The mission failed! " + numPassed + 
            " players wanted the mission to pass and " + numFailed + " wanted it to fail");
    }
    $("#mission-results").show();
}

function UI_hideMissionResults() {
    $("#mission-results").hide();
}

function UI_updateScore(gameinfo) {
    var resistanceScore = gameinfo.ResistancePoints;
    var spyScore = gameinfo.SpyPoints;
    $("#resistance-score").text(resistanceScore);
    $("#spy-score").text(spyScore);
    gameinfo.GameInfo.forEach(function(gi){
        if (gi.missionPassed != null) { UI_updateMissionCircle(gi.missionNumber, gi.missionPassed) }
    });

 }
 
function UI_updateMissionCircle(missionNumber, missionPassed) {
         if (missionPassed) {
         switch (missionNumber) {
             case 1:
                 $("#O1").css("background", "blue");
                 break;
             case 2:
                 $("#O2").css("background", "blue");
                 break;
             case 3:
                 $("#O3").css("background", "blue");
                 break;
             case 4:
                 $("#O4").css("background", "blue");
                 break;
             case 5:
                 $("#O5").css("background", "blue");
                 break;
            default:
                break;
         }
     }
     else if (!missionPassed){
         switch (missionNumber) {
             case 1:
                 $("#O1").css("background", "red");
                 break;
             case 2:
                 $("#O2").css("background", "red");
                 break;
             case 3:
                 $("#O3").css("background", "red");
                 break;
             case 4:
                 $("#O4").css("background", "red");
                 break;
             case 5:
                 $("#O5").css("background", "red");
                 break;
            default:
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
        var td3 = $("<td>");
        
        if(pID == "/#" + socket.id)
        {
            player.addClass("list-item-light");
        } else {
            player.addClass("list-item-dark");
        }

        td.text(players[pID].Name);
        td2.css( "color", "yellow" );
        td3.css( "color", "white" );
        player.append(td);
        player.append(td2);
        player.append(td3);
        plList.append(player);
    }
}

function UI_updateLeader(gameInfo) {
    $('#inGamePlayerList tr').each(function(){
        if ((gameInfo[gameInfo.length-1].leaderID) == UI_getPlayerByName($(this).find('td:first').text())) {
            $(this).find('td:eq(1)').text("LEADER");
        } else {
            $(this).find('td:eq(1)').text("");
        }
    });
}

function UI_updateAttemptVoteResults(gameInfo) {
    
    var currentAttempt = gameInfo.GameInfo[gameInfo.GameInfo.length - 1];
    var lastAttempt = ((gameInfo.GameInfo.length < 2) ? null : gameInfo.GameInfo[gameInfo.GameInfo.length - 2]);

    if (currentAttempt.attemptAllowed == null) {
        if (lastAttempt != null) {
            currentAttempt = lastAttempt;
        }
    }
    
    var currentAttemptVotes = currentAttempt.attemptVote;
    var currentPlayerOnList;
    var votedYes = false;
    
    $('#inGamePlayerList tr').each(function(){
        currentPlayerOnList = UI_getPlayerByName($(this).find('td:first').text());
        
        var count = 0;
        
        for (var p in gameInfo.PlayerList) {
            count++;
        }

        if (currentAttemptVotes.length == count) {
        
            currentAttemptVotes.forEach(function(p) {
                if (p[0] == currentPlayerOnList) {
                    if (p[1] == true) {
                        votedYes = true;
                    }
                }
                                
            });
            
            if (votedYes) {
                $(this).find('td:eq(2)').text("Y");
                $(this).find('td:eq(2)').css( "color", "green" );
            } else {
               $(this).find('td:eq(2)').text("N"); 
               $(this).find('td:eq(2)').css( "color", "red" );
            }
            
            votedYes = false;
            
            if (currentAttempt.selectedPlayers.indexOf(currentPlayerOnList) > -1) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
            
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
    var other_text = $("#other-players");
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
    instructions.text("Select " + number + " players for this mission.");

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
    } else if (!gameinfo[gameinfo.length - 1].playersChosen) {
            other_text.text("The leader is currently choosing " + number + " players for the next mission.");
            other_text.show();
    } else {
            $("#Select-Mission").hide();
            missionSelection.hide();
            other_text.hide();
            
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

function UI_endGame(winner) {
    if (winner == "RESISTANCE") {
        alert("Resistance wins!");
        IO_removePlayerFromRoom();
        IO_validateRoom();
    } else if (winner == "SPY") {
        alert("Spies win!");
        IO_removePlayerFromRoom();
        IO_validateRoom();
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

var IO_removePlayerFromRoom = function() {
    socket.emit("removePlayerFromRoom");
};

var IO_validateRoom = function() {
    socket.emit("validateRoom");
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
    
    if(gameInfo.Connected) {
        UI_showOverlay(false);
    } else {
        UI_showOverlay(true);
    }
    
    var currentAttempt = gameInfo.GameInfo[gameInfo.GameInfo.length - 1];
    
    currentPlayers = gameInfo.PlayerList;
    UI_createAndUpdatePlayerList(gameInfo.PlayerList);
    if(gameInfo.RoomState == "STARTING") {
        UI_startGame();
        UI_showHideMissionDescription(gameInfo);
        UI_setCardText(gameInfo.PlayerList, gameInfo.SpyList);
        UI_createInGamePlayerList(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_showLeaderSelectingScreen(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_updateLeader(gameInfo.GameInfo);
    } else if (gameInfo.RoomState == "INPLAY") {
        UI_startGame();
        UI_showHideMissionDescription(gameInfo);
        UI_createInGamePlayerList(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_setCardText(gameInfo.PlayerList, gameInfo.SpyList);
        UI_updatePlayersOnMission(gameInfo);
        UI_showLeaderSelectingScreen(gameInfo.PlayerList, gameInfo.GameInfo);
        UI_updateLeader(gameInfo.GameInfo);
        UI_updateAttemptVoteResults(gameInfo);
        
        if (gameInfo.GameInfo.length > 1) {
            var previousAttempt = gameInfo.GameInfo[gameInfo.GameInfo.length - 2];
            UI_updateScore(gameInfo);
            if (!currentAttempt.playersChosen) {
                UI_showMissionResults(gameInfo);
            }
            else {
                UI_hideMissionResults();
            }
            if ((currentAttempt.missionNumber == previousAttempt.missionNumber) && (previousAttempt.attemptAllowed == false)) {
                UI_hideMissionResults();
            }
        }
        
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
        
        UI_endGame(gameInfo.GameWinner);
        
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

socket.on('playerExists', function() {
    alert("Player already exists in this room. Redirecting to homepage.");
    IO_redirectToHome();
});

socket.on('sendError', function(message) {
    window.alert(message);
});
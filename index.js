var roommaster = require("./roommaster.js");
var http = require('http');
var express = require('express')
var app = express();
var gamelist = [];
var Session = require('express-session');
var SessionStore = require('session-file-store')(Session);
var session = Session({store: new SessionStore({path: __dirname+'/tmp/sessions'}), secret: 'DOOR', resave: true, saveUninitialized: true});


// *********************************
// EXPRESS
// *********************************

console.log(__dirname + '/public');
app.use('/static', express.static(__dirname + '/public'));
app.use(session);
app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
    
    if(request.url.query == null || request.url.query == ""){
 		response.sendFile( __dirname + "/public/" + "index.html");
	} else {

		//TODO: Handle this error

		response.send("error?");
	}
});

app.param('gameid', function(request, response, next, gameid) {
          
    //Check if the gameID is valid, if not, redirect back to empty request
    var room = roommaster.findRoom(parseInt(gameid));
    
    if(room === null){
	    response.redirect('/');
    } else {    
	    response.sendFile( __dirname + "/public/" + "room.html");
    }
	// Handle game room stuff

	next();
});

app.get('/:gameid', function(request, response) {

	//TODO: Figure out if this function is necessary or what it does

//	response.send("welcome to game room?");
});

app.post('/newgame', function(request, response){

	
    // Should check all existing games and determine a new game id to send back
    // Should make a new game object with that id
	
	var newRoom = roommaster.createRoom();
	response.redirect('/' + newRoom.getId());

});

// The httpserver listens to the nested express app server on the same port, so that io can listen to the http server
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var ios = require('socket.io-express-session');
var io = require('socket.io').listen(server);
io.use(ios(session));
// *********************************
// IO CALLS
// *********************************

var IO_getRoomFromSocket = function(socket) {
    for(var roomId in socket.rooms) {
        var room = roommaster.findRoom(parseInt(roomId));
        return room;
    }
    return null;
};

var IO_sendRoomFullToSocket = function(socketId) {
    io.sockets.sockets[socketId].emit('roomFull');
};

var IO_sendPlayerExistsToSocket = function(socketId) {
     io.sockets.sockets[socketId].emit('playerExists');
}

var IO_sendGameInfoToPlayer = function(pID, gameInfo) {
    // gameInfo is a JSON object ready to be sent
    io.sockets.sockets[pID].emit('gameInfo', gameInfo);
};

function IO_sendGameInfoToRoom(room) {
    if(room == null) {
        return;
    }
    for(var socket in io.sockets.sockets) { 
        if(room.getPlayerById(socket) != null) {
           IO_sendGameInfoToPlayer(socket, room.getSerialRoomInfo(room.getPlayerById(socket)));
        }
    }
}

var IO_sendRoomDeletedToSocket = function(socketId) {
    io.sockets.sockets[socketId].emit('roomDeleted');
};

// Send error to a client
var IO_sendError = function(socketID, message) {
   io.sockets.sockets[socketID].emit('sendError', message);
};

// *********************************
// IO HOOKS
// *********************************

io.on('connection', function (socket) {
    socket.on('join', function (rID) {
        var room = roommaster.findRoom(parseInt(rID));
        if(room !== null) {
            socket.join(rID); // Add this socket to the room with this gameid
            
            var s_pID = socket.handshake.session.pid;
            var pID = socket.id
            var playerJoined = false;
            if(s_pID != null) { // If there is already a session on this socket, use the same player
                var s_Player = room.getPlayerById(s_pID);
                if(s_Player != null) {
                    if(!s_Player.isConnected()) {
                        room.changePlayerID(s_pID, pID);
                        //s_Player.setId(pID);
                        //if(s_Player.getIsLeader()) {
                            // @JEFF this is where the leader ID of the current mission needs to be updated to the players new id
                        //}
                        room.setPlayerConnected(s_Player, true);
                        socket.handshake.session.pid = pID;
                        socket.handshake.session.save();
                        playerJoined = true;
                    } else {
                        IO_sendPlayerExistsToSocket(socket.id);
                        playerJoined = true;
                    }
                }
            } 
            if(!playerJoined) { // If there is not an existing session, then make a new player
               //}
            
                // @jeff: Add your call here
                // gamemaster/roommaster check if full, add player, whatever
                // Then FROM the gamemaster, call room full or update room or whatever IO_* functions (defined above)
                // Then please remove this code
                if(!room.isFull() && !(room.getRoomState() == "INPLAY")){
                    var name = room.addNewPlayer(pID);  
                    socket.handshake.session.pid = pID;
                    socket.handshake.session.save();
                }
                else{
                    IO_sendRoomFullToSocket(socket.id);
                }
            }
            IO_sendGameInfoToRoom(room);
        }
        else {
            IO_sendRoomDeletedToSocket(socket.id);
        }
    });
    
    socket.on("changePlayerName", function(newName) {
        var room = IO_getRoomFromSocket(socket);
        if(room != null) {
            try {
                room.changePlayerName(room.getPlayerById(socket.id), newName);
                IO_sendGameInfoToRoom(room);
            } catch (e) {
                IO_sendError(socket.id, e.message);
            }
        }
    });
    
    socket.on("toggleReady", function() {
        var room = IO_getRoomFromSocket(socket);
        if ( room != null) {
            room.toggleReady(room.getPlayerById(socket.id));
            IO_sendGameInfoToRoom(room);
        }
    });
    
    socket.on("togglePlayerForMission", function(playerId) {
        var room = IO_getRoomFromSocket(socket);
        if ( room != null) {
            room.togglePlayerForMission(socket.id, playerId);
            IO_sendGameInfoToRoom(room);
        }
    });
    
/*    socket.on("selectPlayersForMission", function(players) {
        var room = IO_getRoomFromSocket(socket);
        if ( room != null) {
            players.forEach(function(playerId) {
                room.togglePlayerForMission(playerId);
            });
            IO_sendGameInfoToRoom(room);
        }
    });
*/

    socket.on("submitPlayersForMission", function() {
        var room = IO_getRoomFromSocket(socket);
        if ( room != null) {
            try {
                room.submitPlayersForMission();
                IO_sendGameInfoToRoom(room);
            } catch (e) {
                IO_sendError(socket.id, e.message);
            }
        }
    });
    
    socket.on("voteOnMissionAttempt", function(vote) {
        var room = IO_getRoomFromSocket(socket);
        if ( room != null) {
            room.voteOnMissionAttempt(socket.id, vote);
            IO_sendGameInfoToRoom(room);
        }
    });
    
    socket.on("voteOnMissionSuccess", function(vote) {
        var room = IO_getRoomFromSocket(socket);
        if ( room != null) {
            room.voteOnMissionSuccess(socket.id, vote);
            IO_sendGameInfoToRoom(room);
        }
    });
    
    socket.on("removePlayerFromRoom", function() {
        var room = IO_getRoomFromSocket(socket);
        room.removePlayer(socket.id);
    });
    
    socket.on("validateRoom", function() {
        var room = IO_getRoomFromSocket(socket);
        if (room != null) {
            room.validateRoom();
        }
    });
    
    socket.on("disconnect", function() {
        for(var roomId in roommaster.getRoomList()) {
            var room = roommaster.getRoomList()[roomId];
            if(room != null && room.getPlayerById != null) {
                var player = room.getPlayerById(socket.id);
                if(player != null) {
                    if(player.isConnected()) {
                        if(room.getGameMaster().getGameInfo() == null || room.getGameMaster().getGameInfo().length == 0) {
                            room.removePlayer(player.getId());
                        } else {
                            room.setPlayerConnected(player, false);
                        }
                        IO_sendGameInfoToRoom(room);
                        break;
                    }
                 }
            }
           
        }
    })
    
    // socket.on('disconnect', function () {
    //     console.log("DISCONNECT FROM " + socket.id)
       
    //     for(var roomId in socket.rooms) { //THIS NEVER GETS ENTERED
    //         console.log("Room ID: " + roomId)
    //         var room = roommaster.findRoom(parseInt(roomId));
    //         if(room != null) {
    //             room.removePlayer(room.getPlayerById(socket.id))
    //             io.to(room.getId()).emit('roomInfo', room.toString());
    //             console.log("DISCONNECTED " + socket.id)
    //         }
    //   }
    // });
    
});

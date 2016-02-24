var roommaster = require("./roommaster.js");
var http = require('http');
var express = require('express')
var app = express();
var gamelist = [];

console.log(__dirname + '/public');
app.use('/static', express.static(__dirname + '/public'));
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

var io = require('socket.io').listen(server);

var IO_getRoomFromSocket = function(socket) {
    for(var roomId in socket.rooms) {
        var room = roommaster.findRoom(parseInt(roomId));
        return room
    }
    return null
}

var IO_sendRoomFullToSocket = function(socketId) {
    io.sockets.sockets[socketId].emit('roomFull')
}

var IO_sendGameInfoToPlayer = function(pID, gameInfo) {
    // For now we only call this with a string that's ready to be sent, but later will be called with object that has a JSON method
    gameInfo.playerId = pID
    io.sockets.sockets[pID].emit('gameInfo', gameInfo)
    // @jeff: replace with 
    //    io.sockets.socket(pID).emit('gameInfo', gameInfo.toJSON())
    // which should be defined so we have control over the structure of the JSON
}

var IO_sendGameInfoToRoom = function(room) {
    if(room == null) {
        return
    }
    for(var socket in io.sockets.sockets) { 
        if(room.getPlayerById(socket) != null) {
            // @jeff
           // gameinfo.PopulateBasedOnThisPlayerANdRoomNShit
            // Then replace the below call with gameinfo instead of room.toString()
           IO_sendGameInfoToPlayer(socket, room.toString())
        }
    }
}

var IO_sendRoomDeletedToSocket = function(socketId) {
    io.sockets.sockets[socketId].emit('roomDeleted')
}

io.on('connection', function (socket) {
    
    socket.on('join', function (rID) {
        var room = roommaster.findRoom(parseInt(rID));
        if(room !== null) {
            socket.join(rID); // Add this socket to the room with this gameid
            // TODO: More logic around adding the player to the room
            var pID = socket.id//}
            
            // @jeff: Add your call here
            // gamemaster/roommaster check if full, add player, whatever
            // Then FROM the gamemaster, call room full or update room or whatever IO_* functions (defined above)
            // Then please remove this code
            if(!room.isFull()){
                var name = room.addNewPlayer(pID);   
            }
            else{
                IO_sendRoomFullToSocket(socket.id)
            }
            IO_sendGameInfoToRoom(room)
        }
        else {
            IO_sendRoomDeletedToSocket(socket.id)
        }
    });
    
    socket.on("changePlayerName", function(newName) {
        var room = IO_getRoomFromSocket(socket)
        if(room != null) {
            // @jeff change to whatever gamemaster call changes a player name, then FROM gamemaster (as long as something changes) call IO_sendGameInfoToRoom and delete call from here
            room.changePlayerName(room.getPlayerById(socket.id), newName);
            IO_sendGameInfoToRoom(room)
        }
    });
    
    socket.on("setPlayerReady", function(newStatus) {
        var room = IO_getRoomFromSocket(socket)
        if ( room != null) {
            // @jeff change to a gamemaster call or something?
            room.setPlayerReady(room.getPlayerById(socket.id), newStatus)
            
            IO_sendGameInfoToRoom(room)
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

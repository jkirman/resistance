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
	response.redirect('/' + newRoom.getID());
	
	/*
    var x;
    //Ensure that the created game id does not yet exist
    do{
	x = Math.floor(Math.random() * 10000);
    }
    while(gamelist.indexOf(x) != -1);
    
    gamelist.push(x);
    response.redirect('/' + x); */

});

// The httpserver listens to the nested express app server on the same port, so that io can listen to the http server
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);

io.on('connection', function (socket) {
    
    socket.on('join', function (gameid) {
        var room = roommaster.findRoom(parseInt(gameid));
        if(room != null) {
            if(!room.isRoomFull()){
                console.log(room.isRoomFull())
                socket.join(gameid) // Add this socket to the room with this gameid
                // TODO: More logic around adding the player to the room
                room.addNewPlayer(socket.id)
                //TODO: get new player Id
                var player = "myId";
                io.to(gameid).emit('roomId', gameid);
                io.to(gameid).emit('newPlayer', player);
                //io.to(gameid).emit('roomInfo', room.toString())
            } else {
                socket.emit('roomFull')
            }
        } else {
            io.to(gameid).emit('roomDeleted')
        }
    });

    // Handle an example event with example data
    socket.on('exampleClientEvent', function(exampleData) {
        for(var room in socket.rooms) { // Loop through every room this connection belongs to. TODO maybe there's a better way to do this
            if(roommaster.findRoom(parseInt(room)) != null) {
                console.log(exampleData + " from room " + room) // The data is passed by the client, and the socket.rooms is the name of the room that was passed into socket.join earlier
                io.to(room).emit('exampleServerEvent', 'hi room ' + room) // socket.to(roomid) will make the emit call go to every socket in that room
            }
        }
    });
    
});
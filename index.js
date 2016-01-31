var roommaster = require("./roommaster.js");
var express = require('express')
var app = express();

var gamelist = [];

app.use('/static', express.static(__dirname + '/public'));

app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
	
    if(request.url.query == null || request.url.query == ""){
 		response.sendFile( __dirname + "/" + "index.html");
	} else {

		//TODO: Handle this error

		response.send("error?");
	}
});

app.param('gameid', function(request, response, next, gameid) {
          
    //Check if the gameID is valid, if not, redirect back to empty request
    var room = roommaster.findRoom(parseInt(gameid));
    console.log(room);
    if(room === null){
	    response.redirect('/');
    } else {    
	    response.send("Share this link with other players: https://doorindustries-resistance-s.herokuapp.com/" + room.getID());
    }
	//TODO: Make a new Player and add them to the game, also send them all the info for the game they're in

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

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

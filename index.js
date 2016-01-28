var express = require('express')
var app = express()

var gamelist = [];
app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
	if(request.url.query == null || request.url.query == ""){
 		response.sendFile( __dirname + "/" + "index.html");
	} else {

		//TODO: Handle this error

		response.send("error?");
	}
})

app.param('gameid', function(request, response, next, gameid) {
    
    console.log("In param, the game id is " + gameid + "\nand the index it is at is " + gamelist.indexOf(gameid) + "and the contents of the list are now: " + gamelist.toString());

    //Check if the gameID is valid, if not, redirect back to empty request
    if(gamelist.indexOf(gameid) == -1){
	response.redirect('/'); //THIS IS ALWAYS HAPPENING
    } else {    
	response.send("welcome to room: " + gameid);
    }
	//TODO: Make a new Player and add them to the game, also send them all the info for the game they're in

	// Handle game room stuff

	next();
});

app.get('/:gameid', function(request, response) {

	//TODO: Figure out if this function is necessary or what it does

	response.send("welcome to game room?");
});

app.post('/newgame', function(request, response){

	//Check all existing games, create a new one and send the ID back as a redirect (Instead of /GameNumberUno)
	
    // Should check all existing games and determine a new game id to send back
	// Should make a new game object with that id
	
    var x;
   
    do{
	x = Math.floor(Math.random() * 10000);
    }
    while(gamelist.indexOf(x) != -1);
    gamelist.push(x);
    console.log("Game list is now: " + gamelist.toString());
    console.log("Index of gameid is now: " + gamelist.indexOf(x));
    response.redirect('/' + x);

});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

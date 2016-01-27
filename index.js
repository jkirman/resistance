var express = require('express')
var app = express()

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
	//TODO: Check if the gameID is valid, if not, redirect back to empty request
	response.send("welcome to room: " + gameid);
	//TODO: Make a new Player and add them to the game, also send them all the info for the game they're in
	next();
});

app.get('/:gameid', function(request, response) {
	//TODO: Figure out if this function is necessary or what it does
	response.send("welcome to game room?");
});

app.post('/newgame', function(request, response) {
	//TODO: Check all existing games, create a new one and send the ID back as a redirect (Instead of /GameNumberUno)
	response.redirect('/GAMeNUMeroUno');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

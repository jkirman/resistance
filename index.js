var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
	if(request.url.query == null || request.url.query == ""){
 		response.sendFile( __dirname + "/" + "index.html");
	} else {
		response.send("error?");
	}
})

app.param('gameid', function(request, response, next, gameid) {
	response.send("welcome to room: " + gameid);
	// Handle game room stuff
	next();
});

app.get('/:gameid', function(request, response) {
	response.send("welcome to game room?");
});

app.post('/newgame', function(request, response) {
	// Should check all existing games and determine a new game id to send back
	// Should make a new game object with that id
	response.redirect('/GAMeNUMeroUno');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

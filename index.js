var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
	if(request.url.query == ""){
 		response.sendFile( __dirname + "/" + "index.html");
	} else {
		response.send("Welcome to game room\n");
		response.send("query: " + request.url.query);
		//Handle game room
	}
})

app.post('/newgame', function(request, response) {
	// Should check all existing games and determine a new game id to send back
	// Should make a new game object with that id
	response.redirect('/GAMeID');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

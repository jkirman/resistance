var socket = io.connect();

socket.on('connect', function() {
    var gameid = window.location.pathname.replace('/', '')
	socket.emit("join", gameid)
});

socket.on('roomInfo', function(room) {
    document.write(JSON.stringify(room))
    socket.emit("exampleClientEvent", "hello")
})

socket.on("exampleServerEvent", function(data) {
    console.log(data)
})

socket.on('roomDeleted', function() {
    console.log("Room deleted")
    // TODO: Handle deleted rooms
})
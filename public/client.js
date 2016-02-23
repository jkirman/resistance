/* global io */

var socket = io.connect();

socket.on('connect', function() {
    var gameid = window.location.pathname.replace('/', '')
    document.getElementById("link").innerHTML = window.location.href;
	socket.emit("join", gameid)
});

socket.on('roomInfo', function(room) {

    var plList = document.getElementById("playerList");
    while (plList.hasChildNodes()) {   
        plList.removeChild(plList.firstChild);
    }

    room.players.forEach(function(plName) {
        var node = document.createElement("LI");                 // Create a <li> node
        node.className = "list-group-item list-item-dark";
        var textnode = document.createTextNode(plName);         // Create a text node
        node.appendChild(textnode);                              // Append the text to <li>
        plList.appendChild(node);
    })
})

socket.on("exampleServerEvent", function(data) {
    console.log(data)
})

socket.on('roomDeleted', function() {
    console.log("Room deleted");
    // TODO: Handle deleted rooms
});

socket.on('roomFull', function() {
    var link = window.location.host;
    alert("Room is full, please create a new room: " + link);
    window.location = link;
});

$("changeName-button").click(function() {
    var newName = $("changeName-text").val();
    if(newName != "")
        socket.emit("changePlayerName", newName);
});
    


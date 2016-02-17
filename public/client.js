/* global io */

var socket = io.connect();

socket.on('connect', function() {
    var gameid = window.location.pathname.replace('/', '')
    document.getElementById("link").innerHTML = window.location.href;
	socket.emit("join", gameid)
});

socket.on('roomInfo', function(room) {
<<<<<<< HEAD
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
    
=======
    //document.write(JSON.stringify(room))
>>>>>>> d076f8f1984eb12e02c4d074029dba7bdefe42be
    socket.emit("exampleClientEvent", "hello")
})

socket.on("exampleServerEvent", function(data) {
    console.log(data)
})

socket.on('roomDeleted', function() {
    console.log("Room deleted")
    // TODO: Handle deleted rooms
})

socket.on('roomFull', function() {
    var link = window.location.host
    alert("Room is full, please create a new room: " + link);
    window.location = link;
})

document.getElementById("changeName-button").onclick = function() {
    var newName = document.getElementById("changeName-text").value;
    if(newName != "") {
        socket.emit("changePlayerName", newName);
    }
}

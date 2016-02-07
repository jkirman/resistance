var roommaster = require("./roommaster.js");
var express = require('express')
var app = express();

var gamelist = [];

console.log(__dirname + '/public');
app.use('/static', express.static(__dirname + '/public'));
app.set('port', (process.env.PORT || 5000))

var myApp;
myApp = myApp || (function () {
    var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h1>Processing...</h1></div><div class="modal-body"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div></div>');
    return {
        showPleaseWait: function() {
            pleaseWaitDiv.modal();
        },
        hidePleaseWait: function () {
            pleaseWaitDiv.modal('hide');
        },

    };
})();

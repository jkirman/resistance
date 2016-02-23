function revealCard() {
        $("#card").click(function() {
            $(this).hide();
            $("#card-flip").show();
    });
}

function changeScore(team, score) {
    var r = $(team + "-score");
    r.change(r.text(score + 1));
}

function addPlayersToList() {
    $("#inGamePlayerList").change($("#PlayerList").val());
}
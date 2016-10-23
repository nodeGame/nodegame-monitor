/**
 * # GameDetails widget for nodeGame
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Shows information about a game's configuration.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('GameDetails', GameDetails);

    var JSUS = node.JSUS,
        Table = node.window.Table;

    // ## Meta-data

    GameDetails.version = '0.5.0';
    GameDetails.description = 'Displays info about a game\'s configuration.';

    GameDetails.className = 'gamedetails';

    // ## Dependencies

    GameDetails.dependencies = {
        JSUS: {},
        Table: {}
    };

//     function renderCell(o, that) {
//         var content;
//         var text, textElem;
// 
//         content = o.content;
//         if ('object' === typeof content) {
//             debugger
//             switch (o.y) {
//             case 0:
//                 text = content.info.name;
//                 break;
//             }
// 
//             textElem = document.createElement('span');
//             textElem.innerHTML = '<a class="ng_clickable">' + text + '</a>';
//             textElem.onclick = function() {
//                 that.selectedGame = content.info.name;
//                 that.writeGameInfo();
//                 that.selectedTreatment = null;
//                 that.writeTreatmentInfo();
//             };
//         }
//         else {
//             textElem = document.createTextNode(content);
//         }
// 
//         return textElem;
//     }

    function GameDetails(options) {
        var that;

        that = this;

//         this.gamesTable = new Table({
//             render: {
//                 pipeline: function(o) { return renderCell(o, that); },
//                 returnAt: 'first'
//             }
//         });
        // this.gamesTableDiv = document.createElement('div');
        // JSUS.style(this.gamesTableDiv, {float: 'left'});
        // this.gamesTableDiv.appendChild(this.gamesTable.table);

        this.detailTable = new Table();
        this.detailTable.setLeft(
            ['Name:', 'Aliases:', 'Description:', 'Treatments:']);

        this.gameDetailDiv = document.createElement('div');
        // JSUS.style(this.gameDetailDiv, {float: 'left'});
        this.gameDetailDiv.appendChild(this.detailTable.table);

        this.gameDetailDiv.appendChild(document.createElement('br'));
        
        this.treatmentTable = new Table();
        this.treatmentTable.setHeader(['Key', 'Value']);

        this.treatmentDiv = document.createElement('div');
        // JSUS.style(this.treatmentDiv, {float: 'left'});
        this.treatmentDiv.appendChild(this.treatmentTable.table);

        this.gameData = {};
        this.selectedGame = 'artex';
        this.selectedTreatment = null;
    }

    GameDetails.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type: 'GAMES'
            }
        }));

    };

    GameDetails.prototype.append = function() {
        // this.bodyDiv.appendChild(this.gamesTableDiv);
        this.bodyDiv.appendChild(this.gameDetailDiv);
        this.bodyDiv.appendChild(this.treatmentDiv);

        // Query server:
        this.refresh();
    };

    GameDetails.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_GAMES', function(msg) {
            that.gameData = msg.data;
            // that.writeGames();

            // If currently selected game or treatment disappeared, deselect it:
            if (!that.gameData.hasOwnProperty(that.selectedGame)) {
                that.selectedGame = null;
                that.selectedTreatment = null;
            }
            else if (!that.gameData[that.selectedGame].settings
                      .hasOwnProperty(that.selectedTreatment)) {

                that.selectedTreatment = null;
            }

            that.writeGameInfo();
            that.writeTreatmentInfo();
        });
    };

//     GameDetails.prototype.writeGames = function() {
//         var gameKey, gameObj;
// 
//         this.gamesTable.clear(true);
// 
//         // Create a row for each game:
//         for (gameKey in this.gameData) {
//             if (this.gameData.hasOwnProperty(gameKey)) {
//                 gameObj = this.gameData[gameKey];
// 
//                 if (gameObj.info.name === gameKey) {  // don't show aliases
//                     this.gamesTable.addRow([gameObj]);
//                 }
//             }
//         }
// 
//         this.gamesTable.parse();
//     };

    GameDetails.prototype.writeGameInfo = function() {
        var selGame;
        var treatment, treatmentList, elem;
        var firstElem;
        var aliases;
        var that;
//debugger
        that = this;
        this.detailTable.clear(true);
        this.detailTable.parse();

        selGame = this.gameData[this.selectedGame];
        if (!selGame) return;

        this.detailTable.addRow([selGame.info.name]);
        
        if (JSUS.isArray(selGame.info.alias)) {
            aliases = [selGame.info.alias.join(', ')]
        }
        else {
            aliases = [selGame.info.alias];
        }

        this.detailTable.addRow(aliases);
        this.detailTable.addRow([selGame.info.descr]);

        treatmentList = document.createElement('span');
        firstElem = true;
        for (treatment in selGame.settings) {
            if (selGame.settings.hasOwnProperty(treatment)) {
                // Add ', ' between elements:
                if (!firstElem) {
                    elem = document.createElement('span');
                    elem.innerHTML = ', ';
                    treatmentList.appendChild(elem);
                }
                else {
                    firstElem = false;
                }

                elem = document.createElement('span');
                elem.innerHTML = '<a class="ng_clickable">' + treatment +'</a>';
                elem.onclick = function(t) {
                    return function() {
                        that.selectedTreatment = t;
                        that.writeTreatmentInfo();
                    };
                }(treatment);
                treatmentList.appendChild(elem);
            }
        }
        this.detailTable.addRow([treatmentList]);

        this.detailTable.parse();
    };

    GameDetails.prototype.writeTreatmentInfo = function() {
        var selGame;
        var selTreatment;
        var prop;

        this.treatmentTable.clear(true);
        this.treatmentTable.parse();

        selGame = this.gameData[this.selectedGame];
        if (!selGame) return;

        selTreatment = selGame.settings[this.selectedTreatment];
        if (!selTreatment) return;

        this.treatmentTable.addRow(['<name>', this.selectedTreatment]);
        // Create a row for each option:
        for (prop in selTreatment) {
            if (selTreatment.hasOwnProperty(prop)) {
                this.treatmentTable.addRow([prop, selTreatment[prop]]);
            }
        }

        this.treatmentTable.parse();
    };

})(node);

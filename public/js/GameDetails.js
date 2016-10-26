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

    function GameDetails(options) {
        var that;

        that = this;

        this.detailTable = new Table();
        this.detailTable.setLeft([
            'Name:',
            'Aliases:',
            'Description:',
            'Treatments:',
            'Channel:',
            'Setup:',
            'Sequence:',
            'Wait Room:',
            'Requirements:',
            'Authentication:',
            'Levels:',            
        ]);

        this.gameDetailDiv = document.createElement('div');
        // JSUS.style(this.gameDetailDiv, {float: 'left'});
        this.gameDetailDiv.appendChild(this.detailTable.table);

        this.gameDetailDiv.appendChild(document.createElement('br'));
        
        this.treatmentTable = new Table({
            className: 'table table-striped details',
            render: { pipeline : function(item) {
                if (item.y % 2 === 0) {
                    return document.createTextNode(item.content + ': ');
                }
            }}
            
        });
        // this.treatmentTable.setHeader(['Key', 'Value']);

        this.treatmentDiv = document.createElement('div');
        // JSUS.style(this.treatmentDiv, {float: 'left'});
        this.treatmentDiv.appendChild(this.treatmentTable.table);

        this.selectedTreatment = null;
    }

    GameDetails.prototype.append = function() {
        // this.bodyDiv.appendChild(this.gamesTableDiv);
        this.bodyDiv.appendChild(this.gameDetailDiv);
        this.bodyDiv.appendChild(this.treatmentDiv);

        // Query server:
        node.game.refreshGames();
    };

    GameDetails.prototype.listeners = function() {
        var that;

        that = this;

        node.on('CHANNEL_SELECTED', function(channel) {
            that.writeGameInfo();
            that.writeTreatmentInfo();
        });

        // Listen for server reply:
        node.on('INFO_GAMES', function(games) {
            var selectedGame;
            selectedGame = node.game.channelInUse;

            // If currently selected game or treatment disappeared, deselect it:
            if (!node.game.gamesInfo.hasOwnProperty(selectedGame)) {
                that.selectedGame = null;
                that.selectedTreatment = null;
            }
            else if (!node.game.gamesInfo[selectedGame].settings
                      .hasOwnProperty(that.selectedTreatment)) {

                that.selectedTreatment = null;
            }

            that.writeGameInfo();
            that.writeTreatmentInfo();
        });
    };

    GameDetails.prototype.writeGameInfo = function() {
        var selGame;
        var treatment, treatmentList, elem;
        var firstElem;
        var aliases;
        var that;
        var selectedGame;

        selectedGame = node.game.channelInUse;

        that = this;
        this.detailTable.clear(true);
        this.detailTable.parse();

        selGame = node.game.gamesInfo[selectedGame];
        if (!selGame) {
            // Name.
            this.detailTable.addRow('Select a game first!');
            this.detailTable.parse();
            return;
        }

        // Name.
        this.detailTable.addRow([selGame.info.name]);
        
        // Aliases.
        if (selGame.alias.length) aliases = [selGame.info.alias.join(', ')]
        else aliases = ['-'];        
        this.detailTable.addRow(aliases);

        // Descr.
        this.detailTable.addRow([(selGame.info.description || '-')]);

        // Treatments.
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
                elem.onclick = (function(t) {
                    return function() {
                        that.selectedTreatment = t;
                        that.writeTreatmentInfo();
                    };
                })(treatment);
                treatmentList.appendChild(elem);
            }
        }
        this.detailTable.addRow([treatmentList]);

        // Channel.

        this.detailTable.parse();
    };

    GameDetails.prototype.writeTreatmentInfo = function() {
        var selGame;
        var selTreatment;
        var prop, keys;
        var i, len;
        var selectedGame;
        selectedGame = node.game.clientList.channelName;

        this.treatmentTable.clear(true);
        this.treatmentTable.parse();

        selGame = node.game.gamesInfo[selectedGame];
        if (!selGame) return;

        selTreatment = selGame.settings[this.selectedTreatment];
        if (!selTreatment) return;

        // this.treatmentTable.addRow(['name', this.selectedTreatment]);

        keys = JSUS.keys(selTreatment);
        keys.sort(function(a, b) {
            if (a === 'name') return -1;
            if (a === 'description') return -1;
            if (a === 'fullDescription') return -1;
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() >= b.toLowerCase()) return 1;
        });

        i = -1, len = keys.length;
        for ( ; ++i < len ; ) {
            prop = keys[i];
            if (prop === 'treatmentName') continue;
            if (JSUS.isArray(selTreatment[prop])) {
                this.treatmentTable.addRow([
                    prop,
                    selTreatment[prop].join(', ')
                ]);
            }
            else {
                this.treatmentTable.addRow([prop, selTreatment[prop]]);
            }
        }

        this.treatmentTable.parse();
    };

})(node);

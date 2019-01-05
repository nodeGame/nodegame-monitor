/**
 * # GameDetails widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
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

    var Table = node.window.Table;

    // ## Meta-data

    GameDetails.version = '0.6.0';
    GameDetails.description = 'Displays info about a game\'s configuration.';

    GameDetails.title = 'Game Details';
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
            'Client Types:',
            'Languages:',
            'Levels:',            
        ]);

        this.gameDetailDiv = document.createElement('div');
        this.gameDetailDiv.appendChild(this.detailTable.table);
        W.add('br', this.gameDetailDiv);
        
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
        // J.style(this.treatmentDiv, {float: 'left'});
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
        var tmp;

        that = this;
        this.detailTable.clear(true);
        this.detailTable.parse();

        if (J.isEmpty(node.game.gamesInfo)) {
            // Name.
            this.detailTable.addRow('No game found!');
            this.detailTable.parse();
            return;
        }
        selectedGame = node.game.channelInUse;
        if (!selectedGame) {
            // Name.
            this.detailTable.addRow('No game selected!');
            this.detailTable.parse();
            return;
        }

        selGame = node.game.gamesInfo[selectedGame];
        if (!selGame) {
            // Name.
            this.detailTable.addRow('En error occurred. No info found ' +
                                    'for game: ' + selectedGame);
            this.detailTable.parse();
            return;
        }

        // Name.
        this.detailTable.addRow([selGame.info.name]);
        
        // Aliases.
        if (selGame.alias.length) aliases = [selGame.alias.join(', ')]
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

        // Client Types.

        this.detailTable.addRow(selGame.clientTypes.join(', '));
        
        // Languages.

        tmp = (function(selGame) {
            var l, res;
            if (J.isEmpty(selGame.languages)) return ' - ';
            res = ''
            for (l in selGame.languages) {
                if (selGame.languages.hasOwnProperty(l)) {
                    if (res) res += ', ';
                    res += selGame.languages[l].name + '(' + l + ')';
                }
            }
            return res;
        })(selGame);
        
        this.detailTable.addRow(tmp);
        
        // Levels.

        tmp = (function(selGame) {
            var l, res;
            if (J.isEmpty(selGame.levels)) return 'main';
            res = 'main'
            for (l in selGame.levels) {
                if (selGame.levels.hasOwnProperty(l)) {
                    res += ', ' + l;
                }
            }
            return res;
        })(selGame);
        
        this.detailTable.addRow(tmp);

        this.detailTable.parse();
    };

    GameDetails.prototype.writeTreatmentInfo = function() {
        var selGame;
        var selTreatment;
        var prop, keys, value;
        var i, len;
        var selectedGame;
        selectedGame = node.game.clientList.channelName;

        this.treatmentTable.clear(true);
        this.treatmentTable.parse();

        if (!node.game.gamesInfo) return;

        selGame = node.game.gamesInfo[selectedGame];
        if (!selGame) return;

        selTreatment = selGame.settings[this.selectedTreatment];
        if (!selTreatment) return;

        // this.treatmentTable.addRow(['name', this.selectedTreatment]);

        keys = J.keys(selTreatment);
        keys.sort();

        this.treatmentTable.addRow([ 'Treatment', selTreatment.name ]);
        this.treatmentTable.addRow([ 'Description', selTreatment.description ]);
        
        i = -1, len = keys.length;
        for ( ; ++i < len ; ) {
            prop = keys[i];
            if (prop === 'treatmentName' || prop === 'description' ||
                prop === 'name') {

                continue;
            }
            value = selTreatment[prop];
            if (J.isArray(value)) value = value.join(', ');
            
            this.treatmentTable.addRow([prop, value]);
        }

        this.treatmentTable.parse();
    };

})(node);

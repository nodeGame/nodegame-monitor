/**
 * # RequirementsView widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Shows requirements settings
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('RequirementsView', RequirementsView);

    var JSUS = node.JSUS;

    // ## Meta-data

    RequirementsView.version = '0.0.1';
    RequirementsView.description = 'Displays the current requirements settings.';

    RequirementsView.title = 'Requirements Settings';
    RequirementsView.className = 'reqview';

    // ## Dependencies
    RequirementsView.dependencies = {
        JSUS: {},
        Table: {}
    };

    function RequirementsView(options) {
        this.table = new W.Table({
            className: 'table table-striped requirements',
            render: { pipeline : function(item) {
                if (item.y % 2 === 0) {
                    return document.createTextNode(item.content + ': ');
                }
            }}
        });

        this.table.setHeader(['Setting', 'Value']);
        // Creates table.table.
        this.table.parse();
    }

    RequirementsView.prototype.append = function() {
        this.bodyDiv.appendChild(this.table.table);
    };

    RequirementsView.prototype.listeners = function() {
        var that;
        that = this;
        node.on('CHANNEL_SELECTED', function() {
            that.displayData();
        });
    };
    
    RequirementsView.prototype.displayData = function() {
        var i, t, s, tmp;
        // Not ready yet.
        if (!node.game.gamesInfo) return;
        s = node.game.gamesInfo[node.game.channelInUse].requirements;
        t = this.table;
        t.clear();
        t.addRow(['enabled',  s.enabled ]);
        if (s.enabled) {
            for (i in s) {
                if (s.hasOwnProperty(i)) {
                    if (i !== 'enabled' && i !== 'requirements') {
                        t.addRow([i, s[i]]);
                    }
                }
            };
        }
        t.parse();        
    };

})(node);

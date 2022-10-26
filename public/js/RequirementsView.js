/**
 * # RequirementsView widget for nodeGame
 * Copyright(c) 2021 Stefano Balietti
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

    // ## Meta-data

    RequirementsView.version = '0.1.0';
    RequirementsView.description = 'Displays the current requirements settings.';

    RequirementsView.title = 'Requirements';
    RequirementsView.className = 'reqview';

    // ## Dependencies
    RequirementsView.dependencies = {
        Table: {}
    };

    function RequirementsView(options) {
        this.table = new W.Table({
            className: 'table table-striped viewer',
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
        node.on('CHANNEL_SELECTED', channel => {
            let title = this.title ? this.title : '';
            if (channel) title = `${channel} / ${title}`;
            this.setTitle(title);
            this.displayData();
        });
    };

    RequirementsView.prototype.displayData = function() {
        var i, t, s, tmp;
        // Not ready yet.
        if (!node.game.gamesInfo) return;
        s = node.game.gamesInfo[node.game.channelInUse].requirements;
        t = this.table;
        t.clear();
        if (s) {
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
        }
        else {
            t.addRow(['No info',  'An error has occurred' ]); 
        }
        t.parse();
    };

})(node);

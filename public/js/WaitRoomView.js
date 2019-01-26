/**
 * # WaitRoomView widget for nodeGame
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

    node.widgets.register('WaitRoomView', WaitRoomView);

    var JSUS = node.JSUS;

    // ## Meta-data

    WaitRoomView.version = '0.0.1';
    WaitRoomView.description = 'Displays a waitroom settings.';

    WaitRoomView.title = 'WaitRoom Settings';
    WaitRoomView.className = 'waitroomview';

    // ## Dependencies
    WaitRoomView.dependencies = {
        JSUS: {},
        Table: {}
    };

    function WaitRoomView(options) {
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

    WaitRoomView.prototype.append = function() {
        this.bodyDiv.appendChild(this.table.table);
    };

    WaitRoomView.prototype.listeners = function() {
        var that;
        that = this;
        node.on('CHANNEL_SELECTED', function() {
            that.displayData();
        });
    };
    
    WaitRoomView.prototype.displayData = function() {
        var i, t, s, tmp;
        // Not ready yet.
        if (!node.game.gamesInfo) return;
        s = node.game.gamesInfo[node.game.channelInUse].waitroom;
        t = this.table;
        t.clear();
        for (i in s) {
            if (s.hasOwnProperty(i)) {
                t.addRow([i, s[i]]);
            }
        };
        t.parse();        
    };

})(node);

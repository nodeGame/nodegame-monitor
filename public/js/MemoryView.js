/**
 * # MemoryView widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Shows items stored in the memory database of the logic of each game rooms.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('MemoryView', MemoryView);

    var JSUS = node.JSUS;

    // ## Meta-data

    MemoryView.version = '0.1.1';
    MemoryView.description = 'Shows items stored in the memory database ' +
        'of the logic of each game room.';

    MemoryView.title = 'Memory Database';
    MemoryView.className = 'memoryview';

    // ## Dependencies
    MemoryView.dependencies = {
        JSUS: {},
        Table: {}
    };

    function MemoryView(options) {
        var that;
        that = this;

        this.lastModified = null;
        this.lastModifiedSpan = null;

        this.header = document.createElement('div');

        this.downloadAllLink = null;

        node.once('MONITOR_URI', function(uri) {
            that.downloadAllLink.href = uri + 'memorydb/*';
        });
    }

    MemoryView.prototype.refresh = function() {
//         // Ask server for games:
//         node.socket.send(node.msg.create({
//             target: 'SERVERCOMMAND',
//             text:   'INFO',
//             data: {
//                 type: 'RESULTS'
//             }
//         }));

    };

    MemoryView.prototype.append = function() {
        var b;
        this.bodyDiv.appendChild(this.header);

        this.downloadAllLink = document.createElement('a');
        this.downloadAllLink.setAttribute('target', '_blank');
        this.downloadAllLink.innerHTML = 'Download the ' +
            'memory database of all game rooms.';

        this.header.appendChild(this.downloadAllLink);
        this.header.appendChild(document.createElement('br'));
        this.header.appendChild(document.createTextNode(
            'Warning! If the total number of items in database is very high ' +
                'and if items contain cycles (under normal ' +
                'conditions they do not), this operation might affect the ' +
                'server\'s performance.'
        ));

    };

})(node);

/**
 * # MemoryView widget for nodeGame
 * Copyright(c) 2021 Stefano Balietti
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

    // ## Meta-data

    MemoryView.version = '0.2.1';
    MemoryView.description = 'Shows items stored in the memory database ' +
        'of the logic of each game room.';

    MemoryView.title = 'Memory Database';
    MemoryView.className = 'memoryview';

    // ## Dependencies
    MemoryView.dependencies = {};

    function MemoryView(options) {

        this.downloadAllLink = null;

        node.once('MONITOR_URI', uri => {
            this.downloadAllLink.href = uri + 'memorydb/*';
        });
    }

    MemoryView.prototype.append = function() {

        this.gameNameDiv = W.add('div', this.bodyDiv);;
        this.gameNameDiv.classList.add('mb-1', 'fs-4', 'text-center');

        this.downloadAllLink = W.add('a', this.bodyDiv, {
            'target': '_blank',
            innerHTML: 'Download the memory database of all game rooms.',
            download: 'memorydb.json'
        });

        this.bodyDiv.appendChild(document.createElement('br'));
        this.bodyDiv.appendChild(document.createTextNode(
            'Warning! This operation might affect the ' +
                'server\'s performance.'
        ));

    };

    MemoryView.prototype.listeners = function() {

        node.on('CHANNEL_SELECTED', channel => {
            let title = this.title ? this.title : '';
            if (channel) title = `${channel} / ${title}`;
            this.setTitle(title);
        });

    };

})(node);

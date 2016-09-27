/**
 * # ResultsView widget for nodeGame
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Shows files available in data/ dir.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('ServerView', ServerView);

    var JSUS = node.JSUS;

    // ## Meta-data

    ServerView.version = '0.0.1';
    ServerView.description = 'Displays the results of games in data/ folder.'; 

    ServerView.className = 'serverView';

    // ## Dependencies
    ServerView.dependencies = {
        JSUS: {},
    };

    function ServerView(options) {
        var that;
        that = this;
        this.links = document.createElement('div');
    }

    ServerView.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type: 'LOGS'
            }
        }));

    };

    ServerView.prototype.append = function() {
        this.bodyDiv.appendChild(this.links);
        // Query server:
        this.refresh();
    };

    ServerView.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_RESULTS', function(msg) {
            that.displayData(msg.data);
        });
    };

    ServerView.prototype.displayData = function(files) {
        var i, element, dataDir, prefixLink;
        prefixLink = window.location.origin;
        prefixLink += W.uriChannel ? W.uriChannel : '/';
        prefixLink += 'monitor/data/';
        for (i = 0; i < files.length; ++i) {
            element = document.createElement('a');
            element.setAttribute('target', '_blank');
            element.href = prefixLink + files[i];
            element.innerHTML = files[i];
            this.links.appendChild(element);
            this.links.appendChild(document.createElement('br'));
        }
    };

})(node);
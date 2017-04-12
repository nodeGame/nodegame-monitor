/**
 * # ServerView widget for nodeGame
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * Shows files available in log/ dir.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('ServerView', ServerView);

    var JSUS = node.JSUS;

    // ## Meta-data

    ServerView.version = '0.0.2';
    ServerView.description = 'Displays the log files in the log/ folder.'; 

    ServerView.title = 'Log Files';
    ServerView.className = 'serverView';

    // ## Dependencies
    ServerView.dependencies = {
        JSUS: {}
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
            data: { type: 'LOGS' }
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
        node.on.data('INFO_LOGS', function(msg) {
            that.displayData(msg.data);
        });
    };

    ServerView.prototype.displayData = function(files) {
        var i, element, prefixLink;
        prefixLink = window.location.origin;
        prefixLink += W.uriChannel ? W.uriChannel : '/';
        prefixLink += 'monitor/servernode/logs/';
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

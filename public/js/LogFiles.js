/**
 * # LogFiles widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * Shows files available in log/ dir.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('LogFiles', LogFiles);

    var JSUS = node.JSUS;

    // ## Meta-data

    LogFiles.version = '0.1.0';
    LogFiles.description = 'Displays the log files in the log/ folder.';

    LogFiles.title = 'Log Files';
    LogFiles.className = 'logfiles';

    // ## Dependencies
    LogFiles.dependencies = {
        JSUS: {}
    };

    function LogFiles(options) {
        this.links = document.createElement('div');
    }

    LogFiles.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: 'LOGS' }
        }));

    };

    LogFiles.prototype.append = function() {
        this.bodyDiv.appendChild(this.links);
        this.refresh();
    };

    LogFiles.prototype.listeners = function() {
        var that;
        that = this;

        // Listen for server reply:
        node.on.data('INFO_LOGS', function(msg) {
            that.displayLogsData(msg.data);
        });

    };

    LogFiles.prototype.displayLogsData = function(files) {
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

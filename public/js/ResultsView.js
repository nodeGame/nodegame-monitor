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

    node.widgets.register('ResultsView', ResultsView);

    var JSUS = node.JSUS;

    // ## Meta-data

    ResultsView.version = '0.0.1';
    ResultsView.description = 'Displays the results of games in data/ folder.'; 

    ResultsView.className = 'resultsView';

    // ## Dependencies
    ResultsView.dependencies = {
        JSUS: {},
    };

    function ResultsView(options) {
        var that;
        that = this;

        this.id = options.id;
        this.links = document.createElement('div');
    }

    ResultsView.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type: 'RESULTS'
            }
        }));

    };

    ResultsView.prototype.append = function() {
        this.bodyDiv.appendChild(this.links);
        // Query server:
        this.refresh();
    };

    ResultsView.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_RESULTS', function(msg) {
            that.displayData(msg.data);
        });
    };

    ResultsView.prototype.displayData = function(files) {
        var i, element, dataDir, prefixLink;
        prefixLink = window.location.origin + W.uriChannel + 'monitor/data/';
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

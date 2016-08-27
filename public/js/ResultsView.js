/**
 * # ResultsView widget for nodeGame
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Shows current, previous and next state.
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
    ResultsView.description = 'Visually display results of games.'; 

    ResultsView.className = 'resultsView';

    // ## Dependencies
    ResultsView.dependencies = {
        JSUS: {},
    };

    function ResultsView(options) {
        var that;

        that = this;

        this.id = options.id;

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

        // Query server:
        this.refresh();
    };

    ResultsView.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_RESULTS', function(msg) {
        });
    };

})(node);

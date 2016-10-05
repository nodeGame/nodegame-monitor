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

    ResultsView.version = '0.1.0';
    ResultsView.description = 'Displays the results of games in data/ folder.';

    ResultsView.className = 'resultsView';

    // ## Dependencies
    ResultsView.dependencies = {
        JSUS: {},
        Table: {}
    };

    function ResultsView(options) {
        var that;
        that = this;

        this.lastModified = null;

        this.prefixLink = null;
        this.prefixLink = window.location.origin;
        this.prefixLink += W.uriChannel ? W.uriChannel : '/';
        this.prefixLink += 'monitor/data/';

        this.zipLink = null;

        this.table = new W.Table({
            render: {
                pipeline: function(item) {
                    var element, file;
                    file = item.content.file;
                    if (file) {
                        element = document.createElement('a');
                        element.setAttribute('target', '_blank');
                        element.href = that.prefixLink + file;
                        element.innerHTML = file;
                        return element;
                    }
                    else if (item.content.mtime) {
                        return document.createTextNode(item.content.mtime);
                    }
                },
                returnAt: 'first'
            }
        });

        this.table.setHeader(['File', 'Modified']);

        // Creates table.table;
        this.table.parse();

        this.header = document.createElement('div');
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
        var b;
        this.bodyDiv.appendChild(this.header);
        
        this.zipLink = document.createElement('a');
        this.zipLink.setAttribute('target', '_blank');
        this.zipLink.href = this.prefixLink + '*';
        this.zipLink.innerHTML = '<em>Download all the content in a ' +
            'zip archive</em>';
        this.zipLink.style.display = 'none';

        this.header.appendChild(this.zipLink);
        this.header.appendChild(document.createElement('br'));

        b = document.createElement('button');
        b.innerHTML = 'Refresh';
        b.onclick = this.refresh;
        this.header.appendChild(b);

        this.bodyDiv.appendChild(document.createElement('br'));
        this.bodyDiv.appendChild(this.table.table);

        // Query server:
        this.refresh();
    };

    ResultsView.prototype.listeners = function() {
        var that;
        that = this;

        // Listen for server reply.
        node.on.data('INFO_RESULTS', function(msg) {
            that.receivedFiles = msg.data;
            that.displayData(msg.data);
        });
    };

    ResultsView.prototype.displayData = function(files) {
        var i, element;
        this.table.clear();
        if (files.length) {
            this.zipLink.style.display = '';
            files.sort(function(a, b) {
                if (a[0].file < b[0].file) return -1;
                if (a[0].file > b[0].file) return 1;
                return 0;
            });
            for (i = 0; i < files.length; ++i) {
                this.table.addRow(files[i]);
            }
        }
        else {
            this.zipLink.style.display = 'none';
        }
        this.table.parse();
    };

})(node);

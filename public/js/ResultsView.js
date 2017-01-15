/**
 * # ResultsView widget for nodeGame
 * Copyright(c) 2017 Stefano Balietti
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

    ResultsView.version = '0.9.0';
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

        this.sortBy = {
            name: function(a, b) {
                if (a[0].file < b[0].file) return -1;
                if (a[0].file > b[0].file) return 1;
                return 0;
            },
            date: function(a, b) {
                var d1, d2;
                d1 = Date.parse(a[1].mtime);
                d2 = Date.parse(b[1].mtime);
                if (d1 < d2) return 1;
                if (d1 > d2) return -1;
                return 0;
            }
        };

        this.currentSort = 'name';

        this.lastModified = null;
        this.lastModifiedSpan = null;

        this.prefixLink = null;
        this.zipLink = null;

        node.once('NODEGAME_READY', function() {
            that.prefixLink = window.location.origin;
            that.prefixLink += W.uriChannel ? W.uriChannel : '/';
            that.prefixLink += 'monitor/data/';
            // Update the zipLink href, if it was already created.
            if (that.zipLink) that.zipLink.href = that.prefixLink + '*';
        });

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
                    else {
                        element = document.createElement('a');
                        element.href = '#';
                        element.innerHTML = item.content;
                       
                        if (item.content === 'File') {
                            element.onclick = function() {
                                if (that.currentSort === 'name') return;
                                that.currentSort = 'name';
                                that.receivedFiles.sort(that.sortBy.name);
                                that.displayData();
                            };
                        }
                        else if (item.content === 'Modified') {
                            element.onclick = function() {
                                if (that.currentSort === 'date') return;
                                that.currentSort = 'date';
                                that.receivedFiles.sort(that.sortBy.date);
                                that.displayData();
                            };
                        }
                        return element;
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

        this.lastModifiedSpan = document.createElement('span');
        this.header.appendChild(this.lastModifiedSpan);

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
            console.log(msg.data);
            if (that.lastModified === msg.data.lastModified) return;
            that.lastModified = msg.data.lastModified;
            that.receivedFiles = msg.data.files;
            that.receivedFiles.sort(that.sortBy[that.currentSort]);
            that.displayData();
        });
    };

    ResultsView.prototype.displayData = function() {
        var i, files;
        files = this.receivedFiles;
        this.lastModifiedSpan.innerHTML = 'Last modified: ' +
            Date(this.lastModified);
        this.table.clear();
        if (files.length) {
            this.zipLink.style.display = '';
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

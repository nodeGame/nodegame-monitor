/**
 * # ExportView widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Shows files available in data/ dir.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('ExportView', ExportView);

    var JSUS = node.JSUS;

    // ## Meta-data

    ExportView.version = '0.9.1';
    ExportView.description = 'Displays the data in the export/ folder.';

    ExportView.title = 'Exports';
    ExportView.className = 'exportview';

    // ## Dependencies
    ExportView.dependencies = {
        Table: {}
    };

    function ExportView(options) {
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

        node.once('MONITOR_URI', function(uri) {
            that.prefixLink = uri + 'export/';
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
                                // Protect in case of missing files.
                                if (!that.receivedFiles) return;
                                that.receivedFiles.sort(that.sortBy.name);
                                that.displayData();
                            };
                        }
                        else if (item.content === 'Modified') {
                            element.onclick = function() {
                                if (that.currentSort === 'date') return;
                                that.currentSort = 'date';
                                // Protect in case of missing files.
                                if (!that.receivedFiles) return;
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

    ExportView.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: 'EXPORT' }
        }));

    };

    ExportView.prototype.append = function() {
        var b;
        this.bodyDiv.appendChild(this.header);
        this.lastModifiedSpan = W.add('span', this.header, {
            style: { 'font-size': '13px' }
        });
        this.header.appendChild(document.createElement('br'));

        b = document.createElement('button');
        b.innerHTML = 'Refresh';
        b.className = 'btn-sm';
        b.onclick = this.refresh;
        this.header.appendChild(b);


        this.zipLink = document.createElement('a');
        this.zipLink.setAttribute('target', '_blank');
        this.zipLink.href = this.prefixLink + '*';
        this.zipLink.innerHTML = '<em>&nbsp;&nbsp;Download all in a ' +
            'zip archive</em>';
        this.zipLink.style.display = 'none';

        this.header.appendChild(this.zipLink);
        this.header.appendChild(document.createElement('br'));



        this.bodyDiv.appendChild(document.createElement('br'));
        this.bodyDiv.appendChild(this.table.table);

        // Query server:
        this.refresh();
    };

    ExportView.prototype.listeners = function() {
        var that;
        that = this;

        // Listen for server reply.
        node.on.data('INFO_EXPORT', function(msg) {
            console.log(msg.data);
            if (that.lastModified === msg.data.lastModified) return;
            that.lastModified = msg.data.lastModified;
            that.receivedFiles = msg.data.files;
            that.receivedFiles.sort(that.sortBy[that.currentSort]);
            that.displayData();
        });
    };

    ExportView.prototype.displayData = function() {
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

/**
 * # ResultsView widget for nodeGame
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

    node.widgets.register('ResultsView', ResultsView);

    var JSUS = node.JSUS;

    // ## Meta-data

    ResultsView.version = '0.9.1';
    ResultsView.description = 'Displays the results of games in data/ folder.';

    ResultsView.title = 'Data Folder';
    ResultsView.className = 'resultsview';

    // ## Dependencies
    ResultsView.dependencies = {
        JSUS: {},
        Table: {},
        jQuery: {}
    };

    function ResultsView(options) {
        var that;
        that = this;

        this.sortBy = {
            name: function(a, b) {
                if (a.dir < b.dir) return -1;
                if (a.dir > b.dir) return 1;
                if (a.file < b.file) return -1;
                if (a.file > b.file) return 1;
                return 0;
            },
            date: function(a, b) {
                var d1, d2;
                d1 = Date.parse(a.mtime);
                d2 = Date.parse(b.mtime);
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
            that.prefixLink = uri + 'data/';
            // Update the zipLink href, if it was already created.
            if (that.zipLink) that.zipLink.href = that.prefixLink + '*';
        });

        // this.table = new W.Table({
        //     render: {
        //         pipeline: function(item) {
        //             var element, file;
        //             file = item.content.file;
        //             if (file) {
        //                 element = document.createElement('a');
        //                 element.setAttribute('target', '_blank');
        //                 element.href = that.prefixLink + file;
        //                 element.innerHTML = file;
        //                 return element;
        //             }
        //             else if (item.content.mtime) {
        //                 return document.createTextNode(item.content.mtime);
        //             }
        //             else {
        //                 element = document.createElement('a');
        //                 element.href = '#';
        //                 element.innerHTML = item.content;
        //
        //                 if (item.content === 'File') {
        //                     element.onclick = function() {
        //                         if (that.currentSort === 'name') return;
        //                         that.currentSort = 'name';
        //                         // Protect in case of missing files.
        //                         if (!that.receivedFiles) return;
        //                         that.receivedFiles.sort(that.sortBy.name);
        //                         that.displayData();
        //                     };
        //                 }
        //                 else if (item.content === 'Modified') {
        //                     element.onclick = function() {
        //                         if (that.currentSort === 'date') return;
        //                         that.currentSort = 'date';
        //                         // Protect in case of missing files.
        //                         if (!that.receivedFiles) return;
        //                         that.receivedFiles.sort(that.sortBy.date);
        //                         that.displayData();
        //
        //                     };
        //                 }
        //                 return element;
        //             }
        //         },
        //         returnAt: 'first'
        //     }
        // });

        // this.table.setHeader(['File', 'Modified']);

        // Creates table.table;
        // this.table.parse();

        this.header = document.createElement('div');
    }

    ResultsView.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: 'RESULTS' }
        }));

    };

    ResultsView.prototype.append = function() {
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

        this.tree = W.add('div', this.bodyDiv);

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
        // this.table.clear();
        if (files.length) {
            this.zipLink.style.display = '';
            // for (i = 0; i < files.length; ++i) {
            //     this.table.addRow(files[i]);
            // }
            let nodes = [];
            let curDir = { text: files[0].dir, children: [], id: files[0].dir };
            for (i = 0; i < files.length; ++i) {
                let f = files[i];
                if (curDir.text !== f.dir) {
                    nodes.push(curDir);
                    curDir = { text: f.dir, children: [], id: f.dir };
                }
                curDir.children.push({
                    text: f.file,
                    type: 'demo',
                    data: { size: f.size, mtime: f.mtime },
                    id: f.dir + '/' + f.file
                });
            }

            // var t = this.table.table;
            // debugger
            let tree = $(this.tree);
            tree.jstree({
                plugins: ["checkbox", "sort", "search" ],
                types: {
                    "default" : {
                        "icon" : "glyphicon glyphicon-flash"
                    },
                    "demo" : {
                        "icon" : "glyphicon glyphicon-ok"
                    }
                },
                core: {
                    data: nodes
                    // [
                    //     {
                    //         text: "Data",
                    //         children: nodes
                    //         // [
                    //         //     { "text" : "Child node 1" },
                    //         //     { "text" : "Child node 2" }
                    //         // ]
                    //     }
                    // ]
                }
            });

            tree.on("changed.jstree", function(e, data) {
                console.log("The selected nodes are:");
                console.log(data.selected);
                console.log(tree);
                debugger
                console.log(data.instance.get_selected(true)[0].text);
                console.log(data.instance.get_node(data.selected[0]).text);
            });

        }
        else {
            this.zipLink.style.display = 'none';
        }
        // this.table.parse();
    };

})(node);

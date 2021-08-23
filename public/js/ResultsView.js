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
            // if (that.zipLink) that.zipLink.href = that.prefixLink + '*';
        });

        // The JS tree, once loaded.
        this.tree = null;

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
        this.bodyDiv.appendChild(this.header);


        let group = W.add('div', this.header, {
            role: 'group',
            className: 'btn-group'
        });

        W.add('button', group, {
            innerHTML: 'Refresh',
            className: 'btn btn-sm'
        })
        .onclick = this.refresh;

        W.add('button', group, {
            innerHTML: 'Select All',
            className: 'btn btn-sm'
        })
        .onclick = () => {
            this.tree.jstree().select_all();
        };

        W.add('button', group, {
            innerHTML: 'Select None',
            className: 'btn btn-sm'
        })
        .onclick = () => {
            this.tree.jstree().deselect_all();
        };

        this.zipLink = W.add('button', group, {
            innerHTML: 'Download Selected',
            className: 'btn btn-sm',
            disabled: true
        });
        this.zipLink.onclick = () => {
            let sel = this.selected;
            if (!sel || !sel.length) node.game.alert('no items selected.');

            // TODO: server does not handle it well and creates wrong file name
            // if (sel.length === this.totalFiles) sel =  [ '*' ];

            let link = this.prefixLink;

            fetch(link, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(sel)
            })
            .then(res => {
              // Why 400 ?
              // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
              if (res.status >= 400) {
                throw new Error("Bad response from server");
              }

              // Fetches gets the headers first, then it process
              // the body asynchronously.

              // It also returns a promise.
              return res.json();
            })
            .then(json => {
                let el = W.get('a', {
                    href: link + json.idx,
                    download: true
                });
                console.log(el);
                document.body.appendChild(el);
                el.click();
                document.body.removeChild(el);
            })
            .catch(err => {
              console.error(err);
            });
        };
        this.header.appendChild(document.createElement('br'));

        this.lastModifiedSpan = W.add('span', this.header, {
            style: { 'font-size': '13px' }
        });

        this.bodyDiv.appendChild(document.createElement('br'));

        this.treeDiv = W.add('div', this.bodyDiv);

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
        let files = this.receivedFiles;

        this.totalFiles = 0;
        if (files.length) {
            let nodes = [];
            let curDir = {
                text: files[0].dir, children: [], id: files[0].dir
            };
            let f;
            for (let i = 0; i < files.length; ++i) {
                f = files[i];
                if (curDir.text !== f.dir) {
                    nodes.push(curDir);
                    curDir = { text: f.dir, children: [], id: f.dir };
                }
                curDir.children.push({
                    text: f.file,
                    type: getType(f.file),
                    data: { size: f.size, mtime: f.mtime },
                    id: f.dir + '/' + f.file,
                    a_attr: {
                        href: this.prefixLink + f.dir + '/' + f.file,
                        target: '_blank'
                    }
                });
                this.totalFiles++;
            }
            // Add last dir.
            nodes.push(curDir);


            // var t = this.table.table;
            // debugger
            this.tree = $(this.treeDiv);
            this.tree.jstree({
                plugins: ["checkbox", "types" ],
                types: {
                    "file" : {
                        "icon" : "./resources/jstree/file.png"
                    },
                    "csv": {
                        "icon" : "./resources/jstree/csv4.png"
                    },
                    "json": {
                        "icon" : "./resources/jstree/json3.png"
                    }
                },
                core: { data: nodes }
            });

            this.tree.on("changed.jstree", (e, data) => {
                this.zipLink.disabled =
                    (!data.selected || !data.selected.length);

                this.selected = this.tree.jstree().get_bottom_selected(false);
                W.setInnerHTML('jstree-tot-files-selected',
                               this.selected.length);
            });

        }

        this.lastModifiedSpan.innerHTML = `
<strong>Last modified</strong>:
<span style="font-size: smaller"> ${Date(this.lastModified)}</span>
<strong>Selected files</strong>:
<span id="jstree-tot-files-selected">0</span>/${this.totalFiles}<br/>
`;
    };

    /**
     * ### getExtension
     *
     * Returns the type of file based on extension
     *
     * @param {string} file The filename
     *
     * @return {string} The type of file ('csv', 'json', 'file')
     */
    function getType(file) {
        let format = file.lastIndexOf('.');
        if (format > 0) {
            let res = file.substr(format+1);
            if (res === 'json' || res === 'ndjson') return 'json';
            if (res === 'csv') return 'csv';
        }
        return 'file';
    }

})(node);

/**
 * # FileViewer widget for nodeGame
 * Copyright(c) 2021 Stefano Balietti
 * MIT Licensed
 *
 * Shows files available in data/ dir.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('FileViewer', FileViewer);

    // ## Meta-data

    FileViewer.version = '0.2.0';
    FileViewer.description = 'Displays the results files in a folder.';

    FileViewer.title = 'File Viewer';
    FileViewer.className = 'fileviewer';

    // ## Dependencies
    FileViewer.dependencies = {
        // jstree: {},
        jQuery: {}
    };

    function FileViewer(options) {

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

        this.infoSpan = null;
        this.lastModifiedSpan = null;
        this.nSelectedSpan = null;

        this.prefixLink = null;

        this.downloadBtn = null;

        node.once('MONITOR_URI', uri => this.prefixLink = uri + 'data/' );

        // The JS tree, once loaded.
        this.tree = null;

        this.header = null;



        this.selected = [];

        this.type = 'RESULTS';
    }

    FileViewer.prototype.init = function(opts) {
        // if (opts.title) this.title = title;
        this.type = opts.type;
        if (opts.sort) this.currentSort = opts.sort;
    };

    FileViewer.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: this.type }
        }));

    };

    FileViewer.prototype.append = function() {
        this.header = W.add('div', this.bodyDiv);

        let group = W.add('div', this.header, {
            role: 'group',
            className: 'btn-group'
        });

        W.add('button', group, {
            innerHTML: 'Refresh',
            className: 'btn btn-outline-dark btn-sm'
        })
        .onclick = this.refresh;

        W.add('button', group, {
            innerHTML: 'Select All',
            className: 'btn btn-outline-dark btn-sm'
        })
        .onclick = () => {
            this.tree.jstree().select_all();
        };

        W.add('button', group, {
            innerHTML: 'Select None',
            className: 'btn btn-outline-dark btn-sm'
        })
        .onclick = () => {
            this.tree.jstree().deselect_all();
        };

        this.downloadBtn = W.add('button', group, {
            innerHTML: 'Download Selected',
            className: 'btn btn-outline-dark btn-sm',
            disabled: true
        });

        this.downloadBtn.onclick = () => {
            let sel = this.selected;
            if (!sel || !sel.length) node.game.alert('no items selected.');

            if (sel.length === this.totalFiles) sel =  [ '*' ];

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
                let el = W.add('a', document.body, {
                    href: link + json.idx
                });
                el.click();
                document.body.removeChild(el);
            })
            .catch(err => {
              console.error(err);
            });
        };
        W.add('br', this.header);

        this.infoSpan = W.add('span', this.header, {
            style: { 'font-size': '13px' }
        });
        this.lastModifiedSpan = W.add('span', this.infoSpan);
        this.nSelectedSpan = W.add('span', this.infoSpan);

        W.add('br', this.bodyDiv);

        this.treeDiv = W.add('div', this.bodyDiv);

        // Query server:
        this.refresh();
    };

    FileViewer.prototype.listeners = function() {
        // Listen for server reply.
        node.on.data(`INFO_${this.type}`, msg => {
            console.log(msg.data);
            if (this.lastModified === msg.data.lastModified) return;

            this.lastModified = msg.data.lastModified;
            this.receivedFiles = msg.data.files;
            this.receivedFiles.sort(this.sortBy[this.currentSort]);
            this.displayData();
        });
    };

    FileViewer.prototype.displayData = function() {
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

                this.downloadBtn.disabled =
                    (!data.selected || !data.selected.length);

                this.selected = this.tree.jstree().get_bottom_selected(false);
                this.updateMetadata();
            });

        }

        // Update metadata.
        this.updateMetadata();
    };


    FileViewer.prototype.updateMetadata = function() {
        let d = new Date(this.lastModified);
        this.lastModifiedSpan.innerHTML = `
        <strong>Last modified</strong>:
        <span style="font-size: smaller"> ${d}</span><br/>`;
        let sel = this.selected.length;
        this.nSelectedSpan.innerHTML = `<strong>Selected files</strong>:
        <span>${sel}</span>/${this.totalFiles}<br/>`;
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

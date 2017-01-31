/**
 * # AuthView widget for nodeGame
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

    node.widgets.register('AuthView', AuthView);

    var JSUS = node.JSUS;

    // ## Meta-data

    AuthView.version = '0.0.1';
    AuthView.description = 'Displays the current authorization settings.';

    AuthView.title = 'Authorization Settings';
    AuthView.className = 'authView';

    // ## Dependencies
    AuthView.dependencies = {
        JSUS: {},
        Table: {}
    };

    function AuthView(options) {
        var that;
        that = this;

        this.prefixLink = null;
        this.downloadLinks = [];

        node.once('MONITOR_URI', function(uri) {
            var i, len, obj;
            that.prefixLink = uri + 'authsettings/';
            i = -1, len = that.downloadLinks.length;
            for ( ; ++i < len ; ) {
                obj = that.downloadLinks[i];
                makeLink(that, obj.name, obj.anchor, obj.link);
            }
        });

        this.table = new W.Table({
            className: 'table table-striped auth',
            render: { pipeline : function(item) {
                if (item.y % 2 === 0) {
                    return document.createTextNode(item.content + ': ');
                }
            }}
        });

        this.table.setHeader(['Setting', 'Value']);
        // Creates table.table.
        this.table.parse();
    }

    AuthView.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: 'AUTH' }
        }));

    };

    AuthView.prototype.append = function() {
        this.bodyDiv.appendChild(this.table.table);
        // Query server:
        this.refresh();
    };

    AuthView.prototype.listeners = function() {
        var that;
        that = this;

        // Listen for server reply.
        node.on.data('INFO_AUTH', function(msg) {
            console.log(msg.data);
            that.auth = msg.data;
            that.displayData();
        });
    };

    AuthView.prototype.displayData = function() {
        var i, t, s, l;
        s = this.auth.settings;
        t = this.table;
        t.clear();
        t.addRow(['enabled',  s.enabled ]);
        if (s.enabled) {
            t.addRow([ 'mode', s.mode ]);
            for (i in s) {
                if (s.hasOwnProperty(i)) {
                    if (i === 'codes') {
                        if (s.defaultCodes) {
                            t.addRow([ 'generator', 'default' ]);
                        }
                        else {
                            t.addRow([ 'generator', s[i] ]);
                        }
                    }
                    else if (i === 'outFile' || i === 'inFile') {
                        l = document.createElement('a');
                        l.target = '_blank';
                        makeLink(this, i, l, s[i]);
                        l.innerHTML = s[i];
                        t.addRow([ i, l]);
                    }
                    else if (i !== 'enabled' && i !== 'mode' &&
                             i !== 'defaultCodes') {

                        t.addRow([ i, s[i] ]);
                    }
                }
            }
        }
        t.parse();        
    };

    function makeLink(that, name, anchor, file) {
        if (!that.downloadLinks[name]) {
            that.downloadLinks[name] = {};
            that.downloadLinks[name].name = name;
            that.downloadLinks[name].anchor = anchor;
            that.downloadLinks[name].file = file;
        }
        else {
            anchor = that.downloadLinks[name].anchor;
        }
        if (that.prefixLink) {
            anchor.href = that.prefixLink + name + '/' + file;
        }
        else {
            anchor.href = '#';
        }
    }

})(node);

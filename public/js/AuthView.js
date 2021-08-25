/**
 * # AuthView widget for nodeGame
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

    node.widgets.register('AuthView', AuthView);

    // ## Meta-data

    AuthView.version = '0.3.0';
    AuthView.description = 'Displays the current authorization settings.';

    AuthView.title = 'Authorization';
    AuthView.className = 'authView';

    // ## Dependencies
    AuthView.dependencies = {
        Table: {}
    };

    function AuthView(options) {
        let that = this;

        this.prefixLink = null;
        node.once('MONITOR_URI', function(uri) {
            that.prefixLink = uri + 'authsettings/';
        });

        this.table = new W.Table({
            className: 'table table-striped viewer',
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
            data: {
                type: 'AUTH',
                game: node.game.channelInUse
            }
        }));

    };

    AuthView.prototype.append = function() {

        this.bodyDiv.appendChild(this.table.table);

        // Query server:
        // this.refresh();
    };

    AuthView.prototype.listeners = function() {

        node.on('CHANNEL_SELECTED', channel => {
            let title = this.title ? this.title : '';
            if (channel) title = `${channel} / ${title}`;
            this.setTitle(title);
            if (!channel) this.table.clear();
            else this.refresh();
        });

        // Listen for server reply.
        node.on.data('INFO_AUTH', (msg) => {
            // console.log(msg.data);
            this.auth = msg.data;
            this.displayData();
        });
    };

    AuthView.prototype.displayData = function() {
        var i, t, s, l;
        s = this.auth.settings;
        t = this.table;
        t.clear();
        t.addRow(['enabled',  s.enabled ]);
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
        t.addRow(['Total Player IDs', this.auth.totalPlayerIds]);
        if (this.auth.claimedIds) {
            t.addRow(['Claimed IDs', this.auth.claimedIds]);
        }
        t.parse();
    };

    function makeLink(that, name, anchor, file) {
        if (that.prefixLink) {
            anchor.href = that.prefixLink + name + '/' + file;
        }
        else {
            anchor.href = '#';
        }
    }

})(node);

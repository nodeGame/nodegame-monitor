/**
 * # Monitor for nodeGame
 * Copyright(c) 2021 Stefano Balietti
 * MIT Licensed
 *
 * Creates interface with tabs showing the status of game and server
 *
 * www.nodegame.org
 * ---
 */
function Monitor(node) {

    "use strict";

    var stager = new node.Stager();
    var tabList, tabContent;

    // Limit publishing updates.
    stager.setDefaultProperty('publishLevel',
                              node.constants.publishLevels.REGULAR);

    stager.setOnInit(function() {
        var that;

        var tmpElem;
        var clientList;

        // ## Variables and methods.

        that = this;

        // The name of the tab currently visibile.
        this.tabInUse = null;

        // ## The name of the selected channel
        this.channelInUse = null;
        if (node.game.channelName) {
            // Set own channel as default channel in use.
            let c = node.game.channelName;
            this.channelInUse = c.substring(0, c.lastIndexOf('/'));
        }

        // ## The id of the selected room.
        this.roomInUse = null;

        // ## Object containing information about the rooms of channel in use.
        this.roomsInfo = null;

        // ## Object containing information about the games of the channels.
        this.gamesInfo = null;

        // ## Object containing info about the clients of a room.
        this.clientsInfo = null;

        // ## The name of the game the channel is monitoring.
        this.gameName = null;

        // ## The DIV containing the alert box.
        this.alertDiv = document.getElementById('alertDiv');
        this.alertContent = document.getElementById('alertContent');
        this.alertClose = document.getElementById('alertClose');
        this.alertClose.onclick = function() {
            that.alertDiv.style.display = 'none';
        };

        // Flags for receiving data.
        this.waitingForChannels = false;
        this.waitingForRooms = false;
        this.waitingForClients = false;

        // Set footer as default collapseTarget.
        node.setup('widgets', { collapseTarget: 'docker' });

        /**
         * ## addTab
         *
         * Adds a tab to the header and returns it
         *
         * @param {string} name The name of the tab
         *
         * @return {HTMLElement} The div tab
         */
        this.addTab = function(name, active) {
            var tmpElem, title;
            name = name.toLowerCase();
            title = name.charAt(0).toUpperCase() + name.slice(1);
            tmpElem = document.createElement('li');
            tmpElem.className = '';
            let className = "nav-link";
            if (active) className += ' active';
            tmpElem.innerHTML =
                '<button type="button" data-bs-target="#' + name + '" class="' +
                className + '" role="tab" data-bs-toggle="tab">' +
                title + '</button>';
            tabList.appendChild(tmpElem);
            tmpElem.onclick = function() {
                that.tabInUse = name;
                node.game.refresh(name);
                node.emit('TAB_SELECTED', name);
            };
            // Tab content.
            tmpElem = document.createElement('div');
            tmpElem.className = 'tab-pane';
            if (active) tmpElem.className += ' active';
            tmpElem.id = name;
            tabContent.appendChild(tmpElem);
            return tmpElem;
        };

        this.addTile = (name, root, opts = {}) => {
            // m-5: margin x5
            // if (!opts.className) opts.className = 'col-sm-3 m-5';
            let col = W.add('div', root, 'col');
            opts.bootstrap5 = true;
            let w = node.widgets.append(name, col, opts);
            return w;
        };



        this.refreshChannels = function() {
            // Ask server for channel list.
            that.waitingForChannels = true;
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'INFO',
                data: {
                    type:      'CHANNELS',
                    extraInfo: true
                }
            }));
        };

        this.refreshRooms = function() {
            if ('string' !== typeof that.channelInUse) return;
            that.availableRooms = {};
            // Ask server for room list.
            that.waitingForRooms = true;
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'INFO',
                data: {
                    type:    'ROOMS',
                    channel: that.channelInUse
                }
            }));
        };

        this.refreshClients = function() {
            if ('string' !== typeof that.roomInUse) return;
            // Ask server for client list.
            that.waitingForClients = true;
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'INFO',
                data: {
                    type:   'CLIENTS',
                    roomId: that.roomInUse
                }
            }));
        };

        this.refreshGames = function() {
            // Ask server for games.
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'INFO',
                data: { type: 'GAMES' }
            }));

        };

        this.refresh = function(mod) {
            mod = mod || 'all';

            if (mod === 'all' || mod === 'channels') {
                node.game.refreshChannels();
            }
            if (!node.game.channelInUse) return;
            if (mod === 'all' || mod === 'rooms') {
                node.game.refreshRooms();
            }
            if (!node.game.roomInUse) return;
            if (mod === 'all' || mod === 'clients') {
                node.game.refreshClients();
            }
            if (mod === 'all' || mod === 'games') {
                node.game.refreshGames();
            }
        };

        this.alert = function(msg, type) {
            var alertDiv, a;
            that.alertDiv.className = 'alert alert-' + (type || 'success');
            that.alertContent.innerHTML = '<span class="small">' +
                JSUS.getTime() + '</span>&nbsp-&nbsp;' + msg + '&nbsp;&nbsp;';
            that.alertDiv.style.display = '';
            setTimeout(() => {
                that.alertDiv.style.display = 'none';
            }, 6000);
        };

        // ## Listeners (must be added before the widgets).

        node.on.data('INFO_CHANNELS', function(msg) {
            var channels;
            if (that.waitingForChannels) {
                that.waitingForChannels = false;
                node.emit('INFO_CHANNELS', msg.data);
                channels = Object.keys(msg.data);
                if (channels.length === 1) {
                    that.channelInUse = channels[0];
                    node.emit('CHANNEL_SELECTED', channels[0]);
                }
            }
        });

        node.on.data('INFO_ROOMS', function(msg) {
            if (that.waitingForRooms) {
                that.waitingForRooms = false;
                // Store a reference.
                that.roomsInfo = msg.data;
                node.emit('INFO_ROOMS', msg.data);
            }
        });

        node.on.data('INFO_CLIENTS', function(msg) {
            if (that.waitingForClients) {
                that.waitingForClients = false;
                // Store a reference.
                that.clientsInfo = msg.data;
                node.emit('INFO_CLIENTS', msg.data);
            }
        });


        // Listen for server reply:
        node.on.data('INFO_GAMES', function(msg) {
            var g, p, v;
            // Clear games.
            node.game.gamesInfo = {};
            // Store games data.
            for (g in msg.data) {
                if (msg.data.hasOwnProperty(g)) {
                    node.game.gamesInfo[g] = {};
                    for (p in msg.data[g]) {
                        if (msg.data[g].hasOwnProperty(p)) {
                            // Functions are skipped by JSON.stringify,
                            // so server uses J.stringifyAll.
                            if (p === 'setup' ||
                                p === 'requirements' ||
                                p === 'waitroom' ||
                                p === 'settings') {

                                v = J.parse(msg.data[g][p]);
                            }
                            else {
                                v = msg.data[g][p];
                            }
                            node.game.gamesInfo[g][p] = v;
                        }
                    }
                }
            }
            node.emit('INFO_GAMES', node.game.gamesInfo);
        });

        node.on('SOCKET_DISCONNECT', function() {
            // alert('Disconnection detected');
        });

        node.on('CHANNEL_SELECTED', function(channel) {
            that.channelInUse = channel || null;
        });

        node.on('ROOM_SELECTED', function(room) {
            that.roomInUse = room ? room.id : null;
        });

        // Disable some listeners.

        node.off('get.PING');
        node.off('in.say.REDIRECT');
        node.off('in.say.GAMECOMMAND');
        node.off('in.say.ALERT');

        // ## Init.

        // The monitor uri (differs if there is default channel or not).
        this.monitorUri = null;

        // Store the monitor uri when it is received from server.
        node.once('NODEGAME_READY', function() {
            that.monitorUri = window.location.origin;
            that.monitorUri += W.uriChannel ? W.uriChannel : '/';
            that.monitorUri += 'monitor/';
            node.emit('MONITOR_URI', that.monitorUri);
        });

        // Tabs.
        tmpElem = document.getElementById('main-container');
        tabList = document.createElement('ul');
        tabList.className = 'nav nav-tabs';
        tabList.setAttribute('role', 'tablist');
        tmpElem.appendChild(tabList);
        tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tmpElem.appendChild(tabContent);

        // Client list and controls.
        tmpElem = this.addTab('clients', true);
        // clientList = node.widgets.append('ClientList', tmpElem);
        clientList = this.addTile('ClientList', tmpElem, { className: 'xx'});
        this.clientList = clientList;

        let wiki = 'https://github.com/nodeGame/nodegame/wiki/';

        // Game details.
        tmpElem = this.addTab('settings');
        // node.widgets.append('GameDetails', tmpElem);
        this.addTile('GameDetails', tmpElem, {
            info: wiki + 'Settings-and-Treatments-v6'
        });


        // WaitRoom view.
        tmpElem = this.addTab('waitroom');
        // node.widgets.append('WaitRoomView', tmpElem);
        this.addTile('WaitRoomView', tmpElem, {
            info: wiki + 'Waiting-Room-v6'
        });

        // Auth view.
        tmpElem = this.addTab('permissions');
        // node.widgets.append('AuthView', tmpElem);
        this.addTile('AuthView', tmpElem, {
            info: wiki + 'Authorization-Rules-v6'
        });
        // node.widgets.append('RequirementsView', tmpElem);
        this.addTile('RequirementsView', tmpElem, {
            info: wiki + 'Requirements-Checkings-v6'
        });

        // Auth view.
        // tmpElem = this.addTab('requirements');

        // Results view.
        tmpElem = this.addTab('results');
        // node.widgets.append('FileViewer', tmpElem, {
        //     type: 'RESULTS',
        //     title: 'Data Folder'
        // });
        // node.widgets.append('MemoryView', tmpElem);
        // node.widgets.append('ExportView', tmpElem);
        // node.widgets.append('FileViewer', tmpElem, {
        //     type: 'EXPORT',
        //     title: 'Exports Folder',
        //     sort: 'date'
        // });

        this.addTile('FileViewer', tmpElem, {
            type: 'RESULTS',
            title: 'Data Folder',
            className: 'resultsview',
            addChannelToTitle: true
        });
        this.addTile('MemoryView', tmpElem, { className: 'mb-2' });


        // Server view.
        tmpElem = this.addTab('server');
        // node.widgets.append('ServerView', tmpElem);
        // node.widgets.append('FileViewer', tmpElem, {
        //     type: 'LOGS',
        //     title: 'Logs Folder',
        //     sort: 'date'
        // });
        this.addTile('ServerView', tmpElem);
        this.addTile('FileViewer', tmpElem, {
            type: 'LOGS',
            title: 'Log Folder',
            sort: 'date',
            className: 'logsview'
        });
        this.addTile('Exporter', tmpElem, {
            info: 'https://github.com/nodeGame/nodegame/wiki/Export-v7'
        });
        this.addTile('FileViewer', tmpElem, {
            type: 'EXPORT',
            title: 'Export Folder',
            sort: 'date',
            className: 'exportview'
        });

        // node.widgets.append('LogFiles', tmpElem);


        this.wall = node.widgets.append(
            'DebugWall',
            document.getElementById('wall-container'), {
                collapsible: true,
                bootstrap5: true
        });


        // Refresh.
        this.refresh();

    });

    // Return configuration.

    return {
        socket: {
            type: 'SocketIo',
            reconnection: false
        },
        // events: {
        //     dumpEvents: true
        // },
        metadata: {
            name: 'Monitor Screen',
            description: 'No Description',
            version: '1.0'
        },
        window: {
            promptOnleave: false
        },
        plot: stager.next('monitoring').getState(),
        debug: true,
        verbosity: 100
    };
}

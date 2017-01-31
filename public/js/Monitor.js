function Monitor(node) {

    "use strict";

    var stager = new node.Stager();
    var tabList, tabContent;

    // Limit publishing updates.
    stager.setDefaultProperty('publishLevel',
                              node.constants.publishLevels.REGULAR);

    stager.setOnInit(function() {
        var that;
        var refreshButton, autoRefreshLabel;
        var autoRefresh, autoRefreshInterval;
        var tmpElem;
        var channelList, roomList, clientList;

        // ## Variables and methods.

        that = this;

        // ## The name of the channel where the monitor is connected.
        this.channelName = null;

        // The name of the tab currently visibile.
        this.tabInUse = null;

        // ## The name of the selected channel 
        this.channelInUse = null;

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

        // ## The button controlling refresh/auto-refresh.
        this.refreshButton = null;
        // ## The auto-refresh options.
        this.refreshDropDown = null;

        // Flags for receiving data.
        this.waitingForChannels = false;
        this.waitingForRooms = false;
        this.waitingForClients = false;

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
            if (active) tmpElem.className = 'active';
            tmpElem.innerHTML =
                '<a href="#' + name + '" role="tab" data-toggle="tab">' +
                title + '</a>';
            tabList.appendChild(tmpElem);

            tmpElem = document.createElement('div');
            tmpElem.className = 'tab-pane';
            if (active) tmpElem.className += ' active';
            tmpElem.id = name;
            tabContent.appendChild(tmpElem);
            tmpElem.onclick = function() {
                that.tabInUse = name;
                node.game.refresh(name);
                node.emit('TAB_SELECTED', name);
            };
            return tmpElem;
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
            // Store reference to games data.
            node.game.gamesInfo = msg.data;
            node.emit('INFO_GAMES', msg.data);
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

        // Refresh.
        this.refreshButton = document.getElementById('refresh');
        this.refreshButton.onclick = function() {
            // TODO: refresh only node.game.tabInUse.
            node.game.refresh();
        }
        
        this.refreshDropDown = document.getElementById('refreshDropDown');
        this.refreshDropDown.onclick = function(event) {
            var target, interval;
            target = event.target;
            if (!target || !target.id) return;
            interval = parseInt(target.id.substring("refresh_".length), 10);
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            if (interval) {
                autoRefreshInterval = setInterval(function() {
                    // TODO: refresh only tab in use.
                    node.game.refresh();
                }, interval);
            }
        };
        
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
        tabList = document.createElement('ul');
        tabList.className = 'nav nav-tabs';
        tabList.setAttribute('role', 'tablist');
        document.body.appendChild(tabList);
        tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        document.body.appendChild(tabContent);

        // Channel and room list.
        tmpElem = this.addTab('channels');
        channelList = node.widgets.append('ChannelList', tmpElem);
        roomList = node.widgets.append('RoomList', tmpElem);

        // Client list and controls.
        tmpElem = this.addTab('clients', true);
        clientList = node.widgets.append('ClientList', tmpElem);
        this.clientList = clientList;

        // Game details.
        tmpElem = this.addTab('games');
        node.widgets.append('GameDetails', tmpElem);

        // Results view.
        tmpElem = this.addTab('results');
        node.widgets.append('ResultsView', tmpElem);
        node.widgets.append('MemoryView', tmpElem);

        // Auth view.
        tmpElem = this.addTab('auth');
        node.widgets.append('AuthView', tmpElem);

        // Server view.
        tmpElem = this.addTab('server');
        node.widgets.append('ServerView', tmpElem);

        // Refresh.
        this.refresh();

    });

    // Return configuration.

    return {
        socket: {
            type: 'SocketIo',
            reconnection: false
        },
        events: {
            dumpEvents: true
        },
        metadata: {
            name: 'Monitor Screen',
            description: 'No Description',
            version: '0.6'
        },
        window: {
            promptOnleave: false
        },
        plot: stager.next('monitoring').getState(),
        debug: true,
        verbosity: 100
    };
}

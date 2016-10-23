function Monitor(node) {

    "use strict";

    var stager = new node.Stager();
    var tabList, tabContent;

    stager.setOnInit(function() {
        var button, autoRefreshLabel, autoRefresh, autoRefreshInterval;
        var tmpElem;
        var channelList, roomList, clientList;


        // Add refresh button:
        button = document.createElement('button');
        button.innerHTML = 'Refresh';
        button.onclick = function() {
            // Tell widgets to refresh themselves:
            channelList.refresh();
            roomList.refresh();
            clientList.refresh();
        };
        document.body.appendChild(button);
        // Checkbox

        autoRefresh = document.createElement('input');
        autoRefresh.type = 'checkbox';
        autoRefresh.onclick = function() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
            }
            else {
                autoRefreshInterval = setInterval(function() {
                    button.click()
                }, 2000);
            }
        };
        autoRefresh.style['margin-left'] = '3px';
        autoRefreshLabel = document.createElement('label');
        autoRefreshLabel.style['margin-left'] = '5px';
        autoRefreshLabel.appendChild(document.createTextNode('Auto'));
        autoRefreshLabel.appendChild(autoRefresh);
        document.body.appendChild(autoRefreshLabel);

        // Tabs:
        tabList = document.createElement('ul');
        tabList.className = 'nav nav-tabs';
        tabList.setAttribute('role', 'tablist');
        document.body.appendChild(tabList);
        tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        document.body.appendChild(tabContent);

        // Channel and room list:
        tmpElem = addTab('channels');
        channelList = node.widgets.append('ChannelList', tmpElem);
        roomList = node.widgets.append('RoomList', tmpElem);

        // Client list and controls:
        tmpElem = addTab('clients', true);
        clientList = node.widgets.append('ClientList', tmpElem);
        this.clientList = clientList;

        // Game list.
        tmpElem = addTab('games');
        node.widgets.append('GameDetails', tmpElem);

        // Results view.
        tmpElem = addTab('results');
        node.widgets.append('ResultsView', tmpElem);

        // Server view.
        tmpElem = addTab('server');
        node.widgets.append('ServerView', tmpElem);

        // Add reconnecting players to pl.
        node.on.preconnect(function(p) {
            node.game.pl.add(p);
        });

        // Disable some listeners.

        // Do not reply to PINGs.
        node.off('get.PING');

        node.on('SOCKET_DISCONNECT', function() {
            alert('Disconnection detected');
        });
        // TODO: Check if we need to disable more more.

    });

    /**
     * ### addTab
     *
     * Adds a tab to the header and returns it
     *
     * @param {string} name The name of the tab
     *
     * @return {HTMLElement} The div tab
     */
    function addTab(name, active) {
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
        return tmpElem;
    }

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
            version: '0.5'
        },
        window: {
            promptOnleave: false
        },
        plot: stager.next('monitoring').getState(),
        debug: true,
        verbosity: 100
    };
}

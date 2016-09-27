function Monitor(node) {

    var stager = new node.Stager();
    var tabList, tabContent;

    stager.setOnInit(function() {
        var button, tmpElem;
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

        // Game list.
        tmpElem = addTab('games');
        node.widgets.append('GameList', tmpElem);

        // Results view.
        tmpElem = addTab('results');
        node.widgets.append('ResultsView', tmpElem);

        // Server view.
        tmpElem = addTab('server');
        tmpElem.appendChild(document.createTextNode('To do.'));

        //node.widgets.append('ResultsView', tmpElem);

        // Add reconnecting players to pl.
        node.on.preconnect(function(p) {
            node.game.pl.add(p);
        });

        // Disable some listeners.

        // Do not reply to PINGs.
        node.off('get.PING');

        // TODO: Check if we need more.

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
        title = name;
        title.charAt(0).toUpperCase();
        tmpElem = document.createElement('li');
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

    stager.addStage({
        id: 'monitoring',
        cb: function() {
            console.log('Monitoring');
        }
    });

    stager
        .next('monitoring');

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
        plot: stager.getState(),
        debug: true,
        verbosity: 100
    };
}

/**
 * # ClientList widget for nodeGame
 * Copyright(c) 2018 Stefano Balietti
 * MIT Licensed
 *
 * Shows list of clients and allows selection.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('ClientList', ClientList);

    var J = node.JSUS,
        Table = node.window.Table,
        GameStage = node.GameStage;

    var stageLevels;
    stageLevels = {};
    (function(stageLevels) {
        var level;
        for (level in node.constants.stageLevels) {
            if (node.constants.stageLevels.hasOwnProperty(level)) {
                stageLevels[node.constants.stageLevels[level]] = level;
            }
        }
    })(stageLevels);

    // ## Meta-data

    ClientList.version = '0.7.0';
    ClientList.description = 'Displays all clients of a room.';

    ClientList.title = 'Clients';
    ClientList.className = 'clientlist';

    // ## Dependencies

    ClientList.dependencies = {
        JSUS: {},
        Table: {}
    };

    function renderClientCell(o) {
        var content;
        var elem;

        content = o.content;
        if (J.isElement(content)) {
            return content;
        }
        else if ('object' === typeof content) {
            switch (o.y) {
            case 0:
                // Checkbox
                elem = document.createElement('input');
                elem.type = 'checkbox';
                elem.onclick = function() {
                    content.that.updateSelection(false);
                };
                if (content.prevSel.hasOwnProperty(content.id)) {
                    elem.checked = content.prevSel[content.id];
                }
                else {
                    elem.checked = !content.that.selectAll.indeterminate &&
                        content.that.selectAll.checked;
                }
                content.that.checkboxes[content.id] = elem;
                break;

            case 3:
                // Type
                if (content.thisMonitor) {
                    elem = document.createElement('em');
                    elem.title = 'This monitor.';
                }
                else {
                    elem = document.createElement('span');
                }

                elem.innerHTML = content.type;
                break;

            default:
                elem = document.createElement('span');
                elem.innerHTML = 'N/A';
                break;
            }
        }
        else {
            elem = document.createTextNode(content);
        }

        return elem;
    }

    function ClientList(options) {
        var that;

        that = this;

        // Channel currently selected.
        this.channelName = options.channel || null;

        // Rooms available in currently selected channel.
        this.availableRooms = options.availableRooms || {};

        // Currently selected room id.
        this.roomId = options.roomId || null;

        // Currently selected room name.
        this.roomName = options.roomName || null;

        // Id of the logic of the currently selected room.
        this.roomLogicId = null;

        // Table displaying the channels.
        this.channelTable = new Table();

        // Table displaying the rooms.
        this.roomTable = new Table();

        this.clientMap = {};

        // Table displaying the clients.
        this.clientTable = new Table({
            render: {
                pipeline: renderClientCell,
                returnAt: 'first'
            }
        });


        // Maps client IDs to the selection checkbox elements:
        this.checkboxes = {};

        // Create "Select All" checkbox:
        this.selectAll = document.createElement('input');
        this.selectAll.type = 'checkbox';
        this.selectAll.checked = true;
        this.selectAll.title = 'Select All';
        this.selectAll.onclick = function() {
            that.updateSelection(true);
        };

        // Create header for client table:
        this.channelTable.setHeader(['Channel']);
        this.roomTable.setHeader(['Room']);
        this.clientTable.setHeader([
            this.selectAll,
            'ID', 'SID', 'Type', 'Admin', 'Stage', 'Level', 'Paused', 'Last Error'
        ]);

        this.clientsField = null;
    }

    ClientList.prototype.setChannel = function(channelName) {
        if (!channelName || channelName !== this.channelName) {
            // Hide room table if channel changed or no channel is selected:
            if (this.roomTable && this.roomTable.table.parentNode) {
                this.roomTable.table.parentNode.style.display = 'none';
            }
            if (node.game.roomInUse !== null) this.setRoom(null);
        }

        this.channelName = channelName;
        node.emit('CHANNEL_SELECTED', channelName);
        node.game.refreshRooms();
    };

    ClientList.prototype.setRoom = function(roomId, refreshClients) {
        var roomObj, roomName;

        if (null === roomId) {
            roomName = null;
            // Hide client table if no room is selected:
            if (this.clientTable && this.clientTable.table.parentNode) {
                this.clientTable.table.parentNode.style.display = 'none';
            }
        }
        else {
            roomObj = this.availableRooms[roomId];
            if (!roomObj) {
                throw new Error('ClientList.setRoom: roomId not found: ' +
                                roomId);
            }
            roomName = roomObj.name;
        }

        this.roomId = roomId;
        this.roomName = roomName;
        this.roomLogicId = null;

        node.emit('ROOM_SELECTED', roomObj);

        if (!!refreshClients) node.game.refreshClients();
    };

    ClientList.prototype.refresh = function() {
        node.game.refreshChannels();
        node.game.refreshRooms();
        node.game.refreshClients();
    };

    ClientList.prototype.append = function() {
        var that;

        var tableStructure;
        var commandPanel, commandPanelBody, commandPanelHeading;

        var buttonDiv, button, forceCheckbox, label, kickBtn;
        var extraButtonsDiv;

        var selectionDiv, recipientSelector;
        var tableRow2, tableCell2;
        var buttonTable, tableRow, tableCell;
        
        that = this;

        // Add tables in a 3x1 table element:
        tableStructure = document.createElement('table');
        this.bodyDiv.appendChild(tableStructure);
        tableRow = document.createElement('tr');
        tableRow.style['vertical-align'] = 'top';
        tableStructure.appendChild(tableRow);

        tableCell = document.createElement('td');
        tableCell.style['border-right'] = '1px solid #ccc';
        tableRow.appendChild(tableCell);
        tableCell.appendChild(this.channelTable.table);

        tableCell = document.createElement('td');
        tableRow.appendChild(tableCell);
        tableCell.style['border-right'] = '1px solid #ccc';
        tableCell.style.display = 'none';
        tableCell.appendChild(this.roomTable.table);

        tableCell = document.createElement('td');
        tableCell.style.display = 'none';
        tableRow.appendChild(tableCell);
        tableCell.appendChild(this.clientTable.table);

        // Add client selection field:
        selectionDiv = document.createElement('div');
        this.bodyDiv.appendChild(selectionDiv);
        selectionDiv.appendChild(document.createTextNode('Selected IDs: '));

        this.clientsField = document.createElement('textarea');
        this.clientsField.rows = 1;
        this.clientsField.style['vertical-align'] = 'top';
        this.clientsField.style.width = '50em';

        selectionDiv.appendChild(this.clientsField);
        recipientSelector = W.getRecipientSelector();
        recipientSelector.onchange = function() {
            that.clientsField.value = recipientSelector.value;
        };
        selectionDiv.appendChild(recipientSelector);
        selectionDiv.style['padding'] = '10px 0px';
        selectionDiv.style['border-top'] = '1px solid #ddd';
        selectionDiv.style['border-bottom'] = '1px solid #ddd';
        selectionDiv.style['margin'] = '10px 0px';

        commandPanel = W.add('div', this.bodyDiv, {
            className: ['panel', 'panel-default', 'commandbuttons']
        });
        commandPanelHeading = W.add('div', commandPanel, {
            className: ['panel-heading']
        });
        commandPanelHeading.innerHTML = 'Commands';
        commandPanelBody = W.add('div', commandPanel, {
            className: ['panel-body', 'commandbuttons']
        });

        // Add row for buttons:
        buttonDiv = document.createElement('div');
        commandPanelBody.appendChild(buttonDiv);

        // Force checkbox:
        label = document.createElement('label');
        forceCheckbox = document.createElement('input');
        forceCheckbox.type = 'checkbox';
        forceCheckbox.style['margin-left'] = '5px';
        label.appendChild(forceCheckbox);
        label.appendChild(document.createTextNode(' Force'));


        // Add buttons for setup/start/stop/pause/resume:
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'SETUP',  'Setup', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'START',  'Start', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'STOP',   'Stop', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'PAUSE',  'Pause', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'RESUME', 'Resume', forceCheckbox));

        buttonDiv.appendChild(label);

        buttonDiv.appendChild(document.createElement('hr'));

        // Add StateBar:
        this.appendStateBar(commandPanelBody);

        tableCell2 = document.createElement('td');
        tableRow2 = document.createElement('tr');
        tableRow2.appendChild(tableCell2);

        kickBtn = document.createElement('button');
        kickBtn.className = 'btn';
        kickBtn.innerHTML = 'Kick';
        kickBtn.onclick = (function() {
            var selectedClients = that.getSelectedClients();
            selectedClients.forEach((id) => {
                if (that.clientMap[id].clientType == 'bot' ||
                    that.clientMap[id].clientType == 'player') {
                    node.disconnectClient({
                        id: id,
                        sid: that.clientMap[id].sid
                    });
                    console.log('Kicked from server: ' + id);
                }

            });
        });
        tableCell2.appendChild(kickBtn);

        commandPanelBody.appendChild(document.createElement('hr'));
        commandPanelBody.appendChild(tableRow2);

        // TODO: see if we need this now.

        commandPanelBody.appendChild(document.createElement('hr'));

        var inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        var myInput = document.createElement('input');
        myInput.type = "text";
        myInput.className ="form-control";
        myInput.placeholder = "Full URI or a page within the game";
        myInput["aria-label"] = "Full URI or a page within the game";

        inputGroup.appendChild(myInput);

        var tmp = document.createElement('span');
        tmp.className = 'input-group-btn';

        button = document.createElement('button');
        button.className = 'btn btn-default';
        button.innerHTML = 'Redirect';
        button.type = 'button';
        button.style['padding-bottom'] = '7px';
        button.onclick = function() {
            var uri, clients;
            uri = myInput.value;
            if (!uri) {
                node.warn('cannot redirect, empty uri.');
                return false;
            }
            clients = that.getSelectedClients();
            if (!clients || !clients.length) {
                node.warn('cannot redirect, no client selected.');
                return false;
            }
            node.redirect(uri, clients);
        };

        tmp.appendChild(button);
        inputGroup.appendChild(tmp);


        commandPanelBody.appendChild(inputGroup);

        
        node.widgets.append('WaitRoomControls', this.bodyDiv, {
            collapsible: true,
            hidden: true
        });

        node.widgets.append('Chatter', this.bodyDiv, {
            collapsible: true
        });

        node.widgets.append('UIControls', this.bodyDiv, {
            collapsible: true
        });

        node.widgets.append('CustomMsg', this.bodyDiv, {
            collapsible: true
        });
        
//
//         // Add bot-start button:
//         button = document.createElement('button');
//         button.innerHTML = 'Start bot';
//         button.className = 'btn';
//         button.onclick = function() {
//             node.socket.send(node.msg.create({
//                 target: 'SERVERCOMMAND',
//                 text:   'STARTBOT'
//             }));
//         };
//         commandPanelBody.appendChild(button);


        this.channelTable.parse();
    };

    ClientList.prototype.listeners = function() {
        var that;
        that = this;

        // Upon successful connection select current channel.
        node.on('NODEGAME_READY', function() {
            setTimeout(function() {
                that.setChannel(node.socket.channelName);
            });
        });

        // Listen for server reply:
        node.on('INFO_CHANNELS', function(channels) {
            // Update the contents:
            that.writeChannels(channels);
            that.updateTitle();
        });

        node.on('INFO_ROOMS', function(rooms) {
            // Update the contents:
            that.writeRooms(rooms);
            that.updateTitle();
        });

        node.on('INFO_CLIENTS', function(clients) {
            // Update the contents:
            that.roomLogicId = clients.logic ? clients.logic.id : null;
            that.writeClients(clients);
            //node.game.pl.clear();
            //node.game.pl.importDB(clients);
            that.updateTitle();
        });

        // Listen for events from ChannelList saying to switch channels:
        //node.on('CHANNEL_SELECTED', function(channel) {
        //    that.setChannel(channel);
        //});

        // Listen for events from RoomList saying to switch rooms:
        //node.on('USEROOM', function(roomInfo) {
        //    that.setRoom(roomInfo.id, roomInfo.name);

        //    // Query server:
        //    that.refresh();
        //});
    };

    ClientList.prototype.writeChannels = function(channels) {
        var chanKey, chanObj;
        var elem;
        var that;

        that = this;

        this.channelTable.clear(true);

        // Create a clickable row for each channel:
        for (chanKey in channels) {
            if (channels.hasOwnProperty(chanKey)) {
                chanObj = channels[chanKey];

                elem = document.createElement('a');
                elem.className = 'ng_clickable';
                elem.innerHTML = chanObj.name;
                elem.onclick = function(o) {
                    return function() {
                        that.setChannel(o.name);
                    };
                }(chanObj);

                this.channelTable.addRow(elem);
            }
        }

        this.channelTable.parse();
    };

    ClientList.prototype.writeRooms = function(rooms) {
        var roomName, roomObj;
        var elem, i, len;
        var that;

        that = this;

        // Clear available rooms object.
        this.availableRooms = {};

        // Unhide table cell:
        this.roomTable.table.parentNode.style.display = '';
        this.roomTable.clear(true);

        // Create a clickable row for each room:
        i = -1, len = rooms.length;
        for ( ; ++i < len ; ) {
            roomObj = rooms[i];

            // Add room to availableRooms.
            this.availableRooms[roomObj.id] = roomObj;

            // Add element to Table.
            elem = document.createElement('a');
            elem.className = 'ng_clickable';
            elem.innerHTML = roomObj.name;
            elem.onclick = (function(o) {
                return function() { that.setRoom(o.id, false); };
            })(roomObj);

            this.roomTable.addRow(elem);
        }

        this.roomTable.parse();
    };

    ClientList.prototype.writeClients = (function() {

        function addClientToRow(prevSel, clientObj) {
            this.clientMap[clientObj.id] = clientObj;
            this.clientTable.addRow([
                {id: clientObj.id, prevSel: prevSel, that: this},
                clientObj.id || 'N/A',
                clientObj.sid || 'N/A',
                {
                    type: 'string' !== typeof clientObj.clientType ?
                        'N/A' : clientObj.clientType,
                    thisMonitor: (clientObj.id === node.player.id)
                },
                'boolean' === typeof clientObj.admin ? clientObj.admin : 'N/A',
                clientObj.stage ?
                    GameStage.toHash(clientObj.stage, 'S.s-r') : 'N/A',
                stageLevels[clientObj.stageLevel],
                'boolean' === typeof clientObj.paused ? clientObj.paused : 'N/A',
                clientObj.log || '-'
            ]);
        }

        return function(msg) {
            var i, len;
            var clientId, clientObj;
            var prevSel;

            // Unhide table cell:
            this.clientTable.table.parentNode.style.display = '';

            // Save previous state of selection:
            prevSel = {};
            for (i in this.checkboxes) {
                if (this.checkboxes.hasOwnProperty(i)) {
                    prevSel[i] = this.checkboxes[i].checked;
                }
            }

            this.checkboxes = {};
            this.clientTable.clear(true);

            // Add logic first, if found.
            if (msg.logic) addClientToRow.call(this, prevSel, msg.logic);

            // Create a row for each client:
            i = -1, len = msg.clients.length;
            for ( ; ++i < len ; ) {
                clientObj = msg.clients[i];
                clientId = clientObj.id;
                if (clientId === this.roomLogicId) continue;
                addClientToRow.call(this, prevSel, clientObj);
            }

            this.clientTable.parse();
            this.updateSelection(false);
        }
    })();

    // Returns the array of client IDs that are selected with the checkboxes.
    ClientList.prototype.getSelectedCheckboxes = function() {
        var result;
        var id;

        result = [];
        for (id in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(id)) {
               if (this.checkboxes[id].checked) {
                   result.push(id);
               }
            }
        }
        return result;
    };

    // Returns the array of client IDs that are selected using the text-field.
    ClientList.prototype.getSelectedClients = function() {
        try {
            return J.parse(this.clientsField.value);
        }
        catch(ex) {
            return this.clientsField.value;
        }
    };

    ClientList.prototype.updateTitle = function() {
        var ol, li;

        // Use breadcrumbs of the form "<channelname> / <roomname> / Clients".
        ol = document.createElement('ol');
        ol.className = 'breadcrumb';

        li = document.createElement('li');
        li.innerHTML = this.channelName || 'No channel selected';
        li.className = 'active';
        ol.appendChild(li);

        if (this.roomName) {
            li = document.createElement('li');
            li.innerHTML = this.roomName;
            li.className = 'active';
            ol.appendChild(li);

            li = document.createElement('li');
            li.innerHTML = 'Clients';
            ol.appendChild(li);
        }

        this.setTitle(ol);
    };

    ClientList.prototype.updateSelection = function(useSelectAll) {
        var i;
        var allSelected, noneSelected;
        var recipients;

        // Get state of selections:
        allSelected = true;
        noneSelected = true;
        for (i in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(i)) {
                if (this.checkboxes[i].checked) {
                    noneSelected = false;
                }
                else {
                    allSelected = false;
                }
            }
        }

        if (useSelectAll) {
            // Apply the "Select All" setting to the other checkboxes.
            if (!allSelected && !noneSelected) {
                // The state was indeterminate before; deselect everything:
                this.selectAll.checked = false;
            }
            if (this.selectAll.checked) {
                for (i in this.checkboxes) {
                    if (this.checkboxes.hasOwnProperty(i)) {
                        this.checkboxes[i].checked = true;
                    }
                }
            }
            else {
                for (i in this.checkboxes) {
                    if (this.checkboxes.hasOwnProperty(i)) {
                        this.checkboxes[i].checked = false;
                    }
                }
            }
        }
        else {
            // Apply the setting of the other checkboxes to "Select All".
            this.selectAll.checked = allSelected;
            this.selectAll.indeterminate = !noneSelected && !allSelected;
        }

        // Update the selection field:
        recipients = [];
        for (i in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(i)) {
                if (this.checkboxes[i].checked) {
                    recipients.push(i);
                }
            }
        }
        this.clientsField.value = JSON.stringify(recipients);
    };

    ClientList.prototype.appendStateBar = function(root) {
        var that;
        var div;
        var sendButton, stageField;

        div = document.createElement('div');
        root.appendChild(div);

        div.appendChild(document.createTextNode('Change stage to: '));
        stageField = W.get('input', { type: 'text' });
        div.appendChild(stageField);

        sendButton = W.add('button', div);
        sendButton.className = 'btn';
        sendButton.innerHTML = 'Send';
        that = this;

        sendButton.onclick = function() {
            var to;
            var stage;

            // Should be within the range of valid values
            // but we should add a check
            to = that.getSelectedClients();

            try {
                stage = new node.GameStage(stageField.value);
                node.remoteCommand('goto_step', to, stage);
            }
            catch (e) {
                node.err('Invalid stage, not sent: ' + e);
            }
        };
    };

    /**
     * Make a button that sends a given ROOMCOMMAND.
     */
    ClientList.prototype.createRoomCommandButton =
        function(command, label, forceCheckbox) {

        var that;
        var button;

        that = this;

        button = document.createElement('button');
        button.className = 'btn';
        button.innerHTML = label;
        button.onclick = function() {
            var clients;
            var doLogic;

            // Get selected clients.
            clients = that.getSelectedClients();
            if (!clients || clients.length === 0) return;
            // If the room's logic client is selected, handle it specially.
            if (that.roomLogicId) {
                doLogic = J.removeElement(that.roomLogicId, clients);
            }

            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:    command,
                    roomId:  that.roomId,
                    doLogic: !!doLogic,
                    clients: clients,
                    force:   forceCheckbox.checked
                }
            }));
        };

        return button;
    };

})(node);

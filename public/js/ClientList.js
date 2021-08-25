/**
 * # ClientList widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
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

    ClientList.version = '0.9.0';
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

            case 2:
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

        // String containing info about the selected room or channel.
        // @see ClientList.updateTitle
        this.selectionInfo = null;

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
            'ID', 'Type', 'Step', 'Step Name', 'Status', 'Tot. Time', 'Win', 'Last Error'
        ]);

        this.clientsField = null;


        // ## The button controlling refresh/auto-refresh.
        this.refreshButton = null;
        // ## The auto-refresh options.
        this.refreshDropDown = null;
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
        var roomObj, roomName, roomSeq;


        roomSeq = {};
        if (null === roomId) {
            roomName = null;
            // Hide client table if no room is selected:
            if (this.clientTable && this.clientTable.table.parentNode) {
                this.clientTable.table.parentNode.style.display = 'none';
            }
            // Clear current selection of clients.
            this.clearSelectedClients();
        }
        else {
            roomObj = this.availableRooms[roomId];
            if (!roomObj) {
                throw new Error('ClientList.setRoom: roomId not found: ' +
                                roomId);
            }
            roomName = roomObj.name;

            let seq = roomObj.sequence;
            if (seq) {
                // Semi-duplicated code in GameControls.
                for (let i = 0 ; i < seq.length ; i++) {
                    let value = (i+1);
                    let text = seq[i].id;
                    for (let j = 0 ; j < seq[i].steps.length ; j++) {
                        let ss = seq[i].steps.length === 1;
                        let value2 = value + '.' + (j+1);
                        let text2 = ss ? text : text + '.' + seq[i].steps[j];
                        roomSeq[value2] = text2;
                    }
                }
            }
        }

        this.roomId = roomId;
        this.roomName = roomName;
        this.roomSeq = roomSeq;




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

        var selectionDiv;
        var tableStructure;
        var tableRow, tableCell;

        that = this;

        // Title Bar.

        let div = W.get('div');

        W.add('nav', div, {
            'aria-label': 'breadcrumb'
        });

        let refresh =
        `<div id="refresh-container" style="float: right; padding: 0; margin: 0; display: inline-flex">
          <div class="btn-group" role="group">
            <button type="button" id="refresh"  class="btn btn-primary">Refresh</button>
            <button type="button" class="btn btn-primary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu" id="refreshDropDown">
              <li><a class="dropdown-item" href="#" id="refresh_0">Manual</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" id="refresh_1000">Every second</a></li>
              <li><a class="dropdown-item" href="#" id="refresh_2000">Every 2 seconds</a></li>
              <li><a class="dropdown-item" href="#" id="refresh_5000">Every 5 seconds</a></li>
            </ul>
          </div>
        </div>`;

        div.innerHTML += refresh;

        this.setTitle(div);
        this.updateTitle();

        // Refresh.
        this.refreshButton = document.getElementById('refresh');
        this.refreshButton.onclick = function() {
            // TODO: refresh only node.game.tabInUse.
            node.game.refresh();
        };


        let autoRefreshInterval = null;
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

        // Main Table.

        // Add tables in a 3x1 table element:
        tableStructure = document.createElement('table');
        tableStructure.id = 'clientlist-table';
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
        selectionDiv = W.add('div', this.bodyDiv, {
            id: 'selectionDiv',
            innerHTML:
                '<strong id="client-selected-title">Selected Clients: ' +
                '</strong><em id="selected-clients-count"></em>'
        });

        this.clientsField = W.add('textarea', selectionDiv, {
            rows: 1,
            placeholder: 'Choose a room and send commands to selected clients.',
            className: 'form-control',
        });


        this.channelTable.parse();

        // Add all widgets.
        that.appendWidgets();
    };

    ClientList.prototype.listeners = function() {
        var that;
        that = this;

        // Listen for server reply:
        node.on('INFO_CHANNELS', function(channels) {
            // Update the contents:
            that.writeChannels(channels);
            that.updateTitle();
        });

        node.on('INFO_ROOMS', function(rooms) {
            // Update the contents.
            that.writeRooms(rooms.rooms);

            // Update selection info.
            that.selectionInfo = makeChannelTitle(rooms.channel);
            that.updateTitle();
        });

        node.on('INFO_CLIENTS', function(clients) {
            var t;

            // Update the contents.
            that.roomLogicId = clients.logic ? clients.logic.id : null;
            that.writeClients(clients);


            // Update selection info.
            t = that.availableRooms[node.game.roomInUse].treatmentName;
            that.selectionInfo = makeRoomTitle(clients, t);

            that.updateTitle();
        });

        node.on('ROOM_SELECTED', function(room) {
            room = room || {};
            that.customMsg.show();
            if (room.type === 'Garage') {
                that.chatter.hide();
                that.kicker.hide();
                that.uicontrols.hide();
                that.gameControls.hide();
                that.waitroomControls.hide();
            }
            else {
                that.chatter.show();
                that.kicker.show();
                that.uicontrols.show();

                if (room.type === 'Game') {
                    that.waitroomControls.hide();
                    that.gameControls.setRoom(room);
                    that.gameControls.show();
                }
                else {
                    that.gameControls.hide();
                    if (room.type === 'Waiting') {
                        that.waitroomControls.refreshTreatments();
                        that.waitroomControls.show();
                    }
                    else {
                        that.waitroomControls.hide();
                    }
                }
            }
        });

        // Listen for events from ChannelList saying to switch channels:
        node.on('CHANNEL_SELECTED', function(channel) {
            that.chatter.hide();
            that.kicker.hide();
            that.uicontrols.hide();
            that.gameControls.hide();
            that.waitroomControls.hide();
            that.customMsg.hide();
        });

        // Listen for events from RoomList saying to switch rooms:
        //node.on('USEROOM', function(roomInfo) {
        //    that.setRoom(roomInfo.id, roomInfo.name);

        //    // Query server:
        //    that.refresh();
        //});
    };

    ClientList.prototype.appendWidgets = function() {
        var mainContainer, opts;
        opts = {
            collapsible: true,
            hidden: true,
            className: ' monitor_tile mt-2 mx-2',
            bootstrap5: true
        };

        // The ClientList tab.
        mainContainer = document.getElementById('clients');

        this.waitroomControls = node.widgets.append(
            'WaitRoomControls',
            mainContainer,
            opts
           );

        this.gameControls = node.widgets.append(
            'GameControls',
            mainContainer,
            opts
        );

        this.chatter = node.widgets.append(
            'Chatter',
            mainContainer,
            opts);

        this.customMsg = node.widgets.append(
            'CustomMsg',
            mainContainer,
            opts);

        this.uicontrols = node.widgets.append(
            'UIControls',
            mainContainer,
            opts);

        this.kicker = node.widgets.append(
            'Kicker',
            mainContainer,
            opts
        );
    };

    ClientList.prototype.writeChannels = function(channels) {
        var chan, chanObj;
        var elem, oldSelected;
        var that;

        that = this;
        this.channelTable.clear(true);

        // Create a clickable row for each channel:
        for (chan in channels) {
            if (channels.hasOwnProperty(chan)) {
                chanObj = channels[chan];

                elem = document.createElement('a');
                elem.className = 'ng_clickable';

                elem.innerHTML = chanObj.name;
                elem.onclick = function(o, elem) {
                    return function() {
                        if (oldSelected) oldSelected.className = 'ng_clickable';
                        oldSelected = elem;
                        elem.className = 'ng_clickable bold';
                        that.setChannel(o.name);
                    };
                }(chanObj, elem);

                if (chan === node.game.channelInUse) elem.click();

                this.channelTable.addRow(elem);
            }
        }

        this.channelTable.parse();


        // Make sure content does not shift when selection is bold,
        // but only the first time!
        if (!this.channelTable.table.style.width) {
            this.channelTable.table.style.width =
                (this.channelTable.table.offsetWidth + 3) + 'px';
        }

    };

    ClientList.prototype.writeRooms = function(rooms) {
        var roomName, roomObj;
        var elem, oldSelected, i, len;
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
            elem.onclick = (function(o, elem) {
                return function() {
                    if (oldSelected) oldSelected.className = 'ng_clickable';
                    oldSelected = elem;
                    elem.className = 'ng_clickable bold';
                    that.setRoom(o.id, true);
                };
            })(roomObj, elem);

            // Needed when the refresh button is pressed.
            if (roomObj.id === node.game.roomInUse) elem.click();

            this.roomTable.addRow(elem);
        }

        this.roomTable.parse();

        // Make sure content does not shift when selection is bold,
        // but only the first time!
        if (!this.roomTable.table.style.width) {
            this.roomTable.table.style.width =
                (this.roomTable.table.offsetWidth + 7) + 'px';
        }
    };

    ClientList.prototype.writeClients = (function() {

        function addClientToRow(prevSel, clientObj) {
            // Store info.
            this.clientMap[clientObj.id] = clientObj;

            // Prepare data for table.

            // Client id.
            let clientId = clientObj.id || 'N/A';
            if (clientId.length > 8) {
                let short = '...' + clientId.substring(clientId.length-5);
                clientId = W.get('span', {
                    title: clientId,
                    innerHTML: short
                });
            }

            // Stage: num, seq, level.
            let stage = 'N/A';
            if (clientObj.stage) {
                stage = clientObj.stage.stage + '.' + clientObj.stage.step;
                let r = clientObj.stage.round;
                if (r > 1) stage += ' (' + r + ')';
            }

            let stageId = this.roomSeq[clientObj.stage.stage + '.' + clientObj.stage.step] || 'N/A';
            let stageLevel = stageLevels[clientObj.stageLevel];
            if (clientObj.paused) stageLevel += '(paused)';

            // Time.
            let d = clientObj.connectTime;
            let time = d ? diffMinutes(new Date(d)) + 'min' : 'N/A';

            this.clientTable.addRow([
                {id: clientObj.id, prevSel: prevSel, that: this},
                clientId,
                // clientObj.sid || 'N/A',
                {
                    type: 'string' !== typeof clientObj.clientType ?
                        'N/A' : clientObj.clientType,
                    thisMonitor: (clientObj.id === node.player.id)
                },
                // 'boolean' === typeof clientObj.admin ? clientObj.admin : 'N/A',
                stage,
                stageId,
                stageLevel,
                time,
                clientObj.win ?? '-',
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

    ClientList.prototype.clearSelectedClients = function() {
        this.clientsField.value = '';
    };

    ClientList.prototype.updateTitle = function() {

        let nav = this.headingDiv.querySelector('nav');
        nav.innerHTML = '';
        nav.style.display = 'inline-flex';

        let ol = W.add('ol', nav, { className: 'breadcrumb' });
        // Use breadcrumbs of the form "<channelname> / <roomname> / Clients".

        // W.add('li', ol, { innerHTML: 'Clients', className: 'breadcrumb-item' });

        let li = W.add('li', ol, { className: 'breadcrumb-item active' });


        if (!this.channelName) {
            li.innerHTML = 'No channel selected';
        }
        else {
            li.innerHTML = this.channelName;

            if (this.roomName) {

                li = document.createElement('li');
                li.innerHTML = this.roomName;
                li.className = 'breadcrumb-item active';
                ol.appendChild(li);
            }

            li = document.createElement('li');
            li.className = 'breadcrumb-item active';

            li.innerHTML = this.selectionInfo;

            ol.appendChild(li);
        }

        // this.setTitle(nav);
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

        this.bodyDiv.querySelector('#selected-clients-count').innerHTML =
        recipients.length ? '(' + recipients.length + ')' : '';
    };

    function makeChannelTitle(chanInfo) {
        var s;
        s = chanInfo.nGameRooms + ' rooms';
        if (chanInfo.nConnClients > 0) {
            if (chanInfo.nConnPlayers > 0) {
                s += ', ' + chanInfo.nConnPlayers;
                if (chanInfo.nDisconnPlayers > 0) {
                    s += '(+' + chanInfo.nDisconnPlayers + ')';
                }
                s += ' player';
                if (chanInfo.nConnPlayers > 1) s += 's';
            }
            if (chanInfo.nConnAdmins > 0) {
                s += ', ' + chanInfo.nConnAdmins;
                if (chanInfo.nDisconnAdmins > 1) {
                    s += '(+' + chanInfo.nDisconnAdmins + ')';
                }
                s += ' admin';
                if (chanInfo.nConnAdmins > 1) s += 's';
            }
        }
        return s;
    }

    function makeRoomTitle(clients, treatmentName) {
        var s;
        s = '';
        if (clients.nClients > 0) {
            if (clients.nPlayers) {
                s += clients.nPlayers + ' player';
                if (clients.nPlayers > 1) s += 's';
            }
            if (clients.nAdmins) {
                if (s.length) s += ', ';
                s += clients.nAdmins + ' admin';
                if (clients.nAdmins > 1) s += 's';
            }
        }
        if (treatmentName) s += ' &nbsp;:&nbsp; ' + treatmentName;
        return s;
    }

    function diffMinutes(dt2, dt1 = new Date()) {
        let diff = (dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60;
        return Math.abs(Math.round(diff));
    }

})(node);

/**
 * # GameControls widget for nodeGame
 * Copyright(c) 2018 Stefano Balietti
 * MIT Licensed
 *
 * Sends game-related messages to clients
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('GameControls', GameControls);

    var JSUS = node.JSUS;

    // ## Meta-data

    GameControls.version = '0.1.0';
    GameControls.description = 'Sends game-related messages to clients';

    GameControls.title = 'Game Controls';
    GameControls.className = 'gamecontrols';

    // ## Dependencies
    GameControls.dependencies = {
        JSUS: {}
    };

    function GameControls() {}

    GameControls.prototype.append = function() {
        var that;
        var tableRow2, tableCell2;
        var btnDiv, button, forceCheckbox, label, kickBtn;
        var extraButtonsDiv, buttonTable;
        
        that = this;
        

        // Add row for buttons:
        btnDiv = document.createElement('div');
        this.bodyDiv.appendChild(btnDiv);

        // Force checkbox:
        label = document.createElement('label');
        forceCheckbox = document.createElement('input');
        forceCheckbox.type = 'checkbox';
        forceCheckbox.style['margin-left'] = '5px';
        // Label.
        label.appendChild(forceCheckbox);
        label.appendChild(document.createTextNode(' Force'));


        // Add buttons for setup/start/stop/pause/resume:
        btnDiv.appendChild(createCmdButton('SETUP', 'Setup', forceCheckbox));
        btnDiv.appendChild(createCmdButton('START', 'Start', forceCheckbox));
        btnDiv.appendChild(createCmdButton('STOP', 'Stop', forceCheckbox));
        btnDiv.appendChild(createCmdButton('PAUSE', 'Pause', forceCheckbox));
        btnDiv.appendChild(createCmdButton('RESUME', 'Resume', forceCheckbox));

        btnDiv.appendChild(label);
        btnDiv.appendChild(document.createElement('hr'));

        // Add StateBar.
        appendStateBar(this.bodyDiv);

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

        this.bodyDiv.appendChild(document.createElement('hr'));
        this.bodyDiv.appendChild(tableRow2);

        // TODO: see if we need this now.

        this.bodyDiv.appendChild(document.createElement('hr'));

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


        this.bodyDiv.appendChild(inputGroup);


        // Append.
        this.bodyDiv.appendChild(label);
        this.bodyDiv.appendChild(document.createElement('hr'));
    };


    // Helper functions.
    
    /**
     * Make a button that sends a given ROOMCOMMAND.
     */
    function createCmdButton(cmd, label, forceCheckbox) {
        var button, cl;
        button = document.createElement('button');
        button.className = 'btn';
        button.innerHTML = label;
        cl = node.game.clientList;
        button.onclick = function() {
            var clients;
            var doLogic;

            // Get selected clients.
            clients = cl.getSelectedClients();
            if (!clients || clients.length === 0) return;
            // If the room's logic client is selected, handle it specially.
            if (node.game.roomLogicId) {
                doLogic = J.removeElement(cl.roomLogicId, clients);
            }

            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:    cmd,
                    roomId:  cl.roomId,
                    doLogic: !!doLogic,
                    clients: clients,
                    force:   forceCheckbox.checked
                }
            }));
        };

        return button;
    };

    function appendStateBar(root) {
        var cl;
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
        
        cl = node.game.clientList;
        sendButton.onclick = function() {
            var to;
            var stage;
            to = cl.getSelectedClients();
            try {
                stage = new node.GameStage(stageField.value);
                node.remoteCommand('goto_step', to, stage);
            }
            catch (e) {
                node.err('Invalid stage, not sent: ' + e);
            }
        };
    };
    
})(node);

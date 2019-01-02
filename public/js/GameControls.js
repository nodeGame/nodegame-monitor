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

    GameControls.version = '0.2.0';
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
        var btnDiv, button, forceCheckbox, label;
       
        that = this;

        // Add row for buttons:
        btnDiv = document.createElement('div');
        this.bodyDiv.appendChild(btnDiv);

        // Add buttons for pause/resume.

        // Force checkbox and label.
        label = document.createElement('label');
        forceCheckbox = W.add('input', label, {
            type: 'checkbox',
            className: 'force-checkbox'
        });
        label.appendChild(document.createTextNode(' Force'));
        
        btnDiv.appendChild(createCmdButton('PAUSE', 'Pause', forceCheckbox));
        btnDiv.appendChild(createCmdButton('RESUME', 'Resume', forceCheckbox));

        btnDiv.appendChild(label);
        btnDiv.appendChild(document.createElement('hr'));
        
        // Add buttons for setup/start/stop.

        // Force checkbox and label.
        label = document.createElement('label');
        forceCheckbox = W.add('input', label, {
            type: 'checkbox',
            className: 'force-checkbox'
        });
        label.appendChild(document.createTextNode(' Force'));
        
        btnDiv.appendChild(
            createCmdButton('SETUP', 'Setup', forceCheckbox, 'btn-sm'));
        btnDiv.appendChild(
            createCmdButton('START', 'Start', forceCheckbox, 'btn-sm'));
        btnDiv.appendChild(
            createCmdButton('STOP', 'Stop', forceCheckbox, 'btn-sm'));
        
        btnDiv.appendChild(label);        
        btnDiv.appendChild(document.createElement('hr'));

        // Add StateBar.
        var stageBar = getInputAndButton(
            'Change stage to', 'Set',
            function(stageField) {
                
                var to, stage;
                to = node.game.clientList.getSelectedClients();
                try {
                    stage = new node.GameStage(stageField.value);
                    node.remoteCommand('goto_step', to, stage);
                }
                catch (e) {
                    node.err('Invalid stage, not sent: ' + e);
                }
            });

        this.bodyDiv.appendChild(stageBar);
    };


    // Helper functions.

    /**
     * Make a button that sends a given ROOMCOMMAND.
     */
    function createCmdButton(cmd, label, forceCheckbox, className) {
        var button;
        button = document.createElement('button');
        button.className = className || 'btn';
        button.innerHTML = label;
        button.onclick = function() {
            var cl;
            var clients, doLogic;
            cl = node.game.clientList;
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
        sendButton.onclick = function(stageField) {
            var to, stage;
            to = node.game.clientList.getSelectedClients();
            try {
                stage = new node.GameStage(stageField.value);
                node.remoteCommand('goto_step', to, stage);
            }
            catch (e) {
                node.err('Invalid stage, not sent: ' + e);
            }
        };
    };


    function getInputAndButton(placeHolder, text, onclick) {
        var inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        var myInput = document.createElement('input');
        myInput.type = "text";
        myInput.className ="form-control";
        myInput.placeholder = placeHolder;
        myInput["aria-label"] = placeHolder;
        inputGroup.appendChild(myInput);

        var tmp = document.createElement('span');
        tmp.className = 'input-group-btn';

        var button = document.createElement('button');
        button.className = 'btn btn-default';
        button.innerHTML = text;
        button.type = 'button';
        button.style['padding-bottom'] = '7px';

        // Pass input to onclick callback.
        if (onclick) button.onclick = function() { onclick(myInput); };
        
        tmp.appendChild(button);
        inputGroup.appendChild(tmp);

        return inputGroup;
    }

})(node);

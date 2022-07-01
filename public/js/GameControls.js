/**
 * # GameControls widget for nodeGame
 * Copyright(c) 2021 Stefano Balietti
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

    GameControls.version = '0.4.0';
    GameControls.description = 'Sends game-related messages to clients';

    GameControls.title = 'Game Controls';
    GameControls.className = 'gamecontrols';

    // ## Dependencies
    GameControls.dependencies = {
        JSUS: {}
    };

    function GameControls() {
        // Current game room.
        this.room = null;

        // The selector for stage.step.
        this.selectStage = null;

        // The input where the stage.step are translated numerically.
        this.input = null;

        // The submit button.
        this.setBtn = null;
    }

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

        let btn = createCmdButton('PAUSE', 'Pause',
                                  forceCheckbox, 'btn btn-danger');
        btnDiv.appendChild(btn);

        btn = createCmdButton('RESUME', 'Resume',
                                  forceCheckbox, 'btn btn-warning');
        btnDiv.appendChild(btn);

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

        this.selectStage = W.add('select', this.bodyDiv);

        // Add StateBar.
        createInputAndButton(
            this,
            'Change stage to',
            'Set',
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



        this.selectStage.onchange = function() {
            var opt;
            // TODO: check can I use selectedOptions ?
            opt = this.selectedOptions[0];
            if (opt && opt.value !== '-1') that.input.value = opt.value;
        };

    };

    GameControls.prototype.setRoom = function(room) {
        if (this.room && (this.room.id === room.id)) return;
        this.room = room;
        populateSelectStage(this.selectStage, room.sequence);
    };


    // Helper functions.

    /**
     * Make a button that sends a given ROOMCOMMAND.
     */
    function createCmdButton(cmd, label, forceCheckbox, className) {
        let button = W.get('button', {
            className: className || 'btn-outline-secondary',
            innerHTML: label
        });
        button.onclick = function() {
            let cl = node.game.clientList;
            // Get selected clients.
            let clients = cl.getSelectedClients();
            if (!clients || clients.length === 0) return;
            // If the room's logic client is selected, handle it specially.
            let doLogic;
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
    }

    function populateSelectStage(select, seq) {
        var i, j, value, text, ss, opt;
        // Clear.
        select.innerHTML = '';
        // Select from list option.
        opt = document.createElement('option');
        opt.text = 'Select here or type below';
        opt.value = -1;
        select.appendChild(opt);
        // Sequence.
        for ( i = 0 ; i < seq.length ; i++) {
            value = (i+1);
            text = seq[i].id;
            for ( j = 0 ; j < seq[i].steps.length ; j++) {
                opt = document.createElement('option');
                ss = seq[i].steps.length === 1;
                opt.value = ss ? value : value + '.' + (j+1);
                opt.text = ss ? text : text + '.' + seq[i].steps[j];
                select.appendChild(opt);
            }
        }
    }


    function createInputAndButton(w, placeHolder, text, onclick) {
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
        button.className = 'btn btn-secondary';
        button.innerHTML = text;
        button.type = 'button';
        button.style['padding-bottom'] = '7px';

        // Pass input to onclick callback.
        if (onclick) button.onclick = function() { onclick(myInput); };

        tmp.appendChild(button);
        inputGroup.appendChild(tmp);

        // Store references.
        w.input = myInput;
        w.setBtn = button;

        // Append.

        w.bodyDiv.appendChild(inputGroup);
    }

})(node);

/**
 * # CustomMsg widget for nodeGame
 * Copyright(c) 2018 Stefano Balietti
 * MIT Licensed
 *
 * Manage chats with clients.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('CustomMsg', CustomMsg);

    var JSUS = node.JSUS;
    var Table = W.Table;

    // ## Meta-data

    CustomMsg.version = '0.1.0';
    CustomMsg.description = 'Sends a custom message';

    CustomMsg.title = 'Custom Message';
    CustomMsg.className = 'custommsg';

    // ## Dependencies
    CustomMsg.dependencies = {
        JSUS: {},
        Table: {}
    };

    function CustomMsg(options) {
    }

    CustomMsg.prototype.append = function() {        
        var cl;
        var fields, i, field;
        var table, tmpElem;
        var advButton, sendButton;
        var validateTableMsg, parseFunction;

        cl = node.game.clientList;

        this.recipient = null;
        this.actionSel = null;
        this.targetSel = null;

        this.table = new Table();
        this.tableAdvanced = new Table();


        // init

        // Create fields.
        fields = ['action', 'target', 'text', 'data', 'from', 'priority',
                  'reliable', 'forward', 'session', 'stage', 'created', 'id'];

        for (i = 0; i < fields.length; ++i) {
            field = fields[i];

            // Put ACTION, TARGET, TEXT, DATA in the first table which is
            // always visible, the other fields in the "advanced" table which
            // is hidden by default.
            table = i < 4 ? this.table : this.tableAdvanced;

            table.add(field, i, 0);
            if (field === 'data') {
                tmpElem = W.get('textarea', {
                    id: this.wid + '_' + field,
                    tabindex: i+1
                });
                tmpElem.rows = 1;
                table.add(tmpElem, i, 1);
            }
            else {
                table.add(W.get('input', {
                    id: this.wid + '_' + field,
                    tabindex: i+1,
                    type: 'text',
                }), i, 1);
            }

            if (field === 'action') {
                this.actionSel = W.getActionSelector(this.wid + '_actions');
                W.addAttributes(this.actionSel, {
                    tabindex: fields.length+2
                });
                table.add(this.actionSel, i, 2);
                this.actionSel.onchange = function() {
                    W.getElementById(that.msgBar.id + '_action').value =
                        that.msgBar.actionSel.value;
                };
            }
            else if (field === 'target') {
                this.targetSel = W.getTargetSelector(this.wid + '_targets');
                W.addAttributes(this.targetSel, {
                    tabindex: fields.length+3
                });
                table.add(this.targetSel, i, 2);
                this.targetSel.onchange = function() {
                    W.getElementById(that.msgBar.id + '_target').value =
                        that.msgBar.targetSel.value;
                };
            }
        }

        this.table.parse();
        this.tableAdvanced.parse();


        // helper functions
        validateTableMsg = function(e, msg) {
            var key, value;

            if (msg._invalid) return;

            if (e.y === 2) return;

            if (e.y === 0) {
                // Saving the value of last key.
                msg._lastKey = e.content;
                return;
            }

            // Fetching the value of last key.
            key = msg._lastKey;
            value = e.content.value;

            if (key === 'stage' || key === 'to' || key === 'data') {
                try {
                    value = J.parse(e.content.value);
                }
                catch (ex) {
                    value = e.content.value;
                }
            }

            // Validate input.
            if (key === 'action') {
                if (value.trim() === '') {
                    alert('Missing "action" field');
                    msg._invalid = true;
                }
                else {
                    value = value.toLowerCase();
                }

            }
            else if (key === 'target') {
                if (value.trim() === '') {
                    alert('Missing "target" field');
                    msg._invalid = true;
                }
                else {
                    value = value.toUpperCase();
                }
            }

            // Assigning the value.
            msg[key] = value;
        };
        parseFunction = function() {
            var msg, gameMsg;

            msg = {};

            that.msgBar.table.forEach(validateTableMsg, msg);
            if (msg._invalid) return null;
            that.msgBar.tableAdvanced.forEach(validateTableMsg, msg);

            // validate 'to' field:
            msg.to = clgetSelectedClients();
            if ('number' === typeof msg.to) msg.to = '' + msg.to;

            if ((!J.isArray(msg.to) && 'string' !== typeof msg.to)) {
                alert('Invalid "to" field');
                msg._invalid = true;
            }

            if (msg._invalid) return null;
            delete msg._lastKey;
            delete msg._invalid;
            gameMsg = node.msg.create(msg);
            node.info('MsgBar msg created. ' +  gameMsg.toSMS());
            return gameMsg;
        };

        // Append.

        // Show table of basic fields.
        this.bodyDiv.appendChild(this.table.table);

        this.bodyDiv.appendChild(this.tableAdvanced.table);
        this.tableAdvanced.table.style.display = 'none';

        // Show 'Send' button.
        sendButton = W.add('button', this.bodyDiv);
        sendButton.className = 'btn';
        sendButton.innerHTML = 'Send';
        sendButton.onclick = function() {
            var msg;
            msg = parseFunction();
            if (msg) node.socket.send(msg);
        };

        // Show a button that expands the table of advanced fields.
        advButton = W.add('button', this.bodyDiv, {
            innerHTML: 'Toggle advanced options'
        });
        advButton.className = 'btn';
        advButton.onclick = function() {
            that.msgBar.tableAdvanced.table.style.display =
                that.msgBar.tableAdvanced.table.style.display === '' ?
                'none' : '';
        };
    };

    /**
     * Make a button that sends a given WAITROOMCOMMAND.
     */
    CustomMsg.prototype.createWaitRoomCommandButton =
        function(command, label, inputNGames, inputGroupSize, treatmentInput) {
            var that, button;
            that = this;
            button = document.createElement('button');
            button.className = 'btn';
            button.innerHTML = label;
            button.onclick = function() {
                var data, value;
                data = {
                    type: command,
                    roomId: that.roomId,
                };
                if (command === 'DISPATCH') {
                    value = J.isInt(inputNGames.value, 1);
                    if (value !== false) data.numberOfGames = value;
                    value = J.isInt(inputGroupSize.value, 1);
                    if (value !== false) data.groupSize = value;
                    value = treatmentInput.value;
                    if (value && value.trim() !== '') {
                        data.chosenTreatment = value;
                    }
                }
                node.socket.send(node.msg.create({
                    target: 'SERVERCOMMAND',
                    text:   'WAITROOMCOMMAND',
                    data: data
                }));
            };

            return button;
        };

})(node);

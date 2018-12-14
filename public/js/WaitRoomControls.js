/**
 * # WaitRoomControls widget for nodeGame
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

    node.widgets.register('WaitRoomControls', WaitRoomControls);

    var JSUS = node.JSUS;

    // ## Meta-data

    WaitRoomControls.version = '0.1.0';
    WaitRoomControls.description = 'Manages a waiting room';

    WaitRoomControls.title = 'WaitRoom Controls';
    WaitRoomControls.className = 'waitroomcontrols';

    // ## Dependencies
    WaitRoomControls.dependencies = {
        JSUS: {}
    };

    function WaitRoomControls(options) {
        this.waitroomCommandsDiv = null;
    }

    WaitRoomControls.prototype.append = function() {
        var that;

        var waitRoomCommandsDiv, dispatchNGamesInput, dispatchGroupSizeInput;
        var treatmentInput;
        var labelDNGI, labelDGSI, labelDTI;

        
        that = this;


        // Add buttons to control waiting room (displayed only when needed).
        this.waitroomCommandsDiv = document.createElement('div');

        this.waitroomCommandsDiv.appendChild(this.createWaitRoomCommandButton(
                    'OPEN', 'Open'));
        this.waitroomCommandsDiv.appendChild(this.createWaitRoomCommandButton(
                    'CLOSE', 'Close'));
        this.waitroomCommandsDiv.appendChild(this.createWaitRoomCommandButton(
                    'PLAYWITHBOTS', 'Connects Bots'));


        this.waitroomCommandsDiv.appendChild(document.createElement('hr'));

        //this.waitroomCommandsDiv.appendChild(document.createElement('br'));

        // Need to create inputs before Dispatch button.
        dispatchNGamesInput = document.createElement('input');
        dispatchNGamesInput.size = 2;

        dispatchGroupSizeInput = document.createElement('input');
        dispatchGroupSizeInput.size = 2;

        treatmentInput = document.createElement('input');
        treatmentInput.size = 5;

        // Dispatch N Groups label.

        labelDNGI = document.createElement('label');
        labelDNGI.style['margin-left'] = '5px';
        labelDNGI.appendChild(document.createTextNode('#Groups'));
        labelDNGI.appendChild(dispatchNGamesInput);
        this.waitroomCommandsDiv.appendChild(labelDNGI);

        // Dispatch Group Size label.

        labelDGSI = document.createElement('label');
        labelDGSI.style['margin-left'] = '5px';
        labelDGSI.appendChild(document.createTextNode('#Size'));
        labelDGSI.appendChild(dispatchGroupSizeInput);
        this.waitroomCommandsDiv.appendChild(labelDGSI);

        // Treatment Label.
        labelDTI = document.createElement('label');
        labelDTI.style['margin-left'] = '5px';
        labelDTI.appendChild(document.createTextNode('Treatment'));
        labelDTI.appendChild(treatmentInput);
        this.waitroomCommandsDiv.appendChild(labelDTI);

        // Dispatch Button.
        this.waitroomCommandsDiv.appendChild(this.createWaitRoomCommandButton(
            'DISPATCH', 'Dispatch', dispatchNGamesInput,
            dispatchGroupSizeInput, treatmentInput));

 
        // Append.
        this.bodyDiv.appendChild(this.waitroomCommandsDiv);
    };

    WaitRoomControls.prototype.listeners = function() {
        var that = this;
        node.on('ROOM_SELECTED', function(room) {
            if (room && room.type === 'Waiting') that.show();            
            else if (!that.isHidden()) that.hide();            
        });
    };

    /**
     * Make a button that sends a given WAITROOMCOMMAND.
     */
    WaitRoomControls.prototype.createWaitRoomCommandButton =
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

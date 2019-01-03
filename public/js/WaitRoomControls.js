/**
 * # WaitRoomControls widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Manage a waiting room.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('WaitRoomControls', WaitRoomControls);

    var JSUS = node.JSUS;

    // ## Meta-data

    WaitRoomControls.version = '0.2.0';
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
        //dispatchNGamesInput.size = 2;
        dispatchNGamesInput.placeholder = '#Size';
        
        dispatchGroupSizeInput = document.createElement('input');
        //dispatchGroupSizeInput.size = 2;
        dispatchGroupSizeInput.placeholder = '#Groups';

        treatmentInput = document.createElement('input');
        //treatmentInput.size = 5;
        treatmentInput.placeholder = 'Treatment/s';
        
        this.waitroomCommandsDiv.appendChild(dispatchGroupSizeInput);
        this.waitroomCommandsDiv.appendChild(dispatchGroupSizeInput);
        this.waitroomCommandsDiv.appendChild(treatmentInput);
        
        // Dispatch Button.
        this.waitroomCommandsDiv.appendChild(this.createWaitRoomCommandButton(
            'DISPATCH', 'Dispatch', dispatchNGamesInput,
            dispatchGroupSizeInput, treatmentInput));

        // Append.
        this.bodyDiv.appendChild(this.waitroomCommandsDiv);


        // Closure to create button group.
        (function(w) {
            var btnGroup = document.createElement('div');
            btnGroup.role = 'group';
            btnGroup['aria-label'] = 'Play Buttons';
            btnGroup.className = 'btn-group';

            var playBotBtn = document.createElement('input');
            playBotBtn.className = 'btn btn-secondary btn';
            playBotBtn.value = 'Dispatch XX';
            playBotBtn.id = 'bot_btn';
            playBotBtn.type = 'button';
            playBotBtn.onclick = function() {
                w.playBotBtn.value = 'XX';
                w.playBotBtn.disabled = true;
                node.say('PLAYWITHBOT', 'SERVER', w.selectedTreatment);
                setTimeout(function() {
                    w.playBotBtn.value = 'Dispatch XX';
                    w.playBotBtn.disabled = false;
                }, 5000);
            };

            btnGroup.appendChild(playBotBtn);

            // Store reference in widget.
            w.playBotBtn = playBotBtn;


            var btnGroupTreatments = document.createElement('div');
            btnGroupTreatments.role = 'group';
            btnGroupTreatments['aria-label'] = 'Select Treatment';
            btnGroupTreatments.className = 'btn-group';

            var btnTreatment = document.createElement('button');
            btnTreatment.className = 'btn btn-default btn ' +
                'dropdown-toggle';
            btnTreatment['data-toggle'] = 'dropdown';
            btnTreatment['aria-haspopup'] = 'true';
            btnTreatment['aria-expanded'] = 'false';
            btnTreatment.innerHTML = 'Treatment';

            var span = document.createElement('span');
            span.className = 'caret';

            btnTreatment.appendChild(span);

            var ul = document.createElement('ul');
            ul.className = 'dropdown-menu';
            ul.style = 'text-align: left';

            var conf = [ 'treatment_random', 'treatment_rotate' ];
            
            if (node.game.channelInUse) {
                conf = conf.concat(node.game.gamesInfo[node.game.channelInUse]);
            }
            
            var li, a, t, liT1, liT2;
            
            li = document.createElement('li');
            li.innerHTML = 'Select Treatment';
            li.className = 'dropdown-header';
            ul.appendChild(li);
            var i;
            for (i = 0; i < conf.length; i++) {
                t = conf[i];
                li = document.createElement('li');
                li.id = t;
                a = document.createElement('a');
                a.href = '#';
                a.innerHTML = '<strong>' + t + '</strong>';
                li.appendChild(a);
                if (t === 'treatment_rotate') liT1 = li;
                else if (t === 'treatment_random') liT2 = li;
                else ul.appendChild(li);
                
            }
            li = document.createElement('li');
            li.role = 'separator';
            li.className = 'divider';
            ul.appendChild(li);
            li = document.createElement('li');
            li.innerHTML = 'Default treatment';
            li.className = 'dropdown-header';
            ul.appendChild(li);
            ul.appendChild(liT1);
            ul.appendChild(liT2);
            
            btnGroupTreatments.appendChild(btnTreatment);
            btnGroupTreatments.appendChild(ul);

            btnGroup.appendChild(btnGroupTreatments);

            // Variable toggled controls if the dropdown menu
            // is displayed (we are not using bootstrap js files)
            // and we redo the job manually here.
            var toggled = false;
            btnTreatment.onclick = function() {
                if (toggled) {
                    ul.style = 'display: none';
                    toggled = false;
                }
                else {
                    ul.style = 'display: block; text-align: left';
                    toggled = true;
                }
            };

            ul.onclick = function(eventData) {
                var t;
                ul.style = 'display: none';
                t = eventData.target.parentNode.id;
                if (!t) t = eventData.target.parentNode.parentNode.id;
                console.log(eventData.target.parentNode);
                console.log(t);
                btnTreatment.innerHTML = t + ' ';
                btnTreatment.appendChild(span);
                w.selectedTreatment = t;
                toggled = false;
            };

            // Store Reference in widget.
            // w.treatmentBtn = btnTreatment;

            // Append button group.
            w.bodyDiv.appendChild(document.createElement('br'));
            w.bodyDiv.appendChild(btnGroup);

        })(this);
        
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

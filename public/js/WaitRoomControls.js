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

    WaitRoomControls.version = '0.3.1';
    WaitRoomControls.description = 'Manages a waiting room';

    WaitRoomControls.title = 'WaitRoom Controls';
    WaitRoomControls.className = 'waitroomcontrols';

    WaitRoomControls.customCbName = '_custom cb_';

    // ## Dependencies
    WaitRoomControls.dependencies = {
        JSUS: {}
    };

    function WaitRoomControls(options) {
        this.waitroomCommandsDiv = null;

        // ## The UL element containing the available treatments.
        this.treatmentsList = null;

        // ## The INPUT element containing the chosen treatment.
        this.treatmentChosenBtn = null;

        // ## The name of chosen treatment.
        this.selectedTreatment = null;
    }

    WaitRoomControls.prototype.append = function() {
        var that;

        var waitRoomCommandsDiv;

        // var dispatchNGamesInput, dispatchGroupSizeInput;
        // var treatmentInput;

        that = this;

        // Add buttons to control waiting room (displayed only when needed).
        this.waitroomCommandsDiv = document.createElement('div');

        this.waitroomCommandsDiv.appendChild(
            this.getWaitRoomCmdBtn('OPEN', 'Open'));
        this.waitroomCommandsDiv.appendChild(
            this.getWaitRoomCmdBtn('CLOSE', 'Close'));

        this.waitroomCommandsDiv.appendChild(document.createElement('hr'));

        this.waitroomCommandsDiv.appendChild(
            this.getWaitRoomCmdBtn('PLAYWITHBOTS', 'Connect Bots'));


        this.waitroomCommandsDiv.appendChild(document.createElement('hr'));

        ////////////////////////////////////////////////////////////////////////

        // This was old code to select how many players to dispatch.

        // Need to create inputs before Dispatch button.
        // dispatchNGamesInput = document.createElement('input');
        //dispatchNGamesInput.size = 2;
        // dispatchNGamesInput.placeholder = '#Size';

        // dispatchGroupSizeInput = document.createElement('input');
        //dispatchGroupSizeInput.size = 2;
        // dispatchGroupSizeInput.placeholder = '#Groups';

        // treatmentInput = document.createElement('input');
        //treatmentInput.size = 5;
        // treatmentInput.placeholder = 'Treatment/s';

        // this.waitroomCommandsDiv.appendChild(dispatchGroupSizeInput);
        // this.waitroomCommandsDiv.appendChild(dispatchGroupSizeInput);
        // this.waitroomCommandsDiv.appendChild(treatmentInput);

        // Dispatch Button.
        //this.waitroomCommandsDiv.appendChild(this.getWaitRoomCmdBtn(
        //     'DISPATCH', 'Dispatch', dispatchNGamesInput,
        //    dispatchGroupSizeInput, treatmentInput));

        ////////////////////////////////////////////////////////////////////////

        // Append.
        this.bodyDiv.appendChild(this.waitroomCommandsDiv);


        // Closure to create button group.
        (function(w) {
            var btnGroup = document.createElement('div');
            btnGroup.role = 'group';
            btnGroup['aria-label'] = 'Play Buttons';
            btnGroup.className = 'btn-group';

            var dispatchBtn = w.getWaitRoomCmdBtn('DISPATCH', 'Dispatch now');
            dispatchBtn.className = 'btn btn-secondary';

            btnGroup.appendChild(dispatchBtn);

            // Store reference in widget.
            w.dispatchBtn = dispatchBtn;

            var btnGroupTreatments = document.createElement('div');
            btnGroupTreatments.role = 'group';
            btnGroupTreatments['aria-label'] = 'Select Treatment Group';
            btnGroupTreatments.className = 'btn-group';

            // Here we create the Button holding the treatment.
            var btnTreatment = document.createElement('button');
            btnTreatment.className = 'btn btn-default btn ' +
                'dropdown-toggle';
            btnTreatment['data-toggle'] = 'dropdown';
            btnTreatment['aria-haspopup'] = 'true';
            btnTreatment['aria-expanded'] = 'false';
            btnTreatment.innerHTML = 'Select Treatment';
            w.treatmentChosenBtn = btnTreatment;

            // Here the create the UL of treatments.
            // It will be populated when a waiting room is selected.
            var ul = w.treatmentsList = document.createElement('ul');
            ul.className = 'dropdown-menu';
            ul.style = 'text-align: left';

            btnGroupTreatments.appendChild(btnTreatment);
            btnGroupTreatments.appendChild(ul);

            btnGroup.appendChild(btnGroupTreatments);

            // Variable toggled controls if the dropdown menu
            // is displayed (we are not using bootstrap js files)
            // and we redo the job manually here.
            var toggled = false;
            btnTreatment.onclick = function() {
                if (toggled) {
                    ul.style.display = 'none';
                    toggled = false;
                }
                else {
                    ul.style.display = 'block';
                    toggled = true;
                }
            };

            ul.onclick = function(eventData) {
                var t;
                t = eventData.target;
                // When '' is hidden by bootstrap class.
                ul.style.display = '';
                toggled = false;
                t = t.parentNode.id;
                // Clicked on description?
                if (!t) t = eventData.target.parentNode.parentNode.id;
                // Nothing relevant clicked (e.g., header).
                if (!t) return;
                w.setTreatment(t);
            };

            // Store Reference in widget.
            // w.treatmentBtn = btnTreatment;

            // Append button group.
            // w.bodyDiv.appendChild(document.createElement('br'));

            var str;
            str = document.createTextNode('Won\'t dispatch if not ' +
                                          'enough players.');
            w.bodyDiv.appendChild(str);
            w.bodyDiv.appendChild(document.createElement('br'));
            w.bodyDiv.appendChild(document.createElement('br'));

            w.bodyDiv.appendChild(btnGroup);

        })(this);

    };

    WaitRoomControls.prototype.setTreatment = function(t) {
        var span = document.createElement('span');
        span.className = 'caret';
        this.treatmentChosenBtn.innerHTML = t + ' ';
        this.treatmentChosenBtn.appendChild(span);
        // Don't set the custom cb.
        if (t !== WaitRoomControls.customCbName) this.selectedTreatment = t;
    };

    WaitRoomControls.prototype.refreshTreatments = function() {
        var treatments, ul;
        var li, a, t, liT1, liT2, liT3;
        var i, chosenTreatment;

        ul = this.treatmentsList;

        // Clear the list.
        ul.innerHTML = '';

        treatments = [ 'treatment_random', 'treatment_rotate' ];

        if (node.game.channelInUse) {
            // Reusing t.
            t = node.game.gamesInfo[node.game.channelInUse];

            if (t.treatmentNames) {
                treatments = treatments.concat(t.treatmentNames);
            }

            chosenTreatment = t.waitroom.CHOSEN_TREATMENT;
            if ('function' === typeof chosenTreatment) {
                chosenTreatment = WaitRoomControls.customCbName;
                treatments.push(chosenTreatment);
            }

        }

        // Make custom
        li = document.createElement('li');
        li.innerHTML = 'Game Treatments';
        li.className = 'dropdown-header';
        ul.appendChild(li);

        for (i = 0; i < treatments.length; i++) {
            t = treatments[i];
            li = document.createElement('li');
            li.id = t;
            a = document.createElement('a');
            a.href = '#';
            a.innerHTML = '<strong>' + t + '</strong>';
            li.appendChild(a);
            if (t === 'treatment_rotate') liT1 = li;
            else if (t === 'treatment_random') liT2 = li;
            else if (t === WaitRoomControls.customCbName) liT3 = li;
            else ul.appendChild(li);

            // Set chosen treatment.
            if (li.id === chosenTreatment) {
                this.setTreatment(t);
            }
        }
        li = document.createElement('li');
        li.role = 'separator';
        li.className = 'divider';
        ul.appendChild(li);
        li = document.createElement('li');
        li.innerHTML = 'Callbacks';
        li.className = 'dropdown-header';
        ul.appendChild(li);
        ul.appendChild(liT1);
        ul.appendChild(liT2);
        ul.appendChild(liT3);
    };

    /**
     * Make a button that sends a given WAITROOMCOMMAND.
     */
    WaitRoomControls.prototype.getWaitRoomCmdBtn =
        function(command, label, inputNGames, inputGroupSize, treatmentInput) {
            var that, button;
            that = this;
            button = document.createElement('button');
            button.className = 'btn';
            button.innerHTML = label;
            if (command === 'OPEN') button.className += ' btn-success';
            else if (command === 'CLOSE') button.className += ' btn-danger';

            button.onclick = function() {
                var data, value;
                button.disabled = true;
                setTimeout(function() {
                    button.disabled = false;
                }, 1000);

                data = {
                    type: command,
                    roomId: node.game.roomInUse
                };
                if (command === 'DISPATCH' && that.selectedTreatment) {
                    // Old code to pass more options to DISPATCH.
                    // value = J.isInt(inputNGames.value, 1);
                    // if (value !== false) data.numberOfGames = value;
                    // value = J.isInt(inputGroupSize.value, 1);
                    // if (value !== false) data.groupSize = value;
                    // value = treatmentInput.value;
                    // if (value && value.trim() !== '') {
                    //     data.chosenTreatment = value;
                    // }
                    data.chosenTreatment = that.selectedTreatment;
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

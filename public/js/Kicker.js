/**
 * # Kicker widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Kicks, moves and redirect players
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('Kicker', Kicker);

    var JSUS = node.JSUS;

    // ## Meta-data

    Kicker.version = '0.1.0';
    Kicker.description = 'Kicks, moves and redirect players';

    Kicker.title = 'Kick and Redirect';
    Kicker.className = 'kicker';

    // ## Dependencies
    Kicker.dependencies = {
        JSUS: {}
    };

    function Kicker() {}

    Kicker.prototype.append = function() {
        var that;
        var kickBtn;
        var elems, inputGroup, redirectInput;
        
        that = this;

        kickBtn = document.createElement('button');
        kickBtn.className = 'btn';
        kickBtn.innerHTML = 'Kick';
        kickBtn.onclick = (function() {
            var cl = node.game.clientList;
            var selectedClients = cl.getSelectedClients();
            selectedClients.forEach((id) => {
                if (cl.clientMap[id].clientType === 'bot' ||
                    cl.clientMap[id].clientType === 'player') {
                    node.disconnectClient({
                        id: id,
                        sid: cl.clientMap[id].sid
                    });
                    console.log('Kicked from server: ' + id);
                }
            });
        });
        this.bodyDiv.appendChild(kickBtn);

        this.bodyDiv.appendChild(document.createElement('hr'));

        elems = getInputAndButton(
            'Full URI or a page within the game',
            'Redirect',
            function() {
                var uri, clients;
                uri = redirectInput.value;
                if (!uri) {
                    node.warn('cannot redirect, empty uri.');
                    return false;
                }
                clients = node.game.clientList.getSelectedClients();
                if (!clients || !clients.length) {
                    node.warn('cannot redirect, no client selected.');
                    return false;
                }
                node.redirect(uri, clients);
            });
        inputGroup = elems[0];
        redirectInput = elems[1];
        
        this.bodyDiv.appendChild(inputGroup);
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

        return [ inputGroup, myInput, button ];
    }

})(node);

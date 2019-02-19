/**
 * # UIControls widget for nodeGame
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

    node.widgets.register('UIControls', UIControls);

    var JSUS = node.JSUS;

    // ## Meta-data

    UIControls.version = '0.1.0';
    UIControls.description = 'Manages the UI of clients.';

    UIControls.title = 'UI Controls';
    UIControls.className = 'uicontrols';

    // ## Dependencies
    UIControls.dependencies = {
        JSUS: {}
    };

    function UIControls(options) {
        
    }

    UIControls.prototype.append = function() {
        var label;
        var setupOpts, btnLabel;
        var button;
        var buttonTable;
        var tableRow2, tableCell2;
        var buttonTable, tableRow, tableCell;
        var str;
        
        str = document.createTextNode('Modify browser behavior.');
        this.bodyDiv.appendChild(str);
        this.bodyDiv.appendChild(document.createElement('br'));
        this.bodyDiv.appendChild(document.createElement('br'));

        
        // Add a table for buttons:
        buttonTable = document.createElement('table');

        // Add buttons for disable right click/ESC, prompt on leave, waitscreen.
        setupOpts = {
            'Disable right-click': 'disableRightClick',
            'Disable Esc': 'noEscape',
            'Prompt on leave': 'promptOnleave',
            'Wait-screen': 'waitScreen'
        };

        for (btnLabel in setupOpts) {
            if (setupOpts.hasOwnProperty(btnLabel)) {
                tableRow = document.createElement('tr');
                buttonTable.appendChild(tableRow);

                tableCell = document.createElement('td');
                tableCell.innerHTML = btnLabel;
                tableRow.appendChild(tableCell);

                tableCell = document.createElement('td');
                tableRow.appendChild(tableCell);

                button = document.createElement('button');
                button.className = 'btn';
                button.innerHTML = 'On';
                button.onclick = (function(optName) {
                    return function() {
                        var cl, opts;
                        opts = {};
                        opts[optName] = true;
                        cl = node.game.clientList;
                        node.remoteSetup('window', cl.getSelectedClients(),
                                         opts);
                    };
                })(setupOpts[btnLabel]);
                tableCell.appendChild(button);

                button = document.createElement('button');
                button.className = 'btn btn-secondary';
                button.innerHTML = 'Off';
                button.onclick = (function(optName) {
                    return function() {
                        var cl, opts;
                        opts = {};
                        opts[optName] = false;
                        cl = node.game.clientList;
                        node.remoteSetup('window', cl.getSelectedClients(),
                                         opts);
                    };
                })(setupOpts[btnLabel]);
                tableCell.appendChild(button);
            }
        }

        // Append.
        this.bodyDiv.appendChild(buttonTable);
    };


})(node);

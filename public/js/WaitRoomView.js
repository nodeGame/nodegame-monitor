/**
 * # WaitRoomView widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Shows requirements settings
 *
 * www.nodegame.org
 * ---
 */

(function(node) {
    ("use strict");

    node.widgets.register("WaitRoomView", WaitRoomView);

    var JSUS = node.JSUS;

    // ## Meta-data

    WaitRoomView.version = "0.1.0";
    WaitRoomView.description = "Displays/Edits waitroom settings";

    WaitRoomView.title = "WaitRoom Settings";
    WaitRoomView.className = "waitroomview";

    // ## Dependencies
    WaitRoomView.dependencies = {
        JSUS: {},
        Table: {}
    };    

    function WaitRoomView(options) {
        var that = this;

        // The edit button.
        var edit;

        // Contains current values to compare changes.
        var orig = this.originalTable = {};
        
        this.table = new W.Table({
            className: "table table-striped viewer",
            id: "settingsTable",
            render: {
                pipeline: function(item) {
                    var res;

                    // This is the header.
                    if ('undefined' === typeof item.x) return;

                    // x = 0 y = 0 first row first column.
                    // x = 0 y = 1 first row second column.
                    
                    if (item.y % 2 === 0) {
                        res = document.createTextNode(item.content + ": ");
                    }
                    else {
                        debugger
                        res = document.createElement("input");
                        res.value = item.content;
                        res.disabled = true;
                        res.id = getId(item.id);
                        // res.style.background = 'white';
                    }
                    return res;
                }
            }
        });

        
        this.table.setHeader(["Setting", "Value"]);

        // Creates table.table.
        this.table.parse();

        // Add Button.
        edit = this.editSaveButton = document.createElement("button");
        edit.className = "btn btn-primary";
        edit.innerHTML = "Edit";
        edit.style['float'] = 'right';
        // Disabled until data is received.
        edit.disabled = true;
        
        edit.onclick = function() {
            var key, changes, input;

            debugger
            
            if (edit.innerHTML === "Save") {
                edit.innerHTML = "Edit";
                changes = {};
                for (key in orig) {
                    if (orig.hasOwnProperty(key)) {
                        input = document.getElementById(getId(key));

                        input.disabled = true;
                        if (input.value !== orig[key]) {
                            // Update original value, keep reference to changes.
                            orig[key] = changes[key] = input.value;
                        }
                    }
                }

                // Send changes in waitingroom.
                if (!J.isEmpty(changes)) {
                    node.socket.send(
                        node.msg.create({
                            target: "SERVERCOMMAND",
                            text: "UPDATE_SETTINGS",
                            data: {
                                type: "waitroom", // or requirements or settings, etc.
                                update: changes,
                                levels: true
                            }
                        })
                    );
                }
                console.log("CHANGES: " + JSON.stringify(changes));
            }            
            else {
                edit.innerHTML = "Save";

                for (key in orig) {
                    if (orig.hasOwnProperty(key)) {
                        input = document.getElementById(getId(key));
                        input.disabled = false;
                    }                
                }
            }
                
            //     //send changes in settings
            //     if (!J.isEmpty(changes.mySettings)) {
            //         node.socket.send(
            //             node.msg.create({
            //                 target: "SERVERCOMMAND",
            //                 text: "UPDATE_SETTINGS",
            //                 data: {
            //                     type: "settings", // or requirements or settings, etc.
            //                     update: changes.mySettings,
            //                     levels: true
            //                 }
            //             })
            //         );
            //     }

                //send the new data back to server
            
        };
        
    }

    WaitRoomView.prototype.append = function() {
        this.bodyDiv.appendChild(this.table.table);
        this.bodyDiv.appendChild(this.editSaveButton);
    };

    WaitRoomView.prototype.listeners = function() {
        var that;
        that = this;
        node.on("CHANNEL_SELECTED", function() {
            that.displayData();
        });
    };

    WaitRoomView.prototype.displayData = function() {
        var i, t, s, tmp;
        var that = this;

        // Not ready yet.
        if (!node.game.gamesInfo) return;

        // Disable temporarily the button.
        this.editSaveButton.disabled = true;
        
        s = node.game.gamesInfo[node.game.channelInUse].waitroom;
        t = this.table;
        t.clear();

        // LEVELS in case later use.
        // node.game.gamesInfo[node.game.channelInUse].levels;

        for (i in s) {
            if (s.hasOwnProperty(i)) {

                // Store reference to ID.
                this.originalTable[i] = s[i];

                // Add the row.
                // The id is added in the second cell, so that we can
                // fetch it more easily.
                t.addRow([i, { id: i, content: s[i]} ]);
            }
        };                

        t.parse();

        // Re-enable button.
        this.editSaveButton.disabled = false;
    };

    // Helper function.

    // Returns a standardized id given the key.
    function getId(key) {
        return 'viewer_' + key;
    }

})(node);

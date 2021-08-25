/**
 * # WaitRoomView widget for nodeGame
 * Copyright(c) 2021 Stefano Balietti
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

    // ## Meta-data

    WaitRoomView.version = "0.2.0";
    WaitRoomView.description = "Displays/Edits waitroom settings";

    WaitRoomView.title = "Wait Room";
    WaitRoomView.className = "waitroomview";

    // ## Dependencies
    WaitRoomView.dependencies = {
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
                    var res, txt, br;

                    // This is the header.
                    if ('undefined' === typeof item.x) return;

                    // x = 0 y = 0 first row first column.
                    // x = 0 y = 1 first row second column.

                    if (item.y % 2 === 0) {
                        res = document.createElement('span');
                        res.innerHTML = item.content + ": ";
                        // res.title = "123";
                        // res.style.cursor = 'help';
                    }
                    else {
                        res = document.createElement("input");
                        if ('object' === typeof item.content) {
                            // br = '<br class="viewer_br" />';
                            // txt = ''
                            // for (key in item.content) {
                            //     if (item.content.hasOwnProperty(key)) {
                            //         txt += (key + ': ' +
                            //                 item.content[key] + br);
                            //     }
                            // }
                            // // If at least one property.
                            // if (txt) txt = '{' + br + txt + br + '}';
                            // else txt = '{}';
                            txt = JSON.stringify(item.content);
                            res.value = txt;
                        }
                        else {
                            res.value = item.content;
                        }
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
            var key, changes, input, info, value, err, oldValue, changed;

            if (edit.innerHTML === "Save") {
                err = [];
                changes = {};
                info = node.game.gamesInfo[node.game.channelInUse].waitroom;

                for (key in orig) {
                    if (orig.hasOwnProperty(key)) {
                        input = document.getElementById(getId(key));

                        oldValue = orig[key];
                        value = input.value;
                        changed = false;

                        // Check type. Only same type allowed for now.
                        if ('number' === typeof oldValue) {
                            value = J.isNumber(value);
                            if (value === false) err.push(key);
                            if (value !== oldValue) changed = true;
                        }
                        else if ('string' === typeof oldValue) {
                            if (value !== oldValue) changed = true;
                        }
                        else if ('object' === typeof oldValue) {
                            try {
                                value = JSON.parse(value);
                                if (!J.equals(oldValue, value)) changed = true;
                            }
                            catch(e) {
                                err.push(key);
                            };

                        }
                        else if ('function' === typeof oldValue) {
                            // We need to remove all extra lines to make
                            // the comparison.
                            oldValue = oldValue.toString()
                                .replace(/(\r\n|\n|\r)/gm,"");
                            changed = oldValue !==
                                value.replace(/(\r\n|\n|\r)/gm,"");

                            if (changed) {
                                try {
                                    value = J.eval(value);
                                }
                                catch(e) {
                                    err.push(key);
                                }
                            }
                        }

                        // Save changes.
                        if (changed) changes[key] = value;
                    }
                }

                // We first validate everything, then update.
                if (err.length) {
                    alert('Invalid updates: ' + err.join(', '));
                    return;
                }

                // No errors (but also maybe no changes).
                edit.innerHTML = "Edit";

                // console.log(changes);

                // Update visuals and local info.
                for (key in orig) {
                    if (orig.hasOwnProperty(key)) {

                        input = document.getElementById(getId(key));
                        input.disabled = true;

                        if (changes.hasOwnProperty(key)) {

                            // Update original value.
                            orig[key] = changes[key];

                            // Used by monitor.
                            info[key] = changes[key];
                        }
                    }
                }

                // Send to server any change.
                if (!J.isEmpty(changes)) {

                    node.socket.send(
                        node.msg.create({
                            target: "SERVERCOMMAND",
                            text: "UPDATE_SETTINGS",
                            data: {
                                // or requirements or settings, etc.
                                type: "waitroom",
                                update: changes,
                                levels: true
                            }
                        })
                    );
                }
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
            //                     // or requirements or settings, etc.
            //                     type: "settings",
            //                     update: changes.mySettings,
            //                     levels: true
            //                 }
            //             })
            //         );
            //     }


        };

    }

    WaitRoomView.prototype.append = function() {
        this.bodyDiv.appendChild(this.table.table);
        let warn = document.createTextNode('Edit feature ' +
                   'experimental, variable type fixed.');
        this.bodyDiv.appendChild(warn);
        this.bodyDiv.appendChild(this.editSaveButton);
    };

    WaitRoomView.prototype.listeners = function() {
        var that;
        that = this;
        node.on("CHANNEL_SELECTED", channel => {
            let title = this.title ? this.title : '';
            if (channel) title = `${channel} / ${title}`;
            this.setTitle(title);
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

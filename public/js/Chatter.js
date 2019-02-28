/**
 * # Chatter widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Manage chats with clients.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('Chatter', Chatter);

    var JSUS = node.JSUS;

    // ## Meta-data

    Chatter.version = '0.3.0';
    Chatter.description = 'Manage chats with the clients.';

    Chatter.title = 'Chat';
    Chatter.className = 'chatter';

    // ## Dependencies
    Chatter.dependencies = {
        JSUS: {}
    };

    // Position 0 is default.
    Chatter.modes = [
        {
            id: 'one_to_many',
            name: 'One to many',
            description: 'Broadcast to all participants, replies ' +
                'visible to you only'
        },
        {
            id: 'many_to_many',
            name: 'Many to many',
            description: 'Broadcast to all participants, replies visible to all'
        },
        {
            id: 'receivers_only',
            name: 'Receivers only',
            description: 'Broadcast to all participants, replies not allowed'
        }
    ];
    // Index the modes by id.
    Chatter.modesIdx = {};
    (function(c) {
        var i;
        for (i = 0; i < c.modes.length; i++) {
            c.modesIdx[c.modes[i].id] = c.modes[i];
        }
    })(Chatter);

    function Chatter(options) {

        // Reference to the button to start a new chat.
        this.chatButton = null;

        // Reference to select menu for type of chat.
        // @see Chatter.modes
        this.chatMode = Chatter.modes[0].id;

        // Checkbox to include bots, etc.
        this.includeNonPlayers = null;

        // Checkbox to erase initial message for each new chat.
        this.eraseInitialMsg = null;

        // Textarea with initial msg, etc.
        this.initialMsg = null;

        // List of open chats.
        this.chats = {};

        // TODO.
        // List of visible chats.
        // this.visibleChats = [];

    }

    Chatter.prototype.append = function() {
        var that, label;
        that = this;
        
        // Initial msg.
        this.initialMsg = W.add('textarea', this.bodyDiv, {
            className: 'form-control initial-chat-msg',
            placeholder: 'Initial message (optional)'
        });

        this.bodyDiv.appendChild(document.createElement('br'));

        // Buttons.
        this.chatButton = W.get('button', {
            className: 'btn btn-primary',
            innerHTML: 'Chat'
        });

        // On click.
        this.chatButton.onclick = function() {
            var cl, chatEvent, allClients, msg, opts;
            var title, visibleTitle, selectedClients, recipients;

            // Collect recipients list.
            
            cl = node.game.clientList;
            selectedClients = cl.getSelectedClients();
            if (!selectedClients.length) return;

            allClients = that.includeNonPlayers.checked;
            recipients = [];
            selectedClients.forEach((id) => {
                if (allClients || cl.clientMap[id].clientType === 'player') {
                    recipients.push(id);
                    if (!title) title = cl.roomName + ': ' + id;
                    else title += ', ' + id;
                }
            });
            if (!recipients.length) return;
            
            // Creates a diplay title (might be same as title).
            if (title.length > 40) {
                visibleTitle = cl.roomName + ': ' + recipients.length +
                    ' participant';
                if (recipients.length > 1) visibleTitle += 's';
            }
            else {
                visibleTitle = title;
            }

            // Read msg.
            msg = that.readInitialMsg();

            // Open a chat window locally.
            
            if (that.chats[title]) {
                chatEvent = that.chats[title].chatEvent;
            }
            else {
                chatEvent = 'CHAT_' + Math.floor(Math.random() * 10000000);
                opts = {
                    chatEvent: chatEvent,
                    participants: recipients,
                    title: visibleTitle,
                    collapsible: true,
                    closable: true,
                    docked: true
                };
                if (msg) opts.initialMsg = { msg: msg };

                // Register the new Chat widget.
                that.chats[title] =
                    node.widgets.append('Chat', that.bodyDiv, opts);
                that.chats[title].on('destroyed', function() {
                    that.chats[title] = null;
                });
            }

            // Open a chat window remotely.
            
            opts = {
                chatEvent: chatEvent,
                participants: [
                    {
                        recipient: 'MONITOR',
                        sender: node.game.channelInUse,
                        name: 'Monitor'
                    }
                ],
                collapsible: true,
                closable: true,
                docked: true,
                title: 'Chat with Monitor'
            };
            // Add initialMsg.
            if (msg) opts.initialMsg = { id: node.game.channelInUse, msg: msg };
            // Send.
            node.remoteSetup('widgets', recipients, { append: {
                Chat: opts
            }});
        };

        // Make the buttons.

        var btnGroup = document.createElement('div');
        btnGroup.role = 'group';
        btnGroup['aria-label'] = 'Chat Buttons';
        btnGroup.className = 'btn-group';

        var btnGroupModes = document.createElement('div');
        btnGroupModes.role = 'group';
        btnGroupModes['aria-label'] = 'Select mode';
        btnGroupModes.className = 'btn-group';

        var btnMode = document.createElement('button');
        btnMode.className = 'btn btn-secondary dropdown-toggle';
        btnMode['data-toggle'] = 'dropdown';
        btnMode['aria-haspopup'] = 'true';
        btnMode['aria-expanded'] = 'false';
        btnMode.innerHTML = Chatter.modes[0].name + ' ';

        var span = document.createElement('span');
        span.className = 'caret';

        btnMode.appendChild(span);

        var li, a, i, tmp;
        var ul = document.createElement('ul');
        ul.className = 'dropdown-menu';
        ul.style = 'text-align: left';

        for (i = 0; i < Chatter.modes.length; i++) {
            tmp = Chatter.modes[i];
            li = document.createElement('li');
            li.id = tmp.id;
            a = document.createElement('a');
            a.href = '#';
            a.innerHTML = '<strong>' + tmp.name + '</strong>: ' +
                tmp.description;
            li.appendChild(a);
            ul.appendChild(li);
        }

        // Append
        btnGroupModes.appendChild(btnMode);
        btnGroupModes.appendChild(ul);

        btnGroup.appendChild(this.chatButton);
        btnGroup.appendChild(btnGroupModes);

        this.bodyDiv.appendChild(btnGroup);

        // TODO: Do we need this? We are actually including the .js files.
        // Variable toggled controls if the dropdown menu
        // is displayed (we are not using bootstrap js files)
        // and we redo the job manually here.
        var toggled = false;
        btnMode.onclick = function() {
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
            var id;
            ul.style = 'display: none';
            id = eventData.target.parentNode.id;
            if (!id) id = eventData.target.parentNode.parentNode.id;
            btnMode.innerHTML = Chatter.modesIdx[id].name + ' ';
            btnMode.appendChild(span);
            that.chatMode = id;
            toggled = false;
        };

        W.add('hr', this.bodyDiv);

        // Options.

        label = W.get('label');
        this.eraseInitialMsg = W.add('input', label, {
            type: 'checkbox',
            className: 'monitor-checkbox'
        });
        label.appendChild(document.createTextNode(' Erase initial msg'));
        this.bodyDiv.appendChild(label);

        this.bodyDiv.appendChild(document.createElement('br'));

        label = W.get('label');
        this.includeNonPlayers = W.add('input', label, {
            type: 'checkbox',
            className: 'monitor-checkbox'
        });
        label.appendChild(document.createTextNode(' Include non-players'));
        this.bodyDiv.appendChild(label);
    };

    Chatter.prototype.readInitialMsg = function() {
        var txt;
        txt = this.initialMsg.value;
        if (this.eraseInitialMsg.checked) this.initialMsg.value = '';
        return txt.trim();
    };
    
})(node);

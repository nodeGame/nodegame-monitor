/**
 * # Chatter widget for nodeGame
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

    node.widgets.register('Chatter', Chatter);

    var JSUS = node.JSUS;

    // ## Meta-data

    Chatter.version = '0.1.0';
    Chatter.description = 'Manage chats with the clients.';

    Chatter.title = 'Chat';
    Chatter.className = 'chat';

    // ## Dependencies
    Chatter.dependencies = {
        JSUS: {}
    };

    function Chatter(options) {
        
        // Reference to the button to start a new chat.
        this.chatButton = null;

        // Checkbox to include bots, etc.
        this.includeNonPlayers = null;
        
        // List of open chats.
        this.chats = {};
    }

    Chatter.prototype.append = function() {
        var cl, that, label;
        that = this;

        cl = node.game.clientList;
        this.chatButton = document.createElement('button');
        this.chatButton.className = 'btn';
        this.chatButton.innerHTML = 'Chat';

        // On click.
        this.chatButton.onclick = function() {
            var chatEvent, allClients;
            var title, selectedClients, recipients;

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
            
            if (that.chats[title]) {
                chatEvent = that.chats[title].chatEvent;
            }
            else {
                chatEvent = 'CHAT_' + Math.floor(Math.random() * 10000000);
                that.chats[title] =
                    // was
                    // node.widgets.append('Chat', commandPanelBody, {
                    node.widgets.append('Chat', that.bodyDiv, {
                        chatEvent: chatEvent,
                        participants: recipients,
                        title: title,
                        collapsible: true,
                        closable: true
                    });
            }
            node.remoteSetup('widgets', recipients, {
                append: {
                    Chat: {
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
                        title: 'Chat with Monitor'
                        // TODO: not used for now, because
                        // it registers listeners locally
                        // and at the next step they are killed.
                        // root: function() {
                        //     return document.body;
                        // }
                    }
                }
            });
        };

        // Checkbox
        label = W.get('label');
        this.includeNonPlayers = W.add('input', label, {
            type: 'checkbox',
            className: 'chat-checkbox'
        });
        label.appendChild(document.createTextNode('non-players'));
        

        // Append.
        this.bodyDiv.appendChild(this.chatButton);
        this.bodyDiv.appendChild(label);
        this.bodyDiv.appendChild(document.createElement('hr'));
    };


})(node);

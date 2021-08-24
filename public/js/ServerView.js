/**
 * # ServerView widget for nodeGame
 * Copyright(c) 2021 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * Shows information about server and its submodules
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('ServerView', ServerView);

    // ## Meta-data

    ServerView.version = '0.1.1';
    ServerView.description = 'Shows information about server and its submodules';

    ServerView.title = 'Server Info';
    ServerView.className = 'serverview';

    // ## Dependencies
    ServerView.dependencies = {
        JSUS: {}
    };

    function ServerView(options) {
        this.links = document.createElement('div');
    }

    ServerView.prototype.append = function() {
        this.bodyDiv.appendChild(this.links);
        // Query server:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: 'VERSIONS' }
        }));
    };

    ServerView.prototype.listeners = function() {
        var that;
        that = this;
        // Listen for server reply:
        node.on.data('INFO_VERSIONS', function(msg) {
            that.displayVersionsData(msg.data);
        });
    };

    ServerView.prototype.displayVersionsData = function(versions) {
        var m, ul, vm;
        ul = document.createElement('ul');
        ul.className = 'version-module-list';
        ul.appendChild(createVersionLi('NodeGame', versions.nodegame));
        ul.appendChild(createVersionLi('server', versions.server, true));
        vm = versions.modules;
        for (m in vm) {
            if (vm.hasOwnProperty(m) &&
                m !== 'express' && m!== 'socketio' &&
                m !== 'JSUS' && m !== 'NDDB') {

                ul.appendChild(createVersionLi(m, vm[m]));
            }
        }
        ul.appendChild(createVersionLi('NDDB', vm.NDDB, true));
        ul.appendChild(createVersionLi('JSUS', vm.JSUS));
        ul.appendChild(createVersionLi('express', vm.express, true));
        ul.appendChild(createVersionLi('socket.io', vm.socketio));

        this.links.appendChild(ul);
        // this.links.appendChild(document.createElement('hr'));
    };

    // ## Helper functions.

    /**
     * ### createVersionLi
     *
     * Creates a <LI> tag with info about module and version
     *
     * @param {string} m The name of the module
     * @param {string} v The versio of the module
     * @param {boolean} n TRUE, if the LI is a new category (adds extra space)
     *
     * @return {HTMLElement} li The create <LI>
     */
    function createVersionLi(m, v, n) {
        var li, span;
        li = document.createElement('li');
        span = document.createElement('span');
        span.className = 'version-module';
        if (n) span.style['margin-top'] = '12px';
        span.innerHTML = m;
        li.appendChild(span);

        let link = 'https://';
        if (m === 'express') {
            link += 'expressjs.com'
        }
        else if (m === 'socket.io') {
            link += m;
        }
        else {
            let ar = ['NDDB', 'JSUS', 'NodeGame'];
            link += 'github.com/nodegame/';
            if (!~ar.indexOf(m)) link += 'nodegame-';
            if (m === 'gameTemplate') link += 'game-template';
            else link += m.toLowerCase();
        }
        let a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.innerHTML = v;
        li.appendChild(document.createTextNode(': '));
        li.appendChild(a);
        return li;
    }

})(node);

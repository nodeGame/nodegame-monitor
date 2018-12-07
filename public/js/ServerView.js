/**
 * # ServerView widget for nodeGame
 * Copyright(c) 2018 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * Shows files available in log/ dir.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('ServerView', ServerView);

    var JSUS = node.JSUS;

    // ## Meta-data

    ServerView.version = '0.1.0';
    ServerView.description = 'Displays the log files in the log/ folder.';

    ServerView.title = 'Server Info';
    ServerView.className = 'serverView';

    // ## Dependencies
    ServerView.dependencies = {
        JSUS: {}
    };

    function ServerView(options) {
        this.links = document.createElement('div');
    }

    ServerView.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: 'LOGS' }
        }));

    };

    ServerView.prototype.append = function() {
        this.bodyDiv.appendChild(this.links);
        // Query server:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: { type: 'VERSIONS' }
        }));
        this.refresh();
    };

    ServerView.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_LOGS', function(msg) {
            that.displayLogsData(msg.data);
        });

        // Listen for server reply:
        node.on.data('INFO_VERSIONS', function(msg) {
            that.displayVersionsData(msg.data);
        });
    };

    ServerView.prototype.displayVersionsData = function(versions) {
        var m, ul, vm;
        ul = document.createElement(ul);
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
        this.links.appendChild(document.createElement('hr'));
    };

    ServerView.prototype.displayLogsData = function(files) {
        var i, element, prefixLink, title;
        prefixLink = window.location.origin;
        prefixLink += W.uriChannel ? W.uriChannel : '/';
        prefixLink += 'monitor/servernode/logs/';
        title = document.createElement('p');
        title.innerHTML = '<strong>Log Files:</strong>';
        this.links.appendChild(title);
        for (i = 0; i < files.length; ++i) {
            element = document.createElement('a');
            element.setAttribute('target', '_blank');
            element.href = prefixLink + files[i];
            element.innerHTML = files[i];
            this.links.appendChild(element);
            this.links.appendChild(document.createElement('br'));
        }
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
        li.appendChild(document.createTextNode(': ' + v));
        return li;
    }

})(node);

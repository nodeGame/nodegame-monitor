/**
 * # Exporter widget for nodeGame
 * Copyright(c) 2021 Stefano Balietti
 * MIT Licensed
 *
 * Manage chats with clients.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('Exporter', Exporter);

    const Table = W.Table;

    // ## Meta-data

    Exporter.version = '0.3.0';
    Exporter.description = 'Exports data and logs';

    Exporter.title = 'Export Data/Logs <em>(Experimental)</em>';
    Exporter.className = 'exporter';

    // ## Dependencies
    Exporter.dependencies = {};

    function Exporter() {

        this.selectStr = 'Select a game';

        this.inProgress = null;
    }

    Exporter.prototype.append = function() {

        this.panelDiv.classList.add('h-100');

        let radioGroup = `
<div class="btn-group" role="group" aria-label="Log or Data Group">
  <input type="radio" class="btn-check" name="radio-export" id="radio-export-data" autocomplete="off" checked>
  <label class="btn btn-outline-primary" for="radio-export-data">Data</label>

  <input type="radio" class="btn-check" name="radio-export" id="radio-export-logs" autocomplete="off">
  <label class="btn btn-outline-primary" for="radio-export-logs">Logs</label>
</div>

<div class="btn-group" role="group" aria-label="Export Group"></div>
`;

        // Containers for buttons..
        let div = W.add('div', this.bodyDiv, {
            style: { margin: '10px 0 15px 0' },
            className: 'btn-toolbar justify-content-between',
            innerHTML: radioGroup
        });

        this.logsBtn = this.bodyDiv.querySelector('#radio-export-logs');
        this.logsBtn.addEventListener('click', () => {
            if (this.inProgress) return;
            this.expBtn.disabled = false;
        });
        this.dataBtn = this.bodyDiv.querySelector('#radio-export-data');
        this.dataBtn.addEventListener('click', () => {
            if (this.dropdownBtn.innerHTML === this.selectStr) {
                this.expBtn.disabled = true;
            }
        });

        let btnGroup = div.querySelectorAll('.btn-group')[1];

        // Show 'Send' button.
        let btnGroupDropdown = W.add('div', btnGroup, {
            className: 'btn-group',
            role: 'group'
        });

        this.dropdownBtn = W.add('button', btnGroupDropdown, {
            className: 'btn btn-outline-dark dropdown-toggle',
            type: 'button',
            'data-bs-toggle': 'dropdown',
            'aria-expanded': false,
            innerHTML: this.selectStr,
            // id: 'exporter-game-btn'
        });

        // Show 'Send' button.
        this.gameSelector = W.add('ul', btnGroupDropdown, {
            className: 'dropdown-menu',
            // 'aria-labelled-by': 'exporter-game-btn'
        });

        this.gameSelector.onclick = (e) => {
            let game = e.target.innerHTML;
            this.dropdownBtn.innerHTML = game;
            let noGame = game === this.selectStr;
            this.gameSelected = noGame ? null : game;
            if (!this.logsBtn.checked) this.expBtn.disabled = noGame;
        };

        populateGameSel(this);

        // Show 'Send' button.
        this.expBtn = W.add('button', btnGroup, {
            className: 'btn btn-primary',
            innerHTML: 'Export',
            disabled: true
        });

        this.expBtn.onclick = () => {
            this.expBtn.disabled = true;
            this.expBtn.innerHTML = 'In progress';

            this.inProgress = setTimeout(() => {
                this.expBtn.disabled = false;
                this.expBtn.innerHTML = 'Export';
                this.inProgress = null;
            }, 15000);

            let rnd = J.randomInt(1000000000);
            node.once.data('exported', (msg) => {
                if (msg.data.idx !== rnd) return;
                node.game.alert('Export completed.');
                this.expBtn.disabled = false;
                this.expBtn.innerHTML = 'Export';
                clearTimeout(this.inProgress);
                this.inProgress = null;
            });


            let type = this.logsBtn.checked ? 'LOGS' : 'DATA';

            let msg = {
                target: 'SERVERCOMMAND',
                text: 'EXPORT',
                data: {
                    type: type,
                    idx: rnd,
                    options: textarea.value
                }
            };
            if (this.gameSelected) msg.data.game = this.gameSelected;

            msg = node.msg.create(msg);
            if (msg) node.socket.send(msg);
        };

        // Show a button that expands the table of advanced fields.
        let textarea = W.add('textarea', this.bodyDiv, {
            placeholder: 'options, e.g, --out-format csv'
        });

    };


    Exporter.prototype.listeners = function() {

        node.on('CHANNEL_SELECTED', () => populateGameSel(this) );
    };


    const populateGameSel = that => {
        let gameSel = that.gameSelector;
        gameSel.innerHTML = '';

        W.add('li', gameSel, {
            innerHTML: that.selectStr,
            class: 'dropdown-item'
        });
        W.add('li', gameSel, {
            innerHTML: '<hr class="dropdown-divider">'
        });

        let chanInUse = node.game.channelInUse;
        if (chanInUse) {
            W.add('li', gameSel, {
                innerHTML: chanInUse,
                class: 'dropdown-item'
            });
            W.add('li', gameSel, {
                innerHTML: '<hr class="dropdown-divider">'
            });
        }

        for (let g in node.game.gamesInfo) {
            if (node.game.gamesInfo.hasOwnProperty(g) && g !== chanInUse) {
                W.add('li', gameSel, {
                    innerHTML: g,
                    class: 'dropdown-item'
                });
            }
        }
    }

})(node);

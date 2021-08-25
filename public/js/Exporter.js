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

    Exporter.version = '0.2.0';
    Exporter.description = 'Exports data and logs';

    Exporter.title = 'Export Data/Logs <em>(Experimental)</em>';
    Exporter.className = 'exporter';

    // ## Dependencies
    Exporter.dependencies = {
        Table: {}
    };

    function Exporter(options) {
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

        // Show 'Send' button.
        let expBtn = W.add('button', div.querySelectorAll('.btn-group')[1], {
            className: 'btn btn-primary',
            innerHTML: 'Export'
        });

        expBtn.onclick = () => {
            expBtn.disabled = true;
            expBtn.innerHTML = 'In progress';
            let rnd = J.randomInt(1000000000);
            node.once.data('exported', (msg) => {
                if (msg.data.idx !== rnd) return;
                node.game.alert('Export completed.');
                expBtn.disabled = false;
                expBtn.innerHTML = 'Export';
            });

            setTimeout(() => {
                expBtn.disabled = false;
                expBtn.innerHTML = 'Export';
            }, 10000);

            let radio = this.bodyDiv.querySelector('#radio-export-logs');
            let type = radio.checked ? 'LOGS' : 'DATA';

            let msg = {
                target: 'SERVERCOMMAND',
                text: 'EXPORT',
                data: {
                    type: type,
                    idx: rnd,
                    options: textarea.value
                }
            };

            msg = node.msg.create(msg);
            if (msg) node.socket.send(msg);
        };

        // Show a button that expands the table of advanced fields.
        let textarea = W.add('textarea', this.bodyDiv, {
            placeholder: 'options, e.g, --out-format csv'
        });

    };

})(node);

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

    Exporter.title = 'Export Data/Logs';
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
  <input type="radio" class="btn-check" name="radio-export" id="radio-export1" autocomplete="off" checked>
  <label class="btn btn-outline-primary" for="radio-export1">Data</label>

  <input type="radio" class="btn-check" name="radio-export" id="radio-export2" autocomplete="off">
  <label class="btn btn-outline-primary" for="radio-export2">Logs</label>
</div>

<div class="btn-group" role="group" aria-label="Export Group">
 </div>
`;
        // Containers for buttons..
        let div = W.add('div', this.bodyDiv, {
            style: { margin: '10px 0 15px 0' },
            className: 'btn-toolbar justify-content-between',
            innerHTML: radioGroup
        });

        // Show 'Send' button.
        W.add('button', div.querySelectorAll('.btn-group')[1], {
            className: 'btn btn-primary',
            innerHTML: 'Export'
        })
        .onclick = () => {

            let radio = this.bodyDiv.querySelector('.btn-group');

            debugger;
            return;
            // let msg = parseFunction();
            let msg = {
                target: 'SERVERCOMMAND',
                text: 'EXPORT',
                data: { type: 'DATA' }
            };
            msg = node.msg.create(msg);
            if (msg) node.socket.send(msg);
        };

        // Show a button that expands the table of advanced fields.
        W.add('textarea', this.bodyDiv, {
            placeholder: 'options, e.g, --out-format csv'
        });

    };

})(node);

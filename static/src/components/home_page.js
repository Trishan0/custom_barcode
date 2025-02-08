/** @odoo-module **/
import { Component, useState, onMounted, onWillDestroy } from "@odoo/owl";
import { registry } from "@web/core/registry";

export class HomePage extends Component {
    setup() {
        this.state = useState({});

    }
    // function for open the barcode scanner
    triggerScanner() {
        const action = this.env.services.action;
        action.doAction({
            type: 'ir.actions.client',
            tag: 'custom_barcode.action_barcode_js',
            target: 'current',
        });
    }
    //function for back button always redirect to the menu
    goBackMenu() {
        window.history.back();
    }
}
        // Function to go back to the previous page
HomePage.template = 'custom_barcode.Home';
registry.category("actions").add("custom_barcode.action_barcode_home_js", HomePage);
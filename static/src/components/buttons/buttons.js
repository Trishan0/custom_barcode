/** @odoo-module **/
import {Component, useState, onMounted, onWillDestroy} from "@odoo/owl";
import {registry} from "@web/core/registry";

export class ActionButtons extends Component {
    setup() {
        this.scannedBarcode = this.props.action.params.scannedBarcode;
    }

    // Open the Inventory
    async checkInventoryRecord() {
        await this.checkInventoryRecordLogic(this.scannedBarcode);
    }

    async checkInventoryRecordLogic(scanned_barcode) {
        const actionService = this.env.services.action;
        const orm = this.env.services.orm;

        try {
            // Search for the inventory record by barcode
            const inventoryRecords = await orm.call(
                'vch.location.inventory',
                'search_read',
                [[['barcode', '=', scanned_barcode]], ['id']]
            );

            if (inventoryRecords.length > 0) {
                // Open the list/form view with the filtered domain
                await actionService.doAction({
                    type: "ir.actions.act_window",
                    name: "Inventory",
                    res_model: "vch.location.inventory",
                    views: [[false, "list"], [false, "form"]],
                    view_mode: "list,form",
                    target: "current",
                    domain: [["barcode", "=", scanned_barcode]],
                });
            } else {
                // Notify if no record is found
                this.env.services.notification.add('No matching inventory record found.', {
                    type: 'warning',
                });
            }
        } catch (error) {
            console.error('Error in checkInventoryRecord:', error);
            this.env.services.notification.add('An error occurred while searching for the inventory record.', {
                type: 'danger',
            });
        }
    }

    //Open the Transfers new form
    async createNewTransferRecord() {
        await this.createNewTransferRecordLogic(this.scannedBarcode);
    }

    async createNewTransferRecordLogic(scanned_barcode) {
        const orm = this.env.services.orm;
        const actionService = this.env.services.action;

        try {
            // Search for the inventory record by barcode
            const inventoryRecords = await orm.call(
                'vch.main.inventory', // Model to query
                'search_read', // Method to use
                [[['barcode', '=', scanned_barcode]], ['id']] // Domain and fields to read
            );

            if (inventoryRecords.length > 0) {
                const inventoryId = inventoryRecords[0].id; // Get the ID of the first matching record

                // Open the transfer form view for the found inventory record
                await actionService.doAction({
                    type: "ir.actions.act_window",
                    name: "Transfer",
                    res_model: "vch.internal.transfers",
                    views: [[false, 'form']], // Open in form view
                    view_mode: "form",
                    target: "current",
                    context: {
                        default_item_ids: inventoryId, // Pass the inventory record ID as default context
                    },
                });
            } else {
                // Notify the user if no inventory record is found
                this.env.services.notification.add('No matching inventory record found.', {
                    type: 'warning',
                });
            }
        } catch (error) {
            console.error('Error in createNewTransferRecord:', error);
            this.env.services.notification.add('An error occurred while opening the transfer record.', {
                type: 'danger',
            });
        }
    }
//Open the Transfers new form
    async createNewPickingRecord() {
        await this.createNewPickingRecordLogic(this.scannedBarcode);
    }

    async createNewPickingRecordLogic(scanned_barcode) {
        const orm = this.env.services.orm;
        const actionService = this.env.services.action;

        try {
            // Search for the inventory record by barcode
            const inventoryRecords = await orm.call(
                'vch.main.inventory', // Model to query
                'search_read', // Method to use
                [[['barcode', '=', scanned_barcode]], ['id']] // Domain and fields to read
            );

            if (inventoryRecords.length > 0) {
                const inventoryId = inventoryRecords[0].id; // Get the ID of the first matching record

                // Open the transfer form view for the found inventory record
                await actionService.doAction({
                    type: "ir.actions.act_window",
                    name: "Transfer",
                    res_model: "vch.picking.history",
                    views: [[false, 'form']], // Open in form view
                    view_mode: "form",
                    target: "current",
                    context: {
                        default_barcode: inventoryId, // Pass the inventory record ID as default context
                    },
                });
            } else {
                // Notify the user if no inventory record is found
                this.env.services.notification.add('No matching inventory record found.', {
                    type: 'warning',
                });
            }
        } catch (error) {
            console.error('Error in createNewTransferRecord:', error);
            this.env.services.notification.add('An error occurred while opening the transfer record.', {
                type: 'danger',
            });
        }
    }

    // Open the Stock List view
    async searchProductStock() {
        await this.searchProductStockLogic(this.scannedBarcode);
    }

    async searchProductStockLogic(scanned_barcode) {
        const orm = this.env.services.orm;
        const actionService = this.env.services.action;

        try {
            const inventoryRecords = await orm.call(
                'vch.custom.inventory', // Model to query
                'search_read', // Method to use
                [[['barcode', '=', scanned_barcode]], ['id']] // Domain and fields to read
            );
            if (inventoryRecords.length > 0) {
                const inventoryId = inventoryRecords[0].id; // Get the ID of the first matching record
                // Open the product stock view with the filtered domain
                await actionService.doAction({
                    type: "ir.actions.act_window",
                    name: "Stock",
                    res_model: "vch.summary",
                    views: [[false, "list"], [false, "form"]],
                    view_mode: "list,form",
                    target: "current",
                    domain: [["item_ids", "=", inventoryId]],
                });
            } else {
                // Notify the user if no inventory record is found
                this.env.services.notification.add('No matching inventory record found.', {
                    type: 'warning',
                })
            }
        } catch (error) {
            console.error('Error in searchProductStock:', error);
            this.env.services.notification.add('An error occurred while searching for the product stock.', {
                type: 'danger',
            });
        }
    }

    // Open the Additional Barcode new form
    async createNewAdditionalBarcode() {
        await this.createNewAdditionalBarcodeLogic(this.scannedBarcode);
    }

    async createNewAdditionalBarcodeLogic(scanned_barcode) {
        const actionService = this.env.services.action;

        try {
            // Open the transaction form view
            await actionService.doAction({
                type: "ir.actions.act_window",
                name: "Additional Barcodes",
                res_model: "vch.multiple_barcodes",
                views: [[false, 'form']],
                view_mode: "form",
                target: "current",
                context: {
                    default_barcode_number: scanned_barcode,
                    create: true,
                    form_view_ref: false,
                    form_view_initial_mode: 'edit',
                },
            });
        } catch (error) {
            console.error('Error in createNewAdditionalBarcode:', error);
            this.env.services.notification.add('An error occurred while opening the Additional Barcode Form.', {
                type: 'danger',
            });
        }
    }
}

ActionButtons.template = 'custom_barcode.Buttons';
registry.category("actions").add("custom_barcode.action_barcode_button_js", ActionButtons);
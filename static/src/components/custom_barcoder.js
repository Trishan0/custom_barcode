/** @odoo-module **/
import {Component, useState, onMounted, onWillDestroy, useRef} from "@odoo/owl";
import {registry} from "@web/core/registry";

const custom_barcode = {action_barcode_js: 'custom_barcode.action_barcode_js'};

// Constants for configuration
const SCANNER_CONFIG = {
    FPS: 5,                    // Reduced FPS for better performance
    MIN_QR_BOX_SIZE: 150,      // Minimum QR box size
    ASPECT_RATIO: 1.777778,    // 16:9 aspect ratio
    ERROR_LOG_INTERVAL: 2000,  // Throttle error logging to every 2 seconds
    SCAN_THROTTLE: 1000,       // Prevent multiple scans of same code within 1 second
    QR_BOX_RATIO: 0.7         // QR box will be 70% of the smaller dimension
};

export class CustomBarcodeScan extends Component {
    let
    existingBarcode;
    setup() {
        this.state = useState({
            orm_data: [],
            input_code: "",
            isScanning: false,
            scanResult: "No scan yet",
            isProcessing: false,
            cameras: [],        // Keep this for the template
            selectedCamera: ""  // Keep this for the template
        });

        // Initialize necessary class properties
        this.html5QrCode = null;
        this.lastErrorLog = 0;
        this.lastScanTime = 0;
        this.lastScannedCode = null;
        this.readerElement = useRef('reader');

        onMounted(async () => {
            // Hide the main navbar
            // const navbar = document.querySelector(".o_main_navbar");
            // if (navbar) {
            //     navbar.style.display = "none";
            // }
            if (!window.Html5Qrcode) {
                console.error("Html5Qrcode is not loaded. Check the script inclusion.");
                return;
            }

            await this.initializeCamera();
        });

        onWillDestroy(() => {
            this.cleanup();
        });
    }

    // New method to handle camera initialization with back camera preference
    async initializeCamera() {
        try {
            const devices = await Html5Qrcode.getCameras();
            this.state.cameras = devices || []; // Update cameras state for template

            if (devices?.length) {
                // Try to find back camera
                const backCamera = devices.find(camera =>
                    camera.label.toLowerCase().includes('back') ||
                    camera.label.toLowerCase().includes('rear') ||
                    camera.label.toLowerCase().includes('environment')
                );

                // Configuration for camera
                const cameraConfig = backCamera
                    ? {deviceId: {exact: backCamera.id}}
                    : {facingMode: "environment"};

                this.state.selectedCamera = backCamera?.id || "environment"; // Update selected camera state
                await this.startScanner(cameraConfig);
            } else {
                throw new Error("No cameras found");
            }
        } catch (err) {
            console.error("Camera initialization error:", err);
            this.handleError("Failed to initialize camera");
        }
    }

    handleError(message, error = null) {
        this.state.scanResult = `Error: ${message}`;
        if (error) console.error(message, error);
    }

    async cleanup() {
        try {
            await this.stopScanner();
            this.html5QrCode = null;
            this.state.isScanning = false;
            this.state.isProcessing = false;
        } catch (error) {
            this.handleError("Cleanup failed", error);
        }
    }

async SearchRecords() {
    if (this.state.isProcessing) return;

    const code = this.state.input_code.trim();
    if (!code) return;

    try {
        this.state.isProcessing = true;

        // Throttle check
        const now = Date.now();
        if (code === this.lastScannedCode &&
            now - this.lastScanTime < SCANNER_CONFIG.SCAN_THROTTLE) {
            return;
        }
        this.lastScannedCode = code;
        this.lastScanTime = now;

        // Search in both models
        const [multipleBarcodesRecords, inventoryRecords] = await Promise.all([
            this.env.services.orm.call(
                'vch.multiple_barcodes',
                'search_read',
                [[['barcode_number', '=', code]], ['id', 'barcode_rec_id']]
            ),
            this.env.services.orm.call(
                'vch.location.inventory',
                'search_read',
                [[['barcode', '=', code]], ['id']]
            )
        ]);

        // Determine the inventory record to display and the scannedBarcode value
        let inventoryId = null;
        let scannedBarcodeValue = code; // Default to the scanned code

        if (inventoryRecords.length > 0) {
            inventoryId = inventoryRecords[0].id;
            scannedBarcodeValue = code; // Keep the scanned code for inventory records
        } else if (multipleBarcodesRecords.length > 0) {

            inventoryId = multipleBarcodesRecords[0].barcode_rec_id[1]; //passing the main barcode value
            scannedBarcodeValue = inventoryId;
        }

        const recordFound = multipleBarcodesRecords.length > 0 || inventoryRecords.length > 0;

        const actionButtonView = {
            type: 'ir.actions.client',
            tag: 'custom_barcode.action_barcode_button_js',
            target: 'current',
            params: { scannedBarcode: scannedBarcodeValue , recordFound: recordFound}, // Use the determined scannedBarcodeValue

        }

        await this.env.services.action.doAction(actionButtonView);
    } catch (error) {
        this.handleError("Search operation failed", error);
        await this.stopScanner();
    } finally {
        this.state.isProcessing = false;
    }
}

    async startScanner(cameraConfig = {facingMode: "environment"}) {
        if (this.html5QrCode?.isScanning) return;

        try {
            this.html5QrCode = new Html5Qrcode("reader");

            const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
                const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
                const boxSize = Math.floor(minDimension * SCANNER_CONFIG.QR_BOX_RATIO);
                return {
                    width: Math.max(boxSize, SCANNER_CONFIG.MIN_QR_BOX_SIZE),
                    height: Math.max(boxSize, SCANNER_CONFIG.MIN_QR_BOX_SIZE)
                };
            };

            const config = {
                fps: SCANNER_CONFIG.FPS,
                qrbox: qrboxFunction,
                aspectRatio: SCANNER_CONFIG.ASPECT_RATIO,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                },
            };

            await this.html5QrCode.start(
                cameraConfig,
                config,
                async (decodedText) => {
                    this.state.scanResult = decodedText;
                    this.state.input_code = decodedText;
                    await this.SearchRecords();
                },
                (errorMessage) => {
                    const now = Date.now();
                    if (now - this.lastErrorLog >= SCANNER_CONFIG.ERROR_LOG_INTERVAL) {
                        this.lastErrorLog = now;
                    }
                }
            );

            this.state.isScanning = true;
        } catch (err) {
            this.handleError("Scanner initialization failed", err);
        }
    }

    async stopScanner() {
        if (this.html5QrCode?.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.state.isScanning = false;
                this.state.scanResult = "Scanner stopped";
            } catch (error) {
                this.handleError("Failed to stop scanner", error);
            }
        }
    }

    goBack() {
        window.history.back();
    }
}

CustomBarcodeScan.template = 'custom_barcode.CustomBarcodeScanner';
registry.category('actions').add(custom_barcode.action_barcode_js, CustomBarcodeScan);
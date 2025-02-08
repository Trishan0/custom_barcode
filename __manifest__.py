{
    # Module information
    'name': 'Barcode',
    'version': '17.0.1.0.1',
    'category': 'Extra Tools',
    'license': 'LGPL-3',
    'summary': """
        Barcode Module for add & track products by scanning barcodes
    """,


    # Dependancies
    'depends': ['web', 'base'],

    # Views
    'data': [
        "views/models.xml",

    ],

    'assets': {
        'web.assets_backend': [
            'custom_barcode/static/src/components/*.js',
            'custom_barcode/static/src/components/*.xml',
            'custom_barcode/static/src/components/*.scss',
            'custom_barcode/static/src/components/buttons/*.js',
            'custom_barcode/static/src/components/buttons/*.xml',
            'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
            'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css',
            'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'

        ],
    },

    # Technical
    'installable': True,
    'auto_install': False,
}
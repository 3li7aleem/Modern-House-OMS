import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil, formatTime as formatTimeUtil } from '../lib/utils';

// --- Embedded Translations ---
const enTranslations = {
    "sidebar": {
        "title": "Modern House for Trading",
        "nav": {
            "dashboard": "Dashboard",
            "pos": "Point of Sale",
            "orders": "Orders",
            "inventory": "Inventory",
            "finance": "Finance",
            "customers": "Customers",
            "marketing": "WhatsApp Marketing",
            "suppliers": "Suppliers",
            "delivery": "Delivery",
            "users": "User Management",
            "purchaseOrders": "Purchase Orders",
            "requests": "Requests",
            "quotations": "Quotations",
            "contracts": "Kitchen Contracts",
            "maintenance": "Fix & Maintenance",
            "website": "Website",
            "reports": "Reports",
            "settings": "Settings"
        }
    },
    "quotations": {
        "title": "Price Quotations",
        "subtitle": "Create, track, and convert formal commercial price offers",
        "new_quotation": "+ New Quotation",
        "total_quotations": "Total Quotations",
        "pending_offers": "Pending / Sent",
        "accepted_offers": "Accepted",
        "total_value": "Quoted Value",
        "conversion_rate": "Conversion Rate",
        "table": {
            "quote_no": "Quote #",
            "customer": "Customer",
            "date": "Issue Date",
            "valid_until": "Valid Until",
            "items_count": "Items",
            "total": "Total Amount",
            "status": "Status",
            "actions": "Actions"
        },
        "status": {
            "Draft": "Draft",
            "Sent": "Sent to Client",
            "Accepted": "Accepted",
            "Rejected": "Rejected",
            "Expired": "Expired",
            "Converted": "Converted to Order"
        },
        "convert_to_order": "Convert to Sales Order",
        "convert_confirm": "Are you sure you want to convert this quotation into an active sales order?",
        "convert_success": "Quotation converted to sales order successfully!",
        "send_whatsapp": "Send via WhatsApp",
        "print_quote": "Print / Export PDF",
        "duplicate_quote": "Duplicate",
        "edit_quote": "Edit Quotation",
        "delete_quote": "Delete Quotation",
        "delete_confirm": "Are you sure you want to delete this quotation?",
        "filter_all": "All Statuses",
        "search_placeholder": "Search by quote #, client, phone, or product...",
        "no_quotations": "No price quotations found."
    },
    "contracts": {
        "title": "Kitchen Contracts & Milestones",
        "subtitle": "Track kitchen custom contracts, milestone installments, and WhatsApp payment notifications",
        "new_contract": "+ New Kitchen Contract",
        "total_contracts": "Total Contracts",
        "active_contracts": "Active / In Progress",
        "collected_amount": "Collected Amount",
        "remaining_amount": "Pending Balance"
    },
    "reports": {
        "title": "Sales Reports",
        "daily": "Daily Summary",
        "monthly": "Monthly Summary",
        "yearly": "Yearly Summary",
        "top_products": "Top Selling Products",
        "employee_performance": "Employee Performance",
        "avg_sales": "Avg. Sales per Employee",
        "export_csv": "Export CSV",
        "total_revenue": "Total Revenue",
        "total_orders": "Total Orders",
        "total_items": "Items Sold",
        "top_performing_employee": "Top Performing Employee",
        "employee": "Employee",
        "orders_count": "Orders",
        "average": "Average",
        "product": "Product",
        "quantity": "Quantity",
        "sales": "Sales"
    },
    "header": {
        "search_placeholder": "Search globally (orders, products, customers)...",
        "notifications": {
            "title": "Notifications",
            "new_order": "New order #{{orderNumber}} has been created for {{customerName}}.",
            "low_stock_item": "{{name}} is low on stock ({{stock}} left).",
            "new_delivery_request": "New delivery request for order #{{orderNumber}} for customer {{customerName}}.",
            "new_website_request": "New website request from {{customerName}}.",
            "no_notifications": "No new notifications"
        },
        "view_website": "View Website",
        "sign_in": "Sign In",
        "return_to_oms": "Return to OMS"
    },
    "dashboard": {
        "title": "Dashboard",
        "cards": {
            "total_sales": "Total Revenue",
            "avg_sale_value": "Avg. Order Value",
            "low_stock_items": "Low Stock Items",
            "total_customers": "Total Customers",
            "net_profit": "Net Profit",
            "gross_profit_sales": "Gross Profit (Orders)",
            "total_expenses": "Total Expenses",
            "pending_deliveries": "Pending Deliveries",
            "total_purchase_orders": "Total Purchase Orders"
        },
        "weekly_sales_trend": "Weekly Revenue Trend",
        "recent_sales": "Recent Orders",
        "todays_deliveries": "Today's Deliveries",
        "no_pending_deliveries": "No pending deliveries.",
        "table": {
            "invoice": "Order #",
            "customer": "Customer",
            "date": "Date",
            "amount": "Amount"
        },
        "delivery_table": {
            "invoice": "Order #",
            "customer": "Customer",
            "status": "Status"
        },
        "product_table": {
            "product": "Product",
            "quantity_sold": "Quantity Sold"
        },
        "chart": {
            "sales": "Revenue"
        }
    },
    "orders": {
        "title": "Orders",
        "daily_revenue": "Today's Revenue",
        "monthly_revenue": "This Month's Revenue",
        "new_order_button": "+ New Order",
        "export_button": "Export Orders",
        "search_placeholder": "Search by order # or customer name...",
        "table": {
            "order": "Order #",
            "products": "Products",
            "date": "Date",
            "customer": "Customer",
            "salesperson": "Salesperson",
            "total": "Total",
            "discount": "Discount",
            "net_profit": "Net Profit",
            "payment": "Payment",
            "actions": "Actions",
            "view_print": "View/Print",
            "print": "Print"
        },
        "modal": {
            "title": "Create New Order",
            "edit_title": "Edit Order",
            "customer": "Customer",
            "search_customer_placeholder": "Search by name or phone...",
            "no_customer_found": "No customer found",
            "new_customer_button": "+ New Customer",
            "date": "Date",
            "salesperson": "Salesperson",
            "select_salesperson": "Select a salesperson",
            "payment_method": "Payment Method",
            "select_payment_method": "Select payment method",
            "benefit_pay_ref": "BenefitPay Ref. No.",
            "delivery_option": "Delivery Option",
            "delivery_options": {
                "none": "No Delivery",
                "charge": "Standard Delivery ({{fee}})",
                "free": "Free Delivery"
            },
            "delivery_fee": "Delivery Fee",
            "delivery_not_available_no_address": "Delivery not available. Customer has no address on file.",
            "items": "Items",
            "product": "Product",
            "select_product": "Select a product",
            "quantity": "Qty",
            "in_stock": "In Stock",
            "price": "Price",
            "total": "Total",
            "add_item_button": "+ Add Item",
            "scan_code_button": "Scan Code",
            "code_input_placeholder": "Enter or scan code...",
            "code_not_found": "Code not found",
            "product_out_of_stock": "{{name}} is out of stock",
            "subtotal": "Subtotal",
            "discount": "Discount (%)",
            "vat": "VAT (%)",
            "apply_offer_button": "Apply Offer (15%)",
            "grand_total": "Grand Total",
            "cancel_button": "Cancel",
            "save_button": "Save Order",
            "update_button": "Update Order",
            "saving_button": "Saving..."
        },
        "payment_methods": {
            "Cash": "Cash",
            "Card": "Card",
            "BenefitPay": "BenefitPay"
        },
        "print_modal": {
            "title": "Print Order",
            "invoice_title": "Invoice",
            "invoice": "Order",
            "date": "Date",
            "time": "Time",
            "salesperson": "Salesperson",
            "bill_to": "Bill To",
            "address": "Address",
            "phone": "Phone",
            "item": "Item",
            "warranty": "Warranty",
            "qty": "Qty",
            "price": "Price",
            "total": "Total",
            "subtotal": "Subtotal",
            "vat": "VAT",
            "discount": "Discount",
            "delivery_fee": "Delivery Fee",
            "grand_total": "Grand Total",
            "payment_method": "Payment Method",
            "benefit_pay_ref": "BenefitPay Ref",
            "months": "Months",
            "thank_you": "Thank you for your business!",
            "signature": "Signature",
            "print_button": "Print",
            "download_pdf_button": "Download PDF",
            "close_button": "Close",
            "footer_text": "Modern House for Trading: Hamad Town, Souq Waqif - Bahrain. Phones: 35965477 - 77905477"
        }
    },
    "inventory": {
        "title": "Inventory Management",
        "add_product_button": "+ Add Product",
        "delete_all_products": "Delete All Products",
        "delete_all_products_confirm": "Are you sure you want to delete all products? This cannot be undone.",
        "import_button": "Import",
        "export_button": "Export",
        "view_products": "All Products",
        "view_expiring_warranties": "Expiring Warranties",
        "financial_analytics": "Financial Analytics",
        "total_purchase_value": "Total Purchase Value",
        "total_sale_value": "Total Sale Value",
        "total_potential_profit": "Total Potential Profit",
        "analytics_chart": "Analytics Chart",
        "no_expiring_warranties": "No warranties are expiring in the next 30 days.",
        "delete_confirmation": "Are you sure you want to delete this product? This action cannot be undone.",
        "deactivate_confirmation": "Are you sure you want to deactivate this product? It will not be available for new orders.",
        "activate_confirmation": "Are you sure you want to activate this product? It will become available for new orders.",
        "sort_by": {
            "label": "Sort by",
            "default": "Default",
            "name_asc": "Name (A-Z)",
            "name_desc": "Name (Z-A)"
        },
        "table": {
            "image": "Image",
            "qr_code": "QR Code",
            "product_name": "Product Name",
            "sku": "SKU",
            "category": "Category",
            "supplier": "Supplier",
            "price": "Price",
            "net_profit": "Net Profit",
            "warranty": "Warranty",
            "months": "Months",
            "stock": "Stock",
            "status": "Status",
            "actions": "Actions",
            "details": "Details",
            "quantity": "Quantity"
        },
        "expiring_table": {
            "customer": "Customer",
            "invoice": "Order",
            "expiry_date": "Expiry Date",
            "remaining": "Remaining",
            "days": "days"
        },
        "status_labels": {
            "in_stock": "In Stock",
            "low_stock": "Low Stock",
            "out_of_stock": "Out of Stock",
            "inactive": "Inactive"
        },
        "modal": {
            "title_prefix": "Product Details:",
            "sku": "SKU",
            "barcode": "Barcode",
            "category": "Category",
            "supplier": "Supplier",
            "purchase_price": "Purchase Price",
            "sale_price": "Sale Price",
            "current_stock": "Current Stock",
            "low_stock_threshold": "Low Stock Threshold",
            "warranty": "Warranty",
            "months": "Months",
            "description": "Description",
            "close": "Close"
        },
        "add_modal": {
            "title": "Add New Product",
            "name": "Product Name",
            "sku": "SKU",
            "barcode": "Barcode",
            "category": "Category",
            "supplier": "Supplier",
            "select_supplier": "Select a supplier",
            "purchase_price": "Purchase Price (BHD)",
            "sale_price": "Sale Price (BHD)",
            "initial_stock": "Initial Stock",
            "low_stock_threshold": "Low Stock Threshold",
            "warranty": "Warranty (Months)",
            "image_url": "Image URL",
            "description": "Product Description",
            "cancel_button": "Cancel",
            "save_button": "Save Product"
        },
        "edit_modal": {
            "title": "Edit Product",
            "save_button": "Save Changes",
            "saving_button": "Saving...",
            "image": "Product Image",
            "upload_image": "Upload Image",
            "or_paste_url": "Or paste URL below"
        }
    },
    "finance": {
        "title": "Finance",
        "add_expense_button": "+ Add Expense",
        "cards": {
            "total_revenue": "Total Revenue",
            "gross_profit": "Gross Profit",
            "total_expenses": "Total Expenses",
            "net_profit": "Net Profit"
        },
        "monthly_report": {
            "title": "Monthly Report",
            "select_month": "Select Month",
            "total_revenue": "Total Revenue",
            "cogs": "Cost of Goods Sold",
            "gross_profit": "Gross Profit",
            "total_expenses": "Total Expenses",
            "net_profit": "Net Profit",
            "revenue_label": "Revenue",
            "expenses_label": "Expenses"
        },
        "expense_log": "Expense Log",
        "table": {
            "date": "Date",
            "category": "Category",
            "description": "Description",
            "linked_invoice": "Linked Order",
            "amount": "Amount",
            "actions": "Actions",
            "details": "Details"
        },
        "categories": {
            "Rent": "Rent",
            "Salaries": "Salaries",
            "Utilities": "Utilities",
            "Supplies": "Supplies",
            "Other": "Other"
        },
        "modal": {
            "title": "Add New Expense",
            "date": "Date",
            "category": "Category",
            "select_category": "Select a category",
            "description": "Description",
            "amount": "Amount (BHD)",
            "linked_invoice": "Link to Order (Optional)",
            "select_invoice": "Select an order",
            "cancel_button": "Cancel",
            "save_button": "Save Expense"
        },
        "detail_modal": {
            "title": "Expense Details",
            "date": "Date",
            "category": "Category",
            "description": "Description",
            "amount": "Amount",
            "linked_invoice_details": "Linked Order Details",
            "invoice_number": "Order #",
            "customer_name": "Customer Name",
            "invoice_date": "Order Date",
            "invoice_total": "Order Total",
            "no_linked_invoice": "No order linked to this expense.",
            "close": "Close"
        }
    },
    "customers": {
        "title": "Customers",
        "add_customer_button": "+ Add Customer",
        "import_button": "Import",
        "export_button": "Export",
        "search_placeholder": "Search by phone number...",
        "table": {
            "customer_name": "Customer Name",
            "phone": "Phone",
            "address": "Address",
            "member_since": "Member Since",
            "actions": "Actions",
            "details": "Details",
            "view_invoices": "View Orders"
        },
        "add_modal": {
            "title": "Add New Customer",
            "name": "Customer Name",
            "phone": "Phone Number",
            "address": "Address (Optional)",
            "cancel_button": "Cancel",
            "save_button": "Save Customer"
        },
        "detail_modal": {
            "title": "Customer Details",
            "name": "Name",
            "phone": "Phone",
            "address": "Address",
            "member_since": "Member Since",
            "close": "Close"
        },
        "invoice_modal": {
            "title": "Orders for {{customerName}}",
            "invoice_number": "Order",
            "date": "Date",
            "total": "Total",
            "products": "Products",
            "product_name": "Product Name",
            "warranty_status": "Warranty Status",
            "status_active": "Active",
            "status_expired": "Expired",
            "warranty_expires": "Expires:",
            "warranty_remaining": "{{days}} days remaining",
            "no_invoices": "This customer has no orders.",
            "close": "Close"
        }
    },
    "suppliers": {
        "title": "Suppliers",
        "add_supplier_button": "+ Add Supplier",
        "table": {
            "name": "Supplier Name",
            "email": "Email",
            "contact": "Contact Person",
            "phone": "Phone"
        },
        "add_modal": {
            "title": "Add New Supplier",
            "name": "Supplier Name",
            "email": "Email Address",
            "contact": "Contact Person",
            "phone": "Phone Number",
            "cancel_button": "Cancel",
            "save_button": "Save Supplier"
        }
    },
    "delivery": {
        "title": "Delivery",
        "create_note_button": "+ Create Delivery Note",
        "table": {
            "invoice": "Order #",
            "customer": "Customer",
            "driver": "Driver",
            "address": "Address",
            "date": "Delivery Date",
            "status": "Status",
            "actions": "Actions",
            "details": "Details",
            "print_note": "Print Note"
        },
        "status_labels": {
            "Pending": "Pending",
            "Out for Delivery": "Out for Delivery",
            "Delivered": "Delivered"
        },
        "delivery_tracking_modal": {
            "title": "Delivery Tracking",
            "assigned_driver": "Assigned Driver",
            "eta": "Estimated Delivery Time",
            "route_map": "Route Map"
        },
        "print_modal": {
            "title": "Print Delivery Note",
            "delivery_note_title": "DELIVERY NOTE",
            "cr_number": "C.R. NO. 147987-2",
            "deliver_to": "Deliver To",
            "sl_no": "SL NO",
            "description": "DESCRIPTION",
            "received_by": "RECEIVED BY (SIGNATURE)",
            "delivered_by": "DELIVERED BY",
            "download_pdf_button": "Download PDF"
        },
        "create_modal": {
            "title": "Create New Delivery Note",
            "select_order": "Select Order to Deliver",
            "no_orders": "No completed orders available for delivery.",
            "driver": "Driver",
            "cancel_button": "Cancel",
            "save_button": "Create Note"
        }
    },
    "purchaseOrders": {
        "title": "Purchase Orders",
        "new_po_button": "+ New P.O.",
        "receive_confirmation": "Are you sure you want to mark this order as received? This will add the items to your inventory stock.",
        "table": {
            "po_number": "P.O. #",
            "supplier": "Supplier",
            "date": "Date",
            "total": "Total",
            "status": "Status",
            "actions": "Actions",
            "receive": "Receive",
            "receiving": "Receiving...",
            "details": "Details"
        },
        "status_labels": {
            "Pending": "Pending",
            "Partial": "Partial",
            "Received": "Received"
        },
        "modal": {
            "title": "Create New Purchase Order",
            "supplier": "Supplier",
            "select_supplier": "Select a supplier",
            "date": "Date",
            "items": "Items",
            "product": "Product",
            "select_product": "Select a product",
            "quantity": "Qty",
            "purchase_price": "Purchase Price",
            "total": "Total",
            "add_item_button": "+ Add Item",
            "grand_total": "Grand Total",
            "cancel_button": "Cancel",
            "save_button": "Save P.O."
        },
        "detail_modal": {
            "title": "Purchase Order Details",
            "product": "Product",
            "quantity": "Quantity",
            "unit_price": "Unit Price",
            "total": "Total"
        }
    },
    "users": {
        "title": "User Management",
        "add_user_button": "+ Add User",
        "delete_confirmation": "Are you sure you want to delete this user?",
        "table": {
            "name": "Name",
            "role": "Role",
            "permissions": "Permissions",
            "status": "Status",
            "password": "Password",
            "actions": "Actions",
            "edit": "Edit",
            "delete": "Delete"
        },
        "roles": {
            "Admin": "Admin",
            "Sales Manager": "Sales Manager",
            "Accountant": "Accountant",
            "Warehouse Staff": "Warehouse Staff",
            "Delivery": "Delivery",
            "Salesperson": "Salesperson",
            "Maintenance": "Maintenance Manager"
        },
        "status_labels": {
            "Active": "Active",
            "Inactive": "Inactive"
        },
        "modal": {
            "add_title": "Add New User",
            "edit_title": "Edit User",
            "add_note": "Creating a user here will create a Firebase Auth account automatically. Note: This will temporarily sign you out if your session is not set up with Admin SDK permissions.",
            "name": "Full Name / Username",
            "role": "Role",
            "password": "Password",
            "responsibilities": "Responsibilities (Permissions)",
            "status": "Status",
            "cancel_button": "Cancel",
            "save_button": "Save User"
        }
    },
    "auth": {
        "login_title": "Login to your Account",
        "pin_login_title": "Quick PIN Login",
        "pin_prompt": "Enter your 4-digit security PIN to access the terminal",
        "pin_default_hint": "Default master PIN",
        "enter_pin": "Enter PIN",
        "username": "Username",
        "username_placeholder": "Enter your username",
        "password": "Password",
        "login_button": "Login",
        "register_title": "Create a New Account",
        "register_button": "Register",
        "switch_to_login": "Already have an account? Sign in",
        "switch_to_register": "Don't have an account? Sign up",
        "error_invalid_credentials": "Invalid username or password.",
        "error_username_exists": "Username already exists.",
        "logout": "Logout",
        "edit_profile": "Edit Profile",
        "forgot_password": "Forgot Password?",
        "reset_password_title": "Reset Password",
        "reset_instructions": "Enter your email address and we will send you a link to reset your password.",
        "send_reset_link": "Send Reset Link",
        "reset_success": "If an account with that email exists, a password reset link has been sent.",
        "import_success": "Data imported successfully. You can now start using the application.",
        "import_error": "Failed to import data",
        "import_required_title": "Database Import Required",
        "import_required_prompt": "Welcome, {{name}}. To get started, please import your database file.",
        "import_database_button": "Import Database",
        "import_info_title": "Welcome, {{name}}!",
        "import_info_prompt": "Before you begin, you need to import your store's data. This is a one-time process.",
        "import_info_button": "Got it, let's start!"
    },
    "website": {
        "title": "Our Products",
        "hero_title": "Welcome to Modern House for Trading",
        "hero_subtitle": "Your one-stop shop for high-quality kitchen supplies and solutions.",
        "bestsellers_title": "Our Bestsellers",
        "quick_view": "Quick View",
        "about_us_title": "About Modern House for Trading",
        "about_us_content": "For years, Modern House for Trading has been the leading provider of premium kitchen supplies in Bahrain. We are committed to offering only the best, most durable, and stylish products to help you create the kitchen of your dreams. Our passion for quality and customer satisfaction is at the heart of everything we do.",
        "search_placeholder": "Search products by name...",
        "all_categories": "All",
        "added_to_request_toast": "{{name}} added to request!",
        "add_to_request": "Add to Request",
        "view_request_cart": "View Request Cart",
        "cart": {
            "title": "Your Order Request",
            "empty": "Your request cart is empty.",
            "name": "Your Name",
            "phone": "Phone Number",
            "address": "Your Address",
            "submit": "Submit Request",
            "submitting": "Submitting...",
            "success_title": "Request Sent!",
            "success_message": "Thank you! We have received your request and will contact you shortly.",
            "close": "Close"
        },
        "footer_contact_us": "Contact Us",
        "footer_address": "Address: Hamad Town, Souq Waqif - Bahrain",
        "footer_phone": "Phone: 35965477 - 77905477",
        "footer_copyright": "© {{year}} Modern House for Trading. All rights reserved."
    },
    "requests": {
        "title": "Customer Requests",
        "table": {
            "customer": "Customer",
            "phone": "Phone",
            "date": "Date",
            "status": "Status",
            "actions": "Actions",
            "details": "Details",
            "create_order": "Create Order"
        },
        "status_labels": {
            "Pending": "Pending",
            "Processing": "Processing",
            "Completed": "Completed",
            "Cancelled": "Cancelled"
        },
        "detail_modal": {
            "title": "Request Details",
            "customer_name": "Customer Name",
            "customer_phone": "Customer Phone",
            "customer_address": "Customer Address",
            "request_date": "Request Date",
            "requested_items": "Requested Items",
            "product": "Product",
            "quantity": "Quantity",
            "close": "Close",
            "cancel_button": "Cancel Request"
        }
    },
    "settings": {
        "title": "Settings",
        "invoice_customization": "Invoice Customization",
        "delivery_note_customization": "Delivery Note Customization",
        "qr_code_printing": "QR Code Printing",
        "data_management": "Data Management",
        "backup_database": "Backup Database",
        "backup_database_desc": "Download a full JSON backup of all your data.",
        "import_database": "Import Database",
        "import_database_desc": "Upload a full JSON backup to restore your data.",
        "delete_all_data": "Delete All Data",
        "delete_all_data_desc": "Permanently remove all records from the database except users. This action cannot be undone.",
        "delete_all_data_confirm": "Are you absolutely sure you want to delete all database data? This CANNOT be undone.",
        "live_preview": "Live Preview",
        "options": "Options",
        "company_logo": "Company Logo",
        "upload_logo": "Upload Logo",
        "accent_color": "Accent Color",
        "footer_text": "Invoice Footer Text",
        "notice_text": "Notice Text",
        "contact_text": "Contact Line",
        "thank_you_message": "Thank You Message",
        "visible_columns": "Visible Columns",
        "show_warranty": "Show Warranty",
        "show_salesperson": "Show Salesperson",
        "show_discount": "Show Discount",
        "changes_saved": "Changes saved automatically.",
        "website_customization": "Website Customization",
        "hero_image": "Hero Background Image",
        "hero_image_desc": "This image will appear on the main website home page.",
        "qr_code_options": {
            "select_product": "Select a product to print",
            "add_to_list": "Add to List",
            "quantity_of_labels": "Quantity of Labels",
            "product_to_print": "Product to Print",
            "generate_and_print": "Generate & Print Labels",
            "no_items": "No items added to the print list."
        },
        "qr_code_modal": {
            "title": "Print QR Code Labels",
            "company_name": "Modern House for Trading"
        }
    },
    "general": {
        "not_applicable": "N/A",
        "edit": "Edit",
        "delete": "Delete",
        "deactivate": "Deactivate",
        "activate": "Activate"
    }
};

const arTranslations = {
    "sidebar": {
        "title": "مودرن هاوس",
        "nav": {
            "dashboard": "لوحة التحكم",
            "pos": "نقاط البيع",
            "orders": "الطلبات",
            "inventory": "المخزون",
            "finance": "المالية",
            "customers": "العملاء",
            "marketing": "التسويق عبر واتساب",
            "suppliers": "الموردون",
            "delivery": "التوصيل",
            "users": "إدارة المستخدمين",
            "purchaseOrders": "طلبات الشراء",
            "requests": "الطلبات الواردة",
            "quotations": "عروض الأسعار",
            "contracts": "عقود المطابخ والدفعات",
            "maintenance": "الإصلاح والصيانة",
            "website": "الموقع الإلكتروني",
            "reports": "التقارير",
            "settings": "الإعدادات"
        }
    },
    "quotations": {
        "title": "عروض الأسعار",
        "subtitle": "إنشاء وإدارة ومتابعة عروض الأسعار الرسمية وتحويلها إلى فواتير مبيعات",
        "new_quotation": "+ عرض سعر جديد",
        "total_quotations": "إجمالي عروض الأسعار",
        "pending_offers": "عروض معلقة / مرسلة",
        "accepted_offers": "عروض مقبولة",
        "total_value": "إجمالي قيمة العروض",
        "conversion_rate": "نسبة التحويل للطلبات",
        "table": {
            "quote_no": "رقم العرض",
            "customer": "العميل",
            "date": "تاريخ الإصدار",
            "valid_until": "صالح لغاية",
            "items_count": "عدد الأصناف",
            "total": "المبلغ الإجمالي",
            "status": "الحالة",
            "actions": "الإجراءات"
        },
        "status": {
            "Draft": "مسودة",
            "Sent": "تم الإرسال للعميل",
            "Accepted": "مقبول",
            "Rejected": "مرفوض",
            "Expired": "منتهي الصلاحية",
            "Converted": "تم التحويل لطلب مبيعات"
        },
        "convert_to_order": "تحويل إلى فاتورة مبيعات",
        "convert_confirm": "هل أنت متأكد من تحويل هذا العرض إلى فاتورة وطلب مبيعات معتمد؟",
        "convert_success": "تم تحويل عرض السعر إلى طلب مبيعات بنجاح!",
        "send_whatsapp": "إرسال عبر واتساب",
        "print_quote": "طباعة / تصدير PDF",
        "duplicate_quote": "نسخ العرض",
        "edit_quote": "تعديل عرض السعر",
        "delete_quote": "حذف عرض السعر",
        "delete_confirm": "هل أنت متأكد من حذف هذا العرض؟",
        "filter_all": "جميع الحالات",
        "search_placeholder": "بحث برقم العرض، اسم العميل، الهاتف، أو الصنف...",
        "no_quotations": "لا توجد عروض أسعار مسجلة."
    },
    "contracts": {
        "title": "عقود ودفعات المطابخ",
        "subtitle": "إدارة وتوثيق عقود تفصيل المطابخ، جدولة الدفعات المرحلية، وتنبيهات الأقساط عبر واتساب",
        "new_contract": "+ عقد مطبخ جديد",
        "total_contracts": "إجمالي العقود",
        "active_contracts": "عقود قيد التنفيذ",
        "collected_amount": "المبالغ المحصلة",
        "remaining_amount": "المتبقي للاستحقاق"
    },
    "reports": {
        "title": "تقارير المبيعات",
        "daily": "ملخص يومي",
        "monthly": "ملخص شهري",
        "yearly": "ملخص سنوي",
        "top_products": "الأصناف الأكثر مبيعاً",
        "employee_performance": "أداء الموظفين",
        "avg_sales": "متوسط المبيعات لكل موظف",
        "export_csv": "تصدير CSV",
        "total_revenue": "إجمالي الإيرادات",
        "total_orders": "إجمالي الطلبات",
        "total_items": "الأصناف المباعة",
        "top_performing_employee": "الموظف الأكثر مبيعاً",
        "employee": "الموظف",
        "orders_count": "الطلبات",
        "average": "المتوسط",
        "product": "المنتج",
        "quantity": "الكمية",
        "sales": "المبيعات"
    },
    "header": {
        "search_placeholder": "بحث شامل في النظام (فواتير، أصناف، عملاء)...",
        "notifications": {
            "title": "الإشعارات",
            "new_order": "تم إنشاء طلب جديد #{{orderNumber}} للعميل {{customerName}}.",
            "low_stock_item": "{{name}} على وشك النفاد (المتبقي: {{stock}}).",
            "new_delivery_request": "طلب توصيل جديد للطلب #{{orderNumber}} للعميل {{customerName}}.",
            "new_website_request": "طلب جديد من الموقع من {{customerName}}.",
            "no_notifications": "لا توجد إشعارات جديدة"
        },
        "view_website": "عرض الموقع",
        "sign_in": "تسجيل الدخول",
        "return_to_oms": "العودة إلى النظام"
    },
    "dashboard": {
        "title": "لوحة التحكم",
        "cards": {
            "total_sales": "إجمالي الإيرادات",
            "avg_sale_value": "متوسط قيمة الطلب",
            "low_stock_items": "منتجات على وشك النفاد",
            "total_customers": "إجمالي العملاء",
            "net_profit": "صافي الربح",
            "gross_profit_sales": "الربح الإجمالي (الطلبات)",
            "total_expenses": "إجمالي المصروفات",
            "pending_deliveries": "عمليات التوصيل المعلقة",
            "total_purchase_orders": "إجمالي طلبات الشراء"
        },
        "weekly_sales_trend": "اتجاه الإيرادات الأسبوعي",
        "recent_sales": "أحدث الطلبات",
        "todays_deliveries": "عمليات توصيل اليوم",
        "no_pending_deliveries": "لا توجد عمليات توصيل معلقة.",
        "table": {
            "invoice": "رقم الطلب",
            "customer": "العميل",
            "date": "التاريخ",
            "amount": "المبلغ"
        },
        "delivery_table": {
            "invoice": "رقم الطلب",
            "customer": "العميل",
            "status": "الحالة"
        },
        "product_table": {
            "product": "المنتج",
            "quantity_sold": "الكمية المباعة"
        },
        "chart": {
            "sales": "الإيرادات"
        }
    },
    "orders": {
        "title": "الطلبات",
        "daily_revenue": "الإيراد اليومي",
        "monthly_revenue": "الإيراد الشهري",
        "new_order_button": "+ طلب جديد",
        "export_button": "تصدير الطلبات",
        "search_placeholder": "ابحث برقم الطلب أو اسم العميل...",
        "table": {
            "order": "رقم الطلب",
            "products": "المنتجات",
            "date": "التاريخ",
            "customer": "العميل",
            "salesperson": "البائع",
            "total": "الإجمالي",
            "discount": "الخصم",
            "net_profit": "صافي الربح",
            "payment": "الدفع",
            "actions": "الإجراءات",
            "view_print": "عرض/طباعة",
            "print": "طباعة"
        },
        "modal": {
            "title": "إنشاء طلب جديد",
            "edit_title": "تعديل الطلب",
            "customer": "العميل",
            "search_customer_placeholder": "ابحث بالاسم أو رقم الهاتف...",
            "no_customer_found": "لم يتم العثور على عميل",
            "new_customer_button": "+ عميل جديد",
            "date": "التاريخ",
            "salesperson": "البائع",
            "select_salesperson": "اختر بائعًا",
            "payment_method": "طريقة الدفع",
            "select_payment_method": "اختر طريقة الدفع",
            "benefit_pay_ref": "رقم مرجع بنفت بي",
            "delivery_option": "خيار التوصيل",
            "delivery_options": {
                "none": "بدون توصيل",
                "charge": "توصيل قياسي ({{fee}})",
                "free": "توصيل مجاني"
            },
            "delivery_fee": "رسوم التوصيل",
            "delivery_not_available_no_address": "التوصيل غير متاح. لا يوجد عنوان مسجل للعميل.",
            "items": "الأصناف",
            "product": "المنتج",
            "select_product": "اختر منتجًا",
            "quantity": "الكمية",
            "in_stock": "في المخزن",
            "price": "السعر",
            "total": "الإجمالي",
            "add_item_button": "+ إضافة صنف",
            "scan_code_button": "مسح الرمز",
            "code_input_placeholder": "أدخل أو امسح الرمز...",
            "code_not_found": "الرمز غير موجود",
            "product_out_of_stock": "{{name}} نفذ من المخزون",
            "subtotal": "المجموع الفرعي",
            "discount": "الخصم (%)",
            "vat": "الضريبة (%)",
            "apply_offer_button": "تطبيق عرض (15%)",
            "grand_total": "المجموع الكلي",
            "cancel_button": "إلغاء",
            "save_button": "حفظ الطلب",
            "update_button": "تحديث الطلب",
            "saving_button": "جاري الحفظ..."
        },
        "payment_methods": {
            "Cash": "نقداً",
            "Card": "بطاقة",
            "BenefitPay": "بنفت بي"
        },
        "print_modal": {
            "title": "طباعة الطلب",
            "invoice_title": "فاتورة",
            "invoice": "الطلب",
            "date": "التاريخ",
            "time": "الوقت",
            "salesperson": "البائع",
            "bill_to": "إلى العميل",
            "address": "العنوان",
            "phone": "الهاتف",
            "item": "الصنف",
            "warranty": "الضمان",
            "qty": "الكمية",
            "price": "السعر",
            "total": "الإجمالي",
            "subtotal": "المجموع الفرعي",
            "vat": "الضريبة",
            "discount": "الخصم",
            "delivery_fee": "رسوم التوصيل",
            "grand_total": "المجموع الكلي",
            "payment_method": "طريقة الدفع",
            "benefit_pay_ref": "مرجع بنفت بي",
            "months": "أشهر",
            "thank_you": "شكراً لتعاملكم معنا!",
            "signature": "التوقيع",
            "print_button": "طباعة",
            "download_pdf_button": "تحميل PDF",
            "close_button": "إغلاق",
            "footer_text": "Modern House for Trading: مدينة حمد، سوق واقف - البحرين. هواتف: 35965477 - 77905477"
        }
    },
    "inventory": {
        "title": "إدارة المخزون",
        "add_product_button": "+ إضافة منتج",
        "delete_all_products": "حذف جميع المنتجات",
        "delete_all_products_confirm": "هل أنت متأكد من رغبتك في حذف جميع المنتجات؟ لا يمكن التراجع عن هذا.",
        "import_button": "استيراد",
        "export_button": "تصدير",
        "view_products": "كل المنتجات",
        "view_expiring_warranties": "الضمانات المنتهية",
        "financial_analytics": "التحليلات المالية",
        "total_purchase_value": "إجمالي قيمة الشراء",
        "total_sale_value": "إجمالي قيمة البيع",
        "total_potential_profit": "إجمالي الربح المتوقع",
        "analytics_chart": "مخطط التحليلات",
        "no_expiring_warranties": "لا توجد ضمانات تنتهي في الثلاثين يومًا القادمة.",
        "delete_confirmation": "هل أنت متأكد من أنك تريد حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.",
        "deactivate_confirmation": "هل أنت متأكد من رغبتك في تعطيل هذا المنتج؟ لن يكون متاحاً في الطلبات الجديدة.",
        "activate_confirmation": "هل أنت متأكد من رغبتك في تفعيل هذا المنتج؟ سيصبح متاحاً في الطلبات الجديدة.",
        "sort_by": {
            "label": "فرز حسب",
            "default": "الافتراضي",
            "name_asc": "الاسم (أ-ي)",
            "name_desc": "الاسم (ي-أ)"
        },
        "table": {
            "image": "صورة",
            "qr_code": "رمز QR",
            "product_name": "اسم المنتج",
            "sku": "SKU",
            "category": "الفئة",
            "supplier": "المورد",
            "price": "السعر",
            "net_profit": "صافي الربح",
            "warranty": "الضمان",
            "months": "أشهر",
            "stock": "المخزون",
            "status": "الحالة",
            "actions": "الإجراءات",
            "details": "التفاصيل",
            "quantity": "الكمية"
        },
        "expiring_table": {
            "customer": "العميل",
            "invoice": "الطلب",
            "expiry_date": "تاريخ الانتهاء",
            "remaining": "المتبقي",
            "days": "أيام"
        },
        "status_labels": {
            "in_stock": "متوفر",
            "low_stock": "مخزون منخفض",
            "out_of_stock": "نفذ المخزون",
            "inactive": "غير نشط"
        },
        "modal": {
            "title_prefix": "تفاصيل المنتج:",
            "sku": "SKU",
            "barcode": "الباركود",
            "category": "الفئة",
            "supplier": "المورد",
            "purchase_price": "سعر الشراء",
            "sale_price": "سعر البيع",
            "current_stock": "المخزون الحالي",
            "low_stock_threshold": "حد المخزون المنخفض",
            "warranty": "الضمان",
            "months": "أشهر",
            "description": "الوصف",
            "close": "إغلاق"
        },
        "add_modal": {
            "title": "إضافة منتج جديد",
            "name": "اسم المنتج",
            "sku": "SKU",
            "barcode": "الباركود",
            "category": "الفئة",
            "supplier": "المورد",
            "select_supplier": "اختر موردًا",
            "purchase_price": "سعر الشراء (دينار بحريني)",
            "sale_price": "سعر البيع (دينار بحريني)",
            "initial_stock": "المخزون المبدئي",
            "low_stock_threshold": "حد المخزون المنخفض",
            "warranty": "الضمان (بالأشهر)",
            "image_url": "رابط الصورة",
            "description": "وصف المنتج",
            "cancel_button": "إلغاء",
            "save_button": "حفظ المنتج"
        },
        "edit_modal": {
            "title": "تعديل المنتج",
            "save_button": "حفظ التغييرات",
            "saving_button": "جاري الحفظ...",
            "image": "صورة المنتج",
            "upload_image": "رفع صورة",
            "or_paste_url": "أو الصق الرابط أدناه"
        }
    },
    "finance": {
        "title": "المالية",
        "add_expense_button": "+ إضافة مصروف",
        "cards": {
            "total_revenue": "إجمالي الإيرادات",
            "gross_profit": "الربح الإجمالي",
            "total_expenses": "إجمالي المصروفات",
            "net_profit": "صافي الربح"
        },
        "monthly_report": {
            "title": "التقرير الشهري",
            "select_month": "اختر الشهر",
            "total_revenue": "إجمالي الإيرادات",
            "cogs": "تكلفة البضاعة المباعة",
            "gross_profit": "الربح الإجمالي",
            "total_expenses": "إجمالي المصروفات",
            "net_profit": "صافي الربح",
            "revenue_label": "الإيرادات",
            "expenses_label": "المصروفات"
        },
        "expense_log": "سجل المصروفات",
        "table": {
            "date": "التاريخ",
            "category": "الفئة",
            "description": "الوصف",
            "linked_invoice": "الطلب المرتبط",
            "amount": "المبلغ",
            "actions": "الإجراءات",
            "details": "التفاصيل"
        },
        "categories": {
            "Rent": "إيجار",
            "Salaries": "رواتب",
            "Utilities": "خدمات",
            "Supplies": "لوازم",
            "Other": "أخرى"
        },
        "modal": {
            "title": "إضافة مصروف جديد",
            "date": "التاريخ",
            "category": "الفئة",
            "select_category": "اختر فئة",
            "description": "الوصف",
            "amount": "المبلغ (دينار بحريني)",
            "linked_invoice": "ربط بطلب (اختياري)",
            "select_invoice": "اختر طلبًا",
            "cancel_button": "إلغاء",
            "save_button": "حفظ المصروف"
        },
        "detail_modal": {
            "title": "تفاصيل المصروف",
            "date": "التاريخ",
            "category": "الفئة",
            "description": "الوصف",
            "amount": "المبلغ",
            "linked_invoice_details": "تفاصيل الطلب المرتبط",
            "invoice_number": "رقم الطلب",
            "customer_name": "اسم العميل",
            "invoice_date": "تاريخ الطلب",
            "invoice_total": "إجمالي الطلب",
            "no_linked_invoice": "لا يوجد طلب مرتبط بهذا المصروف.",
            "close": "إغلاق"
        }
    },
    "customers": {
        "title": "العملاء",
        "add_customer_button": "+ إضافة عميل",
        "import_button": "استيراد",
        "export_button": "تصدير",
        "search_placeholder": "ابحث برقم الهاتف...",
        "table": {
            "customer_name": "اسم العميل",
            "phone": "الهاتف",
            "address": "العنوان",
            "member_since": "عضو منذ",
            "actions": "الإجراءات",
            "details": "التفاصيل",
            "view_invoices": "عرض الطلبات"
        },
        "add_modal": {
            "title": "إضافة عميل جديد",
            "name": "اسم العميل",
            "phone": "رقم الهاتف",
            "address": "العنوان (اختياري)",
            "cancel_button": "إلغاء",
            "save_button": "حفظ العميل"
        },
        "detail_modal": {
            "title": "تفاصيل العميل",
            "name": "الاسم",
            "phone": "الهاتف",
            "address": "العنوان",
            "member_since": "عضو منذ",
            "close": "إغلاق"
        },
        "invoice_modal": {
            "title": "طلبات العميل {{customerName}}",
            "invoice_number": "الطلب",
            "date": "التاريخ",
            "total": "الإجمالي",
            "products": "المنتجات",
            "product_name": "اسم المنتج",
            "warranty_status": "حالة الضمان",
            "status_active": "ساري",
            "status_expired": "منتهي",
            "warranty_expires": "ينتهي في:",
            "warranty_remaining": "متبقي {{days}} يوم",
            "no_invoices": "هذا العميل ليس لديه طلبات.",
            "close": "إغلاق"
        }
    },
    "suppliers": {
        "title": "الموردون",
        "add_supplier_button": "+ إضافة مورد",
        "table": {
            "name": "اسم المورد",
            "email": "البريد الإلكتروني",
            "contact": "الشخص المسؤول",
            "phone": "الهاتف"
        },
        "add_modal": {
            "title": "إضافة مورد جديد",
            "name": "اسم المورد",
            "email": "البريد الإلكتروني",
            "contact": "الشخص المسؤول",
            "phone": "رقم الهاتف",
            "cancel_button": "إلغاء",
            "save_button": "حفظ المورد"
        }
    },
    "delivery": {
        "title": "التوصيل",
        "create_note_button": "+ إنشاء مذكرة توصيل",
        "table": {
            "invoice": "رقم الطلب",
            "customer": "العميل",
            "driver": "السائق",
            "address": "العنوان",
            "date": "تاريخ التوصيل",
            "status": "الحالة",
            "actions": "الإجراءات",
            "details": "التفاصيل",
            "print_note": "طباعة المذكرة"
        },
        "status_labels": {
            "Pending": "معلق",
            "Out for Delivery": "قيد التوصيل",
            "Delivered": "تم التوصيل"
        },
        "delivery_tracking_modal": {
            "title": "تتبع التوصيل",
            "assigned_driver": "السائق المسؤول",
            "eta": "وقت الوصول المتوقع",
            "route_map": "خريطة الطريق"
        },
        "print_modal": {
            "title": "طباعة مذكرة التوصيل",
            "delivery_note_title": "مذكرة توصيل",
            "cr_number": "س.ت. 147987-2",
            "deliver_to": "توصيل إلى",
            "sl_no": "الرقم",
            "description": "الوصف",
            "received_by": "المستلم (التوقيع)",
            "delivered_by": "تم التوصيل بواسطة",
            "download_pdf_button": "تحميل PDF"
        },
        "create_modal": {
            "title": "إنشاء مذكرة توصيل جديدة",
            "select_order": "اختر الطلب للتوصيل",
            "no_orders": "لا توجد طلبات مكتملة متاحة للتوصيل.",
            "driver": "السائق",
            "cancel_button": "إلغاء",
            "save_button": "إنشاء مذكرة"
        }
    },
    "purchaseOrders": {
        "title": "طلبات الشراء",
        "new_po_button": "+ طلب شراء جديد",
        "receive_confirmation": "هل أنت متأكد من أنك تريد تحديد هذا الطلب كمستلم؟ سيؤدي هذا إلى إضافة الأصناف إلى مخزونك.",
        "table": {
            "po_number": "رقم الطلب",
            "supplier": "المورد",
            "date": "التاريخ",
            "total": "الإجمالي",
            "status": "الحالة",
            "actions": "الإجراءات",
            "receive": "استلام",
            "receiving": "جاري الاستلام...",
            "details": "التفاصيل"
        },
        "status_labels": {
            "Pending": "معلق",
            "Partial": "جزئي",
            "Received": "تم الاستلام"
        },
        "modal": {
            "title": "إنشاء طلب شراء جديد",
            "supplier": "المورد",
            "select_supplier": "اختر موردًا",
            "date": "التاريخ",
            "items": "الأصناف",
            "product": "المنتج",
            "select_product": "اختر منتجًا",
            "quantity": "الكمية",
            "purchase_price": "سعر الشراء",
            "total": "الإجمالي",
            "add_item_button": "+ إضافة صنف",
            "grand_total": "المجموع الكلي",
            "cancel_button": "إلغاء",
            "save_button": "حفظ طلب الشراء"
        },
        "detail_modal": {
            "title": "تفاصيل طلب الشراء",
            "product": "المنتج",
            "quantity": "الكمية",
            "unit_price": "سعر الوحدة",
            "total": "الإجمالي"
        }
    },
    "users": {
        "title": "إدارة المستخدمين",
        "add_user_button": "+ إضافة مستخدم",
        "delete_confirmation": "هل أنت متأكد من أنك تريد حذف هذا المستخدم؟",
        "table": {
            "name": "الاسم",
            "role": "الدور",
            "permissions": "الصلاحيات",
            "status": "الحالة",
            "password": "كلمة المرور",
            "actions": "الإجراءات",
            "edit": "تعديل",
            "delete": "حذف"
        },
        "roles": {
            "Admin": "مدير",
            "Sales Manager": "مدير مبيعات",
            "Accountant": "محاسب",
            "Warehouse Staff": "موظف مستودع",
            "Delivery": "موظف توصيل",
            "Salesperson": "بائع",
            "Maintenance": "مسؤول الصيانة"
        },
        "status_labels": {
            "Active": "نشط",
            "Inactive": "غير نشط"
        },
        "modal": {
            "add_title": "إضافة مستخدم جديد",
            "edit_title": "تعديل المستخدم",
            "add_note": "إنشاء مستخدم هنا سيقوم بإنشاء حساب Firebase Auth تلقائياً. ملاحظة: قد يؤدي هذا إلى تسجيل خروجك مؤقتاً إذا لم تكن جلستك مهيأة بصلاحيات Admin SDK.",
            "name": "الاسم الكامل / اسم المستخدم",
            "role": "الدور",
            "password": "كلمة المرور",
            "responsibilities": "المسؤوليات (الصلاحيات)",
            "status": "الحالة",
            "cancel_button": "إلغاء",
            "save_button": "حفظ المستخدم"
        }
    },
    "auth": {
        "login_title": "تسجيل الدخول إلى حسابك",
        "pin_login_title": "الدخول السريع برمز PIN",
        "pin_prompt": "أدخل رمز المرور المكوّن من 4 أرقام للوصول إلى النظام",
        "pin_default_hint": "الرمز الافتراضي",
        "enter_pin": "أدخل رمز PIN",
        "username": "اسم المستخدم",
        "username_placeholder": "أدخل اسم المستخدم",
        "password": "كلمة المرور",
        "login_button": "تسجيل الدخول",
        "register_title": "إنشاء حساب جديد",
        "register_button": "تسجيل",
        "switch_to_login": "هل لديك حساب بالفعل؟ تسجيل الدخول",
        "switch_to_register": "ليس لديك حساب؟ اشتراك",
        "error_invalid_credentials": "اسم المستخدم أو كلمة المرور غير صالحة.",
        "error_username_exists": "اسم المستخدم موجود بالفعل.",
        "logout": "تسجيل الخروج",
        "edit_profile": "تعديل الملف الشخصي",
        "forgot_password": "هل نسيت كلمة المرور؟",
        "reset_password_title": "إعادة تعيين كلمة المرور",
        "reset_instructions": "أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور الخاصة بك.",
        "send_reset_link": "إرسال رابط إعادة التعيين",
        "reset_success": "إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور.",
        "import_success": "تم استيراد البيانات بنجاح. يمكنك الآن البدء في استخدام التطبيق.",
        "import_error": "فشل استيراد البيانات",
        "import_required_title": "مطلوب استيراد قاعدة البيانات",
        "import_required_prompt": "أهلاً بك، {{name}}. للبدء، يرجى استيراد ملف قاعدة البيانات الخاص بك.",
        "import_database_button": "استيراد قاعدة البيانات",
        "import_info_title": "أهلاً بك، {{name}}!",
        "import_info_prompt": "قبل البدء، تحتاج إلى استيراد بيانات متجرك. هذه عملية تتم مرة واحدة فقط.",
        "import_info_button": "فهمت، لنبدأ!"
    },
    "website": {
        "title": "منتجاتنا",
        "hero_title": "أهلاً بكم في Modern House for Trading",
        "hero_subtitle": "وجهتكم الوحيدة لمستلزمات وحلول المطبخ عالية الجودة.",
        "bestsellers_title": "الأكثر مبيعاً",
        "quick_view": "نظرة سريعة",
        "about_us_title": "عن Modern House for Trading",
        "about_us_content": "لسنوات، كان Modern House for Trading المزود الرائد لمستلزمات المطبخ الفاخرة في البحرين. نحن ملتزمون بتقديم أفضل المنتجات وأكثرها متانة وأناقة لمساعدتك في إنشاء مطبخ أحلامك. شغفنا بالجودة ورضا العملاء هو في صميم كل ما نقوم به.",
        "search_placeholder": "ابحث عن المنتجات بالاسم",
        "all_categories": "الكل",
        "added_to_request_toast": "تمت إضافة {{name}} إلى الطلب!",
        "add_to_request": "إضافة للطلب",
        "view_request_cart": "عرض سلة الطلبات",
        "cart": {
            "title": "طلبك",
            "empty": "سلة الطلبات فارغة.",
            "name": "اسمك",
            "phone": "رقم الهاتف",
            "address": "عنوانك",
            "submit": "إرسال الطلب",
            "submitting": "جاري الإرسال...",
            "success_title": "تم إرسال الطلب!",
            "success_message": "شكرًا لك! لقد استلمنا طلبك وسنتصل بك قريبًا.",
            "close": "إغلاق"
        },
        "footer_contact_us": "تواصل معنا",
        "footer_address": "العنوان: مدينة حمد، سوق واقف - البحرين",
        "footer_phone": "الهاتف: 35965477 - 77905477",
        "footer_copyright": "© {{year}} Modern House for Trading. جميع الحقوق محفوظة."
    },
    "requests": {
        "title": "طلبات العملاء",
        "table": {
            "customer": "العميل",
            "phone": "الهاتف",
            "date": "التاريخ",
            "status": "الحالة",
            "actions": "الإجراءات",
            "details": "التفاصيل",
            "create_order": "إنشاء طلب"
        },
        "status_labels": {
            "Pending": "معلق",
            "Processing": "قيد المعالجة",
            "Completed": "مكتمل",
            "Cancelled": "ملغى"
        },
        "detail_modal": {
            "title": "تفاصيل الطلب",
            "customer_name": "اسم العميل",
            "customer_phone": "هاتف العميل",
            "customer_address": "عنوان العميل",
            "request_date": "تاريخ الطلب",
            "requested_items": "الأصناف المطلوبة",
            "product": "المنتج",
            "quantity": "الكمية",
            "close": "إغلاق",
            "cancel_button": "إلغاء الطلب"
        }
    },
     "settings": {
        "title": "الإعدادات",
        "invoice_customization": "تخصيص الفاتورة",
        "delivery_note_customization": "تخصيص مذكرة التوصيل",
        "qr_code_printing": "طباعة رمز الاستجابة السريعة",
        "data_management": "إدارة البيانات",
        "backup_database": "نسخ احتياطي للبيانات",
        "backup_database_desc": "قم بتنزيل نسخة احتياطية كاملة بصيغة JSON لجميع بياناتك.",
        "import_database": "استيراد قاعدة البيانات",
        "import_database_desc": "قم بتحميل نسخة احتياطية بصيغة JSON لاستعادة بياناتك.",
        "delete_all_data": "حذف جميع البيانات",
        "delete_all_data_desc": "قم بإزالة جميع السجلات من قاعدة البيانات بشكل دائم (باستثناء المستخدمين). لا يمكن التراجع عن هذا الإجراء.",
        "delete_all_data_confirm": "هل أنت متأكد تمامًا من رغبتك في حذف جميع بيانات قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.",
        "live_preview": "معاينة حية",
        "options": "الخيارات",
        "company_logo": "شعار الشركة",
        "upload_logo": "رفع الشعار",
        "accent_color": "اللون المميز",
        "footer_text": "نص تذييل الفاتورة",
        "notice_text": "ملاحظة هامة",
        "contact_text": "سطر التواصل",
        "thank_you_message": "رسالة الشكر",
        "visible_columns": "الأعمدة الظاهرة",
        "show_warranty": "إظهار الضمان",
        "show_salesperson": "إظهار البائع",
        "show_discount": "إظهار الخصم",
        "changes_saved": "تم حفظ التغييرات تلقائيًا.",
        "website_customization": "تخصيص الموقع",
        "hero_image": "صورة خلفية الواجهة",
        "hero_image_desc": "ستظهر هذه الصورة في الصفحة الرئيسية للموقع.",
        "qr_code_options": {
            "select_product": "اختر منتجًا للطباعة",
            "add_to_list": "إضافة إلى القائمة",
            "quantity_of_labels": "كمية الملصقات",
            "product_to_print": "المنتج للطباعة",
            "generate_and_print": "إنشاء وطباعة الملصقات",
            "no_items": "لم تتم إضافة أي عناصر إلى قائمة الطباعة."
        },
        "qr_code_modal": {
            "title": "طباعة ملصقات رمز الاستجابة السريعة",
            "company_name": "Modern House for Trading"
        }
    },
    "general": {
        "not_applicable": "غير متوفر",
        "edit": "تعديل",
        "delete": "حذف",
        "deactivate": "تعطيل",
        "activate": "تفعيل"
    }
};

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  changeLanguage: () => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language');
        if (storedLang) {
            const clean = storedLang.trim().replace(/^["']|["']$/g, '').toLowerCase();
            if (clean.startsWith('ar')) return 'ar';
            if (clean.startsWith('en')) return 'en';
        }
    }
    return 'ar';
  });

  const translations = useMemo(() => (language === 'ar' ? arTranslations : enTranslations), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = () => {
    setLanguage((prevLang) => (prevLang === 'en' ? 'ar' : 'en'));
  };

  const t = useCallback((key: string, params?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    
    const getNestedValue = (obj: any, pathKeys: string[]) => {
      let current = obj;
      for (const k of pathKeys) {
        if (current === undefined || current === null) return undefined;
        current = current[k];
      }
      return current;
    };

    // 1. Try to fetch from the active selected language dictionary
    let result = getNestedValue(translations, keys);

    // 2. Fallback to other dictionary
    if (result === undefined) {
      const fallbackDict = translations === arTranslations ? enTranslations : arTranslations;
      result = getNestedValue(fallbackDict, keys);
    }

    // 3. Last fallback: Human friendly wording from the final subkey
    if (result === undefined) {
      const lastPart = keys[keys.length - 1];
      return lastPart
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    let strResult = String(result);
    if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
            strResult = strResult.replace(`{{${paramKey}}}`, String(paramValue));
        });
    }

    return strResult;
  }, [translations]);

  const formatCurrency = useCallback((amount: number) => {
    return formatCurrencyUtil(amount, language);
  }, [language]);
  
  const formatDate = useCallback((dateString: string) => {
    return formatDateUtil(dateString, language);
  }, [language]);

  const formatTime = useCallback((dateString: string) => {
    return formatTimeUtil(dateString, language);
  }, [language]);

  const value = useMemo(() => ({ language, changeLanguage, t, formatCurrency, formatDate, formatTime }), [language, changeLanguage, t, formatCurrency, formatDate, formatTime]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
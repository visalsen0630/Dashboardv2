import { useState, useEffect } from "react";
import { getConfig, setConfig } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import {
  FaPrint, FaDesktop, FaMousePointer, FaPlus, FaEdit, FaTrash, FaSave,
  FaChevronDown, FaChevronRight, FaCopy, FaGripVertical, FaToggleOn, FaToggleOff
} from 'react-icons/fa';

export default function POSConfig() {
  const [activeTab, setActiveTab] = useState('printer');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
  const selectedLocationId = localStorage.getItem("selectedLocationId");

  // Printer configuration state
  const [printerConfig, setPrinterConfig] = useState({
    printer_name: '',
    printer_type: 'thermal',
    paper_size: '80mm',
    auto_print: false,
    print_copies: 1,
    show_logo: true,
    show_footer: true,
    footer_text: 'Thank you for your purchase!',
    ip_address: '',
    port: ''
  });

  // Second Screen configuration state
  const [secondScreenConfig, setSecondScreenConfig] = useState({
    enabled: false,
    display_mode: 'mirror',
    show_cart: true,
    show_total: true,
    show_logo: true,
    background_color: '#ffffff',
    text_color: '#000000',
    font_size: 'medium',
    idle_message: 'Welcome!',
    show_advertisements: false,
    advertisement_interval: 5
  });

  // Action Button configuration state - NEW STRUCTURE
  const [actionButtons, setActionButtons] = useState([]);
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [showSubButtonModal, setShowSubButtonModal] = useState(false);
  const [editingButton, setEditingButton] = useState(null);
  const [editingSubButton, setEditingSubButton] = useState(null);
  const [parentButtonId, setParentButtonId] = useState(null);
  const [expandedButtons, setExpandedButtons] = useState({});

  // Button form state - Enhanced
  const [buttonForm, setButtonForm] = useState({
    label: '',
    icon: 'tag',
    color: '#3B82F6',
    position: 1,
    page: 'pos', // pos, dashboard, checkout
    button_type: 'single', // single, parent
    action_type: 'open_modal',
    action_config: {},
    is_active: true,
    sub_buttons: []
  });

  // Sub-button form state
  const [subButtonForm, setSubButtonForm] = useState({
    label: '',
    icon: 'tag',
    color: '#3B82F6',
    position: 1,
    action_type: 'open_modal',
    action_config: {},
    is_active: true
  });

  // Action Types Configuration
  const actionTypes = [
    {
      value: 'open_modal',
      label: 'Open Modal',
      description: 'Opens a modal dialog',
      configFields: ['modal_type']
    },
    {
      value: 'search_member',
      label: 'Search Member',
      description: 'Opens member search modal',
      configFields: []
    },
    {
      value: 'discount_percent',
      label: 'Discount by %',
      description: 'Apply percentage discount',
      configFields: ['show_input', 'default_value', 'max_value']
    },
    {
      value: 'discount_fixed',
      label: 'Discount by Fixed Amount',
      description: 'Apply fixed amount discount',
      configFields: ['show_input', 'default_value', 'currency']
    },
    {
      value: 'scan_barcode',
      label: 'Scan Barcode/QR',
      description: 'Opens scanner for barcode or QR code',
      configFields: ['scan_type', 'target']
    },
    {
      value: 'manual_code_input',
      label: 'Manual Code Input',
      description: 'Input code manually (voucher, coupon, etc.)',
      configFields: ['code_type', 'placeholder']
    },
    {
      value: 'navigate',
      label: 'Navigate to Page',
      description: 'Navigate to another page',
      configFields: ['target_page', 'open_in_new_tab']
    },
    {
      value: 'trigger_calculation',
      label: 'Trigger POS Calculation',
      description: 'Trigger specific calculation',
      configFields: ['calculation_type']
    },
    {
      value: 'print_receipt',
      label: 'Print Receipt',
      description: 'Print current receipt',
      configFields: ['copies', 'printer_id']
    },
    {
      value: 'open_drawer',
      label: 'Open Cash Drawer',
      description: 'Opens the cash drawer',
      configFields: []
    },
    {
      value: 'hold_order',
      label: 'Hold Order',
      description: 'Hold current order for later',
      configFields: []
    },
    {
      value: 'recall_order',
      label: 'Recall Held Order',
      description: 'Recall a held order',
      configFields: []
    },
    {
      value: 'void_item',
      label: 'Void Item',
      description: 'Void selected item',
      configFields: ['require_reason', 'require_auth']
    },
    {
      value: 'void_transaction',
      label: 'Void Transaction',
      description: 'Void entire transaction',
      configFields: ['require_reason', 'require_auth']
    },
    {
      value: 'clear_cart',
      label: 'Clear Cart',
      description: 'Clear all items from cart',
      configFields: ['require_confirmation']
    },
    {
      value: 'apply_voucher',
      label: 'Apply Voucher',
      description: 'Apply voucher code',
      configFields: ['input_method']
    },
    {
      value: 'payment_cash',
      label: 'Cash Payment',
      description: 'Open cash payment modal',
      configFields: []
    },
    {
      value: 'payment_card',
      label: 'Card Payment',
      description: 'Open card payment modal',
      configFields: []
    },
    {
      value: 'payment_qr',
      label: 'QR Payment',
      description: 'Open QR payment modal',
      configFields: ['qr_type']
    },
    {
      value: 'custom_action',
      label: 'Custom Action',
      description: 'Execute custom function',
      configFields: ['function_name', 'parameters']
    }
  ];

  // Icon options
  const iconOptions = [
    { value: 'tag', label: 'Tag', svg: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { value: 'percent', label: 'Percent', svg: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    { value: 'users', label: 'Users', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { value: 'ticket', label: 'Ticket/Voucher', svg: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { value: 'qrcode', label: 'QR Code', svg: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
    { value: 'cash', label: 'Cash', svg: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { value: 'card', label: 'Card', svg: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { value: 'printer', label: 'Printer', svg: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { value: 'trash', label: 'Trash', svg: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
    { value: 'clock', label: 'Clock', svg: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: 'search', label: 'Search', svg: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { value: 'settings', label: 'Settings', svg: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { value: 'phone', label: 'Phone/Mobile', svg: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { value: 'arrow-right', label: 'Arrow Right', svg: 'M14 5l7 7m0 0l-7 7m7-7H3' }
  ];

  // Color options
  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#F97316', label: 'Orange' },
    { value: '#6B7280', label: 'Gray' },
    { value: '#1F2937', label: 'Dark Gray' }
  ];

  // Page options
  const pageOptions = [
    { value: 'pos', label: 'POS Screen' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'checkout', label: 'Checkout' },
    { value: 'all', label: 'All Pages' }
  ];

  useEffect(() => {
    if (selectedCompanyId) {
      fetchConfigurations();
    }
  }, [selectedCompanyId, selectedLocationId]);

  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const printerRes = await getConfig(selectedCompanyId, selectedLocationId, 'printer_config');
      if (printerRes?.value) setPrinterConfig(prev => ({ ...prev, ...printerRes.value }));

      const screenRes = await getConfig(selectedCompanyId, selectedLocationId, 'second_screen_config');
      if (screenRes?.value) setSecondScreenConfig(prev => ({ ...prev, ...screenRes.value }));

      const buttonsRes = await getConfig(selectedCompanyId, selectedLocationId, 'action_buttons');
      if (buttonsRes?.value) setActionButtons(buttonsRes.value);
    } catch (err) {
      console.error("Error fetching configurations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrinterConfig = async () => {
    setSaving(true);
    try {
      await setConfig(selectedCompanyId, selectedLocationId, 'printer_config', printerConfig);
      alert('Printer configuration saved successfully!');
    } catch (err) {
      alert('Failed to save printer configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecondScreenConfig = async () => {
    setSaving(true);
    try {
      await setConfig(selectedCompanyId, selectedLocationId, 'second_screen_config', secondScreenConfig);
      alert('Second screen configuration saved successfully!');
    } catch (err) {
      alert('Failed to save second screen configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveButton = async () => {
    try {
      let updatedButtons;
      const newButton = {
        ...buttonForm,
        id: editingButton?.id || Date.now().toString(),
      };
      if (editingButton) {
        updatedButtons = actionButtons.map(b => b.id === editingButton.id ? newButton : b);
      } else {
        updatedButtons = [...actionButtons, newButton];
      }
      await setConfig(selectedCompanyId, selectedLocationId, 'action_buttons', updatedButtons);
      setActionButtons(updatedButtons);
      setShowButtonModal(false);
      setEditingButton(null);
      resetButtonForm();
    } catch (err) {
      alert('Failed to save button');
    }
  };

  const handleSaveSubButton = () => {
    const newSubButtons = [...(buttonForm.sub_buttons || [])];

    if (editingSubButton !== null) {
      newSubButtons[editingSubButton] = { ...subButtonForm };
    } else {
      newSubButtons.push({
        ...subButtonForm,
        id: Date.now(),
        position: newSubButtons.length + 1
      });
    }

    setButtonForm({ ...buttonForm, sub_buttons: newSubButtons });
    setShowSubButtonModal(false);
    setEditingSubButton(null);
    resetSubButtonForm();
  };

  const handleDeleteButton = async (id) => {
    if (confirm('Are you sure you want to delete this button?')) {
      try {
        const updatedButtons = actionButtons.filter(b => b.id !== id);
        await setConfig(selectedCompanyId, selectedLocationId, 'action_buttons', updatedButtons);
        setActionButtons(updatedButtons);
      } catch (err) {
        console.error("Error deleting button:", err);
      }
    }
  };

  const handleDeleteSubButton = (index) => {
    if (confirm('Are you sure you want to delete this sub-button?')) {
      const newSubButtons = buttonForm.sub_buttons.filter((_, i) => i !== index);
      setButtonForm({ ...buttonForm, sub_buttons: newSubButtons });
    }
  };

  const handleEditButton = (button) => {
    setEditingButton(button);
    setButtonForm({
      label: button.label,
      icon: button.icon || 'tag',
      color: button.color || '#3B82F6',
      position: button.position || 1,
      page: button.page || 'pos',
      button_type: button.button_type || 'single',
      action_type: button.action_type || 'open_modal',
      action_config: typeof button.action_config === 'string'
        ? JSON.parse(button.action_config || '{}')
        : (button.action_config || {}),
      is_active: button.is_active !== false,
      sub_buttons: typeof button.sub_buttons === 'string'
        ? JSON.parse(button.sub_buttons || '[]')
        : (button.sub_buttons || [])
    });
    setShowButtonModal(true);
  };

  const handleEditSubButton = (index) => {
    const subButton = buttonForm.sub_buttons[index];
    setEditingSubButton(index);
    setSubButtonForm({
      label: subButton.label,
      icon: subButton.icon || 'tag',
      color: subButton.color || '#3B82F6',
      position: subButton.position || index + 1,
      action_type: subButton.action_type || 'open_modal',
      action_config: subButton.action_config || {},
      is_active: subButton.is_active !== false
    });
    setShowSubButtonModal(true);
  };

  const handleToggleActive = async (button) => {
    try {
      const updatedButtons = actionButtons.map(b =>
        b.id === button.id ? { ...b, is_active: !b.is_active } : b
      );
      await setConfig(selectedCompanyId, selectedLocationId, 'action_buttons', updatedButtons);
      setActionButtons(updatedButtons);
    } catch (err) {
      console.error("Error toggling button:", err);
    }
  };

  const handleDuplicateButton = (button) => {
    setEditingButton(null);
    setButtonForm({
      ...button,
      label: `${button.label} (Copy)`,
      position: actionButtons.length + 1,
      action_config: typeof button.action_config === 'string'
        ? JSON.parse(button.action_config || '{}')
        : (button.action_config || {}),
      sub_buttons: typeof button.sub_buttons === 'string'
        ? JSON.parse(button.sub_buttons || '[]')
        : (button.sub_buttons || [])
    });
    setShowButtonModal(true);
  };

  const resetButtonForm = () => {
    setButtonForm({
      label: '',
      icon: 'tag',
      color: '#3B82F6',
      position: actionButtons.length + 1,
      page: 'pos',
      button_type: 'single',
      action_type: 'open_modal',
      action_config: {},
      is_active: true,
      sub_buttons: []
    });
  };

  const resetSubButtonForm = () => {
    setSubButtonForm({
      label: '',
      icon: 'tag',
      color: '#3B82F6',
      position: 1,
      action_type: 'open_modal',
      action_config: {},
      is_active: true
    });
  };

  const toggleExpanded = (buttonId) => {
    setExpandedButtons(prev => ({
      ...prev,
      [buttonId]: !prev[buttonId]
    }));
  };

  const getIconSvg = (iconName) => {
    const icon = iconOptions.find(i => i.value === iconName);
    return icon?.svg || iconOptions[0].svg;
  };

  // Render action config fields based on action type
  const renderActionConfigFields = (form, setForm, isSubButton = false) => {
    const actionType = actionTypes.find(a => a.value === form.action_type);
    if (!actionType || !actionType.configFields.length) return null;

    return (
      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700">Action Configuration</label>

        {actionType.configFields.includes('modal_type') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Modal Type</label>
            <select
              value={form.action_config.modal_type || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, modal_type: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Select modal type</option>
              <option value="discount">Discount Modal</option>
              <option value="voucher">Voucher Modal</option>
              <option value="member_search">Member Search</option>
              <option value="payment">Payment Modal</option>
              <option value="custom">Custom Modal</option>
            </select>
          </div>
        )}

        {actionType.configFields.includes('show_input') && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.action_config.show_input !== false}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, show_input: e.target.checked }
              })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-600">Show input field</label>
          </div>
        )}

        {actionType.configFields.includes('default_value') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Default Value</label>
            <input
              type="number"
              value={form.action_config.default_value || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, default_value: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              placeholder="e.g., 10"
            />
          </div>
        )}

        {actionType.configFields.includes('max_value') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum Value</label>
            <input
              type="number"
              value={form.action_config.max_value || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, max_value: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              placeholder="e.g., 100"
            />
          </div>
        )}

        {actionType.configFields.includes('scan_type') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Scan Type</label>
            <select
              value={form.action_config.scan_type || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, scan_type: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Select scan type</option>
              <option value="barcode">Barcode</option>
              <option value="qr">QR Code</option>
              <option value="both">Both</option>
            </select>
          </div>
        )}

        {actionType.configFields.includes('target') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Target</label>
            <select
              value={form.action_config.target || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, target: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Select target</option>
              <option value="product">Product</option>
              <option value="voucher">Voucher</option>
              <option value="member">Member Card</option>
            </select>
          </div>
        )}

        {actionType.configFields.includes('code_type') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Code Type</label>
            <select
              value={form.action_config.code_type || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, code_type: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Select code type</option>
              <option value="voucher">Voucher Code</option>
              <option value="coupon">Coupon Code</option>
              <option value="gift_card">Gift Card</option>
              <option value="member_id">Member ID</option>
            </select>
          </div>
        )}

        {actionType.configFields.includes('placeholder') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Input Placeholder</label>
            <input
              type="text"
              value={form.action_config.placeholder || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, placeholder: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              placeholder="Enter code..."
            />
          </div>
        )}

        {actionType.configFields.includes('target_page') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Target Page</label>
            <input
              type="text"
              value={form.action_config.target_page || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, target_page: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              placeholder="/checkout or https://..."
            />
          </div>
        )}

        {actionType.configFields.includes('require_confirmation') && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.action_config.require_confirmation !== false}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, require_confirmation: e.target.checked }
              })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-600">Require confirmation</label>
          </div>
        )}

        {actionType.configFields.includes('require_auth') && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.action_config.require_auth === true}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, require_auth: e.target.checked }
              })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-600">Require manager authorization</label>
          </div>
        )}

        {actionType.configFields.includes('input_method') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Input Method</label>
            <select
              value={form.action_config.input_method || ''}
              onChange={(e) => setForm({
                ...form,
                action_config: { ...form.action_config, input_method: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Select method</option>
              <option value="scan">Scan Only</option>
              <option value="manual">Manual Only</option>
              <option value="both">Scan or Manual</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">POS Configuration</h1>
          <p className="text-gray-600 mt-1">Configure printer, second screen, and action buttons for your POS terminal</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('printer')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${
                activeTab === 'printer'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaPrint /> Printer
            </button>
            <button
              onClick={() => setActiveTab('second-screen')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${
                activeTab === 'second-screen'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaDesktop /> Second Screen
            </button>
            <button
              onClick={() => setActiveTab('action-button')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${
                activeTab === 'action-button'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaMousePointer /> Action Button
            </button>
          </div>
        </div>

        {/* Printer Configuration */}
        {activeTab === 'printer' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Printer Settings</h2>
              <button
                onClick={handleSavePrinterConfig}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Printer Name</label>
                  <input
                    type="text"
                    value={printerConfig.printer_name}
                    onChange={(e) => setPrinterConfig({ ...printerConfig, printer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Receipt Printer 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Printer Type</label>
                  <select
                    value={printerConfig.printer_type}
                    onChange={(e) => setPrinterConfig({ ...printerConfig, printer_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="thermal">Thermal Printer</option>
                    <option value="inkjet">Inkjet Printer</option>
                    <option value="laser">Laser Printer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                  <select
                    value={printerConfig.paper_size}
                    onChange={(e) => setPrinterConfig({ ...printerConfig, paper_size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="58mm">58mm (2.25")</option>
                    <option value="80mm">80mm (3.15")</option>
                    <option value="A4">A4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Print Copies</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={printerConfig.print_copies}
                    onChange={(e) => setPrinterConfig({ ...printerConfig, print_copies: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                  <input
                    type="text"
                    value={printerConfig.ip_address}
                    onChange={(e) => setPrinterConfig({ ...printerConfig, ip_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., 192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="text"
                    value={printerConfig.port}
                    onChange={(e) => setPrinterConfig({ ...printerConfig, port: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., 9100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                  <textarea
                    value={printerConfig.footer_text}
                    onChange={(e) => setPrinterConfig({ ...printerConfig, footer_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows="2"
                  />
                </div>

                <div className="col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerConfig.auto_print}
                      onChange={(e) => setPrinterConfig({ ...printerConfig, auto_print: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Auto Print Receipt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerConfig.show_logo}
                      onChange={(e) => setPrinterConfig({ ...printerConfig, show_logo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Show Logo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerConfig.show_footer}
                      onChange={(e) => setPrinterConfig({ ...printerConfig, show_footer: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Show Footer</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Second Screen Configuration */}
        {activeTab === 'second-screen' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Second Screen Settings</h2>
              <button
                onClick={handleSaveSecondScreenConfig}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secondScreenConfig.enabled}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Second Screen</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Mode</label>
                  <select
                    value={secondScreenConfig.display_mode}
                    onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, display_mode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="mirror">Mirror Display</option>
                    <option value="customer_display">Customer Display</option>
                    <option value="advertisement">Advertisement Mode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                  <select
                    value={secondScreenConfig.font_size}
                    onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, font_size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={secondScreenConfig.background_color}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, background_color: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondScreenConfig.background_color}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, background_color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={secondScreenConfig.text_color}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, text_color: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondScreenConfig.text_color}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, text_color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Idle Message</label>
                  <input
                    type="text"
                    value={secondScreenConfig.idle_message}
                    onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, idle_message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Welcome!"
                  />
                </div>

                <div className="col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secondScreenConfig.show_cart}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, show_cart: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Show Cart</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secondScreenConfig.show_total}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, show_total: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Show Total</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secondScreenConfig.show_logo}
                      onChange={(e) => setSecondScreenConfig({ ...secondScreenConfig, show_logo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Show Logo</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button Configuration - Enhanced */}
        {activeTab === 'action-button' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Action Buttons</h2>
                <p className="text-sm text-gray-500">Configure buttons with single actions or parent buttons with sub-menus</p>
              </div>
              <button
                onClick={() => {
                  setEditingButton(null);
                  resetButtonForm();
                  setShowButtonModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FaPlus /> Add Button
              </button>
            </div>

            {/* Buttons List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : actionButtons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No buttons configured. Click "Add Button" to get started!
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {actionButtons.sort((a, b) => (a.position || 0) - (b.position || 0)).map((button) => {
                    const subButtons = typeof button.sub_buttons === 'string'
                      ? JSON.parse(button.sub_buttons || '[]')
                      : (button.sub_buttons || []);
                    const isParent = button.button_type === 'parent' && subButtons.length > 0;
                    const isExpanded = expandedButtons[button.id];

                    return (
                      <div key={button.id}>
                        {/* Main Button Row */}
                        <div className={`flex items-center px-4 py-3 hover:bg-gray-50 ${!button.is_active ? 'opacity-50' : ''}`}>
                          {/* Drag Handle */}
                          <div className="mr-3 text-gray-400 cursor-move">
                            <FaGripVertical />
                          </div>

                          {/* Expand/Collapse for parent buttons */}
                          <div className="w-6 mr-2">
                            {isParent && (
                              <button
                                onClick={() => toggleExpanded(button.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                              </button>
                            )}
                          </div>

                          {/* Button Preview */}
                          <div className="mr-4">
                            <button
                              style={{ backgroundColor: button.color || '#3B82F6' }}
                              className="flex items-center gap-2 px-3 py-1.5 text-white rounded text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconSvg(button.icon)} />
                              </svg>
                              {button.label}
                            </button>
                          </div>

                          {/* Button Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{button.label}</span>
                              {isParent && (
                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                  {subButtons.length} sub-buttons
                                </span>
                              )}
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded capitalize">
                                {button.page || 'pos'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {actionTypes.find(a => a.value === button.action_type)?.label || button.action_type}
                            </div>
                          </div>

                          {/* Position */}
                          <div className="px-3 text-sm text-gray-500">
                            #{button.position || '-'}
                          </div>

                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleActive(button)}
                            className={`mr-3 ${button.is_active ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            {button.is_active ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                          </button>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDuplicateButton(button)}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                              title="Duplicate"
                            >
                              <FaCopy />
                            </button>
                            <button
                              onClick={() => handleEditButton(button)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteButton(button.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        {/* Sub-buttons (if parent and expanded) */}
                        {isParent && isExpanded && (
                          <div className="bg-gray-50 border-t">
                            {subButtons.map((subBtn, idx) => (
                              <div key={subBtn.id || idx} className="flex items-center px-4 py-2 ml-12 border-l-2 border-gray-300">
                                <div className="mr-4">
                                  <button
                                    style={{ backgroundColor: subBtn.color || '#6B7280' }}
                                    className="flex items-center gap-2 px-2 py-1 text-white rounded text-xs font-medium"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconSvg(subBtn.icon)} />
                                    </svg>
                                    {subBtn.label}
                                  </button>
                                </div>
                                <div className="flex-1 text-sm text-gray-600">
                                  {actionTypes.find(a => a.value === subBtn.action_type)?.label || subBtn.action_type}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Example Configurations */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Example Button Configurations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <strong>Discount Button (Parent)</strong>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>- Search Member (search_member)</li>
                    <li>- Discount % (discount_percent)</li>
                    <li>- Discount $ (discount_fixed)</li>
                    <li>- Apply Voucher (apply_voucher)</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border">
                  <strong>Payment Button (Parent)</strong>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>- Cash (payment_cash)</li>
                    <li>- Card (payment_card)</li>
                    <li>- QR/KHQR (payment_qr)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Button Modal - Enhanced */}
        {showButtonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">
                {editingButton ? 'Edit' : 'Create'} Action Button
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Label *</label>
                    <input
                      type="text"
                      value={buttonForm.label}
                      onChange={(e) => setButtonForm({ ...buttonForm, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Discount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Type</label>
                    <select
                      value={buttonForm.button_type}
                      onChange={(e) => setButtonForm({ ...buttonForm, button_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="single">Single Action</option>
                      <option value="parent">Parent with Sub-buttons</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                    <select
                      value={buttonForm.page}
                      onChange={(e) => setButtonForm({ ...buttonForm, page: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {pageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="number"
                      min="1"
                      value={buttonForm.position}
                      onChange={(e) => setButtonForm({ ...buttonForm, position: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <div className="grid grid-cols-7 gap-1">
                      {iconOptions.map(icon => (
                        <button
                          key={icon.value}
                          onClick={() => setButtonForm({ ...buttonForm, icon: icon.value })}
                          className={`p-2 rounded border ${
                            buttonForm.icon === icon.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          title={icon.label}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.svg} />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          onClick={() => setButtonForm({ ...buttonForm, color: color.value })}
                          style={{ backgroundColor: color.value }}
                          className={`w-8 h-8 rounded-full border-2 ${
                            buttonForm.color === color.value ? 'border-gray-800 ring-2 ring-offset-2' : 'border-transparent'
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {buttonForm.button_type === 'single' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                        <select
                          value={buttonForm.action_type}
                          onChange={(e) => setButtonForm({
                            ...buttonForm,
                            action_type: e.target.value,
                            action_config: {}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {actionTypes.map(action => (
                            <option key={action.value} value={action.value}>{action.label}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {actionTypes.find(a => a.value === buttonForm.action_type)?.description}
                        </p>
                      </div>

                      {renderActionConfigFields(buttonForm, setButtonForm)}
                    </>
                  )}

                  {buttonForm.button_type === 'parent' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Sub-buttons</label>
                        <button
                          onClick={() => {
                            resetSubButtonForm();
                            setEditingSubButton(null);
                            setShowSubButtonModal(true);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Sub-button
                        </button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(buttonForm.sub_buttons || []).length === 0 ? (
                          <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded">
                            No sub-buttons yet. Add one above.
                          </div>
                        ) : (
                          buttonForm.sub_buttons.map((subBtn, idx) => (
                            <div key={subBtn.id || idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <div
                                style={{ backgroundColor: subBtn.color || '#6B7280' }}
                                className="w-3 h-3 rounded-full"
                              />
                              <span className="flex-1 text-sm">{subBtn.label}</span>
                              <span className="text-xs text-gray-500">
                                {actionTypes.find(a => a.value === subBtn.action_type)?.label}
                              </span>
                              <button
                                onClick={() => handleEditSubButton(idx)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaEdit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubButton(idx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                    <button
                      style={{ backgroundColor: buttonForm.color }}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconSvg(buttonForm.icon)} />
                      </svg>
                      {buttonForm.label || 'Button'}
                      {buttonForm.button_type === 'parent' && <FaChevronDown className="ml-1" size={12} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={buttonForm.is_active}
                      onChange={(e) => setButtonForm({ ...buttonForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowButtonModal(false);
                    setEditingButton(null);
                    resetButtonForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveButton}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingButton ? 'Update' : 'Create'} Button
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-button Modal */}
        {showSubButtonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">
                {editingSubButton !== null ? 'Edit' : 'Add'} Sub-button
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                  <input
                    type="text"
                    value={subButtonForm.label}
                    onChange={(e) => setSubButtonForm({ ...subButtonForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Discount by %"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                  <select
                    value={subButtonForm.action_type}
                    onChange={(e) => setSubButtonForm({
                      ...subButtonForm,
                      action_type: e.target.value,
                      action_config: {}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {actionTypes.map(action => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {actionTypes.find(a => a.value === subButtonForm.action_type)?.description}
                  </p>
                </div>

                {renderActionConfigFields(subButtonForm, setSubButtonForm, true)}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <div className="grid grid-cols-7 gap-1">
                    {iconOptions.slice(0, 14).map(icon => (
                      <button
                        key={icon.value}
                        onClick={() => setSubButtonForm({ ...subButtonForm, icon: icon.value })}
                        className={`p-2 rounded border ${
                          subButtonForm.icon === icon.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        title={icon.label}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.svg} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setSubButtonForm({ ...subButtonForm, color: color.value })}
                        style={{ backgroundColor: color.value }}
                        className={`w-6 h-6 rounded-full border-2 ${
                          subButtonForm.color === color.value ? 'border-gray-800' : 'border-transparent'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subButtonForm.is_active}
                    onChange={(e) => setSubButtonForm({ ...subButtonForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSubButtonModal(false);
                    setEditingSubButton(null);
                    resetSubButtonForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubButton}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSubButton !== null ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

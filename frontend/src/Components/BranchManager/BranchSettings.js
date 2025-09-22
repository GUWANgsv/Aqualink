import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BranchSettings({ branchId, branchName, showNotification }) {
  const [settings, setSettings] = useState({
    branchInfo: {
      name: branchName,
      address: '',
      phone: '',
      email: '',
      manager: '',
      operatingHours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '14:00', closed: true }
      }
    },
    inventory: {
      lowStockThreshold: 10,
      autoReorderEnabled: true,
      reorderQuantity: 50,
      supplierNotifications: true
    },
    orders: {
      autoAssignDrivers: true,
      deliveryTimeWindow: 2,
      orderConfirmationEmail: true,
      smsNotifications: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      lowStockAlerts: true,
      orderUpdates: true,
      emergencyAlerts: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branch-info');

  useEffect(() => {
    if (branchId) {
      fetchSettings();
    }
  }, [branchId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // For now, we'll use default settings since the backend doesn't have a settings endpoint yet
      // In a real application, you would fetch settings from the backend
      // const response = await axios.get(`http://localhost:5000/branches/${branchId}/settings`);
      // if (response.data.settings) {
      //   setSettings(response.data.settings);
      // }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      branchInfo: {
        ...prev.branchInfo,
        operatingHours: {
          ...prev.branchInfo.operatingHours,
          [day]: {
            ...prev.branchInfo.operatingHours[day],
            [field]: value
          }
        }
      }
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // For now, we'll simulate saving since the backend doesn't have a settings endpoint yet
      // In a real application, you would save settings to the backend
      // await axios.put(`http://localhost:5000/branches/${branchId}/settings`, { settings });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      fetchSettings();
      showNotification('Settings reset to default values.', 'success');
    }
  };

  const tabs = [
    { id: 'branch-info', name: 'Branch Information', icon: '🏢' },
    { id: 'inventory', name: 'Inventory Settings', icon: '📦' },
    { id: 'orders', name: 'Order Settings', icon: '📋' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Branch Settings</h2>
        <div className="flex space-x-3">
          <button
            onClick={resetSettings}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <nav className="p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{tab.icon}</span>
                        <span className="font-medium">{tab.name}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'branch-info' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Branch Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                    <input
                      type="text"
                      value={settings.branchInfo.name}
                      onChange={(e) => handleSettingChange('branchInfo', 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                    <input
                      type="text"
                      value={settings.branchInfo.manager}
                      onChange={(e) => handleSettingChange('branchInfo', 'manager', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={settings.branchInfo.phone}
                      onChange={(e) => handleSettingChange('branchInfo', 'phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.branchInfo.email}
                      onChange={(e) => handleSettingChange('branchInfo', 'email', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={settings.branchInfo.address}
                    onChange={(e) => handleSettingChange('branchInfo', 'address', e.target.value)}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Operating Hours</h4>
                  <div className="space-y-3">
                    {Object.entries(settings.branchInfo.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!hours.closed}
                            onChange={(e) => handleOperatingHoursChange(day, 'closed', !e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">Open</span>
                        </div>
                        {!hours.closed && (
                          <>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Inventory Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                    <input
                      type="number"
                      value={settings.inventory.lowStockThreshold}
                      onChange={(e) => handleSettingChange('inventory', 'lowStockThreshold', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Items below this quantity will trigger low stock alerts</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Quantity</label>
                    <input
                      type="number"
                      value={settings.inventory.reorderQuantity}
                      onChange={(e) => handleSettingChange('inventory', 'reorderQuantity', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default quantity to reorder when stock is low</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.inventory.autoReorderEnabled}
                      onChange={(e) => handleSettingChange('inventory', 'autoReorderEnabled', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Enable Automatic Reordering</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.inventory.supplierNotifications}
                      onChange={(e) => handleSettingChange('inventory', 'supplierNotifications', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Send Notifications to Suppliers</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Order Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time Window (hours)</label>
                    <input
                      type="number"
                      value={settings.orders.deliveryTimeWindow}
                      onChange={(e) => handleSettingChange('orders', 'deliveryTimeWindow', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Expected delivery time window for orders</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.orders.autoAssignDrivers}
                      onChange={(e) => handleSettingChange('orders', 'autoAssignDrivers', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Automatically Assign Drivers to Orders</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.orders.orderConfirmationEmail}
                      onChange={(e) => handleSettingChange('orders', 'orderConfirmationEmail', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Send Order Confirmation Emails</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.orders.smsNotifications}
                      onChange={(e) => handleSettingChange('orders', 'smsNotifications', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Send SMS Notifications</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Email Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">SMS Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.lowStockAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'lowStockAlerts', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Low Stock Alerts</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.orderUpdates}
                      onChange={(e) => handleSettingChange('notifications', 'orderUpdates', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Order Status Updates</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emergencyAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'emergencyAlerts', e.target.checked)}
                      className="rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Emergency Alerts</label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Notification Preferences</h4>
                  <p className="text-sm text-blue-700">
                    Configure how you want to receive notifications for various events. 
                    Email notifications will be sent to the branch email address, and SMS 
                    notifications will be sent to the branch phone number.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchSettings;

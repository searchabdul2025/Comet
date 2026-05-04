'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';

interface IPAddress {
  id: string;
  ip: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export default function IPManagementPage() {
  const [ips] = useState<IPAddress[]>([
    { id: '1', ip: '192.168.1.1', description: 'Main Office', status: 'Active', createdAt: '2025-01-15' },
    { id: '2', ip: '10.0.0.1', description: 'Branch Office', status: 'Active', createdAt: '2025-01-14' },
    { id: '3', ip: '172.16.0.1', description: 'Remote Worker', status: 'Active', createdAt: '2025-01-13' },
    { id: '4', ip: '192.168.1.100', description: 'Test Environment', status: 'Inactive', createdAt: '2025-01-12' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ ip: '', description: '', status: 'Active' as 'Active' | 'Inactive' });

  const handleAddIP = () => {
    setFormData({ ip: '', description: '', status: 'Active' });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this IP address?')) {
      console.log('Delete IP:', id);
    }
  };

  const handleSave = () => {
    console.log('Save IP:', formData);
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">IP Management</h1>
        <p className="text-gray-600 mb-4">Manage authorized IP addresses</p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={handleAddIP}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          Add IP
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Authorized IPs ({ips.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ips.map((ip) => (
                <tr key={ip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{ip.ip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ip.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ip.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ip.createdAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                      >
                        <Edit size={14} className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ip.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} className="inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


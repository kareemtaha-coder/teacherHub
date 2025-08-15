import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Group, PaymentRecord } from '../../types';
import { X, DollarSign, Calendar, Users, CheckCircle, XCircle, AlertCircle, Minus } from 'lucide-react';
import { formatDate } from '../../utils/generators';

interface PaymentManagementModalProps {
  group: Group;
  onClose: () => void;
}

const PaymentManagementModal: React.FC<PaymentManagementModalProps> = ({ group, onClose }) => {
  const { state, dispatch } = useApp();
  const { getStudentsInGroup, getPaymentStatusForStudentInMonth } = useDataQueries();
  
  const students = getStudentsInGroup(group.id);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [defaultAmount, setDefaultAmount] = useState(100);
  const [defaultDueDate, setDefaultDueDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0];
  });

  // Generate month options for the last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value: monthStr, label: monthLabel });
    }
    return options;
  }, []);

  // Get or create payment records for the selected month
  const paymentRecords = useMemo(() => {
    return students.map(student => {
      let existingPayment = getPaymentStatusForStudentInMonth(student.id, group.id, selectedMonth);
      
      if (!existingPayment) {
        // Create a default unpaid payment record
        existingPayment = {
          id: '',
          studentId: student.id,
          groupId: group.id,
          month: selectedMonth,
          status: 'unpaid',
          amount: defaultAmount,
          dueDate: defaultDueDate,
          notes: '',
          createdAt: new Date().toISOString()
        };
      }
      
      return {
        student,
        payment: existingPayment,
        isNew: !existingPayment.id
      };
    });
  }, [students, selectedMonth, defaultAmount, defaultDueDate, getPaymentStatusForStudentInMonth]);

  const handlePaymentStatusChange = (studentId: string, status: PaymentRecord['status']) => {
    const record = paymentRecords.find(pr => pr.student.id === studentId);
    if (!record) return;

    if (record.isNew) {
      // Create new payment record
      dispatch({
        type: 'ADD_PAYMENT',
        payload: {
          studentId: record.payment.studentId,
          groupId: record.payment.groupId,
          month: record.payment.month,
          status,
          amount: record.payment.amount,
          dueDate: record.payment.dueDate,
          notes: record.payment.notes
        }
      });
    } else {
      // Update existing payment record
      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: {
          ...record.payment,
          status
        }
      });
    }
  };

  const handleAmountChange = (studentId: string, amount: number) => {
    const record = paymentRecords.find(pr => pr.student.id === studentId);
    if (!record) return;

    if (record.isNew) {
      // Create new payment record with custom amount
      dispatch({
        type: 'ADD_PAYMENT',
        payload: {
          studentId: record.payment.studentId,
          groupId: record.payment.groupId,
          month: record.payment.month,
          status: record.payment.status,
          amount,
          dueDate: record.payment.dueDate,
          notes: record.payment.notes
        }
      });
    } else {
      // Update existing payment record
      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: {
          ...record.payment,
          amount
        }
      });
    }
  };

  const handleDueDateChange = (studentId: string, dueDate: string) => {
    const record = paymentRecords.find(pr => pr.student.id === studentId);
    if (!record) return;

    if (record.isNew) {
      // Create new payment record with custom due date
      dispatch({
        type: 'ADD_PAYMENT',
        payload: {
          studentId: record.payment.studentId,
          groupId: record.payment.groupId,
          month: record.payment.month,
          status: record.payment.status,
          amount: record.payment.amount,
          dueDate,
          notes: record.payment.notes
        }
      });
    } else {
      // Update existing payment record
      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: {
          ...record.payment,
          dueDate
        }
      });
    }
  };

  const getStatusIcon = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'waived':
        return <Minus className="h-5 w-5 text-gray-600" />;
      case 'unpaid':
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'paid':
        return 'border-green-200 bg-green-50';
      case 'partial':
        return 'border-yellow-200 bg-yellow-50';
      case 'waived':
        return 'border-gray-200 bg-gray-50';
      case 'unpaid':
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    let totalStudents = paymentRecords.length;
    let paid = 0;
    let unpaid = 0;
    let partial = 0;
    let waived = 0;
    let totalAmount = 0;
    let collectedAmount = 0;

    paymentRecords.forEach(record => {
      totalAmount += record.payment.amount;
      
      switch (record.payment.status) {
        case 'paid':
          paid++;
          collectedAmount += record.payment.amount;
          break;
        case 'partial':
          partial++;
          collectedAmount += record.payment.amount * 0.5; // Assume partial is 50%
          break;
        case 'waived':
          waived++;
          break;
        case 'unpaid':
        default:
          unpaid++;
          break;
      }
    });

    const collectionRate = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;

    return {
      totalStudents,
      paid,
      unpaid,
      partial,
      waived,
      totalAmount,
      collectedAmount,
      collectionRate
    };
  }, [paymentRecords]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Management - {group.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage payment status for {students.length} students
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Month Selection and Defaults */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {monthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Amount
                </label>
                <input
                  type="number"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Due Date
                </label>
                <input
                  type="date"
                  value={defaultDueDate}
                  onChange={(e) => setDefaultDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Statistics */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Payment Overview - {monthOptions.find(m => m.value === selectedMonth)?.label}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{paymentStats.totalStudents}</div>
                <div className="text-xs text-blue-600">Total Students</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{paymentStats.paid}</div>
                <div className="text-xs text-green-600">Paid</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-900">{paymentStats.unpaid}</div>
                <div className="text-xs text-red-600">Unpaid</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <DollarSign className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-900">{paymentStats.collectionRate.toFixed(1)}%</div>
                <div className="text-xs text-orange-600">Collection Rate</div>
              </div>
            </div>
          </div>

          {/* Student Payment Table */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Student Payment Status</h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentRecords.map((record) => (
                      <tr key={record.student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{record.student.fullName}</div>
                              {record.student.parentPhone && (
                                <div className="text-sm text-gray-500">Parent: {record.student.parentPhone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={record.payment.amount}
                            onChange={(e) => handleAmountChange(record.student.id, Number(e.target.value))}
                            min="0"
                            step="0.01"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            value={record.payment.dueDate}
                            onChange={(e) => handleDueDateChange(record.student.id, e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(record.payment.status)}
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {record.payment.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={record.payment.status}
                            onChange={(e) => handlePaymentStatusChange(record.student.id, e.target.value as PaymentRecord['status'])}
                            className="text-sm border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="waived">Waived</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagementModal; 
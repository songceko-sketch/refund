import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, CheckCircle, XCircle, ShieldCheck, PlusCircle, X, Upload, DollarSign, AlertCircle, Pencil, Save, Hourglass, Mail } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'cashapp', label: 'CashApp', icon: '💸' },
  { id: 'chime', label: 'Chime', icon: '🏦' },
  { id: 'venmo', label: 'Venmo', icon: '💳' },
  { id: 'giftcard', label: 'Gift Card', icon: '🎁' },
  { id: 'applepay', label: 'Apple Pay', icon: '🍎' },
];

export default function Dashboard({ auth }) {
  const [refunds, setRefunds] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ order_number: '', item_name: '', amount: '', reason: '', details: '', fee_accepted: false, proof_image: null });
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [withdrawForm, setWithdrawForm] = useState({ payment_method: '', payment_details: '' });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const [adminComment, setAdminComment] = useState({});
  // amountEdit: { [refundId]: { editing: bool, value: string, saving: bool } }
  const [amountEdit, setAmountEdit] = useState({});

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({ email: '', password: '' });
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  useEffect(() => {
    document.title = (auth.role === 'admin' || auth.role === 'superadmin') ? 'Admin Panel - RefundFlow' : 'My Dashboard - RefundFlow';
    fetchData();
  }, [auth]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const config = { headers: { Authorization: `Bearer ${auth.token}` } };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (auth.role === 'admin' || auth.role === 'superadmin') {
        const [refundsRes, withdrawalsRes] = await Promise.all([
          axios.get('/api/refunds', config),
          axios.get('/api/withdrawals', config),
        ]);
        setRefunds(refundsRes.data);
        setWithdrawals(withdrawalsRes.data);
      } else {
        const res = await axios.get('/api/refunds', config);
        setRefunds(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRefundForm(f => ({ ...f, proof_image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const submitRefund = async (e) => {
    e.preventDefault();
    if (!refundForm.fee_accepted) {
      setRefundError('You must agree to the $150 processing fee to continue.');
      return;
    }
    setRefundLoading(true);
    setRefundError('');
    try {
      const formData = new FormData();
      formData.append('order_number', refundForm.order_number);
      formData.append('item_name', refundForm.item_name);
      formData.append('amount', refundForm.amount);
      formData.append('reason', refundForm.reason);
      formData.append('details', refundForm.details);
      formData.append('fee_accepted', 'true');
      if (refundForm.proof_image) formData.append('proof_image', refundForm.proof_image);

      await axios.post('/api/refunds', formData, {
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'multipart/form-data' }
      });
      showToast('Refund request submitted successfully! We will review it shortly.');
      setShowRefundModal(false);
      setRefundForm({ order_number: '', item_name: '', amount: '', reason: '', details: '', fee_accepted: false, proof_image: null });
      setPreviewUrl(null);
      fetchData();
    } catch (err) {
      setRefundError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setRefundLoading(false);
    }
  };

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    if (!withdrawForm.payment_method) {
      setWithdrawError('Please select a payment method for your fee.');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError('');
    try {
      await axios.post('/api/withdrawals', { 
        refund_id: selectedRefund.id,
        payment_method: withdrawForm.payment_method,
        payment_details: withdrawForm.payment_details
      }, config);
      showToast('✅ Request submitted! Admin will see your payment choice and reply shortly.');
      setShowWithdrawModal(false);
      setWithdrawForm({ payment_method: '', payment_details: '' });
      fetchData();
    } catch (err) {
      setWithdrawError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const startAmountEdit = (refundId, currentAmount) => {
    setAmountEdit(prev => ({ ...prev, [refundId]: { editing: true, value: currentAmount.toFixed(2), saving: false } }));
  };

  const saveAmount = async (refundId) => {
    const entry = amountEdit[refundId];
    if (!entry || isNaN(entry.value) || parseFloat(entry.value) <= 0) {
      showToast('Enter a valid amount.', 'error');
      return;
    }
    setAmountEdit(prev => ({ ...prev, [refundId]: { ...prev[refundId], saving: true } }));
    try {
      await axios.put(`/api/refunds/${refundId}/amount`, { amount: parseFloat(entry.value) }, config);
      showToast('💰 Amount updated & user notified by email.');
      setAmountEdit(prev => ({ ...prev, [refundId]: { editing: false, value: '', saving: false } }));
      fetchData();
    } catch {
      showToast('Failed to update amount.', 'error');
      setAmountEdit(prev => ({ ...prev, [refundId]: { ...prev[refundId], saving: false } }));
    }
  };

  const updateRefundStatus = async (id, status) => {
    setActionLoading(`refund-${id}`);
    try {
      await axios.put(`/api/refunds/${id}`, { status, comment: adminComment[`refund-${id}`] || '' }, config);
      showToast(`Refund ${status.toLowerCase()} successfully. Email notification sent.`);
      fetchData();
    } catch {
      showToast('Failed to update.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const updateWithdrawalStatus = async (id, status) => {
    setActionLoading(`withdraw-${id}`);
    try {
      await axios.put(`/api/withdrawals/${id}`, { status, admin_reply: adminComment[`withdraw-${id}`] || '' }, config);
      showToast(`Withdrawal ${status.toLowerCase()}.`);
      fetchData();
    } catch {
      showToast('Failed to update.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddAdminLoading(true);
    try {
      await axios.post('/api/auth/admin', addAdminForm, config);
      showToast('New sub-admin registered successfully!');
      setShowAddAdminModal(false);
      setAddAdminForm({ email: '', password: '' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add admin', 'error');
    } finally {
      setAddAdminLoading(false);
    }
  };

  const testEmail = async () => {
    setActionLoading('test-email');
    try {
      const res = await axios.get('/api/admin/test-email', config);
      showToast(res.data.message);
    } catch (err) {
      showToast(err.response?.data?.error || 'SMTP Test Failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Approved': 'bg-green-100 text-green-800 border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Awaiting Payment': 'bg-blue-100 text-blue-800 border-blue-200',
      'Pending Instructions': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    const icons = {
      'Approved': <CheckCircle className="w-3.5 h-3.5 mr-1" />,
      'Rejected': <XCircle className="w-3.5 h-3.5 mr-1" />,
      'Pending': <Clock className="w-3.5 h-3.5 mr-1" />,
      'Awaiting Payment': <Hourglass className="w-3.5 h-3.5 mr-1" />,
      'Pending Instructions': <Clock className="w-3.5 h-3.5 mr-1" />,
    };
    const label = status === 'Pending Instructions' ? 'Awaiting Instructions' : status;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || map['Pending']}`}>
        {icons[status] || icons['Pending']}{label}
      </span>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-medium animate-fade-in-up border
          ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {/* ========== USER VIEW ========== */}
      {(auth.role !== 'admin' && auth.role !== 'superadmin') && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" /> My Refunds
              </h1>
              <p className="text-slate-500 mt-1">Track the status of your reported orders and refunds.</p>
            </div>
            <button
              onClick={() => { setRefundError(''); setShowRefundModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white bg-primary hover:bg-blue-600 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" /> Request a Refund
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            {refunds.length === 0 ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                <img src="/images/empty.png" alt="Empty box" className="w-48 h-48 mb-6 drop-shadow-xl" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">You haven't requested any refunds yet.</h3>
                <p className="max-w-sm">Having an issue with an arbitrary order? Click the button above to request your money back.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Order #</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Item Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Amount</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Date Posted</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refunds.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{r.order_number}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{r.item_name}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">${r.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                        <td className="px-6 py-4 text-right">
                          {r.status === 'Approved' && !r.withdrawal && (
                            <button
                              onClick={() => { setSelectedRefund(r); setWithdrawError(''); setShowWithdrawModal(true); }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 shadow-md transition-all transform hover:scale-105"
                            >
                              <DollarSign className="w-4 h-4" /> Withdraw Funds
                            </button>
                          )}
                          {r.status === 'Approved' && r.withdrawal && (
                            <div className="text-right space-y-1">
                              {getStatusBadge(r.withdrawal.status === 'Pending' ? 'Pending Instructions' : r.withdrawal.status)}
                              {r.withdrawal.status === 'Awaiting Payment' && r.withdrawal.admin_reply && (
                                <div className="mt-2 text-left bg-amber-50 border border-amber-200 rounded-xl p-2.5 max-w-xs ml-auto">
                                  <p className="text-xs font-bold text-amber-800 mb-1">📋 Payment Instructions:</p>
                                  <p className="text-xs text-amber-700 font-mono whitespace-pre-wrap">{r.withdrawal.admin_reply}</p>
                                </div>
                              )}
                              {r.withdrawal.status === 'Approved' && (
                                <p className="text-xs text-green-600 font-semibold">✅ Funds Released!</p>
                              )}
                            </div>
                          )}
                          {(r.status === 'Pending' || r.status === 'Rejected') && (
                            <span className="text-xs text-slate-400 italic">{r.status === 'Pending' ? 'Under Review' : 'Closed'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {refunds.some(r => r.status === 'Approved' && !r.withdrawal) && (
          <div className="glass-card rounded-2xl p-6 border-l-4 border-green-500 bg-green-50/50">
              <h3 className="font-bold text-green-800 text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Refund Approved – Withdraw Now
              </h3>
              <p className="text-green-700 text-sm mt-1">
                You have an approved refund ready. Click <strong>"Withdraw Funds"</strong> to notify your admin. They will send you payment instructions by email.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========== ADMIN VIEW ========== */}
      {(auth.role === 'admin' || auth.role === 'superadmin') && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary" /> {auth.role === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}
              </h1>
              <p className="text-slate-500 mt-1">Manage global refunds and custom withdrawals.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testEmail}
                disabled={actionLoading === 'test-email'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-amber-700 bg-amber-100 hover:bg-amber-200 font-semibold shadow-sm transition-all"
              >
                <Mail className="w-5 h-5" /> {actionLoading === 'test-email' ? 'Testing...' : 'Test SMTP Connection'}
              </button>
              {auth.role === 'superadmin' && (
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 font-semibold shadow-sm transition-all"
                >
                  <PlusCircle className="w-5 h-5" /> Add Sub-Admin
                </button>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Refund Requests</h2>
            <div className="glass-card rounded-2xl overflow-hidden">
              {refunds.length === 0 ? <div className="p-12 text-center text-slate-400">No records found.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Order / Item</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Amount</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Problem</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {refunds.map(r => (
                        <tr key={r.id}>
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">{r.email}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-800">{r.item_name}</div>
                            <div className="text-xs text-slate-500">Order #{r.order_number}</div>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const ae = amountEdit[r.id];
                              if (ae && ae.editing) {
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 text-sm">$</span>
                                    <input
                                      type="number" step="0.01" min="0"
                                      className="w-24 text-sm px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                      value={ae.value}
                                      onChange={e => setAmountEdit(prev => ({ ...prev, [r.id]: { ...prev[r.id], value: e.target.value } }))}
                                      onKeyDown={e => e.key === 'Enter' && saveAmount(r.id)}
                                      autoFocus
                                    />
                                    <button onClick={() => saveAmount(r.id)} disabled={ae.saving} title="Save" className="p-1 rounded-lg text-green-600 hover:bg-green-50">
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setAmountEdit(prev => ({ ...prev, [r.id]: { editing: false } }))} title="Cancel" className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex items-center gap-2 group">
                                  <span className="text-sm font-bold text-green-700">${r.amount.toFixed(2)}</span>
                                  <button onClick={() => startAmountEdit(r.id, r.amount)} title="Edit amount" className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-sm max-w-[200px] truncate" title={r.details}>
                            <div className="font-semibold">{r.reason}</div>
                            <div className="text-slate-500">{r.details}</div>
                            {r.proof_image && <a href={`/uploads/${r.proof_image}`} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs mt-1 block">Proof attached</a>}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                          <td className="px-6 py-4">
                            {r.status === 'Pending' ? (
                              <div className="space-y-2 min-w-[200px]">
                                <input type="text" placeholder="Comment..." className="w-full text-xs px-2 py-1.5 border" value={adminComment[`refund-${r.id}`] || ''} onChange={e => setAdminComment(p => ({ ...p, [`refund-${r.id}`]: e.target.value }))} />
                                <div className="flex gap-1">
                                  <button onClick={() => updateRefundStatus(r.id, 'Approved')} className="flex-1 py-1 text-xs bg-green-100 text-green-700">Approve</button>
                                  <button onClick={() => updateRefundStatus(r.id, 'Rejected')} className="flex-1 py-1 text-xs bg-red-100 text-red-700">Reject</button>
                                </div>
                              </div>
                            ) : <span className="text-slate-400 text-sm italic">Done</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
             <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Withdrawals</h2>
             <div className="glass-card rounded-2xl overflow-hidden">
               {withdrawals.length === 0 ? <div className="p-12 text-center text-slate-400">Empty list.</div> : (
                  <table className="w-full text-left">
                     <thead>
                       <tr className="bg-slate-50 border-b">
                          <th className="px-6 py-4 text-sm font-semibold">User &amp; Choice</th>
                          <th className="px-6 py-4 text-sm font-semibold">Item &amp; Amount</th>
                          <th className="px-6 py-4 text-sm font-semibold">Status</th>
                          <th className="px-6 py-4 text-sm font-semibold">Admin Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y">
                        {withdrawals.map(w => (
                          <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-800">{w.email}</div>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                  Fee via: {w.payment_method}
                                </span>
                                <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]" title={w.payment_details}>
                                  Details: {w.payment_details}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800">{w.item_name}</div>
                              {(() => {
                                const ae = amountEdit[`w-${w.refund_id}`];
                                if (ae && ae.editing) {
                                  return (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-slate-400 text-sm">$</span>
                                      <input type="number" step="0.01" min="0" autoFocus
                                        className="w-24 text-sm px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={ae.value}
                                        onChange={e => setAmountEdit(prev => ({ ...prev, [`w-${w.refund_id}`]: { ...prev[`w-${w.refund_id}`], value: e.target.value } }))}
                                        onKeyDown={e => e.key === 'Enter' && saveAmount(w.refund_id)}
                                      />
                                      <button onClick={() => saveAmount(w.refund_id)} disabled={ae.saving} title="Save" className="p-1 rounded-lg text-green-600 hover:bg-green-50"><Save className="w-4 h-4" /></button>
                                      <button onClick={() => setAmountEdit(prev => ({ ...prev, [`w-${w.refund_id}`]: { editing: false } }))} title="Cancel" className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="flex items-center gap-2 group mt-1">
                                    <span className="font-bold text-green-600">${w.amount.toFixed(2)}</span>
                                    <button onClick={() => setAmountEdit(prev => ({ ...prev, [`w-${w.refund_id}`]: { editing: true, value: w.amount.toFixed(2), saving: false } }))} title="Edit amount" className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(w.status)}</td>
                            <td className="px-6 py-4">
                              {w.status !== 'Approved' && w.status !== 'Rejected' ? (
                                <div className="space-y-2 min-w-[220px]">
                                  <textarea
                                    rows={2}
                                    placeholder="Enter Payment Tags / Instructions here (e.g. Send to CashApp: $AdminTag)..."
                                    className="w-full text-xs px-3 py-2 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    value={adminComment[`withdraw-${w.id}`] || ''}
                                    onChange={e => setAdminComment(p => ({ ...p, [`withdraw-${w.id}`]: e.target.value }))}
                                  />
                                  <div className="flex gap-1.5">
                                    {w.status === 'Pending' && (
                                      <button
                                        onClick={() => updateWithdrawalStatus(w.id, 'Awaiting Payment')}
                                        disabled={actionLoading === `withdraw-${w.id}`}
                                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                      >Send Instructions</button>
                                    )}
                                    <button
                                      onClick={() => updateWithdrawalStatus(w.id, 'Approved')}
                                      disabled={actionLoading === `withdraw-${w.id}`}
                                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                    >Approve</button>
                                    <button
                                      onClick={() => updateWithdrawalStatus(w.id, 'Rejected')}
                                      disabled={actionLoading === `withdraw-${w.id}`}
                                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                    >Reject</button>
                                  </div>
                                </div>
                              ) : <span className="text-slate-400 text-sm italic">Done</span>}
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
               )}
             </div>
          </div>

          {/* ========== NEW ADD ADMIN MODAL ========== */}
          {showAddAdminModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in-up">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">New Administrator</h2>
                    <p className="text-slate-500 text-xs mt-1">This user will have access to process tickets.</p>
                  </div>
                  <button onClick={() => setShowAddAdminModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleAddAdmin} className="px-6 py-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input type="email" required className="w-full px-3 py-2 border rounded-xl" value={addAdminForm.email} onChange={e => setAddAdminForm({ ...addAdminForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Temporary Password</label>
                    <input type="password" required className="w-full px-3 py-2 border rounded-xl" value={addAdminForm.password} onChange={e => setAddAdminForm({ ...addAdminForm, password: e.target.value })} />
                  </div>
                  <button type="submit" disabled={addAdminLoading} className="w-full py-3 rounded-xl text-white font-bold bg-primary hover:bg-blue-600">
                    {addAdminLoading ? 'Creating...' : 'Create Admin Account'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== NEW REFUND MODAL ========== */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-8 animate-fade-in-up flex flex-col">
            <div className="px-8 pt-8 pb-4 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Request a Refund</h2>
                <p className="text-slate-500 text-sm mt-1">Please enter the details of the affected order.</p>
              </div>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={submitRefund} className="px-8 py-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Arbitrary Order Number / ID</label>
                  <input
                    type="text"
                    required
                    className="block w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-primary"
                    placeholder="e.g. #ORD-12345"
                    value={refundForm.order_number}
                    onChange={e => setRefundForm(f => ({ ...f, order_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item / Product Name</label>
                  <input
                    type="text"
                    required
                    className="block w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-primary"
                    placeholder="e.g. Leather Jacket"
                    value={refundForm.item_name}
                    onChange={e => setRefundForm(f => ({ ...f, item_name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Order Final Amount ($)</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><DollarSign className="w-5 h-5 text-slate-400" /></div>
                   <input
                     type="number"
                     step="0.01"
                     required
                     className="block w-full pl-11 pr-4 py-3 border rounded-xl bg-slate-50 focus:ring-primary"
                     placeholder="0.00"
                     value={refundForm.amount}
                     onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))}
                   />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Refund</label>
                <select
                  required
                  className="block w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-primary"
                  value={refundForm.reason}
                  onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))}
                >
                  <option value="" disabled>Select a reason…</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Not as Described">Not as Described</option>
                  <option value="Arrived Late">Arrived Late</option>
                  <option value="Changed Mind">Changed Mind</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Describe Your Issue</label>
                <textarea
                  required
                  rows={3}
                  className="block w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-primary resize-y"
                  placeholder="Give us as much detail as possible about the issue…"
                  value={refundForm.details}
                  onChange={e => setRefundForm(f => ({ ...f, details: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Proof (Image — Optional)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl bg-slate-50 cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                  {previewUrl ? <img src={previewUrl} alt="Preview" className="h-24 object-contain rounded-lg" /> :
                    <div className="text-center text-slate-500">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">Click to upload image</p>
                    </div>}
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-800">$150.00 Processing Fee Required</h4>
                    <p className="text-xs text-amber-700 mt-1 mb-3">When your refund is approved, a one-time processing fee of $150.00 is required before the amount is released to your account.</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-amber-600" checked={refundForm.fee_accepted} onChange={e => setRefundForm(f => ({ ...f, fee_accepted: e.target.checked }))} />
                      <span className="text-sm font-bold text-amber-800">I explicitly agree to pay the $150 fee.</span>
                    </label>
                  </div>
                </div>
              </div>

              {refundError && <div className="text-red-600 text-sm p-3 bg-red-50 rounded-xl">{refundError}</div>}
              <button type="submit" disabled={refundLoading} className="w-full py-4 rounded-xl text-white font-bold bg-primary hover:bg-blue-600 transition-all font-lg shadow-lg">{refundLoading ? 'Submitting…' : 'Submit Refund Request'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ========== WITHDRAWAL MODAL ========== */}
      {showWithdrawModal && selectedRefund && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up">
            <div className="px-8 pt-8 pb-4 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Request Withdrawal</h2>
                <p className="text-slate-500 text-sm mt-1">Notify your admin you are ready to receive funds.</p>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-700 p-1"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={submitWithdrawal} className="px-8 py-6 space-y-6">
              {/* Summary card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Approved Refund</p>
                <p className="text-slate-800 font-semibold text-base">{selectedRefund.item_name}</p>
                <p className="text-3xl font-extrabold text-green-700 mt-1">${selectedRefund.amount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Choose Your Method to Pay the $150 Fee</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {PAYMENT_METHODS.map(pm => (
                    <button 
                      type="button" 
                      key={pm.id} 
                      onClick={() => setWithdrawForm(f => ({ ...f, payment_method: pm.id }))} 
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-tighter transition-all ${withdrawForm.payment_method === pm.id ? 'border-primary bg-blue-50 text-primary shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <span className="text-xl">{pm.icon}</span>{pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {withdrawForm.payment_method && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {withdrawForm.payment_method === 'cashapp' ? 'Your $Cashtag' : 
                     withdrawForm.payment_method === 'chime' ? 'Chime Email/Phone' : 
                     withdrawForm.payment_method === 'venmo' ? '@VenmoUsername' : 
                     withdrawForm.payment_method === 'giftcard' ? 'Gift Card Details / Brand' : 
                     'Apple Pay Phone/Email'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Provide details so admin can verify your payment..."
                    className="block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50" 
                    value={withdrawForm.payment_details} 
                    onChange={e => setWithdrawForm(f => ({ ...f, payment_details: e.target.value }))} 
                  />
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                <p className="font-bold mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Next Steps:</p>
                <p>After you submit, your admin will verify your chosen payment method and send specific instructions to your email.</p>
              </div>

              {withdrawError && <div className="text-red-600 text-sm p-3 bg-red-50 rounded-xl">{withdrawError}</div>}
              <button
                type="submit"
                disabled={withdrawLoading}
                className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-base"
              >
                {withdrawLoading ? 'Submitting...' : 'Submit Payment Choice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

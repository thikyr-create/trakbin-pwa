"use client";
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BillingCard() {
  const router = useRouter();
  const { building, invoiceCount, setShowAutopay } = useCaretakerSession();
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!building) return;

    const fetchInvoices = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('building_id', building.custom_id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });
      
      setOutstandingInvoices(data || []);
      setLoading(false);
    };

    fetchInvoices();
  }, [building]);

  if (!building || loading) return null;

  const isPaid = building.payment_status === 'paid' && outstandingInvoices.length === 0;
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const oldestInvoice = outstandingInvoices[0];
  
  // Calculate if overdue
  const isOverdue = oldestInvoice && new Date(oldestInvoice.due_date) < new Date();

  return (
    <div 
      className="group relative bg-white rounded-2xl shadow-sm border border-green-100 p-6 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg hover:border-green-500 cursor-pointer" 
      onClick={() => router.push("/caretaker-dashboard/payment")}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-green-50 p-3 rounded-xl">
          <CreditCard className="w-6 h-6 text-green-600" />
        </div>
        {isPaid ? (
          <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
        ) : (
          <span className={`${isOverdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5`}>
            {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>} 
            {isOverdue ? 'Overdue' : 'Outstanding'}
          </span>
        )}
      </div>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Billing</h3>
      {!isPaid && <p className="text-xs text-gray-400 mt-1 font-semibold">Outstanding Balance</p>}
      <p className="text-4xl font-bold tracking-tight text-gray-900 mt-1">
        {isPaid ? 'Paid' : `₦${totalOutstanding.toLocaleString()}`}
      </p>
      <p className="text-sm text-gray-700 mt-2 font-semibold">
        {isPaid 
          ? `Next payment: ${building.next_billing_date ? new Date(building.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not scheduled'}` 
          : oldestInvoice 
            ? `${isOverdue ? 'Payment overdue •' : 'Due'} ${new Date(oldestInvoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'No invoices due'}
      </p>
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="font-semibold">Invoices: {invoiceCount.paid} Paid, {outstandingInvoices.length} Due</span>
      </div>
      <div className="mt-4 flex items-center gap-1 text-sm font-bold text-green-600">
        <span>{isPaid ? 'View Receipt' : 'View Invoice'}</span>
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
      {!isPaid && (
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAutopay(true); }} 
          className="mt-4 w-full py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
        >
           Set Autopay
        </button>
      )}
    </div>
  );
}
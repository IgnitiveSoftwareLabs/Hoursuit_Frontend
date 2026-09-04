import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Add,
  ReceiptLong,
  LocalShipping,
  AssignmentReturn,
  AccountBalance,
} from '@mui/icons-material';
import {
  useGetVendorRefundsQuery,
  useGetVendorRefundByIdQuery,
  useCreateVendorRefundMutation,
} from '../RTK/services/vendorRefundApi';
import { useGetDebitNotesQuery, useLazyGetDebitNoteByIdQuery } from '../RTK/services/debitNoteApi';
import { useGetVendorsQuery } from '../RTK/services/vendorApi';
import { useGetChartOfAccountsQuery } from '../RTK/services/chartOfAccountApi';
import { useGetSubsidiariesQuery } from '../RTK/services/subsdiaryApi';
import { useGetClassesQuery } from '../RTK/services/classApi';
import { useGetDepartmentsQuery } from '../RTK/services/departmentApi';
import { useGetCitiesQuery } from '../RTK/services/cityApi';
import { useGetCurrenciesQuery } from '../RTK/services/currencyApi';
import { useGetJournalEntryByIdQuery } from '../RTK/services/journalEntryApi';
import RecordPageLayout, { RecordSection } from './Layout/RecordPageLayout';
import { GLImpactSubtab, GLEntry } from './Layout/GLImpactSubtab';
import toast from 'react-hot-toast';

export const VendorRefundComp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'VIEW'>('LIST');
  const [selectedRefundId, setSelectedRefundId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Form states
  const [vendorId, setVendorId] = useState<string>('');
  const [vendorCreditId, setVendorCreditId] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [refundDate, setRefundDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [paymentMode, setPaymentMode] = useState<string>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [subsidiaryId, setSubsidiaryId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // API Queries
  const { data: refundsData, isLoading: isRefundsLoading, refetch: refetchRefunds } = useGetVendorRefundsQuery({});
  const { data: singleRefundData } = useGetVendorRefundByIdQuery(selectedRefundId || 0, {
    skip: !selectedRefundId,
  });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: debitNotesData } = useGetDebitNotesQuery({ limit: 100 });
  const { data: coaData } = useGetChartOfAccountsQuery(undefined);
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);

  const numRefundId = Number(selectedRefundId);
  const isValidRefundId = Boolean(selectedRefundId && !isNaN(numRefundId) && numRefundId > 0);
  const { data: journalEntryData } = useGetJournalEntryByIdQuery(
    { id: numRefundId || 0, source: 'vendorrefund' },
    { skip: !isValidRefundId || viewMode !== 'VIEW' }
  );

  const [createVendorRefund, { isLoading: isCreating }] = useCreateVendorRefundMutation();
  const [triggerGetDebitNoteById] = useLazyGetDebitNoteByIdQuery();

  const vendors = useMemo(() => {
    if (Array.isArray(vendorsData?.result)) return vendorsData.result;
    if (Array.isArray(vendorsData?.data)) return vendorsData.data;
    if (Array.isArray(vendorsData?.result?.rows)) return vendorsData.result.rows;
    if (Array.isArray(vendorsData)) return vendorsData;
    return [];
  }, [vendorsData]);

  const allDebitNotes = useMemo(() => {
    if (Array.isArray(debitNotesData?.result)) return debitNotesData.result;
    if (Array.isArray(debitNotesData?.data)) return debitNotesData.data;
    if (Array.isArray(debitNotesData?.result?.rows)) return debitNotesData.result.rows;
    if (Array.isArray(debitNotesData?.result?.debitNotes)) return debitNotesData.result.debitNotes;
    if (Array.isArray(debitNotesData?.rows)) return debitNotesData.rows;
    if (Array.isArray(debitNotesData)) return debitNotesData;
    return [];
  }, [debitNotesData]);

  const accounts = useMemo(() => {
    if (Array.isArray(coaData?.result)) return coaData.result;
    if (Array.isArray(coaData?.data)) return coaData.data;
    if (Array.isArray(coaData)) return coaData;
    return [];
  }, [coaData]);

  const subsidiaries = useMemo(() => {
    if (Array.isArray(subsidiariesData?.result)) return subsidiariesData.result;
    if (Array.isArray(subsidiariesData?.data)) return subsidiariesData.data;
    if (Array.isArray(subsidiariesData)) return subsidiariesData;
    return [];
  }, [subsidiariesData]);

  const classesList = useMemo(() => {
    if (Array.isArray(classesData?.result)) return classesData.result;
    if (Array.isArray(classesData?.data)) return classesData.data;
    if (Array.isArray(classesData)) return classesData;
    return [];
  }, [classesData]);

  const departmentsList = useMemo(() => {
    if (Array.isArray(departmentsData?.result)) return departmentsData.result;
    if (Array.isArray(departmentsData?.data)) return departmentsData.data;
    if (Array.isArray(departmentsData)) return departmentsData;
    return [];
  }, [departmentsData]);

  const citiesList = useMemo(() => {
    if (Array.isArray(citiesData?.result)) return citiesData.result;
    if (Array.isArray(citiesData?.data)) return citiesData.data;
    if (Array.isArray(citiesData)) return citiesData;
    return [];
  }, [citiesData]);

  const currencies = useMemo(() => {
    if (Array.isArray(currenciesData?.result)) return currenciesData.result;
    if (Array.isArray(currenciesData?.data)) return currenciesData.data;
    if (Array.isArray(currenciesData)) return currenciesData;
    return [];
  }, [currenciesData]);

  const refundsList = useMemo(() => {
    if (Array.isArray(refundsData?.result)) return refundsData.result;
    if (Array.isArray(refundsData?.data)) return refundsData.data;
    if (Array.isArray(refundsData?.result?.rows)) return refundsData.result.rows;
    if (Array.isArray(refundsData?.result?.vendorRefunds)) return refundsData.result.vendorRefunds;
    if (Array.isArray(refundsData?.rows)) return refundsData.rows;
    if (Array.isArray(refundsData)) return refundsData;
    return [];
  }, [refundsData]);

  // Filter bank/cash accounts
  const bankAccounts = useMemo(() => {
    return accounts.filter((a: any) => {
      const typeName = (a.accountType?.account_type_name || a.account_type || '').toLowerCase();
      const accName = (a.account_name || a.name || '').toLowerCase();
      return typeName.includes('bank') || typeName.includes('cash') || typeName.includes('asset') || accName.includes('bank') || accName.includes('cash');
    });
  }, [accounts]);

  // Default select first bank account if available
  useEffect(() => {
    if (!bankAccountId && bankAccounts.length > 0) {
      setBankAccountId(String(bankAccounts[0].id));
    }
  }, [bankAccounts, bankAccountId]);

  const getVendorDisplayName = (vendorObj: any) => {
    if (!vendorObj) return '—';
    const name =
      vendorObj.vendor_name ||
      vendorObj.company_name ||
      vendorObj.vendorName ||
      vendorObj.name ||
      vendorObj.legal_name ||
      vendorObj.vendor_title ||
      '';
    const code = vendorObj.vendor_code || vendorObj.entity_id ? `(${vendorObj.vendor_code || vendorObj.entity_id})` : '';
    return `${name} ${code}`.trim() || (name || `Vendor #${vendorObj.id || ''}`);
  };

  const autofillClassAndDepartment = (subId: string) => {
    if (!subId) {
      setClassId('');
      setDepartmentId('');
      return;
    }
    const matchingClasses = classesList.filter(
      (c: any) => String(c.subsidiary_id ?? c.subsidiaryId ?? c.subsidiary?.id ?? '') === String(subId)
    );
    if (matchingClasses.length > 0) {
      setClassId(String(matchingClasses[0].id));
    } else {
      const fallbackClass = classesList.find((c: any) => !c.subsidiary_id && !c.subsidiaryId && !c.subsidiary?.id);
      setClassId(fallbackClass ? String(fallbackClass.id) : (classesList[0]?.id ? String(classesList[0].id) : ''));
    }

    const matchingDepts = departmentsList.filter(
      (d: any) => String(d.subsidiary_id ?? d.subsidiaryId ?? d.subsidiary?.id ?? '') === String(subId)
    );
    if (matchingDepts.length > 0) {
      setDepartmentId(String(matchingDepts[0].id));
    } else {
      const fallbackDept = departmentsList.find((d: any) => !d.subsidiary_id && !d.subsidiaryId && !d.subsidiary?.id);
      setDepartmentId(fallbackDept ? String(fallbackDept.id) : (departmentsList[0]?.id ? String(departmentsList[0].id) : ''));
    }
  };

  const handleSubsidiaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    setSubsidiaryId(subId);
    autofillClassAndDepartment(subId);
  };

  const availableClasses = useMemo(() => {
    if (!subsidiaryId) return classesList;
    const matching = classesList.filter(
      (c: any) => String(c.subsidiary_id ?? c.subsidiaryId ?? c.subsidiary?.id ?? '') === String(subsidiaryId)
    );
    return matching.length > 0 ? matching : classesList;
  }, [classesList, subsidiaryId]);

  const availableDepartments = useMemo(() => {
    if (!subsidiaryId) return departmentsList;
    const matching = departmentsList.filter(
      (d: any) => String(d.subsidiary_id ?? d.subsidiaryId ?? d.subsidiary?.id ?? '') === String(subsidiaryId)
    );
    return matching.length > 0 ? matching : departmentsList;
  }, [departmentsList, subsidiaryId]);

  // Handle URL Query Params
  useEffect(() => {
    const debitNoteIdParam = searchParams.get('debitNoteId') || searchParams.get('vendorCreditId');
    const vendorIdParam = searchParams.get('vendorId');
    const actionParam = searchParams.get('action');
    const idParam = searchParams.get('id');

    if (idParam && actionParam === 'view') {
      setSelectedRefundId(Number(idParam));
      setViewMode('VIEW');
      return;
    }

    if (debitNoteIdParam || vendorIdParam) {
      setViewMode('CREATE');

      if (debitNoteIdParam) {
        setVendorCreditId(String(debitNoteIdParam));
        triggerGetDebitNoteById(debitNoteIdParam)
          .unwrap()
          .then((res: any) => {
            const dn = res?.result || res?.data || res;
            if (dn) {
              const header = dn.header || dn;
              const vId = header.vendorId || header.vendor_id || dn.vendorId || dn.vendor_id || dn.vendor?.id;
              if (vId) setVendorId(String(vId));

              const subId = header.subsidiary_id || header.subsidiaryId || dn.subsidiary_id;
              if (subId) {
                const strSubId = String(subId);
                setSubsidiaryId(strSubId);
                if (header.class_id) setClassId(String(header.class_id));
                else autofillClassAndDepartment(strSubId);
                if (header.department_id) setDepartmentId(String(header.department_id));
              }

              const locId = header.location_id || header.city_id || dn.location_id;
              if (locId) setLocationId(String(locId));

              const curr = header.currency || header.currency_id || dn.currency;
              if (curr) setCurrency(String(curr));

              const tot = Number(header.totalAmount || header.total_amount || dn.amount || 0);
              const app = Number(header.appliedAmount || header.applied_amount || dn.appliedAmount || 0);
              const ref = Number(header.refundedAmount || header.refunded_amount || dn.refundedAmount || 0);
              const unapp = Math.max(0, Number((tot - (app + ref)).toFixed(2)));
              if (unapp > 0) setRefundAmount(String(unapp));

              setRemarks(`Vendor Refund for Credit Note #${header.debitNoteNumber || header.debit_note_number || dn.id}`);
            }
          })
          .catch(() => {
            const dn = allDebitNotes.find((d: any) => String(d.id) === String(debitNoteIdParam));
            if (dn) {
              const header = dn.header || dn;
              const vId = header.vendorId || header.vendor_id || dn.vendorId || dn.vendor_id || dn.vendor?.id;
              if (vId) setVendorId(String(vId));
              const subId = header.subsidiary_id || dn.subsidiary_id;
              if (subId) {
                setSubsidiaryId(String(subId));
                autofillClassAndDepartment(String(subId));
              }
              const tot = Number(header.totalAmount || header.total_amount || dn.amount || 0);
              const app = Number(header.appliedAmount || header.applied_amount || 0);
              const ref = Number(header.refundedAmount || header.refunded_amount || 0);
              const unapp = Math.max(0, Number((tot - (app + ref)).toFixed(2)));
              if (unapp > 0) setRefundAmount(String(unapp));
            }
          });
      } else if (vendorIdParam) {
        setVendorId(String(vendorIdParam));
        const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorIdParam));
        if (selectedVendor) {
          const subId = selectedVendor.primary_subsidiary_id ?? selectedVendor.primarySubsidiary?.id ?? selectedVendor.subsidiary_id;
          if (subId) {
            const strSub = String(subId);
            setSubsidiaryId(strSub);
            autofillClassAndDepartment(strSub);
          }
          if (selectedVendor.city_id) setLocationId(String(selectedVendor.city_id));
        }
      }
    }
  }, [searchParams, allDebitNotes, vendors]);

  // Filter vendor credits for selected vendor that have unapplied balance
  const availableCredits = useMemo(() => {
    if (!vendorId) return [];
    return allDebitNotes.filter((c: any) => {
      const matchVendor = String(c.vendorId || c.vendor?.id) === String(vendorId);
      const total = Number(c.totalAmount || c.total_amount || 0);
      const applied = Number(c.appliedAmount || c.applied_amount || 0);
      const refunded = Number(c.refundedAmount || c.refunded_amount || 0);
      const unapplied = Math.max(0, Number((total - (applied + refunded)).toFixed(2)));
      return matchVendor && unapplied > 0.01;
    });
  }, [allDebitNotes, vendorId]);

  const selectedCreditObj = useMemo(() => {
    if (!vendorCreditId) return null;
    return allDebitNotes.find((c: any) => String(c.id) === String(vendorCreditId));
  }, [allDebitNotes, vendorCreditId]);

  const creditTotal = Number(selectedCreditObj?.totalAmount || selectedCreditObj?.total_amount || 0);
  const creditApplied = Number(selectedCreditObj?.appliedAmount || selectedCreditObj?.applied_amount || 0);
  const creditRefunded = Number(selectedCreditObj?.refundedAmount || selectedCreditObj?.refunded_amount || 0);
  const creditAvailable = Math.max(0, Number((creditTotal - (creditApplied + creditRefunded)).toFixed(2)));

  const enteredAmount = Number(refundAmount || 0);
  const isAmountValid = enteredAmount > 0 && enteredAmount <= creditAvailable;

  const handleVendorSelect = (selectedVId: string) => {
    setVendorId(selectedVId);
    setVendorCreditId('');
    setRefundAmount('');

    const selectedVendor = vendors.find((v: any) => String(v.id) === String(selectedVId));
    if (selectedVendor) {
      const subId = selectedVendor.primary_subsidiary_id ?? selectedVendor.primarySubsidiary?.id ?? selectedVendor.subsidiary_id ?? selectedVendor.subsidiary?.id;
      if (subId) {
        const strSubId = String(subId);
        setSubsidiaryId(strSubId);
        autofillClassAndDepartment(strSubId);
      }

      const primaryAddr = selectedVendor.addressBook?.find((a: any) => a.default_billing) || selectedVendor.addressBook?.[0];
      const cityId = primaryAddr?.city_id ?? primaryAddr?.city?.id ?? selectedVendor.city_id ?? selectedVendor.city?.id;
      if (cityId) setLocationId(String(cityId));

      const curr = selectedVendor.currency_name || selectedVendor.currency?.name || selectedVendor.currency_id;
      if (curr) setCurrency(String(curr));
    }
  };

  const handleCreditSelect = (creditId: string) => {
    setVendorCreditId(creditId);
    const cr = allDebitNotes.find((c: any) => String(c.id) === String(creditId));
    if (cr) {
      const tot = Number(cr.totalAmount || cr.total_amount || 0);
      const app = Number(cr.appliedAmount || cr.applied_amount || 0);
      const ref = Number(cr.refundedAmount || cr.refunded_amount || 0);
      const unapp = Math.max(0, Number((tot - (app + ref)).toFixed(2)));
      setRefundAmount(unapp > 0 ? String(unapp) : '');
      if (cr.subsidiary_id && !subsidiaryId) {
        setSubsidiaryId(String(cr.subsidiary_id));
        autofillClassAndDepartment(String(cr.subsidiary_id));
      }
      if (cr.class_id && !classId) setClassId(String(cr.class_id));
      if (cr.department_id && !departmentId) setDepartmentId(String(cr.department_id));
      if (cr.location_id && !locationId) setLocationId(String(cr.location_id));
    } else {
      setRefundAmount('');
    }
  };

  const handleCreateRefund = async () => {
    setFormError('');

    if (!vendorId) {
      setFormError('Please select a Vendor.');
      toast.error('Please select a Vendor.');
      return;
    }
    if (!vendorCreditId) {
      setFormError('Please select an open Vendor Credit Note.');
      toast.error('Please select an open Vendor Credit Note.');
      return;
    }
    if (!bankAccountId) {
      setFormError('Please select a Bank / Cash account for disbursement receipt.');
      toast.error('Please select a Bank / Cash account.');
      return;
    }
    if (!isAmountValid) {
      const msg = `Refund amount must be between ₹0.01 and available credit balance of ₹${creditAvailable.toFixed(2)}.`;
      setFormError(msg);
      toast.error(msg);
      return;
    }

    try {
      const res = await createVendorRefund({
        vendorCreditId: Number(vendorCreditId),
        vendorId: Number(vendorId),
        bankAccountId: Number(bankAccountId),
        refundAmount: enteredAmount,
        refundDate,
        currency,
        paymentMode,
        referenceNumber,
        remarks,
        subsidiary_id: subsidiaryId ? Number(subsidiaryId) : null,
        class_id: classId ? Number(classId) : null,
        department_id: departmentId ? Number(departmentId) : null,
        location_id: locationId ? Number(locationId) : null,
      } as any).unwrap();

      toast.success('Vendor Refund processed & posted to GL successfully!');
      refetchRefunds();
      if (res?.result?.vendorRefund?.id) {
        setSelectedRefundId(res.result.vendorRefund.id);
        setViewMode('VIEW');
        setSearchParams({ action: 'view', id: String(res.result.vendorRefund.id) });
      } else {
        setViewMode('LIST');
        setSearchParams({});
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to process vendor refund';
      setFormError(msg);
      toast.error(msg);
    }
  };

  const selectedRefund = singleRefundData?.result || refundsList.find((r: any) => r.id === selectedRefundId);

  // GL entries for selected refund
  const glEntries: GLEntry[] = useMemo(() => {
    if (Array.isArray(journalEntryData?.result?.lines) && journalEntryData.result.lines.length > 0) {
      return journalEntryData.result.lines.map((l: any) => ({
        accountCode: l.account?.account_number || l.account?.account_code || '—',
        accountName: l.account?.account_name || l.account_name || '—',
        debit: Number(l.debit_amount || l.debit || 0),
        credit: Number(l.credit_amount || l.credit || 0),
        postingPeriod: (journalEntryData.result.entry_date || '').slice(0, 7),
        memo: l.narration || l.memo || journalEntryData.result.narration || 'Vendor Refund GL Entry',
      }));
    }

    if (!selectedRefund) return [];
    const amount = Number(selectedRefund.refundAmount || 0);
    const bankName = selectedRefund.bankAccount?.account_name || 'Bank Account';
    const bankCode = selectedRefund.bankAccount?.account_number || '4201';

    return [
      {
        accountCode: bankCode,
        accountName: bankName,
        debit: amount,
        credit: 0,
        memo: `Vendor Refund Receipt - ${selectedRefund.refundNumber}`,
      },
      {
        accountCode: '200002',
        accountName: 'Accounts Payables - Vendor',
        debit: 0,
        credit: amount,
        memo: `Vendor Refund AP Restoration - ${selectedRefund.refundNumber}`,
      },
    ];
  }, [journalEntryData, selectedRefund]);

  // P2P lifecycle navigation bar
  const P2PLifecycleNav = () => (
    <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold bg-white p-1 rounded-xs border border-slate-300">
      <button
        onClick={() => navigate('/purchase-order')}
        className="px-2 py-0.5 rounded-xs text-slate-600 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
      >
        <span>1. PO</span>
      </button>
      <span className="text-slate-300">→</span>
      <button
        onClick={() => navigate('/grn')}
        className="px-2 py-0.5 rounded-xs text-slate-600 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
      >
        <span>2. GRN</span>
      </button>
      <span className="text-slate-300">→</span>
      <button
        onClick={() => navigate('/purchase-invoice')}
        className="px-2 py-0.5 rounded-xs text-slate-600 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
      >
        <span>3. Bill</span>
      </button>
      <span className="text-slate-300">→</span>
      <button
        onClick={() => navigate('/purchase-payment')}
        className="px-2 py-0.5 rounded-xs text-slate-600 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
      >
        <span>4. Payment</span>
      </button>
      <span className="text-slate-300">|</span>
      <button
        onClick={() => navigate('/purchase-return')}
        className="px-2 py-0.5 rounded-xs text-slate-600 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
      >
        <AssignmentReturn className="!w-3 !h-3 text-red-600" />
        <span>Return</span>
      </button>
      <span className="text-slate-300">→</span>
      <button
        onClick={() => navigate('/return-fulfillment')}
        className="px-2 py-0.5 rounded-xs text-slate-600 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
      >
        <LocalShipping className="!w-3 !h-3 text-blue-600" />
        <span>Fulfillment</span>
      </button>
      <span className="text-slate-300">→</span>
      <button
        onClick={() => navigate('/debit-note')}
        className="px-2 py-0.5 rounded-xs text-slate-600 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
      >
        <ReceiptLong className="!w-3 !h-3 text-amber-600" />
        <span>Vendor Credit</span>
      </button>
      <span className="text-slate-300">→</span>
      <button
        onClick={() => setViewMode('LIST')}
        className="px-2 py-0.5 rounded-xs bg-emerald-700 text-white flex items-center space-x-1 font-bold cursor-pointer"
      >
        <AccountBalance className="!w-3 !h-3 text-white" />
        <span>Vendor Refund</span>
      </button>
    </div>
  );

  // ── RENDER 1: FORM & VIEW RECORD PAGE (RecordPageLayout) ──
  if (viewMode === 'CREATE' || viewMode === 'VIEW') {
    const isView = viewMode === 'VIEW';
    const refundNo = isView ? (selectedRefund?.refundNumber || `VR-${selectedRefund?.id}`) : 'New Vendor Refund';
    const currentVendorObj = vendors.find((v: any) => String(v.id) === String(vendorId)) || selectedRefund?.vendor || selectedCreditObj?.vendor;
    const vName = isView
      ? (selectedRefund?.vendor?.vendor_name || selectedRefund?.vendor?.company_name || selectedRefund?.vendor_name || getVendorDisplayName(selectedRefund?.vendor) !== '—' ? getVendorDisplayName(selectedRefund?.vendor) : 'Vendor')
      : (currentVendorObj ? getVendorDisplayName(currentVendorObj) : (vendors.find((v: any) => String(v.id) === String(vendorId))?.vendor_name || vendors.find((v: any) => String(v.id) === String(vendorId))?.company_name || 'Vendor'));

    return (
      <RecordPageLayout
        recordType="Vendor Refund"
        subtitle={isView ? `Vendor Refund #${refundNo} (${vName})` : 'New Vendor Refund'}
        mode={isView ? 'view' : 'edit'}
        onSave={handleCreateRefund}
        onBack={() => setViewMode('LIST')}
        onCancel={() => setViewMode('LIST')}
        onListClick={() => setViewMode('LIST')}
        onSearchClick={() => setViewMode('LIST')}
        isSaving={isCreating}
        subTabs={[
          {
            id: 'details',
            label: 'Refund Details',
            content: (
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xs text-xs space-y-2">
                <div className="font-semibold text-slate-800">Vendor Credit Cash/Bank Reimbursement Allocation</div>
                <div className="text-slate-600">
                  Vendor: <span className="font-bold text-slate-900">{vName}</span> | Credit Note: <span className="font-mono font-bold text-sky-800">{isView ? (selectedRefund?.vendorCredit?.creditNoteNumber || `VC-#${selectedRefund?.vendorCreditId}`) : (selectedCreditObj?.creditNoteNumber || '—')}</span>
                </div>
                {isView && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 font-mono">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 font-sans block">Refund Amount</span>
                      <span className="font-bold text-emerald-800 text-sm">₹{Number(selectedRefund?.refundAmount || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 font-sans block">Bank Account</span>
                      <span className="font-semibold text-slate-800 font-sans">{selectedRefund?.bankAccount?.account_name || 'Bank Account'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 font-sans block">Payment Mode</span>
                      <span className="font-semibold text-slate-800 font-sans">{selectedRefund?.paymentMode || 'Bank Transfer'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 font-sans block">Status</span>
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 font-sans">
                        {selectedRefund?.status || 'POSTED'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          ...(isView
            ? [
                {
                  id: 'gl_impact',
                  label: 'GL Impact',
                  content: (
                    <GLImpactSubtab
                      documentNumber={refundNo}
                      entries={glEntries}
                    />
                  ),
                },
              ]
            : []),
        ]}
      >
        {/* PRIMARY INFORMATION + CREDIT SUMMARY */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <RecordSection title="Primary Information" defaultOpen={true}>
              {isView ? (
                <>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">REFUND #</span>
                    <span className="text-xs font-bold text-slate-900">{selectedRefund?.refundNumber}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR</span>
                    <span className="text-xs font-bold text-sky-700">{vName}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR CREDIT NOTE</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {selectedRefund?.vendorCredit?.creditNoteNumber || `VC-#${selectedRefund?.vendorCreditId}`}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">REFUND DATE</span>
                    <span className="text-xs text-slate-800">
                      {selectedRefund?.refundDate ? new Date(selectedRefund.refundDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">BANK ACCOUNT (DEBIT)</span>
                    <span className="text-xs font-semibold text-slate-900">{selectedRefund?.bankAccount?.account_name || 'Bank Account'}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">PAYMENT MODE</span>
                    <span className="text-xs text-slate-800">{selectedRefund?.paymentMode || 'Bank Transfer'}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
                    <div>
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {selectedRefund?.status || 'POSTED'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">MEMO / REMARKS</span>
                    <span className="text-xs text-slate-700">{selectedRefund?.remarks || '—'}</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Vendor Dropdown */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">VENDOR *</label>
                    <select
                      value={vendorId}
                      onChange={(e) => handleVendorSelect(e.target.value)}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-semibold text-slate-800"
                    >
                      <option value="">Select Vendor...</option>
                      {vendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {getVendorDisplayName(v)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vendor Credit Dropdown */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">VENDOR CREDIT NOTE *</label>
                    <select
                      value={vendorCreditId}
                      onChange={(e) => handleCreditSelect(e.target.value)}
                      disabled={!vendorId}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                    >
                      <option value="">{vendorId ? 'Select Vendor Credit...' : 'Select Vendor first'}</option>
                      {availableCredits.map((c: any) => {
                        const tot = Number(c.totalAmount || c.total_amount || 0);
                        const app = Number(c.appliedAmount || c.applied_amount || 0);
                        const ref = Number(c.refundedAmount || c.refunded_amount || 0);
                        const unapp = Math.max(0, Number((tot - (app + ref)).toFixed(2)));
                        return (
                          <option key={c.id} value={c.id}>
                            {c.creditNoteNumber || `VC-#${c.id}`} — Unapplied: ₹{unapp.toFixed(2)} (Total: ₹{tot.toFixed(2)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Bank Account */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">BANK / CASH ACCOUNT (DEBIT) *</label>
                    <select
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">Select Bank / Cash Account...</option>
                      {bankAccounts.map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {a.account_number || a.account_code || '—'} - {a.account_name || a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Refund Date */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">REFUND DATE *</label>
                    <input
                      type="date"
                      value={refundDate}
                      onChange={(e) => setRefundDate(e.target.value)}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Refund Amount */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">REFUND AMOUNT (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={creditAvailable || undefined}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={creditAvailable > 0 ? `Max: ₹${creditAvailable.toFixed(2)}` : '0.00'}
                      disabled={!vendorCreditId}
                      className="h-7 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">PAYMENT MODE</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / Online</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Reference Number */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">REFERENCE / CHEQUE #</label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. UTR12345678"
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">MEMO / REMARKS</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Vendor refund for returned items"
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              )}
            </RecordSection>
          </div>

          {/* SUMMARY SIDEBAR CARD */}
          <div className="w-full lg:w-72">
            <div className="bg-slate-50 border border-slate-300 rounded-xs overflow-hidden shadow-2xs">
              <div className="bg-[#1d3e4c] text-white px-3 py-1.5 font-bold uppercase text-[11px] tracking-wider">
                Refund Summary
              </div>
              <div className="p-3 space-y-2 text-xs font-mono">
                {isView ? (
                  <>
                    <div className="flex justify-between text-slate-600 font-sans text-[11px]">
                      <span>TOTAL REFUNDED</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        ₹{Number(selectedRefund?.refundAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600 font-sans text-[11px]">
                      <span>TOTAL CREDIT</span>
                      <span className="font-mono font-bold text-slate-800">₹{creditTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sky-700 font-sans text-[11px]">
                      <span>APPLIED ON BILLS</span>
                      <span className="font-mono font-bold">₹{creditApplied.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700 font-sans text-[11px]">
                      <span>ALREADY REFUNDED</span>
                      <span className="font-mono font-bold">₹{creditRefunded.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-sans text-[11px] border-t border-slate-200 pt-1.5 font-bold">
                      <span>AVAILABLE CREDIT</span>
                      <span className="font-mono text-sm">₹{creditAvailable.toFixed(2)}</span>
                    </div>
                    {enteredAmount > 0 && (
                      <div className="flex justify-between text-purple-800 font-sans text-[11px] border-t border-slate-200 pt-1.5 font-bold">
                        <span>THIS REFUND</span>
                        <span className="font-mono text-sm">₹{enteredAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CLASSIFICATION SECTION */}
        <RecordSection title="Classification" defaultOpen={true}>
          {isView ? (
            <>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
                <span className="text-xs font-semibold text-slate-800">
                  {subsidiaries.find((s: any) => String(s.id) === String(selectedRefund?.subsidiary_id || selectedRefund?.subsidiaryId))?.subsidiary_name || '—'}
                </span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">LOCATION / CITY</span>
                <span className="text-xs font-semibold text-slate-800">
                  {citiesList.find((c: any) => String(c.id) === String(selectedRefund?.location_id || selectedRefund?.locationId || selectedRefund?.city_id))?.city_name || '—'}
                </span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">CLASS</span>
                <span className="text-xs font-semibold text-slate-800">
                  {classesList.find((c: any) => String(c.id) === String(selectedRefund?.class_id || selectedRefund?.classId))?.class_name || '—'}
                </span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">DEPARTMENT</span>
                <span className="text-xs font-semibold text-slate-800">
                  {departmentsList.find((d: any) => String(d.id) === String(selectedRefund?.department_id || selectedRefund?.departmentId))?.department_name || '—'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">SUBSIDIARY</label>
                <select
                  value={subsidiaryId}
                  onChange={handleSubsidiaryChange}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select Subsidiary...</option>
                  {subsidiaries.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.subsidiary_name || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">LOCATION / CITY</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select Location...</option>
                  {citiesList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.city_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">CLASS</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select Class...</option>
                  {availableClasses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">DEPARTMENT</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select Department...</option>
                  {availableDepartments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name || d.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </RecordSection>

        {/* INTERCOMPANY MANAGEMENT */}
        <RecordSection title="Intercompany Management" defaultOpen={true}>
          {isView ? (
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY</span>
              <span className="text-xs font-bold text-slate-900">{selectedRefund?.currency || 'INR'}</span>
            </div>
          ) : (
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">CURRENCY</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                {currencies.map((c: any) => (
                  <option key={c.id} value={c.currency_code || c.code}>
                    {c.currency_code || c.code} - {c.currency_name || c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </RecordSection>
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: DATAGRID LIST VIEW MODE ──
  const filteredRefunds = refundsList.filter((r: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const refNo = String(r.refundNumber || `VR-${r.id}`).toLowerCase();
    const vNameStr = String(r.vendor?.vendor_name || r.vendor?.company_name || r.vendor_name || getVendorDisplayName(r.vendor)).toLowerCase();
    return refNo.includes(term) || vNameStr.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-slate-300 gap-2">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Vendor Refunds</h1>
        </div>
        <P2PLifecycleNav />
      </div>

      {/* Button Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setVendorId('');
              setVendorCreditId('');
              setBankAccountId('');
              setRefundAmount('');
              setReferenceNumber('');
              setRemarks('');
              setFormError('');
              setViewMode('CREATE');
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Add className="!w-4 !h-4" />
            <span>New Vendor Refund</span>
          </button>
        </div>
        <div className="text-xs text-slate-500 italic">
          Vendor Refunds process cash/bank reimbursements for unapplied Vendor Credits (NetSuite Workflow).
        </div>
      </div>

      {/* DataGrid Table */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2 border-r border-slate-300 w-16 text-center">VIEW</th>
              <th className="p-2 border-r border-slate-300 w-16 text-center">ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[140px]">REFUND NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[170px]">VENDOR</th>
              <th className="p-2 border-r border-slate-300 min-w-[130px]">CREDIT NOTE #</th>
              <th className="p-2 border-r border-slate-300 w-24">DATE</th>
              <th className="p-2 border-r border-slate-300 w-32 text-right">REFUND AMOUNT (₹)</th>
              <th className="p-2 border-r border-slate-300 min-w-[160px]">BANK ACCOUNT</th>
              <th className="p-2 border-r border-slate-300 w-24 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isRefundsLoading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">Loading refunds...</td>
              </tr>
            ) : filteredRefunds.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching vendor refunds found." : "No Vendor Refunds recorded. Click '+ New Vendor Refund' to create one."}
                </td>
              </tr>
            ) : (
              filteredRefunds.map((refund: any) => (
                <tr key={refund.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="p-2 border-r border-slate-200 text-center font-semibold">
                    <button
                      onClick={() => {
                        setSelectedRefundId(refund.id);
                        setViewMode('VIEW');
                      }}
                      className="text-sky-700 hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                  <td className="p-2 border-r border-slate-200 font-mono text-slate-600 text-center">{refund.id}</td>
                  <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                    <button
                      onClick={() => {
                        setSelectedRefundId(refund.id);
                        setViewMode('VIEW');
                      }}
                      className="hover:underline text-left cursor-pointer"
                    >
                      {refund.refundNumber}
                    </button>
                  </td>
                  <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                    {refund.vendor?.company_name || refund.vendor?.vendor_name || refund.vendor_name || (getVendorDisplayName(refund.vendor) !== '—' ? getVendorDisplayName(refund.vendor) : 'Vendor')}
                  </td>
                  <td className="p-2 border-r border-slate-200 font-mono text-slate-700">{refund.vendorCredit?.creditNoteNumber || `VC-#${refund.vendorCreditId}`}</td>
                  <td className="p-2 border-r border-slate-200 text-slate-700">
                    {refund.refundDate ? new Date(refund.refundDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">
                    ₹{Number(refund.refundAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-slate-700">{refund.bankAccount?.account_name || 'Bank Account'}</td>
                  <td className="p-2 border-r border-slate-200 text-center">
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {refund.status || 'POSTED'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorRefundComp;

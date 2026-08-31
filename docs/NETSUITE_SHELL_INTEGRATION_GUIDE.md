# NetSuite Enterprise Replica Shell & Layout Integration Guide

This guide describes how to wrap existing features and create new record views using the refactored **Oracle NetSuite Enterprise Replica** application shell components in our React + TypeScript application.

---

## 1. Core Component Architecture

The refactored shell consists of three primary utility-first layout components:

1. **`AppLayout`** (`src/components/Layout/AppLayout.tsx`):
   - **Tier 1 Header**: Branding (Oracle NetSuite + Subsidiary Name), History clock, Favorites star, Home icon, centered Global Search with `/` key shortcut focus, Quick Add (`+`), Help, Feedback, and User Profile Badge.
   - **Tier 2 Mega-Menu Ribbon**: Horizontal enterprise module ribbon (`Activities`, `Transactions`, `Lists`, `Reports`, `Analytics`, `Customization`, `Documents`, `Setup`, `Commerce`, `4CS - Rentals`, `SuiteApps`, `Support`) with nested flyout submenus and mobile/tablet responsive drawer.
   - **Breadcrumbs Trail**: Automatic location path mapping based on `useLocation()`.

2. **`RecordPageLayout`** (`src/components/Layout/RecordPageLayout.tsx`):
   - **Record Title Header**: Displays record type, title, and quick action links (`List`, `Search`, `Customize`, `More`).
   - **Dual Sticky Action Bars**: Sticky top bar & bottom footer bar providing `Save` (split dropdown with *Save & New*, *Save & Next*) and `Cancel`.
   - **Collapsible Section Accordions (`RecordSection`)**: Accordions with NetSuite teal headers (`bg-[#e5eff5]`) and responsive 3–4 column field grid.
   - **Sub-Tab Record Ribbon**: Scrollable horizontal sub-tab row with active teal border indicators.

3. **`SublistTable`** (`src/components/Layout/SublistTable.tsx`):
   - Inline editable sub-tab table template supporting columns (`text`, `number`, `select`, `checkbox`), line items editing, and row action buttons (`Add`, `Cancel`, `Remove`).

---

## 2. Wrapping Existing Pages in `AppLayout`

The global `Layout` component (`src/components/Layout/index.tsx`) now wraps all page routes with `AppLayout`. No changes are required to `src/App.tsx` routes.

Example:
```tsx
import Layout from "../components/Layout";

export default function MyPage() {
  return (
    <Layout>
      {/* Page content rendered cleanly inside NetSuite AppLayout */}
    </Layout>
  );
}
```

---

## 3. Creating NetSuite Record Pages (`RecordPageLayout`)

To convert or create standard entity or transaction record pages (e.g. Vendors, Customers, Purchase Orders, Invoices):

```tsx
import React, { useState } from "react";
import RecordPageLayout, { RecordSection } from "../components/Layout/RecordPageLayout";
import SublistTable, { SublistColumn } from "../components/Layout/SublistTable";

export default function CustomerRecordPage() {
  const [customerName, setCustomerName] = useState("");
  const [subsidiary, setSubsidiary] = useState("Parent Company");
  const [addresses, setAddresses] = useState([]);

  const addressColumns: SublistColumn[] = [
    { key: "label", label: "LABEL", type: "text" },
    { key: "street", label: "STREET ADDRESS", type: "text" },
    { key: "city", label: "CITY", type: "text" },
    { key: "defaultBilling", label: "BILLING", type: "checkbox" },
  ];

  return (
    <RecordPageLayout
      recordType="Customer"
      recordTitle={customerName || "New Customer"}
      onSave={() => alert("Customer Saved")}
      onSaveAndNew={() => alert("Saved & Reset")}
      onCancel={() => window.history.back()}
      onListClick={() => navigate("/customer")}
      subTabs={[
        {
          id: "address",
          label: "Address Book",
          badge: addresses.length,
          content: (
            <SublistTable
              columns={addressColumns}
              data={addresses}
              onAddRow={(newRow) => setAddresses([...addresses, newRow])}
              onRemoveRow={(idx) => setAddresses(addresses.filter((_, i) => i !== idx))}
            />
          ),
        },
      ]}
    >
      {/* Accordion Section 1 */}
      <RecordSection title="Primary Information" defaultOpen={true}>
        <div className="flex flex-col space-y-1">
          <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
            CUSTOMER NAME <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 py-0.5 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
            PRIMARY SUBSIDIARY <span className="text-amber-600">*</span>
          </label>
          <select
            value={subsidiary}
            onChange={(e) => setSubsidiary(e.target.value)}
            className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 py-0.5"
          >
            <option value="Parent Company">Parent Company</option>
            <option value="India Subsidiary">India Subsidiary</option>
          </select>
        </div>
      </RecordSection>
    </RecordPageLayout>
  );
}
```

---

## 4. Sublist Table Specification (`SublistTable`)

| Prop | Type | Description |
| :--- | :--- | :--- |
| `columns` | `SublistColumn[]` | Array of column definitions (`key`, `label`, `type`, `options`, `required`, `width`) |
| `data` | `Record<string, any>[]` | Array of row objects |
| `onAddRow` | `(row: Record<string, any>) => void` | Triggered when user clicks Add or Add Line |
| `onUpdateRow` | `(index: number, row: Record<string, any>) => void` | Triggered when user saves an edited row |
| `onRemoveRow` | `(index: number) => void` | Triggered when user clicks Remove |
| `emptyRowState` | `Record<string, any>` | Default values pre-filled in the new row input line |

---

## 5. Live Interactive Reference Demo

A reference NetSuite record implementation is available at route:
`/netsuite-vendor-demo` (rendered by component `src/components/Demo/NetSuiteVendorDemo.tsx`).

You can inspect this component to see full integration of collapsible accordions, sticky split action bars, sub-tab ribbons, and sublist tables.

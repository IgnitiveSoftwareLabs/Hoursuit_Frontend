import React, { useState } from "react";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search,
  List as ListIcon,
  Save as SaveIcon,
  Close,
  Edit as EditIcon,
  ArrowBack,
  Print,
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";

export interface RecordSubTab {
  id: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
}

export interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function RecordSection({ title, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 rounded-xs overflow-hidden shadow-2xs border border-slate-300">
      {/* NetSuite Section Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#e5eff5] hover:bg-[#d8e6f0] text-slate-800 border-b border-slate-300 px-3 py-1.5 text-xs font-bold tracking-wider flex items-center justify-between transition-colors select-none"
      >
        <div className="flex items-center space-x-1.5">
          {isOpen ? (
            <KeyboardArrowDown className="!w-4 !h-4 text-slate-600" />
          ) : (
            <KeyboardArrowUp className="!w-4 !h-4 text-slate-600 rotate-90" />
          )}
          <span className="uppercase text-[11px] text-[#244b5a] font-bold">{title}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-normal">
          {isOpen ? "Click to collapse" : "Click to expand"}
        </span>
      </button>

      {/* Accordion Content Box */}
      {isOpen && (
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export interface RecordPageLayoutProps {
  recordType: string;
  recordTitle?: string;
  subtitle?: string;
  mode?: "edit" | "view";
  onSave?: () => void;
  onSaveDraft?: () => void;
  saveButtonText?: string;
  onEdit?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  onListClick?: () => void;
  onSearchClick?: () => void;
  onMakePayment?: () => void;
  customActions?: React.ReactNode;
  subTabs?: RecordSubTab[];
  activeSubTabId?: string;
  onSubTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  isSaving?: boolean;
}

export default function RecordPageLayout({
  recordType,
  recordTitle,
  subtitle,
  mode = "edit",
  onSave,
  onSaveDraft,
  saveButtonText,
  onEdit,
  onBack,
  onCancel,
  onListClick,
  onSearchClick,
  onMakePayment,
  customActions,
  subTabs = [],
  activeSubTabId,
  onSubTabChange,
  children,
  isSaving = false,
}: RecordPageLayoutProps) {
  const [internalTabId, setInternalTabId] = useState(subTabs[0]?.id || "");
  const currentTabId = activeSubTabId || internalTabId;

  const handleTabClick = (tabId: string) => {
    setInternalTabId(tabId);
    if (onSubTabChange) onSubTabChange(tabId);
  };

  const activeTabObj = subTabs.find((t) => t.id === currentTabId) || subTabs[0];
  const isViewMode = mode === "view";

  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800">
      {/* ── TOP CONTROL & RECORD TITLE BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        {/* Title */}
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">
              {recordType}
              {recordTitle ? ` ${recordTitle.startsWith("#") ? recordTitle : `#${recordTitle}`}` : ""}
            </h1>
            <Search className="!w-4 !h-4 text-slate-400 hover:text-sky-600 cursor-pointer ml-1" titleAccess="Search Record" />
          </div>

          {subtitle && (
            <div className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{subtitle}</span>
            </div>
          )}
        </div>

        {/* Action Quick Links (Navigation & View Dashboard) */}
        <div className="flex items-center space-x-3 text-xs font-semibold text-sky-700">
          {isViewMode && (
            <div className="flex items-center space-x-1 border-r border-slate-300 pr-2">
              <button type="button" onClick={onBack} title="Previous Record" className="p-0.5 hover:text-sky-900">
                <ArrowBackIos className="!w-3 !h-3" />
              </button>
              <button type="button" onClick={onBack} title="Next Record" className="p-0.5 hover:text-sky-900">
                <ArrowForwardIos className="!w-3 !h-3" />
              </button>
            </div>
          )}

          {onListClick && (
            <button
              type="button"
              onClick={onListClick}
              className="hover:underline flex items-center space-x-1 hover:text-sky-900"
            >
              <ListIcon className="!w-3.5 !h-3.5" />
              <span>List</span>
            </button>
          )}

          {isViewMode && (
            <button
              type="button"
              onClick={onListClick}
              className="hover:underline hover:text-sky-900"
            >
              View Dashboard
            </button>
          )}

          {onSearchClick && (
            <button
              type="button"
              onClick={onSearchClick}
              className="hover:underline flex items-center space-x-1 hover:text-sky-900"
            >
              <Search className="!w-3.5 !h-3.5" />
              <span>Search</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TOP STICKY ACTION BUTTON BAR ── */}
      <div className="sticky top-0 z-10 bg-[#f0f3f6] py-1.5 px-2 flex items-center justify-between border-y border-slate-300">
        <div className="flex items-center space-x-2">
          {/* VIEW MODE BUTTONS: Edit, Back, Make Payment */}
          {isViewMode ? (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1"
                >
                  <EditIcon className="!w-3.5 !h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-3.5 py-1 rounded-xs border border-slate-300 shadow-2xs transition-colors flex items-center space-x-1"
                >
                  <ArrowBack className="!w-3.5 !h-3.5 text-slate-500" />
                  <span>Back</span>
                </button>
              )}

              {onMakePayment && (
                <button
                  type="button"
                  onClick={onMakePayment}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-3.5 py-1 rounded-xs border border-slate-300 shadow-2xs transition-colors"
                >
                  Make Payment
                </button>
              )}

              {customActions}

              <button
                type="button"
                onClick={() => window.print()}
                title="Print PDF"
                className="p-1 text-slate-600 hover:text-sky-700 hover:bg-slate-200 rounded transition-colors"
              >
                <Print className="!w-4 !h-4" />
              </button>
            </>
          ) : (
            /* EDIT MODE BUTTONS: Save, Save Draft, Cancel */
            <>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className={`${
                    saveButtonText === "Receive"
                      ? "bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
                      : "bg-[#0070d2] hover:bg-blue-700 border-blue-800"
                  } text-white text-xs font-semibold px-4 py-1.5 rounded-xs border shadow-2xs transition-colors flex items-center space-x-1 disabled:opacity-50 cursor-pointer`}
                >
                  <SaveIcon className="!w-3.5 !h-3.5" />
                  <span>{isSaving ? "Processing..." : saveButtonText || "Save"}</span>
                </button>
              )}

              {onSaveDraft && (
                <button
                  type="button"
                  onClick={onSaveDraft}
                  disabled={isSaving}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-xs border border-slate-300 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span>Save Draft</span>
                </button>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-xs border border-slate-300 shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Close className="!w-3.5 !h-3.5 text-slate-500" />
                  <span>Cancel</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MAIN RECORD FORM SECTIONS CONTAINER ── */}
      <div className="flex-1 space-y-4">{children}</div>

      {/* ── SUB-TAB RECORD RIBBON (SUBLISTS CONTAINER) ── */}
      {subTabs.length > 0 && (
        <div className="mt-6 border border-slate-300 bg-white rounded-xs shadow-2xs overflow-hidden">
          {/* Scrollable Horizontal Sub-Tabs Bar */}
          <div className="bg-[#244b5a] text-white flex items-center overflow-x-auto whitespace-nowrap scrollbar-thin border-b border-slate-400">
            {subTabs.map((tab) => {
              const isSelected = tab.id === currentTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold tracking-tight transition-colors border-b-2 flex items-center space-x-1.5 ${isSelected
                      ? "bg-white text-[#244b5a] border-sky-500 font-bold"
                      : "text-slate-200 hover:bg-[#1b3a47] hover:text-white border-transparent"
                    }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-sky-100 text-sky-800" : "bg-slate-700 text-slate-200"
                        }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-Tab Content Area */}
          <div className="p-4 bg-white">{activeTabObj?.content}</div>
        </div>
      )}

      {/* ── FOOTER STICKY ACTION BAR ── */}
      <div className="bg-[#f0f3f6] py-2 px-3 flex items-center justify-between border-t border-slate-300 mt-4 rounded-xs">
        <div className="flex items-center space-x-2">
          {isViewMode ? (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors"
                >
                  Edit
                </button>
              )}
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-4 py-1.5 rounded-xs border border-slate-300 shadow-2xs transition-colors"
                >
                  Back
                </button>
              )}
            </>
          ) : (
            <>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1"
                >
                  <SaveIcon className="!w-3.5 !h-3.5" />
                  <span>Save Record</span>
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-4 py-1.5 rounded-xs border border-slate-300 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

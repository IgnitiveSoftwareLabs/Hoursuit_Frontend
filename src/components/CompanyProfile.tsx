import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { CircularProgress, Avatar } from "@mui/material";
import { useSearchParams } from "react-router-dom";

import {
  useFetchCompanyQuery,
  useUpdateCompanyMutation,
} from "../RTK/services/companyApi";
import CustomFileUpload from "../Common/CustomFileUpload";
import { BASE_URL } from "../utils/Base_Url";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface CompanyFormValues {
  name: string;
  gstNumber: string;
  contactPerson: string;
  phone: string;
  address: string;
  gstEnabled: boolean;
  License_Number_validTill?: string;
  Utility_Certificate_validTill?: string;
  Fssai_Certificate_validTill?: string;
  License_Number?: File | null;
  Utility_Certificate?: File | null;
  Fssai_Certificate?: File | null;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters"),
  gstNumber: Yup.string()
    .matches(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number format"
    )
    .required("GST number is required"),
  contactPerson: Yup.string()
    .required("Contact person name is required")
    .min(2, "Contact person name must be at least 2 characters"),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid phone number")
    .required("Phone number is required"),
  address: Yup.string()
    .required("Address is required")
    .min(5, "Address must be at least 5 characters"),
  gstEnabled: Yup.boolean().required("GST enabled status is required"),
});

const CompanyProfile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditModeParam = searchParams.get("action") === "edit";
  const [isEditing, setIsEditing] = useState(isEditModeParam);

  const {
    data: companyData,
    isLoading: iscompload,
    isError,
  } = useFetchCompanyQuery();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();

  const company = companyData?.result;

  const initialFormValues: CompanyFormValues = useMemo(
    () => ({
      name: company?.name || "",
      gstNumber: company?.gstNumber || "",
      contactPerson: company?.contactPerson || "",
      phone: company?.phone || "",
      address: company?.address || "",
      gstEnabled: company?.gstEnabled || false,
      License_Number_validTill: "",
      Utility_Certificate_validTill: "",
      Fssai_Certificate_validTill: "",
      License_Number: null,
      Utility_Certificate: null,
      Fssai_Certificate: null,
    }),
    [company]
  );

  const handleUpdateSubmit = async (values: CompanyFormValues) => {
    try {
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("gstNumber", values.gstNumber);
      formData.append("contactPerson", values.contactPerson);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("gstEnabled", String(values.gstEnabled));

      if (values.License_Number) {
        formData.append("License_Number", values.License_Number);
        if (values.License_Number_validTill) {
          formData.append("License_Number_validTill", values.License_Number_validTill);
        }
      }
      if (values.Utility_Certificate) {
        formData.append("Utility_Certificate", values.Utility_Certificate);
        if (values.Utility_Certificate_validTill) {
          formData.append("Utility_Certificate_validTill", values.Utility_Certificate_validTill);
        }
      }
      if (values.Fssai_Certificate) {
        formData.append("Fssai_Certificate", values.Fssai_Certificate);
        if (values.Fssai_Certificate_validTill) {
          formData.append("Fssai_Certificate_validTill", values.Fssai_Certificate_validTill);
        }
      }

      await updateCompany({ id: company?.id, data: formData }).unwrap();
      toast.success("Company profile updated successfully!");
      setIsEditing(false);
      setSearchParams({});
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to update company profile");
    }
  };

  if (iscompload) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 font-medium">
        <CircularProgress size={28} className="mb-2" />
        <div>Loading company profile...</div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
        <div>Failed to load company profile.</div>
      </div>
    );
  }

  // ── EDIT MODE ──
  if (isEditing) {
    return (
      <Formik
        initialValues={initialFormValues}
        validationSchema={validationSchema}
        onSubmit={handleUpdateSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <RecordPageLayout
              recordType="Company Information"
              recordTitle={values.name || "Edit Company Profile"}
              mode="edit"
              onSave={() => handleSubmit()}
              onCancel={() => {
                setIsEditing(false);
                setSearchParams({});
              }}
              onListClick={() => {
                setIsEditing(false);
                setSearchParams({});
              }}
              isSaving={isUpdating}
            >
              <RecordSection title="Primary Company Information" defaultOpen={true}>
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    COMPANY NAME <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Company Name"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  />
                  {touched.name && errors.name && (
                    <span className="text-[10px] text-red-600 font-semibold">{errors.name}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    GST NUMBER <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={values.gstNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="22AAAAA0000A1Z5"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 uppercase font-mono focus:outline-none focus:border-sky-500"
                  />
                  {touched.gstNumber && errors.gstNumber && (
                    <span className="text-[10px] text-red-600 font-semibold">{errors.gstNumber}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    CONTACT PERSON <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={values.contactPerson}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contact Person Name"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  />
                  {touched.contactPerson && errors.contactPerson && (
                    <span className="text-[10px] text-red-600 font-semibold">{errors.contactPerson}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    PHONE NUMBER <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Phone Number"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
                  />
                  {touched.phone && errors.phone && (
                    <span className="text-[10px] text-red-600 font-semibold">{errors.phone}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1 md:col-span-2">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    ADDRESS <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Full Business Address"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  />
                  {touched.address && errors.address && (
                    <span className="text-[10px] text-red-600 font-semibold">{errors.address}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1 justify-center">
                  <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer pt-3">
                    <input
                      type="checkbox"
                      name="gstEnabled"
                      checked={values.gstEnabled}
                      onChange={handleChange}
                      className="w-4 h-4 text-sky-600 rounded-xs focus:ring-sky-500"
                    />
                    <span>GST ENABLED</span>
                  </label>
                </div>
              </RecordSection>

              <RecordSection title="Compliance Certificates & Documents" defaultOpen={true}>
                <div className="flex flex-col space-y-2">
                  <CustomFileUpload
                    name="License_Number"
                    label="License Certificate"
                    accept="application/pdf,image/*"
                    maxSize={10}
                    onFileSelect={(files) => setFieldValue("License_Number", files[0] || null)}
                    value={values.License_Number}
                    showPreview
                  />
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Valid Till</label>
                    <input
                      type="date"
                      name="License_Number_validTill"
                      value={values.License_Number_validTill}
                      onChange={handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <CustomFileUpload
                    name="Utility_Certificate"
                    label="Utility Certificate"
                    accept="application/pdf,image/*"
                    maxSize={10}
                    onFileSelect={(files) => setFieldValue("Utility_Certificate", files[0] || null)}
                    value={values.Utility_Certificate}
                    showPreview
                  />
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Valid Till</label>
                    <input
                      type="date"
                      name="Utility_Certificate_validTill"
                      value={values.Utility_Certificate_validTill}
                      onChange={handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <CustomFileUpload
                    name="Fssai_Certificate"
                    label="FSSAI Certificate"
                    accept="application/pdf,image/*"
                    maxSize={10}
                    onFileSelect={(files) => setFieldValue("Fssai_Certificate", files[0] || null)}
                    value={values.Fssai_Certificate}
                    showPreview
                  />
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Valid Till</label>
                    <input
                      type="date"
                      name="Fssai_Certificate_validTill"
                      value={values.Fssai_Certificate_validTill}
                      onChange={handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                    />
                  </div>
                </div>
              </RecordSection>
            </RecordPageLayout>
          </form>
        )}
      </Formik>
    );
  }

  // ── READ-ONLY VIEW MODE ──
  return (
    <RecordPageLayout
      recordType="Company Information"
      subtitle={company.name}
      mode="view"
      onEdit={() => {
        setIsEditing(true);
        setSearchParams({ action: "edit" });
      }}
      onBack={() => {
        setIsEditing(false);
        setSearchParams({});
      }}
      onListClick={() => {
        setIsEditing(false);
        setSearchParams({});
      }}
    >
      <RecordSection title="Primary Information" defaultOpen={true}>
        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">COMPANY NAME</span>
          <span className="text-xs font-bold text-slate-900">{company.name}</span>
        </div>

        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">GST NUMBER</span>
          <span className="text-xs font-mono font-bold text-slate-900">{company.gstNumber || "N/A"}</span>
        </div>

        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">CONTACT PERSON</span>
          <span className="text-xs font-semibold text-slate-800">{company.contactPerson}</span>
        </div>

        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">PHONE</span>
          <span className="text-xs font-mono text-slate-800">{company.phone}</span>
        </div>

        <div className="flex flex-col space-y-0.5 md:col-span-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">ADDRESS</span>
          <span className="text-xs text-slate-800">{company.address}</span>
        </div>

        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">GST ENABLED</span>
          <span className="text-xs font-semibold text-slate-800">{company.gstEnabled ? "Yes" : "No"}</span>
        </div>
      </RecordSection>

      {company.user && (
        <RecordSection title="Primary Administrator Account" defaultOpen={true}>
          <div className="flex items-center space-x-3 md:col-span-3">
            <Avatar src={company.user.ProfileImage} alt="Profile" className="!w-10 !h-10 border border-slate-300" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                {company.user.FirstName} {company.user.LastName}
              </span>
              <span className="text-xs text-slate-500">{company.user.Email}</span>
              <span className="text-[10px] font-semibold text-sky-700 capitalize">{company.user.Type} Account</span>
            </div>
          </div>
        </RecordSection>
      )}

      <RecordSection title="Compliance Attachments" defaultOpen={true}>
        {company.attachments && company.attachments.length > 0 ? (
          company.attachments.map((attachment: any) => (
            <div key={attachment.id} className="flex flex-col space-y-1 bg-slate-50 p-2 border border-slate-200 rounded-xs">
              <span className="text-[10px] font-bold text-slate-600 uppercase">
                {attachment.type?.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-slate-800">{attachment.fileName}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                Valid Till: {new Date(attachment.validTill).toLocaleDateString()}
              </span>
              <a
                href={`${BASE_URL}/${attachment.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-sky-700 hover:underline pt-1"
              >
                View / Download Document
              </a>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 italic md:col-span-3">
            No compliance attachments uploaded yet.
          </div>
        )}
      </RecordSection>
    </RecordPageLayout>
  );
};

export default CompanyProfile;

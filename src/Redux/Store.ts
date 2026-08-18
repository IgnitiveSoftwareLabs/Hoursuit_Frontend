import { configureStore, combineReducers } from "@reduxjs/toolkit";

import companySlice from "./CompanySlice/index";
import InventorySlice from "./InventorySlice/index";
import StackSlice from "./StackSlice/index";
import GatePassSlice from "./GatePassSlice/index";
import NewUsersSlice from "./UsersSlice/index";
import currentUserSlice from "./CurrentUserSlice/index";
import ledgerSlice from "./LedgerSlice/index";
import voucherSlice from "./VoucherSlice/index";
import { requestDeliveryApi } from "../RTK/services/requestDeliveryApi";
import { requestDepositorApi } from "../RTK/services/requestDepositorApi";
import { warehouseApi } from "../RTK/services/warehouseApi";
import { customerApi } from "../RTK/services/customerApi";
import { commodityApi } from "../RTK/services/commodityApi";
import { rentApi } from "../RTK/services/rentApi";
import { godownApi } from "../RTK/services/godownApi";
import { companyApi } from "../RTK/services/companyApi";
import { gradeApi } from "../RTK/services/gradeApi";
import { insuranceApi } from "../RTK/services/insuranceApi";
import { billApi } from "../RTK/services/billApi";
import { invoiceApi } from "../RTK/services/invoiceApi";
import { permissionApi } from "../RTK/services/permissionApi";
import { reportsApi } from "../components/Reports/services/reportsApi";
import { dashboardApi } from "../RTK/services/dashboardApi";
import { inventoryApi } from "../RTK/services/inventoryApi";
import { uomApi } from "../RTK/services/uomApi";
import { itemApi } from "../RTK/services/itemApi";
import { itemGroupApi } from "../RTK/services/itemGroupApi";
import { salesApi } from "../RTK/services/salesApi";
import { purchaseApi } from "../RTK/services/purchaseApi";
import { userApi } from "../RTK/services/userApi";
import { categoryApi } from "../RTK/services/categoryApi";
import { currencyApi } from "../RTK/services/currencyApi";
import { stateApi } from "../RTK/services/stateApi";
import { cityApi } from "../RTK/services/cityApi";
import { subsidiaryApi } from "../RTK/services/subsdiaryApi";
import { hsnSacApi } from "../RTK/services/hsnSacApi";
import { serviceCategoryApi } from "../RTK/services/serviceCategoryApi";
import { serviceTypeApi } from "../RTK/services/serviceTypeApi";
import { workCategoryApi } from "../RTK/services/workCategoryApi"
import { vendorApi } from "../RTK/services/vendorApi"
import { transportationModeApi } from "../RTK/services/transportationModeApi"
import { stackApi } from "../RTK/services/stackApi";
import { panAvailibiltyApi } from "../RTK/services/panAvailibiltyApi";
import { paymentMethodApi } from "../RTK/services/paymentMethodApi";
import { registrationTypeApi } from "../RTK/services/resigtrationTypeApi";
import { misTypeApi } from "../RTK/services/misTypeApi";
import { accountTypeApi } from "../RTK/services/accountTypeApi";
import { itemTypeApi } from "../RTK/services/itemTypeApi";
import { chartOfAccountApi } from "../RTK/services/chartOfAccountApi";
import { journalEntryApi } from "../RTK/services/journalEntryApi";
import { debitNoteApi } from "../RTK/services/debitNoteApi";

import { systemLogApi } from "../RTK/services/systemLogApi";

// Combine reducers
const rootReducer = combineReducers({
  company: companySlice,
  [requestDeliveryApi.reducerPath]: requestDeliveryApi.reducer,
  [requestDepositorApi.reducerPath]: requestDepositorApi.reducer,
  [warehouseApi.reducerPath]: warehouseApi.reducer,
  [customerApi.reducerPath]: customerApi.reducer,
  [commodityApi.reducerPath]: commodityApi.reducer,
  [rentApi.reducerPath]: rentApi.reducer,
  [godownApi.reducerPath]: godownApi.reducer,
  [companyApi.reducerPath]: companyApi.reducer,
  inventory: InventorySlice,
  [inventoryApi.reducerPath]: inventoryApi.reducer,
  [gradeApi.reducerPath]: gradeApi.reducer,
  [insuranceApi.reducerPath]: insuranceApi.reducer,
  [billApi.reducerPath]: billApi.reducer,
  stack: StackSlice,
  gatePass: GatePassSlice,
  [invoiceApi.reducerPath]: invoiceApi.reducer,
  newUsers: NewUsersSlice,
  [permissionApi.reducerPath]: permissionApi.reducer,
  [reportsApi.reducerPath]: reportsApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [uomApi.reducerPath]: uomApi.reducer,
  [categoryApi.reducerPath]: categoryApi.reducer,
  [itemApi.reducerPath]: itemApi.reducer,
  [salesApi.reducerPath]: salesApi.reducer,
  [purchaseApi.reducerPath]: purchaseApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [currencyApi.reducerPath]: currencyApi.reducer,
  [stateApi.reducerPath]: stateApi.reducer,
  [cityApi.reducerPath]: cityApi.reducer,
  [subsidiaryApi.reducerPath]: subsidiaryApi.reducer,
  [hsnSacApi.reducerPath]: hsnSacApi.reducer,
  [serviceCategoryApi.reducerPath]: serviceCategoryApi.reducer,
  [serviceTypeApi.reducerPath]: serviceTypeApi.reducer,
  [workCategoryApi.reducerPath]: workCategoryApi.reducer,
  [vendorApi.reducerPath]: vendorApi.reducer,
  [itemGroupApi.reducerPath]: itemGroupApi.reducer,
  [stackApi.reducerPath]: stackApi.reducer,
  [transportationModeApi.reducerPath]: transportationModeApi.reducer,
  [panAvailibiltyApi.reducerPath]: panAvailibiltyApi.reducer,
  [paymentMethodApi.reducerPath]: paymentMethodApi.reducer,
  [registrationTypeApi.reducerPath]: registrationTypeApi.reducer,
  [misTypeApi.reducerPath]: misTypeApi.reducer,
  [accountTypeApi.reducerPath]: accountTypeApi.reducer,
  [itemTypeApi.reducerPath]: itemTypeApi.reducer,
  [chartOfAccountApi.reducerPath]: chartOfAccountApi.reducer,
  [journalEntryApi.reducerPath]: journalEntryApi.reducer,
  [debitNoteApi.reducerPath]: debitNoteApi.reducer,
  [systemLogApi.reducerPath]: systemLogApi.reducer,
  currentUser: currentUserSlice,
  ledger: ledgerSlice,
  voucher: voucherSlice,
});

// Create store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      requestDeliveryApi.middleware,
      requestDepositorApi.middleware,
      warehouseApi.middleware,
      customerApi.middleware,
      commodityApi.middleware,
      rentApi.middleware,
      godownApi.middleware,
      companyApi.middleware,
      gradeApi.middleware,
      insuranceApi.middleware,
      billApi.middleware,
      invoiceApi.middleware,
      permissionApi.middleware,
      reportsApi.middleware,
      dashboardApi.middleware,
      inventoryApi.middleware,
      uomApi.middleware,
      categoryApi.middleware,
      itemApi.middleware,
      salesApi.middleware,
      purchaseApi.middleware,
      userApi.middleware,
      currencyApi.middleware,
      stateApi.middleware,
      cityApi.middleware,
      subsidiaryApi.middleware,
      hsnSacApi.middleware,
      serviceCategoryApi.middleware,
      serviceTypeApi.middleware,
      workCategoryApi.middleware,
      vendorApi.middleware,
      itemGroupApi.middleware,
      stackApi.middleware,
      transportationModeApi.middleware,
      panAvailibiltyApi.middleware,
      paymentMethodApi.middleware,
      misTypeApi.middleware,
      accountTypeApi.middleware,
      itemTypeApi.middleware,
      chartOfAccountApi.middleware,
      journalEntryApi.middleware,
      debitNoteApi.middleware,
      registrationTypeApi.middleware,
      systemLogApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
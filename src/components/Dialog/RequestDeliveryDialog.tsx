// import React, { useState, useMemo } from 'react';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';
// import {
//   Box,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   FormControl,
//   FormLabel,
//   Select,
//   MenuItem,
//   TextField,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction,
//   Checkbox,
// } from '@mui/material';
// import toast from 'react-hot-toast';
// import { useCreateRequestDeliveryMutation, useUpdateRequestDeliveryMutation } from '../../RTK/services/requestDeliveryApi';
// import { useFetchRequestDepositorsQuery } from '../../RTK/services/requestDepositorApi';

// const convertToQuintals = (weight: number, unit: string): number => {
//   switch (unit) {
//     case 'kg':
//       return weight / 100;
//     case 'tons':
//       return weight * 10;
//     case 'quintals':
//       return weight;
//     case 'liters':
//       return weight / 100;
//     default:
//       return weight;
//   }
// };

// interface GatePassSelection {
//   gatePassId: number;
//   withdrawn_weight: number;
//   withdrawn_bags: number;
//   weightUnit: string;
// }

// interface RequestDeliveryType {
//   id?: number;
//   deposit_reference_id: number;
//   withdrawal_date: string;
//   delivery_note_issue_date: string;
//   withdrawal_ledger_page_number: number;
//   measurment_or_weight: number;
//   weightUnit: string;
//   total_cost_of_goods: number;
//   details_of_number_of_bags_sacks: number;
//   delivery_note_number: number;
//   gate_passes?: GatePassSelection[];
// }

// interface CreateDeliveryFormProps {
//   open: boolean;
//   onClose: () => void;
//   isEdit: boolean;
//   editDelivery?: RequestDeliveryType;
//   requestDeposits: any;
//   editDeliveryId?: number | null;
// }

// const CreateDeliveryForm: React.FC<CreateDeliveryFormProps> = ({
//   open,
//   onClose,
//   isEdit,
//   editDelivery,
//   requestDeposits,
//   editDeliveryId,
// }) => {
//   const [createDelivery] = useCreateRequestDeliveryMutation();
//   const [updateDelivery] = useUpdateRequestDeliveryMutation();
//   const [selectedGatePasses, setSelectedGatePasses] = useState<GatePassSelection[]>([]);
//   const { refetch } = useFetchRequestDepositorsQuery();
//   const memoizedRequestDeposits = useMemo(() => requestDeposits, [requestDeposits]);

//   const formik = useFormik<RequestDeliveryType>({
//     initialValues: editDelivery || {
//       deposit_reference_id: 0,
//       withdrawal_date: new Date().toISOString().slice(0, 16),
//       delivery_note_issue_date: new Date().toISOString().slice(0, 16),
//       withdrawal_ledger_page_number: 0,
//       measurment_or_weight: 0,
//       weightUnit: 'kg',
//       total_cost_of_goods: 0,
//       details_of_number_of_bags_sacks: 0,
//       delivery_note_number: 0,
//       gate_passes: [],
//     },
//     validationSchema: Yup.object({
//       deposit_reference_id: Yup.number()
//         .min(1, 'Please select a deposit reference')
//         .required('Deposit reference is required'),
//       withdrawal_date: Yup.string().required('Withdrawal date is required'),
//       delivery_note_issue_date: Yup.string().required('Delivery note issue date is required'),
//       withdrawal_ledger_page_number: Yup.number()
//         .min(1, 'Withdrawal ledger page number must be positive')
//         .required('Withdrawal ledger page number is required'),
//       measurment_or_weight: Yup.number()
//         .min(0, 'Measurement or weight must be non-negative')
//         .test(
//           'max-weight',
//           'Weight cannot exceed remaining deposit weight',
//           function (value) {
//             const { deposit_reference_id } = this.parent;
//             const selectedDeposit = memoizedRequestDeposits?.result?.find(
//               (deposit: any) => deposit.id === deposit_reference_id
//             );
//             return value <= (selectedDeposit?.remaining_weight || 0);
//           }
//         )
        
//         .required('Measurement or weight is required'),
//       weightUnit: Yup.string()
//         .oneOf(['kg', 'tons', 'quintals', 'liters'], 'Invalid weight unit')
//         .required('Weight unit is required'),
//       total_cost_of_goods: Yup.number()
//         .min(0, 'Total cost must be non-negative')
//         .required('Total cost is required'),
//       details_of_number_of_bags_sacks: Yup.number()
//         .min(0, 'Number of bags/sacks must be non-negative')
//         .test(
//           'max-bags',
//           'Number of bags cannot exceed remaining deposit bags',
//           function (value) {
//             const { deposit_reference_id } = this.parent;
//             const selectedDeposit = memoizedRequestDeposits?.result?.find(
//               (deposit: any) => deposit.id === deposit_reference_id
//             );
//             return value <= (selectedDeposit?.remaining_bags || 0);
//           }
//         )
        
//         .required('Number of bags/sacks is required'),
//       delivery_note_number: Yup.number()
//         .min(1, 'Delivery note number must be positive')
//         .required('Delivery note number is required'),
      
//     }),
//     onSubmit: async (values) => {
//       try {
//         const payload = {
//           ...values,
//           gate_passes: JSON.stringify(selectedGatePasses),
//         };
//         if (isEdit && editDeliveryId) {
//           const response: any = await updateDelivery({ id: editDeliveryId, payload }).unwrap();
//           toast.success(response?.message || 'Delivery updated successfully');
//         } else {
//           const response: any = await createDelivery(payload).unwrap();
//           toast.success(response?.message || 'Delivery created successfully');
//           refetch();
//         }
//         onClose();
//         formik.resetForm();
//         setSelectedGatePasses([]);
//       } catch (error: any) {
//         toast.error(error?.data?.message || 'Something went wrong');
//         onClose();
//       }
//     },
//     enableReinitialize: true,
//   });

//   const selectedDeposit = memoizedRequestDeposits?.result?.find(
//     (deposit: any) => deposit.id === formik.values.deposit_reference_id
//   );

//   // Auto-fill initial values for weight and bags from deposit on first selection
//   React.useEffect(() => {
//     if (!formik.values.deposit_reference_id || isEdit) return;

//     const selectedDeposit = memoizedRequestDeposits?.result?.find(
//       (deposit: any) => deposit.id === formik.values.deposit_reference_id
//     );

//     if (selectedDeposit) {
//       formik.setFieldValue('measurment_or_weight', selectedDeposit.remaining_weight || 0);
//       formik.setFieldValue('details_of_number_of_bags_sacks', selectedDeposit.remaining_bags || 0);
//       formik.setFieldValue('weightUnit', selectedDeposit.weightUnit || 'kg');
//     }
//   }, [formik.values.deposit_reference_id]);

//   // Calculate total cost based on weight and market price
//   React.useEffect(() => {
//     if (selectedDeposit) {
//       const weight = formik.values.measurment_or_weight || 0;
//       const unit = formik.values.weightUnit || selectedDeposit.weightUnit;
//       const marketPrice = selectedDeposit.market_price;

//       const weightInQuintals = convertToQuintals(weight, unit);
//       const totalCost = weightInQuintals * marketPrice;

//       formik.setFieldValue('total_cost_of_goods', totalCost);
//     }
//   }, [
//     formik.values.measurment_or_weight,
//     formik.values.weightUnit,
//     formik.values.deposit_reference_id,
//     memoizedRequestDeposits,
//   ]);

//   // Initialize gate passes for editing
//   React.useEffect(() => {
//     if (isEdit && editDelivery?.gate_passes) {
//       setSelectedGatePasses(editDelivery.gate_passes);
//     } else {
//       setSelectedGatePasses([]);
//     }
//   }, [isEdit, editDelivery]);

//   const handleGatePassSelection = (
//     gatePassId: number,
//     checked: boolean,
//     weightUnit: string
//   ) => {
//     if (checked) {
//       setSelectedGatePasses((prev) => [
//         ...prev,
//         { gatePassId, withdrawn_weight: 0, withdrawn_bags: 0, weightUnit },
//       ]);
//     } else {
//       setSelectedGatePasses((prev) =>
//         prev.filter((gp) => gp.gatePassId !== gatePassId)
//       );
//     }
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogTitle>{isEdit ? 'Edit Request Delivery' : 'Add Request Delivery'}</DialogTitle>
//       <DialogContent>
//         <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
//           <FormControl error={formik.touched.deposit_reference_id && !!formik.errors.deposit_reference_id}>
//             <FormLabel htmlFor="deposit-reference-label">Deposit Reference</FormLabel>
//             <Select
//               labelId="deposit-reference-label"
//               id="deposit_reference_id"
//               {...formik.getFieldProps('deposit_reference_id')}
//               label="Deposit Reference"
//               disabled={isEdit || !!editDelivery}
//               onChange={(e) => {
//                 formik.handleChange(e);
//                 setSelectedGatePasses([]);
//               }}
//             >
//               <MenuItem value={0} disabled>
//                 Select Deposit Reference
//               </MenuItem>
//               {memoizedRequestDeposits?.result?.map((deposit: any) => (
//                 <MenuItem key={deposit.id} value={deposit.id}>
//                   {deposit.receipt_number || `Deposit ${deposit.id}`}
//                 </MenuItem>
//               ))}
//             </Select>
//             {formik.touched.deposit_reference_id && formik.errors.deposit_reference_id && (
//               <Typography variant="caption" color="error">
//                 {formik.errors.deposit_reference_id}
//               </Typography>
//             )}
//           </FormControl>

//           {selectedDeposit && (
//             <FormControl>
//               <FormLabel>Select Gate Passes</FormLabel>
//               <List>
//                 {selectedDeposit.gatePasses?.map((gatePass: any) => (
//                   <ListItem key={gatePass.id}>
//                     <Checkbox
//                       checked={selectedGatePasses.some((gp) => gp.gatePassId === gatePass.id)}
//                       onChange={(e) => {
//                         const checked = e.target.checked;
//                         handleGatePassSelection(
//                           gatePass.id,
//                           checked,
//                           gatePass.weightUnit || formik.values.weightUnit
//                         );
//                       }}
//                     />
//                     <ListItemText
//                       primary={`Gate Pass ${gatePass.id} - Warehouse: ${gatePass.warehouse?.name}, Godown: ${gatePass.godown?.name}, Stack: ${gatePass.stack?.name}`}
//                       secondary={`Available for Delivery: ${gatePass.GatePassRequestDepositer.del_rem_weight || 0} ${gatePass.weightUnit}, ${gatePass.GatePassRequestDepositer.del_rem_bags || 0} bags`}
//                     />
//                     {selectedGatePasses.some((gp) => gp.gatePassId === gatePass.id) && (
//                       <ListItemSecondaryAction>
//                         <TextField
//                           label="Withdrawn Weight"
//                           type="number"
//                           value={
//                             selectedGatePasses.find((gp) => gp.gatePassId === gatePass.id)?.withdrawn_weight || 0
//                           }
//                           onChange={(e) => {
//                             const newWeight = parseFloat(e.target.value) || 0;
//                             if (newWeight > (gatePass.GatePassRequestDepositer.del_rem_weight || 0)) {
//                               toast.error(`Withdrawn weight cannot exceed ${gatePass.GatePassRequestDepositer.del_rem_weight} ${gatePass.weightUnit}`);
//                               return;
//                             }
//                             setSelectedGatePasses((prev) =>
//                               prev.map((gp) =>
//                                 gp.gatePassId === gatePass.id
//                                   ? { ...gp, withdrawn_weight: newWeight }
//                                   : gp
//                               )
//                             );
//                           }}
//                           inputProps={{ min: 0, max: gatePass.GatePassRequestDepositer.del_rem_weight || 0, step: 0.01 }}
//                           sx={{ width: '120px', mr: 1 }}
//                         />
//                         <TextField
//                           label="Withdrawn Bags"
//                           type="number"
//                           value={
//                             selectedGatePasses.find((gp) => gp.gatePassId === gatePass.id)?.withdrawn_bags || 0
//                           }
//                           onChange={(e) => {
//                             const newBags = parseInt(e.target.value) || 0;
//                             if (newBags > (gatePass.GatePassRequestDepositer.del_rem_bags || 0)) {
//                               toast.error(`Withdrawn bags cannot exceed ${gatePass.GatePassRequestDepositer.del_rem_bags} bags`);
//                               return;
//                             }
//                             setSelectedGatePasses((prev) =>
//                               prev.map((gp) =>
//                                 gp.gatePassId === gatePass.id
//                                   ? { ...gp, withdrawn_bags: newBags }
//                                   : gp
//                               )
//                             );
//                           }}
//                           inputProps={{ min: 0, max: gatePass.GatePassRequestDepositer.del_rem_bags || 0 }}
//                           sx={{ width: '120px' }}
//                         />
//                       </ListItemSecondaryAction>
//                     )}
//                   </ListItem>
//                 ))}
//               </List>
//               {formik.touched.gate_passes && formik.errors.gate_passes && (
//                 <Typography variant="caption" color="error">
//                   {formik.errors.gate_passes}
//                 </Typography>
//               )}
//             </FormControl>
//           )}

//           <FormControl>
//             <FormLabel htmlFor="withdrawal_date">Withdrawal Date</FormLabel>
//             <TextField
//               id="withdrawal_date"
//               type="datetime-local"
//               {...formik.getFieldProps('withdrawal_date')}
//               fullWidth
//               variant="outlined"
//               error={formik.touched.withdrawal_date && !!formik.errors.withdrawal_date}
//               helperText={formik.touched.withdrawal_date && formik.errors.withdrawal_date}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="delivery_note_issue_date">Delivery Note Issue Date</FormLabel>
//             <TextField
//               id="delivery_note_issue_date"
//               type="datetime-local"
//               {...formik.getFieldProps('delivery_note_issue_date')}
//               fullWidth
//               variant="outlined"
//               error={formik.touched.delivery_note_issue_date && !!formik.errors.delivery_note_issue_date}
//               helperText={formik.touched.delivery_note_issue_date && formik.errors.delivery_note_issue_date}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="withdrawal_ledger_page_number">Withdrawal Ledger Page Number</FormLabel>
//             <TextField
//               id="withdrawal_ledger_page_number"
//               type="number"
//               {...formik.getFieldProps('withdrawal_ledger_page_number')}
//               placeholder="Withdrawal Ledger Page Number"
//               fullWidth
//               variant="outlined"
//               error={formik.touched.withdrawal_ledger_page_number && !!formik.errors.withdrawal_ledger_page_number}
//               helperText={formik.touched.withdrawal_ledger_page_number && formik.errors.withdrawal_ledger_page_number}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="measurment_or_weight">Measurement or Weight</FormLabel>
//             <TextField
//               id="measurment_or_weight"
//               type="number"
//               {...formik.getFieldProps('measurment_or_weight')}
//               placeholder="Measurement or Weight"
//               fullWidth
//               variant="outlined"
//               inputProps={{
//                 min: 0,
//                 step: 0.01,
//                 max: selectedDeposit?.remaining_weight || 0,
//               }}
//               error={formik.touched.measurment_or_weight && !!formik.errors.measurment_or_weight}
//               helperText={formik.touched.measurment_or_weight && formik.errors.measurment_or_weight}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="weightUnit">Weight Unit</FormLabel>
//             <Select
//               id="weightUnit"
//               {...formik.getFieldProps('weightUnit')}
//               variant="outlined"
//             >
//               <MenuItem value="kg">Kg</MenuItem>
//               <MenuItem value="tons">Tons</MenuItem>
//               <MenuItem value="quintals">Quintals</MenuItem>
//               <MenuItem value="liters">Liters</MenuItem>
//             </Select>
//             {formik.touched.weightUnit && formik.errors.weightUnit && (
//               <Typography variant="caption" color="error">{formik.errors.weightUnit}</Typography>
//             )}
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="total_cost_of_goods">Total Cost</FormLabel>
//             <TextField
//               id="total_cost_of_goods"
//               type="number"
//               {...formik.getFieldProps('total_cost_of_goods')}
//               placeholder="Total Cost"
//               fullWidth
//               variant="outlined"
//               InputProps={{
//                 readOnly: true,
//               }}
//               error={formik.touched.total_cost_of_goods && !!formik.errors.total_cost_of_goods}
//               helperText={formik.touched.total_cost_of_goods && formik.errors.total_cost_of_goods}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="details_of_number_of_bags_sacks">Number of Bags/Sacks</FormLabel>
//             <TextField
//               id="details_of_number_of_bags_sacks"
//               type="number"
//               {...formik.getFieldProps('details_of_number_of_bags_sacks')}
//               placeholder="Number of Bags/Sacks"
//               fullWidth
//               variant="outlined"
//               inputProps={{
//                 min: 0,
//                 max: selectedDeposit?.remaining_bags || 0,
//               }}
//               error={formik.touched.details_of_number_of_bags_sacks && !!formik.errors.details_of_number_of_bags_sacks}
//               helperText={formik.touched.details_of_number_of_bags_sacks && formik.errors.details_of_number_of_bags_sacks}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="delivery_note_number">Delivery Note Number</FormLabel>
//             <TextField
//               id="delivery_note_number"
//               type="number"
//               {...formik.getFieldProps('delivery_note_number')}
//               placeholder="Delivery Note Number"
//               fullWidth
//               variant="outlined"
//               error={formik.touched.delivery_note_number && !!formik.errors.delivery_note_number}
//               helperText={formik.touched.delivery_note_number && formik.errors.delivery_note_number}
//             />
//           </FormControl>
//           <Button
//             type="submit"
//             variant="contained"
//             color="primary"
//             fullWidth
//             disabled={formik.isSubmitting}
//             sx={{ textTransform: 'none' }}
//           >
//             {isEdit ? 'Update' : 'Submit'}
//           </Button>
//         </Box>
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
//           Cancel
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default CreateDeliveryForm;
// import React, { useState, useMemo } from 'react';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';
// import {
//   Box,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   FormControl,
//   FormLabel,
//   Select,
//   MenuItem,
//   TextField,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction,
//   Checkbox,
// } from '@mui/material';
// import toast from 'react-hot-toast';
// import { useCreateRequestDeliveryMutation, useUpdateRequestDeliveryMutation } from '../../RTK/services/requestDeliveryApi';
// import { useFetchRequestDepositorsQuery } from '../../RTK/services/requestDepositorApi';

// const convertToQuintals = (weight: number, unit: string): number => {
//   switch (unit) {
//     case 'kg':
//       return weight / 100;
//     case 'tons':
//       return weight * 10;
//     case 'quintals':
//       return weight;
//     case 'liters':
//       return weight / 100;
//     default:
//       return weight;
//   }
// };

// const convertFromQuintals = (quintals: number, unit: string): number => {
//   switch (unit) {
//     case 'kg':
//       return quintals * 100;
//     case 'tons':
//       return quintals / 10;
//     case 'quintals':
//       return quintals;
//     case 'liters':
//       return quintals * 100;
//     default:
//       return quintals;
//   }
// };

// interface GatePassSelection {
//   gatePassId: number;
//   withdrawn_weight: number;
//   withdrawn_bags: number;
//   weightUnit: string;
// }

// interface RequestDeliveryType {
//   id?: number;
//   deposit_reference_id: number;
//   withdrawal_date: string;
//   delivery_note_issue_date: string;
//   withdrawal_ledger_page_number: number;
//   measurment_or_weight: number;
//   weightUnit: string;
//   total_cost_of_goods: number;
//   details_of_number_of_bags_sacks: number;
//   delivery_note_number: number;
//   gate_passes?: GatePassSelection[];
// }

// interface CreateDeliveryFormProps {
//   open: boolean;
//   onClose: () => void;
//   isEdit: boolean;
//   editDelivery?: RequestDeliveryType;
//   requestDeposits: any;
//   editDeliveryId?: number | null;
// }

// const CreateDeliveryForm: React.FC<CreateDeliveryFormProps> = ({
//   open,
//   onClose,
//   isEdit,
//   editDelivery,
//   requestDeposits,
//   editDeliveryId,
// }) => {
//   const [createDelivery] = useCreateRequestDeliveryMutation();
//   const [updateDelivery] = useUpdateRequestDeliveryMutation();
//   const [selectedGatePasses, setSelectedGatePasses] = useState<GatePassSelection[]>([]);
//   const { refetch } = useFetchRequestDepositorsQuery();
//   const memoizedRequestDeposits = useMemo(() => requestDeposits, [requestDeposits]);

//   const formik = useFormik<RequestDeliveryType>({
//     initialValues: editDelivery || {
//       deposit_reference_id: 0,
//       withdrawal_date: new Date().toISOString().slice(0, 16),
//       delivery_note_issue_date: new Date().toISOString().slice(0, 16),
//       withdrawal_ledger_page_number: 0,
//       measurment_or_weight: 0,
//       weightUnit: 'kg',
//       total_cost_of_goods: 0,
//       details_of_number_of_bags_sacks: 0,
//       delivery_note_number: 0,
//       gate_passes: [],
//     },
//     validationSchema: Yup.object({
//       deposit_reference_id: Yup.number()
//         .min(1, 'Please select a deposit reference')
//         .required('Deposit reference is required'),
//       withdrawal_date: Yup.string().required('Withdrawal date is required'),
//       delivery_note_issue_date: Yup.string().required('Delivery note issue date is required'),
//       withdrawal_ledger_page_number: Yup.number()
//         .min(1, 'Withdrawal ledger page number must be positive')
//         .required('Withdrawal ledger page number is required'),
//       measurment_or_weight: Yup.number()
//         .min(0, 'Measurement or weight must be non-negative')
//         .test(
//           'max-weight',
//           'Weight cannot exceed remaining deposit weight',
//           function (value) {
//             const { deposit_reference_id, weightUnit } = this.parent;
//             const selectedDeposit = memoizedRequestDeposits?.result?.find(
//               (deposit: any) => deposit.id === deposit_reference_id
//             );
//             if (!selectedDeposit) return true;
//             const remaining_quintals = convertToQuintals(selectedDeposit.remaining_weight || 0, selectedDeposit.weightUnit);
//             const value_quintals = convertToQuintals(value || 0, weightUnit);
//             return value_quintals <= remaining_quintals;
//           }
//         )
//         .required('Measurement or weight is required'),
//       weightUnit: Yup.string()
//         .oneOf(['kg', 'tons', 'quintals', 'liters'], 'Invalid weight unit')
//         .required('Weight unit is required'),
//       total_cost_of_goods: Yup.number()
//         .min(0, 'Total cost must be non-negative')
//         .required('Total cost is required'),
//       details_of_number_of_bags_sacks: Yup.number()
//         .min(0, 'Number of bags/sacks must be non-negative')
//         .test(
//           'max-bags',
//           'Number of bags cannot exceed remaining deposit bags',
//           function (value) {
//             const { deposit_reference_id } = this.parent;
//             const selectedDeposit = memoizedRequestDeposits?.result?.find(
//               (deposit: any) => deposit.id === deposit_reference_id
//             );
//             return value <= (selectedDeposit?.remaining_bags || 0);
//           }
//         )
//         .required('Number of bags/sacks is required'),
//       delivery_note_number: Yup.number()
//         .min(1, 'Delivery note number must be positive')
//         .required('Delivery note number is required'),
//     }),
//     onSubmit: async (values) => {
//       try {
//         const payload = {
//           ...values,
//           gate_passes: JSON.stringify(selectedGatePasses),
//         };
//         if (isEdit && editDeliveryId) {
//           const response: any = await updateDelivery({ id: editDeliveryId, payload }).unwrap();
//           toast.success(response?.message || 'Delivery updated successfully');
//         } else {
//           const response: any = await createDelivery(payload).unwrap();
//           toast.success(response?.message || 'Delivery created successfully');
//           refetch();
//         }
//         onClose();
//         formik.resetForm();
//         setSelectedGatePasses([]);
//       } catch (error: any) {
//         toast.error(error?.data?.message || 'Something went wrong');
//         onClose();
//       }
//     },
//     enableReinitialize: true,
//   });

//   const selectedDeposit = memoizedRequestDeposits?.result?.find(
//     (deposit: any) => deposit.id === formik.values.deposit_reference_id
//   );

//   // Calculate totals based on selected gate passes
//   React.useEffect(() => {
//     let total_quintals = 0;
//     let total_bags = 0;

//     selectedGatePasses.forEach((gp) => {
//       total_quintals += convertToQuintals(gp.withdrawn_weight, gp.weightUnit);
//       total_bags += gp.withdrawn_bags;
//     });

//     const total_weight = convertFromQuintals(total_quintals, formik.values.weightUnit);

//     formik.setFieldValue('measurment_or_weight', total_weight);
//     formik.setFieldValue('details_of_number_of_bags_sacks', total_bags);
//   }, [selectedGatePasses, formik.values.weightUnit]);

//   // Calculate total cost based on weight and market price
//   React.useEffect(() => {
//     if (selectedDeposit) {
//       const weight = formik.values.measurment_or_weight || 0;
//       const unit = formik.values.weightUnit || selectedDeposit.weightUnit;
//       const marketPrice = selectedDeposit.market_price;

//       const weightInQuintals = convertToQuintals(weight, unit);
//       const totalCost = weightInQuintals * marketPrice;

//       formik.setFieldValue('total_cost_of_goods', totalCost);
//     }
//   }, [
//     formik.values.measurment_or_weight,
//     formik.values.weightUnit,
//     formik.values.deposit_reference_id,
//     memoizedRequestDeposits,
//   ]);

//   // Initialize gate passes for editing
//   React.useEffect(() => {
//     if (isEdit && editDelivery?.gate_passes) {
//       setSelectedGatePasses(editDelivery.gate_passes);
//     } else {
//       setSelectedGatePasses([]);
//     }
//   }, [isEdit, editDelivery]);

//   const handleGatePassSelection = (
//     gatePass: any,
//     checked: boolean
//   ) => {
//     const gatePassId = gatePass.id;
//     if (checked) {
//       const avail_weight = gatePass.GatePassRequestDepositer.del_rem_weight || 0;
//       const avail_bags = gatePass.GatePassRequestDepositer.del_rem_bags || 0;
//       const weightUnit = gatePass.weightUnit || formik.values.weightUnit;
//       setSelectedGatePasses((prev) => [
//         ...prev,
//         { gatePassId, withdrawn_weight: avail_weight, withdrawn_bags: avail_bags, weightUnit },
//       ]);
//     } else {
//       setSelectedGatePasses((prev) =>
//         prev.filter((gp) => gp.gatePassId !== gatePassId)
//       );
//     }
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogTitle>{isEdit ? 'Edit Request Delivery' : 'Add Request Delivery'}</DialogTitle>
//       <DialogContent>
//         <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
//           <FormControl error={formik.touched.deposit_reference_id && !!formik.errors.deposit_reference_id}>
//             <FormLabel htmlFor="deposit-reference-label">Deposit Reference</FormLabel>
//             <Select
//               labelId="deposit-reference-label"
//               id="deposit_reference_id"
//               {...formik.getFieldProps('deposit_reference_id')}
//               label="Deposit Reference"
//               disabled={isEdit || !!editDelivery}
//               onChange={(e) => {
//                 formik.handleChange(e);
//                 setSelectedGatePasses([]);
//               }}
//             >
//               <MenuItem value={0} disabled>
//                 Select Deposit Reference
//               </MenuItem>
//               {memoizedRequestDeposits?.result?.map((deposit: any) => (
//                 <MenuItem key={deposit.id} value={deposit.id}>
//                   {deposit.receipt_number || `Deposit ${deposit.id}`}
//                 </MenuItem>
//               ))}
//             </Select>
//             {formik.touched.deposit_reference_id && formik.errors.deposit_reference_id && (
//               <Typography variant="caption" color="error">
//                 {formik.errors.deposit_reference_id}
//               </Typography>
//             )}
//           </FormControl>

//           {selectedDeposit && (
//             <FormControl>
//               <FormLabel>Select Gate Passes</FormLabel>
//               <List>
//                 {selectedDeposit.gatePasses?.map((gatePass: any) => (
//                   <ListItem key={gatePass.id}>
//                     <Checkbox
//                       checked={selectedGatePasses.some((gp) => gp.gatePassId === gatePass.id)}
//                       onChange={(e) => {
//                         const checked = e.target.checked;
//                         handleGatePassSelection(
//                           gatePass,
//                           checked
//                         );
//                       }}
//                     />
//                     <ListItemText
//                       primary={`Gate Pass ${gatePass.id} - Warehouse: ${gatePass.warehouse?.name}, Godown: ${gatePass.godown?.name}, Stack: ${gatePass.stack?.name}`}
//                       secondary={`Available for Delivery: ${gatePass.GatePassRequestDepositer.del_rem_weight || 0} ${gatePass.weightUnit}, ${gatePass.GatePassRequestDepositer.del_rem_bags || 0} bags`}
//                     />
//                     {selectedGatePasses.some((gp) => gp.gatePassId === gatePass.id) && (
//                       <ListItemSecondaryAction>
//                         <TextField
//                           label="Withdrawn Weight"
//                           type="number"
//                           value={
//                             selectedGatePasses.find((gp) => gp.gatePassId === gatePass.id)?.withdrawn_weight || 0
//                           }
//                           onChange={(e) => {
//                             const newWeight = parseFloat(e.target.value) || 0;
//                             if (newWeight > (gatePass.GatePassRequestDepositer.del_rem_weight || 0)) {
//                               toast.error(`Withdrawn weight cannot exceed ${gatePass.GatePassRequestDepositer.del_rem_weight} ${gatePass.weightUnit}`);
//                               return;
//                             }
//                             setSelectedGatePasses((prev) =>
//                               prev.map((gp) =>
//                                 gp.gatePassId === gatePass.id
//                                   ? { ...gp, withdrawn_weight: newWeight }
//                                   : gp
//                               )
//                             );
//                           }}
//                           inputProps={{ min: 0, max: gatePass.GatePassRequestDepositer.del_rem_weight || 0, step: 0.01 }}
//                           sx={{ width: '120px', mr: 1 }}
//                         />
//                         <TextField
//                           label="Withdrawn Bags"
//                           type="number"
//                           value={
//                             selectedGatePasses.find((gp) => gp.gatePassId === gatePass.id)?.withdrawn_bags || 0
//                           }
//                           onChange={(e) => {
//                             const newBags = parseInt(e.target.value) || 0;
//                             if (newBags > (gatePass.GatePassRequestDepositer.del_rem_bags || 0)) {
//                               toast.error(`Withdrawn bags cannot exceed ${gatePass.GatePassRequestDepositer.del_rem_bags} bags`);
//                               return;
//                             }
//                             setSelectedGatePasses((prev) =>
//                               prev.map((gp) =>
//                                 gp.gatePassId === gatePass.id
//                                   ? { ...gp, withdrawn_bags: newBags }
//                                   : gp
//                               )
//                             );
//                           }}
//                           inputProps={{ min: 0, max: gatePass.GatePassRequestDepositer.del_rem_bags || 0 }}
//                           sx={{ width: '120px' }}
//                         />
//                       </ListItemSecondaryAction>
//                     )}
//                   </ListItem>
//                 ))}
//               </List>
//             </FormControl>
//           )}

//           <FormControl>
//             <FormLabel htmlFor="withdrawal_date">Withdrawal Date</FormLabel>
//             <TextField
//               id="withdrawal_date"
//               type="datetime-local"
//               {...formik.getFieldProps('withdrawal_date')}
//               fullWidth
//               variant="outlined"
//               error={formik.touched.withdrawal_date && !!formik.errors.withdrawal_date}
//               helperText={formik.touched.withdrawal_date && formik.errors.withdrawal_date}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="delivery_note_issue_date">Delivery Note Issue Date</FormLabel>
//             <TextField
//               id="delivery_note_issue_date"
//               type="datetime-local"
//               {...formik.getFieldProps('delivery_note_issue_date')}
//               fullWidth
//               variant="outlined"
//               error={formik.touched.delivery_note_issue_date && !!formik.errors.delivery_note_issue_date}
//               helperText={formik.touched.delivery_note_issue_date && formik.errors.delivery_note_issue_date}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="withdrawal_ledger_page_number">Withdrawal Ledger Page Number</FormLabel>
//             <TextField
//               id="withdrawal_ledger_page_number"
//               type="number"
//               {...formik.getFieldProps('withdrawal_ledger_page_number')}
//               placeholder="Withdrawal Ledger Page Number"
//               fullWidth
//               variant="outlined"
//               error={formik.touched.withdrawal_ledger_page_number && !!formik.errors.withdrawal_ledger_page_number}
//               helperText={formik.touched.withdrawal_ledger_page_number && formik.errors.withdrawal_ledger_page_number}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="measurment_or_weight">Measurement or Weight</FormLabel>
//             <TextField
//               id="measurment_or_weight"
//               type="number"
//               {...formik.getFieldProps('measurment_or_weight')}
//               placeholder="Measurement or Weight"
//               fullWidth
//               variant="outlined"
//               InputProps={{
//                 readOnly: true,
//               }}
//               error={formik.touched.measurment_or_weight && !!formik.errors.measurment_or_weight}
//               helperText={formik.touched.measurment_or_weight && formik.errors.measurment_or_weight}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="weightUnit">Weight Unit</FormLabel>
//             <Select
//               id="weightUnit"
//               {...formik.getFieldProps('weightUnit')}
//               variant="outlined"
//             >
//               <MenuItem value="kg">Kg</MenuItem>
//               <MenuItem value="tons">Tons</MenuItem>
//               <MenuItem value="quintals">Quintals</MenuItem>
//               <MenuItem value="liters">Liters</MenuItem>
//             </Select>
//             {formik.touched.weightUnit && formik.errors.weightUnit && (
//               <Typography variant="caption" color="error">{formik.errors.weightUnit}</Typography>
//             )}
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="total_cost_of_goods">Total Cost</FormLabel>
//             <TextField
//               id="total_cost_of_goods"
//               type="number"
//               {...formik.getFieldProps('total_cost_of_goods')}
//               placeholder="Total Cost"
//               fullWidth
//               variant="outlined"
//               InputProps={{
//                 readOnly: true,
//               }}
//               error={formik.touched.total_cost_of_goods && !!formik.errors.total_cost_of_goods}
//               helperText={formik.touched.total_cost_of_goods && formik.errors.total_cost_of_goods}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="details_of_number_of_bags_sacks">Number of Bags/Sacks</FormLabel>
//             <TextField
//               id="details_of_number_of_bags_sacks"
//               type="number"
//               {...formik.getFieldProps('details_of_number_of_bags_sacks')}
//               placeholder="Number of Bags/Sacks"
//               fullWidth
//               variant="outlined"
//               InputProps={{
//                 readOnly: true,
//               }}
//               error={formik.touched.details_of_number_of_bags_sacks && !!formik.errors.details_of_number_of_bags_sacks}
//               helperText={formik.touched.details_of_number_of_bags_sacks && formik.errors.details_of_number_of_bags_sacks}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel htmlFor="delivery_note_number">Delivery Note Number</FormLabel>
//             <TextField
//               id="delivery_note_number"
//               type="number"
//               {...formik.getFieldProps('delivery_note_number')}
//               placeholder="Delivery Note Number"
//               fullWidth
//               variant="outlined"
//               error={formik.touched.delivery_note_number && !!formik.errors.delivery_note_number}
//               helperText={formik.touched.delivery_note_number && formik.errors.delivery_note_number}
//             />
//           </FormControl>
//           <Button
//             type="submit"
//             variant="contained"
//             color="primary"
//             fullWidth
//             disabled={formik.isSubmitting}
//             sx={{ textTransform: 'none' }}
//           >
//             {isEdit ? 'Update' : 'Submit'}
//           </Button>
//         </Box>
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
//           Cancel
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default CreateDeliveryForm;
import React, { useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
} from '@mui/material';
import toast from 'react-hot-toast';
import { useCreateRequestDeliveryMutation, useUpdateRequestDeliveryMutation } from '../../RTK/services/requestDeliveryApi';
import { useFetchRequestDepositorsQuery } from '../../RTK/services/requestDepositorApi';

const convertToQuintals = (weight: number, unit: string): number => {
  console.log(`Converting ${weight} from ${unit} to quintals`);
  switch (unit.toLowerCase()) {
    case 'kg':
      return weight / 100; // 1 quintal = 100 kg
    case 'tons':
      return weight * 10; // 1 ton = 10 quintals
    case 'quintals':
      return weight; // Already in quintals
    case 'liters':
      return weight / 100; // Assuming 1 quintal = 100 liters
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
};

const convertFromQuintals = (quintals: number, unit: string): number => {
  switch (unit) {
    case 'kg':
      return quintals * 100;
    case 'tons':
      return quintals / 10;
    case 'quintals':
      return quintals;
    case 'liters':
      return quintals * 100;
    default:
      return quintals;
  }
};

interface GatePassSelection {
  gatePassId: number;
  withdrawn_weight: number;
  withdrawn_bags: number;
  weightUnit: string;
}

interface RequestDeliveryType {
  id?: number;
  deposit_reference_id: number;
  withdrawal_date: string;
  delivery_note_issue_date: string;
  withdrawal_ledger_page_number: number;
  measurment_or_weight: number;
  weightUnit: string;
  total_cost_of_goods: number;
  details_of_number_of_bags_sacks: number;
  delivery_note_number: number;
  gate_passes?: GatePassSelection[];
}

interface CreateDeliveryFormProps {
  open: boolean;
  onClose: () => void;
  isEdit: boolean;
  editDelivery?: RequestDeliveryType;
  requestDeposits: any;
  editDeliveryId?: number | null;
}

const CreateDeliveryForm: React.FC<CreateDeliveryFormProps> = ({
  open,
  onClose,
  isEdit,
  editDelivery,
  requestDeposits,
  editDeliveryId,
}) => {
  const [createDelivery] = useCreateRequestDeliveryMutation();
  const [updateDelivery] = useUpdateRequestDeliveryMutation();
  const [selectedGatePasses, setSelectedGatePasses] = useState<GatePassSelection[]>([]);
  const { refetch } = useFetchRequestDepositorsQuery({page: 1, limit: 10,search: ''});
  const memoizedRequestDeposits = useMemo(() => requestDeposits, [requestDeposits]);

  const formik = useFormik<RequestDeliveryType>({
    initialValues: editDelivery || {
      deposit_reference_id: 0,
      withdrawal_date: new Date().toISOString().slice(0, 16),
      delivery_note_issue_date: new Date().toISOString().slice(0, 16),
      withdrawal_ledger_page_number: 0,
      measurment_or_weight: 0,
      weightUnit: 'kg',
      total_cost_of_goods: 0,
      details_of_number_of_bags_sacks: 0,
      delivery_note_number: 0,
      gate_passes: [],
    },
    validationSchema: Yup.object({
      deposit_reference_id: Yup.number()
        .min(1, 'Please select a deposit reference')
        .required('Deposit reference is required'),
      withdrawal_date: Yup.string().required('Withdrawal date is required'),
      delivery_note_issue_date: Yup.string().required('Delivery note issue date is required'),
      withdrawal_ledger_page_number: Yup.number().optional().nullable(),
        // .min(1, 'Withdrawal ledger page number must be positive')
        // .required('Withdrawal ledger page number is required'),
      measurment_or_weight: Yup.number()
        .min(0, 'Measurement or weight must be non-negative')
        .test(
          'max-weight',
          'Weight cannot exceed remaining deposit weight',
          function (value) {
            const { deposit_reference_id, weightUnit } = this.parent;
            const selectedDeposit = memoizedRequestDeposits?.result?.find(
              (deposit: any) => deposit.id === deposit_reference_id
            );
            if (!selectedDeposit) return true;
            const remaining_quintals = convertToQuintals(selectedDeposit.remaining_weight || 0, selectedDeposit.weightUnit);
            const value_quintals = convertToQuintals(value || 0, weightUnit);
            return value_quintals <= remaining_quintals;
          }
        )
        .required('Measurement or weight is required'),
      weightUnit: Yup.string()
        .oneOf(['kg', 'tons', 'quintals', 'liters'], 'Invalid weight unit')
        .required('Weight unit is required'),
      total_cost_of_goods: Yup.number()
        .min(0, 'Total cost must be non-negative')
        .required('Total cost is required'),
      details_of_number_of_bags_sacks: Yup.number()
        .min(0, 'Number of bags/sacks must be non-negative')
        .test(
          'max-bags',
          'Number of bags cannot exceed remaining deposit bags',
          function (value) {
            const { deposit_reference_id } = this.parent;
            const selectedDeposit = memoizedRequestDeposits?.result?.find(
              (deposit: any) => deposit.id === deposit_reference_id
            );
            return value <= (selectedDeposit?.remaining_bags || 0);
          }
        )
        .required('Number of bags/sacks is required'),
      delivery_note_number: Yup.number().optional().nullable()
        // .min(1, 'Delivery note number must be positive')
        // .required('Delivery note number is required'),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          gate_passes: JSON.stringify(selectedGatePasses),
        };
        if (isEdit && editDeliveryId) {
          const response: any = await updateDelivery({ id: editDeliveryId, payload }).unwrap();
          toast.success(response?.message || 'Delivery updated successfully');
        } else {
          const response: any = await createDelivery(payload).unwrap();
          toast.success(response?.message || 'Delivery created successfully');
          refetch();
        }
        onClose();
        formik.resetForm();
        setSelectedGatePasses([]);
      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
        onClose();
      }
    },
    enableReinitialize: true,
  });

  const selectedDeposit = memoizedRequestDeposits?.result?.find(
    (deposit: any) => deposit.id === formik.values.deposit_reference_id
  );

  // Set weightUnit and other fields when deposit_reference_id changes
  React.useEffect(() => {
    if (!formik.values.deposit_reference_id || isEdit) return;

    const selectedDeposit = memoizedRequestDeposits?.result?.find(
      (deposit: any) => deposit.id === formik.values.deposit_reference_id
    );

    if (selectedDeposit) {
      formik.setFieldValue('weightUnit', selectedDeposit.weightUnit || 'kg');
    }
  }, [formik.values.deposit_reference_id]);

  // Calculate totals based on selected gate passes
  React.useEffect(() => {
    let total_quintals = 0;
    let total_bags = 0;

    selectedGatePasses.forEach((gp) => {
      console.log("gate pass", gp,gp.weightUnit);
      total_quintals += convertToQuintals(gp.withdrawn_weight, gp.weightUnit);
      total_bags += gp.withdrawn_bags;
    });
    console.log("total_quintals", total_quintals, "total_bags", total_bags);
    const total_weight = convertFromQuintals(total_quintals, formik.values.weightUnit);

    formik.setFieldValue('measurment_or_weight', total_weight);
    formik.setFieldValue('details_of_number_of_bags_sacks', total_bags);
  }, [selectedGatePasses, formik.values.weightUnit]);

  // Calculate total cost based on weight and market price
  React.useEffect(() => {
    if (selectedDeposit) {
      const weight = formik.values.measurment_or_weight || 0;
      const unit = formik.values.weightUnit || selectedDeposit.weightUnit;
      const marketPrice = selectedDeposit.market_price;

      const weightInQuintals = convertToQuintals(weight, unit);
      const totalCost = weightInQuintals * marketPrice;

      formik.setFieldValue('total_cost_of_goods', totalCost);
    }
  }, [
    formik.values.measurment_or_weight,
    formik.values.weightUnit,
    formik.values.deposit_reference_id,
    memoizedRequestDeposits,
  ]);

  // Initialize gate passes for editing
  React.useEffect(() => {
    if (isEdit && editDelivery?.gate_passes) {
      setSelectedGatePasses(editDelivery.gate_passes);
    } else {
      setSelectedGatePasses([]);
    }
  }, [isEdit, editDelivery]);

  const handleGatePassSelection = (
    gatePass: any,
    checked: boolean
  ) => {
    const gatePassId = gatePass.id;
    if (checked) {
      const avail_weight = gatePass.GatePassRequestDepositer.del_rem_weight || 0;
      const avail_bags = gatePass.GatePassRequestDepositer.del_rem_bags || 0;
      const weightUnit = gatePass.weightUnit || formik.values.weightUnit;
      setSelectedGatePasses((prev) => [
        ...prev,
        { gatePassId, withdrawn_weight: avail_weight, withdrawn_bags: avail_bags, weightUnit },
      ]);
    } else {
      setSelectedGatePasses((prev) =>
        prev.filter((gp) => gp.gatePassId !== gatePassId)
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Request Delivery' : 'Add Request Delivery'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl error={formik.touched.deposit_reference_id && !!formik.errors.deposit_reference_id}>
            <FormLabel htmlFor="deposit-reference-label">Deposit Reference</FormLabel>
            <Select
              labelId="deposit-reference-label"
              id="deposit_reference_id"
              {...formik.getFieldProps('deposit_reference_id')}
              label="Deposit Reference"
              disabled={isEdit || !!editDelivery}
              onChange={(e) => {
                formik.handleChange(e);
                setSelectedGatePasses([]);
              }}
            >
              <MenuItem value={0} disabled>
                Select Deposit Reference
              </MenuItem>
              {memoizedRequestDeposits?.result?.map((deposit: any) => (
                <MenuItem key={deposit.id} value={deposit.id}>
                  {deposit.receipt_number || `Deposit ${deposit.id}`}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.deposit_reference_id && formik.errors.deposit_reference_id && (
              <Typography variant="caption" color="error">
                {formik.errors.deposit_reference_id}
              </Typography>
            )}
          </FormControl>

          {selectedDeposit && (
            <FormControl>
              <FormLabel>Select Gate Passes</FormLabel>
              <List>
                {selectedDeposit.gatePasses?.map((gatePass: any) => (
                  <ListItem key={gatePass.id}>
                    <Checkbox
                      checked={selectedGatePasses.some((gp) => gp.gatePassId === gatePass.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleGatePassSelection(
                          gatePass,
                          checked
                        );
                      }}
                    />
                    <ListItemText
                      primary={`Gate Pass ${gatePass.id} - Warehouse: ${gatePass.warehouse?.name}, Godown: ${gatePass.godown?.name}, Stack: ${gatePass.stack?.name}`}
                      secondary={`Available for Delivery: ${gatePass.GatePassRequestDepositer.del_rem_weight || 0} ${gatePass.weightUnit}, ${gatePass.GatePassRequestDepositer.del_rem_bags || 0} bags`}
                    />
                    {selectedGatePasses.some((gp) => gp.gatePassId === gatePass.id) && (
                      <ListItemSecondaryAction>
                        <TextField
                          label="Withdrawn Weight"
                          type="number"
                          value={
                            selectedGatePasses.find((gp) => gp.gatePassId === gatePass.id)?.withdrawn_weight || 0
                          }
                          onChange={(e) => {
                            const newWeight = parseFloat(e.target.value) || 0;
                            if (newWeight > (gatePass.GatePassRequestDepositer.del_rem_weight || 0)) {
                              toast.error(`Withdrawn weight cannot exceed ${gatePass.GatePassRequestDepositer.del_rem_weight} ${gatePass.weightUnit}`);
                              return;
                            }
                            setSelectedGatePasses((prev) =>
                              prev.map((gp) =>
                                gp.gatePassId === gatePass.id
                                  ? { ...gp, withdrawn_weight: newWeight }
                                  : gp
                              )
                            );
                          }}
                          inputProps={{ min: 0, max: gatePass.GatePassRequestDepositer.del_rem_weight || 0, step: 0.01 }}
                          sx={{ width: '120px', mr: 1 }}
                        />
                        <TextField
                          label="Withdrawn Bags"
                          type="number"
                          value={
                            selectedGatePasses.find((gp) => gp.gatePassId === gatePass.id)?.withdrawn_bags || 0
                          }
                          onChange={(e) => {
                            const newBags = parseInt(e.target.value) || 0;
                            if (newBags > (gatePass.GatePassRequestDepositer.del_rem_bags || 0)) {
                              toast.error(`Withdrawn bags cannot exceed ${gatePass.GatePassRequestDepositer.del_rem_bags} bags`);
                              return;
                            }
                            setSelectedGatePasses((prev) =>
                              prev.map((gp) =>
                                gp.gatePassId === gatePass.id
                                  ? { ...gp, withdrawn_bags: newBags }
                                  : gp
                              )
                            );
                          }}
                          inputProps={{ min: 0, max: gatePass.GatePassRequestDepositer.del_rem_bags || 0 }}
                          sx={{ width: '120px' }}
                        />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </FormControl>
          )}

          <FormControl>
            <FormLabel htmlFor="withdrawal_date">Withdrawal Date</FormLabel>
            <TextField
              id="withdrawal_date"
              type="datetime-local"
              {...formik.getFieldProps('withdrawal_date')}
              fullWidth
              variant="outlined"
              error={formik.touched.withdrawal_date && !!formik.errors.withdrawal_date}
              helperText={formik.touched.withdrawal_date && formik.errors.withdrawal_date}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="delivery_note_issue_date">Delivery Note Issue Date</FormLabel>
            <TextField
              id="delivery_note_issue_date"
              type="datetime-local"
              {...formik.getFieldProps('delivery_note_issue_date')}
              fullWidth
              variant="outlined"
              error={formik.touched.delivery_note_issue_date && !!formik.errors.delivery_note_issue_date}
              helperText={formik.touched.delivery_note_issue_date && formik.errors.delivery_note_issue_date}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="withdrawal_ledger_page_number">Withdrawal Ledger Page Number</FormLabel>
            <TextField
              id="withdrawal_ledger_page_number"
              type="number"
              {...formik.getFieldProps('withdrawal_ledger_page_number')}
              placeholder="Withdrawal Ledger Page Number"
              fullWidth
              variant="outlined"
              error={formik.touched.withdrawal_ledger_page_number && !!formik.errors.withdrawal_ledger_page_number}
              helperText={formik.touched.withdrawal_ledger_page_number && formik.errors.withdrawal_ledger_page_number}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="measurment_or_weight">Measurement or Weight</FormLabel>
            <TextField
              id="measurment_or_weight"
              type="number"
              {...formik.getFieldProps('measurment_or_weight')}
              placeholder="Measurement or Weight"
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              error={formik.touched.measurment_or_weight && !!formik.errors.measurment_or_weight}
              helperText={formik.touched.measurment_or_weight && formik.errors.measurment_or_weight}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="weightUnit">Weight Unit</FormLabel>
            <TextField
              id="weightUnit"
              value={formik.values.weightUnit}
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              error={formik.touched.weightUnit && !!formik.errors.weightUnit}
              helperText={formik.touched.weightUnit && formik.errors.weightUnit}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="total_cost_of_goods">Total Cost</FormLabel>
            <TextField
              id="total_cost_of_goods"
              type="number"
              {...formik.getFieldProps('total_cost_of_goods')}
              placeholder="Total Cost"
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              error={formik.touched.total_cost_of_goods && !!formik.errors.total_cost_of_goods}
              helperText={formik.touched.total_cost_of_goods && formik.errors.total_cost_of_goods}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="details_of_number_of_bags_sacks">Number of Bags/Sacks</FormLabel>
            <TextField
              id="details_of_number_of_bags_sacks"
              type="number"
              {...formik.getFieldProps('details_of_number_of_bags_sacks')}
              placeholder="Number of Bags/Sacks"
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              error={formik.touched.details_of_number_of_bags_sacks && !!formik.errors.details_of_number_of_bags_sacks}
              helperText={formik.touched.details_of_number_of_bags_sacks && formik.errors.details_of_number_of_bags_sacks}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="delivery_note_number">Delivery Note Number</FormLabel>
            <TextField
              id="delivery_note_number"
              type="number"
              {...formik.getFieldProps('delivery_note_number')}
              placeholder="Delivery Note Number"
              fullWidth
              variant="outlined"
              error={formik.touched.delivery_note_number && !!formik.errors.delivery_note_number}
              helperText={formik.touched.delivery_note_number && formik.errors.delivery_note_number}
            />
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={formik.isSubmitting}
            sx={{ textTransform: 'none' }}
          >
            {isEdit ? 'Update' : 'Submit'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateDeliveryForm;
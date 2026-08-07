import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
} from '@react-pdf/renderer';


const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontWeight: 'bold',
    width: '45%',
  },
  value: {
    width: '55%',
  },
  divider: {
    borderBottom: '1 solid #ccc',
    marginVertical: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    padding: 4,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottom: '1 solid #ccc',
  },
  cell: {
    flex: 1,
  },
});

const DepositReceiptPDF = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Warehouse Receipt (WHR)</Text>

        {/* Receipt Info */}
        <Text style={styles.sectionTitle}>Receipt Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Receipt Number:</Text>
          <Text style={styles.value}>{data.receipt_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Deposit Date:</Text>
          <Text style={styles.value}>{new Date(data.Deposit_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Stock Register Page No:</Text>
          <Text style={styles.value}>{data.stock_registr_page_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Deposit Ledger Page No:</Text>
          <Text style={styles.value}>{data.deposit_ledger_page_number}</Text>
        </View>

        {/* Commodity Info */}
        <Text style={styles.sectionTitle}>Commodity Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Description of Goods:</Text>
          <Text style={styles.value}>{data.Description_of_goods}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Commodity:</Text>
          <Text style={styles.value}>{data.commodity.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Grade/Quality:</Text>
          <Text style={styles.value}>{data.grade_or_quality}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>No. of Bags/Sacks:</Text>
          <Text style={styles.value}>{data.details_of_number_of_bags_sacks}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Any Marks on Bags:</Text>
          <Text style={styles.value}>{data.any_marks_on_bags_detail}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Weight/Measurement:</Text>
          <Text style={styles.value}>{data.measurment_or_weight} {data.weightUnit}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Market Price:</Text>
          <Text style={styles.value}>{data.market_price}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Cost:</Text>
          <Text style={styles.value}>{data.total_cost_of_goods}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Damp Proof:</Text>
          <Text style={styles.value}>{data.damp_proof}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Proof of Weight:</Text>
          <Text style={styles.value}>{data.proof_of_weight}</Text>
        </View>

        {/* Client Info */}
        <Text style={styles.sectionTitle}>Client Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Client Name:</Text>
          <Text style={styles.value}>{data.client.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{data.client.category}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact:</Text>
          <Text style={styles.value}>{data.client.contact}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{data.client.address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{data.client.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GST Number:</Text>
          <Text style={styles.value}>{data.client.gstNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>State & City:</Text>
          <Text style={styles.value}>{data.client.state}, {data.client.city}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact Person:</Text>
          <Text style={styles.value}>{data.client.contactPersonName} ({data.client.contactPersonPhoneNumber})</Text>
        </View>

        {/* Company Info */}
        {/* <Text style={styles.sectionTitle}>Company Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Company Name:</Text>
          <Text style={styles.value}>{data.company.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact Person:</Text>
          <Text style={styles.value}>{data.company.contactPerson}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{data.company.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GST Number:</Text>
          <Text style={styles.value}>{data.company.gstNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{data.company.address}</Text>
        </View> */}

        {/* Rent Info */}
        <Text style={styles.sectionTitle}>Rent Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Rent Type:</Text>
          <Text style={styles.value}>{data.rent.rent_type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Rent Basis:</Text>
          <Text style={styles.value}>{data.rent.rent_basis}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Rent Amount:</Text>
          <Text style={styles.value}>{data.rent_amount} / {data.rent.rate_unit}</Text>
        </View>

        {/* Gate Passes */}
        {/* <Text style={styles.sectionTitle}>Gate Passes</Text>
        {data.gatePasses.map((gp, index) => (
          <View key={gp.id} style={{ marginBottom: 6 }}>
            <Text style={{ fontWeight: 'bold' }}>Gate Pass #{gp.id}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Warehouse:</Text>
              <Text style={styles.value}>{gp.warehouse.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Godown:</Text>
              <Text style={styles.value}>{gp.godown.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Stack:</Text>
              <Text style={styles.value}>{gp.stack.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>No. of Bags:</Text>
              <Text style={styles.value}>{gp.no_of_bags}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Weight:</Text>
              <Text style={styles.value}>{gp.weight} {gp.weightUnit}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle Number:</Text>
              <Text style={styles.value}>{gp.vehicle_number}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>In Time:</Text>
              <Text style={styles.value}>{new Date(gp.in_time).toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Out Time:</Text>
              <Text style={styles.value}>{new Date(gp.out_time).toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{gp.status}</Text>
            </View>
          </View>
        ))} */}
      </Page>
    </Document>
  );
};

export default DepositReceiptPDF;

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
});

const DeliveryRequestPDF = ({ data }) => {
  const deposit = data.deposit;
  const client = deposit.client;
  const company = data.company;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Delivery Request</Text>

        {/* Delivery Info */}
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Delivery Id</Text>
          <Text style={styles.value}>{data.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Delivery Note No:</Text>
          <Text style={styles.value}>{data.delivery_note_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Withdrawal Date:</Text>
          <Text style={styles.value}>{new Date(data.withdrawal_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Note Issue Date:</Text>
          <Text style={styles.value}>{new Date(data.delivery_note_issue_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ledger Page No:</Text>
          <Text style={styles.value}>{data.withdrawal_ledger_page_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>No. of Bags:</Text>
          <Text style={styles.value}>{data.details_of_number_of_bags_sacks}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Weight:</Text>
          <Text style={styles.value}>{data.measurment_or_weight} {data.weightUnit}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Cost:</Text>
          <Text style={styles.value}>₹{data.total_cost_of_goods}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{data.status}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Client Info */}
        <Text style={styles.sectionTitle}>Client Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{client.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{client.category}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GST Number:</Text>
          <Text style={styles.value}>{client.gstNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact:</Text>
          <Text style={styles.value}>{client.contact} ({client.contactPersonPhoneNumber})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{client.address}, {client.city}, {client.state}</Text>
        </View>

        {/* Company Info */}
        {/* <Text style={styles.sectionTitle}>Company Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Company:</Text>
          <Text style={styles.value}>{company.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact Person:</Text>
          <Text style={styles.value}>{company.contactPerson}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{company.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GST Number:</Text>
          <Text style={styles.value}>{company.gstNumber}</Text>
        </View> */}

        {/* Deposit Info */}
        <Text style={styles.sectionTitle}>Deposit Reference</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Receipt No:</Text>
          <Text style={styles.value}>{deposit.receipt_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Deposit Date:</Text>
          <Text style={styles.value}>{new Date(deposit.Deposit_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Commodity:</Text>
          <Text style={styles.value}>{deposit.Description_of_goods}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Grade:</Text>
          <Text style={styles.value}>{deposit.grade_or_quality}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Weight:</Text>
          <Text style={styles.value}>{deposit.measurment_or_weight} {deposit.weightUnit}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Cost:</Text>
          <Text style={styles.value}>₹{deposit.total_cost_of_goods}</Text>
        </View>

        {/* Gate Pass Info */}
        {/* <Text style={styles.sectionTitle}>Gate Pass Details</Text>
        {data.gatePasses.map((gp, idx) => (
          <View key={gp.id} style={{ marginBottom: 6 }}>
            <Text style={{ fontWeight: 'bold' }}>Gate Pass #{gp.id}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Driver Name:</Text>
              <Text style={styles.value}>{gp.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle No:</Text>
              <Text style={styles.value}>{gp.vehicle_number}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Warehouse:</Text>
              <Text style={styles.value}>{gp.warehouse.name} ({gp.warehouse.location})</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Godown:</Text>
              <Text style={styles.value}>{gp.godown.name} ({gp.godown.location})</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Stack:</Text>
              <Text style={styles.value}>{gp.stack.name} - {gp.stack.position}</Text>
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

export default DeliveryRequestPDF;

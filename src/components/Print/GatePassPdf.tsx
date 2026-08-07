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
  section: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontWeight: 'bold',
    width: '40%',
  },
  value: {
    width: '60%',
  },
  divider: {
    borderBottom: '1 solid #ccc',
    marginVertical: 6,
  },
});

const GatePassPDF = ({data}) => {


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {data.deposit_delivery.toUpperCase()} GATE PASS
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Gate Pass ID:</Text>
            <Text style={styles.value}>{data.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{data.date}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Customer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{data.customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile Number:</Text>
            <Text style={styles.value}>{data.customer.contact}</Text>
          </View>
        </View>
<View style={styles.divider} />
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Vehicle & Driver Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Driver Name:</Text>
            <Text style={styles.value}>{data.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vehicle Number:</Text>
            <Text style={styles.value}>{data.vehicle_number.toUpperCase()}</Text>
          </View>
        </View>
<View style={styles.divider} />
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Warehouse Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Warehouse:</Text>
            <Text style={styles.value}>{data.warehouse.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Godown:</Text>
            <Text style={styles.value}>{data.godown.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Stack:</Text>
            <Text style={styles.value}>{data.stack.name}</Text>
          </View>
        </View>
<View style={styles.divider} />
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Commodity Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Commodity:</Text>
            <Text style={styles.value}>{data.commodity.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>No. of Bags:</Text>
            <Text style={styles.value}>{data.no_of_bags}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Weight:</Text>
            <Text style={styles.value}>
              {data.weight} {data.weightUnit}
            </Text>
          </View>
        </View>
<View style={styles.divider} />
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Timing Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>In Time:</Text>
            <Text style={styles.value}>{new Date(data.in_time).toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Out Time:</Text>
            <Text style={styles.value}>{new Date(data.out_time).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{data.status}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default GatePassPDF;

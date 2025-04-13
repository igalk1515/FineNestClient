import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { BarChart, PieChart } from 'react-native-chart-kit';
import axios from 'axios';

type Receipt = {
  business_name: string;
  total_price: string;
  payment_method: string;
  created_at: string;
};

const getRandomColor = (() => {
  const colors = [
    '#FF5733', // Vibrant orange
    '#33FF57', // Vibrant green
    '#3357FF', // Vibrant blue
    '#FF33A1', // Vibrant pink
    '#FFC300', // Vibrant yellow
    '#DAF7A6', // Light green
    '#900C3F', // Deep red
    '#581845', // Deep purple
    '#1F618D', // Deep blue
    '#28B463', // Bright green
  ];
  let index = 0;

  return (): string => {
    const color = colors[index];
    index = (index + 1) % colors.length; // Cycle through the colors
    return color;
  };
})();

export default function SummaryScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    businessName: '',
    paymentMethod: '',
  });

  useEffect(() => {
    const fetchReceiptsFromServer = async () => {
      try {
        const response = await axios.get(
          'http://192.168.1.105:8000/api/receipt/all/'
        );
        const receiptsFromServer: Receipt[] = response.data;
        await AsyncStorage.setItem(
          'allReceipts',
          JSON.stringify(receiptsFromServer)
        );

        // Filter receipts for the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const filteredForCurrentMonth = receiptsFromServer.filter((receipt) => {
          const receiptDate = new Date(receipt.created_at);
          return (
            receiptDate.getMonth() === currentMonth &&
            receiptDate.getFullYear() === currentYear
          );
        });

        setReceipts(receiptsFromServer);
        setFilteredReceipts(filteredForCurrentMonth);
      } catch (err) {
        console.error('❌ Failed to fetch receipts from server:', err);
      }
    };

    fetchReceiptsFromServer();
  }, []);

  useEffect(() => {
    const loadReceipts = async () => {
      try {
        const storedReceipts = await AsyncStorage.getItem('allReceipts');
        if (storedReceipts) {
          const parsedReceipts: Receipt[] = JSON.parse(storedReceipts);

          // Filter receipts for the current month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const filteredForCurrentMonth = parsedReceipts.filter((receipt) => {
            const receiptDate = new Date(receipt.created_at);
            return (
              receiptDate.getMonth() === currentMonth &&
              receiptDate.getFullYear() === currentYear
            );
          });

          setReceipts(parsedReceipts);
          setFilteredReceipts(filteredForCurrentMonth);
        }
      } catch (err) {
        console.error('❌ Failed to load receipts:', err);
      }
    };

    loadReceipts();
  }, []);

  const applyFilters = () => {
    const { dateRange, businessName, paymentMethod } = filters;

    const filtered = receipts.filter((receipt) => {
      const receiptDate = new Date(receipt.created_at);

      // Check if the receipt matches the date range
      const matchesDate =
        (!dateRange.start || receiptDate >= new Date(dateRange.start)) &&
        (!dateRange.end || receiptDate <= new Date(dateRange.end));

      // Check if the receipt matches the business name
      const matchesBusiness =
        !businessName || receipt.business_name.includes(businessName);

      // Check if the receipt matches the payment method
      const matchesPayment =
        !paymentMethod || receipt.payment_method === paymentMethod;

      return matchesDate && matchesBusiness && matchesPayment;
    });

    setFilteredReceipts(filtered);
  };

  const totalSpent = useMemo(
    () =>
      filteredReceipts.reduce(
        (sum, receipt) => sum + parseFloat(receipt.total_price),
        0
      ),
    [filteredReceipts]
  );

  const averageSpent = useMemo(
    () => (filteredReceipts.length ? totalSpent / filteredReceipts.length : 0),
    [totalSpent, filteredReceipts]
  );

  const spendingByDay = useMemo(() => {
    const days = Array(7).fill(0);
    const today = new Date();
    filteredReceipts.forEach((receipt) => {
      const receiptDate = new Date(receipt.created_at);
      const diffDays = Math.floor(
        (today.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 7) {
        days[6 - diffDays] += parseFloat(receipt.total_price);
      }
    });
    return days;
  }, [filteredReceipts]);

  const spendingByBusiness = useMemo(() => {
    const businessSpending: Record<string, number> = {}; // Explicitly type the object
    filteredReceipts.forEach((receipt) => {
      const business = receipt.business_name || 'אחר';
      if (!businessSpending[business]) {
        businessSpending[business] = 0;
      }
      businessSpending[business] += parseFloat(receipt.total_price);
    });

    return Object.keys(businessSpending).map((business) => ({
      name: business.length > 10 ? business.substring(0, 10) + '...' : business,
      amount: businessSpending[business],
      color: getRandomColor(), // Use the fixed function
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
  }, [filteredReceipts]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>סיכום קבלות</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          סה"כ הוצאות: ₪{totalSpent.toFixed(2)}
        </Text>
        <Text style={styles.summaryText}>
          סה"כ קבלות: {filteredReceipts.length}
        </Text>
        <Text style={styles.summaryText}>
          ממוצע קבלה: ₪{averageSpent.toFixed(2)}
        </Text>
      </View>

      <BarChart
        data={{
          labels: [
            '6 ימים',
            '5 ימים',
            '4 ימים',
            '3 ימים',
            'יומיים',
            'אתמול',
            'היום',
          ],
          datasets: [
            {
              data: spendingByDay,
              color: (opacity = 1) => `rgba(140, 99, 132, ${opacity})`, // Pink/Red color
            },
          ],
        }}
        width={Platform.OS === 'web' ? 600 : 320}
        height={300}
        yAxisLabel="₪"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#f0f0f0',
          decimalPlaces: 2,
          barPercentage: 0.8,
          color: (opacity = 1) => `rgba(37, 47, 121, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForBackgroundLines: {
            strokeWidth: 1,
            strokeDasharray: '',
            stroke: 'rgba(47, 18, 18, 0.2)',
          },
        }}
        style={{
          marginVertical: 20,
          borderRadius: 16,
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      />

      <Text style={styles.chartTitle}>הוצאות לפי עסק</Text>
      <View style={styles.pieChartContainer}>
        {spendingByBusiness.length > 0 ? (
          <PieChart
            data={spendingByBusiness}
            width={Platform.OS === 'web' ? 600 : 320}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#f8f9fa', // Light gray background
              backgroundGradientTo: '#e9ecef', // Slightly darker gray
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={true} // Show legend for better readability
          />
        ) : (
          <Text style={styles.noDataText}>אין נתונים להצגת תרשים</Text>
        )}
      </View>

      <Text style={styles.filterHeader}>סינון</Text>
      <View style={styles.filterContainer}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>שם העסק:</Text>
          <TextInput
            style={styles.input}
            placeholder="שם העסק"
            value={filters.businessName}
            onChangeText={(text) =>
              setFilters((prev) => ({ ...prev, businessName: text }))
            }
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>שיטת תשלום:</Text>
          <Picker
            style={styles.input}
            selectedValue={filters.paymentMethod}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, paymentMethod: value }))
            }
          >
            <Picker.Item label="כל השיטות" value="" />
            <Picker.Item label="מזומן" value="מזומן" />
            <Picker.Item label="אשראי" value="אשראי" />
          </Picker>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>תאריך התחלה:</Text>
          <TextInput
            style={styles.input}
            placeholder="תאריך התחלה (YYYY-MM-DD)"
            value={filters.dateRange.start}
            onChangeText={(text) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: text },
              }))
            }
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>תאריך סיום:</Text>
          <TextInput
            style={styles.input}
            placeholder="תאריך סיום (YYYY-MM-DD)"
            value={filters.dateRange.end}
            onChangeText={(text) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: text },
              }))
            }
          />
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={applyFilters}>
          <Text style={styles.filterButtonText}>סנן</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    direction: 'rtl',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  summary: {
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 5,
  },
  chart: {
    marginVertical: 20,
    alignSelf: 'center',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    height: 220,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  filterHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterContainer: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'white',
  },
  filterButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

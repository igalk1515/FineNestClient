import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet, // Make sure this import is from 'react-native'
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { getOrCreateUID } from '../../utils/uid';

const PAYMENT_METHODS = {
  CREDIT: 'אשראי', // Matches the backend enum
  CASH: 'מזומן', // Matches the backend enum
};

// ------------------- Type Definitions -------------------
type ReceiptItem = {
  item_name: string;
  item_price: string;
};

type ReceiptData = {
  business_name: string;
  receipt_number: string;
  total_price: string;
  payment_method: string;
  credit_card_last_4_digits?: string;
  items: ReceiptItem[];
};

interface ReceiptItemRowProps {
  item: ReceiptItem;
  index: number;
  updateItem: (index: number, key: keyof ReceiptItem, value: string) => void;
  removeItem: (index: number) => void;
}

const emptyReceipt: ReceiptData = {
  business_name: '',
  receipt_number: '',
  total_price: '0',
  payment_method: '',
  credit_card_last_4_digits: '',
  items: [],
};

// ------------------- Child Row Component -------------------
function ReceiptItemRow({
  item,
  index,
  updateItem,
  removeItem,
}: ReceiptItemRowProps) {
  return (
    <View style={styles.itemRow}>
      <TextInput
        style={styles.input}
        value={item.item_name}
        onChangeText={(text) => updateItem(index, 'item_name', text)}
        placeholder="שם הפריט"
      />
      <TextInput
        style={styles.input}
        value={item.item_price}
        onChangeText={(text) => updateItem(index, 'item_price', text)}
        keyboardType="numeric"
        placeholder="מחיר"
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(index)}
      >
        <Text style={styles.removeButtonText}>❌</Text>
      </TouchableOpacity>
    </View>
  );
}

// ------------------- Main Screen Component -------------------
export default function ReceiptScreen() {
  const [data, setData] = useState<ReceiptData>(emptyReceipt);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateUID()
      .then((generatedUid) => {
        setUid(generatedUid);
      })
      .catch((err) => {
        console.error('❌ Error getting UID:', err);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadReceipt = async () => {
        try {
          const stored = await AsyncStorage.getItem('latestReceipt');

          if (stored) {
            const parsed: ReceiptData = JSON.parse(stored);
            setData(parsed);
          } else {
            console.warn('⚠️ No receipt found in AsyncStorage.');
            setData(emptyReceipt); // Reset if nothing in storage
          }
        } catch (e) {
          console.error('❌ Failed to load receipt from storage:', e);
        }
      };

      loadReceipt();
    }, [])
  );

  const handleSave = useCallback(async () => {
    if (!uid) {
      console.warn('UID not ready yet!');
      return;
    }

    const dataWithUid = { ...data, uid };
    console.log('📤 Sending data:', dataWithUid);
    const res = await axios.post(
      'http://51.84.97.33:8000/api/receipt/create/',
      dataWithUid,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    await AsyncStorage.removeItem('latestReceipt');
    setData(emptyReceipt);
  }, [uid, data]); // <-- add these dependencies

  const updateItem = useCallback(
    (index: number, key: keyof ReceiptItem, value: string) => {
      setData((prev) => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [key]: value };
        return { ...prev, items: updatedItems };
      });
    },
    []
  );

  const addItem = useCallback(() => {
    setData((prev) => ({
      ...prev,
      items: [...prev.items, { item_name: '', item_price: '' }],
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: updatedItems };
    });
  }, []);

  const computedTotal = useMemo(() => {
    return data.items.reduce(
      (sum, item) => sum + (parseFloat(item.item_price) || 0),
      0
    );
  }, [data.items]);

  const showCreditCardInput = data.payment_method === PAYMENT_METHODS.CREDIT;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.flexContainer}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
      >
        {/* Example: Business name field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>עסק:</Text>
          <TextInput
            style={styles.headerInput}
            value={data.business_name}
            onChangeText={(text) =>
              setData((prev) => ({ ...prev, business_name: text }))
            }
            placeholder="שם העסק"
          />
        </View>

        {/* Example: Receipt number field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>מספר קבלה:</Text>
          <TextInput
            style={styles.headerInput}
            value={data.receipt_number}
            onChangeText={(text) =>
              setData((prev) => ({ ...prev, receipt_number: text }))
            }
            placeholder="מספר קבלה"
          />
        </View>

        {/* Example: Payment method + optional credit card digits */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>תשלום:</Text>
          <Picker
            style={styles.picker}
            selectedValue={data.payment_method}
            onValueChange={(value) =>
              setData((prev) => ({
                ...prev,
                payment_method: value,
                credit_card_last_4_digits:
                  value === 'מזומן' ? '' : prev.credit_card_last_4_digits,
              }))
            }
          >
            <Picker.Item label={PAYMENT_METHODS.CASH} value="מזומן" />
            <Picker.Item label={PAYMENT_METHODS.CREDIT} value="אשראי" />
          </Picker>

          {showCreditCardInput && (
            <TextInput
              style={[styles.headerInput, styles.shortInput]}
              value={data.credit_card_last_4_digits}
              onChangeText={(text) =>
                setData((prev) => ({
                  ...prev,
                  credit_card_last_4_digits: text,
                }))
              }
              placeholder="4 ספרות"
              maxLength={4}
              keyboardType="numeric"
            />
          )}
        </View>

        <Text style={styles.subHeader}>פריטים:</Text>
        {data.items.map((item, index) => (
          <ReceiptItemRow
            key={`item-${index}`}
            item={item}
            index={index}
            updateItem={updateItem}
            removeItem={removeItem}
          />
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>הוסף פריט</Text>
        </TouchableOpacity>

        <Text style={styles.total}>סה"כ: {computedTotal.toFixed(2)}</Text>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={!uid || !data.items.length}
        >
          <Text style={styles.saveButtonText}>שמור</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ------------------- Styles -------------------
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    marginTop: 30,
  },
  container: {
    padding: 20,
    direction: 'rtl',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 16,
    marginRight: 8,
    minWidth: 80,
  },
  headerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'white',
    minWidth: 100,
  },
  picker: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 8,
    minWidth: 150,
  },
  subHeader: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: 'white',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    padding: 5,
    alignSelf: 'center',
    marginLeft: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    alignSelf: 'center',
    width: '50%',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shortInput: {
    flex: 0,
    width: 80,
    marginLeft: 8,
    marginRight: 95,
    marginTop: 25,
  },
});

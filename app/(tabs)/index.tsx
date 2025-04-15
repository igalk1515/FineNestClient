import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getOrCreateUID } from '../../utils/uid';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UploadScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false); // Added loading state
  const router = useRouter();

  useEffect(() => {
    getOrCreateUID()
      .then((generatedUid) => {
        setUid(generatedUid);
      })
      .catch((err) => {
        console.error('❌ Error getting UID:', err);
      });
  }, []);

  const uploadImages = async () => {
    if (!uid || images.length === 0) {
      Alert.alert('חסרים נתונים', 'אין UID או תמונות לשליחה');
      return;
    }

    const formData = new FormData();
    formData.append('uid', uid);

    images.forEach((uri, index) => {
      formData.append('receipt', {
        uri,
        type: 'image/jpeg',
        name: `receipt_${index}.jpg`,
      } as any); // <— TypeScript workaround
    });

    try {
      setLoading(true); // Start loading
      const res = await axios.post(
        'https://finne-s.com/api/receipt/upload/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setImages([]); // clear images after upload

      await AsyncStorage.setItem(
        'latestReceipt',
        JSON.stringify(res.data.data)
      );
      router.push('/receiptScreen');
    } catch (err) {
      console.error('❌ Upload failed:', err);
      Alert.alert('שגיאה', 'שליחה נכשלה');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission denied');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages((prevImages) => [...prevImages, result.assets[0].uri]);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Gallery permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      {!loading && images.length > 0 && (
        <TouchableOpacity style={styles.button} onPress={uploadImages}>
          <Text style={styles.buttonText}>עבד קבלות</Text>
        </TouchableOpacity>
      )}
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.button}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.buttonText}>❌</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <View
        style={[
          styles.buttonContainer,
          images.length === 0
            ? styles.buttonContainerCenter
            : styles.buttonContainerBottom,
          images.length > 0 && styles.buttonContainerRow,
        ]}
      >
        <TouchableOpacity
          style={[styles.button, images.length === 0 && styles.bigButton]}
          onPress={takePhoto}
        >
          <Text
            style={[
              styles.buttonText,
              images.length === 0 && styles.bigButtonText,
            ]}
          >
            📸 פתח מצלמה
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, images.length === 0 && styles.bigButton]}
          onPress={pickImage}
        >
          <Text
            style={[
              styles.buttonText,
              images.length === 0 && styles.bigButtonText,
            ]}
          >
            🖼️ בחר מהגלריה
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
    position: 'absolute',
    gap: 20,
  },
  buttonContainerCenter: {
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  buttonContainerBottom: {
    bottom: 20, // Changed from 200 to 20 to be closer to bottom
    backgroundColor: 'white', // Added to ensure buttons are visible
    paddingVertical: 10, // Added padding for better appearance
  },
  buttonContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Changed from space-between for better spacing
    width: '100%',
  },
  bigButtonText: {
    fontSize: 24,
    padding: 10,
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  bigButton: {
    minWidth: 200,
    padding: 20,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
  },
});

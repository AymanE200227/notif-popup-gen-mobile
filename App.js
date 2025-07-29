import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Button, 
  Image, 
  StyleSheet, 
  Alert, 
  Text, 
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [appTitle, setAppTitle] = useState('USDT Deposit Successful');
  const [notificationTitle, setNotificationTitle] = useState('Deposit Received!');
  const [notificationText, setNotificationText] = useState('Your USDT deposit has been successfully processed.');
  const [logoUri, setLogoUri] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSending, setIsSending] = useState(false);
  
  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      
      if (mediaStatus !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to select logos');
      }
      if (notifStatus !== 'granted') {
        Alert.alert('Notification permission', 'Please enable notifications in settings');
      }
      
      // Set notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Deposit Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
          sound: 'default',
        });
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image: ' + error.message);
    }
  };

  const scheduleNotification = async () => {
    try {
      setIsSending(true);
      
      // Calculate trigger time
      const trigger = new Date();
      trigger.setSeconds(trigger.getSeconds() + parseInt(delaySeconds));
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationText,
          data: { imageUrl: logoUri },
          // For Android - use a static icon but show logo in the notification body
          android: {
            channelId: 'default',
            largeIcon: logoUri, // This shows the logo in expanded notification
            color: '#4CAF50',
          },
        },
        trigger: { seconds: parseInt(delaySeconds) },
      });
      
      setNotifications([
        ...notifications,
        {
          id: notificationId,
          title: notificationTitle,
          text: notificationText,
          logo: logoUri,
          time: trigger.toLocaleTimeString(),
        }
      ]);
      
      Alert.alert('Scheduled!', `Notification will appear in ${delaySeconds} seconds`);
      setIsSending(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification: ' + error.message);
      setIsSending(false);
    }
  };

  const scheduleAtSpecificTime = async () => {
    try {
      setIsSending(true);
      const now = new Date();
      const diffInSeconds = Math.floor((scheduledTime - now) / 1000);
      
      if (diffInSeconds <= 0) {
        Alert.alert('Error', 'Please select a time in the future');
        setIsSending(false);
        return;
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationText,
          data: { imageUrl: logoUri },
          android: {
            channelId: 'default',
            largeIcon: logoUri,
            color: '#4CAF50',
          },
        },
        trigger: { date: scheduledTime },
      });
      
      setNotifications([
        ...notifications,
        {
          id: notificationId,
          title: notificationTitle,
          text: notificationText,
          logo: logoUri,
          time: scheduledTime.toLocaleTimeString(),
        }
      ]);
      
      Alert.alert('Scheduled!', `Notification set for ${scheduledTime.toLocaleTimeString()}`);
      setIsSending(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification: ' + error.message);
      setIsSending(false);
    }
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setScheduledTime(selectedDate);
    }
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setNotifications([]);
    Alert.alert('Cleared', 'All scheduled notifications canceled');
  };

  const sendImmediateNotification = async () => {
    try {
      setIsSending(true);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationText,
          data: { imageUrl: logoUri },
          android: {
            channelId: 'default',
            largeIcon: logoUri,
            color: '#4CAF50',
          },
        },
        trigger: null, // Send immediately
      });
      Alert.alert('Sent!', 'Notification delivered');
      setIsSending(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification: ' + error.message);
      setIsSending(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{appTitle}</Text>
        <View style={styles.usdtBadge}>
          <Text style={styles.usdtText}>USDT</Text>
        </View>
      </View>
      
      {/* Notification Preview */}
      <View style={styles.previewCard}>
        <Text style={styles.sectionTitle}>Notification Preview</Text>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logoPreview} />
        ) : (
          <View style={styles.placeholderLogo}>
            <Text style={styles.placeholderText}>Logo</Text>
          </View>
        )}
        <Text style={styles.previewTitle}>{notificationTitle}</Text>
        <Text style={styles.previewText}>{notificationText}</Text>
      </View>
      
      {/* Title Input */}
      <Text style={styles.label}>Notification Title:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter notification title"
        value={notificationTitle}
        onChangeText={setNotificationTitle}
      />
      
      {/* Text Input */}
      <Text style={styles.label}>Notification Message:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your notification text here..."
        value={notificationText}
        onChangeText={setNotificationText}
        multiline
        numberOfLines={3}
      />
      
      {/* Logo Selection */}
      <Text style={styles.label}>Notification Logo:</Text>
      <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
        <Text style={styles.buttonText}>Select Logo</Text>
      </TouchableOpacity>
      
      {logoUri && (
        <Image 
          source={{ uri: logoUri }} 
          style={styles.selectedLogo} 
        />
      )}
      
      {/* Delay Settings */}
      <Text style={styles.label}>Send After (seconds):</Text>
      <TextInput
        style={styles.input}
        placeholder="Delay in seconds"
        value={delaySeconds.toString()}
        onChangeText={(text) => setDelaySeconds(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
      
      {/* Schedule Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          onPress={sendImmediateNotification} 
          style={[styles.actionButton, styles.immediateButton]}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Send Now</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={scheduleNotification} 
          style={[styles.actionButton, styles.sendButton]}
          disabled={isSending || !notificationText.trim()}
        >
          {isSending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Send in {delaySeconds}s</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        onPress={showTimePickerModal} 
        style={[styles.actionButton, styles.scheduleButton]}
        disabled={isSending}
      >
        <Text style={styles.buttonText}>Schedule at Specific Time</Text>
      </TouchableOpacity>
      
      {/* Scheduled Time Display */}
      <Text style={styles.scheduledTime}>
        Scheduled for: {scheduledTime.toLocaleTimeString()}
      </Text>
      
      {/* Scheduled Notifications List */}
      {notifications.length > 0 && (
        <View style={styles.scheduledContainer}>
          <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
          {notifications.map((notif, index) => (
            <View key={index} style={styles.notificationItem}>
              {notif.logo && <Image source={{ uri: notif.logo }} style={styles.smallLogo} />}
              <View style={styles.notifDetails}>
                <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                <Text style={styles.notifText} numberOfLines={2}>{notif.text}</Text>
                <Text style={styles.notifTime}>At: {notif.time}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity 
            onPress={cancelAllNotifications} 
            style={styles.cancelButton}
          >
            <Text style={styles.buttonText}>Cancel All</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Help Button */}
      <TouchableOpacity 
        onPress={() => setShowHelp(true)} 
        style={styles.helpButton}
      >
        <Text style={styles.helpButtonText}>?</Text>
      </TouchableOpacity>
      
      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={scheduledTime}
          mode="time"
          display="spinner"
          onChange={onTimeChange}
        />
      )}
      
      {/* Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHelp}
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>How to Use This App</Text>
            <Text style={styles.modalText}>1. Enter notification title and message</Text>
            <Text style={styles.modalText}>2. Select a logo from your gallery</Text>
            <Text style={styles.modalText}>3. Set delay in seconds or specific time</Text>
            <Text style={styles.modalText}>4. Press "Send Now", "Send in Xs" or "Schedule"</Text>
            <Text style={styles.modalText}>5. Notifications will appear with your custom logo</Text>
            <Text style={styles.noteText}>Note: On Android, the logo appears in the expanded notification view</Text>
            
            <Text style={styles.modalSubtitle}>Converting to APK</Text>
            <Text style={styles.modalText}>1. Install Expo CLI: npm install -g expo-cli</Text>
            <Text style={styles.modalText}>2. Create project: expo init</Text>
            <Text style={styles.modalText}>3. Replace App.js with this code</Text>
            <Text style={styles.modalText}>4. Install dependencies: expo install</Text>
            <Text style={styles.modalText}>5. Build APK: expo build:android</Text>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHelp(false)}
            >
              <Text style={styles.closeButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>USDT Deposit Notification System</Text>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 15,
    paddingTop: Constants.statusBarHeight + 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#1E3A8A',
    padding: 15,
    borderRadius: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#4CAF50',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  usdtBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  usdtText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  previewCard: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 15,
    textAlign: 'center',
  },
  logoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  placeholderLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    alignSelf: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#D1D5DB',
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 15,
    color: 'white',
  },
  imageButton: {
    backgroundColor: '#1E3A8A',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  immediateButton: {
    backgroundColor: '#4CAF50',
  },
  sendButton: {
    backgroundColor: '#1E3A8A',
  },
  scheduleButton: {
    backgroundColor: '#7C3AED',
    marginBottom: 15,
  },
  scheduledTime: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  scheduledContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  smallLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  notifDetails: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    color: 'white',
    fontWeight: 'bold',
  },
  notifText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  notifTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  helpButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 20,
    right: 20,
    backgroundColor: '#1E3A8A',
    width: 40,
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4CAF50',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1E3A8A',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#D1D5DB',
  },
  noteText: {
    fontSize: 14,
    marginTop: 15,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    marginTop: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 30,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 5,
  },
});
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@env';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

interface Deck {
  _id: string;
  title: string;
  courseId: string;
  description?: string;
  cards: string[];
  createdAt: string;
  createdBy: string;
  cardCount?: number;
  dueCards?: number;
  newCards?: number;
}

interface CourseDetailsScreenProps {
  route?: any;
  navigation?: any;
}

const CourseDetailsScreen: React.FC<CourseDetailsScreenProps> = ({ route, navigation }) => {
  const { courseId, courseName, decks: passedDecks } = route?.params || {};
  const [decks, setDecks] = useState<Deck[]>(passedDecks ?? []);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [addCardModalVisible, setAddCardModalVisible] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const API_BASE_URL = 'http://172.31.144.1:5000/api';

  useFocusEffect(
    React.useCallback(() => {
      if (courseId) {
        fetchDecks();
      }
    }, [courseId])
  );

  
  const fetchDecks = async () => {
    try {
      setSyncing(true);
      let accessToken = await SecureStore.getItemAsync('accessToken');
      let triedRefresh = false;

      const getDecks = async (token: string | null): Promise<Deck[]> => {
        if (!token) {
          console.log('No access token found');
          return [];
        }
        try {
          // console.log('Fetching decks with token:', token);
          // console.log('Request URL:', `${API_BASE_URL}/decks/courses/${courseId}/decks`);
          const response = await fetch(`${API_BASE_URL}/decks/courses/${courseId}/decks`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          // console.log('Response status:', response.status);
          const text = await response.text();
          // console.log('Raw response text:', text);

          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.log('Failed to parse JSON:', e);
            data = null;
          }

          if (response.ok) {
            // console.log('Parsed data:', data);
            return Array.isArray(data) ? data : data?.decks || [];
          } else if (response.status === 401 && !triedRefresh) {
            // Try to refresh token
            triedRefresh = true;
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (!refreshToken) {
              console.log('No refresh token found');
              return [];
            }
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              await SecureStore.setItemAsync('accessToken', refreshData.accessToken);
              await SecureStore.setItemAsync('refreshToken', refreshData.refreshToken);
              // console.log('Token refreshed, retrying fetchDecks...');
              return await getDecks(refreshData.accessToken);
            } else {
              console.log('Failed to refresh token');
              return [];
            }
          } else {
            console.log('Non-OK response:', response.status, data);
            return [];
          }
        } catch (error) {
          console.log('Error in getDecks:', error);
          return [];
        }
      };

      const data = await getDecks(accessToken);
      // console.log('Final decks data:', data);
      setDecks(data);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setSyncing(false);
    }
  };

  // --- REFRESH TOKEN LOGIC FOR CREATING DECKS ---
  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }

    let accessToken = await SecureStore.getItemAsync('accessToken');
    let triedRefresh = false;

    const createDeck = async (token: string | null): Promise<boolean> => {
      if (!token) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/decks/courses/${courseId}/decks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newDeckName.trim(),
            description: newDeckDescription.trim(),
          }),
        });

        if (response.ok) {
          return true;
        } else if (response.status === 401 && !triedRefresh) {
          // Try to refresh token
          triedRefresh = true;
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          if (!refreshToken) return false;
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            await SecureStore.setItemAsync('accessToken', refreshData.accessToken);
            await SecureStore.setItemAsync('refreshToken', refreshData.refreshToken);
            return await createDeck(refreshData.accessToken);
          } else {
            return false;
          }
        } else {
          const text = await response.text();
          console.log('Deck creation error response:', text); 
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { message: text };
          }
          Alert.alert('Error', data.message || 'Failed to create deck');
          return false;
        }
      } catch (error) {
        console.log('Deck creation exception:', error); 
        Alert.alert('Error', 'Failed to create deck');
        return false;
      }
    };

    try {
      const success = await createDeck(accessToken);
      if (success) {
        // Alert.alert('Success', 'Deck created successfully!');
        setNewDeckName('');
        setNewDeckDescription('');
        setModalVisible(false);
        fetchDecks();
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      Alert.alert('Error', 'Failed to create deck');
    }
  };

  const handleStudyAll = () => {
    const totalCards = decks.reduce((sum, deck) => sum + (deck.cardCount ?? deck.cards?.length ?? 0), 0);
    if (totalCards === 0) {
      Alert.alert('No Cards', 'There are no cards to study in any deck!');
      return;
    }

    if (navigation) {
      const allDeckIds = decks.map(deck => deck._id);
      navigation.navigate('Study', { courseId, deckIds: allDeckIds });
    }
  };

  const handleStudyDeck = (deck: Deck) => {
    if (deck.cardCount === 0) {
      Alert.alert('Empty Deck', 'This deck has no cards yet. Add some cards first!');
      return;
    }

    if (navigation) {
      // Pass only this deck's ID as an array
      navigation.navigate('Study', { courseId, deckIds: [deck._id], deckName: deck.title });
    }
  };

  const navigateToDeckCards = (deck: Deck) => {
    if (navigation) {
      navigation.push('DeckCards', {
        deckId: deck._id,
        deckName: deck.title,
        courseId,
        cards: deck.cards, // Pass cards if available
      });
    }
  };

  const renderDeckCard = (deck: Deck) => {
    const cardCount = deck.cardCount ?? deck.cards?.length ?? 0;
    const hasCardsToStudy = cardCount > 0;

    return (
      <View key={deck._id} style={styles.deckCard}>
        <TouchableOpacity
          style={styles.deckCardTouchable}
          onPress={() => navigateToDeckCards(deck)}
          activeOpacity={0.7}
        >
          <View style={styles.deckHeader}>
            <View style={styles.deckTitleSection}>
              <Icon name="style" size={24} color="#667eea" />
              <Text style={styles.deckName}>{deck.title}</Text>
            </View>
            <TouchableOpacity
              style={[styles.studyButton, cardCount === 0 && styles.studyButtonDisabled]}
              onPress={() => handleStudyDeck(deck)}
              disabled={cardCount === 0}
            >
              <Icon name="play-arrow" size={18} color="white" />
              <Text style={styles.studyButtonText}>Study</Text>
            </TouchableOpacity>
          </View>

          {deck.description && (
            <Text style={styles.deckDescription} numberOfLines={2}>
              {deck.description}
            </Text>
          )}

          <View style={styles.deckStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{cardCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeNew]}>
              <Text style={[styles.statValue, styles.statValueNew]}>{deck.newCards ?? 0}</Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeDue]}>
              <Text style={[styles.statValue, styles.statValueDue]}>{deck.dueCards ?? 0}</Text>
              <Text style={styles.statLabel}>Due</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Add Card Button - New Feature */}
        {/* <TouchableOpacity
          style={styles.addCardButton}
          onPress={() => {
            setSelectedDeck(deck); // Track which deck to add to
            setAddCardModalVisible(true); // Show modal instantly
          }}
        >
          <Icon name="note-add" size={20} color="#0089EB" />
          <Text style={styles.addCardButtonText}>Add Card</Text>
        </TouchableOpacity> */}
      </View>
    );
  };

  const totalCards = decks.reduce((sum, deck) => sum + (deck.cardCount ?? deck.cards?.length ?? 0), 0);
  const totalDue = decks.reduce((sum, deck) => sum + (deck.dueCards ?? 0), 0);
  const totalNew = decks.reduce((sum, deck) => sum + (deck.newCards ?? 0), 0);

  // Check if any deck has cards
  const hasCards = decks.some(deck => (deck.cardCount ?? deck.cards?.length ?? 0) > 0);
  const hasAnyCards = decks.some(deck => Number(deck.cardCount) > 0);

  console.log('decks at top:', decks);

  useEffect(() => {
    console.log('decks in useEffect:', decks);
  }, [decks]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{courseName || 'Course'}</Text>
          <Text style={styles.headerSubtitle}>{decks.length} decks • {totalCards} cards</Text>
        </View>

        {syncing && (
          <ActivityIndicator size="small" color="#0089EB" style={{ marginRight: 12 }} />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Study All Button */}
      {decks.length > 0 && (
        <View style={styles.studyAllContainer}>
          <TouchableOpacity
            style={[styles.studyAllButton, !hasAnyCards && styles.disabledButton]}
            onPress={handleStudyAll}
            disabled={!hasAnyCards}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={hasAnyCards ? ['#667eea', '#764ba2'] : ['#ccc', '#999']}
              style={styles.studyAllGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="school" size={28} color="white" />
              <View style={styles.studyAllTextContainer}>
                <Text style={styles.studyAllText}>Study All Decks</Text>
                <Text style={styles.studyAllSubtext}>
                  {totalDue} cards due • {totalNew} new cards
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Decks List */}
      {loading && decks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : decks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="style" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No decks yet</Text>
          <Text style={styles.emptySubtext}>Create your first deck to start studying</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {decks.map(deck => renderDeckCard(deck))}
        </ScrollView>
      )}

      {/* Create Deck Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Deck</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Deck Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Chapter 1: Cell Biology"
                  value={newDeckName}
                  onChangeText={setNewDeckName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Optional description"
                  value={newDeckDescription}
                  onChangeText={setNewDeckDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateDeck}
              >
                <Text style={styles.createButtonText}>Create Deck</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Card Modal - New Feature (Skeleton) */}
      <Modal
        visible={addCardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddCardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <TouchableOpacity onPress={() => setAddCardModalVisible(false)}>
                <Icon name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Content for adding a new card will go here */}
              <Text>Form to add a new card for the deck: {selectedDeck?.title}</Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddCardModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  // Logic to add card will go here
                  setAddCardModalVisible(false);
                }}
              >
                <Text style={styles.createButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: '#8f00ff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: '#888',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0089EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0089EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  studyAllContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  studyAllButton: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#8f00ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  studyAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  studyAllTextContainer: {
    flex: 1,
  },
  studyAllText: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  studyAllSubtext: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deckCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  deckCardTouchable: {
    padding: 18,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deckTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#1f2937',
    flex: 1,
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0089EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#0089EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  studyButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  studyButtonText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#fff',
  },
  deckDescription: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: '#6b7280',
    marginBottom: 14,
    lineHeight: 20,
  },
  deckStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statBadge: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statBadgeNew: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  statBadgeDue: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#1f2937',
  },
  statValueNew: {
    color: '#1d4ed8',
  },
  statValueDue: {
    color: '#d97706',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#6b7280',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f0ecff',
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#0089EB',
    letterSpacing: 0.5,
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1f2937',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Onest',
    color: '#111827',
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 14,
    borderTopWidth: 2,
    borderTopColor: '#f0ecff',
    backgroundColor: '#fafafa',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#6b7280',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#0089EB',
    alignItems: 'center',
    shadowColor: '#0089EB',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#0089EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addCardButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0089EB',
    marginLeft: 8,
  },
});

export default CourseDetailsScreen;
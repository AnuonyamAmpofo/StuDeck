import React, { useState, useEffect } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@env';

interface Card {
  _id: string;
  front: string;
  back: string;
  deckId: string;
  easeFactor: number;
  interval: number;
  repetition: number;
  lastReviewed?: Date;
  createdAt: string;
}

interface DeckCardsScreenProps {
  route?: any;
  navigation?: any;
}

const DeckCardsScreen: React.FC<DeckCardsScreenProps> = ({ route, navigation }) => {
const { deckId, deckName, courseId, cards: passedCards } = route?.params || {};
const [cards, setCards] = useState<Card[]>(passedCards ?? []);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'browse'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const API_BASE_URL = 'http://172.17.128.1:5000/api';

  useEffect(() => {
    if (deckId) {
      if (!passedCards || passedCards.length === 0) {
        setLoading(true);
      }
      fetchCards();
    }
  }, [deckId]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      let accessToken = await SecureStore.getItemAsync('accessToken');
      let triedRefresh = false;

      const getCards = async (token: string | null): Promise<Card[]> => {
        if (!token) return [];
        try {
          const response = await fetch(`${API_BASE_URL}/cards/decks/${deckId}/cards`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : data.cards || [];
          } else if (response.status === 401 && !triedRefresh) {
            triedRefresh = true;
            const newToken = await refreshAccessToken();
            if (!newToken) return [];
            return await getCards(newToken); 
          } else {
            return [];
          }
        } catch (error) {
          return [];
        }
      };

      const data = await getCards(accessToken);
      setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    if (!frontText.trim() || !backText.trim()) {
      Alert.alert('Error', 'Both front and back of the card are required');
      return;
    }

    let accessToken = await SecureStore.getItemAsync('accessToken');
    let triedRefresh = false;

    const createCard = async (token: string | null): Promise<boolean> => {
      if (!token) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/cards/decks/${deckId}/cards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            front: frontText.trim(),
            back: backText.trim(),
          }),
        });

        if (response.ok) {
          return true;
        } else if (response.status === 401 && !triedRefresh) {
          triedRefresh = true;
          const newToken = await refreshAccessToken();
          if (!newToken) return false;
          return await createCard(newToken);
        } else {
          const data = await response.json();
          Alert.alert('Error', data.message || 'Failed to create card');
          return false;
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create card');
        return false;
      }
    };

    try {
      const success = await createCard(accessToken);
      if (success) {
        // Alert.alert('Success', 'Card created successfully!');
        setFrontText('');
        setBackText('');
        setModalVisible(false);
        fetchCards();
      }
    } catch (error) {
      console.error('Error creating card:', error);
      Alert.alert('Error', 'Failed to create card');
    }
  };

  const handleEditCard = async () => {
    if (!selectedCard || !frontText.trim() || !backText.trim()) {
      Alert.alert('Error', 'Both front and back of the card are required');
      return;
    }

    let accessToken = await SecureStore.getItemAsync('accessToken');
    let triedRefresh = false;

    const editCard = async (token: string | null): Promise<boolean> => {
      if (!token) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/cards/${selectedCard._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            front: frontText.trim(),
            back: backText.trim(),
          }),
        });

        if (response.ok) {
          return true;
        } else if (response.status === 401 && !triedRefresh) {
          triedRefresh = true;
          const newToken = await refreshAccessToken();
          if (!newToken) return false;
          return await editCard(newToken);
        } else {
          const data = await response.json();
          Alert.alert('Error', data.message || 'Failed to update card');
          return false;
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to update card');
        return false;
      }
    };

    try {
      const success = await editCard(accessToken);
      if (success) {
        // Alert.alert('Success', 'Card updated successfully!');
        setFrontText('');
        setBackText('');
        setSelectedCard(null);
        setEditModalVisible(false);
        fetchCards();
      }
    } catch (error) {
      console.error('Error updating card:', error);
      Alert.alert('Error', 'Failed to update card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            let accessToken = await SecureStore.getItemAsync('accessToken');
            let triedRefresh = false;

            const deleteCard = async (token: string | null): Promise<boolean> => {
              if (!token) return false;
              try {
                const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (response.ok) {
                  return true;
                } else if (response.status === 401 && !triedRefresh) {
                  triedRefresh = true;
                  const newToken = await refreshAccessToken();
                  if (!newToken) return false;
                  return await deleteCard(newToken);
                } else {
                  return false;
                }
              } catch (error) {
                return false;
              }
            };

            try {
              const success = await deleteCard(accessToken);
              if (success) {
                fetchCards();
              } else {
                Alert.alert('Error', 'Failed to delete card');
              }
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (card: Card) => {
    setSelectedCard(card);
    setFrontText(card.front);
    setBackText(card.back);
    setEditModalVisible(true);
  };

  const openPreviewModal = (card: Card) => {
    setSelectedCard(card);
    setPreviewModalVisible(true);
  };

  const navigateToStudy = () => {
    if (cards.length === 0) {
      Alert.alert('Empty Deck', 'Add some cards before studying');
      return;
    }
    navigation?.navigate('Study', { deckId, deckName });
  };

  const getCardStatus = (card: Card) => {
    const now = new Date();

    // Never reviewed
    if (!card.lastReviewed) {
      return { text: 'New', color: '#1d4ed8' };
    }

    // If interval is 1, show as "To Review"
    if (card.interval === 1) {
      return { text: 'To Review', color: '#d97706' };
    }

    // Otherwise, use the spaced repetition logic
    const lastReviewDate = new Date(card.lastReviewed);
    const nextReviewDate = new Date(lastReviewDate.getTime() + card.interval * 24 * 60 * 60 * 1000);

    if (nextReviewDate <= now) {
      return { text: 'To Review', color: '#d97706' };
    }

    return { text: 'Learning', color: '#059669' };
  };

  const getDueStats = () => {
    let newCount = 0;
    let toReviewCount = 0;
    let learningCount = 0;

    cards.forEach(card => {
      const status = getCardStatus(card);
      if (status.text === 'New') newCount++;
      else if (status.text === 'To Review') toReviewCount++;
      else if (status.text === 'Learning') learningCount++;
    });

    return { newCount, toReviewCount, learningCount };
  };

  const stats = getDueStats();

  const renderCardItem = (card: Card, index: number) => {
    const status = getCardStatus(card);

    return (
      <TouchableOpacity
        key={card._id}
        style={styles.cardItem}
        onPress={() => openPreviewModal(card)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardNumber}>
            <Text style={styles.cardNumberText}>{index + 1}</Text>
          </View>
          
          <View style={styles.cardTexts}>
            <Text style={styles.cardFront} numberOfLines={2}>{card.front}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                openEditModal(card);
              }}
            >
              <Icon name="edit" size={20} color="#0089EB" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteCard(card._id);
              }}
            >
              <Icon name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBrowseMode = () => {
    if (cards.length === 0) return null;
    
    const card = cards[currentCardIndex];
    const status = getCardStatus(card);

    return (
      <View style={styles.browseContainer}>
        <View style={styles.browseHeader}>
          <Text style={styles.browseCounter}>
            {currentCardIndex + 1} / {cards.length}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.browseCard}>
          <View style={styles.browseSection}>
            <Text style={styles.browseSectionLabel}>FRONT</Text>
            <ScrollView style={styles.browseTextScroll}>
              <Text style={styles.browseText}>{card.front}</Text>
            </ScrollView>
          </View>

          <View style={styles.browseDivider} />

          <View style={styles.browseSection}>
            <Text style={styles.browseSectionLabel}>BACK</Text>
            <ScrollView style={styles.browseTextScroll}>
              <Text style={styles.browseText}>{card.back}</Text>
            </ScrollView>
          </View>
        </View>

        <View style={styles.browseNavigation}>
          <TouchableOpacity
            style={[styles.navButton, currentCardIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
            disabled={currentCardIndex === 0}
          >
            <Icon name="chevron-left" size={28} color={currentCardIndex === 0 ? '#ccc' : '#0089EB'} />
          </TouchableOpacity>

          <View style={styles.browseActions}>
            <TouchableOpacity
              style={styles.browseActionButton}
              onPress={() => openEditModal(card)}
            >
              <Icon name="edit" size={24} color="#0089EB" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.browseActionButton}
              onPress={() => handleDeleteCard(card._id)}
            >
              <Icon name="delete" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.navButton, currentCardIndex === cards.length - 1 && styles.navButtonDisabled]}
            onPress={() => setCurrentCardIndex(Math.min(cards.length - 1, currentCardIndex + 1))}
            disabled={currentCardIndex === cards.length - 1}
          >
            <Icon name="chevron-right" size={28} color={currentCardIndex === cards.length - 1 ? '#ccc' : '#0089EB'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const refreshAccessToken = async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) return null;
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (response.ok) {
      const data = await response.json();
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      return data.accessToken;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{deckName || 'Deck'}</Text>
          <Text style={styles.headerSubtitle}>{cards.length} cards</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'browse' : 'list')}
          >
            <Icon name={viewMode === 'list' ? 'view-carousel' : 'view-list'} size={24} color="#0089EB" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Card */}
      {cards.length > 0 && viewMode === 'list' && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#1d4ed8' }]}>{stats.newCount}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#d97706' }]}>{stats.toReviewCount}</Text>
            <Text style={styles.statLabel}>To Review</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.learningCount}</Text>
            <Text style={styles.statLabel}>Learning</Text>
          </View>
        </View>
      )}

      {/* Study Button */}
      {cards.length > 0 && viewMode === 'list' && (
        <TouchableOpacity
          style={styles.studyButton}
          onPress={navigateToStudy}
        >
          <Icon name="school" size={24} color="white" />
          <Text style={styles.studyButtonText}>Start Studying</Text>
          <Icon name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      )}

      {/* Info Banner */}
      {cards.length > 0 && viewMode === 'list' && (
        <View style={styles.infoBanner}>
          <Icon name="info-outline" size={16} color="#6b7280" />
          <Text style={styles.infoText}>Tap any card to preview. Use Study mode for learning.</Text>
        </View>
      )}

      {/* Content */}
      {loading && cards.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0089EB" />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="style" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No cards yet</Text>
          <Text style={styles.emptySubtext}>Add your first flashcard to get started</Text>
          {loading && (
            <ActivityIndicator size="small" color="#0089EB" style={{ marginTop: 16 }} />
          )}
        </View>
      ) : viewMode === 'list' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card, index) => renderCardItem(card, index))}
        </ScrollView>
      ) : (
        renderBrowseMode()
      )}

      {/* Preview Modal */}
      <Modal
        visible={previewModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Card Preview</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Icon name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedCard && (
              <ScrollView style={styles.previewBody}>
                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>FRONT</Text>
                  <Text style={styles.previewText}>{selectedCard.front}</Text>
                </View>

                <View style={styles.previewDivider} />

                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>BACK</Text>
                  <Text style={styles.previewText}>{selectedCard.back}</Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.previewFooter}>
              <TouchableOpacity
                style={styles.previewActionButton}
                onPress={() => {
                  setPreviewModalVisible(false);
                  if (selectedCard) openEditModal(selectedCard);
                }}
              >
                <Icon name="edit" size={20} color="#0089EB" />
                <Text style={styles.previewActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewActionButton, styles.deleteActionButton]}
                onPress={() => {
                  setPreviewModalVisible(false);
                  if (selectedCard) handleDeleteCard(selectedCard._id);
                }}
              >
                <Icon name="delete" size={20} color="#ef4444" />
                <Text style={[styles.previewActionText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Card Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Front (Question) *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter the question or term"
                  value={frontText}
                  onChangeText={setFrontText}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Back (Answer) *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter the answer or definition"
                  value={backText}
                  onChangeText={setBackText}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setFrontText('');
                  setBackText('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateCard}
              >
                <Text style={styles.createButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Card Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Card</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Front (Question) *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter the question or term"
                  value={frontText}
                  onChangeText={setFrontText}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Back (Answer) *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter the answer or definition"
                  value={backText}
                  onChangeText={setBackText}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditModalVisible(false);
                  setFrontText('');
                  setBackText('');
                  setSelectedCard(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleEditCard}
              >
                <Text style={styles.createButtonText}>Save</Text>
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
    paddingBottom: 16,
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
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#0089EB',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: '#888',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0089EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0089EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8f00ff',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    elevation: 4,
    shadowColor: '#8f00ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  studyButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Onest',
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
 
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  cardNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumberText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#6b7280',
  },
  cardTexts: {
    flex: 1,
  },
  cardFront: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardBack: {
    fontSize: 13,
    fontFamily: 'Onest',
    color: '#6b7280',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  browseContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  browseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  browseCounter: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#1f2937',
  },
  browseCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  browseSection: {
    flex: 1,
  },
  browseSectionLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#0089EB',
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  browseTextScroll: {
    flex: 1,
  },
  browseText: {
    fontSize: 18,
    fontFamily: 'Onest',
    color: '#1f2937',
    lineHeight: 28,
  },
  browseDivider: {
    height: 2,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  browseNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  navButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  navButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  browseActions: {
    flexDirection: 'row',
    gap: 16,
  },
  browseActionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    maxHeight: '80%',
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
    minHeight: 120,
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
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: '#0089EB',
    letterSpacing: 0.5,
  },
  previewBody: {
    marginBottom: 18,
  },
  previewSection: {
    marginBottom: 14,
  },
  previewLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#0089EB',
    marginBottom: 6,
    letterSpacing: 1,
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'Onest',
    color: '#1f2937',
    lineHeight: 24,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  previewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  previewActionText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#0089EB',
    marginLeft: 6,
  },
  deleteActionButton: {
    backgroundColor: '#fee2e2',
  },
});

export default DeckCardsScreen;
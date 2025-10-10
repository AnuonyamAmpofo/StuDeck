import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL} from '@env';

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

interface StudyScreenProps {
  route?: any;
  navigation?: any;
}

const { width } = Dimensions.get('window');

const StudyScreen: React.FC<StudyScreenProps> = ({ route, navigation }) => {
  const { deckId, deckName } = route?.params || {};
  
  const [cards, setCards] = useState<Card[]>([]);
  const [studyQueue, setStudyQueue] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studiedCount, setStudiedCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [showRating, setShowRating] = useState(false);

  const flipAnimation = React.useRef(new Animated.Value(0)).current;
  const API_BASE_URL = 'http://172.17.128.1:5000/api';

  useEffect(() => {
    if (deckId) {
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

      const allCards = await getCards(accessToken);
      setCards(allCards);

      // Shuffle all cards for the study queue
      const shuffledQueue = shuffleArray([...allCards]);
      setStudyQueue(shuffledQueue);

      if (shuffledQueue.length > 0) {
        setCurrentCard(shuffledQueue[0]);
      } else {
        setCurrentCard(null);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const flipCard = () => {
    if (!isFlipped) {
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsFlipped(true);
        setShowRating(true); // Show difficulty options after animation
      });
    }
  };

  const resetFlip = () => {
    Animated.timing(flipAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(false);
      setShowRating(false);
    });
  };

  // SM-2 Algorithm implementation
  const calculateNextReview = (card: Card, rating: number) => {
    let { easeFactor, interval, repetition } = card;

    if (rating < 3) {
      // Again or Hard - restart
      repetition = 0;
      interval = 1;
    } else {
      // Good or Easy
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;

      // Update ease factor
      easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;
    }

    return { easeFactor, interval, repetition };
  };

  const handleRating = async (rating: number) => {
    if (!currentCard) return;

    await updateCardProgress(currentCard._id, rating);

    let nextQueue = studyQueue.slice(1);
    let minPos = nextQueue.length, maxPos = nextQueue.length;
    if (rating === 1) { minPos = 1; maxPos = 2; }
    else if (rating === 2) { minPos = 2; maxPos = 4; }
    else if (rating === 3) { minPos = 5; maxPos = 8; }
    else if (rating === 4) { minPos = 10; maxPos = 15; }

    const insertPos = Math.min(
      minPos + Math.floor(Math.random() * (maxPos - minPos + 1)),
      nextQueue.length
    );

    nextQueue = [
      ...nextQueue.slice(0, insertPos),
      currentCard,
      ...nextQueue.slice(insertPos),
    ].filter((c): c is Card => c !== null);

    setStudyQueue(nextQueue);
    setCurrentCard(nextQueue[0] ?? null);

    // Reset flip state for next card
    resetFlip();
  };
  const updateCardProgress = async (
    cardId: string,
    rating: number
  ) => {
    let accessToken = await SecureStore.getItemAsync('accessToken');
    let triedRefresh = false;

    const updateCard = async (token: string | null): Promise<boolean> => {
      if (!token) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/study/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviews: [{
              cardId,
              rating: rating - 1 // Map your rating (1-4) to backend (0-3)
            }]
          }),
        });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  await updateCard(accessToken);
  };

  const showCompletionScreen = () => {
    Alert.alert(
      '🎉 Study Session Complete!',
      `Great job! You've studied ${studiedCount} cards.\n\n` +
      `Again: ${sessionStats.again}\n` +
      `Hard: ${sessionStats.hard}\n` +
      `Good: ${sessionStats.good}\n` +
      `Easy: ${sessionStats.easy}`,
      [
        {
          text: 'Finish',
          onPress: () => navigation?.goBack(),
        },
      ]
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

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const getCardStatus = (card: Card) => {
    const now = new Date();
    if (!card.lastReviewed) return { text: 'New', color: '#1d4ed8' };
    const lastReviewDate = new Date(card.lastReviewed);
    const nextReviewDate = new Date(lastReviewDate.getTime() + card.interval * 24 * 60 * 60 * 1000);
    if (nextReviewDate <= now) return { text: 'To Review', color: '#d97706' };
    return { text: 'Learning', color: '#059669' };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8f00ff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8f00ff" />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8f00ff" />
      
      {/* Header */}
      <LinearGradient
        colors={['#8f00ff', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Exit Study Session?',
              'Your progress will be saved',
              [
                { text: 'Continue Studying', style: 'cancel' },
                { text: 'Exit', onPress: () => navigation?.goBack() },
              ]
            );
          }}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.deckName}>{deckName}</Text>
          {/* <Text style={styles.progress}>
            {studiedCount} / {studiedCount + studyQueue.length}
          </Text> */}
        </View>

        {/* <View style={styles.statsButton}>
          <Icon name="bar-chart" size={24} color="#fff" />
        </View> */}
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
            {
              width: `${(studiedCount / (studiedCount + studyQueue.length)) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Card Display */}
      <View style={styles.cardContainer}>
        <View style={{ width: width - 40, minHeight: 300 }}>
          <Animated.View
            style={[
              styles.card,
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: [{ rotateY: frontInterpolate }],
              },
            ]}
          >
            <View style={styles.cardFrontContent}>
              <View style={styles.cardLabel}>
                <Icon name="help-outline" size={20} color="#8f00ff" />
                <Text style={styles.cardLabelText}>Question</Text>
              </View>
              <Text style={styles.cardText}>{currentCard?.front}</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: [{ rotateY: backInterpolate }],
              },
            ]}
          >
            <View style={styles.cardBackContent}>
              <View style={styles.cardLabel}>
                <Icon name="lightbulb-outline" size={20} color="#0089EB" />
                <Text style={styles.cardLabelText}>Answer</Text>
              </View>
              <Text style={styles.cardText}>{currentCard?.back}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Action Buttons */}
      {!showRating ? (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.showAnswerButton}
            onPress={flipCard}
          >
            <Text style={styles.showAnswerText}>Show Answer</Text>
            <Icon name="flip" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you know this?</Text>
          
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              style={[styles.ratingButton, styles.againButton]}
              onPress={() => handleRating(1)}
            >
              <Icon name="close" size={24} color="#fff" />
              <Text style={styles.ratingButtonText}>Again</Text>
              <Text style={styles.ratingInterval}>1 day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingButton, styles.hardButton]}
              onPress={() => handleRating(2)}
            >
              <Icon name="trending-down" size={24} color="#fff" />
              <Text style={styles.ratingButtonText}>Hard</Text>
              <Text style={styles.ratingInterval}>3 days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingButton, styles.goodButton]}
              onPress={() => handleRating(3)}
            >
              <Icon name="check" size={24} color="#fff" />
              <Text style={styles.ratingButtonText}>Good</Text>
              <Text style={styles.ratingInterval}>
                {currentCard?.repetition === 0 ? '1 day' : 
                 currentCard?.repetition === 1 ? '6 days' : 
                 `${Math.round((currentCard?.interval || 1) * (currentCard?.easeFactor || 2.5))} days`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingButton, styles.easyButton]}
              onPress={() => handleRating(4)}
            >
              <Icon name="done-all" size={24} color="#fff" />
              <Text style={styles.ratingButtonText}>Easy</Text>
              <Text style={styles.ratingInterval}>
                {currentCard?.repetition === 0 ? '4 days' : 
                 `${Math.round((currentCard?.interval || 1) * (currentCard?.easeFactor || 2.5) * 1.3)} days`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Session Stats */}
      {/* <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessionStats.again}</Text>
          <Text style={styles.statLabel}>Again</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessionStats.hard}</Text>
          <Text style={styles.statLabel}>Hard</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessionStats.good}</Text>
          <Text style={styles.statLabel}>Good</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessionStats.easy}</Text>
          <Text style={styles.statLabel}>Easy</Text>
        </View>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  deckName: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
  },
  progress: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statsButton: {
    padding: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width - 40,
    minHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    backfaceVisibility: 'hidden',
  },
  cardFrontContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardBackContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardLabelText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 22,
    fontFamily: 'Onest',
    color: '#1f2937',
    lineHeight: 34,
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8f00ff',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    elevation: 4,
    shadowColor: '#8f00ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  showAnswerText: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  ratingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  ratingTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  againButton: {
    backgroundColor: '#ef4444',
  },
  hardButton: {
    backgroundColor: '#f59e0b',
  },
  goodButton: {
    backgroundColor: '#10b981',
  },
  easyButton: {
    backgroundColor: '#0089EB',
  },
  ratingButtonText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
  },
  ratingInterval: {
    fontSize: 11,
    fontFamily: 'Onest',
    color: 'rgba(255,255,255,0.9)',
  },
  sessionStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Onest',
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Onest',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#8f00ff',
  },
});

export default StudyScreen;
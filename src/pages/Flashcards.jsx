// Only updating the streak-related sections, rest remains identical

useEffect(() => {
  const loadInitialStreaks = async () => {
    try {
      console.log("DEBUG: Flashcard - Component mounted, loading initial streaks");
      const { data, error } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading initial streaks:', error);
        return;
      }

      if (data) {
        console.log("DEBUG: Flashcard - Initial streaks loaded:", {
          current: data.flashcard_current_streak || 0,
          best: data.flashcard_all_time_high || 0
        });
      } else {
        console.log("DEBUG: Flashcard - No existing streak data found");
      }
    } catch (error) {
      console.error('Error in loadInitialStreaks:', error);
    }
  };

  loadInitialStreaks();
}, [user]);

const handleAnswer = async (correct) => {
  if (currentMemory) {
    console.log(`DEBUG: Flashcard - Processing answer:`, {
      correct,
      memoryId: currentMemory.id
    });

    try {
      await submitFlashcardAnswer(currentMemory.id, correct);
      
      setSessionStats(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1
      }));
      
      if (correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
      
      // Move to next card or complete session
      if (currentIndex < quizMemories.length - 1) {
        setTimeout(() => {
          setIsFlipped(false);
          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, 300);
        }, 1000);
      } else {
        setTimeout(() => {
          setSessionComplete(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing flashcard answer:', error);
    }
  }
};
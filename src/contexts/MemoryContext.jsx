// Update the addMemory function in MemoryContext.jsx
const addMemory = async (memoryData) => {
  try {
    const currentUser = supabase.auth.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Parse date to get month and day
    const { month, day } = parseDateToDb(memoryData.date);

    // Insert date into Supabase
    const { data, error } = await supabase
      .from('dates')
      .insert({
        user_id: currentUser.id,
        name: memoryData.name,
        display_name: memoryData.display_name,
        month,
        day,
        category: memoryData.type
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding memory:', error);
      throw error;
    }

    // Add the new memory to state
    const newMemory = convertDbDateToMemory(data);
    setMemories(prev => [newMemory, ...prev]);
    return newMemory;
  } catch (err) {
    console.error('Error adding memory:', err);
    setError(err.message);
    return null;
  }
};
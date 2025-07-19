import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiChevronLeft, FiChevronRight, FiCalendar, FiGift, FiHeart, FiStar, FiX } = FiIcons;

const Calendar = () => {
  const { memories, getDisplayName } = useMemory();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateMemories, setSelectedDateMemories] = useState([]);
  const [highlightedMemory, setHighlightedMemory] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getMemoriesForDate = (date) => {
    return memories.filter(memory => {
      try {
        // Parse MM/DD format
        const [month, day] = memory.date.split('/').map(Number);
        return month - 1 === date.getMonth() && day === date.getDate();
      } catch (error) {
        return false;
      }
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'birthday': return FiGift;
      case 'anniversary': return FiHeart;
      case 'special': return FiStar;
      case 'holiday': return FiCalendar;
      default: return FiCalendar;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'birthday': return 'bg-pastel-pink';
      case 'anniversary': return 'bg-pastel-teal';
      case 'special': return 'bg-pastel-yellow';
      case 'holiday': return 'bg-pastel-purple';
      default: return 'bg-gray-200';
    }
  };

  const getTypeGradient = (type) => {
    switch (type) {
      case 'birthday': return 'from-pink-200 to-pink-300';
      case 'anniversary': return 'from-teal-200 to-teal-300';
      case 'special': return 'from-yellow-200 to-yellow-300';
      case 'holiday': return 'from-purple-200 to-purple-300';
      default: return 'from-gray-200 to-gray-300';
    }
  };

  const getPriorityType = (memories) => {
    if (!memories || memories.length === 0) return null;
    // Priority order: birthday > anniversary > special > holiday
    const priorities = ['birthday', 'anniversary', 'special', 'holiday'];
    for (const priority of priorities) {
      if (memories.some(m => m.type === priority)) {
        return priority;
      }
    }
    return memories[0].type;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => (direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)));
  };

  const handleDateClick = (date) => {
    const dateMemories = getMemoriesForDate(date);
    if (dateMemories.length > 0) {
      setSelectedDate(date);
      setSelectedDateMemories(dateMemories);
    }
  };

  const closePopup = () => {
    setSelectedDate(null);
    setSelectedDateMemories([]);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Format a date from MM/DD format for display
  const formatDate = (dateString) => {
    try {
      // Parse MM/DD format
      const [month, day] = dateString.split('/').map(Number);
      // Create a date using current year
      const date = new Date();
      date.setMonth(month - 1);
      date.setDate(day);
      return format(date, 'MMM d');
    } catch (error) {
      return dateString;
    }
  };

  // Format a date for the popup display
  const formatFullDate = (memory) => {
    try {
      // Parse MM/DD format
      const [month, day] = memory.date.split('/').map(Number);
      // Create a date using current year
      const date = new Date();
      date.setMonth(month - 1);
      date.setDate(day);
      // Format based on memory type
      if (memory.type === 'birthday') {
        return `${memory.title}'s Birthday on ${format(date, 'MMMM d')}`;
      } else {
        return `${memory.title} on ${format(date, 'MMMM d')}`;
      }
    } catch (error) {
      return memory.title;
    }
  };

  // Handle mouseover for highlighting memory details
  const handleMemoryHover = (memory) => {
    setHighlightedMemory(memory);
  };

  // Log for debugging
  console.log("DEBUG: Calendar - Rendering calendar with", memories.length, "memories");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
        <p className="text-text-secondary">View all your special dates</p>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <SafeIcon icon={FiChevronLeft} className="w-5 h-5 text-text-primary" />
        </motion.button>
        <h2 className="text-xl font-bold text-text-primary">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <SafeIcon icon={FiChevronRight} className="w-5 h-5 text-text-primary" />
        </motion.button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-text-secondary font-medium text-sm py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayMemories = getMemoriesForDate(day);
            const isToday = isSameDay(day, new Date());
            const hasEvents = dayMemories.length > 0;
            const priorityType = getPriorityType(dayMemories);
            
            // Get the color for the date box based on the event type
            let eventTypeColor = '';
            let eventGradient = '';
            if (hasEvents && priorityType) {
              eventTypeColor = getTypeColor(priorityType);
              eventGradient = getTypeGradient(priorityType);
              console.log(
                "DEBUG: Calendar - Applying color to date box:",
                format(day, 'MM/dd'),
                "Category:",
                priorityType,
                "Color:",
                eventTypeColor
              );
            }

            return (
              <motion.div
                key={day.toString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => hasEvents && handleMemoryHover(dayMemories[0])}
                onMouseLeave={() => setHighlightedMemory(null)}
                className={`aspect-square p-2 rounded-xl border border-gray-100 relative cursor-pointer ${
                  hasEvents ? 'hover:shadow-md transition-shadow' : ''
                } ${
                  isToday 
                    ? 'bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white' 
                    : hasEvents 
                      ? `bg-gradient-to-r ${eventGradient}` 
                      : 'bg-white/50'
                }`}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-medium ${
                    isToday 
                      ? 'text-white' 
                      : hasEvents 
                        ? 'text-text-primary' 
                        : 'text-text-secondary'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {hasEvents && (
                    <div className="flex justify-center mt-1">
                      {dayMemories.length > 1 ? (
                        <span className="text-xs font-medium">
                          {dayMemories.length} events
                        </span>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/70"></div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Highlighted Memory */}
      {highlightedMemory && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`bg-gradient-to-r ${getTypeGradient(highlightedMemory.type)} p-4 rounded-xl shadow-md mb-4 text-center`}
        >
          <p className="font-semibold text-text-primary">
            {getDisplayName(highlightedMemory)} • {formatDate(highlightedMemory.date)}
          </p>
        </motion.div>
      )}

      {/* Calendar Legend */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
        <h3 className="font-semibold text-text-primary mb-3">Legend</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-pastel-pink"></div>
            <span className="text-sm text-text-secondary">Birthday</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-pastel-teal"></div>
            <span className="text-sm text-text-secondary">Anniversary</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-pastel-yellow"></div>
            <span className="text-sm text-text-secondary">Special Date</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-pastel-purple"></div>
            <span className="text-sm text-text-secondary">Holiday</span>
          </div>
        </div>
        {console.log("DEBUG: Calendar - Legend rendered. (Change 2.2)")}
      </div>

      {/* Memories List for Current Month */}
      {memories.filter(memory => {
        try {
          // Parse MM/DD format
          const [month, day] = memory.date.split('/').map(Number);
          return month - 1 === getMonth(currentDate);
        } catch (error) {
          return false;
        }
      }).length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
          <h3 className="font-semibold text-text-primary mb-3">
            {format(currentDate, 'MMMM')} Memories
          </h3>
          <div className="space-y-3">
            {memories
              .filter(memory => {
                try {
                  // Parse MM/DD format
                  const [month, day] = memory.date.split('/').map(Number);
                  return month - 1 === getMonth(currentDate);
                } catch (error) {
                  return false;
                }
              })
              .sort((a, b) => {
                try {
                  const [monthA, dayA] = a.date.split('/').map(Number);
                  const [monthB, dayB] = b.date.split('/').map(Number);
                  if (monthA === monthB) {
                    return dayA - dayB;
                  }
                  return monthA - monthB;
                } catch (error) {
                  return 0;
                }
              })
              .map(memory => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl"
                >
                  <div className="p-2 rounded-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal">
                    <SafeIcon icon={getTypeIcon(memory.type)} className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{getDisplayName(memory)}</p>
                    <p className="text-sm text-text-secondary capitalize">{memory.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-text-primary">{memory.date}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Date Detail Popup */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-text-secondary" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center mx-auto mb-4">
                  <SafeIcon icon={FiCalendar} className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  {format(selectedDate, 'MMMM d')}
                </h2>
                <p className="text-text-secondary">
                  {selectedDateMemories.length} {selectedDateMemories.length === 1 ? 'event' : 'events'}
                </p>
              </div>

              <div className="space-y-4">
                {selectedDateMemories.map(memory => (
                  <div
                    key={memory.id}
                    className="p-4 rounded-xl bg-white/70 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getTypeColor(memory.type)}`}>
                        <SafeIcon icon={getTypeIcon(memory.type)} className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{getDisplayName(memory)}</p>
                        <p className="text-sm text-text-secondary">{formatFullDate(memory)}</p>
                        <p className="text-xs text-text-secondary">{memory.date} (MM/DD)</p>
                      </div>
                    </div>
                  </div>
                ))}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closePopup}
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-text-primary py-4 rounded-xl font-semibold text-lg mt-4"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiChevronLeft, FiChevronRight, FiX } = FiIcons;

const MonthDayPicker = ({ value, onChange, onClose }) => {
  console.log("DEBUG: MonthDayPicker rendering with value:", value);
  
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth());

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days of week for header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get days in month (accounting for leap years generically)
  const getDaysInMonth = (month) => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysInMonth[month];
  };

  // Get the first day of the month (0-6, where 0 is Sunday)
  const getFirstDayOfMonth = (month) => {
    try {
      const date = new Date(2024, month, 1); // Use leap year for consistency
      return date.getDay();
    } catch (error) {
      console.error("DEBUG: MonthDayPicker - Error getting first day of month:", error);
      return 0; // Default to Sunday if there's an error
    }
  };

  // Format date as MM/DD
  const formatDate = (month, day) => {
    try {
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      return `${formattedMonth}/${formattedDay}`;
    } catch (error) {
      console.error("DEBUG: MonthDayPicker - Error formatting date:", error);
      return "01/01"; // Default to January 1st if there's an error
    }
  };

  // Handle date selection
  const handleDateSelect = (day) => {
    try {
      const formattedDate = formatDate(currentMonth, day);
      console.log("DEBUG: MonthDayPicker - Date selected:", formattedDate);
      onChange(formattedDate);
      onClose();
    } catch (error) {
      console.error("DEBUG: MonthDayPicker - Error selecting date:", error);
    }
  };

  // Generate calendar grid data
  const generateCalendarDays = React.useCallback(() => {
    try {
      const daysInMonth = getDaysInMonth(currentMonth);
      const firstDay = getFirstDayOfMonth(currentMonth);
      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      // Add the days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }

      return days;
    } catch (error) {
      console.error("DEBUG: MonthDayPicker - Error generating calendar days:", error);
      return []; // Return empty array if there's an error
    }
  }, [currentMonth]);

  // Parse current value to highlight selected date
  const parseSelectedDate = () => {
    try {
      if (!value) return null;
      const [month, day] = value.split('/').map(Number);
      return { month: month - 1, day };
    } catch (error) {
      console.error("DEBUG: MonthDayPicker - Error parsing selected date:", error);
      return null;
    }
  };

  const selected = parseSelectedDate();
  const calendarDays = generateCalendarDays();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          console.log("DEBUG: MonthDayPicker - Backdrop clicked, closing picker");
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <SafeIcon icon={FiChevronLeft} className="w-6 h-6 text-text-primary" />
          </motion.button>
          <h2 className="text-2xl font-bold text-text-primary">
            {monthNames[currentMonth]}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <SafeIcon icon={FiChevronRight} className="w-6 h-6 text-text-primary" />
          </motion.button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-text-secondary text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isSelected = selected && selected.month === currentMonth && selected.day === day;

              return day === null ? (
                <div key={`empty-${index}`} className="p-2" />
              ) : (
                <motion.button
                  key={`day-${day}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    aspect-square p-2 rounded-full text-center relative
                    ${isSelected
                      ? 'bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white'
                      : 'hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            console.log("DEBUG: MonthDayPicker - Cancel button clicked");
            onClose();
          }}
          className="w-full bg-gray-100 text-text-primary py-3 rounded-xl font-medium"
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default MonthDayPicker;
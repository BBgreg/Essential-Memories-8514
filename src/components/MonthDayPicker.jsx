import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiChevronLeft, FiChevronRight, FiX } = FiIcons;

const MonthDayPicker = ({ value, onChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (month) => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysInMonth[month];
  };

  const getFirstDayOfMonth = (month) => {
    const date = new Date(2024, month, 1);
    return date.getDay();
  };

  const formatDate = (month, day) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${formattedMonth}/${formattedDay}`;
  };

  const handleDateSelect = (day) => {
    console.log("DEBUG: MonthDayPicker - Date selected:", day, "Month:", currentMonth);
    const formattedDate = formatDate(currentMonth, day);
    console.log("DEBUG: MonthDayPicker - Formatted date:", formattedDate);
    console.log("DEBUG: MonthDayPicker - Triggering onChange with automatic save");
    onChange(formattedDate);
  };

  const generateCalendarDays = React.useCallback(() => {
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
  }, [currentMonth]);

  const parseSelectedDate = () => {
    if (!value) return null;
    const [month, day] = value.split('/').map(Number);
    return { month: month - 1, day };
  };

  const selected = parseSelectedDate();
  const calendarDays = generateCalendarDays();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
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

        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <SafeIcon icon={FiX} className="w-5 h-5 text-text-secondary" />
        </motion.button>

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
                    aspect-square p-2 rounded-full text-center relative font-medium
                    ${isSelected 
                      ? 'bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white shadow-lg' 
                      : 'hover:bg-gray-100 text-text-primary'
                    }
                  `}
                >
                  {day}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Select a date to automatically save your memory
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MonthDayPicker;
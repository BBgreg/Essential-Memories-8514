import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import MonthDayPicker from './MonthDayPicker';

const { FiCalendar } = FiIcons;

const DateField = ({ value, onChange, label }) => {
  const [showPicker, setShowPicker] = React.useState(false);

  const handleIconClick = (e) => {
    console.log("DEBUG: DateField - Calendar icon clicked, opening picker");
    e.preventDefault();
    e.stopPropagation();
    setShowPicker(true);
  };

  const handleDateChange = (selectedDate) => {
    console.log("DEBUG: DateField - Date selected from picker:", selectedDate);
    onChange(selectedDate);
    setShowPicker(false);
  };

  const formatDisplayValue = (value) => {
    if (!value) return '';
    return value; // Already in MM/DD format
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          readOnly
          value={formatDisplayValue(value) || 'MM/DD'}
          className={`
            w-full p-4 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm
            ${value ? 'text-text-primary' : 'text-text-secondary'}
            cursor-pointer
          `}
          onClick={handleIconClick}
          placeholder="Click to select date"
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleIconClick}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100"
        >
          <SafeIcon icon={FiCalendar} className="w-5 h-5 text-vibrant-pink" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showPicker && (
          <MonthDayPicker
            value={value}
            onChange={handleDateChange}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateField;
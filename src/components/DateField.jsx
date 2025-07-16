import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import MonthDayPicker from './MonthDayPicker';

const { FiCalendar } = FiIcons;

const DateField = ({ value, onChange, label }) => {
  console.log("DEBUG: DateField component rendering with value:", value);
  
  const [showPicker, setShowPicker] = React.useState(false);

  const handleIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("DEBUG: DateField - Calendar icon clicked, showing picker");
    setShowPicker(true);
  };

  // Format for display
  const formatDisplayValue = (value) => {
    if (!value) return '';
    // Value is already in MM/DD format
    return value;
  };

  return (
    <div className="space-y-2">
      <label className="text-text-primary font-semibold">
        {label || 'Date (Month/Day)'}
      </label>
      <div className="relative">
        {/* Read-only display field */}
        <input
          type="text"
          readOnly
          value={formatDisplayValue(value) || 'MM/DD'}
          className={`
            w-full p-4 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm
            ${value ? 'text-text-primary' : 'text-text-secondary'}
            cursor-default
          `}
        />
        {/* Calendar icon button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleIconClick}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100"
        >
          <SafeIcon icon={FiCalendar} className="w-5 h-5 text-vibrant-pink" />
        </motion.button>
      </div>

      {/* Calendar Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <MonthDayPicker
            value={value}
            onChange={(newDate) => {
              console.log("DEBUG: DateField - Date selected:", newDate);
              onChange(newDate);
            }}
            onClose={() => {
              console.log("DEBUG: DateField - Picker closed");
              setShowPicker(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateField;
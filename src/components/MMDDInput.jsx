import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const MMDDInput = ({ value = '', onChange, onSubmit }) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  console.log("DEBUG: QOTD - MM/DD input field initialized. (Change 1.1)");

  // Format the internal value to display MM/DD format with placeholders
  const formatDisplay = () => {
    if (!internalValue) return '__/__';
    
    // Handle cases where the input might already contain a '/'
    if (internalValue.includes('/')) {
      const [month, day] = internalValue.split('/');
      return `${month.padEnd(2, '_')}/${day.padEnd(2, '_')}`;
    }
    
    // Handle cases where the input doesn't contain a '/' yet
    if (internalValue.length <= 2) {
      return `${internalValue.padEnd(2, '_')}/__`;
    } else {
      const month = internalValue.substring(0, 2);
      const day = internalValue.substring(2).padEnd(2, '_');
      return `${month}/${day}`;
    }
  };

  // Process input to ensure MM/DD format and only allow numbers
  const handleChange = (e) => {
    const rawInput = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
    
    // Limit to 4 digits total (MM/DD)
    if (rawInput.length > 4) return;
    
    setInternalValue(rawInput);
    
    // Format as MM/DD for external state
    let formatted = rawInput;
    if (rawInput.length > 2) {
      formatted = `${rawInput.substring(0, 2)}/${rawInput.substring(2)}`;
    }
    
    onChange(formatted);
  };

  // Handle key presses for special functionality
  const handleKeyDown = (e) => {
    // Submit on Enter
    if (e.key === 'Enter') {
      if (internalValue.length === 4 || (internalValue.length === 5 && internalValue.includes('/'))) {
        onSubmit?.();
      }
    }
  };

  // Format value when component updates
  useEffect(() => {
    if (value && value !== internalValue && !value.includes(internalValue)) {
      // Only update internal value if external value changes significantly
      setInternalValue(value.replace('/', ''));
    }
  }, [value]);

  return (
    <div className="relative w-full">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden"
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full p-4 text-center text-xl font-medium text-text-primary bg-transparent outline-none border border-gray-200 rounded-2xl"
          placeholder="MM/DD"
          maxLength={5}
        />
        
        {/* Overlay display that shows MM/DD format with placeholders */}
        {!isFocused && internalValue.length < 4 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-medium">
              {formatDisplay()}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MMDDInput;
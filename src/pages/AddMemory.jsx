import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import DateField from '../components/DateField';

const { FiArrowLeft, FiGift, FiHeart, FiStar, FiCalendar, FiCheck, FiAlertCircle } = FiIcons;

const AddMemory = () => {
  const navigate = useNavigate();
  const { addMemory } = useMemory();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'birthday'
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("DEBUG: AddMemory - Component rendered with user:", user?.id);

  // Verify user authentication
  useEffect(() => {
    if (!user) {
      console.log("DEBUG: AddMemory - No user found, redirecting to login");
      navigate('/login');
    }
  }, [user, navigate]);

  // Reset form after success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        console.log("DEBUG: AddMemory - Resetting form after success");
        setFormData({
          name: '',
          date: '',
          type: 'birthday'
        });
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const memoryTypes = [
    { id: 'birthday', label: 'Birthday', icon: FiGift, color: 'from-pastel-pink to-vibrant-pink' },
    { id: 'anniversary', label: 'Anniversary', icon: FiHeart, color: 'from-pastel-teal to-vibrant-teal' },
    { id: 'special', label: 'Special Date', icon: FiStar, color: 'from-pastel-yellow to-vibrant-yellow' },
    { id: 'holiday', label: 'Holiday', icon: FiCalendar, color: 'from-pastel-purple to-vibrant-purple' }
  ];

  const validateForm = () => {
    if (!user || !user.id) {
      setError('You must be logged in to add a memory');
      return false;
    }

    if (!formData.name || !formData.name.trim()) {
      setError('Please enter a name for the memory');
      return false;
    }

    if (!formData.date || !/^\d{2}\/\d{2}$/.test(formData.date)) {
      setError('Please select a valid date');
      return false;
    }

    if (!formData.type) {
      setError('Please select a memory type');
      return false;
    }

    return true;
  };

  const handleAutoSave = async () => {
    console.log("DEBUG: AddMemory - Auto-save triggered with form data:", formData);
    
    if (isSubmitting) {
      console.log("DEBUG: AddMemory - Already submitting, skipping auto-save");
      return;
    }

    if (!validateForm()) {
      console.log("DEBUG: AddMemory - Form validation failed");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log("DEBUG: AddMemory - Starting memory save process");
      
      // Call the addMemory function from context
      const result = await addMemory(formData);
      
      console.log("DEBUG: AddMemory - Memory saved successfully:", result);
      
      // Show success message
      setShowSuccess(true);
      
    } catch (error) {
      console.error("DEBUG: AddMemory - Error saving memory:", error);
      setError(error.message || 'Failed to save memory. Please try again.');
    } finally {
      setIsSubmitting(false);
      console.log("DEBUG: AddMemory - Auto-save process completed");
    }
  };

  const handleChange = (field, value) => {
    console.log(`DEBUG: AddMemory - Field ${field} changed to:`, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user makes changes
    if (error) {
      setError('');
    }

    // Trigger auto-save when date is selected and form is complete
    if (field === 'date' && value) {
      console.log("DEBUG: AddMemory - Date selected, checking if form is ready for auto-save");
      
      // Create updated form data for validation
      const updatedFormData = {
        ...formData,
        [field]: value
      };
      
      // Check if all required fields are filled
      if (updatedFormData.name && updatedFormData.name.trim() && 
          updatedFormData.date && updatedFormData.type) {
        console.log("DEBUG: AddMemory - All fields complete, triggering auto-save");
        
        // Update state first, then trigger save
        setTimeout(() => {
          handleAutoSave();
        }, 100);
      } else {
        console.log("DEBUG: AddMemory - Form incomplete, auto-save skipped");
      }
    }
  };

  // Success overlay
  if (showSuccess) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="p-2 rounded-full bg-white/60 backdrop-blur-sm shadow-lg"
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-text-primary" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Add Memory</h1>
            <p className="text-text-secondary">Memory saved successfully!</p>
          </div>
        </div>

        {/* Success Message */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div className="text-center space-y-4 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-sm w-full">
            <div className="w-24 h-24 bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center mx-auto">
              <SafeIcon icon={FiCheck} className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Memory Added!</h2>
            <p className="text-text-secondary">
              {formData.type === 'birthday' 
                ? `${formData.name}'s Birthday` 
                : formData.name} has been saved successfully.
            </p>
            <p className="text-sm text-text-secondary">
              You can now practice this memory in flashcard mode!
            </p>
            <div className="flex space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/home')}
                className="flex-1 bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-3 rounded-xl font-semibold"
              >
                Go Home
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/flashcards')}
                className="flex-1 bg-gradient-to-r from-vibrant-yellow to-vibrant-purple text-white py-3 rounded-xl font-semibold"
              >
                Practice
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/home')}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm shadow-lg"
        >
          <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-text-primary" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Add Memory</h1>
          <p className="text-text-secondary">Create a new special date to remember</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 rounded-xl p-4 flex items-center"
        >
          <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {/* Form Fields */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-text-primary font-semibold">
            {formData.type === 'birthday' ? "Person's Name" : 'Memory Name'}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={
              formData.type === 'birthday' 
                ? 'e.g., John Smith' 
                : 'e.g., Wedding Anniversary, Christmas'
            }
            className="w-full p-4 rounded-2xl border border-gray-200 focus:border-vibrant-pink focus:outline-none bg-white/60 backdrop-blur-sm"
            required
          />
          {formData.type === 'birthday' && (
            <p className="text-xs text-text-secondary italic">
              Will be displayed as "{formData.name ? `${formData.name}'s Birthday` : "Name's Birthday"}"
            </p>
          )}
        </div>

        {/* Type Selection */}
        <div className="space-y-3">
          <label className="text-text-primary font-semibold">Memory Type</label>
          <div className="grid grid-cols-2 gap-3">
            {memoryTypes.map((type) => (
              <motion.button
                key={type.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChange('type', type.id)}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  formData.type === type.id
                    ? `bg-gradient-to-r ${type.color} border-transparent text-white shadow-lg`
                    : 'bg-white/60 border-gray-200 text-text-primary hover:border-vibrant-pink'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={type.icon} className="w-5 h-5" />
                  <span className="font-semibold">{type.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Date Field - Auto-saves when selected */}
        <div className="space-y-2">
          <label className="text-text-primary font-semibold">Select Date</label>
          <DateField
            value={formData.date}
            onChange={(date) => handleChange('date', date)}
            label="Date (MM/DD)"
          />
          <div className="text-center">
            {isSubmitting ? (
              <p className="text-sm text-vibrant-pink font-medium">
                Saving memory...
              </p>
            ) : (
              <p className="text-xs text-text-secondary italic">
                {formData.name && formData.type 
                  ? "Select a date to automatically save your memory"
                  : "Please fill in the name and type first"
                }
              </p>
            )}
          </div>
        </div>

        {/* Manual Save Button (backup) */}
        {formData.name && formData.type && formData.date && !isSubmitting && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAutoSave}
            className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg"
          >
            Save Memory
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default AddMemory;
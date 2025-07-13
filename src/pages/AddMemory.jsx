import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import DateField from '../components/DateField';
import supabase from '../lib/supabase';

const { FiArrowLeft, FiGift, FiHeart, FiStar, FiCalendar, FiCheck, FiAlertCircle } = FiIcons;

const AddMemory = () => {
  const navigate = useNavigate();
  const { addMemory } = useMemory();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'birthday'
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memoryTypes = [
    { id: 'birthday', label: 'Birthday', icon: FiGift, color: 'from-pastel-pink to-vibrant-pink' },
    { id: 'anniversary', label: 'Anniversary', icon: FiHeart, color: 'from-pastel-teal to-vibrant-teal' },
    { id: 'special', label: 'Special Date', icon: FiStar, color: 'from-pastel-yellow to-vibrant-yellow' },
    { id: 'holiday', label: 'Holiday', icon: FiCalendar, color: 'from-pastel-purple to-vibrant-purple' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // CRITICAL: Verify current user is authenticated
    const currentUser = supabase.auth.currentUser;
    
    if (!currentUser || !currentUser.id) {
      console.error('No authenticated user found in current session during form submit');
      setError('You must be logged in to add a memory. Please try logging out and back in.');
      return;
    }
    
    console.log('Current authenticated user ID:', currentUser.id);
    
    if (!formData.name.trim() || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Adding memory with user ID:', currentUser.id);
      console.log('Memory data:', formData);
      
      const result = await addMemory({
        ...formData,
        userId: currentUser.id // Explicitly pass the user ID to ensure it's used
      });
      
      console.log('Memory added result:', result);
      
      if (!result || !result.id) {
        throw new Error('Failed to add memory. Please try again.');
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error adding memory:', error);
      setError(error.message || 'Failed to add memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (showSuccess) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center mx-auto">
            <SafeIcon icon={FiCheck} className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Memory Added!</h2>
          <p className="text-text-secondary">
            {formData.type === 'birthday' ? `${formData.name}'s Birthday` : formData.name} has been
            saved successfully.
          </p>
          <div className="text-sm text-text-secondary">
            Date: {formData.date} (MM/DD)
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
          onClick={() => navigate(-1)}
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

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-text-primary font-semibold">
            {formData.type === 'birthday' ? "Person's Name" : 'Name'}
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
              Will be displayed as "{formData.name ? `${formData.name}'s Birthday` : 'Name\'s Birthday'}"
            </p>
          )}
        </div>

        {/* Date Field - Using the custom DateField component */}
        <DateField
          value={formData.date}
          onChange={(date) => handleChange('date', date)}
          label="Date (MM/DD)"
        />

        {/* Type Selection */}
        <div className="space-y-3">
          <label className="text-text-primary font-semibold">Type</label>
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

        {/* Submit Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || !formData.name.trim() || !formData.date}
          className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding Memory...' : 'Add Memory'}
        </motion.button>
      </motion.form>
    </div>
  );
};

export default AddMemory;
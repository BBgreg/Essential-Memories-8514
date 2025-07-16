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

  // Verify user authentication
  useEffect(() => {
    console.log('DEBUG: AddMemory - Checking user authentication');
    if (!user) {
      console.log('DEBUG: AddMemory - No user found, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);

  const memoryTypes = [
    {
      id: 'birthday',
      label: 'Birthday',
      icon: FiGift,
      color: 'from-pastel-pink to-vibrant-pink'
    },
    {
      id: 'anniversary',
      label: 'Anniversary',
      icon: FiHeart,
      color: 'from-pastel-teal to-vibrant-teal'
    },
    {
      id: 'special',
      label: 'Special Date',
      icon: FiStar,
      color: 'from-pastel-yellow to-vibrant-yellow'
    },
    {
      id: 'holiday',
      label: 'Holiday',
      icon: FiCalendar,
      color: 'from-pastel-purple to-vibrant-purple'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('DEBUG: AddMemory - Form submitted:', formData);

    if (!user) {
      console.error('DEBUG: AddMemory - Submit attempted without user');
      setError('You must be logged in to add a memory');
      return;
    }

    if (!formData.name.trim() || !formData.date) {
      console.error('DEBUG: AddMemory - Missing required fields');
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('DEBUG: AddMemory - Attempting to add memory:', {
        userId: user.id,
        ...formData
      });

      await addMemory({
        ...formData,
        userId: user.id
      });

      console.log('DEBUG: AddMemory - Memory added successfully');
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('DEBUG: AddMemory - Error:', error);
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

  // ... (rest of the component remains the same)

  return (
    <div className="p-6 space-y-6">
      {/* ... (existing JSX remains the same) ... */}
    </div>
  );
};

export default AddMemory;
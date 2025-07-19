import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft } = FiIcons;

const Privacy = () => {
  const navigate = useNavigate();
  
  console.log("DEBUG: Legal page date updated to 2025. (Change 2)");

  return (
    <div className="p-6 space-y-6 min-h-screen">
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
          <h1 className="text-2xl font-bold text-text-primary">Privacy Policy</h1>
          <p className="text-text-secondary">Last Updated: 2025</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg"
      >
        <div className="prose prose-sm max-w-none">
          <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
          <p className="mb-4">
            At Essential Memories, we take your privacy seriously. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our application.
          </p>
          <p className="mb-4">
            Please read this Privacy Policy carefully. By using the application, you consent to the data practices
            described in this statement.
          </p>

          <h2 className="text-xl font-bold mb-4">2. Information We Collect</h2>
          <p className="mb-4">
            We may collect several types of information from and about users of our application, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Personal information such as email address and optional display name</li>
            <li>Information about the dates you wish to remember</li>
            <li>Usage data and analytics about how you interact with our application</li>
            <li>Device information such as your mobile device ID, model, and manufacturer</li>
          </ul>

          <h2 className="text-xl font-bold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">We use information that we collect about you or that you provide to us:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>To provide you with the application and its contents</li>
            <li>To provide you with notices about your account</li>
            <li>To improve our application and user experience</li>
            <li>To allow you to participate in interactive features of our application</li>
            <li>For any other purpose with your consent</li>
          </ul>

          <h2 className="text-xl font-bold mb-4">4. Disclosure of Your Information</h2>
          <p className="mb-4">
            We may disclose aggregated information about our users without restriction. We may disclose personal
            information:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>To comply with any court order, law, or legal process</li>
            <li>To enforce our rights arising from any contracts between you and us</li>
            <li>
              If we believe disclosure is necessary to protect the rights of Essential Memories, our customers, or
              others
            </li>
          </ul>

          <h2 className="text-xl font-bold mb-4">5. Data Security</h2>
          <p className="mb-4">
            We have implemented measures designed to secure your personal information from accidental loss and from
            unauthorized access, use, alteration, and disclosure.
          </p>
          <p className="mb-4">
            The safety and security of your information also depends on you. You are responsible for keeping your
            account password confidential.
          </p>

          <h2 className="text-xl font-bold mb-4">6. Data Retention</h2>
          <p className="mb-4">
            We will retain your personal information only for as long as is necessary for the purposes set out in
            this Privacy Policy.
          </p>

          <h2 className="text-xl font-bold mb-4">7. Your Rights</h2>
          <p className="mb-4">
            You have the right to access, update, or delete your personal information. You can do this through your
            account settings or by contacting us.
          </p>

          <h2 className="text-xl font-bold mb-4">8. Changes to Our Privacy Policy</h2>
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <h2 className="text-xl font-bold mb-4">9. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at privacy@essentialmemories.app
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;
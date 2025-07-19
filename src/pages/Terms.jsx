import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft } = FiIcons;

const Terms = () => {
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
          <h1 className="text-2xl font-bold text-text-primary">Terms of Service</h1>
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
            Welcome to Essential Memories. These Terms of Service govern your use of our application,
            website, and services.
          </p>
          <p className="mb-4">By using Essential Memories, you agree to these Terms. Please read them carefully.</p>

          <h2 className="text-xl font-bold mb-4">2. Using Our Services</h2>
          <p className="mb-4">You must follow any policies made available to you within the Services.</p>
          <p className="mb-4">
            Don't misuse our Services. For example, don't interfere with our Services or try to access them using a
            method other than the interface and the instructions that we provide.
          </p>

          <h2 className="text-xl font-bold mb-4">3. Your Account</h2>
          <p className="mb-4">
            You need an account to use our services. You are responsible for maintaining the security of your account
            and password.
          </p>
          <p className="mb-4">
            Essential Memories cannot and will not be liable for any loss or damage from your failure to comply with
            this security obligation.
          </p>

          <h2 className="text-xl font-bold mb-4">4. Privacy</h2>
          <p className="mb-4">
            Our Privacy Policy explains how we treat your personal data and protect your privacy when you use our
            Services. By using our Services, you agree that Essential Memories can use such data in accordance with
            our privacy policies.
          </p>

          <h2 className="text-xl font-bold mb-4">5. Modifying and Terminating our Services</h2>
          <p className="mb-4">
            We are constantly changing and improving our Services. We may add or remove functionalities or features,
            and we may suspend or stop a Service altogether.
          </p>
          <p className="mb-4">
            You can stop using our Services at any time. Essential Memories may also stop providing Services to you,
            or add or create new limits to our Services at any time.
          </p>

          <h2 className="text-xl font-bold mb-4">6. Disclaimers</h2>
          <p className="mb-4">The Services are provided "as is" without any warranties, express or implied.</p>

          <h2 className="text-xl font-bold mb-4">7. Limitation of Liability</h2>
          <p className="mb-4">
            To the maximum extent permitted by law, Essential Memories will not be liable for any indirect,
            incidental, special, consequential or punitive damages, or any loss of profits or revenues.
          </p>

          <h2 className="text-xl font-bold mb-4">8. Changes to These Terms</h2>
          <p className="mb-4">
            We may modify these terms or any additional terms that apply to a Service to, for example, reflect
            changes to the law or changes to our Services.
          </p>
          <p className="mb-4">
            You should look at the terms regularly. We'll post notice of modifications to these terms on this page.
          </p>

          <h2 className="text-xl font-bold mb-4">9. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at support@essentialmemories.app
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
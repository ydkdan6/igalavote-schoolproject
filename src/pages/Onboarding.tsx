import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('onboarding_complete', 'true');
      navigate('/auth');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_complete', 'true');
    navigate('/auth');
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        <OnboardingScreen step={step} onNext={handleNext} onSkip={handleSkip} />
      </motion.div>
    </AnimatePresence>
  );
}

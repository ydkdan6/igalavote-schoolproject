import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Vote, Shield, ChevronRight, CheckCircle2 } from 'lucide-react';

interface OnboardingScreenProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const screens = [
  {
    icon: Vote,
    title: 'Welcome to Igala Voting',
    subtitle: 'Your Voice, Your Choice',
    description: 'Participate in free and fair elections. Cast your vote securely and confidently for the candidates of your choice.',
    features: ['Easy voting process', 'Real-time results', 'Transparent system'],
  },
  {
    icon: Shield,
    title: 'Secure & Transparent',
    subtitle: 'One Person, One Vote',
    description: 'Our system ensures that every vote counts. With advanced security measures, your vote remains anonymous and protected.',
    features: ['Encrypted voting', 'Verified identity', 'Audit trail'],
  },
];

export function OnboardingScreen({ step, onNext, onSkip }: OnboardingScreenProps) {
  const screen = screens[step];
  const Icon = screen.icon;
  const isLastScreen = step === screens.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-8 bg-accent rounded-3xl flex items-center justify-center shadow-xl"
        >
          <Icon className="w-12 h-12 text-accent-foreground" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-primary-foreground mb-2"
        >
          {screen.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-accent font-semibold text-lg mb-4"
        >
          {screen.subtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-primary-foreground/80 mb-8"
        >
          {screen.description}
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 mb-10"
        >
          {screen.features.map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-3 justify-center text-primary-foreground/90"
            >
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {screens.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step ? 'w-8 bg-accent' : 'w-2 bg-primary-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onNext}
            size="lg"
            className="w-full btn-accent-gradient text-lg py-6"
          >
            {isLastScreen ? 'Get Started' : 'Continue'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          
          {!isLastScreen && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              Skip
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

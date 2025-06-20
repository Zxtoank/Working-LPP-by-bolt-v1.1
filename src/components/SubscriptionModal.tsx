import React, { useState, useEffect } from 'react';
import { Crown, Check, Star, Zap } from 'lucide-react';

interface SubscriptionModalProps {
  onClose: () => void;
  user: { email: string; isPremium: boolean } | null;
}

interface Plan {
  id: 'basic' | 'premium' | 'pro';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, user }) => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'pro'>('premium');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Check if PayPal is loaded
  useEffect(() => {
    const checkPayPal = () => {
      if (window.paypal) {
        setPaypalLoaded(true);
      } else {
        setTimeout(checkPayPal, 500);
      }
    };
    checkPayPal();
  }, []);

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: billingPeriod === 'monthly' ? 4.99 : 49.99,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'Perfect for occasional users',
      features: [
        '5 high-res downloads per month',
        'Standard support',
        'Basic export formats',
        'Email notifications'
      ],
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: billingPeriod === 'monthly' ? 9.99 : 99.99,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'Most popular choice',
      features: [
        'Unlimited high-res downloads',
        'Priority support',
        'All export formats',
        '15% discount on physical orders',
        'Advanced editing tools',
        'Cloud storage for designs'
      ],
      popular: true,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'pro',
      name: 'Professional',
      price: billingPeriod === 'monthly' ? 19.99 : 199.99,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'For power users and businesses',
      features: [
        'Everything in Premium',
        'Bulk order processing',
        'Custom shape creation',
        'API access',
        'White-label options',
        'Dedicated account manager',
        '25% discount on physical orders'
      ],
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const initializePayPalButtons = (plan: Plan) => {
    if (!paypalLoaded || !window.paypal) {
      console.error('PayPal SDK not loaded');
      alert('PayPal is not available. Please refresh the page and try again.');
      return;
    }

    // Clear any existing PayPal buttons
    const container = document.getElementById('subscription-paypal-container');
    if (container) {
      container.innerHTML = '';
    }

    try {
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: plan.price.toFixed(2)
              },
              description: `${plan.name} Plan - ${billingPeriod} subscription`
            }],
            intent: 'CAPTURE' // For one-time payments (in real app, use subscription API)
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const order = await actions.order.capture();
            console.log('Subscription payment successful:', order);
            
            // Save subscription to user's profile
            const newSubscription = {
              id: Date.now().toString(),
              plan: plan.id,
              status: 'active' as const,
              startDate: new Date().toISOString(),
              nextBilling: new Date(Date.now() + (billingPeriod === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
              price: plan.price
            };
            
            localStorage.setItem(`subscription-${user?.email}`, JSON.stringify(newSubscription));
            
            alert(`Successfully subscribed to ${plan.name} plan! Welcome to premium features.`);
            onClose();
          } catch (error) {
            console.error('Subscription payment failed:', error);
            alert('Subscription failed. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal subscription error:', err);
          alert('Subscription failed. Please try again.');
          setIsProcessing(false);
        },
        onCancel: () => {
          console.log('Subscription cancelled by user');
          setIsProcessing(false);
        }
      }).render('#subscription-paypal-container');
    } catch (error) {
      console.error('Failed to initialize PayPal buttons:', error);
      alert('Failed to load payment options. Please refresh the page and try again.');
    }
  };

  const handlePayPalSubscription = (plan: Plan) => {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    if (!paypalLoaded) {
      alert('PayPal is still loading. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    
    // Initialize PayPal buttons
    setTimeout(() => {
      initializePayPalButtons(plan);
    }, 200);
  };

  const getYearlySavings = (monthlyPrice: number) => {
    const yearlyEquivalent = monthlyPrice * 12;
    const yearlyPrice = monthlyPrice * 10; // 2 months free
    return yearlyEquivalent - yearlyPrice;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                <p className="text-purple-100 text-sm">Unlock premium features and save money</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                Save up to $24/year
              </span>
            )}
          </div>
        </div>

        {/* Plans */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Most Popular</span>
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${plan.color} text-white mb-4`}>
                    {plan.id === 'basic' && <Zap className="h-6 w-6" />}
                    {plan.id === 'premium' && <Crown className="h-6 w-6" />}
                    {plan.id === 'pro' && <Star className="h-6 w-6" />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-green-600 text-sm font-medium">
                      Save ${getYearlySavings(plan.id === 'basic' ? 4.99 : plan.id === 'premium' ? 9.99 : 19.99)}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayPalSubscription(plan)}
                  disabled={isProcessing || !paypalLoaded}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing ? 'Processing...' : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

          {!paypalLoaded ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PayPal...</p>
            </div>
          ) : (
            <div id="subscription-paypal-container" className="mt-6"></div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              All plans include a 7-day free trial. Cancel anytime.
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <span>✓ Secure payments via PayPal</span>
              <span>✓ No hidden fees</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Package, CreditCard, MapPin, Truck } from 'lucide-react';

interface PhysicalOrderModalProps {
  onClose: () => void;
  user: { email: string; isPremium: boolean } | null;
  layoutImage: string;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export const PhysicalOrderModal: React.FC<PhysicalOrderModalProps> = ({ onClose, user, layoutImage }) => {
  const [step, setStep] = useState<'details' | 'shipping' | 'payment'>('details');
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: ''
  });
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

  const basePrice = 7.99;
  const shippingCost = 4.99;
  const discount = user?.isPremium ? 0.15 : 0; // 15% discount for premium users
  const subtotal = basePrice * quantity;
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount + shippingCost;

  const initializePayPalButtons = () => {
    if (!paypalLoaded || !window.paypal) {
      console.error('PayPal SDK not loaded');
      alert('PayPal is not available. Please refresh the page and try again.');
      return;
    }

    // Clear any existing PayPal buttons
    const container = document.getElementById('physical-order-paypal-container');
    if (container) {
      container.innerHTML = '';
    }

    try {
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: total.toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: (subtotal - discountAmount).toFixed(2)
                  },
                  shipping: {
                    currency_code: 'USD',
                    value: shippingCost.toFixed(2)
                  },
                  discount: discount > 0 ? {
                    currency_code: 'USD',
                    value: discountAmount.toFixed(2)
                  } : undefined
                }
              },
              description: `Locket Photo Print - Physical Prints (${quantity} units)`,
              items: [{
                name: 'Custom Locket Photo Prints',
                unit_amount: {
                  currency_code: 'USD',
                  value: basePrice.toFixed(2)
                },
                quantity: quantity.toString()
              }]
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const order = await actions.order.capture();
            console.log('Physical order payment successful:', order);
            
            // Save order to user's history
            const newOrder = {
              id: Date.now().toString(),
              orderDate: new Date().toISOString(),
              status: 'processing' as const,
              price: total,
              shippingAddress,
              items: [{
                filename: 'Custom Locket Photos',
                quantity,
                price: basePrice
              }]
            };
            
            const existingOrders = JSON.parse(localStorage.getItem(`orders-${user?.email}`) || '[]');
            existingOrders.push(newOrder);
            localStorage.setItem(`orders-${user?.email}`, JSON.stringify(existingOrders));
            
            alert('Order placed successfully! You will receive a confirmation email shortly.');
            onClose();
          } catch (error) {
            console.error('Payment capture failed:', error);
            alert('Payment processing failed. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          alert('Payment failed. Please try again.');
          setIsProcessing(false);
        },
        onCancel: () => {
          console.log('Payment cancelled by user');
          setIsProcessing(false);
        }
      }).render('#physical-order-paypal-container');
    } catch (error) {
      console.error('Failed to initialize PayPal buttons:', error);
      alert('Failed to load payment options. Please refresh the page and try again.');
    }
  };

  const handlePayPalPayment = () => {
    if (!paypalLoaded) {
      alert('PayPal is still loading. Please wait a moment and try again.');
      return;
    }
    
    setIsProcessing(true);
    
    // Initialize PayPal buttons
    setTimeout(() => {
      initializePayPalButtons();
    }, 200);
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const isAddressValid = () => {
    return shippingAddress.name && shippingAddress.address && shippingAddress.city && 
           shippingAddress.state && shippingAddress.zipCode && shippingAddress.phone;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Order Physical Prints</h2>
                <p className="text-green-100 text-sm">Professional quality locket photos</p>
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

        {/* Progress Steps */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            {[
              { id: 'details', label: 'Order Details', icon: Package },
              { id: 'shipping', label: 'Shipping', icon: MapPin },
              { id: 'payment', label: 'Payment', icon: CreditCard },
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.id;
              const isCompleted = ['details', 'shipping', 'payment'].indexOf(step) > index;
              
              return (
                <div key={stepItem.id} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    isActive ? 'bg-blue-100 text-blue-600' : 
                    isCompleted ? 'bg-green-100 text-green-600' : 'text-gray-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{stepItem.label}</span>
                  </div>
                  {index < 2 && <div className="w-8 h-px bg-gray-300 mx-2" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {step === 'details' && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <img
                  src={layoutImage}
                  alt="Layout preview"
                  className="w-32 h-48 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Locket Photo Prints</h3>
                  <p className="text-gray-600 mb-4">
                    Professional quality 4" × 6" print with 35 custom-sized locket photos. 
                    Perfect for cutting and fitting into various locket sizes.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Base Price:</span>
                      <span className="font-semibold">${basePrice.toFixed(2)} each</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Quantity:</label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {user?.isPremium && (
                      <div className="flex items-center justify-between text-green-600">
                        <span>Premium Discount (15%):</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📦 What You'll Receive:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• High-quality photo paper print (4" × 6")</li>
                  <li>• 35 photos in various sizes (8mm to 35mm)</li>
                  <li>• Professional printing with vibrant colors</li>
                  <li>• Protective packaging</li>
                  <li>• Delivery in 5-7 business days</li>
                </ul>
              </div>

              <button
                onClick={() => setStep('shipping')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                Continue to Shipping
              </button>
            </div>
          )}

          {step === 'shipping' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) => handleAddressChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={shippingAddress.address}
                  onChange={(e) => handleAddressChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New York"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="NY"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={shippingAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('payment')}
                  disabled={!isAddressValid()}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal ({quantity} × ${basePrice.toFixed(2)}):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Premium Discount (15%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Shipping Details</h4>
                </div>
                <p className="text-sm text-blue-800">
                  {shippingAddress.name}<br />
                  {shippingAddress.address}<br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                </p>
              </div>

              {!paypalLoaded ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PayPal...</p>
                </div>
              ) : (
                <div id="physical-order-paypal-container"></div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('shipping')}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handlePayPalPayment}
                  disabled={isProcessing || !paypalLoaded}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
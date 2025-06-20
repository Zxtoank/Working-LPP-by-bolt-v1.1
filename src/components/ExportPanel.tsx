import React, { useState, useEffect } from 'react';
import { Download, Crown, FileImage, FileText, CreditCard, Package, Star } from 'lucide-react';
import jsPDF from 'jspdf';

interface ExportPanelProps {
  user: { email: string; isPremium: boolean } | null;
  onAuthRequired: () => void;
  onPhysicalOrder: () => void;
  onSubscribe: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ 
  user, 
  onAuthRequired, 
  onPhysicalOrder,
  onSubscribe 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Check if PayPal is loaded
  useEffect(() => {
    const checkPayPal = () => {
      if (window.paypal) {
        setPaypalLoaded(true);
      } else {
        // Retry after a short delay
        setTimeout(checkPayPal, 500);
      }
    };
    checkPayPal();
  }, []);

  const generateHighResLayout = (dpi: number): HTMLCanvasElement => {
    // Get the layout canvas from the LayoutGenerator
    const layoutCanvas = document.querySelector('#layoutCanvas') as HTMLCanvasElement;
    if (!layoutCanvas) {
      throw new Error('Layout canvas not found');
    }

    // Create high-res canvas
    const scale = dpi / 144; // 144 is the base DPI
    const highResCanvas = document.createElement('canvas');
    const ctx = highResCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set high-res dimensions
    highResCanvas.width = 576 * scale; // 4" at target DPI
    highResCanvas.height = 864 * scale; // 6" at target DPI

    // Scale and draw the layout
    ctx.scale(scale, scale);
    ctx.drawImage(layoutCanvas, 0, 0);

    return highResCanvas;
  };

  const saveDownloadHistory = (format: string, dpi: number, filename: string, downloadUrl: string) => {
    if (!user) return;
    
    const download = {
      id: Date.now().toString(),
      filename,
      format,
      dpi,
      downloadDate: new Date().toISOString(),
      downloadUrl
    };
    
    const existingDownloads = JSON.parse(localStorage.getItem(`downloads-${user.email}`) || '[]');
    existingDownloads.push(download);
    localStorage.setItem(`downloads-${user.email}`, JSON.stringify(existingDownloads));
  };

  const initializePayPalButtons = () => {
    if (!paypalLoaded || !window.paypal) {
      console.error('PayPal SDK not loaded');
      alert('PayPal is not available. Please refresh the page and try again.');
      return;
    }

    // Clear any existing PayPal buttons
    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
    }

    try {
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: '4.99'
              },
              description: 'Locket Photo Print - Premium High-Resolution Export'
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const order = await actions.order.capture();
            console.log('Payment successful:', order);
            
            // Grant premium access
            if (user) {
              localStorage.setItem('locket-premium-access', 'true');
              alert('Payment successful! You now have access to premium features.');
              setShowPayPalModal(false);
              
              // Trigger the download that was requested
              const pendingDownload = localStorage.getItem('pending-premium-download');
              if (pendingDownload) {
                const { format, dpi } = JSON.parse(pendingDownload);
                localStorage.removeItem('pending-premium-download');
                handleExport(format, dpi);
              }
            }
          } catch (error) {
            console.error('Payment capture failed:', error);
            alert('Payment processing failed. Please try again.');
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          alert('Payment failed. Please try again.');
        },
        onCancel: () => {
          console.log('Payment cancelled by user');
          setShowPayPalModal(false);
        }
      }).render('#paypal-button-container');
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
    
    setShowPayPalModal(true);
    
    // Initialize PayPal buttons after modal is shown
    setTimeout(() => {
      initializePayPalButtons();
    }, 200);
  };

  const handleExport = async (format: 'png' | 'pdf', dpi: number) => {
    // Check if premium feature and user doesn't have access
    if (dpi >= 1200) {
      if (!user) {
        onAuthRequired();
        return;
      }
      
      const hasPremiumAccess = localStorage.getItem('locket-premium-access') === 'true';
      const hasSubscription = localStorage.getItem(`subscription-${user.email}`);
      
      if (!user.isPremium && !hasPremiumAccess && !hasSubscription) {
        // Store the pending download for after payment
        localStorage.setItem('pending-premium-download', JSON.stringify({ format, dpi }));
        handlePayPalPayment();
        return;
      }
    }

    setIsExporting(true);
    
    try {
      // Check if layout canvas exists
      const layoutCanvas = document.querySelector('#layoutCanvas') as HTMLCanvasElement;
      if (!layoutCanvas) {
        alert('Please create a layout first by uploading and editing an image.');
        return;
      }

      const filename = `locket-photos-${dpi}dpi.${format}`;
      let downloadUrl = '';

      if (format === 'png') {
        // Generate high-res canvas
        const highResCanvas = generateHighResLayout(dpi);
        downloadUrl = highResCanvas.toDataURL('image/png');
        
        // Create download link
        const link = document.createElement('a');
        link.download = filename;
        link.href = downloadUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // PDF export
        const highResCanvas = generateHighResLayout(dpi);
        
        // Create PDF (4" × 6")
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: [4, 6]
        });
        
        const imgData = highResCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 4, 6);
        pdf.save(filename);
        downloadUrl = imgData; // Store the image data for history
      }
      
      // Save to download history
      saveDownloadHistory(format, dpi, filename, downloadUrl);
      
      // Clear premium access after use (one-time purchase model)
      if (dpi >= 1200 && !localStorage.getItem(`subscription-${user?.email}`)) {
        localStorage.removeItem('locket-premium-access');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please make sure you have created a layout first.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      format: 'png' as const,
      dpi: 600,
      label: '600DPI PNG',
      icon: FileImage,
      premium: false,
      description: 'High quality for home printing',
    },
    {
      format: 'pdf' as const,
      dpi: 600,
      label: '600DPI PDF',
      icon: FileText,
      premium: false,
      description: 'Perfect for professional printing',
    },
    {
      format: 'png' as const,
      dpi: 1200,
      label: '1200DPI PNG',
      icon: FileImage,
      premium: true,
      description: 'Ultra-high resolution',
      price: '$4.99'
    },
    {
      format: 'pdf' as const,
      dpi: 1200,
      label: '1200DPI PDF',
      icon: FileText,
      premium: true,
      description: 'Professional print quality',
      price: '$4.99'
    },
  ];

  const hasSubscription = user && localStorage.getItem(`subscription-${user.email}`);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-4"></div>
          Export Options
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isPremiumLocked = option.premium && (!user || (!user.isPremium && !hasSubscription)) && localStorage.getItem('locket-premium-access') !== 'true';
            
            return (
              <button
                key={`${option.format}-${option.dpi}`}
                onClick={() => handleExport(option.format, option.dpi)}
                disabled={isExporting}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isPremiumLocked
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {option.premium && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-1 rounded-full">
                      <Crown className="h-4 w-4" />
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isPremiumLocked 
                      ? 'bg-amber-100 text-amber-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{option.label}</h3>
                      {option.premium && (
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {option.price}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    
                    {isPremiumLocked && (
                      <div className="flex items-center space-x-1 mt-2">
                        <CreditCard className="h-3 w-3 text-amber-600" />
                        <p className="text-xs text-amber-600 font-medium">
                          One-time purchase via PayPal
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Download className={`h-5 w-5 ${
                    isPremiumLocked ? 'text-amber-400' : 'text-gray-400'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Physical Order Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-green-600" />
            Physical Prints
          </h3>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Professional Photo Prints</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Get your custom locket photos printed on high-quality photo paper and delivered to your door.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 mb-4">
                  <li>• 4" × 6" professional photo paper</li>
                  <li>• 35 custom-sized photos per print</li>
                  <li>• Delivered in 5-7 business days</li>
                  <li>• {user?.isPremium || hasSubscription ? '15% discount applied' : 'Premium members get 15% off'}</li>
                </ul>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-green-600">$7.99</div>
                <div className="text-xs text-gray-500">per print</div>
              </div>
            </div>
            
            <button
              onClick={onPhysicalOrder}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Package className="h-5 w-5" />
              <span>Order Physical Prints</span>
            </button>
          </div>
        </div>

        {/* Subscription CTA */}
        {!hasSubscription && (
          <div className="border-t pt-6 mt-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-2 rounded-lg">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Upgrade to Premium</h4>
                    <p className="text-sm text-gray-600">Unlimited downloads, discounts & more</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">$9.99</div>
                  <div className="text-xs text-gray-500">/month</div>
                </div>
              </div>
              
              <button
                onClick={onSubscribe}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Star className="h-4 w-4" />
                <span>View Plans</span>
              </button>
            </div>
          </div>
        )}

        {isExporting && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium">Preparing your export...</span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <h4 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h4>
          <p className="text-sm text-gray-700">
            For best results, use 600DPI for home printing and 1200DPI for professional printing services.
            PDF format is recommended for commercial printers.
          </p>
        </div>
      </div>

      {/* PayPal Payment Modal */}
      {showPayPalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Premium Export</h2>
              <button
                onClick={() => setShowPayPalModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Crown className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unlock High-Resolution Export
                </h3>
                <p className="text-gray-600 mb-4">
                  Get access to 1200DPI exports for professional print quality
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="text-2xl font-bold text-blue-600">$4.99</div>
                  <div className="text-sm text-blue-500">One-time purchase</div>
                </div>
              </div>

              {!paypalLoaded ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PayPal...</p>
                </div>
              ) : (
                <div id="paypal-button-container" className="mb-4"></div>
              )}
              
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Secure payment powered by PayPal
                </p>
                <button
                  onClick={onSubscribe}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Or subscribe for unlimited access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
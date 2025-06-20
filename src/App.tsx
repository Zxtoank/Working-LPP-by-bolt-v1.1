import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { CropEditor } from './components/CropEditor';
import { LayoutGenerator } from './components/LayoutGenerator';
import { ExportPanel } from './components/ExportPanel';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { PhysicalOrderModal } from './components/PhysicalOrderModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { useAuth } from './hooks/useAuth';
import { useImageEditor } from './hooks/useImageEditor';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showPhysicalOrder, setShowPhysicalOrder] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const { user, login, logout, signup } = useAuth();
  const imageEditor = useImageEditor();

  const handlePhysicalOrder = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!imageEditor.croppedImage) {
      alert('Please create a layout first by uploading and editing an image.');
      return;
    }
    
    setShowPhysicalOrder(true);
  };

  const getLayoutImage = (): string => {
    const layoutCanvas = document.querySelector('#layoutCanvas') as HTMLCanvasElement;
    return layoutCanvas ? layoutCanvas.toDataURL() : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        user={user}
        onLogin={() => setShowAuthModal(true)}
        onLogout={logout}
        onProfile={() => setShowUserProfile(true)}
      />
      
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Editor */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-4"></div>
                Create Your Photos
              </h2>
              
              {!imageEditor.image ? (
                <ImageUpload onImageUpload={imageEditor.setImage} />
              ) : (
                <CropEditor {...imageEditor} />
              )}
            </div>
          </div>

          {/* Right Column - Layout & Export */}
          <div className="space-y-6">
            {imageEditor.croppedImage && (
              <>
                <LayoutGenerator 
                  croppedImage={imageEditor.croppedImage}
                  cropShape={imageEditor.cropShape}
                />
                <ExportPanel 
                  user={user}
                  onAuthRequired={() => setShowAuthModal(true)}
                  onPhysicalOrder={handlePhysicalOrder}
                  onSubscribe={() => setShowSubscription(true)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={login}
          onSignup={signup}
        />
      )}

      {showUserProfile && (
        <UserProfile
          user={user}
          onClose={() => setShowUserProfile(false)}
        />
      )}

      {showPhysicalOrder && (
        <PhysicalOrderModal
          onClose={() => setShowPhysicalOrder(false)}
          user={user}
          layoutImage={getLayoutImage()}
        />
      )}

      {showSubscription && (
        <SubscriptionModal
          onClose={() => setShowSubscription(false)}
          user={user}
        />
      )}
    </div>
  );
}

export default App;
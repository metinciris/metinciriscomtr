import React, { ReactNode, useState } from 'react';
import { Microscope, RotateCcw, Settings2 } from 'lucide-react';
import { AutoStainMenu } from './AutoStainMenu';
import { BiopsyLocation } from '../../types/endoskopi';

interface LayoutProps {
  children: ReactNode;
  onReset: () => void;
  stainConfig: any;
  onStainConfigChange: (config: any) => void;
}

export const EndoskopiLayout: React.FC<LayoutProps> = ({
  children,
  onReset,
  stainConfig,
  onStainConfigChange
}) => {
  const [isAutoStainMenuOpen, setIsAutoStainMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Microscope className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-semibold text-gray-900">Patoloji Endoskopi Rapor Oluşturucu</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoStainMenuOpen(!isAutoStainMenuOpen)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
              >
                <Settings2 className="h-4 w-4" />
                OtoBoya
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-2 py-6 sm:px-4 lg:px-6">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Patoloji Rapor Sistemi
        </div>
      </footer>
      <AutoStainMenu
        isOpen={isAutoStainMenuOpen}
        onClose={() => setIsAutoStainMenuOpen(false)}
        stainConfig={stainConfig}
        onStainConfigChange={onStainConfigChange}
      />
    </div>
  );
};

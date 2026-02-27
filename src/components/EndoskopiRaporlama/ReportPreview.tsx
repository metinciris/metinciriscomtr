import React from 'react';
import { Biopsy } from '../../types/endoskopi';
import { Copy } from 'lucide-react';
import { generateFullEndoskopiReport } from '../../core/calculators/endoscopy';

interface ReportPreviewProps {
  biopsies: Biopsy[];
  activeField?: string;
  stainConfig: any;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  biopsies,
  activeField,
  stainConfig
}) => {
  const reportText = generateFullEndoskopiReport(biopsies, stainConfig, activeField);

  const copyToClipboard = () => {
    // Remove highlight tags before copying
    const cleanText = reportText.replace(/<\/?mark>/g, '');
    navigator.clipboard.writeText(cleanText);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-medium text-gray-900">Rapor Çıktısı</h3>
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Copy size={16} className="mr-2" />
          Kopyala
        </button>
      </div>
      <div
        className="p-4 whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 min-h-[300px] max-h-[600px] overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: reportText }}
      />
    </div>
  );
};

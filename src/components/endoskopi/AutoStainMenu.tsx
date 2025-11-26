import React, { useState } from 'react';
import { BiopsyLocation } from '../../types';
import { Settings2, Plus, Trash2, X } from 'lucide-react';

interface StainConfig {
    name: string;
    description: string;
}

interface LocationStains {
    [key: string]: StainConfig[];
}

const defaultStains: LocationStains = {
    [BiopsyLocation.Ozefagus]: [
        { name: 'PAS+AB', description: 'Özefagus Goblet hücrelerini değerlendirmek için' }
    ],
    [BiopsyLocation.Mide]: [
        { name: 'PAS+AB', description: 'mide mukozasında intestinal metaplaziyi değerlendirmek için' },
        { name: 'Warthin Starry', description: 'Helikobakter Pilori değerlendirmek için' }
    ],
    [BiopsyLocation.Duodenum]: [
        { name: 'PAS', description: 'Duedonum mukozasında villus ve silyalı epiteli değerlendirmek için' }
    ],
    [BiopsyLocation.Ileum]: [],
    [BiopsyLocation.Kolon]: []
};

const predefinedStains = ['PAS', 'PAS+AB', 'Warthin Starry', 'Toluidin Blue'];

interface AutoStainMenuProps {
    isOpen: boolean;
    onClose: () => void;
    stainConfig: LocationStains;
    onStainConfigChange: (config: LocationStains) => void;
}

export const AutoStainMenu: React.FC<AutoStainMenuProps> = ({
    isOpen,
    onClose,
    stainConfig,
    onStainConfigChange
}) => {
    const [newStainName, setNewStainName] = useState('');
    const [newStainDescription, setNewStainDescription] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<BiopsyLocation | null>(null);

    const handleAddStain = (location: BiopsyLocation) => {
        if (!newStainName.trim() || !newStainDescription.trim()) return;

        const updatedConfig = {
            ...stainConfig,
            [location]: [
                ...(stainConfig[location] || []),
                { name: newStainName.trim(), description: newStainDescription.trim() }
            ]
        };

        onStainConfigChange(updatedConfig);
        setNewStainName('');
        setNewStainDescription('');
        setSelectedLocation(null);
    };

    const handleRemoveStain = (location: BiopsyLocation, index: number) => {
        const updatedConfig = {
            ...stainConfig,
            [location]: stainConfig[location].filter((_, i) => i !== index)
        };
        onStainConfigChange(updatedConfig);
    };

    const handlePredefinedStainClick = (stainName: string) => {
        setNewStainName(stainName);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Otomatik Boya Ayarları</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-8">
                    {Object.values(BiopsyLocation).map((location) => (
                        <div key={location} className="border-b pb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{location}</h3>

                            <div className="space-y-4">
                                {stainConfig[location]?.map((stain, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-md">{stain.name}</div>
                                            <div className="bg-gray-50 p-3 rounded-md">{stain.description}</div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStain(location, index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}

                                {selectedLocation === location ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={newStainName}
                                                onChange={(e) => setNewStainName(e.target.value)}
                                                placeholder="Boya adı"
                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                value={newStainDescription}
                                                onChange={(e) => setNewStainDescription(e.target.value)}
                                                placeholder="Boya açıklaması"
                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleAddStain(location)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {predefinedStains.map((stain) => (
                                                <button
                                                    key={stain}
                                                    onClick={() => handlePredefinedStainClick(stain)}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                >
                                                    {stain}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedLocation(location)}
                                        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        <span>Yeni Boya Ekle</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

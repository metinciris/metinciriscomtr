import React, { useState } from 'react';
import { SeverityToggle } from './SeverityToggle';
import { CustomNoteManager } from './CustomNoteManager';
import { Biopsy, BiopsyLocation, DiagnosisOptions, LocationOptions, DuodenumDiagnosisMappings, PredefinedNotes } from '../../types';
import { X, ArrowUpDown, Plus, Trash2 } from 'lucide-react';

interface BiopsyFormProps {
    biopsy: Biopsy;
    index: number;
    onUpdate: (biopsy: Biopsy) => void;
    onRemove: (id: string) => void;
    canRemove: boolean;
    activeField?: string;
    onFieldFocus: (field: string) => void;
    existingLocations: string[];
}

export const BiopsyForm: React.FC<BiopsyFormProps> = ({
    biopsy,
    index,
    onUpdate,
    onRemove,
    canRemove,
    activeField,
    onFieldFocus,
    existingLocations,
}) => {
    const [newSubLocation, setNewSubLocation] = useState('');
    const [customDiagnosis, setCustomDiagnosis] = useState('');
    const [newStain, setNewStain] = useState('');

    const handlePredefinedNoteClick = (note: string) => {
        onFieldFocus(`${biopsy.id}-predefinedNote`);
        const notes = biopsy.customNotes || [];
        const noteIndex = notes.indexOf(note);

        if (noteIndex === -1) {
            onUpdate({
                ...biopsy,
                customNotes: [...notes, note]
            });
        } else {
            const updatedNotes = [...notes];
            updatedNotes.splice(noteIndex, 1);
            onUpdate({
                ...biopsy,
                customNotes: updatedNotes
            });
        }
    };

    const handleLocationClick = (loc: string) => {
        onFieldFocus(`${biopsy.id}-location`);

        // Handle all locations like radio buttons
        onUpdate({
            ...biopsy,
            subLocation: loc,
        });

        // Update diagnosis based on location if it's a Duodenum/Bulbus biopsy
        if (biopsy.location === BiopsyLocation.Duodenum) {
            const mapping = DuodenumDiagnosisMappings.find(m =>
                m.location === loc &&
                m.diagnosis === biopsy.customDiagnosis
            );

            if (mapping) {
                onUpdate({
                    ...biopsy,
                    subLocation: loc,
                    customDiagnosis: mapping.reportDiagnosis,
                    customNotes: mapping.notes
                });
            }
        }
    };

    const handleSubLocationClick = (subLoc: string) => {
        onFieldFocus(`${biopsy.id}-sublocation`);
        const currentLocations = biopsy.subLocation.split(', ');
        let newLocations: string[];

        if (currentLocations.includes(subLoc)) {
            newLocations = currentLocations.filter(loc => loc !== subLoc);
        } else {
            newLocations = [...currentLocations, subLoc];
        }

        onUpdate({
            ...biopsy,
            subLocation: newLocations.join(', ').replace(/^, /, ''),
        });
    };

    const handleAddCustomLocation = () => {
        if (newSubLocation.trim()) {
            onFieldFocus(`${biopsy.id}-customLocation`);
            onUpdate({
                ...biopsy,
                subLocation: newSubLocation.trim(),
            });
            setNewSubLocation('');
        }
    };

    const handleAddCustomDiagnosis = () => {
        if (customDiagnosis.trim()) {
            onFieldFocus(`${biopsy.id}-customDiagnosis`);
            onUpdate({
                ...biopsy,
                customDiagnosis: customDiagnosis.trim(),
            });
            setCustomDiagnosis('');
        }
    };

    const handleAddStain = () => {
        if (newStain.trim()) {
            onFieldFocus(`${biopsy.id}-customStain`);
            onUpdate({
                ...biopsy,
                customStains: [...(biopsy.customStains || []), newStain.trim()],
            });
            setNewStain('');
        }
    };

    const handleRemoveStain = (index: number) => {
        const updatedStains = [...(biopsy.customStains || [])];
        updatedStains.splice(index, 1);
        onUpdate({
            ...biopsy,
            customStains: updatedStains,
        });
    };

    const handleDiagnosisClick = (diagnosis: string) => {
        onFieldFocus(`${biopsy.id}-diagnosis`);

        // For Duodenum/Bulbus, handle special cases
        if (biopsy.location === BiopsyLocation.Duodenum) {
            const mapping = DuodenumDiagnosisMappings.find(m =>
                m.location === biopsy.subLocation &&
                m.diagnosis === diagnosis
            );

            if (mapping) {
                onUpdate({
                    ...biopsy,
                    customDiagnosis: mapping.reportDiagnosis,
                    customNotes: mapping.notes
                });
                return;
            }
        }

        onUpdate({
            ...biopsy,
            customDiagnosis: biopsy.customDiagnosis === diagnosis ? undefined : diagnosis,
        });
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 transition-all duration-300 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                    Biyopsi #{index + 1} - {biopsy.location}
                </h3>
                {canRemove && (
                    <button
                        onClick={() => onRemove(biopsy.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lokasyon
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {LocationOptions[biopsy.location].locations.map(loc => {
                            const isSelected = biopsy.subLocation === loc;

                            return (
                                <button
                                    key={loc}
                                    onClick={() => handleLocationClick(loc)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isSelected
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {loc}
                                </button>
                            );
                        })}
                    </div>

                    {biopsy.location !== BiopsyLocation.Duodenum && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Alt Lokasyon
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {LocationOptions[biopsy.location].subLocations.map(subLoc => {
                                    const isSelected = biopsy.subLocation.includes(subLoc);
                                    return (
                                        <button
                                            key={subLoc}
                                            onClick={() => handleSubLocationClick(subLoc)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isSelected
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {subLoc}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <input
                            type="text"
                            value={newSubLocation}
                            onChange={(e) => setNewSubLocation(e.target.value)}
                            onFocus={() => onFieldFocus(`${biopsy.id}-customLocation`)}
                            placeholder="Özel lokasyon..."
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleAddCustomLocation}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {biopsy.location === BiopsyLocation.Mide && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    İnflamasyon
                                </label>
                                <SeverityToggle
                                    value={biopsy.findings.inflammation}
                                    onChange={(value) => {
                                        onFieldFocus(`${biopsy.id}-finding-inflammation`);
                                        onUpdate({
                                            ...biopsy,
                                            findings: { ...biopsy.findings, inflammation: value }
                                        });
                                    }}
                                    isActive={activeField === `${biopsy.id}-finding-inflammation`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Aktivasyon
                                </label>
                                <SeverityToggle
                                    value={biopsy.findings.activation}
                                    onChange={(value) => {
                                        onFieldFocus(`${biopsy.id}-finding-activation`);
                                        onUpdate({
                                            ...biopsy,
                                            findings: { ...biopsy.findings, activation: value }
                                        });
                                    }}
                                    isActive={activeField === `${biopsy.id}-finding-activation`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    HP
                                </label>
                                <SeverityToggle
                                    value={biopsy.findings.hp}
                                    onChange={(value) => {
                                        onFieldFocus(`${biopsy.id}-finding-hp`);
                                        onUpdate({
                                            ...biopsy,
                                            findings: { ...biopsy.findings, hp: value }
                                        });
                                    }}
                                    isActive={activeField === `${biopsy.id}-finding-hp`}
                                    colorScheme="brown"
                                    showNotDone={true}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Atrofi
                                </label>
                                <SeverityToggle
                                    value={biopsy.findings.atrophy}
                                    onChange={(value) => {
                                        onFieldFocus(`${biopsy.id}-finding-atrophy`);
                                        onUpdate({
                                            ...biopsy,
                                            findings: { ...biopsy.findings, atrophy: value }
                                        });
                                    }}
                                    isActive={activeField === `${biopsy.id}-finding-atrophy`}
                                    colorScheme="purple"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    İntestinal Metaplazi
                                </label>
                                <SeverityToggle
                                    value={biopsy.findings.intestinalMetaplasia}
                                    onChange={(value) => {
                                        onFieldFocus(`${biopsy.id}-finding-intestinalMetaplasia`);
                                        onUpdate({
                                            ...biopsy,
                                            findings: { ...biopsy.findings, intestinalMetaplasia: value }
                                        });
                                    }}
                                    isActive={activeField === `${biopsy.id}-finding-intestinalMetaplasia`}
                                    showNotDone={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanı
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {DiagnosisOptions[biopsy.location].map(diagnosis => (
                            <button
                                key={diagnosis}
                                onClick={() => handleDiagnosisClick(diagnosis)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${biopsy.customDiagnosis === diagnosis
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {diagnosis}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Özel Tanı</h4>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customDiagnosis}
                            onChange={(e) => setCustomDiagnosis(e.target.value)}
                            onFocus={() => onFieldFocus(`${biopsy.id}-customDiagnosis`)}
                            placeholder="Özel tanı ekle..."
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleAddCustomDiagnosis}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Hazır Notlar</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {PredefinedNotes[biopsy.location].map((note) => (
                            <button
                                key={note}
                                onClick={() => handlePredefinedNoteClick(note)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${biopsy.customNotes?.includes(note)
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {note}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Özel Notlar</h4>
                        <ArrowUpDown size={14} className="ml-2 text-gray-400" />
                    </div>
                    <CustomNoteManager
                        notes={biopsy.customNotes}
                        onChange={(notes) => {
                            onFieldFocus(`${biopsy.id}-customNotes`);
                            onUpdate({ ...biopsy, customNotes: notes });
                        }}
                        isActive={activeField === `${biopsy.id}-customNotes`}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        BBA'da eozinofil sayısı
                    </label>
                    <input
                        type="text"
                        value={biopsy.eosinophilCount || ''}
                        onChange={(e) => {
                            onFieldFocus(`${biopsy.id}-eosinophilCount`);
                            onUpdate({ ...biopsy, eosinophilCount: e.target.value });
                        }}
                        placeholder="Eozinofil sayısı..."
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Özel Boyalar</h4>
                    </div>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStain}
                                onChange={(e) => setNewStain(e.target.value)}
                                onFocus={() => onFieldFocus(`${biopsy.id}-customStain`)}
                                placeholder="Boya ismi..."
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleAddStain}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        {biopsy.customStains && biopsy.customStains.length > 0 && (
                            <div className="bg-gray-50 rounded-md border border-gray-200">
                                {biopsy.customStains.map((stain, stainIndex) => (
                                    <div
                                        key={stainIndex}
                                        className="flex items-center justify-between p-2 hover:bg-gray-100"
                                    >
                                        <span className="text-sm text-gray-700">{stain}</span>
                                        <button
                                            onClick={() => handleRemoveStain(stainIndex)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

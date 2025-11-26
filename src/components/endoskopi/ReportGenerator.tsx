import React, { useRef, useState } from 'react';
import { BiopsyForm } from './BiopsyForm';
import { ReportPreview } from './ReportPreview';
import { Biopsy, BiopsyLocation, DuodenumDiagnosisMappings } from '../../types';
import { RotateCcw } from 'lucide-react';

interface ReportGeneratorProps {
    biopsies: Biopsy[];
    setBiopsies: React.Dispatch<React.SetStateAction<Biopsy[]>>;
    stainConfig: any;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
    biopsies,
    setBiopsies,
    stainConfig
}) => {
    const biopsyRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [activeField, setActiveField] = useState<string>();

    const getExistingLocations = () => {
        return biopsies.map(b => b.subLocation.split(', ')[0]);
    };

    const addBiopsy = (location: BiopsyLocation) => {
        const newBiopsy: Biopsy = {
            id: Date.now().toString(),
            location,
            subLocation: location === BiopsyLocation.Ileum ? 'Terminal ileum' :
                location === BiopsyLocation.Ozefagus ? 'Özofagus' :
                    location === BiopsyLocation.Duodenum ? 'Duodenum' : '',
            sequence: biopsies.length + 1,
            findings: {
                inflammation: '-',
                activation: '-',
                atrophy: '-',
                hp: '-',
                intestinalMetaplasia: '-',
            },
            additionalFeatures: [],
            customNotes: [],
            normalAppearance: false,
            edematous: false,
            fundicGlandPolyp: false,
            additionalFeatureText: '',
            eosinophilCount: '',
            customDiagnosis: location === BiopsyLocation.Mide ? 'Normal görünümlü mide mukozası' :
                location === BiopsyLocation.Ileum ? 'Normal görünümlü ileum mukozası' :
                    location === BiopsyLocation.Duodenum ? 'Normal görünümlü duedonum mukozası' : undefined,
            stains: location === BiopsyLocation.Ozefagus ? {
                pasAB: true
            } : location === BiopsyLocation.Mide ? {
                pas: true,
                warthinStarry: true
            } : location === BiopsyLocation.Duodenum ? {
                pas: true
            } : undefined,
            ...(location === BiopsyLocation.Mide && {
                stomachFeatures: {
                    foveolarHyperplasia: false,
                    lymphoidFollicle: false,
                    activeLymphoidFollicle: false,
                    superficialUlcer: false,
                    noDysplasia: false,
                    fundicGlandDilatation: false,
                }
            }),
            ...(location === BiopsyLocation.Duodenum && {
                duodenumFeatures: {
                    marsh0: true,
                    marsh1: false,
                    marsh3a: false,
                    marsh3b: false,
                    marsh3c: false,
                    noIntraepithelialLymphocytes: true,
                    hasIntraepithelialLymphocytes: false,
                    noVillusAtrophy: true,
                    mildVillusAtrophy: false,
                    severeVillusAtrophy: false,
                    completeVillusAtrophy: false,
                }
            }),
            ...(location === BiopsyLocation.Ozefagus && {
                esophagusFeatures: {
                    gobletCellMetaplasiaPresent: false,
                    gobletCellMetaplasiaAbsent: false,
                    hpNegative: false,
                    noDysplasia: false,
                    activeInflammation: false,
                    foveolarHyperplasia: false,
                    noEosinophils: false,
                    ulcerativeInflammation: false,
                    hyperplasticPolyp: false,
                    eosinophilsPresent: false,
                }
            })
        };

        setBiopsies(prev => [...prev, newBiopsy]);
        setActiveField(`${newBiopsy.id}-active`);

        setTimeout(() => {
            const element = biopsyRefs.current[newBiopsy.id];
            if (element) {
                const headerOffset = 180;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    const removeBiopsy = (id: string) => {
        setBiopsies(prev => prev.filter(biopsy => biopsy.id !== id));
        if (activeField?.startsWith(id)) {
            setActiveField(undefined);
        }
    };

    const updateBiopsy = (updatedBiopsy: Biopsy) => {
        setBiopsies(prev =>
            prev.map(biopsy => {
                if (biopsy.id === updatedBiopsy.id) {
                    if (biopsy.location === BiopsyLocation.Mide) {
                        const hasActivation = ['+', '++', '+++'].includes(updatedBiopsy.findings.activation);

                        if (!updatedBiopsy.customDiagnosis ||
                            updatedBiopsy.customDiagnosis === 'Normal görünümlü mide mukozası' ||
                            updatedBiopsy.customDiagnosis === 'Kronik gastrit' ||
                            updatedBiopsy.customDiagnosis === 'Aktivasyonlu kronik gastrit') {
                            if (hasActivation) {
                                updatedBiopsy.customDiagnosis = 'Aktivasyonlu kronik gastrit';
                            } else if (['+', '++', '+++'].includes(updatedBiopsy.findings.inflammation)) {
                                updatedBiopsy.customDiagnosis = 'Kronik gastrit';
                            } else {
                                updatedBiopsy.customDiagnosis = 'Normal görünümlü mide mukozası';
                            }
                        }
                    } else if (biopsy.location === BiopsyLocation.Duodenum) {
                        const mapping = DuodenumDiagnosisMappings.find(m =>
                            m.location === updatedBiopsy.subLocation &&
                            m.diagnosis === updatedBiopsy.customDiagnosis
                        );

                        if (mapping) {
                            updatedBiopsy.customDiagnosis = mapping.reportDiagnosis;
                        }
                    }
                    return updatedBiopsy;
                }
                return biopsy;
            })
        );
    };

    const scrollToBiopsy = (id: string) => {
        const element = biopsyRefs.current[id];
        if (element) {
            const headerOffset = 180;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-4 sticky top-0 z-10 border border-gray-200">
                <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-5 gap-4">
                        {Object.values(BiopsyLocation).map(location => (
                            <button
                                key={location}
                                onClick={() => addBiopsy(location)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {location}
                            </button>
                        ))}
                    </div>
                    {biopsies.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-2">
                            {biopsies.map((biopsy, index) => (
                                <button
                                    key={biopsy.id}
                                    onClick={() => {
                                        scrollToBiopsy(biopsy.id);
                                        setActiveField(`${biopsy.id}-active`);
                                    }}
                                    className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeField?.startsWith(biopsy.id)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {index + 1} - {biopsy.subLocation || biopsy.location}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    {biopsies.map((biopsy, index) => (
                        <div
                            key={biopsy.id}
                            ref={el => (biopsyRefs.current[biopsy.id] = el)}
                            className="scroll-mt-40 mb-6"
                        >
                            <BiopsyForm
                                biopsy={biopsy}
                                index={index}
                                onUpdate={updateBiopsy}
                                onRemove={removeBiopsy}
                                canRemove={true}
                                activeField={activeField}
                                onFieldFocus={setActiveField}
                                existingLocations={getExistingLocations()}
                            />
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-40 space-y-4">
                        <ReportPreview
                            biopsies={biopsies}
                            activeField={activeField}
                            stainConfig={stainConfig}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

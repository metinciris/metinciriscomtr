import React from 'react';
import { Biopsy, BiopsyLocation } from '../../types';
import { Copy } from 'lucide-react';

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
    const generateReportText = (): string => {
        // Create a map to track location counts
        const locationCounts: { [key: string]: number } = {};

        // First pass to count locations
        biopsies.forEach(biopsy => {
            const locationKey = `${biopsy.location}-${biopsy.subLocation.split(',')[0].trim()}`;
            locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
        });

        // Reset counts for the actual report generation
        const currentCounts: { [key: string]: number } = {};

        let report = biopsies
            .map((biopsy, index) => {
                // Get the main location without additional sublocations
                const mainLocation = biopsy.subLocation.split(',')[0].trim();
                const locationKey = `${biopsy.location}-${mainLocation}`;

                // Increment current count for this location
                currentCounts[locationKey] = (currentCounts[locationKey] || 0) + 1;

                return generateBiopsyReport(
                    biopsy,
                    index,
                    currentCounts[locationKey],
                    locationCounts[locationKey]
                );
            })
            .filter(Boolean)
            .join('\n\n');

        // Check if there are any stains needed
        const hasConfiguredStains = Object.values(stainConfig).some(stains => (stains as any[]).length > 0);
        const stomachBiopsiesNeedingHP = biopsies.filter(biopsy =>
            biopsy.location === BiopsyLocation.Mide &&
            biopsy.findings.hp !== 'Yapılmadı'
        );
        const stomachBiopsiesNeedingIM = biopsies.filter(biopsy =>
            biopsy.location === BiopsyLocation.Mide &&
            biopsy.findings.intestinalMetaplasia !== 'Yapılmadı'
        );

        if (hasConfiguredStains || stomachBiopsiesNeedingHP.length > 0 || stomachBiopsiesNeedingIM.length > 0) {
            // Group biopsies by location
            const biopsyGroups = biopsies.reduce((acc, biopsy) => {
                if (!acc[biopsy.location]) {
                    acc[biopsy.location] = [];
                }
                acc[biopsy.location].push(biopsy);
                return acc;
            }, {} as Record<string, Biopsy[]>);

            // Track if we've added any stains
            let stainsAdded = false;
            const stainLines: string[] = [];

            // Add stains for each location (excluding stomach HP/IM which is handled separately)
            Object.entries(biopsyGroups).forEach(([location, locationBiopsies]) => {
                const locationConfig = stainConfig[location];
                if (locationConfig && locationConfig.length > 0) {
                    // Filter out stomach HP and IM stains as they're handled separately
                    const filteredStains = locationConfig.filter((stain: any) => {
                        if (location === BiopsyLocation.Mide) {
                            // Exclude Warthin Starry if it's for HP evaluation and HP is not done
                            if (stain.name === 'Warthin Starry' && stain.description.includes('Helikobakter Pilori')) {
                                return stomachBiopsiesNeedingHP.length > 0;
                            }
                            // Exclude PAS+AB if it's for IM evaluation and IM is not done
                            if (stain.name === 'PAS+AB' && stain.description.includes('intestinal metaplazi')) {
                                return stomachBiopsiesNeedingIM.length > 0;
                            }
                        }
                        return true;
                    });

                    filteredStains.forEach((stain: any) => {
                        // Get all biopsy numbers for this location
                        let relevantBiopsies = locationBiopsies;

                        // For stomach stains, filter based on what's actually needed
                        if (location === BiopsyLocation.Mide) {
                            if (stain.name === 'Warthin Starry' && stain.description.includes('Helikobakter Pilori')) {
                                relevantBiopsies = stomachBiopsiesNeedingHP;
                            } else if (stain.name === 'PAS+AB' && stain.description.includes('intestinal metaplazi')) {
                                relevantBiopsies = stomachBiopsiesNeedingIM;
                            }
                        }

                        const biopsyNumbers = relevantBiopsies.map((b) =>
                            biopsies.findIndex(bx => bx.id === b.id) + 1
                        ).sort((a, b) => a - b);

                        if (biopsyNumbers.length > 0) {
                            stainLines.push(`${biopsyNumbers.join(',')} nolu örnekte ${stain.description} ${stain.name}`);
                        }
                    });
                }
            });

            // Add custom stains if any exist
            const customStains = biopsies.reduce((acc, biopsy, index) => {
                if (biopsy.customStains && biopsy.customStains.length > 0) {
                    biopsy.customStains.forEach(stain => {
                        acc.push(`${index + 1}- no ${stain}`);
                    });
                }
                return acc;
            }, [] as string[]);

            if (customStains.length > 0) {
                stainLines.push(...customStains);
            }

            // Only add the histochemical section if there are actual stains to report
            if (stainLines.length > 0) {
                report += '\n\nHistokimyasal yöntemle:\n';
                report += stainLines.join('\n');
                report += ' boyası yapılmıştır.';
            }
        }

        return report;
    };

    const generateBiopsyReport = (biopsy: Biopsy, index: number, currentCount: number, totalCount: number): string => {
        const lines: string[] = [];
        const biopsyId = biopsy.id;

        // Helper function to check if a line should be highlighted
        const shouldHighlight = (fieldId: string) => {
            if (activeField === `${biopsyId}-active`) return true;
            return activeField === `${biopsyId}-${fieldId}`;
        };

        // Format the location string
        let formattedLocation = '';
        const mainLocation = biopsy.subLocation.split(',')[0].trim();
        const additionalLocations = biopsy.subLocation.split(',').slice(1).map(l => l.trim()).filter(Boolean);

        if (biopsy.location === BiopsyLocation.Mide) {
            formattedLocation = `Mide, ${mainLocation}`;
        } else if (biopsy.location === BiopsyLocation.Duodenum) {
            formattedLocation = mainLocation === 'Bulbus' ? 'Bulbus' : mainLocation;
        } else {
            formattedLocation = mainLocation;
        }

        // Add numbering for multiple biopsies at the same location
        if (totalCount > 1) {
            formattedLocation = `${formattedLocation} (${currentCount}/${totalCount})`;
        }

        // Add additional locations if they exist
        if (additionalLocations.length > 0) {
            formattedLocation = `${formattedLocation}, ${additionalLocations.join(', ')}`;
        }

        // Title line with diagnosis
        const titleLine = `${index + 1}- ${formattedLocation}, endoskopik biyopsi: ${biopsy.customDiagnosis || ''}`;
        lines.push(shouldHighlight('subLocation') || shouldHighlight('diagnosis') ? `<mark>${titleLine}</mark>` : titleLine);

        // Add diagnosis and features based on location
        if (biopsy.location === BiopsyLocation.Ozefagus) {
            if (biopsy.esophagusFeatures) {
                const features = biopsy.esophagusFeatures;

                if (features.gobletCellMetaplasiaPresent && !biopsy.customDiagnosis?.includes('Goblet hücre metaplazisi vardır')) {
                    const line = '     - Goblet hücre metaplazisi vardır';
                    lines.push(shouldHighlight('esophagusFeature-gobletCellMetaplasiaPresent') ? `<mark>${line}</mark>` : line);
                }
                if (features.gobletCellMetaplasiaAbsent && !biopsy.customDiagnosis?.includes('Goblet hücre metaplazisi yoktur')) {
                    const line = '     - Goblet hücre metaplazisi yoktur';
                    lines.push(shouldHighlight('esophagusFeature-gobletCellMetaplasiaAbsent') ? `<mark>${line}</mark>` : line);
                }
                if (features.hpNegative && !biopsy.customDiagnosis?.includes('HP: (-)')) {
                    const line = '     - HP: (-)';
                    lines.push(shouldHighlight('esophagusFeature-hpNegative') ? `<mark>${line}</mark>` : line);
                }
                if (features.noDysplasia && !biopsy.customDiagnosis?.includes('Displazi yoktur')) {
                    const line = '     - Displazi yoktur';
                    lines.push(shouldHighlight('esophagusFeature-noDysplasia') ? `<mark>${line}</mark>` : line);
                }
                if (features.activeInflammation && !biopsy.customDiagnosis?.includes('Mukozada aktif inflamasyon vardır')) {
                    const line = '     - Mukozada aktif inflamasyon vardır';
                    lines.push(shouldHighlight('esophagusFeature-activeInflammation') ? `<mark>${line}</mark>` : line);
                }
                if (features.foveolarHyperplasia && !biopsy.customDiagnosis?.includes('Foveolar hiperplazi vardır')) {
                    const line = '     - Foveolar hiperplazi vardır';
                    lines.push(shouldHighlight('esophagusFeature-foveolarHyperplasia') ? `<mark>${line}</mark>` : line);
                }
                if (features.noEosinophils && !biopsy.customDiagnosis?.includes('Eozinofil yoktur')) {
                    const line = '     - Eozinofil yoktur';
                    lines.push(shouldHighlight('esophagusFeature-noEosinophils') ? `<mark>${line}</mark>` : line);
                }
                if (features.ulcerativeInflammation && !biopsy.customDiagnosis?.includes('Ülseröz inflamasyon izlenmiştir')) {
                    const line = '     - Ülseröz inflamasyon izlenmiştir';
                    lines.push(shouldHighlight('esophagusFeature-ulcerativeInflammation') ? `<mark>${line}</mark>` : line);
                }
                if (features.hyperplasticPolyp && !biopsy.customDiagnosis?.includes('Hiperplastik polip')) {
                    const line = '     - Hiperplastik polip';
                    lines.push(shouldHighlight('esophagusFeature-hyperplasticPolyp') ? `<mark>${line}</mark>` : line);
                }
            }
        } else if (biopsy.location === BiopsyLocation.Mide) {
            const hasActiveFindings = ['+', '++', '+++'].includes(biopsy.findings.inflammation) ||
                ['+', '++', '+++'].includes(biopsy.findings.activation);

            if (hasActiveFindings) {
                Object.entries(biopsy.findings).forEach(([key, value]) => {
                    const label = {
                        inflammation: 'İnflamasyon',
                        activation: 'Aktivasyon',
                        atrophy: 'Atrofi',
                        hp: 'HP',
                        intestinalMetaplasia: 'İntestinal metaplazi'
                    }[key];

                    if (label && key !== 'eosinophilCount' && value !== 'Yapılmadı') {
                        const line = `     - ${label}: (${value})`;
                        lines.push(shouldHighlight(`finding-${key}`) ? `<mark>${line}</mark>` : line);
                    }
                });
            } else {
                // Only show HP if it's not "Yapılmadı"
                if (biopsy.findings.hp !== 'Yapılmadı') {
                    const hpLine = `     - HP: (${biopsy.findings.hp})`;
                    lines.push(shouldHighlight('finding-hp') ? `<mark>${hpLine}</mark>` : hpLine);
                }

                // Only show IM if it's not "Yapılmadı"
                if (biopsy.findings.intestinalMetaplasia !== 'Yapılmadı') {
                    const imLine = `     - İntestinal metaplazi: (${biopsy.findings.intestinalMetaplasia})`;
                    lines.push(shouldHighlight('finding-intestinalMetaplasia') ? `<mark>${imLine}</mark>` : imLine);
                }
            }

            if (biopsy.stomachFeatures) {
                Object.entries(biopsy.stomachFeatures).forEach(([key, value]) => {
                    if (value && key !== 'synaptophysin') {
                        const line = `     - ${getStomachFeatureText(key)}`;
                        lines.push(shouldHighlight(`stomachFeature-${key}`) ? `<mark>${line}</mark>` : line);
                    }
                });

                if (biopsy.stomachFeatures.synaptophysin) {
                    let synaptophysinLine = '';
                    switch (biopsy.stomachFeatures.synaptophysin) {
                        case 'none':
                            synaptophysinLine = '     - Nöroendokrin hücre hiperplazisi yoktur (Sinaptofizin ile)';
                            break;
                        case 'linear':
                            synaptophysinLine = '     - Lineer nöroendokrin hücre hiperplazisi (Sinaptofizin ile)';
                            break;
                        case 'micronodular':
                            synaptophysinLine = '     - Mikronodüler nöroendokrin hücre hiperplazisi (Sinaptofizin ile)';
                            break;
                    }
                    if (synaptophysinLine) {
                        lines.push(shouldHighlight('synaptophysin') ? `<mark>${synaptophysinLine}</mark>` : synaptophysinLine);
                    }
                }
            }
        }

        // Custom notes
        biopsy.customNotes.forEach(note => {
            const line = `     - ${note}${note.endsWith('.') ? '' : '.'}`;
            lines.push(shouldHighlight('customNotes') ? `<mark>${line}</mark>` : line);
        });

        // Add eosinophil count if present
        if (biopsy.eosinophilCount) {
            const eosinophilLine = `     - BBA'da eozinofil sayısı: ${biopsy.eosinophilCount}`;
            lines.push(shouldHighlight('eosinophilCount') ? `<mark>${eosinophilLine}</mark>` : eosinophilLine);
        }

        return lines.join('\n');
    };

    const getStomachFeatureText = (key: string): string => {
        switch (key) {
            case 'foveolarHyperplasia': return 'Foveolar hiperplazi vardır';
            case 'lymphoidFollicle': return 'Lenfoid folikül vardır';
            case 'activeLymphoidFollicle': return 'Germinal merkezi aktiv lenfoid folikül vardır';
            case 'superficialUlcer': return 'Yüzeyel ülser vardır';
            case 'noDysplasia': return 'Displazi yoktur';
            case 'fundicGlandDilatation': return 'Fundik glandlarda dilatasyon vardır';
            default: return '';
        }
    };

    const reportText = generateReportText();

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

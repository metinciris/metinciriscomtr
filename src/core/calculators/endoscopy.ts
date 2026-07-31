import { Biopsy, BiopsyLocation } from '../../types/endoskopi';

export function getStomachFeatureText(key: string): string {
    switch (key) {
        case 'foveolarHyperplasia': return 'Foveolar hiperplazi vardır';
        case 'lymphoidFollicle': return 'Lenfoid folikül vardır';
        case 'activeLymphoidFollicle': return 'Germinal merkezi aktiv lenfoid folikül vardır';
        case 'superficialUlcer': return 'Yüzeyel ülser vardır';
        case 'noDysplasia': return 'Displazi yoktur';
        case 'fundicGlandDilatation': return 'Fundik glandlarda dilatasyon vardır';
        default: return '';
    }
}

export function generateBiopsyReport(
    biopsy: Biopsy,
    index: number,
    currentCount: number,
    totalCount: number,
    activeField?: string
): string {
    const lines: string[] = [];
    const biopsyId = biopsy.id;

    const shouldHighlight = (fieldId: string) => {
        if (activeField === `${biopsyId}-active`) return true;
        return activeField === `${biopsyId}-${fieldId}`;
    };

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

    if (totalCount > 1) {
        formattedLocation = `${formattedLocation} (${currentCount}/${totalCount})`;
    }

    if (additionalLocations.length > 0) {
        formattedLocation = `${formattedLocation}, ${additionalLocations.join(', ')}`;
    }

    const titleLine = `${index + 1}- ${formattedLocation}, endoskopik biyopsi: ${biopsy.customDiagnosis || ''}`;
    lines.push(shouldHighlight('subLocation') || shouldHighlight('diagnosis') ? `<mark>${titleLine}</mark>` : titleLine);

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
                const label: Record<string, string> = {
                    inflammation: 'İnflamasyon',
                    activation: 'Aktivasyon',
                    atrophy: 'Atrofi',
                    hp: 'HP',
                    intestinalMetaplasia: 'İntestinal metaplazi'
                };
                const displayLabel = label[key];
                if (displayLabel && key !== 'eosinophilCount' && value !== 'Yapılmadı') {
                    const line = `     - ${displayLabel}: (${value})`;
                    lines.push(shouldHighlight(`finding-${key}`) ? `<mark>${line}</mark>` : line);
                }
            });
        } else {
            if (biopsy.findings.hp !== 'Yapılmadı') {
                const hpLine = `     - HP: (${biopsy.findings.hp})`;
                lines.push(shouldHighlight('finding-hp') ? `<mark>${hpLine}</mark>` : hpLine);
            }
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

    (biopsy.customNotes || []).forEach(note => {
        const line = `     - ${note}${note.endsWith('.') ? '' : '.'}`;
        lines.push(shouldHighlight('customNotes') ? `<mark>${line}</mark>` : line);
    });

    if ((biopsy.location === BiopsyLocation.Kolon || biopsy.location === BiopsyLocation.Ileum) &&
        biopsy.ibdDca && (biopsy.showIbdDca ?? false)) {
        const scoreLine = `     - IBD-DCA skoru: D${biopsy.ibdDca.d} C${biopsy.ibdDca.c} A${biopsy.ibdDca.a}`;
        lines.push(shouldHighlight('ibdDca-d') || shouldHighlight('ibdDca-c') || shouldHighlight('ibdDca-a') ? `<mark>${scoreLine}</mark>` : scoreLine);
    }

    if (biopsy.eosinophilCount) {
        const eosinophilLine = `     - BBA'da eozinofil sayısı: ${biopsy.eosinophilCount}`;
        lines.push(shouldHighlight('eosinophilCount') ? `<mark>${eosinophilLine}</mark>` : eosinophilLine);
    }

    return lines.join('\n');
}

export function generateFullEndoskopiReport(biopsies: Biopsy[], stainConfig: any, activeField?: string): string {
    const locationCounts: { [key: string]: number } = {};
    biopsies.forEach(biopsy => {
        const locationKey = `${biopsy.location}-${biopsy.subLocation.split(',')[0].trim()}`;
        locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
    });

    const currentCounts: { [key: string]: number } = {};
    let report = biopsies
        .map((biopsy, index) => {
            const mainLocation = biopsy.subLocation.split(',')[0].trim();
            const locationKey = `${biopsy.location}-${mainLocation}`;
            currentCounts[locationKey] = (currentCounts[locationKey] || 0) + 1;
            return generateBiopsyReport(
                biopsy,
                index,
                currentCounts[locationKey],
                locationCounts[locationKey],
                activeField
            );
        })
        .filter(Boolean)
        .join('\n\n');

    const hasConfiguredStains = (Object.values(stainConfig) as any[]).some(stains => stains.length > 0);
    const stomachBiopsiesNeedingHP = biopsies.filter(biopsy =>
        biopsy.location === BiopsyLocation.Mide &&
        biopsy.findings.hp !== 'Yapılmadı'
    );
    const stomachBiopsiesNeedingIM = biopsies.filter(biopsy =>
        biopsy.location === BiopsyLocation.Mide &&
        biopsy.findings.intestinalMetaplasia !== 'Yapılmadı'
    );

    if (hasConfiguredStains || stomachBiopsiesNeedingHP.length > 0 || stomachBiopsiesNeedingIM.length > 0) {
        const biopsyGroups = biopsies.reduce((acc, biopsy) => {
            if (!acc[biopsy.location]) {
                acc[biopsy.location] = [];
            }
            acc[biopsy.location].push(biopsy);
            return acc;
        }, {} as Record<string, Biopsy[]>);

        const stainLines: string[] = [];

        Object.entries(biopsyGroups).forEach(([location, locationBiopsies]) => {
            const locationConfig = stainConfig[location];
            if (locationConfig && locationConfig.length > 0) {
                const filteredStains = locationConfig.filter((stain: any) => {
                    if (location === BiopsyLocation.Mide) {
                        if (stain.name === 'Warthin Starry' && stain.description.includes('Helikobakter Pilori')) {
                            return stomachBiopsiesNeedingHP.length > 0;
                        }
                        if (stain.name === 'PAS+AB' && stain.description.includes('intestinal metaplazi')) {
                            return stomachBiopsiesNeedingIM.length > 0;
                        }
                    }
                    return true;
                });

                filteredStains.forEach((stain: any) => {
                    let relevantBiopsies = locationBiopsies;
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

        if (stainLines.length > 0) {
            report += '\n\nHistokimyasal yöntemle:\n';
            report += stainLines.join('\n');
            report += ' boyası yapılmıştır.';
        }
    }

    return report;
}

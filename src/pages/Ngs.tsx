import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Search, Dna, Microscope, FileText, Download, X, Info } from 'lucide-react';

const APP_DATA = {
  "dnaGenes": [
    "ABL1", "BRAF", "CRBN", "EPHB2", "FLI1", "HNF1A", "KRAS", "MYH9", "PIAS3", "RAB35", "SIN3A", "TFE3", "ABL2", "BRCA1", "CREBBP", "EPHB4", "FLT1", "HNRNPK", "LAMP1", "MYOD1", "PIAS4", "RAC1", "SLC34A2", "TFEB", "ABR", "BRCA2", "CRKL", "ERBB2", "FLT3", "HOXB13", "LATS1", "NAB2", "PIK3C2B", "RAD21", "SLIT2", "TFRC", "ACVR1", "BRD4", "CRLF2", "ERBB3", "FLT4", "HOXC6", "LATS2", "NBN", "PIK3C2G", "RAD50", "SLX4", "TGFBR1", "ACVR1B", "BRIP1", "CSAD", "ERBB4", "FOXA1", "HRAS", "LMO1", "NCOA2", "PIK3C3", "RAD51", "SMAD2", "TGFBR2", "ACVR2A", "BTG1", "CSF1R", "ERCC1", "FOXA2", "HSD3B1", "LRP1B", "NCOA3", "PIK3CA", "RAD51B", "SMAD3", "TIPARP", "ADGRA2", "BTG2", "CSF3R", "ERCC2", "FOXL2", "HSP90AA1", "LTK", "NCOR1", "PIK3CB", "RAD51C", "SMAD4", "TLR4", "AJUBA", "BTK", "CSNK1A1", "ERCC3", "FOXO1", "ICOSLG", "LYN", "NCOR2", "PIK3CD", "RAD51D", "SMARCA4", "TMEM127", "AKAP9", "C11ORF30", "CTCF", "ERCC4", "FOXP1", "ID3", "LZTR1", "NEGR1", "PIK3CG", "RAD52", "SMARCB1", "TMPRSS2", "AKT1", "CALR", "CTLA4", "ERCC5", "FRS2", "IDH1", "MAF", "NF1", "PIK3R1", "RAD54L", "SMARCB1", "TNFAIP3", "AKT2", "CARD11", "CTNNA1", "ERG", "FUBP1", "IDH2", "MAGEC3", "NF2", "PIK3R2", "RAF1", "SMARCE1", "TNFRSF14", "AKT3", "CASP8", "CTNNB1", "ERRFI1", "FYN", "IDO1", "MAGI2", "NFE2L2", "PIK3R3", "RANBP2", "SMC1A", "TOP1", "ALK", "CASR", "CTRC", "ESR1", "GABRA6", "IDO2", "MALT1", "NFKB2", "PIM1", "RARA", "SMC3", "TOP2A", "ALOX12B", "CBFB", "CUL3", "ESR2", "GATA1", "IFNGR1", "MAML2", "NFKBIA", "PIM2", "RASA1", "SMG1", "TP53", "ALOX15B", "CBL", "CUL4A", "ETS1", "GATA2", "IFNGR2", "MAP2K1", "NKX2-1", "PIM3", "RB1", "SMO", "TP53BP1", "AMER1", "CBLB", "CUL4B", "ETV1", "GATA3", "IGF1", "MAP2K2", "NKX3-1", "PLCG1", "RBM10", "SNCAIP", "TP63", "ANKRD11", "CCND1", "CUX1", "ETV4", "GATA4", "IGF1R", "MAP2K4", "NLRC5", "PLCG2", "RECQL4", "SOCS1", "TP73", "ANKRD26", "CCND2", "CXCR4", "ETV5", "GATA6", "IGF2", "MAP3K1", "NOTCH1", "PLK2", "REL", "SOS1", "TRAF2", "APC", "CCND3", "CYLD", "ETV6", "GEN1", "IKBKE", "MAP3K13", "NOTCH2", "PMAIP1", "REST", "SOX10", "TRAF3", "APLNR", "CCNE1", "CYP17A1", "EWSR1", "GID4", "IKZF1", "MAP3K14", "NOTCH3", "PML", "RET", "SOX17", "TRAF7", "AR", "CD22", "DAXX", "EZH2", "GLI1", "IKZF3", "MAP3K4", "NOTCH4", "PMS1", "RFWD2", "SOX2", "TSC1", "ARAF", "CD274", "DCUN1D1", "EZR", "GNA11", "IL10", "MAP3K7", "NPM1", "PMS2", "RFX5", "SOX9", "TSC2", "ARFRP1", "CD276", "DDR1", "FAM175A", "GNA13", "IL6R", "MAPK1", "NR3C1", "PNRC1", "RFXAP", "SPEN", "TSHR", "ARHGAP26", "CD38", "DDR2", "FAM46C", "GNAI2", "IL6ST", "MAPK3", "NRAS", "POLD1", "RHEB", "SPINK1", "TYR", "ARHGAP35", "CD44", "DDX3X", "FANCA", "GNAQ", "IL7R", "MAX", "NRG1", "POLE", "RHOA", "SPOP", "TYRO3", "ARID1A", "CD58", "DDX41", "FANCC", "GNAS", "ING1", "MC1R", "NSD1", "POLQ", "RICTOR", "SPTA1", "U2AF1", "ARID1B", "CD70", "DDX5", "FANCD2", "GPC3", "INHA", "MCL1", "NT5C2", "POT1", "RIT1", "SRC", "UGT1A1", "ARID2", "CD74", "DEFB134", "FANCE", "GPS2", "INHBA", "MDC1", "NTHL1", "PPARG", "RNASEL", "SRSF2", "UVRAG", "ARID5B", "CD79A", "DHX15", "FANCF", "GRB2", "INPP4A", "MDM2", "NTRK1", "PPM1D", "RNF43", "STAG1", "VEGFA", "ASXL1", "CD79B", "DHX9", "FANCG", "GREM1", "INPP4B", "MDM4", "NTRK2", "PPP2R1A", "ROS1", "STAG2", "VHL", "ASXL2", "CDC73", "DICER1", "FANCI", "GRIN2A", "INSR", "MECOM", "NTRK3", "PPP2R2A", "RPL22", "STAT1", "VTCN1", "ATM", "CDH1", "DIS3", "FANCL", "GRM3", "IRF1", "MED12", "NUP93", "PPP4R2", "RPL5", "STAT3", "WHSC1", "ATR", "CDK12", "DIS3L2", "FANCM", "GSK3B", "IRF2", "MEF2B", "NUTM1", "PPP6C", "RPS6KA4", "STAT4", "WHSC1L1", "ATRX", "CDK2", "DLX1", "FAS", "H3F3A", "IRF4", "MEN1", "P2RY8", "PRAME", "RPS6KB1", "STAT5A", "WISP3", "AURKA", "CDK4", "DNAJB1", "FAT1", "H3F3B", "IRS1", "MERTK", "PAK1", "PRC1", "RPS6KB2", "STAT5B", "WRN", "AURKB", "CDK6", "DNMT1", "FBXO11", "H3F3C", "IRS2", "MET", "PAK3", "PRDM1", "RPTOR", "STAT6", "WT1", "AURKC", "CDK7", "DNMT3A", "FBXW7", "HDAC1", "JAK1", "MGA", "PAK7", "PREX2", "RRM1", "STK11", "XBP1", "AXIN1", "CDK8", "DNMT3B", "FGF1", "HGF", "JAK2", "MGMT", "PALB2", "PRKAR1A", "RSPO2", "STK40", "XIAP", "AXIN2", "CDKN1A", "DOT1L", "FGF10", "HIF1A", "JAK3", "MITF", "PARK2", "PRKCI", "RUNX1", "SUFU", "XPO1", "AXL", "CDKN1B", "DPYD", "FGF12", "HIST1H1C", "JUN", "MKNK1", "PARP1", "PRKDC", "RUNX1T1", "SUZ12", "XRCC2", "B2M", "CDKN1C", "E2F3", "FGF14", "HIST1H2BD", "KAT6A", "MLH1", "PARP2", "PRSS1", "RXRA", "SYK", "YAP1", "BAP1", "CDKN2A", "EED", "FGF19", "HIST1H3A", "KDM5A", "MLLT3", "PARP3", "PRSS8", "RYBP", "TAF1", "YES1", "BARD1", "CDKN2B", "EGFL7", "FGF2", "HIST1H3B", "KDM5C", "MPL", "PAX3", "PSIP1", "SDC4", "TAF3", "ZBTB2", "BBC3", "CDKN2C", "EGFR", "FGF23", "HIST1H3C", "KDM6A", "MRE11A", "PAX5", "PSMA1", "SDHA", "TAP1", "ZBTB7A", "BCL10", "CEBPA", "EIF1AX", "FGF3", "HIST1H3D", "KDR", "MSH2", "PAX7", "PSMB5", "SDHAF2", "TAP2", "ZFHX3", "BCL2", "CENPA", "EIF4A2", "FGF4", "HIST1H3E", "KEAP1", "MSH3", "PAX8", "PSMD1", "SDHB", "TAPBP", "ZFP36L1", "BCL2L1", "CFTR", "EIF4E", "FGF5", "HIST1H3F", "KEL", "MSH6", "PBRM1", "PSMG2", "SDHC", "TBL1XR1", "ZMYM2", "BCL2L11", "CHD2", "ELAC2", "FGF6", "HIST1H3G", "KIAA1549", "MST1", "PCBP1", "PTCH1", "SDHD", "TBX3", "ZMYM3", "BCL2L2", "CHD4", "ELF3", "FGF7", "HIST1H3H", "KIF5B", "MST1R", "PDCD1", "PTEN", "SERPINB3", "TCEB1", "ZNF217", "BCL6", "CHD8", "EML4", "FGF8", "HIST1H3I", "KIT", "MTAP", "PDCD1LG2", "PTK2", "SERPINB4", "TCF12", "ZNF703", "BCOR", "CHEK1", "EP300", "FGF9", "HIST1H3J", "KLF2", "MTOR", "PDGFRA", "PTPN11", "SETBP1", "TCF3", "ZNF750", "BCORL1", "CHEK2", "EPCAM", "FGFR1", "HIST2H3C", "KLF4", "MUTYH", "PDGFRB", "PTPRD", "SETD2", "TCF7L2", "ZRSR2", "BCR", "CIC", "EPHA2", "FGFR2", "HIST2H3D", "KLHL6", "MYB", "PDK1", "PTPRO", "SF3B1", "TEK", "BIRC2", "CIITA", "EPHA3", "FGFR3", "HIST3H3", "KMT2A", "MYC", "PDPK1", "PTPRS", "SGK1", "TERC", "BIRC3", "CKS1B", "EPHA5", "FGFR4", "HLA-A", "KMT2B", "MYCL", "PGR", "PTPRT", "SH2B3", "TERT", "BLM", "COL17A1", "EPHA7", "FH", "HLA-B", "KMT2C", "MYCN", "PHF6", "QKI", "SH2D1A", "TET1", "BMPR1A", "CPA1", "EPHB1", "FLCN", "HLA-C", "KMT2D", "MYD88", "PHOX2B", "QSER1", "SHQ1", "TET2"
  ],
  "rnaGenes": [
    "ABL1", "BRCA1", "EML4", "ETV6", "FLT1", "MAML2", "MYB", "NTRK3", "PKN1", "RPS6KB1", "AKT3", "BRCA2", "ERBB2", "EWSR1", "FLT3", "MAST1", "MYC", "NUMBL", "PPARG", "RSPO2", "ALK", "BRD3", "ERG", "FGFR1", "INSR", "MAST2", "NOTCH1", "NUTM1", "PRKCA", "RSPO3", "AR", "BRD4", "ESR1", "FGFR2", "JAK2", "MET", "NOTCH2", "PAX3", "PRKCB", "TERT", "ARHGAP26", "CDK4", "ETS1", "FGFR3", "KDR", "MLLT3", "NOTCH3", "PAX7", "RAF1", "TFE3", "AXL", "CIC", "ETV1", "FGFR4", "KIF5B", "MSH2", "NRG1", "PDGFRA", "RELA", "TFEB", "BCL2", "CSF1R", "ETV4", "FGR", "KIT", "MSMB", "NTRK1", "PDGFRB", "RET", "THADA", "BRAF", "EGFR", "ETV5", "FLI1", "KMT2A", "MUSK", "NTRK2", "PIK3CA", "ROS1", "TMPRSS2"
  ],
  "cancerMap": {
    "Akciğer": ["AKT1", "CCND1", "CDK6", "ERBB3", "HRAS", "KRAS", "MSH6", "NTRK3", "RAF1", "BRAF", "EGFR", "ALK", "CCND2", "CDKN2A", "ERCC2", "IDH1", "MAP2K1", "MTOR", "PDGFRA", "RET", "ERBB2", "FGFR2", "APC", "CCNE1", "CTNNB1", "FGFR1", "IDH2", "MAP2K2", "NF1", "PIK3CA", "ROS1", "FGFR3", "ARAF", "CD274", "DDR2", "KDM6A", "MET", "NRAS", "PMS2", "STK11", "NTRK1", "ARID1A", "CDK12", "KEAP1", "MLH1", "PTCH1", "TP53", "CDK4", "FGFR4", "KIT", "MSH2", "NTRK2", "PTEN", "TERT"],
    "Kolon": ["APC", "BRAF", "CTNNB1", "FBXW7", "MLH1", "MUTYH", "PIK3CA", "PTEN", "STK11", "CDKN2A", "ARID1A", "CDH1", "EPCAM", "GNAS", "MSH2", "MYC", "PMS2", "RNF43", "TCF7L2", "ERBB2", "AXIN2", "GREM1", "MSH3", "NRAS", "POLD1", "SMAD4", "TP53", "KRAS", "BMPR1A", "CHEK2", "ERBB3", "MSH6", "NTHL1", "POLE", "SOX9", "TERT", "ACVR1B", "EGFR", "ERBB4", "SMAD2", "SMAD3", "PIK3R1", "AKT1", "AKT2", "TGFBR2", "ATM", "MET", "LRP1B", "CSMD3"],
    "Pankreas": ["ALK", "BRCA1", "CPA1", "FBXW7", "MDM2", "NF1", "POLD1", "SMAD4", "TSC2", "APC", "BRCA2", "CTNNB1", "FGFR2", "MEN1", "NRAS", "POLE", "SOX9", "VHL", "ARID1A", "CASR", "CTRC", "GNAS", "MET", "NRG1", "PRSS1", "SPINK1", "ERBB2", "NTRK1", "ATM", "CDH1", "EPCAM", "IDH1", "MLH1", "PTEN", "STK11", "KRAS", "RET", "BAP1", "CDKN2A", "IDH2", "MSH2", "PALB2", "TCF7L2", "ROS1", "BMPR1A", "CFTR", "ERBB3", "MSH6", "PIK3CA", "RNF43", "TP53", "BRAF", "CHEK2", "ESR1", "MAP2K1", "MYC", "PMS2", "TSC1"],
    "Böbrek": ["ATM", "DICER1", "FLCN", "MLH1", "NF2", "PTEN", "SDHC", "SMARCB1", "TSC2", "MET", "BAP1", "DIS3L2", "GPC3", "MSH2", "PBRM1", "REST", "SDHD", "TFEB", "VHL", "PIK3CA", "CDC73", "EPCAM", "KDM5C", "MSH6", "SDHA", "SETD2", "TP53", "WT1", "CDKN1C", "FH", "MTOR", "PMS2", "SDHB", "SMARCA4", "TSC1", "TERT", "ARID1A", "BRAF", "EGFR", "FGFR3", "RB1", "CDKN2A", "KRAS", "NRAS", "ARID2", "EP300", "KMT2D", "KMT2C", "PTPN11", "SMARCA2", "CREBBP"],
    "Mesane": ["AKT1", "CCND1", "CTNNB1", "ERCC2", "KDM6A", "PPARG", "TSC1", "KRAS", "BRAF", "ARID1A", "CCNE1", "E2F3", "FGFR2", "PTEN", "TERT", "MDM2", "ATM", "CDKN1A", "ERBB2", "FGFR3", "RB1", "EP300", "CDKN2A", "PIK3CA", "ERBB3", "HRAS", "TP53", "KDM5C", "ARID2", "CREBBP", "EGFR", "KMT2D", "KMT2C", "STAG2", "NRAS", "BRCA1", "BRCA2", "PALB2", "MRE11A", "RAD51B", "RAD51C", "RAD51D", "MYC", "FGFR1", "ERBB4", "MTOR", "PIK3R1", "MET", "GATA3"],
    "Meme": ["AKT1", "BRCA2", "CHEK2", "FANCA", "KRAS", "MSH2", "NRG1", "POLE", "RAD51D", "BARD1", "MYC", "BRAF", "ARID1A", "BRIP1", "CTNNB1", "FANCD2", "MAGEC3", "MSH6", "NTRK3", "PPP2R1A", "RAD54L", "BRCA1", "PALB2", "FGFR2", "ATM", "CCNE1", "EPCAM", "FBXW7", "MAP2K1", "MTOR", "PPP2R2A", "RB1", "PIK3CA", "CDH1", "ERBB2", "FGFR1", "MET", "PTEN", "STK11", "CDK12", "ERBB3", "MLH1", "NBN", "PIK3R1", "RAD51B", "TP53", "RAD51C", "CDKN2A", "ESR1", "FGFR3", "MRE11", "NF1", "PMS2"],
    "Prostat": ["AKT1", "BRCA2", "EPCAM", "FOXA1", "KMT2D", "MUTYH", "PIK3CA", "RAD51C", "STK11", "AR", "BRAF", "APC", "BRIP1", "ERG", "GATA2", "KRAS", "MYC", "PIK3R1", "RAD51D", "TMPRSS2", "BRCA1", "CDH1", "ETV1", "HOXB13", "MAGEC3", "NBN", "PMS2", "RAD54L", "TP53", "ATM", "CDK12", "ETV4", "MED12", "NCOA2", "PPP2R2A", "RB1", "BARD1", "CHEK1", "ETV5", "IDH1", "MLH1", "NCOR2", "PTEN", "SPINK1", "CHEK2", "FANCA", "KDM6A", "MSH2", "PALB2", "RAD50", "SPOP", "CTNNB1", "FANCL", "KMT2C", "MSH6", "PARP1", "RAD51B", "SPTA1"],
    "Melanom": ["AKT3", "BRCA1", "CDKN2A", "GNA11", "IDH1", "MC1R", "NRAS", "PTEN", "TP53", "KRAS", "BRAF", "ARID2", "BRCA2", "CTNNB1", "GNAQ", "KIT", "MDM2", "PIK3CA", "RAC1", "TYR", "BAP1", "CCND1", "ERBB4", "GRIN2A", "MITF", "POT1", "RB1", "NTRK1", "CDK4", "EZH2", "HRAS", "MAP2K1", "NF1", "PPP6C", "TERT", "NTRK2", "TERF2IP", "ACD", "TERF1", "ATRX", "SF3B1", "EIF1AX", "EGFR", "NTRK3", "PDGFRA"],
    "Mide": ["APC", "CDH1", "EPCAM", "KIT", "MSH2", "PIK3CA", "SDHA", "STK11", "CLDN18", "CCND1", "KRAS", "ARID1A", "CDKN2A", "ERBB2", "KMT2C", "MSH6", "PMS2", "SDHB", "TP53", "ERBB4", "CCNE1", "MYC", "BMPR1A", "CTNNA1", "ERBB3", "KMT2D", "PTEN", "SDHC", "TERT", "KDR", "CTNNB1", "FBXW7", "NF1", "RHOA", "SDHD", "NRAS", "EP300", "EGFR", "GNAS", "MLH1", "PDGFRA", "RNF43", "SMAD4", "BRAF", "ARID2", "CREBBP", "FAT1", "PIK3R1", "AKT1", "AKT2"]
  },
  "geneInfo": {
    "EGFR": "Reseptör tirozin kinazdır. Özellikle akciğer adenokarsinomunda hedefe yönelik tedavi kararında önemlidir; aktivasyon mutasyonları ve direnç değişiklikleri klinik yorumda değerlendirilir.",
    "ALK": "Reseptör tirozin kinaz ailesindedir. Pan-Kanser DNA panelinde varyant/kopya değişiklikleri, RNA füzyon panelinde ise ALK füzyonları tedavi planlaması açısından önemlidir.",
    "ROS1": "Tirozin kinaz genidir. Özellikle akciğer kanserinde ROS1 füzyonları hedefe yönelik tedavi açısından klinik öneme sahiptir.",
    "RET": "Reseptör tirozin kinaz genidir. RET füzyonları ve bazı mutasyonları tiroid ve akciğer başta olmak üzere farklı tümörlerde tedavi hedefi olabilir.",
    "NTRK1": "NTRK gen ailesi nörotrofik tirozin kinaz reseptörlerini kodlar. NTRK füzyonları tümör tipinden bağımsız hedefe yönelik tedavi açısından önemlidir.",
    "NTRK2": "NTRK gen ailesi üyesidir. NTRK füzyonları, uygun olgularda tümör tipinden bağımsız tedavi seçeneği doğurabilir.",
    "NTRK3": "NTRK gen ailesi üyesidir. NTRK3 füzyonları bazı nadir tümörlerde ve seçilmiş solid tümörlerde klinik olarak anlamlı olabilir.",
    "BRAF": "MAPK yolak genidir. V600E başta olmak üzere aktivasyon mutasyonları melanom, kolorektal, akciğer, tiroid ve diğer tümörlerde klinik öneme sahiptir.",
    "KRAS": "RAS/MAPK yolak genidir. Kolorektal, akciğer ve pankreas kanserlerinde sık görülür; bazı varyantlar hedefe yönelik tedavi veya tedavi direnci açısından değerlendirilir.",
    "NRAS": "RAS/MAPK yolak genidir. Kolorektal kanser, melanom ve hematolojik malignitelerde klinik öneme sahip olabilir.",
    "HRAS": "RAS ailesi üyesidir. Baş-boyun, mesane ve diğer bazı tümörlerde sürücü değişiklik olarak görülebilir.",
    "PIK3CA": "PI3K/AKT/mTOR yolak genidir. Meme, kolon, endometrium ve diğer tümörlerde tedavi hedefi veya biyolojik belirteç olarak değerlendirilebilir.",
    "PTEN": "Tümör baskılayıcı gendir. PI3K/AKT yolunun negatif düzenleyicisidir; kaybı/bozukluğu prognoz ve tedavi yanıtı açısından önemli olabilir.",
    "ERBB2": "HER2 olarak da bilinen reseptör tirozin kinaz genidir. Meme, mide, akciğer ve diğer tümörlerde amplifikasyon/mutasyon tedavi hedefi olabilir.",
    "ERBB3": "ERBB/HER ailesi üyesidir. PI3K yolak aktivasyonu ve hedefe yönelik tedavi yorumlarında destekleyici öneme sahip olabilir.",
    "MET": "Reseptör tirozin kinaz genidir. MET ekzon 14 atlama, amplifikasyon veya füzyonlar özellikle akciğer kanserinde tedavi açısından önemlidir.",
    "FGFR1": "FGFR ailesi üyesidir. Amplifikasyon, mutasyon veya füzyonları bazı solid tümörlerde hedefe yönelik tedavi açısından değerlendirilebilir.",
    "FGFR2": "FGFR ailesi üyesidir. Füzyonlar/yeniden düzenlenmeler ve bazı değişiklikler özellikle safra yolu, mide ve diğer tümörlerde önem taşıyabilir.",
    "FGFR3": "FGFR ailesi üyesidir. Mesane kanseri başta olmak üzere bazı tümörlerde mutasyon veya füzyonlar tedavi açısından anlamlı olabilir.",
    "FGFR4": "FGFR ailesi üyesidir. Seçilmiş tümörlerde yolak aktivasyonu ve hedeflenebilirlik açısından değerlendirilebilir.",
    "KIT": "Reseptör tirozin kinaz genidir. GIST, melanom ve bazı hematolojik tümörlerde mutasyonları tedavi planlamasında önemlidir.",
    "PDGFRA": "Reseptör tirozin kinaz genidir. GIST ve bazı diğer tümörlerde tedavi hedefi olarak değerlendirilebilir.",
    "BRCA1": "Homolog rekombinasyon DNA tamir genidir. Meme, over, prostat, pankreas gibi tümörlerde HRD/PARP inhibitörü açısından önemlidir.",
    "BRCA2": "Homolog rekombinasyon DNA tamir genidir. HRD ve PARP inhibitörü ilişkili klinik yorumlarda temel genlerden biridir.",
    "PALB2": "BRCA yoluyla ilişkili DNA tamir genidir. HRD ve PARP inhibitörü uygunluğu açısından klinik yorumda dikkate alınabilir.",
    "ATM": "DNA hasar yanıt genidir. Homolog rekombinasyon ve DNA tamir bozukluklarının değerlendirilmesinde önemlidir.",
    "ATR": "DNA hasar yanıtında görevli kinazdır. DNA tamir hedefli tedavi araştırmaları ve HRD ilişkili yorumlarda değerlendirilebilir.",
    "CHEK2": "DNA hasar kontrol noktası genidir. DNA tamir bozukluğu ve bazı tümörlerde risk/tedavi yorumları açısından önem taşır.",
    "RAD51C": "Homolog rekombinasyon tamir genidir. HRD ve PARP inhibitörü ilişkili değerlendirmelerde önemlidir.",
    "RAD51D": "Homolog rekombinasyon tamir genidir. HRD değerlendirmesinde klinik olarak önemli olabilir.",
    "MLH1": "DNA uyumsuzluk tamir genidir. MSI/MMR bozukluğu ve Lynch sendromu ilişkili değerlendirmelerde temel genlerden biridir.",
    "MSH2": "DNA uyumsuzluk tamir genidir. MSI/MMR bozukluğu değerlendirmesinde önemlidir.",
    "MSH6": "DNA uyumsuzluk tamir genidir. MSI/MMR bozukluğu ve Lynch ilişkili değerlendirmelerde önemlidir.",
    "PMS2": "DNA uyumsuzluk tamir genidir. MSI/MMR bozukluğu değerlendirmesinde temel genlerden biridir.",
    "EPCAM": "EPCAM delesyonları MSH2 ekspresyonunu etkileyebilir; Lynch sendromu ve MSI/MMR ilişkili değerlendirmelerde dikkate alınır.",
    "POLE": "DNA polimeraz genidir. Ekzonükleaz bölge mutasyonları yüksek TMB ve immünoterapi yanıtı ile ilişkili olabilir.",
    "POLD1": "DNA polimeraz genidir. Bazı varyantlar hipermutasyon ve TMB artışı ile ilişkili olabilir.",
    "TP53": "Temel tümör baskılayıcı gendir. Çok sayıda kanser tipinde sık değişir; prognoz ve tümör biyolojisi açısından önemlidir.",
    "APC": "Wnt yolak tümör baskılayıcı genidir. Kolorektal kanserde erken ve sık görülen sürücü değişikliklerden biridir.",
    "CTNNB1": "Beta-katenin genidir. Wnt yolak aktivasyonu ile ilişkilidir; karaciğer, endometrium ve diğer tümörlerde görülebilir.",
    "SMAD4": "TGF-beta yolak genidir. Pankreas ve kolorektal kanserlerde tümör biyolojisi/prognoz açısından önem taşıyabilir.",
    "RB1": "Hücre döngüsü tümör baskılayıcı genidir. Kaybı bazı tümörlerde agresif biyoloji ve tedavi direnci ile ilişkilendirilebilir.",
    "STK11": "Tümör baskılayıcı gendir. Akciğer kanserinde KEAP1 ile birlikte prognoz ve immünoterapi yanıtı açısından yorumlanabilir.",
    "KEAP1": "Oksidatif stres yanıt yolunu düzenleyen gendir. Akciğer kanserinde prognoz ve tedavi yanıtı açısından önem taşıyabilir.",
    "CDKN2A": "Hücre döngüsü kontrol genidir. Kaybı/mutasyonu pek çok tümörde görülür ve CDK4/6 yolak yorumlarında önemlidir.",
    "CDK4": "Hücre döngüsü kinazıdır. Amplifikasyon/aktivasyon bazı tümörlerde hedeflenebilir yolak olarak değerlendirilebilir.",
    "CDK6": "Hücre döngüsü kinazıdır. CDK4/6 yolak aktivasyonu ve tedavi hedefleri açısından önemlidir.",
    "CCND1": "Siklin D1 genidir. Amplifikasyonu hücre döngüsü aktivasyonu ve CDK4/6 yolak yorumlarında önemlidir.",
    "TERT": "Telomeraz ters transkriptaz genidir. Promotor değişiklikleri melanom, gliom, tiroid, mesane ve diğer tümörlerde görülebilir.",
    "IDH1": "Metabolik enzim genidir. Gliom, kolanjiokarsinom, AML ve bazı diğer tümörlerde mutasyonları tedavi/prognoz açısından önemlidir.",
    "IDH2": "Metabolik enzim genidir. AML, gliom ve bazı diğer tümörlerde mutasyonları klinik öneme sahiptir.",
    "ESR1": "Östrojen reseptörü genidir. Meme kanserinde endokrin tedavi direnci ile ilişkili mutasyonlar görülebilir.",
    "AR": "Androjen reseptörü genidir. Prostat kanserinde hastalık biyolojisi ve tedavi direnci açısından önemlidir.",
    "VHL": "Tümör baskılayıcı gendir. Özellikle şeffaf hücreli böbrek hücreli karsinom biyolojisinde merkezi öneme sahiptir.",
    "BAP1": "Kromatin düzenleyici/tümör baskılayıcı gendir. Böbrek kanseri, mezotelyoma, melanom ve diğer tümörlerde klinik öneme sahip olabilir.",
    "PBRM1": "Kromatin düzenleyici gendir. Böbrek hücreli karsinomda sık değişen genlerden biridir.",
    "SETD2": "Kromatin düzenleyici/DNA tamir ilişkili gendir. Böbrek kanseri ve bazı hematolojik tümörlerde önemlidir.",
    "MDM2": "TP53 yolunun negatif düzenleyicisidir. Amplifikasyonu liposarkom ve bazı diğer tümörlerde tanısal/klinik öneme sahip olabilir.",
    "MYC": "Transkripsiyon faktörüdür. Amplifikasyon/yeniden düzenlenmeler tümör biyolojisi ve proliferasyonla ilişkilidir.",
    "MYCN": "MYC ailesi üyesidir. Nöroblastom ve bazı diğer tümörlerde amplifikasyon klinik önem taşır.",
    "NRG1": "Büyüme faktörü genidir. NRG1 füzyonları bazı solid tümörlerde hedeflenebilir değişiklik olarak değerlendirilebilir.",
    "TFE3": "Transkripsiyon faktörüdür. TFE3 füzyonları böbrek tümörleri ve bazı sarkomlarda tanısal öneme sahip olabilir.",
    "TFEB": "Transkripsiyon faktörüdür. TFEB yeniden düzenlenmeleri bazı böbrek tümörleri ve nadir tümörlerde görülebilir.",
    "EWSR1": "RNA bağlayıcı gen/translokasyon partneridir. Sarkomlar ve bazı nadir tümörlerde tanısal füzyonlar açısından önemlidir.",
    "NUTM1": "NUTM1 yeniden düzenlenmeleri NUT karsinomu ve bazı nadir tümörlerde tanısal/klinik öneme sahiptir.",
    "EML4": "ALK füzyonlarında sık görülen partner genlerden biridir; EML4::ALK özellikle akciğer adenokarsinomunda önemlidir.",
    "TMPRSS2": "Prostat kanserinde ERG ile füzyon partneri olarak sık değerlendirilir.",
    "ERG": "ETS ailesi transkripsiyon faktörüdür. Prostat kanserinde TMPRSS2::ERG füzyonu ve bazı hematolojik/sarkom ilişkili yeniden düzenlenmelerde önemlidir.",
    "ETV1": "ETS ailesi transkripsiyon faktörüdür. Prostat ve bazı solid tümörlerde füzyon/yeniden düzenlenme partneri olabilir.",
    "ETV4": "ETS ailesi transkripsiyon faktörüdür. Prostat ve bazı nadir tümörlerde füzyon/yeniden düzenlenmeler açısından değerlendirilebilir.",
    "ETV5": "ETS ailesi transkripsiyon faktörüdür. Gen füzyonları bazı tümörlerde tanısal veya biyolojik önem taşıyabilir.",
    "ETV6": "Transkripsiyon faktörüdür. Hematolojik maligniteler ve bazı solid/nadir tümörlerde füzyon partneri olabilir.",
    "KMT2A": "Epigenetik düzenleyici gendir. Hematolojik malignitelerde ve bazı füzyon olaylarında klinik öneme sahiptir.",
    "FLT3": "Reseptör tirozin kinaz genidir. AML başta olmak üzere hematolojik malignitelerde hedefe yönelik tedavi açısından önemlidir.",
    "NPM1": "Nükleofosmin genidir. AML sınıflaması ve risk değerlendirmesinde önemli bir gendir.",
    "JAK2": "Sitokin sinyal yolak genidir. Myeloproliferatif neoplazilerde V617F gibi varyantlar klinik öneme sahiptir.",
    "CALR": "Myeloproliferatif neoplazilerde JAK2/MPL negatif olgularda önemli sürücü genlerden biridir.",
    "MPL": "Trombopoetin reseptörü genidir. Myeloproliferatif neoplazilerde sürücü değişiklik olarak değerlendirilebilir.",
    "BTK": "B hücre reseptör sinyalinde görevli kinazdır. Lenfoid malignitelerde hedefe yönelik tedavi ve direnç açısından önemlidir.",
    "MYD88": "NF-kB yolak aktivasyonu ile ilişkili adaptör gendir. Lenfomalar ve Waldenström makroglobulinemisi gibi durumlarda önemlidir.",
    "SF3B1": "Splicing faktör genidir. MDS, CLL ve bazı solid tümörlerde klinik/prognostik önem taşıyabilir.",
    "U2AF1": "Splicing faktör genidir. MDS ve myeloid neoplazilerde klinik öneme sahip olabilir.",
    "SRSF2": "Splicing faktör genidir. Myeloid neoplazilerde prognostik/klinik önem taşıyabilir.",
    "RUNX1": "Transkripsiyon faktörüdür. AML ve diğer hematolojik malignitelerde klinik öneme sahiptir.",
    "WT1": "Transkripsiyon faktörüdür. Hematolojik maligniteler ve bazı solid tümörlerde prognostik/izlem açısından önemlidir.",
    "CEBPA": "Transkripsiyon faktörüdür. AML sınıflaması ve risk değerlendirmesinde önemli olabilir.",
    "GATA2": "Transkripsiyon faktörüdür. Hematolojik neoplaziler ve yatkınlık sendromlarında önem taşıyabilir."
  }
};

const dnaSet = new Set(APP_DATA.dnaGenes);
const rnaSet = new Set(APP_DATA.rnaGenes);
const allGenes = Array.from(new Set([...APP_DATA.dnaGenes, ...APP_DATA.rnaGenes])).sort((a, b) => a.localeCompare(b));
const cancerMap = { ...APP_DATA.cancerMap };

const norm = (x: string) => {
  return (x || '').toString().trim().toUpperCase().replace(/İ/g, 'I');
};

export function Ngs() {
  const [search, setSearch] = useState('');
  const [panelFilter, setPanelFilter] = useState<'all' | 'dna' | 'rna'>('all');
  const [cancerFilter, setCancerFilter] = useState<string>('all');
  const [selectedGene, setSelectedGene] = useState<string | null>(null);

  const clearFilters = () => {
    setSearch('');
    setPanelFilter('all');
    setCancerFilter('all');
  };

  const getCancerGenes = (selected: string) => {
    return selected === 'all' ? null : new Set(cancerMap[selected as keyof typeof cancerMap] || []);
  };

  const geneMatches = (g: string) => {
    if (search && !norm(g).includes(norm(search))) return false;
    const cset = getCancerGenes(cancerFilter);
    if (cset && !cset.has(g)) return false;
    return true;
  };

  const dnaFiltered = panelFilter === 'rna' ? [] : APP_DATA.dnaGenes.filter(geneMatches);
  const rnaFiltered = panelFilter === 'dna' ? [] : APP_DATA.rnaGenes.filter(geneMatches);

  const selectedCancerCount = cancerFilter === 'all' ? allGenes.length : (cancerMap[cancerFilter as keyof typeof cancerMap] || []).length;

  // Gene Details helper
  const getGeneDetails = (g: string) => {
    const inDNA = dnaSet.has(g);
    const inRNA = rnaSet.has(g);
    const baseInfo = APP_DATA.geneInfo[g as keyof typeof APP_DATA.geneInfo] || '';

    let info = baseInfo;
    if (!info) {
      if (inDNA && inRNA) {
        info = 'Bu gen kanser biyolojisinde hem DNA düzeyindeki değişiklikler hem de RNA düzeyindeki füzyon/yeniden düzenlenmeler açısından değerlendirilebilen panel genlerinden biridir. Klinik anlamı, saptanan değişikliğin tipine ve tümör bağlamına göre yorumlanır.';
      } else if (inDNA) {
        info = 'Bu gen Pan-Kanser DNA paneli kapsamında tümör dokusundaki somatik değişiklikler açısından değerlendirilir. Saptanan varyantın patojenite sınıfı, varyant allel frekansı, okuma derinliği ve tümör tipi birlikte yorumlanır.';
      } else if (inRNA) {
        info = 'Bu gen RNA füzyon paneli kapsamında füzyon/yeniden düzenlenme açısından değerlendirilir. Pozitif sonuçta füzyon partneri, destekleyen okuma sayısı ve tümör tipi klinik yorum için birlikte dikkate alınır.';
      } else {
        info = 'Bu gen mevcut panel listelerinde yer almıyor gibi görünmektedir.';
      }
    }

    let panelText = '';
    let reportText = '';
    if (inDNA && inRNA) {
      panelText = 'Bu gen hem Pan-Kanser DNA Paneli hem de RNA Füzyon Paneli kapsamındadır.';
      reportText = 'Aynı gen iki panelde görünse bile raporlanan bulgu türü farklıdır. DNA raporunda SNV/indel varyantları, uygun hedeflerde kopya sayısı değişiklikleri ve seçili yapısal değişiklikler değerlendirilir. RNA füzyon raporunda ise genin füzyon/yeniden düzenlenme transkriptleri araştırılır. Bu nedenle DNA ve RNA sonuçları ayrı başlıklarla raporlanmalı, pozitiflikler birbirinin yerine kullanılmamalıdır.';
    } else if (inDNA) {
      panelText = 'Bu gen Pan-Kanser DNA Paneli kapsamındadır.';
      reportText = 'DNA raporunda bu gen için saptanan klinik anlamlı varyantlar varsa gen adı, varyant adı, allel frekansı, okuma derinliği, patojenite sınıfı ve klinik yorumla birlikte verilir. Varyant saptanmazsa gen, panel kapsamındaki negatif değerlendirme içinde yer alır.';
    } else if (inRNA) {
      panelText = 'Bu gen RNA Füzyon Paneli kapsamındadır.';
      reportText = 'RNA füzyon raporunda bu gen için klinik anlamlı füzyon/yeniden düzenlenme varlığı araştırılır. Pozitif olgularda füzyon partneri ve destekleyen okuma sayısı raporlanır; negatif olgularda panel kapsamındaki genlerde raporlanabilir füzyon saptanmadığı belirtilir.';
    } else {
      panelText = 'Bu gen mevcut panel listelerinde yer almıyor gibi görünmektedir.';
      reportText = 'Gen adını yazım açısından kontrol ediniz veya panel listesi güncel dosya ile karşılaştırılmalıdır.';
    }

    return { inDNA, inRNA, info, panelText, reportText };
  };

  const modalDetails = selectedGene ? getGeneDetails(selectedGene) : null;

  return (
    <PageContainer className="bg-slate-50/50 min-h-screen dark:bg-slate-900/10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06255b] via-[#0b6ecb] to-[#0ea5a5] text-white p-8 md:p-12 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              DNA ve RNA Gen Arama
            </h1>
            <p className="text-lg text-teal-50/90 font-medium max-w-2xl">
              SDÜ Patoloji Laboratuvarı DNA ve RNA Füzyon Paneli Gen Arama ve Filtreleme Uygulaması
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md text-center sm:text-left min-w-[200px]">
              <span className="text-xs text-teal-100/80 block uppercase tracking-wider font-bold">Toplam Kapsam</span>
              <span className="text-3xl font-black block mt-1">679 + 80</span>
              <span className="text-xs text-teal-100 block font-semibold mt-1">DNA & RNA Füzyon Geni</span>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Afiş Linki */}
      <a
        href="/ngs_afis.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 rounded-2xl hover:from-red-500/15 hover:to-amber-500/15 transition-all group mb-8 shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600 text-white rounded-2xl group-hover:scale-105 transition-transform shadow-md">
            <FileText size={26} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">SDÜ Patoloji NGS Rehberi & Afişi</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Yeni patoloji NGS tetkik listesi, panel rehberi ve bilgilendirme afişini PDF olarak indirin veya inceleyin.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-700 transition-colors self-stretch sm:self-auto justify-center">
          <Download size={16} />
          <span>Afişi İndir (PDF)</span>
        </div>
      </a>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-5 md:p-6 shadow-md sticky top-4 z-20 backdrop-blur-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GEN ARA</label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Örn: EGFR, KRAS, ALK, BRCA1, NTRK..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PANEL</label>
            <select
              value={panelFilter}
              onChange={(e) => setPanelFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            >
              <option value="all">DNA + RNA</option>
              <option value="dna">Sadece DNA</option>
              <option value="rna">Sadece RNA füzyon</option>
            </select>
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KANSER TÜRÜ FİLTRESİ</label>
            <select
              value={cancerFilter}
              onChange={(e) => setCancerFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            >
              <option value="all">Tüm kanser türleri</option>
              {Object.keys(cancerMap).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              onClick={clearFilters}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-2xl transition-colors cursor-pointer text-sm"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <button
            onClick={() => setCancerFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              cancerFilter === 'all'
                ? 'bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-350'
            }`}
          >
            Tümü
          </button>
          {Object.keys(cancerMap).map((c) => (
            <button
              key={c}
              onClick={() => setCancerFilter(c)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                cancerFilter === c
                  ? 'bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-350'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Toplam DNA Geni</span>
          <span className="text-2xl font-black text-[#06255b] dark:text-[#0b6ecb] mt-1">{APP_DATA.dnaGenes.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Toplam RNA Geni</span>
          <span className="text-2xl font-black text-[#0ea5a5] mt-1">{APP_DATA.rnaGenes.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Görünen Sonuç</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{dnaFiltered.length + rnaFiltered.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Kanser Türü Filtresi</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2 truncate">
            {cancerFilter === 'all' ? 'Aktif Filtre Yok' : `${cancerFilter} (${selectedCancerCount} Gen)`}
          </span>
        </div>
      </div>

      {/* Main List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* DNA Column */}
        {panelFilter !== 'rna' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-[#079586] to-[#0bc0cf] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 animate-pulse" />
                <h2 className="text-xl font-bold">Pan-Kanser DNA Paneli</h2>
              </div>
              <span className="bg-white/20 border border-white/30 text-white font-extrabold px-3 py-1 rounded-full text-sm">
                {dnaFiltered.length} gen
              </span>
            </div>
            <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[620px] overflow-y-auto">
              {dnaFiltered.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 font-semibold">
                  Bu filtreyle DNA geni bulunamadı.
                </div>
              ) : (
                dnaFiltered.map((g) => {
                  const inRNA = rnaSet.has(g);
                  return (
                    <button
                      key={g}
                      onClick={() => setSelectedGene(g)}
                      className="group relative border border-slate-100 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/80 hover:border-teal-500 rounded-xl p-3 text-center transition-all duration-150 hover:shadow-md cursor-pointer"
                    >
                      <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200 group-hover:text-teal-650 transition-colors">
                        {g}
                      </span>
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        <div className="w-2 h-2 rounded-full bg-teal-500" title="DNA" />
                        {inRNA && <div className="w-2 h-2 rounded-full bg-sky-500" title="RNA" />}
                      </div>
                      <span className="block text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {inRNA ? 'DNA + RNA' : 'DNA'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RNA Column */}
        {panelFilter !== 'dna' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-[#0b47ad] to-[#0a8be5] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 animate-pulse" />
                <h2 className="text-xl font-bold">RNA Füzyon Paneli</h2>
              </div>
              <span className="bg-white/20 border border-white/30 text-white font-extrabold px-3 py-1 rounded-full text-sm">
                {rnaFiltered.length} gen
              </span>
            </div>
            <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[620px] overflow-y-auto">
              {rnaFiltered.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 font-semibold">
                  Bu filtreyle RNA füzyon geni bulunamadı.
                </div>
              ) : (
                rnaFiltered.map((g) => {
                  const inDNA = dnaSet.has(g);
                  return (
                    <button
                      key={g}
                      onClick={() => setSelectedGene(g)}
                      className="group relative border border-slate-100 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/80 hover:border-sky-500 rounded-xl p-3 text-center transition-all duration-150 hover:shadow-md cursor-pointer"
                    >
                      <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200 group-hover:text-sky-650 transition-colors">
                        {g}
                      </span>
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        {inDNA && <div className="w-2 h-2 rounded-full bg-teal-500" title="DNA" />}
                        <div className="w-2 h-2 rounded-full bg-sky-500" title="RNA" />
                      </div>
                      <span className="block text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {inDNA ? 'DNA + RNA' : 'RNA'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-[#06255b] dark:text-[#0b6ecb] mb-3 flex items-center gap-2">
            <Info size={18} />
            <span>Uygulama ne gösterir?</span>
          </h3>
          <ul className="list-disc pl-5 text-sm text-slate-650 dark:text-slate-350 space-y-2 font-medium">
            <li>DNA ve RNA füzyon genleri yazdıkça anlık filtrelenir.</li>
            <li>Panel ve kanser türü filtresiyle gen listesi pratik olarak daraltılabilir.</li>
            <li>Gen adına tıklanınca hangi panelde yer aldığı ve kısa klinik bilgi açılır.</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-[#06255b] dark:text-[#0b6ecb] mb-3 flex items-center gap-2">
            <Info size={18} />
            <span>Raporlama mantığı</span>
          </h3>
          <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
            <b>DNA paneli</b> geniş genomik profilleme, TMB, MSI ve HRD değerlendirmesi için; <b>RNA füzyon paneli</b> ise füzyon / yeniden düzenlenme analizi için ayrı yorumlanır.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-[#06255b] dark:text-[#0b6ecb] mb-3 flex items-center gap-2">
            <Info size={18} />
            <span>TMB / MSI / HRD nedir?</span>
          </h3>
          <ul className="list-disc pl-5 text-sm text-slate-650 dark:text-slate-350 space-y-2 font-medium">
            <li><b>TMB:</b> Tümördeki mutasyon yükünü gösterir; immünoterapi uygunluğu açısından yardımcı olabilir.</li>
            <li><b>MSI:</b> Mikrosatellit instabilitesini gösterir; MMR bozukluğu ve immünoterapi yanıtı ile ilişkilidir.</li>
            <li><b>HRD:</b> Homolog rekombinasyon yetersizliğini gösterir; DNA tamir kusuru ve PARP inhibitörü seçenekleri açısından önemlidir.</li>
          </ul>
        </div>
      </div>

      {/* Notice Card */}
      <div className="border-l-4 border-teal-500 bg-teal-50 dark:bg-teal-950/20 rounded-2xl p-4 mb-6 shadow-sm">
        <span className="font-extrabold text-teal-800 dark:text-teal-450 block text-sm">Not</span>
        <p className="text-sm text-teal-900/90 dark:text-teal-100/90 mt-1 font-medium leading-relaxed">
          Kanser türü filtresi yalnızca listeyi pratik olarak daraltmak için kullanılır. Gen bilgi kartlarında organ odak listeleri gösterilmez; kartlarda genin hangi panelde yer aldığı ve klinik bilgi verilir.
        </p>
      </div>

      {/* Panel Approach Note */}
      <div className="border border-cyan-500/20 border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-2xl p-5 mb-8 shadow-sm">
        <span className="font-extrabold text-cyan-800 dark:text-cyan-405 block text-sm uppercase tracking-wider">Panel yaklaşımı:</span>
        <p className="text-sm text-cyan-900/90 dark:text-cyan-100/90 mt-1.5 font-medium leading-relaxed">
          Pan-Kanser DNA Paneli tüm uygun tümör örneklerinde aynı geniş panel yaklaşımıyla çalışılır; panel kapsamındaki 679 DNA geni birlikte değerlendirilir. Tümör tipi ayrı bir DNA paneli seçimi için değil, rapor yorumunda klinik önceliklendirme için kullanılır.
        </p>
      </div>

      {/* External Link Footer */}
      <div className="text-center py-6 border-t border-slate-200 dark:border-slate-700/50 mt-10">
        <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
          Panel içerikleri:{' '}
          <a
            href="https://metinciris.github.io/sdu_panel/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-650 hover:text-sky-700 dark:text-sky-405 dark:hover:text-sky-350 hover:underline font-extrabold"
          >
            metinciris.github.io/sdu_panel/
          </a>
        </span>
      </div>

      {/* Gene Details Modal */}
      {selectedGene && modalDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-100 dark:border-slate-750">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#06255b] to-[#0ea5a5] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-black">{selectedGene}</h2>
              <button
                onClick={() => setSelectedGene(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {modalDetails.inDNA && (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200/50">
                    Pan-Kanser DNA Paneli
                  </span>
                )}
                {modalDetails.inRNA && (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-200/50">
                    RNA Füzyon Paneli
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hangi Panelde?</h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{modalDetails.panelText}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kısa Klinik Bilgi</h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{modalDetails.info}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Raporlama Yaklaşımı</h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{modalDetails.reportText}</p>
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedGene(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 text-sm font-bold transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

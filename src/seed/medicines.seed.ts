import { Medicine } from '../models/Medicine';
import { logger } from '../utils/logger';

const medicines = [
  // Pain & Fever
  { name: 'Panadol 500mg', genericName: 'Paracetamol', category: 'Pain & Fever', requiresPrescription: false, description: 'Pain reliever and fever reducer' },
  { name: 'Panadol Extra', genericName: 'Paracetamol + Caffeine', category: 'Pain & Fever', requiresPrescription: false, description: 'Enhanced pain relief' },
  { name: 'Brufen 400mg', genericName: 'Ibuprofen', category: 'Pain & Fever', requiresPrescription: false, description: 'Anti-inflammatory pain reliever' },
  { name: 'Brufen 600mg', genericName: 'Ibuprofen', category: 'Pain & Fever', requiresPrescription: false, description: 'Anti-inflammatory pain reliever' },
  { name: 'Cataflam 50mg', genericName: 'Diclofenac Potassium', category: 'Pain & Fever', requiresPrescription: false, description: 'Anti-inflammatory and analgesic' },
  { name: 'Voltaren 75mg', genericName: 'Diclofenac Sodium', category: 'Pain & Fever', requiresPrescription: true, description: 'Anti-inflammatory injection' },
  { name: 'Ketofan 25mg', genericName: 'Ketoprofen', category: 'Pain & Fever', requiresPrescription: false, description: 'Pain reliever' },
  { name: 'Aspirin 100mg', genericName: 'Acetylsalicylic Acid', category: 'Pain & Fever', requiresPrescription: false, description: 'Blood thinner and pain reliever' },

  // Antibiotics
  { name: 'Augmentin 1g', genericName: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotics', requiresPrescription: true, description: 'Broad-spectrum antibiotic' },
  { name: 'Augmentin 625mg', genericName: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotics', requiresPrescription: true, description: 'Broad-spectrum antibiotic' },
  { name: 'Amoxil 500mg', genericName: 'Amoxicillin', category: 'Antibiotics', requiresPrescription: true, description: 'Penicillin antibiotic' },
  { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotics', requiresPrescription: true, description: 'Macrolide antibiotic' },
  { name: 'Cipro 500mg', genericName: 'Ciprofloxacin', category: 'Antibiotics', requiresPrescription: true, description: 'Fluoroquinolone antibiotic' },
  { name: 'Flagyl 500mg', genericName: 'Metronidazole', category: 'Antibiotics', requiresPrescription: true, description: 'Antibiotic and antiprotozoal' },
  { name: 'Cefotrix 1g', genericName: 'Ceftriaxone', category: 'Antibiotics', requiresPrescription: true, description: 'Cephalosporin antibiotic' },
  { name: 'Klacid 500mg', genericName: 'Clarithromycin', category: 'Antibiotics', requiresPrescription: true, description: 'Macrolide antibiotic' },

  // Gastrointestinal
  { name: 'Nexium 40mg', genericName: 'Esomeprazole', category: 'Gastrointestinal', requiresPrescription: false, description: 'Proton pump inhibitor' },
  { name: 'Controloc 40mg', genericName: 'Pantoprazole', category: 'Gastrointestinal', requiresPrescription: false, description: 'Proton pump inhibitor' },
  { name: 'Antinal 200mg', genericName: 'Nifuroxazide', category: 'Gastrointestinal', requiresPrescription: false, description: 'Intestinal antiseptic' },
  { name: 'Motilium 10mg', genericName: 'Domperidone', category: 'Gastrointestinal', requiresPrescription: false, description: 'Anti-nausea and motility agent' },
  { name: 'Buscopan 10mg', genericName: 'Hyoscine Butylbromide', category: 'Gastrointestinal', requiresPrescription: false, description: 'Antispasmodic' },
  { name: 'Gaviscon', genericName: 'Alginate + Antacid', category: 'Gastrointestinal', requiresPrescription: false, description: 'Antacid for heartburn' },

  // Allergy & Respiratory
  { name: 'Telfast 180mg', genericName: 'Fexofenadine', category: 'Allergy', requiresPrescription: false, description: 'Non-drowsy antihistamine' },
  { name: 'Zyrtec 10mg', genericName: 'Cetirizine', category: 'Allergy', requiresPrescription: false, description: 'Antihistamine' },
  { name: 'Claritine 10mg', genericName: 'Loratadine', category: 'Allergy', requiresPrescription: false, description: 'Non-drowsy antihistamine' },
  { name: 'Ventolin Inhaler', genericName: 'Salbutamol', category: 'Respiratory', requiresPrescription: true, description: 'Bronchodilator inhaler' },
  { name: 'Sinlerg 10mg', genericName: 'Montelukast', category: 'Respiratory', requiresPrescription: true, description: 'Leukotriene receptor antagonist' },

  // Cardiovascular
  { name: 'Concor 5mg', genericName: 'Bisoprolol', category: 'Cardiovascular', requiresPrescription: true, description: 'Beta-blocker' },
  { name: 'Crestor 10mg', genericName: 'Rosuvastatin', category: 'Cardiovascular', requiresPrescription: true, description: 'Statin for cholesterol' },
  { name: 'Plavix 75mg', genericName: 'Clopidogrel', category: 'Cardiovascular', requiresPrescription: true, description: 'Antiplatelet agent' },
  { name: 'Tritace 5mg', genericName: 'Ramipril', category: 'Cardiovascular', requiresPrescription: true, description: 'ACE inhibitor' },

  // Diabetes
  { name: 'Glucophage 500mg', genericName: 'Metformin', category: 'Diabetes', requiresPrescription: true, description: 'Oral antidiabetic' },
  { name: 'Glucophage 1000mg', genericName: 'Metformin', category: 'Diabetes', requiresPrescription: true, description: 'Oral antidiabetic' },
  { name: 'Amaryl 2mg', genericName: 'Glimepiride', category: 'Diabetes', requiresPrescription: true, description: 'Sulfonylurea antidiabetic' },
  { name: 'Januvia 100mg', genericName: 'Sitagliptin', category: 'Diabetes', requiresPrescription: true, description: 'DPP-4 inhibitor' },

  // Vitamins & Supplements
  { name: 'Centrum Silver', genericName: 'Multivitamin', category: 'Vitamins', requiresPrescription: false, description: 'Complete multivitamin' },
  { name: 'Vitamin C 1000mg', genericName: 'Ascorbic Acid', category: 'Vitamins', requiresPrescription: false, description: 'Immune support' },
  { name: 'Vitamin D3 1000 IU', genericName: 'Cholecalciferol', category: 'Vitamins', requiresPrescription: false, description: 'Bone health support' },
  { name: 'Calcium D3', genericName: 'Calcium + Vitamin D3', category: 'Vitamins', requiresPrescription: false, description: 'Bone health' },
  { name: 'Omega 3', genericName: 'Fish Oil', category: 'Vitamins', requiresPrescription: false, description: 'Heart health supplement' },
  { name: 'Iron Supplement', genericName: 'Ferrous Sulfate', category: 'Vitamins', requiresPrescription: false, description: 'Iron deficiency treatment' },

  // Cough & Cold
  { name: 'Comtrex', genericName: 'Paracetamol + Pseudoephedrine + Chlorpheniramine', category: 'Cough & Cold', requiresPrescription: false, description: 'Cold and flu relief' },
  { name: 'Congestal', genericName: 'Paracetamol + Pseudoephedrine + Chlorpheniramine', category: 'Cough & Cold', requiresPrescription: false, description: 'Cold and flu relief' },
  { name: 'Prospan', genericName: 'Ivy Leaf Extract', category: 'Cough & Cold', requiresPrescription: false, description: 'Herbal cough syrup' },
  { name: 'Selgon', genericName: 'Pipazethate', category: 'Cough & Cold', requiresPrescription: false, description: 'Cough suppressant' },

  // Dermatology
  { name: 'Fucidin Cream', genericName: 'Fusidic Acid', category: 'Dermatology', requiresPrescription: false, description: 'Topical antibiotic' },
  { name: 'Betadine', genericName: 'Povidone-Iodine', category: 'Dermatology', requiresPrescription: false, description: 'Antiseptic solution' },
  { name: 'Panthenol Cream', genericName: 'Dexpanthenol', category: 'Dermatology', requiresPrescription: false, description: 'Skin repair cream' },
];

export const seedMedicines = async (): Promise<void> => {
  try {
    const count = await Medicine.countDocuments();
    if (count > 0) {
      logger.info(`Medicine catalog already has ${count} items. Skipping seed.`);
      return;
    }

    await Medicine.insertMany(medicines);
    logger.info(`Seeded ${medicines.length} medicines to catalog.`);
  } catch (error) {
    logger.error('Medicine seed error:', error);
  }
};

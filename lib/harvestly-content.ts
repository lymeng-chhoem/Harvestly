export type Language = "km" | "en";
export type LocalizedText = Record<Language, string>;
export type RiskLevel = "high" | "medium" | "low";
export type CropId = "rice" | "cassava" | "unknown";
export type NavIcon = "home" | "analyze" | "history" | "guide" | "community" | "settings";

export type NavItem = { href: string; icon: NavIcon; label: LocalizedText };
export type Disease = {
  id: string;
  crop: LocalizedText;
  name: LocalizedText;
  symptoms: LocalizedText;
  risk: RiskLevel;
  demoPercentage: number;
  imageClass: string;
};
export type GuideStep = { title: LocalizedText; body: LocalizedText };
export type ReadinessGuide = { label: LocalizedText; percentage: number };
export type PhotoTip = { title: LocalizedText; body: LocalizedText };
export type ModelAnalysisResponse = {
  cropId: CropId;
  conditionCode: string;
  confidence: number;
  risk: RiskLevel;
};
export type ProductRecommendation = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  imageSrc: string;
  priceRiel: number;
};
export type StoredScanRecord = ModelAnalysisResponse & {
  id: string;
  createdAt: string;
  crop: LocalizedText;
  finding: LocalizedText;
  summary: LocalizedText;
  actions: LocalizedText[];
  details?: LocalizedText;
  treatment?: LocalizedText[];
  recommendedProducts?: ProductRecommendation[];
  unrecognizedCondition: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", icon: "home", label: { km: "ទំព័រដើម", en: "Home" } },
  { href: "/analyze", icon: "analyze", label: { km: "ពិនិត្យដំណាំ", en: "Analyze" } },
  { href: "/history", icon: "history", label: { km: "ប្រវត្តិ", en: "History" } },
  { href: "/guide", icon: "guide", label: { km: "ការណែនាំ", en: "Guide" } },
  { href: "/community", icon: "community", label: { km: "សហគមន៍", en: "Community" } },
  { href: "/settings", icon: "settings", label: { km: "ការកំណត់", en: "Settings" } },
];

export const diseases: Disease[] = [
  {
    id: "brown-spot",
    crop: { km: "ស្រូវ", en: "Rice" },
    name: { km: "ជំងឺចំណុចត្នោត", en: "Brown Spot" },
    symptoms: { km: "ស្នាមមូលពណ៌ត្នោតលើស្លឹក", en: "Round brown lesions on leaves" },
    risk: "high",
    demoPercentage: 76,
    imageClass: "leaf-brown",
  },
  {
    id: "cassava-blight",
    crop: { km: "ដំឡូងមី", en: "Cassava" },
    name: { km: "ជំងឺស្លឹករលួយ", en: "Bacterial Blight" },
    symptoms: { km: "ស្លឹកស្វិត និងមានចំណុចជ្រាបទឹក", en: "Wilted leaves with water-soaked spots" },
    risk: "medium",
    demoPercentage: 48,
    imageClass: "leaf-cassava",
  },
  {
    id: "rice-blast",
    crop: { km: "ស្រូវ", en: "Rice" },
    name: { km: "ជំងឺប្លាស្តស្រូវ", en: "Rice Blast" },
    symptoms: { km: "ស្នាមរាងពេជ្រលើស្លឹក និងកួរ", en: "Diamond lesions on leaves and panicles" },
    risk: "high",
    demoPercentage: 81,
    imageClass: "leaf-rice",
  },
];

export const guideSteps: GuideStep[] = [
  {
    title: { km: "ថតរូបស្លឹក", en: "Photograph the leaf" },
    body: { km: "ថតស្លឹកដែលមានរោគឱ្យច្បាស់ ក្នុងពន្លឺធម្មជាតិ។", en: "Capture a clear affected leaf in natural light." },
  },
  {
    title: { km: "ពិនិត្យការណែនាំ", en: "Review guidance" },
    body: { km: "អានកម្រិតហានិភ័យ និងជំហានបន្ទាប់ដោយប្រុងប្រយ័ត្ន។", en: "Read the risk level and immediate next steps carefully." },
  },
  {
    title: { km: "ស្វែងរកជំនួយ", en: "Seek local help" },
    body: { km: "ពិគ្រោះមន្ត្រីកសិកម្ម មុនប្រើថ្នាំព្យាបាល។", en: "Consult an agricultural officer before applying treatment." },
  },
];

export const scanReadiness: ReadinessGuide[] = [
  { label: { km: "ស្លឹកមើលឃើញច្បាស់", en: "Leaf clearly visible" }, percentage: 92 },
  { label: { km: "ពន្លឺធម្មជាតិគ្រប់គ្រាន់", en: "Natural daylight" }, percentage: 86 },
  { label: { km: "ថតជិតរោគសញ្ញា", en: "Close symptom framing" }, percentage: 78 },
];

export const photoGuidance = {
  eyebrow: { km: "មុនពិនិត្យ", en: "Before analysis" },
  title: { km: "ថតឱ្យច្បាស់ ដើម្បីទទួលលទ្ធផលល្អ", en: "Get a clearer result" },
  support: {
    km: "រូបថតច្បាស់ជួយឱ្យការណែនាំមានប្រយោជន៍ជាងមុន។",
    en: "A focused, well-lit photo makes the guidance more useful.",
  },
  avoidLabel: { km: "ជៀសវាង", en: "Avoid" },
  avoid: {
    km: "រូបព្រិល ឆ្ងាយពេក ឬមានស្លឹកច្រើនរុំគ្នាក្នុងរូបតែមួយ។",
    en: "Blurry, distant, or crowded photos with many overlapping leaves.",
  },
};

export const photoTips: PhotoTip[] = [
  {
    title: { km: "ប្រើពន្លឺធម្មជាតិ", en: "Use natural daylight" },
    body: { km: "ថតនៅកន្លែងភ្លឺ ហើយជៀសវាងស្រមោលខ្មៅលើស្លឹក។", en: "Photograph in clear light and avoid heavy shadows on the leaf." },
  },
  {
    title: { km: "ថតស្លឹកដែលមានបញ្ហាមួយ", en: "Frame one affected leaf" },
    body: { km: "ដាក់ស្លឹក ឬដើមដែលមានរោគសញ្ញាឱ្យពេញផ្ទៃរូប។", en: "Fill the frame with one affected leaf or stem." },
  },
  {
    title: { km: "រក្សាកាមេរ៉ាឱ្យនឹង", en: "Hold the camera steady" },
    body: { km: "ពិនិត្យថាស្នាម ឬចំណុចលើស្លឹកមើលឃើញច្បាស់។", en: "Make sure spots or damaged areas are sharply in focus." },
  },
  {
    title: { km: "ថតបន្ថែមបើរោគសញ្ញាខុសគ្នា", en: "Capture different symptoms" },
    body: { km: "បើស្លឹកផ្សេងមានសញ្ញាខុសគ្នា សូមថតរូបបន្ថែមមួយទៀត។", en: "Take another photo if symptoms differ across the plant." },
  },
];

type ConditionContent = Pick<StoredScanRecord, "finding" | "summary" | "actions" | "details" | "treatment" | "recommendedProducts">;

const cropLabels: Record<CropId, LocalizedText> = {
  rice: { km: "ស្រូវ", en: "Rice" },
  cassava: { km: "ដំឡូងមី", en: "Cassava" },
  unknown: { km: "ដំណាំមិនទាន់ស្គាល់", en: "Unidentified crop" },
};

const sharedSafetyAction: LocalizedText = {
  km: "កុំប្រើថ្នាំភ្លាមៗ រហូតដល់មានការបញ្ជាក់ពីមន្ត្រីកសិកម្ម ឬអ្នកជំនាញ។",
  en: "Do not apply chemicals until an agricultural officer or expert confirms the issue.",
};

const conditionCatalog: Record<string, ConditionContent> = {
  rice_brown_spot: {
    finding: { km: "អាចជាជំងឺចំណុចត្នោត", en: "Likely Brown Spot" },
    summary: { km: "ស្លឹកអាចមានស្នាមមូលពណ៌ត្នោត ដែលត្រូវផ្ទៀងផ្ទាត់បន្ថែមនៅវាល។", en: "The leaf may show round brown lesions that should be confirmed in the field." },
    actions: [
      sharedSafetyAction,
      { km: "ថតរូបស្លឹកបន្ថែមពីរឬបីសន្លឹក និងរក្សាសំណាក។", en: "Capture two or three additional leaves and retain a sample." },
      { km: "ទាក់ទងមន្ត្រីកសិកម្ម ប្រសិនបើស្នាមរាលដាលលឿន។", en: "Contact an agricultural officer if spots spread quickly." },
    ],
  },
  rice_blast: {
    finding: { km: "អាចជាជំងឺប្លាស្តស្រូវ", en: "Likely Rice Blast" },
    summary: { km: "ស្លឹកអាចមានស្នាមរាងពេជ្រ ដែលត្រូវពិនិត្យបន្ថែមលើដំណាំជិតខាង។", en: "The leaf may show diamond-shaped lesions that require checking nearby plants." },
    details: {
      km: "ប្លាស្តស្រូវជាជំងឺផ្សិតដែលរាលដាលលឿនពេលអាកាសសើម ឬវាលមានខ្យល់ចេញចូលតិច។ វាបង្កស្នាមរាងពេជ្រលើស្លឹក ហើយអាចប៉ះពាល់ដល់កួរនិងទិន្នផល ប្រសិនបើមិនពិនិត្យ និងគ្រប់គ្រងឆាប់ៗ។",
      en: "Rice Blast is a fungal rice disease that can spread quickly in humid weather or fields with poor airflow. It often creates diamond-shaped leaf lesions and can affect panicles and yield if the field is not checked and managed early.",
    },
    treatment: [
      {
        km: "បញ្ជាក់ជាមួយមន្ត្រីកសិកម្ម ឬអ្នកជំនាញក្នុងតំបន់ មុនពេលប្រើថ្នាំបាញ់។",
        en: "Confirm the diagnosis with an agricultural officer or local expert before spraying.",
      },
      {
        km: "កាត់បន្ថយការប្រើជីអាសូតច្រើនពេក ព្រោះស្លឹកទន់ងាយឲ្យជំងឺរាលដាល។",
        en: "Avoid excess nitrogen because soft leaf growth can make disease spread faster.",
      },
      {
        km: "ធ្វើឲ្យវាលមានខ្យល់ចេញចូលល្អ និងគ្រប់គ្រងទឹកកុំឲ្យសើមជាប់យូរ។",
        en: "Improve field airflow and water management so the crop does not stay wet for long periods.",
      },
      {
        km: "យកផ្នែកដំណាំដែលឆ្លងខ្លាំងចេញពីវាល ហើយកុំទុកសំណល់ជំងឺនៅជិតស្រូវសុខភាពល្អ។",
        en: "Remove heavily infected plant matter and keep diseased residue away from healthy rice.",
      },
      {
        km: "ប្រើថ្នាំសម្លាប់ផ្សិតសម្រាប់ប្លាស្តស្រូវតែបន្ទាប់ពីបានបញ្ជាក់ ហើយអនុវត្តតាមស្លាកផលិតផល។",
        en: "Use a labeled rice blast fungicide only after confirmation, following the product label.",
      },
      {
        km: "ពិនិត្យវាលម្តងទៀតក្រោយ ៥-៧ ថ្ងៃ ដើម្បីមើលថារីករាលដាលបន្តឬទេ។",
        en: "Recheck the field after 5-7 days to see whether symptoms are still spreading.",
      },
    ],
    recommendedProducts: [
      {
        id: "khmer-crop-aquaponic",
        name: { km: "Khmer Crop 2-in-1 Aquaponic Nutrient", en: "Khmer Crop 2-in-1 Aquaponic Nutrient" },
        description: {
          km: "ជីបំប៉នពី fish emulsion និងរុក្ខជាតិ សម្រាប់ជួយស្តារស្លឹកស្រូវក្រោយមានសម្ពាធជំងឺ។",
          en: "Fish emulsion and botanical nutrient support for rice leaf recovery after disease stress.",
        },
        imageSrc: "/images/demo-products/Gemini_Generated_Image_1avrrp1avrrp1avr.png",
        priceRiel: 58000,
      },
      {
        id: "mekong-vital-agro-serum",
        name: { km: "Mekong Vital Agro Disease Shield", en: "Mekong Vital Agro Disease Shield" },
        description: {
          km: "សេរ៉ូម bio-nutrient សម្រាប់គាំទ្រការពារស្លឹក និងកាត់បន្ថយការរាលដាលរោគសញ្ញាដំបូង។",
          en: "Bio-nutrient serum that supports leaf defense and early symptom control.",
        },
        imageSrc: "/images/demo-products/Gemini_Generated_Image_rd8ww7rd8ww7rd8w.png",
        priceRiel: 48000,
      },
      {
        id: "green-phnom-restorative",
        name: { km: "Green Phnom Bio-Restorative Fertilizer", en: "Green Phnom Bio-Restorative Fertilizer" },
        description: {
          km: "ជីស្តារដំណាំ និងជំនួយការពារផ្សិត សម្រាប់ស្រូវដែលស្លឹកខ្សោយក្រោយជំងឺ។",
          en: "Restorative fertilizer and fungal-defense support for weakened rice leaves.",
        },
        imageSrc: "/images/demo-products/Gemini_Generated_Image_f57omzf57omzf57o.png",
        priceRiel: 52000,
      },
      {
        id: "mekong-vital-organic-control",
        name: { km: "Mekong Vital Organic Disease Control", en: "Mekong Vital Organic Disease Control" },
        description: {
          km: "ផលិតផល 2-in-1 សម្រាប់បំប៉នស្រូវ និងគាំទ្រការគ្រប់គ្រងជំងឺពេលមានហានិភ័យប្លាស្ត។",
          en: "2-in-1 nutrition and disease-control support for rice under blast pressure.",
        },
        imageSrc: "/images/demo-products/Gemini_Generated_Image_8rob248rob248rob.png",
        priceRiel: 62000,
      },
      {
        id: "phnom-crop-defense-booster",
        name: { km: "Phnom Crop Natural Defense Booster", en: "Phnom Crop Natural Defense Booster" },
        description: {
          km: "ជីបំប៉នធម្មជាតិ សម្រាប់ជួយដំណាំខ្សោយឲ្យរឹងមាំ មុននិងក្រោយការគ្រប់គ្រងជំងឺ។",
          en: "Natural crop defense and fertility booster for weak plants before and after treatment.",
        },
        imageSrc: "/images/demo-products/Gemini_Generated_Image_dck3cdck3cdck3cd.png",
        priceRiel: 39000,
      },
      {
        id: "kromor-earth-organic",
        name: { km: "Kromor Earth Organic 2-in-1", en: "Kromor Earth Organic 2-in-1" },
        description: {
          km: "ជីសរីរាង្គ 2-in-1 សម្រាប់បំប៉នស្រូវ និងគាំទ្រការពារពេលមានសម្ពាធជំងឺស្លឹក។",
          en: "Organic 2-in-1 crop nutrition and protection support during leaf disease pressure.",
        },
        imageSrc: "/images/demo-products/Gemini_Generated_Image_9ped869ped869ped.png",
        priceRiel: 44000,
      },
    ],
    actions: [
      sharedSafetyAction,
      { km: "ពិនិត្យស្លឹក និងកួរនៅជិតខាងថាមានស្នាមដូចគ្នាឬទេ។", en: "Check nearby leaves and panicles for similar markings." },
      { km: "ស្វែងរកជំនួយក្នុងតំបន់ ប្រសិនបើរោគសញ្ញារាលដាល។", en: "Seek local support if symptoms appear to be spreading." },
    ],
  },
  cassava_bacterial_blight: {
    finding: { km: "អាចជាជំងឺស្លឹករលួយ", en: "Likely Bacterial Blight" },
    summary: { km: "ស្លឹកអាចមានសភាពស្វិត និងចំណុចជ្រាបទឹក ដែលត្រូវផ្ទៀងផ្ទាត់ដោយអ្នកជំនាញ។", en: "The leaf may show wilting and water-soaked spots requiring expert confirmation." },
    actions: [
      sharedSafetyAction,
      { km: "រក្សាសំណាកស្លឹក និងថតដើមដែលមានបញ្ហាបន្ថែម។", en: "Retain a leaf sample and photograph affected stems as well." },
      { km: "ទាក់ទងមន្ត្រីកសិកម្ម ប្រសិនបើដើមច្រើនមានរោគសញ្ញា។", en: "Contact an agricultural officer if several plants show symptoms." },
    ],
  },
};

const unknownCondition: ConditionContent = {
  finding: { km: "អាចមានបញ្ហាដំណាំដែលត្រូវផ្ទៀងផ្ទាត់", en: "Possible crop issue requiring review" },
  summary: { km: "ប្រព័ន្ធបានឃើញសញ្ញាមិនប្រក្រតី ប៉ុន្តែមិនអាចកំណត់ប្រភេទជំងឺដោយប្រាកដបានទេ។", en: "The scanner detected a possible concern but could not identify a supported condition with confidence." },
  actions: [
    sharedSafetyAction,
    { km: "ថតរូបច្បាស់បន្ថែមពីស្លឹក ឬដើមដែលមានបញ្ហា។", en: "Capture additional clear photos of affected leaves or stems." },
    { km: "សូមពិគ្រោះមន្ត្រីកសិកម្មដើម្បីកំណត់បញ្ហា។", en: "Consult an agricultural officer to identify the issue." },
  ],
};

export function isModelAnalysisResponse(value: unknown): value is ModelAnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<ModelAnalysisResponse>;
  return (
    (response.cropId === "rice" || response.cropId === "cassava" || response.cropId === "unknown") &&
    typeof response.conditionCode === "string" &&
    response.conditionCode.length > 0 &&
    response.conditionCode.length <= 100 &&
    typeof response.confidence === "number" &&
    Number.isFinite(response.confidence) &&
    response.confidence >= 0 &&
    response.confidence <= 1 &&
    (response.risk === "high" || response.risk === "medium" || response.risk === "low")
  );
}

export function createStoredScanRecord(
  response: ModelAnalysisResponse,
  stored?: { id?: string; createdAt?: string },
): StoredScanRecord {
  const content = conditionCatalog[response.conditionCode] ?? unknownCondition;
  return {
    ...response,
    id: stored?.id ?? globalThis.crypto.randomUUID(),
    createdAt: stored?.createdAt ?? new Date().toISOString(),
    crop: cropLabels[response.cropId],
    ...content,
    unrecognizedCondition: !(response.conditionCode in conditionCatalog),
  };
}

export function localize(value: LocalizedText, language: Language): string {
  return value[language];
}

export function confidenceText(confidence: number, language: Language): string {
  const percentage = new Intl.NumberFormat(language === "km" ? "km-KH" : "en", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(confidence);
  return language === "km" ? `ភាពជឿជាក់ ${percentage}` : `Confidence ${percentage}`;
}

export function scanDateText(createdAt: string, language: Language): string {
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

export function riskText(risk: RiskLevel, language: Language): string {
  const labels: Record<RiskLevel, LocalizedText> = {
    high: { km: "ហានិភ័យខ្ពស់", en: "High Risk" },
    medium: { km: "ហានិភ័យមធ្យម", en: "Medium Risk" },
    low: { km: "ហានិភ័យទាប", en: "Low Risk" },
  };
  return labels[risk][language];
}

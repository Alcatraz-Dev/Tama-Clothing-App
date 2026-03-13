import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Ruler,
  User,
  Users,
  Baby,
  Footprints,
  Info,
  ArrowRight,
  Calculator,
  CheckCircle,
  Lightbulb,
} from "lucide-react-native";
import { Theme } from "../theme";

const { width: W } = Dimensions.get("window");

interface SizeGuideScreenProps {
  onBack: () => void;
  t: (key: string) => string;
  theme: "light" | "dark";
  language?: "fr" | "en" | "ar";
}

// ─── Size Data ────────────────────────────────────────────────────────────────
const WOMEN_SIZES = [
  { size: "XS",  fr: "34/36", bust: [80, 84],  waist: [60, 64],  hips: [86, 90]  },
  { size: "S",   fr: "36/38", bust: [84, 88],  waist: [64, 68],  hips: [90, 94]  },
  { size: "M",   fr: "38/40", bust: [88, 92],  waist: [68, 72],  hips: [94, 98]  },
  { size: "L",   fr: "40/42", bust: [92, 96],  waist: [72, 76],  hips: [98, 102] },
  { size: "XL",  fr: "42/44", bust: [96, 100], waist: [76, 80],  hips: [102, 106]},
  { size: "XXL", fr: "44/46", bust: [100, 106],waist: [80, 86],  hips: [106, 112]},
];

const MEN_SIZES = [
  { size: "XS",  fr: "44/46", chest: [82, 86],  waist: [70, 74],  hips: [88, 92]  },
  { size: "S",   fr: "46/48", chest: [86, 90],  waist: [74, 78],  hips: [92, 96]  },
  { size: "M",   fr: "48/50", chest: [90, 94],  waist: [78, 82],  hips: [96, 100] },
  { size: "L",   fr: "50/52", chest: [94, 98],  waist: [82, 86],  hips: [100, 104]},
  { size: "XL",  fr: "52/54", chest: [98, 102], waist: [86, 90],  hips: [104, 108]},
  { size: "XXL", fr: "54/56", chest: [102, 108],waist: [90, 96],  hips: [108, 114]},
];

const KIDS_SIZES_DATA = [
  { size: "3–4",  height: [98,  104], chest: [55, 57], waist: [51, 53] },
  { size: "4–5",  height: [104, 110], chest: [57, 59], waist: [53, 55] },
  { size: "5–6",  height: [110, 116], chest: [59, 61], waist: [55, 57] },
  { size: "6–8",  height: [116, 128], chest: [61, 65], waist: [57, 60] },
  { size: "8–10", height: [128, 140], chest: [65, 69], waist: [60, 64] },
  { size: "10–12",height: [140, 152], chest: [69, 73], waist: [64, 68] },
];

const SHOE_SIZES = [
  { eu: "36", fr_uk: "3.5", us_w: "6",    us_m: "4.5", cm: "22.5" },
  { eu: "37", fr_uk: "4",   us_w: "6.5",  us_m: "5",   cm: "23"   },
  { eu: "38", fr_uk: "5",   us_w: "7.5",  us_m: "6",   cm: "24"   },
  { eu: "39", fr_uk: "5.5", us_w: "8",    us_m: "6.5", cm: "24.5" },
  { eu: "40", fr_uk: "6.5", us_w: "9",    us_m: "7.5", cm: "25.5" },
  { eu: "41", fr_uk: "7",   us_w: "9.5",  us_m: "8",   cm: "26"   },
  { eu: "42", fr_uk: "8",   us_w: "10.5", us_m: "9",   cm: "26.5" },
  { eu: "43", fr_uk: "9",   us_w: "11.5", us_m: "10",  cm: "27.5" },
  { eu: "44", fr_uk: "9.5", us_w: "12",   us_m: "10.5",cm: "28"   },
  { eu: "45", fr_uk: "10.5",us_w: "13",   us_m: "11.5",cm: "29"   },
];

// ─── Display helpers ─────────────────────────────────────────────────────────
const rng = (r: number[], unit: "cm" | "in") =>
  unit === "cm"
    ? `${r[0]}–${r[1]}`
    : `${(r[0] / 2.54).toFixed(1)}–${(r[1] / 2.54).toFixed(1)}`;

type Category = "women" | "men" | "kids" | "shoes" | "calc" | "tips";
type CalcGender = "women" | "men" | "kids";

// ─── Size Calculator logic ────────────────────────────────────────────────────
function calcWomenSize(bust: number, waist: number, hips: number): string {
  for (const row of WOMEN_SIZES) {
    const bOk = bust >= row.bust[0]  && bust <= row.bust[1];
    const wOk = waist >= row.waist[0] && waist <= row.waist[1];
    const hOk = hips >= row.hips[0]  && hips <= row.hips[1];
    if ([bOk, wOk, hOk].filter(Boolean).length >= 2) return row.size;
  }
  let best = WOMEN_SIZES[0]; let bestDiff = Infinity;
  for (const row of WOMEN_SIZES) {
    const mid = (row.bust[0] + row.bust[1]) / 2;
    if (Math.abs(mid - bust) < bestDiff) { bestDiff = Math.abs(mid - bust); best = row; }
  }
  return best.size;
}

function calcMenSize(chest: number, waist: number, hips: number): string {
  for (const row of MEN_SIZES) {
    const cOk = chest >= row.chest[0] && chest <= row.chest[1];
    const wOk = waist >= row.waist[0] && waist <= row.waist[1];
    const hOk = hips >= row.hips[0]  && hips <= row.hips[1];
    if ([cOk, wOk, hOk].filter(Boolean).length >= 2) return row.size;
  }
  let best = MEN_SIZES[0]; let bestDiff = Infinity;
  for (const row of MEN_SIZES) {
    const mid = (row.chest[0] + row.chest[1]) / 2;
    if (Math.abs(mid - chest) < bestDiff) { bestDiff = Math.abs(mid - chest); best = row; }
  }
  return best.size;
}

function calcKidsSize(height: number, chest: number): string {
  for (const row of KIDS_SIZES_DATA) {
    const hOk = height >= row.height[0] && height <= row.height[1];
    const cOk = chest  >= row.chest[0]  && chest  <= row.chest[1];
    if (hOk || cOk) return row.size;
  }
  let best = KIDS_SIZES_DATA[0]; let bestDiff = Infinity;
  for (const row of KIDS_SIZES_DATA) {
    const mid = (row.height[0] + row.height[1]) / 2;
    if (Math.abs(mid - height) < bestDiff) { bestDiff = Math.abs(mid - height); best = row; }
  }
  return best.size;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function SizeGuideScreen({ onBack, t, theme, language = "fr" }: SizeGuideScreenProps) {
  const isDark = theme === "dark";
  const colors = isDark ? Theme.dark.colors : Theme.light.colors;
  const insets = useSafeAreaInsets();

  const accent   = colors.foreground;
  const accentFg = colors.primaryForeground;

  const [activeCategory, setActiveCategory] = useState<Category>("women");
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Calculator state
  const [calcGender, setCalcGender] = useState<CalcGender>("women");
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const calcResultAnim = useRef(new Animated.Value(0)).current;

  const CATEGORIES = [
    { id: "women",  label: t("sgWomen"),        icon: User       },
    { id: "men",    label: t("sgMen"),           icon: Users      },
    { id: "kids",   label: t("sgKids"),          icon: Baby       },
    { id: "shoes",  label: t("sgShoes"),         icon: Footprints },
    { id: "calc",   label: t("sgCalculator"),    icon: Calculator },
    { id: "tips",   label: t("sgMeasurements"),  icon: Ruler      },
  ];

  const TIPS_DATA = [
    { titleKey: "sgTipBust",   descKey: "sgTipBustDesc"   },
    { titleKey: "sgTipWaist",  descKey: "sgTipWaistDesc"  },
    { titleKey: "sgTipHips",   descKey: "sgTipHipsDesc"   },
    { titleKey: "sgTipHeight", descKey: "sgTipHeightDesc" },
  ];

  const switchCategory = (cat: Category) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setActiveCategory(cat);
    setCalcResult(null);
  };

  const unitLabel = unit === "cm" ? "cm" : "in";
  const parseInput = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return 0;
    return unit === "cm" ? n : n * 2.54;
  };

  const runCalculator = () => {
    const v1 = parseInput(field1);
    const v2 = parseInput(field2);
    const v3 = parseInput(field3);
    let result = "";
    if (calcGender === "women")      result = calcWomenSize(v1, v2, v3);
    else if (calcGender === "men")   result = calcMenSize(v1, v2, v3);
    else                             result = calcKidsSize(v1, v2);
    setCalcResult(result);
    calcResultAnim.setValue(0);
    Animated.spring(calcResultAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  };

  // ─── Table helpers ─────────────────────────────────────────────────────────
  const TH = ({ label }: { label: string }) => (
    <View style={styles.thCell}>
      <Text style={[styles.thText, { color: accentFg }]}>{label}</Text>
    </View>
  );
  const TD = ({ label, bold }: { label: string; bold?: boolean }) => (
    <View style={styles.tdCell}>
      <Text style={[styles.tdText, { color: bold ? accent : colors.foreground, fontWeight: bold ? "700" : "500" }]}>{label}</Text>
    </View>
  );
  const SizeCell = ({ label }: { label: string }) => (
    <View style={[styles.tdCell, styles.sizeCell, { backgroundColor: accent + "18" }]}>
      <Text style={[styles.tdText, { color: accent, fontWeight: "800" }]}>{label}</Text>
    </View>
  );

  const ROW_BG = (i: number) => i % 2 === 0
    ? (isDark ? "#111118" : "#F8F8FC")
    : (isDark ? "#0D0D13" : "#FFFFFF");

  // ─── Tables ────────────────────────────────────────────────────────────────
  const renderWomen = () => (
    <View>
      <TableNote colors={colors} text={t("sgWomenNote")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.tableRow, { backgroundColor: accent }]}>
            {[t("sgSize"), "FR", `${t("sgBust")} (${unitLabel})`, `${t("sgWaist")} (${unitLabel})`, `${t("sgHips")} (${unitLabel})`].map(h => <TH key={h} label={h} />)}
          </View>
          {WOMEN_SIZES.map((row, i) => (
            <View key={row.size} style={[styles.tableRow, { backgroundColor: ROW_BG(i) }]}>
              <SizeCell label={row.size} />
              <TD label={row.fr} />
              <TD label={rng(row.bust, unit)} />
              <TD label={rng(row.waist, unit)} />
              <TD label={rng(row.hips, unit)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderMen = () => (
    <View>
      <TableNote colors={colors} text={t("sgMenNote")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.tableRow, { backgroundColor: accent }]}>
            {[t("sgSize"), "FR", `${t("sgChest")} (${unitLabel})`, `${t("sgWaist")} (${unitLabel})`, `${t("sgHips")} (${unitLabel})`].map(h => <TH key={h} label={h} />)}
          </View>
          {MEN_SIZES.map((row, i) => (
            <View key={row.size} style={[styles.tableRow, { backgroundColor: ROW_BG(i) }]}>
              <SizeCell label={row.size} />
              <TD label={row.fr} />
              <TD label={rng(row.chest, unit)} />
              <TD label={rng(row.waist, unit)} />
              <TD label={rng(row.hips, unit)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderKids = () => (
    <View>
      <TableNote colors={colors} text={t("sgKidsNote")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.tableRow, { backgroundColor: accent }]}>
            {[t("sgAge"), `${t("sgHeight")} (${unitLabel})`, `${t("sgChest")} (${unitLabel})`, `${t("sgWaist")} (${unitLabel})`].map(h => <TH key={h} label={h} />)}
          </View>
          {KIDS_SIZES_DATA.map((row, i) => (
            <View key={row.size} style={[styles.tableRow, { backgroundColor: ROW_BG(i) }]}>
              <SizeCell label={row.size} />
              <TD label={rng(row.height, unit)} />
              <TD label={rng(row.chest, unit)} />
              <TD label={rng(row.waist, unit)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderShoes = () => (
    <View>
      <TableNote colors={colors} text={t("sgShoesNote")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.tableRow, { backgroundColor: accent }]}>
            {["EU", "FR/UK", t("sgUSWomen"), t("sgUSMen"), "cm"].map(h => <TH key={h} label={h} />)}
          </View>
          {SHOE_SIZES.map((row, i) => (
            <View key={row.eu} style={[styles.tableRow, { backgroundColor: ROW_BG(i) }]}>
              <SizeCell label={row.eu} />
              <TD label={row.fr_uk} />
              <TD label={row.us_w} />
              <TD label={row.us_m} />
              <TD label={row.cm} bold />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // ─── Calculator ───────────────────────────────────────────────────────────
  const calcFields: { key: string; label: string; placeholder: string }[] =
    calcGender === "women"
      ? [
          { key: "f1", label: `${t("sgBust")} (${unitLabel})`, placeholder: "88" },
          { key: "f2", label: `${t("sgWaist")} (${unitLabel})`, placeholder: "68" },
          { key: "f3", label: `${t("sgHips")} (${unitLabel})`, placeholder: "94" },
        ]
      : calcGender === "men"
      ? [
          { key: "f1", label: `${t("sgChest")} (${unitLabel})`, placeholder: "92" },
          { key: "f2", label: `${t("sgWaist")} (${unitLabel})`, placeholder: "80" },
          { key: "f3", label: `${t("sgHips")} (${unitLabel})`, placeholder: "98" },
        ]
      : [
          { key: "f1", label: `${t("sgHeight")} (${unitLabel})`, placeholder: "120" },
          { key: "f2", label: `${t("sgChest")} (${unitLabel})`, placeholder: "62" },
        ];

  const vals    = [field1, field2, field3];
  const setVals = [setField1, setField2, setField3];

  const renderCalc = () => (
    <View>
      {/* Gender selector */}
      <View style={[styles.calcGenderRow, { backgroundColor: isDark ? "#111118" : "#F0F0F5", borderColor: colors.border }]}>
        {(["women", "men", "kids"] as CalcGender[]).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.calcGenderBtn, calcGender === g && { backgroundColor: accent }]}
            onPress={() => { setCalcGender(g); setCalcResult(null); setField1(""); setField2(""); setField3(""); }}
          >
            <Text style={{ color: calcGender === g ? accentFg : colors.textMuted, fontWeight: "700", fontSize: 13 }}>
              {g === "women" ? t("sgWomen") : g === "men" ? t("sgMen") : t("sgKids")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inputs */}
      <View style={[styles.calcCard, { backgroundColor: isDark ? "#0F0F1A" : "#F8F8FF", borderColor: colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 }}>
          <Ruler size={18} color={accent} />
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 15 }}>
            {t("sgEnterMeasurements")}
          </Text>
        </View>
        {calcFields.map((f, idx) => (
          <View key={f.key} style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>{f.label}</Text>
            <TextInput
              value={vals[idx]}
              onChangeText={setVals[idx]}
              placeholder={f.placeholder}
              placeholderTextColor={isDark ? "#555" : "#BBB"}
              keyboardType="decimal-pad"
              style={[styles.calcInput, {
                backgroundColor: isDark ? "#1A1A2A" : "#FFF",
                color: colors.foreground,
                borderColor: vals[idx] ? accent : colors.border,
              }]}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.calcBtn, { backgroundColor: accent }]}
          onPress={runCalculator}
          activeOpacity={0.85}
        >
          <Calculator size={18} color={accentFg} />
          <Text style={{ color: accentFg, fontWeight: "800", fontSize: 15, marginLeft: 8 }}>
            {t("sgCalculateMySize")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result */}
      {calcResult && (
        <Animated.View
          style={[
            styles.calcResultCard,
            {
              backgroundColor: isDark ? "#111118" : "#F0F0FF",
              borderColor: accent,
              transform: [{ scale: calcResultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              opacity: calcResultAnim,
            },
          ]}
        >
          <CheckCircle size={28} color={colors.success} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>{t("sgRecommendedSize")}</Text>
            <Text style={{ color: colors.foreground, fontSize: 40, fontWeight: "900", letterSpacing: -1 }}>
              {calcResult}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
              {t("sgConsiderSizeUp")}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Quick ref */}
      <View style={[styles.quickRef, { backgroundColor: isDark ? "#0A1A0A" : "#F0FFF4", borderColor: "#22C55E30" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Lightbulb size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontWeight: "700", fontSize: 13 }}>
            {t("sgMeasureHowTo")}
          </Text>
        </View>
        <Text style={{ color: isDark ? "#A7F3D0" : "#166534", fontSize: 12, lineHeight: 18 }}>
          {t("sgMeasureCalcDesc")}
        </Text>
      </View>
    </View>
  );

  // ─── Tips ─────────────────────────────────────────────────────────────────
  const renderTips = () => (
    <View style={{ gap: 12 }}>
      <View style={[styles.tipsHero, { backgroundColor: isDark ? "#14141E" : "#F4F4FF", borderColor: colors.border }]}>
        <Ruler size={32} color={accent} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16, marginBottom: 4 }}>{t("sgHowToMeasure")}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>
            {t("sgHowToMeasureDesc")}
          </Text>
        </View>
      </View>
      {TIPS_DATA.map((tip, i) => (
        <View key={i} style={[styles.tipCard, { backgroundColor: isDark ? "#0F0F1E" : "#F8F8FF", borderColor: colors.border }]}>
          <View style={[styles.tipIconBox, { backgroundColor: accent + "18" }]}>
            <Ruler size={22} color={accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14, marginBottom: 4 }}>{t(tip.titleKey)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>{t(tip.descKey)}</Text>
          </View>
        </View>
      ))}
      <View style={[styles.generalTipsCard, { backgroundColor: isDark ? "#0A1A0A" : "#F0FFF4", borderColor: "#22C55E30" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Lightbulb size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontWeight: "800", fontSize: 14 }}>{t("sgTipsTitle")}</Text>
        </View>
        {(["sgTip1", "sgTip2", "sgTip3", "sgTip4", "sgTip5"] as const).map((key, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
            <ArrowRight size={14} color={colors.success} style={{ marginTop: 3 }} />
            <Text style={{ color: isDark ? "#A7F3D0" : "#166534", fontSize: 13, lineHeight: 19, flex: 1 }}>{t(key)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case "women": return renderWomen();
      case "men":   return renderMen();
      case "kids":  return renderKids();
      case "shoes": return renderShoes();
      case "calc":  return renderCalc();
      case "tips":  return renderTips();
      default:      return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t("sizeGuide")}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
            {t("sgAllMeasurementsIn")} {unit === "cm" ? t("sgCentimeters") : t("sgInches")}
          </Text>
        </View>
        {/* Unit toggle */}
        <View style={[styles.unitToggle, { backgroundColor: isDark ? "#1C1C2A" : "#EBEBEB" }]}>
          {(["cm", "in"] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitBtn, unit === u && { backgroundColor: accent }]}
              onPress={() => setUnit(u)}
            >
              <Text style={{ color: unit === u ? accentFg : colors.textMuted, fontWeight: "700", fontSize: 12 }}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          const isCalc = cat.id === "calc";
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: active ? accent : isDark ? "#1C1C2A" : "#F0F0F5",
                  borderColor: active ? accent : "transparent",
                },
                isCalc && !active && { borderColor: colors.foreground, borderWidth: 1.5 },
              ]}
              onPress={() => switchCategory(cat.id as Category)}
              activeOpacity={0.85}
            >
              <Icon size={14} color={active ? accentFg : isCalc ? colors.foreground : colors.textMuted} />
              <Text style={[styles.tabLabel, { color: active ? accentFg : isCalc ? colors.foreground : colors.textMuted, fontWeight: isCalc ? "800" : "600" }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderContent()}
        </Animated.View>

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: isDark ? "#111118" : "#F8F8F8", borderColor: colors.border }]}>
          <Info size={14} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1, marginLeft: 8, lineHeight: 17 }}>
            {t("sgDisclaimer")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function TableNote({ text, colors }: { text: string; colors: any }) {
  return (
    <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>
      {text}
    </Text>
  );
}

const CELL_W = Math.max((W - 32) / 5, 90);

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800" },

  unitToggle: { flexDirection: "row", borderRadius: 20, padding: 2, gap: 2 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  tabRow: { flexGrow: 0, paddingVertical: 12 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  tabLabel: { fontSize: 13 },

  tableRow: { flexDirection: "row" },
  thCell: { width: CELL_W, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  thText: { fontSize: 12, fontWeight: "700" },
  tdCell: { width: CELL_W, paddingVertical: 11, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  tdText: { fontSize: 13 },
  sizeCell: {},

  calcGenderRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  calcGenderBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  calcCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  calcInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  calcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  calcResultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 16,
  },
  quickRef: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },

  tipsHero: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 4 },
  tipCard: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: 14, borderWidth: 1 },
  tipIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  generalTipsCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 4 },

  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});

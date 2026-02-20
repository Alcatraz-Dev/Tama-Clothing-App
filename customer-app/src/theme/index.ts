export const Theme = {
    light: {
        colors: {
            background: "#eeeeee",
            foreground: "#0A0A0A",

            card: "#FFFFFF",
            muted: "#F6F6F7",
            subtle: "#FAFAFA",

            border: "#E6E6E7",
            borderStrong: "#D1D1D6",

            text: "#0A0A0A",
            textMuted: "#6B7280",
            textSubtle: "#9CA3AF",

            primary: "#111111",
            primaryForeground: "#FFFFFF",

            error: "#EF4444",
            success: "#22C55E",
            warning: "#F59E0B",
            info: "#3B82F6",

            white: "#FFFFFF",
            black: "#000000",
        },
    },

    dark: {
        colors: {
            background: "#0B0B0F",
            foreground: "#FFFFFF",

            card: "#121218",
            muted: "#17171F",
            subtle: "#101015",

            border: "#242430",
            borderStrong: "#2F2F3D",

            text: "#FFFFFF",
            textMuted: "#A1A1AA",
            textSubtle: "#71717A",

            primary: "#FFFFFF",
            primaryForeground: "#0B0B0F",

            error: "#F87171",
            success: "#4ADE80",
            warning: "#FBBF24",
            info: "#60A5FA",

            white: "#FFFFFF",
            black: "#000000",
        },
    },

    spacing: {
        xxs: 2,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 40,
        xxxl: 56,
    },

    radius: {
        sm: 10,
        md: 16,
        lg: 22,
        xl: 28,
        pill: 999,
    },

    typography: {
        h1: {
            fontSize: 34,
            fontWeight: "800" as const,
            letterSpacing: -0.8,
            lineHeight: 40,
        },
        h2: {
            fontSize: 26,
            fontWeight: "700" as const,
            letterSpacing: -0.6,
            lineHeight: 32,
        },
        h3: {
            fontSize: 20,
            fontWeight: "700" as const,
            letterSpacing: -0.3,
            lineHeight: 26,
        },
        body: {
            fontSize: 16,
            fontWeight: "400" as const,
            lineHeight: 22,
        },
        bodyMedium: {
            fontSize: 16,
            fontWeight: "600" as const,
            lineHeight: 22,
        },
        caption: {
            fontSize: 13,
            fontWeight: "400" as const,
            lineHeight: 18,
        },
        button: {
            fontSize: 16,
            fontWeight: "700" as const,
            letterSpacing: 0.3,
        },
    },

    shadow: {
        sm: {
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
        },
        md: {
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 6,
        },
    },

    animation: {
        duration: {
            fast: 160,
            normal: 260,
            slow: 420,
        },
        easing: {
            standard: "ease-in-out",
            in: "ease-in",
            out: "ease-out",
        },
    },
} as const;
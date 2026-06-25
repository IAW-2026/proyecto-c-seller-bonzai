export const clerkTheme = {
  variables: {
    colorPrimary: "#1B3D2F",
    colorText: "#1A1A1A",
    colorTextSecondary: "#6B7280",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#1A1A1A",
    colorBorder: "#E5E7EB",
    colorDanger: "#DC2626",
    borderRadius: "0",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    main: {
      width: "100%",
    },
    card: {
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      border: "1px solid #E5E7EB", 
      padding: "2.5rem",
      borderRadius: "0",
      width: "100%",
      maxWidth: "400px", 
      margin: "0 auto",
    },
    headerTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "#1B3D2F",
    },
    headerSubtitle: {
      fontSize: "0.8rem",
      color: "#6B7280",
    },
    socialButtonsBlockButton: {
      borderRadius: "0",
      border: "1px solid #E5E7EB",
      fontSize: "0.75rem",
      fontWeight: "600",
      height: "2.25rem",
    },
    socialButtonsBlockButtonText: {
      fontSize: "0.75rem",
      fontWeight: "600",
    },
    formButtonPrimary: {
      borderRadius: "0",
      backgroundColor: "#1B3D2F",
      fontSize: "0.75rem",
      fontWeight: "700",
      height: "2.25rem",
    },
    formButtonPrimary__loading: {
      backgroundColor: "#1B3D2F",
    },
    formFieldInput: {
      borderRadius: "0",
      border: "1px solid #E5E7EB",
      fontSize: "0.875rem",
      padding: "0.5rem",
      backgroundColor: "#FFFFFF",
    },
    formFieldLabel: {
      fontSize: "0.7rem",
      fontWeight: "600",
      color: "#1A1A1A",
    },
    footerAction: {
      borderTop: "1px solid #E5E7EB",
      paddingTop: "1rem",
    },
    footerActionText: {
      fontSize: "0.75rem",
      color: "#6B7280",
    },
    footerActionLink: {
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "#1B3D2F",
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
    dividerLine: {
      borderColor: "#E5E7EB",
    },
    dividerText: {
      fontSize: "0.65rem",
      color: "#C5C0B0",
    },
  },
};

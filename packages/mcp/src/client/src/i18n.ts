import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../i18n/en.json" with { type: "json" };
import zhTranslations from "../i18n/zh.json" with { type: "json" };

const resources = {
  en: {
    translation: enTranslations,
  },
  zh: {
    translation: zhTranslations,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;

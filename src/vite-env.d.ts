/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional early-access capture endpoint (Formspree/Tally/custom). */
  readonly VITE_EARLY_ACCESS_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

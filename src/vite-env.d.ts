/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly CASH_TRACKING_APP_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

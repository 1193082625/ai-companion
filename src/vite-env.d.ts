/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MINIMAX_API_KEY: string;
  readonly VITE_MINIMAX_BASE_URL: string;
  readonly VITE_MINIMAX_MODEL: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_OPENAI_BASE_URL: string;
  readonly VITE_OPENAI_MODEL: string;
  readonly VITE_OPENROUTER_API_KEY: string;
  readonly VITE_OPENROUTER_BASE_URL: string;
  readonly VITE_OPENROUTER_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

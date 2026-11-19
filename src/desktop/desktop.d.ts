export {};
declare global {
  interface Window {
    omsDesktop?: {
      call: (method: string, ...args: any[]) => Promise<any>;
      preferences: () => Record<string, string>;
      setPreference: (key: string, value: string | null) => void;
      onChanged: (callback: (collection: string) => void) => () => void;
    };
  }
}

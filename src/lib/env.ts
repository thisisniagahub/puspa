const isProduction = process.env.NODE_ENV === "production";

interface ServerEnvOptions {
  defaultValue?: string;
  minLength?: number;
  allowInProductionDefault?: boolean;
}

export function getServerEnv(name: string, options: ServerEnvOptions = {}): string {
  const value = process.env[name]?.trim();

  if (value) {
    if (options.minLength && value.length < options.minLength) {
      throw new Error(`Environment variable ${name} must be at least ${options.minLength} characters.`);
    }
    return value;
  }

  if (options.defaultValue !== undefined) {
    if (isProduction && !options.allowInProductionDefault) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return options.defaultValue;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export function isDemoModeEnabled(): boolean {
  return process.env.PUSPA_ENABLE_DEMO_SEEDING === "true";
}

export function isSetupRouteEnabled(): boolean {
  return process.env.PUSPA_ENABLE_SETUP_ROUTE === "true";
}

// Environment Configuration for FANZ Mobile
// ==========================================
// 
// CREATE A .env FILE IN THE PROJECT ROOT WITH THESE VALUES:
// 
// # Supabase Frontend (REQUIRED)
// VITE_SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
// VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// 
// # Custom Domain (optional - if using db.fanz.website)
// # VITE_SUPABASE_URL=https://db.fanz.website
//
// # Payment Processors
// VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
// VITE_PAYPAL_CLIENT_ID=xxx
// 
// # Social OAuth
// VITE_TWITTER_CLIENT_ID=xxx
// VITE_REDDIT_CLIENT_ID=xxx
// VITE_INSTAGRAM_APP_ID=xxx
// VITE_TIKTOK_CLIENT_KEY=xxx
// 
// # App URLs
// VITE_APP_URL=https://mobile.fanz.website
// VITE_API_URL=https://api.fanz.website
// 
// ==========================================
// BACKEND/SERVER ENVIRONMENT VARIABLES (NOT FOR FRONTEND):
// ==========================================
// 
// # Database Connection (for backend services only)
// DATABASE_URL=postgres://postgres:xxx@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?pgbouncer=true
// DIRECT_URL=postgres://postgres:xxx@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres
// 
// # Service Role Key (for backend only - NEVER expose to frontend)
// SUPABASE_SERVICE_ROLE_KEY=xxx
// 
// # Stripe Secret (backend only)
// STRIPE_SECRET_KEY=sk_live_xxx
// 
// # PayPal Secret (backend only)
// PAYPAL_CLIENT_SECRET=xxx
// 
// ==========================================

// Environment configuration with defaults
export const config = {
  // Supabase - Can use custom domain db.fanz.website
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://mcayxybcgxhfttvwmhgm.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  
  // App info
  app: {
    name: import.meta.env.VITE_APP_NAME || 'FANZ Mobile',
    url: import.meta.env.VITE_APP_URL || 'https://mobile.fanz.website',
    apiUrl: import.meta.env.VITE_API_URL || 'https://api.fanz.website',
  },
  
  // Platform URLs (from Supabase database)
  platforms: {
    boyfanz: 'https://boyfanz.fmd.solutions',
    girlfanz: 'https://girlfanz.fmd.solutions',
    pupfanz: 'https://pupfanz.fmd.solutions',
    bearfanz: 'https://bearfanz.fmd.solutions',
    cougarfanz: 'https://cougarfanz.fmd.solutions',
    fanzdash: 'https://fanzdash.fmd.solutions',
    fanzdiscreet: 'https://dlbroz.fmd.solutions',
    fanzuncut: 'https://fanzuncut.fmd.solutions',
    femmefanz: 'https://femmefanz.fmd.solutions',
    gayfanz: 'https://gayfanz.fmd.solutions',
    guyz: 'https://guyz.fmd.solutions',
    southernfanz: 'https://southernfanz.fmd.solutions',
    taboofanz: 'https://taboofanz.fmd.solutions',
    transfanz: 'https://transfanz.fmd.solutions',
  },
  
  // Payment processors (public keys only)
  payments: {
    stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
    paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
  },
  
  // Social OAuth (client IDs only - secrets stay on backend)
  social: {
    twitter: {
      clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
      authUrl: 'https://twitter.com/i/oauth2/authorize',
    },
    reddit: {
      clientId: import.meta.env.VITE_REDDIT_CLIENT_ID || '',
      authUrl: 'https://www.reddit.com/api/v1/authorize',
    },
    instagram: {
      appId: import.meta.env.VITE_INSTAGRAM_APP_ID || '',
      authUrl: 'https://api.instagram.com/oauth/authorize',
    },
    tiktok: {
      clientKey: import.meta.env.VITE_TIKTOK_CLIENT_KEY || '',
      authUrl: 'https://www.tiktok.com/auth/authorize/',
    },
    bluesky: {
      // Bluesky uses AT Protocol - no client ID needed
      pdsUrl: 'https://bsky.social',
    },
  },
  
  // Feature flags
  features: {
    enableOfflineMode: true,
    enablePushNotifications: true,
    enableAnalytics: true,
    enableDMCAProtection: true,
    enableAIEnhancement: true,
    enableForensicWatermarking: true,
    enableCrossPosting: true,
  },
  
  // API endpoints
  api: {
    upload: '/api/upload',
    transcode: '/api/transcode',
    dmca: '/api/dmca',
    verify: '/api/verify',
  },
  
  // Development
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Validation function
export function validateConfig(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Required
  if (!config.supabase.anonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }
  
  // Warnings for optional but recommended
  if (!config.payments.stripePublicKey) {
    warnings.push('VITE_STRIPE_PUBLIC_KEY - Payment features disabled');
  }
  
  if (!config.social.twitter.clientId) {
    warnings.push('VITE_TWITTER_CLIENT_ID - Twitter cross-posting disabled');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// Log configuration status in development
if (config.isDev) {
  const { valid, missing, warnings } = validateConfig();
  
  if (!valid) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Optional variables not set:', warnings.join('\n  '));
  }
  
  if (valid && warnings.length === 0) {
    console.log('✅ All environment variables configured');
  }
}

// Helper to get platform URL by ID
export function getPlatformUrl(platformId: string): string {
  const key = platformId.toLowerCase() as keyof typeof config.platforms;
  return config.platforms[key] || '';
}

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof config.features): boolean {
  return config.features[feature] ?? false;
}

export default config;

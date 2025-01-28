export interface VerificationResult {
  success: boolean;
  walletVerification: {
    success: boolean;
    details: {
      addressVerified?: boolean;
      signatureValid?: boolean;
      balanceAccessible?: boolean;
      withdrawalTested?: boolean;
    };
  };
  tradingVerification: {
    success: boolean;
    details: {
      marketDataActive?: boolean;
      latencyAcceptable?: boolean;
      orderFunctionsValid?: boolean;
      riskParamsValid?: boolean;
    };
  };
  securityVerification: {
    success: boolean;
    details: {
      twoFactorEnabled?: boolean;
      sslActive?: boolean;
      ipWhitelisted?: boolean;
      recoveryTested?: boolean;
    };
  };
  timestamp: number;
}

export interface SecurityConfig {
  twoFactorEnabled: boolean;
  ipWhitelist: string[];
  sslCertificate: {
    valid: boolean;
    expiryDate: number;
  };
  recoveryEmail: string;
  lastBackupDate: number;
}
export type SessionUser = {
  id: string;
  email: string;
  role: 'ADMIN';
  status: string;
  displayName: string;
};

export type MoneyTotals = {
  depositsCents: number;
  callChargesCents: number;
  creatorEarningsCents: number;
  platformShareCents: number;
  refundsCents: number;
  adminAdjustmentsCreditCents: number;
  adminAdjustmentsDebitCents: number;
  payoutDebitsCents: number;
};

export type DashboardResponse = {
  generatedAt: string;
  creatorShareBps: number;
  users: {
    total: number;
    byStatus: Record<string, number>;
    newToday: number;
    newLast7Days: number;
    recentlyActive24h: number;
  };
  hosts: {
    total: number;
    byStatus: Record<string, number>;
    byAvailability: Record<string, number>;
    online: number;
  };
  calls: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    active: number;
  };
  payments: { byStatus: Record<string, number> };
  payouts: {
    byStatus: Record<string, { count: number; amountCents: number }>;
    pendingCount: number;
    pendingAmountCents: number;
    rules: PayoutRules;
  };
  reports: { byStatus: Record<string, number> };
  financial: MoneyTotals & {
    walletCount: number;
    availableBalanceCents: number;
    heldBalanceCents: number;
  };
};

export type AnalyticsResponse = {
  from: string;
  days: number;
  creatorShareBps: number;
  callsPerDay: Array<{
    date: string;
    total: number;
    ended: number;
    failed: number;
    cancelled: number;
    timeout: number;
    missed: number;
    voice: number;
    video: number;
  }>;
  registrationsPerDay: Array<{ date: string; count: number }>;
  moneyPerDay: Array<{
    date: string;
    depositsCents: number;
    callChargesCents: number;
    creatorEarningsCents: number;
    refundsCents: number;
    platformShareCents: number;
  }>;
};

export type AlertSummary = {
  pendingHostApplications: number;
  openReports: number;
  payoutRequests: number;
  failedPayments24h: number;
  failedNotifications24h: number;
  total: number;
};

export type AdminUser = {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  profile: {
    displayName: string;
    avatarUrl?: string | null;
    lastActiveAt?: string;
    bio?: string;
    gender?: string;
    country?: string | null;
    language?: string | null;
  } | null;
  hostProfile?: {
    status: string;
    availability: string;
    verificationStatus: string;
  } | null;
  wallet?: {
    currency: string;
    availableBalanceCents: number;
    heldBalanceCents: number;
  } | null;
};

export type HostCompleteness = {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
  verificationStatus: string;
  requiredAgreements: Array<{ agreementType: string; version: string }>;
};

export type HostRecord = {
  userId: string;
  status: string;
  availability: string;
  verificationStatus: string;
  voiceEnabled: boolean;
  videoEnabled: boolean;
  voiceRatePerMinuteCents: number;
  videoRatePerMinuteCents: number;
  languages: string[];
  interests: string[];
  applicationBio: string;
  reviewNote: string | null;
  internalNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  idProofType?: string | null;
  idProofLast4?: string | null;
  idProofMime?: string | null;
  idProofUpdatedAt?: string | null;
  identityCardNumber?: string | null;
  identityFrontMime?: string | null;
  identityBackMime?: string | null;
  profileImageMime?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    phone: string | null;
    status: string;
    profile: AdminUser['profile'];
  };
  agreementAcceptances: Array<{
    agreementType: string;
    version: string;
    acceptedAt: string;
  }>;
  completeness?: HostCompleteness;
};

export type CallRow = {
  id: string;
  callerId: string;
  calleeId: string;
  callerDisplayName: string | null;
  calleeDisplayName: string | null;
  callType: string;
  status: string;
  settlementStatus: string;
  settlementAppliedAt: string | null;
  provider: string;
  providerSessionId: string;
  rtcChannelName: string;
  ratePerMinuteCents: number;
  billedSeconds: number;
  billedAmountCents: number;
  creatorEarningCents: number;
  platformFeeCents: number;
  creatorShareBps: number;
  connectedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  createdAt: string;
};

export type CallDetail = CallRow & {
  heldAmountCents: number;
  callerHeartbeatAt: string | null;
  calleeHeartbeatAt: string | null;
  version: number;
  idempotencyKey: string | null;
  updatedAt: string;
  refunded: boolean;
  refund: { id: string; amountCents: number; createdAt: string } | null;
  caller: {
    id: string;
    email: string;
    phone: string | null;
    status: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
  callee: CallDetail['caller'];
  events: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorId: string | null;
    source: string;
    note: string | null;
    createdAt: string;
  }>;
  rtc: {
    channelName: string;
    provider: string;
    providerSessionId: string;
    tokenExposed: false;
  };
};

export type PaymentRow = {
  id: string;
  userId: string;
  amountCents: number;
  creditCents?: number | null;
  currency: string;
  status: string;
  provider: string;
  providerPaymentId: string;
  providerCaptureId?: string | null;
  refundStatus?: string;
  providerRefundId?: string | null;
  refundedAmountCents?: number;
  reconciliationStatus?: string;
  capturedAt?: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    phone: string | null;
    profile: { displayName: string } | null;
  };
};

export type PaymentDetail = PaymentRow & {
  ledger: Array<{
    id: string;
    type: string;
    reason: string;
    amountCents: number;
    balanceAfterCents: number;
    createdAt: string;
  }>;
  webhookPayloadExposed: false;
};

export type PayoutRules = {
  minimumAmountCents: number;
  payoutRailStatus: 'CONFIG_REQUIRED';
  payoutRailCode: 'PAYOUT_PROVIDER_CONFIG_REQUIRED';
  payoutRail?: 'RAZORPAYX';
  moneyTransferred?: false;
  externalTransferStatus?: 'NOT_TRANSFERRED';
};

export type PayoutRow = {
  id: string;
  userId: string;
  amountCents: number;
  status: string;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  hostName: string | null;
  hostPhone: string | null;
  destination: {
    id: string;
    type: string;
    label: string;
    isDefault: boolean;
    detailsMasked: unknown;
  } | null;
};

export type AuditRow = {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; email: string } | null;
};

export type ReportRow = {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  details: string;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; profile: { displayName: string } | null };
  reported?: { id: string; profile: { displayName: string } | null };
};

export type ProviderState = {
  mode: string;
  status: 'CONFIGURED' | 'CONFIG_REQUIRED' | 'DISABLED' | string;
  verification: string;
  code?: string;
};

export type SystemStatus = {
  environment: string;
  version: string;
  api: string;
  database: 'ok' | 'error';
  redis: 'ok' | 'error';
  queues: {
    status: 'ok' | 'error';
    notifications: Record<string, number> | null;
    callLifecycle: Record<string, number> | null;
  };
  creatorShareBps: number;
  providers: {
    sms: ProviderState;
    agora: ProviderState;
    stripe: ProviderState;
    fcm: ProviderState;
    payout: ProviderState & PayoutRules;
  };
};

export type WalletRow = {
  id: string;
  userId: string;
  currency: string;
  availableBalanceCents: number;
  heldBalanceCents: number;
  updatedAt: string;
  user: {
    email: string;
    phone: string | null;
    status: string;
    profile: { displayName: string } | null;
  };
};

export type Reconciliation = {
  userId: string;
  currency: string;
  availableBalanceCents: number;
  heldBalanceCents: number;
  walletTotalCents: number;
  ledgerCreditCents: number;
  ledgerDebitCents: number;
  ledgerNetCents: number;
  lastEntryBalanceCents: number | null;
  heldFromActiveCallsCents: number;
  ok: boolean;
  issues: string[];
};

export type SearchResponse = {
  users: Array<{
    id: string;
    email: string;
    phone: string | null;
    status: string;
    profile: { displayName: string } | null;
  }>;
  hosts: Array<{
    userId: string;
    status: string;
    availability: string;
    user: { phone: string | null; profile: { displayName: string } | null };
  }>;
  calls: Array<{ id: string; status: string; callType: string; createdAt: string }>;
  payments: Array<{
    id: string;
    status: string;
    amountCents: number;
    currency: string;
    provider: string;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    status: string;
    amountCents: number;
    userId: string;
    createdAt: string;
  }>;
  reports: Array<{ id: string; status: string; reason: string; createdAt: string }>;
};

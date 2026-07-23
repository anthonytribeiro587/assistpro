import type { SupabaseClient } from '@supabase/supabase-js';

export type BusinessDayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type BusinessHour = {
  day: BusinessDayKey;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
};

export type AiBusinessSettings = {
  businessName: string;
  phone: string;
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  mapsUrl: string;
  timezone: string;
  appointmentsEnabled: boolean;
  walkInEnabled: boolean;
  aiEnabled: boolean;
  audioEnabled: boolean;
  outsideHoursReplyEnabled: boolean;
  humanHandoffEnabled: boolean;
  stockFollowupEnabled: boolean;
  quoteEstimate: string;
  defaultRepairEstimate: string;
  outsideHoursMessage: string;
  humanHandoffMessage: string;
  stockPendingMessage: string;
  customInstructions: string;
  businessHours: BusinessHour[];
};

const DEFAULT_HOURS: BusinessHour[] = [
  { day: 'monday', label: 'Segunda-feira', enabled: true, open: '09:00', close: '18:00' },
  { day: 'tuesday', label: 'Terça-feira', enabled: true, open: '09:00', close: '18:00' },
  { day: 'wednesday', label: 'Quarta-feira', enabled: true, open: '09:00', close: '18:00' },
  { day: 'thursday', label: 'Quinta-feira', enabled: true, open: '09:00', close: '18:00' },
  { day: 'friday', label: 'Sexta-feira', enabled: true, open: '09:00', close: '18:00' },
  { day: 'saturday', label: 'Sábado', enabled: true, open: '09:00', close: '13:00' },
  { day: 'sunday', label: 'Domingo', enabled: false, open: '09:00', close: '13:00' }
];

export const DEFAULT_AI_BUSINESS_SETTINGS: AiBusinessSettings = {
  businessName: 'JR Celular',
  phone: '',
  addressLine: 'Av. Sapucaia, 1877',
  neighborhood: 'Primor',
  city: 'Sapucaia do Sul',
  state: 'RS',
  postalCode: '93210-240',
  mapsUrl: '',
  timezone: 'America/Sao_Paulo',
  appointmentsEnabled: false,
  walkInEnabled: true,
  aiEnabled: true,
  audioEnabled: true,
  outsideHoursReplyEnabled: true,
  humanHandoffEnabled: true,
  stockFollowupEnabled: true,
  quoteEstimate: 'Confirmado após a avaliação presencial do aparelho.',
  defaultRepairEstimate: 'O prazo depende do diagnóstico e da disponibilidade da peça.',
  outsideHoursMessage:
    'No momento a JR Celular está fechada. Sua mensagem ficou registrada e a equipe poderá continuar o atendimento no próximo horário de funcionamento.',
  humanHandoffMessage:
    'Claro. A equipe da JR Celular pode continuar o atendimento por aqui assim que estiver disponível.',
  stockPendingMessage:
    'Perfeito! Assim que a equipe confirmar a disponibilidade e o valor, o retorno será feito por aqui.',
  customInstructions:
    'Não oferecer agendamento. Para assistência, orientar o cliente a levar o aparelho durante o horário de atendimento.',
  businessHours: DEFAULT_HOURS
};

type SettingsRow = {
  business_name?: string | null;
  phone?: string | null;
  address_line?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  maps_url?: string | null;
  timezone?: string | null;
  appointments_enabled?: boolean | null;
  walk_in_enabled?: boolean | null;
  ai_enabled?: boolean | null;
  audio_enabled?: boolean | null;
  outside_hours_reply_enabled?: boolean | null;
  human_handoff_enabled?: boolean | null;
  stock_followup_enabled?: boolean | null;
  quote_estimate?: string | null;
  default_repair_estimate?: string | null;
  outside_hours_message?: string | null;
  human_handoff_message?: string | null;
  stock_pending_message?: string | null;
  custom_instructions?: string | null;
  business_hours?: unknown;
};

const DAY_KEYS: BusinessDayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

function cleanText(value: unknown, fallback = '', maxLength = 1000) {
  const text = String(value ?? '').trim();
  return (text || fallback).slice(0, maxLength);
}

function cleanTime(value: unknown, fallback: string) {
  const time = String(value ?? '').trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : fallback;
}

function cleanHours(value: unknown): BusinessHour[] {
  const input = Array.isArray(value) ? value : [];

  return DEFAULT_HOURS.map((fallback) => {
    const item = input.find(
      (candidate) =>
        candidate &&
        typeof candidate === 'object' &&
        (candidate as { day?: unknown }).day === fallback.day
    ) as Partial<BusinessHour> | undefined;

    return {
      day: fallback.day,
      label: fallback.label,
      enabled: typeof item?.enabled === 'boolean' ? item.enabled : fallback.enabled,
      open: cleanTime(item?.open, fallback.open),
      close: cleanTime(item?.close, fallback.close)
    };
  });
}

export function sanitizeAiBusinessSettings(value: unknown): AiBusinessSettings {
  const input = value && typeof value === 'object' ? (value as Partial<AiBusinessSettings>) : {};
  const defaults = DEFAULT_AI_BUSINESS_SETTINGS;

  return {
    businessName: cleanText(input.businessName, defaults.businessName, 120),
    phone: cleanText(input.phone, defaults.phone, 40),
    addressLine: cleanText(input.addressLine, defaults.addressLine, 180),
    neighborhood: cleanText(input.neighborhood, defaults.neighborhood, 100),
    city: cleanText(input.city, defaults.city, 100),
    state: cleanText(input.state, defaults.state, 30),
    postalCode: cleanText(input.postalCode, defaults.postalCode, 20),
    mapsUrl: cleanText(input.mapsUrl, defaults.mapsUrl, 500),
    timezone: cleanText(input.timezone, defaults.timezone, 80),
    appointmentsEnabled:
      typeof input.appointmentsEnabled === 'boolean'
        ? input.appointmentsEnabled
        : defaults.appointmentsEnabled,
    walkInEnabled:
      typeof input.walkInEnabled === 'boolean' ? input.walkInEnabled : defaults.walkInEnabled,
    aiEnabled: typeof input.aiEnabled === 'boolean' ? input.aiEnabled : defaults.aiEnabled,
    audioEnabled:
      typeof input.audioEnabled === 'boolean' ? input.audioEnabled : defaults.audioEnabled,
    outsideHoursReplyEnabled:
      typeof input.outsideHoursReplyEnabled === 'boolean'
        ? input.outsideHoursReplyEnabled
        : defaults.outsideHoursReplyEnabled,
    humanHandoffEnabled:
      typeof input.humanHandoffEnabled === 'boolean'
        ? input.humanHandoffEnabled
        : defaults.humanHandoffEnabled,
    stockFollowupEnabled:
      typeof input.stockFollowupEnabled === 'boolean'
        ? input.stockFollowupEnabled
        : defaults.stockFollowupEnabled,
    quoteEstimate: cleanText(input.quoteEstimate, defaults.quoteEstimate, 500),
    defaultRepairEstimate: cleanText(
      input.defaultRepairEstimate,
      defaults.defaultRepairEstimate,
      500
    ),
    outsideHoursMessage: cleanText(
      input.outsideHoursMessage,
      defaults.outsideHoursMessage,
      800
    ),
    humanHandoffMessage: cleanText(
      input.humanHandoffMessage,
      defaults.humanHandoffMessage,
      800
    ),
    stockPendingMessage: cleanText(
      input.stockPendingMessage,
      defaults.stockPendingMessage,
      800
    ),
    customInstructions: cleanText(
      input.customInstructions,
      defaults.customInstructions,
      3000
    ),
    businessHours: cleanHours(input.businessHours)
  };
}

export function rowToAiBusinessSettings(row: SettingsRow | null | undefined): AiBusinessSettings {
  if (!row) return structuredClone(DEFAULT_AI_BUSINESS_SETTINGS);

  return sanitizeAiBusinessSettings({
    businessName: row.business_name,
    phone: row.phone,
    addressLine: row.address_line,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    mapsUrl: row.maps_url,
    timezone: row.timezone,
    appointmentsEnabled: row.appointments_enabled,
    walkInEnabled: row.walk_in_enabled,
    aiEnabled: row.ai_enabled,
    audioEnabled: row.audio_enabled,
    outsideHoursReplyEnabled: row.outside_hours_reply_enabled,
    humanHandoffEnabled: row.human_handoff_enabled,
    stockFollowupEnabled: row.stock_followup_enabled,
    quoteEstimate: row.quote_estimate,
    defaultRepairEstimate: row.default_repair_estimate,
    outsideHoursMessage: row.outside_hours_message,
    humanHandoffMessage: row.human_handoff_message,
    stockPendingMessage: row.stock_pending_message,
    customInstructions: row.custom_instructions,
    businessHours: row.business_hours
  });
}

export function aiBusinessSettingsToRow(settings: AiBusinessSettings) {
  const clean = sanitizeAiBusinessSettings(settings);
  return {
    business_name: clean.businessName,
    phone: clean.phone || null,
    address_line: clean.addressLine,
    neighborhood: clean.neighborhood,
    city: clean.city,
    state: clean.state,
    postal_code: clean.postalCode,
    maps_url: clean.mapsUrl || null,
    timezone: clean.timezone,
    appointments_enabled: clean.appointmentsEnabled,
    walk_in_enabled: clean.walkInEnabled,
    ai_enabled: clean.aiEnabled,
    audio_enabled: clean.audioEnabled,
    outside_hours_reply_enabled: clean.outsideHoursReplyEnabled,
    human_handoff_enabled: clean.humanHandoffEnabled,
    stock_followup_enabled: clean.stockFollowupEnabled,
    quote_estimate: clean.quoteEstimate,
    default_repair_estimate: clean.defaultRepairEstimate,
    outside_hours_message: clean.outsideHoursMessage,
    human_handoff_message: clean.humanHandoffMessage,
    stock_pending_message: clean.stockPendingMessage,
    custom_instructions: clean.customInstructions,
    business_hours: clean.businessHours
  };
}

export async function loadAiBusinessSettings(
  supabase: SupabaseClient,
  companyId: string
): Promise<{ settings: AiBusinessSettings; persisted: boolean; migrationRequired: boolean }> {
  const result = await supabase
    .from('ai_business_settings')
    .select('*')
    .eq('company_id', companyId)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    const missingTable = ['42P01', 'PGRST205'].includes(result.error.code || '');
    if (!missingTable) console.error('AssistPro settings read error', result.error.message);
    return {
      settings: structuredClone(DEFAULT_AI_BUSINESS_SETTINGS),
      persisted: false,
      migrationRequired: missingTable
    };
  }

  return {
    settings: rowToAiBusinessSettings(result.data as SettingsRow | null),
    persisted: Boolean(result.data),
    migrationRequired: false
  };
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function currentZonedParts(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';

  const weekdayMap: Record<string, BusinessDayKey> = {
    Mon: 'monday',
    Tue: 'tuesday',
    Wed: 'wednesday',
    Thu: 'thursday',
    Fri: 'friday',
    Sat: 'saturday',
    Sun: 'sunday'
  };

  return {
    day: weekdayMap[read('weekday')] || 'monday',
    minutes: Number(read('hour')) * 60 + Number(read('minute'))
  };
}

export function buildBusinessContext(settingsInput: AiBusinessSettings, now = new Date()) {
  const settings = sanitizeAiBusinessSettings(settingsInput);
  let zoned: ReturnType<typeof currentZonedParts>;

  try {
    zoned = currentZonedParts(now, settings.timezone);
  } catch {
    zoned = currentZonedParts(now, DEFAULT_AI_BUSINESS_SETTINGS.timezone);
  }

  const today = settings.businessHours.find((item) => item.day === zoned.day) || settings.businessHours[0];
  const openMinutes = timeToMinutes(today.open);
  const closeMinutes = timeToMinutes(today.close);
  const isOpenNow =
    today.enabled &&
    (closeMinutes >= openMinutes
      ? zoned.minutes >= openMinutes && zoned.minutes < closeMinutes
      : zoned.minutes >= openMinutes || zoned.minutes < closeMinutes);

  const fullAddress = [
    settings.addressLine,
    settings.neighborhood,
    `${settings.city} - ${settings.state}`,
    settings.postalCode
  ]
    .filter(Boolean)
    .join(', ');

  const weeklyHours = settings.businessHours.map((item) => ({
    day: item.day,
    label: item.label,
    enabled: item.enabled,
    hours: item.enabled ? `${item.open}–${item.close}` : 'Fechado'
  }));

  return {
    businessName: settings.businessName,
    phone: settings.phone,
    address: fullAddress,
    mapsUrl: settings.mapsUrl,
    timezone: settings.timezone,
    isOpenNow,
    today: {
      day: today.day,
      label: today.label,
      enabled: today.enabled,
      hours: today.enabled ? `${today.open}–${today.close}` : 'Fechado'
    },
    weeklyHours,
    appointmentsEnabled: settings.appointmentsEnabled,
    walkInEnabled: settings.walkInEnabled,
    aiEnabled: settings.aiEnabled,
    audioEnabled: settings.audioEnabled,
    outsideHoursReplyEnabled: settings.outsideHoursReplyEnabled,
    humanHandoffEnabled: settings.humanHandoffEnabled,
    stockFollowupEnabled: settings.stockFollowupEnabled,
    quoteEstimate: settings.quoteEstimate,
    defaultRepairEstimate: settings.defaultRepairEstimate,
    messages: {
      outsideHours: settings.outsideHoursMessage,
      humanHandoff: settings.humanHandoffMessage,
      stockPending: settings.stockPendingMessage
    },
    customInstructions: settings.customInstructions
  };
}

export function businessContextToAgentInput(
  messageText: string,
  context: ReturnType<typeof buildBusinessContext>
) {
  return [
    'MENSAGEM ATUAL DO CLIENTE:',
    messageText,
    '',
    'DADOS OFICIAIS E ATUAIS DA JR CELULAR:',
    JSON.stringify(context),
    '',
    'Use os dados oficiais acima. Não invente endereço, horário, abertura, prazo, estoque ou agendamento.'
  ].join('\n');
}

export const BUSINESS_DAY_KEYS = DAY_KEYS;

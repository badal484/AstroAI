/**
 * Masks an email address (e.g. j***e@example.com) for non-super/ops admins
 * to uphold privacy and prevent PII leaks.
 */
export function maskEmail(email: string | null | undefined, hasPiiAccess = false): string {
  if (!email) return 'N/A';
  if (hasPiiAccess) return email;

  const [local, domain] = email.split('@');
  if (!domain || !local) return '***@***.***';

  const visibleFirst = local.slice(0, 1);
  const visibleLast = local.length > 2 ? local.slice(-1) : '';
  return `${visibleFirst}***${visibleLast}@${domain}`;
}

/**
 * Masks a phone number (e.g. +91 98****3210)
 */
export function maskPhone(phone: string | null | undefined, hasPiiAccess = false): string {
  if (!phone) return 'N/A';
  if (hasPiiAccess) return phone;

  if (phone.length <= 6) return '******';
  const start = phone.slice(0, 4);
  const end = phone.slice(-3);
  return `${start}****${end}`;
}

/**
 * Masks payment card / UPI IDs
 */
export function maskPaymentId(id: string | null | undefined, hasPiiAccess = false): string {
  if (!id) return 'N/A';
  if (hasPiiAccess) return id;

  if (id.length <= 8) return '****';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

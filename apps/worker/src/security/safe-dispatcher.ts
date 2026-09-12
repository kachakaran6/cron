import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export class SecuritySSRFException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecuritySSRFException';
  }
}

/**
 * Validates a target URL against forbidden IP ranges, localhost, and cloud metadata
 */
export async function validateSafeUrl(rawUrl: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SecuritySSRFException('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SecuritySSRFException(`Forbidden protocol: ${parsed.protocol}. Only http: and https: are allowed.`);
  }

  const hostname = parsed.hostname;

  // Resolve DNS to underlying IP addresses
  const resolvedAddresses = await dns.lookup(hostname, { all: true });
  if (!resolvedAddresses || resolvedAddresses.length === 0) {
    throw new SecuritySSRFException(`Could not resolve hostname: ${hostname}`);
  }

  for (const { address } of resolvedAddresses) {
    const addr = ipaddr.parse(address);
    const range = addr.range();

    // Check against forbidden ranges
    const forbiddenRanges = [
      'unspecified',
      'broadcast',
      'linkLocal',
      'loopback',
      'private',
      'reserved',
      'carrierGradeNat'
    ];

    if (forbiddenRanges.includes(range)) {
      throw new SecuritySSRFException(`SSRF Protection: Access to private/internal IP (${address}, ${range}) is blocked.`);
    }

    // Explicit check for AWS/GCP/Azure link-local cloud metadata
    if (address === '169.254.169.254' || address === 'fd00:ec2::254') {
      throw new SecuritySSRFException('SSRF Protection: Access to Cloud Metadata Service is prohibited.');
    }
  }

  return rawUrl;
}

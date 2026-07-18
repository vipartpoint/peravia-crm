import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AISecurityService {
  
  private readonly BLOCKED_PATTERNS = [
    /ignore previous instructions/i,
    /system prompt/i,
    /output your instructions/i,
    /bypass/i,
    /drop table/i,
    /password/i,
    /hash/i,
    /secret/i
  ];

  /**
   * Scans user input for prompt injection attempts or malicious requests.
   */
  sanitizeInput(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt cannot be empty.');
    }

    if (prompt.length > 500) {
      throw new BadRequestException('Prompt exceeds maximum allowed length.');
    }

    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(prompt)) {
        throw new BadRequestException('Malicious prompt pattern detected. Request blocked.');
      }
    }
  }

  /**
   * Scans AI output before returning it to the user.
   * Prevents leaking raw internal JSON or accidental secrets.
   */
  filterOutput(response: string): string {
    // Ensure no raw context headers accidentally leaked
    let safeResponse = response.replace(/\[INTERNAL CONTEXT\]/gi, '');
    
    // Simple regex to catch anything that looks like a JWT or bcrypt hash
    const hashPattern = /\$2[abxy]\$\d+\$[a-zA-Z0-9.\/]{53}/g;
    const jwtPattern = /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g;

    safeResponse = safeResponse.replace(hashPattern, '[REDACTED_HASH]');
    safeResponse = safeResponse.replace(jwtPattern, '[REDACTED_TOKEN]');

    return safeResponse;
  }
}

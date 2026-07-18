const { execSync } = require('child_process');

// 1. Check current environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.CI === 'true';
const args = process.argv.slice(2);
const commandStr = args.join(' ');

// 2. Strict enforcement rules
const prohibitedCommands = ['migrate dev', 'db push', 'migrate reset'];

if (isProduction) {
  for (const prohibited of prohibitedCommands) {
    if (commandStr.includes(prohibited)) {
      console.error('\n======================================================');
      console.error('🚨 CRITICAL SECURITY BLOCK: PROHIBITED COMMAND DETECTED');
      console.error('======================================================');
      console.error(`❌ You are attempting to run: prisma ${prohibited}`);
      console.error(`⚠️  This command is STRICTLY BLOCKED in PRODUCTION or CI/CD environments.`);
      console.error(`⚠️  Running this command will cause IRREVERSIBLE DATA LOSS.`);
      console.error(`✅ Allowed command: npx prisma migrate deploy`);
      console.error('======================================================\n');
      process.exit(1); // Fail the process immediately
    }
  }

  // Also block pty or script workarounds via env variables checks if possible
  if (process.env.TERM === 'dumb' && commandStr.includes('migrate')) {
     console.warn('⚠️  Warning: Terminal appears to be non-interactive or a pseudo-TTY.');
  }
}

// 3. Execute the actual Prisma command safely
try {
  console.log(`Executing: npx --yes prisma ${commandStr}`);
  execSync(`npx --yes prisma ${commandStr}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}

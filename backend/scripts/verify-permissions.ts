import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching roles and permissions from database...');

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const rolePermissions = await prisma.rolePermission.findMany();

  const matrixRows: string[] = [];
  
  // Markdown Header
  matrixRows.push('# PERMISSION AUDIT MATRIX');
  matrixRows.push('Generated automatically by `verify-permissions.ts`.');
  matrixRows.push('');
  matrixRows.push('| Role | Module | Permission Type | Granted | Override Status | Final Result |');
  matrixRows.push('|------|--------|-----------------|---------|-----------------|--------------|');

  roles.forEach(role => {
    permissions.forEach(perm => {
      const isGranted = rolePermissions.some(rp => rp.roleId === role.id && rp.permissionId === perm.id);
      
      const module = perm.category;
      const type = perm.action;
      const grantedText = isGranted ? '✅ Yes' : '❌ No';
      // User override is dynamic, but we can note that it's possible
      const overrideText = 'Possible via UserPermission';
      const finalResult = isGranted ? 'Allowed (unless overridden)' : 'Denied (unless overridden)';

      matrixRows.push(`| ${role.name} | ${module} | ${type} | ${grantedText} | ${overrideText} | ${finalResult} |`);
    });
  });

  const matrixContent = matrixRows.join('\n');
  const filePath = path.join(process.cwd(), '..', 'PERMISSION_MATRIX.md');
  
  fs.writeFileSync(filePath, matrixContent, 'utf8');
  console.log(`Permission matrix generated successfully at: ${filePath}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

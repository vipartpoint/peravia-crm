import { Injectable } from '@nestjs/common';

export interface ApprovalRuleResult {
  needsApproval: boolean;
  requiredRoles: string[];
  requestType: string;
  reason: string;
}

@Injectable()
export class ApprovalRulesEngine {
  
  // Sort order definition
  private readonly ROLE_ORDER = ['SalesManager', 'Finance', 'CEO'];

  evaluateOrder(
    orderAmount: number,
    highestDiscountPercent: number,
    creditExceeded: boolean,
    customerRiskStatus: string, // Normal, Warning, HighRisk, Blocked
    hasRecentBouncedCheque: boolean
  ): ApprovalRuleResult {
    let roles = new Set<string>();
    let types = new Set<string>();
    let reasons: string[] = [];

    // Rule: discount > 15%
    if (highestDiscountPercent > 15) {
      roles.add('SalesManager');
      roles.add('CEO');
      types.add('LargeDiscount');
      reasons.push(`Discount of ${highestDiscountPercent}% exceeds 15% limit.`);
    }
    // Rule: discount > 5%
    else if (highestDiscountPercent > 5) {
      roles.add('SalesManager');
      types.add('Discount');
      reasons.push(`Discount of ${highestDiscountPercent}% exceeds 5% limit.`);
    }

    // Rule: high order value (e.g. > 1,000,000,000)
    if (orderAmount > 1000000000) {
      roles.add('SalesManager');
      types.add('HighValueOrder');
      reasons.push(`Order amount (${orderAmount}) exceeds high-value threshold.`);
    }

    // Rule: credit limit exceeded
    if (creditExceeded) {
      roles.add('Finance');
      types.add('CreditLimitOverride');
      reasons.push('Customer credit limit exceeded.');
    }

    // Rule: Blocked customer
    if (customerRiskStatus === 'Blocked') {
      roles.add('CEO');
      types.add('BlockedCustomerOrder');
      reasons.push('Customer is blocked due to high risk or management decision.');
    }
    // Rule: HighRisk customer
    else if (customerRiskStatus === 'HighRisk') {
      roles.add('Finance');
      roles.add('CEO');
      types.add('HighRiskOrder');
      reasons.push('Customer is classified as High Risk.');
    }

    // Rule: recent bounced cheque
    if (hasRecentBouncedCheque) {
      roles.add('Finance');
      types.add('ChequeException');
      reasons.push('Customer has a recent bounced cheque.');
    }

    if (roles.size === 0) {
      return { needsApproval: false, requiredRoles: [], requestType: 'General', reason: '' };
    }

    // Sort roles according to workflow logic
    const sortedRoles = Array.from(roles).sort((a, b) => {
      const idxA = this.ROLE_ORDER.indexOf(a);
      const idxB = this.ROLE_ORDER.indexOf(b);
      return idxA - idxB;
    });

    const primaryType = Array.from(types)[0] || 'General';

    return {
      needsApproval: true,
      requiredRoles: sortedRoles,
      requestType: types.size > 1 ? 'MultipleExceptions' : primaryType,
      reason: reasons.join(' | ')
    };
  }
}

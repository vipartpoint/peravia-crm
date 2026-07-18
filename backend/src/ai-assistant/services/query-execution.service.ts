import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryExecutionService {
  detectIntent(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('فروش') || q.includes('sales')) {
      return 'sales_summary';
    }
    if (q.includes('کارشناس') || q.includes('بهترین') || q.includes('رتبه') || q.includes('top')) {
      return 'top_users';
    }
    if (q.includes('ریزش') || q.includes('ترک') || q.includes('churn')) {
      return 'churn_risk';
    }
    if (q.includes('چک') || q.includes('مطالبات') || q.includes('مالی') || q.includes('financial')) {
      return 'financials';
    }
    
    // Default fallback
    return 'sales_summary';
  }
}

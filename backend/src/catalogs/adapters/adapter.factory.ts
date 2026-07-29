import { CatalogAdapter } from './catalog-adapter.interface';
import { LostReasonAdapter } from './lost-reason.adapter';
import { ReopenReasonAdapter } from './reopen-reason.adapter';
import { CompetitorAdapter } from './competitor.adapter';
import { PresentationMethodAdapter } from './presentation-method.adapter';
import { CustomerReactionAdapter } from './customer-reaction.adapter';

export class AdapterFactory {
  static getAdapter(type: string): CatalogAdapter<any> | null {
    switch (type) {
      case 'lost-reasons':
        return new LostReasonAdapter();
      case 'reopen-reasons':
        return new ReopenReasonAdapter();
      case 'competitors':
        return new CompetitorAdapter();
      case 'presentation-methods':
        return new PresentationMethodAdapter();
      case 'customer-reactions':
        return new CustomerReactionAdapter();
      default:
        return null;
    }
  }
}

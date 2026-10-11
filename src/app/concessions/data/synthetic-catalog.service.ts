import { Injectable } from '@angular/core';
import { CatalogItem } from '../model/catalog-item';
import { SYNTHETIC_CATALOG } from './synthetic-catalog';

@Injectable({ providedIn: 'root' })
export class SyntheticCatalogService {
  /** Only what the client may order: any other status stays hidden. */
  listPublished(): CatalogItem[] {
    return SYNTHETIC_CATALOG.filter(item => item.status === 'PUBLISHED');
  }
}

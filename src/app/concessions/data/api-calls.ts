import { Observable, firstValueFrom } from 'rxjs';
import { asApiError } from '../../shell-contract';
import { Page } from '../model/pagination';

/** The largest page the contract allows. */
export const PAGE_SIZE = 100;

const FALLBACK_MESSAGE = 'No se pudo completar la operación. Inténtalo de nuevo.';

/** Every item of a paginated list of the API, read page by page. */
export async function allPages<T>(read: (page: number, limit: number) => Observable<Page<T>>): Promise<T[]> {
  const loaded: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const answer = await firstValueFrom(read(page, PAGE_SIZE));
    loaded.push(...answer.data);
    totalPages = answer.meta.totalPages;
    page++;
  } while (page <= totalPages);
  return loaded;
}

/** What the user can read about a failed call: the message of the API, or a generic one. */
export function messageOf(err: unknown): string {
  const apiError = asApiError(err);
  return apiError.code === 'UNKNOWN' ? FALLBACK_MESSAGE : apiError.userMessage;
}

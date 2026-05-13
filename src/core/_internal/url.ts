import type { ODataQuery } from '../../odata/ODataQuery';

/**
 * Append an OData query string to a URL that already has its own
 * leading `?projectId=...` segment. ODataQuery.toQueryString() starts
 * with `?`; we replace that with `&` so the URL stays well-formed.
 * Returns an empty string when no query is provided.
 *
 * Used by the four list endpoints whose server-side controllers
 * declare `@RequestParam UUID projectId` and therefore require
 * `projectId` as a plain HTTP query param (not as OData $filter):
 * `/tasks`, `/Features`, `/deliverables`, `/workstreams`.
 */
export function odataAfterProjectId(query?: ODataQuery): string {
  if (!query) return '';
  return query.toQueryString().replace(/^\?/, '&');
}

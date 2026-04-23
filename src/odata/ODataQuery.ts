export type SortOrder = 'asc' | 'desc';

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export interface IOrderByEntry {
  field: string;
  order: SortOrder;
}

export class ODataQuery {
  private _filter?: string;
  private _select?: string[];
  private _expand?: string[];
  private _orderby?: IOrderByEntry[];
  private _top?: number;
  private _skip?: number;
  private _count = false;
  private _search?: string;

  static new(): ODataQuery {
    return new ODataQuery();
  }

  filter(expr: string): this {
    this._filter = expr;
    return this;
  }

  select(fields: string[]): this {
    this._select = fields;
    return this;
  }

  expand(relations: string[]): this {
    this._expand = relations;
    return this;
  }

  orderby(field: string, order: SortOrder): this {
    if (!this._orderby) this._orderby = [];
    this._orderby.push({ field, order });
    return this;
  }

  top(limit: number): this {
    this._top = limit;
    return this;
  }

  skip(offset: number): this {
    this._skip = offset;
    return this;
  }

  count(enabled = true): this {
    this._count = enabled;
    return this;
  }

  search(term: string): this {
    this._search = term;
    return this;
  }

  clone(): ODataQuery {
    const c = new ODataQuery();
    c._filter = this._filter;
    c._select = this._select ? [...this._select] : undefined;
    c._expand = this._expand ? [...this._expand] : undefined;
    c._orderby = this._orderby
      ? this._orderby.map((e) => ({ ...e }))
      : undefined;
    c._top = this._top;
    c._skip = this._skip;
    c._count = this._count;
    c._search = this._search;
    return c;
  }

  toQueryString(): string {
    const params: string[] = [];

    if (this._filter !== undefined) {
      params.push(`$filter=${encodeRfc3986(this._filter)}`);
    }
    if (this._select !== undefined) {
      params.push(`$select=${this._select.join(',')}`);
    }
    if (this._expand !== undefined) {
      params.push(`$expand=${this._expand.join(',')}`);
    }
    if (this._orderby !== undefined) {
      const parts = this._orderby.map((e) => `${e.field} ${e.order}`);
      params.push(`$orderby=${parts.join(',')}`);
    }
    if (this._top !== undefined) {
      params.push(`$top=${this._top}`);
    }
    if (this._skip !== undefined) {
      params.push(`$skip=${this._skip}`);
    }
    if (this._count) {
      params.push('$count=true');
    }
    if (this._search !== undefined) {
      params.push(`$search=${encodeRfc3986(this._search)}`);
    }

    return params.length === 0 ? '' : `?${params.join('&')}`;
  }
}

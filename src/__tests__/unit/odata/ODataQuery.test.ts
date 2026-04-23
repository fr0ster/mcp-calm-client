import { ODataQuery } from '../../../odata/ODataQuery';

describe('ODataQuery', () => {
  test('empty query returns empty string', () => {
    expect(ODataQuery.new().toQueryString()).toBe('');
  });

  test('filter is URL-encoded', () => {
    const q = ODataQuery.new().filter("name eq 'test'");
    const s = q.toQueryString();
    expect(s.startsWith('?$filter=')).toBe(true);
    expect(s).toContain('name%20eq%20%27test%27');
  });

  test('select joins with comma, no encoding', () => {
    const s = ODataQuery.new().select(['name', 'id']).toQueryString();
    expect(s).toBe('?$select=name,id');
  });

  test('expand joins with comma', () => {
    const s = ODataQuery.new()
      .expand(['toProject', 'toStatus'])
      .toQueryString();
    expect(s).toBe('?$expand=toProject,toStatus');
  });

  test('orderby asc', () => {
    expect(ODataQuery.new().orderby('modifiedAt', 'asc').toQueryString()).toBe(
      '?$orderby=modifiedAt asc',
    );
  });

  test('orderby desc', () => {
    expect(ODataQuery.new().orderby('createdAt', 'desc').toQueryString()).toBe(
      '?$orderby=createdAt desc',
    );
  });

  test('multiple orderby entries', () => {
    const s = ODataQuery.new()
      .orderby('status', 'asc')
      .orderby('modifiedAt', 'desc')
      .toQueryString();
    expect(s).toBe('?$orderby=status asc,modifiedAt desc');
  });

  test('top', () => {
    expect(ODataQuery.new().top(10).toQueryString()).toBe('?$top=10');
  });

  test('skip', () => {
    expect(ODataQuery.new().skip(20).toQueryString()).toBe('?$skip=20');
  });

  test('pagination (top + skip) — order top before skip', () => {
    expect(ODataQuery.new().top(10).skip(20).toQueryString()).toBe(
      '?$top=10&$skip=20',
    );
  });

  test('count', () => {
    expect(ODataQuery.new().count().toQueryString()).toBe('?$count=true');
  });

  test('search is URL-encoded', () => {
    const s = ODataQuery.new().search('foo bar').toQueryString();
    expect(s).toBe('?$search=foo%20bar');
  });

  test('multiple params — canonical order', () => {
    const s = ODataQuery.new()
      .filter("projectId eq 'abc'")
      .select(['id', 'title'])
      .orderby('modifiedAt', 'desc')
      .top(50)
      .toQueryString();
    expect(s).toContain('$filter=');
    expect(s).toContain('$select=id,title');
    expect(s).toContain('$orderby=modifiedAt desc');
    expect(s).toContain('$top=50');
  });

  test('filter encodes special characters', () => {
    const s = ODataQuery.new()
      .filter("name eq 'O''Reilly & Sons'")
      .toQueryString();
    expect(s).toContain('%27');
    expect(s).toContain('%26');
  });

  test('clone produces independent copy', () => {
    const q1 = ODataQuery.new().filter('x eq 1').top(5);
    const q2 = q1.clone().top(10);
    expect(q1.toQueryString()).toContain('$top=5');
    expect(q2.toQueryString()).toContain('$top=10');
  });
});

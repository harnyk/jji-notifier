import type { SearchQuery } from './types.js';

export const QUERY: SearchQuery = {
    from: 0,
    itemsCount: 200,
    categories: ['javascript'],
    cityRadius: 30,
    employmentTypes: ['b2b'],
    remoteWorkOptions: ['remote'],
    currency: 'pln',
    experienceLevels: ['senior'],
    orderBy: 'descending',
    sortBy: 'publishedAt',
    // keywords: 'backend',
    keywordType: 'any',
};

/** Stage query — tweak this freely to compare against prod via `nr search` */
export const STAGE_QUERY: SearchQuery = {
    from: 0,
    itemsCount: 200,
    categories: ['javascript'],
    cityRadius: 30,
    employmentTypes: ['b2b'],
    remoteWorkOptions: ['remote'],
    currency: 'pln',
    experienceLevels: ['senior'],
    orderBy: 'descending',
    sortBy: 'publishedAt',
    // keywords: 'backend',
    keywordType: 'any',
};

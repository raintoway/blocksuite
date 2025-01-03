import type { DeltaInsert } from '@blocksuite/inline/types';

import type { ElementModelToPlainTextAdapterMatcher } from './type.js';

export const connectorElementModelToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'connector',
    match: elementModel => elementModel.type === 'connector',
    toAST: elementModel => {
      let text = '';
      if ('text' in elementModel && elementModel.text) {
        let delta: DeltaInsert[] = [];
        if ('delta' in elementModel.text) {
          delta = elementModel.text.delta as DeltaInsert[];
        }
        text = delta.map(d => d.insert).join('');
      }
      const content = `Connector, with text label "${text}"`;
      return { content };
    },
  };

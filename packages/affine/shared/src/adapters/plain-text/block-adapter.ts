import type { ExtensionType } from '@blocksuite/block-std';

import {
  createIdentifier,
  type ServiceIdentifier,
} from '@blocksuite/global/di';

import type { BlockAdapterMatcher } from '../type.js';

export type BlockPlainTextAdapterMatcher = BlockAdapterMatcher;

export const BlockPlainTextAdapterMatcherIdentifier =
  createIdentifier<BlockPlainTextAdapterMatcher>(
    'BlockPlainTextAdapterMatcher'
  );

export function BlockPlainTextAdapterExtension(
  matcher: BlockPlainTextAdapterMatcher
): ExtensionType & {
  identifier: ServiceIdentifier<BlockPlainTextAdapterMatcher>;
} {
  const identifier = BlockPlainTextAdapterMatcherIdentifier(matcher.flavour);
  return {
    setup: di => {
      di.addImpl(identifier, () => matcher);
    },
    identifier,
  };
}
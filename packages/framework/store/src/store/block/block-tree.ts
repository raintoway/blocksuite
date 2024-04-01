import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import { native2Y } from '../../reactive/index.js';
import type { BlockModel, Schema } from '../../schema/index.js';
import { internalPrimitives } from '../../schema/index.js';
import type { Doc } from '../doc.js';
import type { BlockOptions } from './block.js';
import { Block } from './block.js';

type BlockTreeOptions = {
  schema: Schema;
  doc: Doc;
};

export class BlockTree {
  protected readonly _schema: Schema;
  protected readonly _blocks: Map<string, Block> = new Map();
  protected readonly _doc: Doc;

  hasBlock(id: string) {
    return this._blocks.has(id);
  }

  getBlock(id: string) {
    return this._blocks.get(id);
  }

  get blocks() {
    return this._blocks;
  }

  private get _yBlocks() {
    return this._doc.yBlocks;
  }

  constructor({ schema, doc }: BlockTreeOptions) {
    this._doc = doc;
    this._schema = schema;
  }

  onBlockAdded(id: string, options: BlockOptions = {}) {
    if (this._blocks.has(id)) {
      return;
    }
    const yBlock = this._yBlocks.get(id);
    if (!yBlock) {
      console.warn(`Could not find block with id ${id}`);
      return;
    }

    const block = new Block(this._schema, yBlock, this._doc, options);

    this._blocks.set(id, block);
    block.model.created.emit();
  }

  onBlockRemoved(id: string) {
    if (!this._blocks.has(id)) {
      return;
    }

    const block = this._blocks.get(id)!;
    block.model.dispose();
    this._blocks.delete(id);
    block.model.deleted.emit();
  }

  addBlock(id: string, flavour: string, initialProps: Record<string, unknown>) {
    const schema = this._schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Could not find schema for flavour ${flavour}`);

    const yBlock = new Y.Map();
    this._yBlocks.set(id, yBlock);

    const version = schema.version;
    yBlock.set('sys:id', id);
    yBlock.set('sys:flavour', flavour);
    yBlock.set('sys:version', version);

    const defaultProps = schema.model.props?.(internalPrimitives) ?? {};
    const props = {
      ...defaultProps,
      ...initialProps,
    };

    const yChildren = Y.Array.from(
      (props.children ?? []).map((child: BlockModel) => child.id)
    );
    yBlock.set('sys:children', yChildren);

    delete props.children;
    delete props.id;
    delete props.flavour;

    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined) return;

      yBlock.set(`prop:${key}`, native2Y(value));
    });

    return yBlock;
  }

  removeBlock(id: string) {
    this._yBlocks.delete(id);
  }
}

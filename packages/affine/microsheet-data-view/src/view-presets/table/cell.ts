import { type BlockStdScope, ShadowlessElement } from '@blocksuite/block-std';
import {
  assertExists,
  SignalWatcher,
  WithDisposable,
} from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../core/property/index.js';
import type { SingleView } from '../../core/view-manager/single-view.js';
import type { TableColumn } from './table-view-manager.js';
import type { TableViewSelectionWithType } from './types.js';

import { renderUniLit } from '../../core/index.js';

export class MicrosheetCellContainer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    affine-microsheet-cell-container {
      display: flex;
      align-items: start;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
    }

    affine-microsheet-cell-container * {
      box-sizing: border-box;
    }

    affine-microsheet-cell-container microsheet-uni-lit > *:first-child {
      padding: 8px;
    }
  `;

  private _cell = createRef<DataViewCellLifeCycle>();

  cell$ = computed(() => {
    return this.column.cellGet(this.rowId);
  });

  selectCurrentCell = (editing: boolean, focusTo?: 'start' | 'end') => {
    if (this.view.readonly$.value) {
      return;
    }
    const selectionView = this.selectionView;
    if (selectionView) {
      // if (selection && this.isSelected(selection) && editing) {
      //   selectionView.selection = TableAreaSelection.create({
      //     groupKey: this.groupKey,
      //     focus: {
      //       rowIndex: this.rowIndex,
      //       columnIndex: this.columnIndex,
      //     },
      //     isEditing: true,
      //   });
      // } else {
      //   selectionView.selection = TableAreaSelection.create({
      //     groupKey: this.groupKey,
      //     focus: {
      //       rowIndex: this.rowIndex,
      //       columnIndex: this.columnIndex,
      //     },
      //     isEditing: false,
      //   });
      // }
      if (selectionView) {
        this.selectionView.focus = {
          rowIndex: this.rowIndex,
          columnIndex: this.columnIndex,
        };
      }

      if (focusTo && this.std) {
        const richTexts = this.querySelectorAll('rich-text');

        if (richTexts.length) {
          if (focusTo === 'start') {
            richTexts[0].inlineEditor?.focusStart();
          } else {
            richTexts[richTexts.length - 1].inlineEditor?.focusEnd();
          }
        }
      }
    }
  };

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  private get groupKey() {
    return this.closest('affine-microsheet-data-view-table-group')?.group?.key;
  }

  private get readonly() {
    return this.column.readonly$.value;
  }

  private get selectionView() {
    return this.closest('affine-microsheet-table')?.selectionController;
  }

  get table() {
    const table = this.closest('affine-microsheet-table');
    assertExists(table);
    return table;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', e => {
      if (!this.isEditing) {
        if (
          e.target &&
          e.target.tagName === 'AFFINE-MICROSHEET-CELL-CONTAINER'
        ) {
          this.selectCurrentCell(!this.column.readonly$.value, 'end');
        } else {
          this.selectCurrentCell(!this.column.readonly$.value);
        }
      }
    });
  }

  isSelected(selection: TableViewSelectionWithType) {
    if (selection.selectionType !== 'area') {
      return false;
    }
    if (selection.groupKey !== this.groupKey) {
      return;
    }
    if (selection.focus.columnIndex !== this.columnIndex) {
      return;
    }
    return selection.focus.rowIndex === this.rowIndex;
  }

  override render() {
    if (!this.std) return nothing;

    const refId = this.view.cellRefGet(this.rowId, this.column.id);
    if (!refId) return;

    const refModel = this.std.doc.getBlockById(refId as string);

    assertExists(refModel);
    return html`<affine-cell data-block-id=${refModel.id}></affine-cell>`;
    const renderer = this.column.renderer$.value;
    if (!renderer) {
      return;
    }
    const { edit, view } = renderer;
    const uni = !this.readonly && this.isEditing && edit != null ? edit : view;
    const props: CellRenderProps = {
      cell: this.cell$.value,
      isEditing: this.isEditing,
      selectCurrentCell: this.selectCurrentCell,
    };

    return renderUniLit(uni, props, {
      ref: this._cell,
      style: {
        display: 'contents',
      },
    });
  }

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor columnId!: string;

  @property({ attribute: false })
  accessor columnIndex!: number;

  @state()
  accessor isEditing = false;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor std!: BlockStdScope;

  @property({ attribute: false })
  accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-microsheet-cell-container': MicrosheetCellContainer;
  }
}

import { css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { SingleView } from '../../core/view-manager/single-view.js';
import type { ViewManager } from '../../core/view-manager/view-manager.js';
import type {
  MicrosheetDataViewWidget,
  MicrosheetDataViewWidgetProps,
} from '../../core/widget/types.js';

import { type DataViewExpose, renderUniLit } from '../../core/index.js';
import { WidgetBase } from '../../core/widget/widget-base.js';

const styles = css`
  .affine-microsheet-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    visibility: hidden;
    opacity: 0;
    transition: opacity 150ms cubic-bezier(0.42, 0, 1, 1);
  }

  .toolbar-hover-container:hover .affine-microsheet-toolbar {
    visibility: visible;
    opacity: 1;
  }

  .show-toolbar {
    visibility: visible;
    opacity: 1;
  }

  @media print {
    .affine-microsheet-toolbar {
      display: none;
    }
  }
`;

export class DataViewHeaderTools extends WidgetBase {
  static override styles = styles;

  override render() {
    const classList = classMap({
      'show-toolbar': this.showToolBar,
      'affine-microsheet-toolbar': true,
    });
    const tools = this.toolsMap[this.view.type];
    return html` <div class="${classList}">
      ${repeat(tools ?? [], uni => {
        const props: MicrosheetDataViewWidgetProps = {
          view: this.view,
          viewMethods: this.viewMethods,
        };
        return renderUniLit(uni, props);
      })}
    </div>`;
  }

  @state()
  accessor showToolBar = false;

  @property({ attribute: false })
  accessor toolsMap!: Record<string, MicrosheetDataViewWidget[]>;
}

declare global {
  interface HTMLElementTagNameMap {
    'microsheet-data-view-header-tools': DataViewHeaderTools;
  }
}
export const renderTools = (
  view: SingleView,
  viewMethods: DataViewExpose,
  viewSource: ViewManager
) => {
  return html`<data-view-header-tools
    .viewMethods="${viewMethods}"
    .view="${view}"
    .viewSource="${viewSource}"
  ></data-view-header-tools>`;
};
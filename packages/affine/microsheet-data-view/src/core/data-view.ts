import type { BlockStdScope } from '@blocksuite/block-std';

import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type { DataSource } from './common/data-source/base.js';
import type {
  MicrosheetDataViewSelection,
  MicrosheetDataViewSelectionState,
} from './types.js';
import type { DataViewExpose, DataViewProps } from './view/types.js';
import type { SingleView } from './view-manager/single-view.js';

import { dataViewCommonStyle } from './common/css-variable.js';
import { renderUniLit } from './utils/uni-component/index.js';

type ViewProps = {
  view: SingleView;
  selection$: ReadonlySignal<MicrosheetDataViewSelectionState>;
  setSelection: (selection?: MicrosheetDataViewSelectionState) => void;
  bindHotkey: DataViewProps['bindHotkey'];
  handleEvent: DataViewProps['handleEvent'];
};

export type DataViewRendererConfig = {
  bindHotkey: DataViewProps['bindHotkey'];
  handleEvent: DataViewProps['handleEvent'];
  virtualPadding$: DataViewProps['virtualPadding$'];
  selection$: ReadonlySignal<MicrosheetDataViewSelection | undefined>;
  setSelection: (selection: MicrosheetDataViewSelection | undefined) => void;
  dataSource: DataSource;
  headerWidget: DataViewProps['headerWidget'];
  onDrag?: DataViewProps['onDrag'];
  std: BlockStdScope;
};

export class DataViewRenderer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-microsheet-data-view-renderer'))}
    affine-microsheet-data-view-renderer {
      background-color: var(--affine-background-primary-color);
      display: contents;
    }
  `;

  private _view = createRef<{ expose: DataViewExpose }>();

  @property({ attribute: false })
  accessor config!: DataViewRendererConfig;

  private currentViewId$ = computed(() => {
    return this.config.dataSource.viewManager.currentViewId$.value;
  });

  viewMap$ = computed(() => {
    const manager = this.config.dataSource.viewManager;
    return Object.fromEntries(
      manager.views$.value.map(view => [view, manager.viewGet(view)])
    );
  });

  currentViewConfig$ = computed<ViewProps | undefined>(() => {
    const currentViewId = this.currentViewId$.value;
    if (!currentViewId) {
      return;
    }
    const view = this.viewMap$.value[currentViewId];
    return {
      view: view,
      selection$: computed(() => {
        const selection$ = this.config.selection$;
        if (selection$.value?.viewId === currentViewId) {
          return selection$.value;
        }
        return;
      }),
      setSelection: selection => {
        this.config.setSelection(selection);
      },
      handleEvent: (name, handler) =>
        this.config.handleEvent(name, context => {
          return handler(context);
        }),
      bindHotkey: hotkeys =>
        this.config.bindHotkey(
          Object.fromEntries(
            Object.entries(hotkeys).map(([key, fn]) => [
              key,
              ctx => {
                return fn(ctx);
              },
            ])
          )
        ),
    };
  });

  focusFirstCell = () => {
    this.view?.expose.focusFirstCell();
  };

  get view() {
    return this._view.value;
  }

  private renderView(viewData?: ViewProps) {
    if (!viewData) {
      return;
    }
    const props: DataViewProps = {
      dataViewEle: this,
      headerWidget: this.config.headerWidget,
      view: viewData.view,
      selection$: viewData.selection$,
      setSelection: viewData.setSelection,
      bindHotkey: viewData.bindHotkey,
      handleEvent: viewData.handleEvent,
      onDrag: this.config.onDrag,
      std: this.config.std,
      dataSource: this.config.dataSource,
      virtualPadding$: this.config.virtualPadding$,
    };
    return keyed(
      viewData.view.id,
      renderUniLit(
        viewData.view.meta.renderer.view,
        { props },
        {
          ref: this._view,
        }
      )
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    let preId: string | undefined = undefined;
    this.disposables.add(
      this.currentViewId$.subscribe(current => {
        if (current !== preId) {
          this.config.setSelection(undefined);
        }
        preId = current;
      })
    );
  }

  override render() {
    const containerClass = classMap({
      'toolbar-hover-container': true,
      'data-view-root': true,
      'prevent-reference-popup': true,
    });
    return html`
      <div style="display: contents" class="${containerClass}">
        ${this.renderView(this.currentViewConfig$.value)}
      </div>
    `;
  }

  @state()
  accessor currentView: string | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-microsheet-data-view-renderer': DataViewRenderer;
  }
}

export class DataView {
  private _ref = createRef<DataViewRenderer>();

  get expose() {
    return this._ref.value?.view?.expose;
  }

  render(props: DataViewRendererConfig) {
    return html`<affine-microsheet-data-view-renderer
      ${ref(this._ref)}
      .config="${props}"
    ></affine-microsheet-data-view-renderer>`;
  }
}
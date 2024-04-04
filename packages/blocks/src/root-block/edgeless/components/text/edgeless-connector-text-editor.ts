import '../../../../_common/components/rich-text/rich-text.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { isCssVariable } from '../../../../_common/theme/css-variables.js';
import { getLineHeight } from '../../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import {
  Bound,
  type ConnectorElementModel,
  ConnectorMode,
  type IVec2,
  Polyline,
  toRadian,
  Vec,
} from '../../../../surface-block/index.js';
import {
  getBezierParameters,
  getBezierPoint,
} from '../../../../surface-block/utils/curve.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
// import { deleteElements } from '../../utils/crud.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-connector-text-editor')
export class EdgelessConnectorTextEditor extends WithDisposable(
  ShadowlessElement
) {
  static PLACEHOLDER_TEXT = 'Add text';
  static HORIZONTAL_PADDING = 10;
  static VERTICAL_PADDING = 6;
  static BORDER_WIDTH = 1;

  static override styles = css`
    .edgeless-connector-text-editor {
      box-sizing: border-box;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10;
      transform-origin: center;
      border: ${EdgelessConnectorTextEditor.BORDER_WIDTH}px solid
        var(--affine-primary-color, #1e96eb);
      border-radius: 4px;
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      padding: ${EdgelessConnectorTextEditor.VERTICAL_PADDING}px
        ${EdgelessConnectorTextEditor.HORIZONTAL_PADDING}px;
      overflow: visible;
    }

    .edgeless-connector-text-editor .inline-editor {
      white-space: pre-wrap !important;
      outline: none;
    }

    .edgeless-connector-text-editor .inline-editor span {
      word-break: normal !important;
      overflow-wrap: anywhere !important;
    }

    .edgeless-connector-text-editor-placeholder {
      pointer-events: none;
      color: var(--affine-text-disable-color);
      white-space: nowrap;
    }
  `;

  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  element!: ConnectorElementModel;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  private _keeping = false;
  private _isComposition = false;

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  getCoordsOnRightAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;

    let deltaXPrime =
      (rect.w / 2) * Math.cos(rect.r) - (-rect.h / 2) * Math.sin(rect.r);
    let deltaYPrime =
      (rect.w / 2) * Math.sin(rect.r) + (-rect.h / 2) * Math.cos(rect.r);

    const vX = centerX + deltaXPrime;
    const vY = centerY + deltaYPrime;

    deltaXPrime = (w1 / 2) * Math.cos(rect.r) - (-h1 / 2) * Math.sin(rect.r);
    deltaYPrime = (w1 / 2) * Math.sin(rect.r) + (-h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  getCoordsOnCenterAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;

    let deltaXPrime = 0;
    let deltaYPrime = (-rect.h / 2) * Math.cos(rect.r);

    const vX = centerX + deltaXPrime;
    const vY = centerY + deltaYPrime;

    deltaXPrime = 0;
    deltaYPrime = (-h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  getCoordsOnLeftAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const cX = rect.x + rect.w / 2;
    const cY = rect.y + rect.h / 2;

    let deltaXPrime =
      (-rect.w / 2) * Math.cos(rect.r) + (rect.h / 2) * Math.sin(rect.r);
    let deltaYPrime =
      (-rect.w / 2) * Math.sin(rect.r) - (rect.h / 2) * Math.cos(rect.r);

    const vX = cX + deltaXPrime;
    const vY = cY + deltaYPrime;

    deltaXPrime = (-w1 / 2) * Math.cos(rect.r) + (h1 / 2) * Math.sin(rect.r);
    deltaYPrime = (-w1 / 2) * Math.sin(rect.r) - (h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  private _updateRect = () => {
    const edgeless = this.edgeless;
    const element = this.element;

    if (!edgeless || !element) return;

    const newWidth = this.inlineEditorContainer.scrollWidth;
    const newHeight = this.inlineEditorContainer.scrollHeight;
    const bound = new Bound(element.x, element.y, newWidth, newHeight);
    const { x, y, w, h, rotate } = element;

    switch (element.textAlign) {
      case 'left':
        {
          const newPos = this.getCoordsOnLeftAlign(
            {
              x,
              y,
              w,
              h,
              r: toRadian(rotate),
            },
            newWidth,
            newHeight
          );

          bound.x = newPos.x;
          bound.y = newPos.y;
        }
        break;
      case 'center':
        {
          const newPos = this.getCoordsOnCenterAlign(
            {
              x,
              y,
              w,
              h,
              r: toRadian(rotate),
            },
            newWidth,
            newHeight
          );

          bound.x = newPos.x;
          bound.y = newPos.y;
        }
        break;
      case 'right':
        {
          const newPos = this.getCoordsOnRightAlign(
            {
              x,
              y,
              w,
              h,
              r: toRadian(rotate),
            },
            newWidth,
            newHeight
          );

          bound.x = newPos.x;
          bound.y = newPos.y;
        }
        break;
    }

    console.log(bound);
    // edgeless.service.updateElement(element.id, {
    //   xywh: bound.serialize(),
    // });
  };

  getVisualPosition(element: ConnectorElementModel) {
    const { x, y, mode, path } = element;
    let px = 0;
    let py = 0;
    if (mode === ConnectorMode.Straight) {
      const first = path[0];
      const last = path[path.length - 1];
      const point = Vec.lrp(first, last, 0.5);
      px = point[0];
      py += point[1];
    } else if (mode === ConnectorMode.Orthogonal) {
      const point = Polyline.pointAt(
        path.map<IVec2>(p => [p[0], p[1]]),
        0.5
      );
      assertExists(point);
      px = point[0];
      py += point[1];
    } else {
      const b = getBezierParameters(path);
      const point = getBezierPoint(b, 0.5);
      assertExists(point);
      px = point[0];
      py += point[1];
    }
    return [x + px, y + py];
  }

  getContainerOffset() {
    const { VERTICAL_PADDING, HORIZONTAL_PADDING, BORDER_WIDTH } =
      EdgelessConnectorTextEditor;
    return `-${HORIZONTAL_PADDING + BORDER_WIDTH}px, -${
      VERTICAL_PADDING + BORDER_WIDTH
    }px`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.edgeless) {
      throw new Error('edgeless is not set.');
    }
    if (!this.element) {
      throw new Error('text element is not set.');
    }
  }

  override firstUpdated(): void {
    const edgeless = this.edgeless;
    const element = this.element;
    const { dispatcher } = this.edgeless;
    assertExists(dispatcher);

    this.updateComplete
      .then(() => {
        this.inlineEditor.slots.renderComplete.on(() => {
          this._updateRect();
          this.requestUpdate();
        });

        this.disposables.add(
          edgeless.service.surface.elementUpdated.on(({ id }) => {
            if (id === element.id) this.requestUpdate();
          })
        );

        this.disposables.add(
          edgeless.service.viewport.viewportUpdated.on(() => {
            this.requestUpdate();
          })
        );

        this.disposables.add(dispatcher.add('click', () => true));
        this.disposables.add(dispatcher.add('doubleClick', () => true));

        this.disposables.add(() => {
          if (element.text?.length === 0) {
            element.text = undefined;
          } else {
            element.displayText = true;
          }

          edgeless.service.selection.set({
            elements: [],
            editing: false,
          });
        });

        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          () => !this._keeping && this.remove()
        );

        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionstart',
          () => {
            this._isComposition = true;
            this.requestUpdate();
          }
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionend',
          () => {
            this._isComposition = false;
            this.requestUpdate();
          }
        );
      })
      .catch(console.error);
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const {
      text,
      fontFamily,
      fontSize,
      fontWeight,
      color,
      textAlign,
      rotate,
      hasMaxWidth,
      w,
    } = this.element;
    assertExists(text);

    const lineHeight = getLineHeight(fontFamily, fontSize);
    const rect = getSelectedRect([this.element]);

    const { translateX, translateY, zoom } = this.edgeless.service.viewport;
    const [visualX, visualY] = this.getVisualPosition(this.element);
    // const containerOffset = this.getContainerOffset();
    const transformOperation = [
      'translate(-50%, -50%)',
      `translate(${translateX}px, ${translateY}px)`,
      `translate(${visualX * zoom}px, ${visualY * zoom}px)`,
      `scale(${zoom})`,
      `rotate(${rotate}deg)`,
      // `translate(${containerOffset})`,
    ];

    const isEmpty = !text.length && !this._isComposition;

    return html`<div
      style=${styleMap({
        transform: transformOperation.join(' '),
        minWidth: hasMaxWidth ? `${rect.width}px` : 'none',
        maxWidth: hasMaxWidth ? `${w}px` : 'none',
        fontFamily: `"${fontFamily}"`,
        fontSize: `${fontSize}px`,
        fontWeight,
        color: isCssVariable(color) ? `var(${color})` : color,
        textAlign,
        lineHeight: `${lineHeight}px`,
      })}
      class="edgeless-connector-text-editor"
    >
      <rich-text
        .yText=${text}
        .enableFormat=${false}
        .enableAutoScrollHorizontally=${false}
        .enableAutoScrollVertically=${false}
        style=${isEmpty
          ? styleMap({
              position: 'absolute',
              left: 0,
              top: 0,
              padding: `${EdgelessConnectorTextEditor.VERTICAL_PADDING}px
        ${EdgelessConnectorTextEditor.HORIZONTAL_PADDING}px`,
            })
          : nothing}
      ></rich-text>
      ${isEmpty
        ? html`<span class="edgeless-connector-text-editor-placeholder">
            Add Text
          </span>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-text-editor': EdgelessConnectorTextEditor;
  }
}

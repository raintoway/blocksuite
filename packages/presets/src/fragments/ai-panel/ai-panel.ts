import {
  type BlockSuiteRoot,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/lit';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EditorContainer } from '../../index.js';
import { GPTAPI, type GPTAPIPayloadMap } from './actions/index.js';
import { EditorWithAI } from './api.js';
import { LANGUAGE, TONE } from './config.js';
import { APIKeys } from './utils/api-keys.js';
import { insertFromMarkdown } from './utils/markdown-utils.js';
import { getSelectedBlocks, stopPropagation } from './utils/selection-utils.js';

@customElement('ai-panel')
export class AiPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    ai-panel {
      width: 100%;
      font-family: var(--affine-font-family);
      overflow-y: scroll;
      overflow-x: visible;
    }

    .ai-panel-setting-title {
      font-size: 14px;
      margin-top: 12px;
      margin-bottom: 4px;
      color: var(--affine-text-secondary-color);
    }
    .ai-panel-key-input {
      width: 100%;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      border-radius: 4px;
      padding: 8px;
      box-sizing: border-box;
      margin-bottom: 12px;
    }

    .ai-panel-action-button {
      cursor: pointer;
      user-select: none;
      padding: 4px;
      background-color: var(--affine-primary-color);
      border-radius: 8px;
      color: white;
      height: 32px;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 36px;
    }
    .ai-panel-action-prompt {
      width: 100%;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      border-radius: 4px;
      padding: 8px;
      box-sizing: border-box;
      margin-top: 8px;
    }

    .ai-panel-action-description {
      font-size: 14px;
      margin-bottom: 8px;
      margin-top: 4px;
      color: var(--affine-text-secondary-color);
    }
  `;

  @state()
  private _result = '';

  @property({ attribute: false })
  editor!: EditorContainer;
  editorWithAI?: EditorWithAI;
  get api() {
    if (!this.editorWithAI) {
      this.editorWithAI = new EditorWithAI(this.editor);
    }
    return this.editorWithAI;
  }

  get page() {
    return this.editor.page;
  }

  get root() {
    return this.editor.root as BlockSuiteRoot;
  }

  public override connectedCallback() {
    super.connectedCallback();
  }

  private async _replace() {
    if (!this._result) return;

    const selectedBlocks = await getSelectedBlocks(this.root);
    if (!selectedBlocks.length) return;

    const firstBlock = selectedBlocks[0];
    const parentBlock = firstBlock.parentBlockElement;

    // update selected block
    const firstIndex = parentBlock.model.children.findIndex(
      child => child.id === firstBlock.model.id
    ) as number;
    selectedBlocks.forEach(block => {
      this.page.deleteBlock(block.model);
    });

    const models = await insertFromMarkdown(
      this.root,
      this._result,
      parentBlock.model.id,
      firstIndex
    );
    setTimeout(async () => {
      const parentPath = firstBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.root.selection.getInstance('block', { path }));
      this.root.selection.setGroup('note', selections);
    }, 0);
  }

  private async _insertBelow() {
    if (!this._result) return;

    const selectedBlocks = await getSelectedBlocks(this.root);
    const blockLength = selectedBlocks.length;
    if (!blockLength) return;

    const lastBlock = selectedBlocks[blockLength - 1];
    const parentBlock = lastBlock.parentBlockElement;

    const lastIndex = parentBlock.model.children.findIndex(
      child => child.id === lastBlock.model.id
    ) as number;

    const models = await insertFromMarkdown(
      this.root,
      this._result,
      parentBlock.model.id,
      lastIndex + 1
    );

    setTimeout(async () => {
      const parentPath = lastBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.root.selection.getInstance('block', { path }));
      this.root.selection.setGroup('note', selections);
    }, 0);
  }

  private _ResultArea() {
    if (!this._result) return nothing;

    return html`
      <div style="margin-top: 16px;">${this._result}</div>
      <div style="display:flex;align-items:center;">
        <div
          class="ai-panel-action-button"
          style="flex: 1;"
          @click="${this._replace}"
        >
          Replace
        </div>
        <div
          class="ai-panel-action-button"
          style="flex: 1;"
          @click="${this._insertBelow}"
        >
          Insert below
        </div>
      </div>
    `;
  }

  config = () => {
    const changeGPTAPIKey = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        APIKeys.GPTAPIKey = e.target.value;
      }
    };
    const changeFalAPIKey = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        APIKeys.FalAPIKey = e.target.value;
      }
    };
    return html`
      <div>
        <div class="ai-panel-setting-title">GPT API Key</div>
        <input
          class="ai-panel-key-input"
          type="text"
          @keydown="${stopPropagation}"
          .value="${APIKeys.GPTAPIKey}"
          @input="${changeGPTAPIKey}"
        />
        <div class="ai-panel-setting-title">Fal API Key</div>
        <input
          class="ai-panel-key-input"
          type="text"
          @keydown="${stopPropagation}"
          .value="${APIKeys.FalAPIKey}"
          @input="${changeFalAPIKey}"
        />
      </div>
    `;
  };
  @state()
  payload: { type: keyof GPTAPIPayloadMap } & Record<string, unknown> = {
    type: 'answer',
  };
  changeType = (e: Event) => {
    if (e.target instanceof HTMLSelectElement) {
      this.payload = { type: e.target.value as keyof GPTAPIPayloadMap };
    }
  };
  ask = async () => {
    const result = await this.api?.textCompletion(
      this.payload.type,
      this.payload
    );
    this._result = result ?? '';
  };
  extraPayload: Record<keyof GPTAPIPayloadMap, () => TemplateResult | null> = {
    answer: () => {
      const change = (e: Event) => {
        if (e.target instanceof HTMLInputElement) {
          this.payload.question = e.target.value;
          console.log(this.payload);
        }
      };
      return html`<div style="margin-top: 16px;">
        <input
          class="ai-panel-action-prompt"
          type="text"
          .value="${this.payload.question ?? ''}"
          @input="${change}"
        />
      </div>`;
    },
    refine: () => null,
    generate: () => null,
    summary: () => null,
    translate: () => {
      const change = (e: Event) => {
        if (e.target instanceof HTMLSelectElement) {
          this.payload.language = e.target.value;
        }
      };
      return html`<div style="margin-top: 16px;">
        <div style="display:flex;align-items:center;">
          <div style="margin-right: 4px;">Language:</div>
          <select @change="${change}">
            ${repeat(LANGUAGE, key => {
              return html`<option>${key}</option>`;
            })}
          </select>
        </div>
      </div>`;
    },
    improveWriting: () => null,
    fixSpelling: () => null,
    makeShorter: () => null,
    makeLonger: () => null,
    changeTone: () => {
      const change = (e: Event) => {
        if (e.target instanceof HTMLSelectElement) {
          this.payload.tone = e.target.value;
        }
      };
      return html`<div style="margin-top: 16px;">
        <div style="display:flex;align-items:center;">
          <div style="margin-right: 4px;">Tone:</div>
          <select @change="${change}">
            ${repeat(TONE, key => {
              return html`<option>${key}</option>`;
            })}
          </select>
        </div>
      </div>`;
    },
    simplifyLanguage: () => null,
  };
  doc = () => {
    return html` <div style="margin-top: 16px;">
      <div style="display:flex;align-items:center;">
        <div style="margin-right: 4px;">Action:</div>
        <select @change="${this.changeType}">
          ${repeat(Object.keys(GPTAPI), key => {
            return html`<option>${key}</option>`;
          })}
        </select>
      </div>
      ${this.extraPayload[this.payload.type]()}
      <div class="ai-panel-action-button" @click="${this.ask}">Ask</div>
      <div>${this._ResultArea()}</div>
    </div>`;
  };
  edgeless = () => {
    return html`
      <div class="ai-panel-action-button" @click="${this.api.makeItReal}">
        Make It Real
      </div>
      <div class="ai-panel-action-description">
        Select some shapes and text to generate html
      </div>
      <div class="ai-panel-action-button" @click="${this.api.createImage}">
        Create Image
      </div>
      <input
        id="ai-panel-create-image-prompt"
        class="ai-panel-action-prompt"
        type="text"
        @keydown="${stopPropagation}"
        placeholder="Prompt"
      />
      <div class="ai-panel-action-description">
        Type prompt to create an image.
      </div>
      <div class="ai-panel-action-button" @click="${this.api.showMeImage}">
        Edit Image
      </div>
      <input
        id="ai-panel-edit-image-prompt"
        class="ai-panel-action-prompt"
        type="text"
        @keydown="${stopPropagation}"
        placeholder="Prompt"
      />
      <div class="ai-panel-action-description">
        Select some shapes and type prompt to edit them.
      </div>
      <div class="ai-panel-action-button" @click="${this.api.htmlBlockDemo}">
        HTML Block Test
      </div>
      <div class="ai-panel-action-description">Generate a html block</div>
    `;
  };
  panels = {
    config: {
      render: this.config,
    },
    doc: {
      render: this.doc,
    },
    edgeless: {
      render: this.edgeless,
    },
  };
  @state()
  currentPanel: keyof typeof this.panels = 'config';

  override render() {
    const panel = this.panels[this.currentPanel];
    return html`
      <div style="display:flex;flex-direction: column;padding: 12px;">
        <div style="display:flex;align-items:center;justify-content:center;">
          <div
            style="display:flex;align-items:center;justify-content:center;cursor: pointer;user-select: none;width: max-content;padding: 4px; background-color: var(--affine-hover-color);border-radius: 12px;"
          >
            ${repeat(Object.keys(this.panels), key => {
              const changePanel = () => {
                this.currentPanel = key as keyof typeof this.panels;
              };
              const style = styleMap({
                'background-color':
                  this.currentPanel === key ? 'white' : 'transparent',
                padding: '4px 8px',
                'border-radius': '8px',
              });
              return html` <div style="${style}" @click="${changePanel}">
                ${key}
              </div>`;
            })}
          </div>
        </div>
        <div>${panel.render()}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel': AiPanel;
  }
}
import type { EditorHost } from '@blocksuite/block-std';
import {
  AFFINE_EDGELESS_COPILOT_WIDGET,
  type CopilotSelectionController,
  type EdgelessCopilotWidget,
  type EdgelessRootService,
  MindmapElementModel,
  NoteBlockModel,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { getAIPanel } from '../ai-panel.js';
import { actionToGenerateAnswer } from './handler.js';

function getService(host: EditorHost) {
  const edgelessService = host.spec.getService(
    'affine:page'
  ) as EdgelessRootService;

  return edgelessService;
}

function getCopilotPalen(host: EditorHost) {
  const rootBlockId = host.doc.root?.id as string;
  const copilotPanel = host.view.getWidget(
    AFFINE_EDGELESS_COPILOT_WIDGET,
    rootBlockId
  );

  return copilotPanel as EdgelessCopilotWidget;
}

function getCopilotSelectedElems(host: EditorHost) {
  const service = getService(host);

  return (service.tool.controllers['copilot'] as CopilotSelectionController)
    .selectedElements;
}

export function actionToHandler<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
) {
  return (host: EditorHost) => {
    const aiPanel = getAIPanel(host);
    assertExists(aiPanel.config);

    const copilotPanel = getCopilotPalen(host);

    aiPanel.config.generateAnswer = actionToGenerateAnswer(id, variants)(host);
    aiPanel.toggle(copilotPanel.selectionElem, 'placeholder');
  };
}

export function noteBlockShowWen(_: unknown, __: unknown, host: EditorHost) {
  const selected = getCopilotSelectedElems(host);

  return selected[0] instanceof NoteBlockModel;
}

export function noteWithCodeBlockShowWen(
  _: unknown,
  __: unknown,
  host: EditorHost
) {
  const selected = getCopilotSelectedElems(host);

  return selected[0] instanceof NoteBlockModel;
}

export function mindmapShowWhen(_: unknown, __: unknown, host: EditorHost) {
  const selected = getCopilotSelectedElems(host);

  return selected[0] instanceof MindmapElementModel;
}

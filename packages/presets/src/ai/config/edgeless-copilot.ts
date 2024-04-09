import type { EditorHost } from '@blocksuite/block-std';
import type {
  AIItemConfig,
  AIItemGroupConfig,
  CopilotSelectionController,
  EdgelessCopilotWidget,
  EdgelessRootService,
  MindmapElementModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import {
  AFFINE_AI_PANEL_WIDGET,
  AFFINE_EDGELESS_COPILOT_WIDGET,
  AffineAIPanelWidget,
  AIPenIcon,
  ImageBlockModel,
  InsertBelowIcon,
  LanguageIcon,
  TextElementModel,
} from '@blocksuite/blocks';
import { assertExists, assertType } from '@blocksuite/global/utils';

import {
  actionToHandler,
  mindmapShowWhen,
  noteBlockShowWen,
} from '../actions/edgeless-handler.js';
import { translateLangs } from '../actions/text.js';
import { createMindmapRenderer } from '../messages/mindmap.js';

function showWhen(
  host: EditorHost,
  check: (service: EdgelessRootService) => boolean
) {
  const edgelessService = host.spec.getService(
    'affine:page'
  ) as EdgelessRootService;

  return check(edgelessService);
}

function getService(host: EditorHost) {
  const edgelessService = host.spec.getService(
    'affine:page'
  ) as EdgelessRootService;

  return edgelessService;
}

function getSelectedElements(service: EdgelessRootService) {
  return (service.tool.controllers['copilot'] as CopilotSelectionController)
    .selectedElements;
}

const _createMindmap: AIItemConfig = {
  name: 'Create a mindmap',
  icon: AIPenIcon,
  showWhen: (_, editorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected.length === 0 ||
          selected[0] instanceof ImageBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
  handler: host => {
    const rootBlockId = host.doc.root?.id;
    assertExists(rootBlockId);

    const aiPanel = host.view.getWidget(AFFINE_AI_PANEL_WIDGET, rootBlockId);
    const copilotPanel = host.view.getWidget(
      AFFINE_EDGELESS_COPILOT_WIDGET,
      rootBlockId
    );
    const selectedElement = getSelectedElements(getService(host))[0];

    if (!(aiPanel instanceof AffineAIPanelWidget) || !selectedElement) return;

    assertType<EdgelessCopilotWidget>(copilotPanel);
    copilotPanel.hide();

    const selectionRect = copilotPanel.selectionModelRect;

    aiPanel.config = {
      answerRenderer: createMindmapRenderer(host, aiPanel),
      generateAnswer: () => {},

      finishStateConfig: {
        responses: [
          {
            name: 'Insert',
            icon: InsertBelowIcon,
            handler: () => {
              const [surface] = host.doc.getBlockByFlavour('affine:surface');

              assertType<SurfaceBlockModel>(surface);

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = aiPanel.ctx as any;
              aiPanel.hide();

              const mindmapId = surface.addElement({
                type: 'mindmap',
                children: data.node,
                style: data.style,
              });
              const mindmap = surface.getElementById(
                mindmapId
              ) as MindmapElementModel;

              host.doc.transact(() => {
                const rootElement = mindmap.tree.element;

                if (selectionRect) {
                  rootElement.xywh = `[${selectionRect.x},${selectionRect.y},${rootElement.w},${rootElement.h}]`;
                }
              });
            },
          },
        ],
        actions: [],
      },
      errorStateConfig: {
        upgrade: () => {},
        responses: [],
      },
    };

    aiPanel.toggle(
      (copilotPanel as EdgelessCopilotWidget).selectionElem,
      `Use the nested unordered list syntax without other extra text style in Markdown to create a structure similar to a mind map without any unnecessary plain text description.
    Analyze the following questions or topics: "${(selectedElement as TextElementModel).text.toString()}"`
    );
  },
};

const translateSubItem = translateLangs.map(lang => {
  return {
    type: lang,
    handler: actionToHandler('translate', { lang }),
  };
});

export const docGroup: AIItemGroupConfig = {
  name: 'doc',
  items: [
    {
      name: 'Summary',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('summary'),
    },
  ],
};

export const othersGroup: AIItemGroupConfig = {
  name: 'others',
  items: [
    {
      name: 'Find actions from it',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('findActions'),
    },
    {
      name: 'Explain this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('explain'),
    },
  ],
};

export const editGroup: AIItemGroupConfig = {
  name: 'edit',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: noteBlockShowWen,
      subItem: translateSubItem,
    },
    {
      name: 'Improve writing for it',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('improveWriting'),
    },
    {
      name: 'Improve grammar for it',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('improveGrammar'),
    },
    {
      name: 'Fix spelling ',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('fixSpelling'),
    },
    {
      name: 'Make longer',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('makeLonger'),
    },
    {
      name: 'Make shorter',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('makeShorter'),
    },
  ],
};

export const draftGroup: AIItemGroupConfig = {
  name: 'draft',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeArticle'),
    },
    {
      name: 'Write a tweet about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeTweet'),
    },
    {
      name: 'Write a poem about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writePoem'),
    },
    {
      name: 'Write a blog post about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeBlog'),
    },
    {
      name: 'Write a outline from this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeOutline'),
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('brainstorm'),
    },
  ],
};

export const mindmapGroup: AIItemGroupConfig = {
  name: 'mindmap',
  items: [
    {
      name: 'Expand from this mindmap node',
      icon: AIPenIcon,
      showWhen: mindmapShowWhen,
    },
    {
      name: 'Brainstorm ideas with Mindmap',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('brainstormMindmap'),
    },
  ],
};

export const presentationGroup: AIItemGroupConfig = {
  name: 'presentation',
  items: [
    {
      name: 'Create a presentation',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('createSlides'),
    },
  ],
};

export const createGroup: AIItemGroupConfig = {
  name: 'create',
  items: [
    {
      name: 'Make it real',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('makeItReal'),
    },
  ],
};

import type { EdgelessCopilotWidget } from '@blocksuite/blocks';

import {
  createGroup,
  docGroup,
  draftGroup,
  editGroup,
  mindmapGroup,
  othersGroup,
  presentationGroup,
} from '../../config/edgeless-copilot.js';

export function setupEdgelessCopilot(widget: EdgelessCopilotWidget) {
  widget.groups = [
    docGroup,
    editGroup,
    draftGroup,
    mindmapGroup,
    presentationGroup,
    createGroup,
    othersGroup,
  ];
}

import type { EdgelessModel } from '../../root-block/edgeless/type.js';
import { MindmapElementModel } from '../element-model/mindmap.js';
import type { SurfaceBlockModel } from '../surface-model.js';

export function mindmapMiddleware(surface: SurfaceBlockModel) {
  const getElementById = (id: string) =>
    surface.getElementById(id) ??
    (surface.doc.getBlockById(id) as EdgelessModel);
  let layoutUpdPending = false;
  const layoutUpdList = new Set<MindmapElementModel>();
  const updateLayout = (mindmap: MindmapElementModel) => {
    layoutUpdList.add(mindmap);

    if (layoutUpdPending) {
      return;
    }

    layoutUpdPending = true;
    queueMicrotask(() => {
      layoutUpdList.forEach(mindmap => {
        if (mindmap.childIds.every(id => getElementById(id))) {
          mindmap['buildTree']();
          mindmap.layout();
        }
      });
      layoutUpdList.clear();
      layoutUpdPending = false;
    });
  };

  let connUpdPending = false;
  const connUpdList = new Set<MindmapElementModel>();
  const updateConnection = (mindmap: MindmapElementModel) => {
    connUpdList.add(mindmap);

    if (connUpdPending) {
      return;
    }

    connUpdPending = true;
    queueMicrotask(() => {
      connUpdList.forEach(mindmap => {
        mindmap['buildTree']();
        mindmap.calcConnection();
      });
      connUpdList.clear();
      connUpdPending = false;
    });
  };

  const disposables = [
    surface.elementAdded
      .filter(payload => payload.local)
      .on(({ id }) => {
        /**
         * When loading an existing doc, the elements' loading order is not guaranteed
         * So we need to update the mindmap when a new element is added
         */
        const group = surface.getGroup(id);
        if (group instanceof MindmapElementModel) {
          updateConnection(group);
        }

        const element = surface.getElementById(id);
        if (element instanceof MindmapElementModel) {
          updateConnection(element);
        }
      }),
    surface.elementUpdated.on(({ id, props, local }) => {
      // Recalculate mindmap connectors when child xywh is updated
      const mindmap = surface.getGroup(id);
      if (mindmap instanceof MindmapElementModel && props['xywh']) {
        updateLayout(mindmap);
      }

      /**
       * Rebuild tree when childIds is updated.
       */
      const element = getElementById(id);
      if (
        local &&
        element instanceof MindmapElementModel &&
        props['childIds']
      ) {
        updateLayout(element);
      }
    }),
  ];

  surface.elementModels.forEach(model => {
    if (model instanceof MindmapElementModel) {
      updateConnection(model);
    }
  });

  return () => {
    disposables.forEach(disposable => disposable.dispose());
  };
}

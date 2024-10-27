import {
  menu,
  type MenuButtonData,
  type MenuConfig,
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import {
  ArrowRightSmallIcon,
  DeleteIcon,
  DuplicateIcon,
  FilterIcon,
  GroupingIcon,
  InfoIcon,
  LayoutIcon,
  MoreHorizontalIcon,
  SortIcon,
} from '@blocksuite/icons/lit';
import { css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { SingleView } from '../../../../core/view-manager/single-view.js';

import { popPropertiesSetting } from '../../../../core/common/properties.js';
import {
  popGroupSetting,
  popSelectGroupByProperty,
} from '../../../../core/group-by/setting.js';
import {
  emptyFilterGroup,
  popCreateFilter,
  renderUniLit,
} from '../../../../core/index.js';
import { popCreateSort } from '../../../../core/sort/add-sort.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';
import {
  KanbanSingleView,
  type KanbanViewData,
  TableSingleView,
  type TableViewData,
} from '../../../../view-presets/index.js';
import { popFilterRoot } from '../../../quick-setting-bar/filter/root-panel-view.js';
import { popSortRoot } from '../../../quick-setting-bar/sort/root-panel.js';

const styles = css`
  .affine-database-toolbar-item.more-action {
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .affine-database-toolbar-item.more-action:hover {
    background: var(--affine-hover-color);
  }

  .affine-database-toolbar-item.more-action svg {
    width: 20px;
    height: 20px;
    fill: var(--affine-icon-color);
  }

  .more-action.active {
    background: var(--affine-hover-color);
  }
`;

export class DataViewHeaderToolsViewOptions extends WidgetBase {
  static override styles = styles;

  clickMoreAction = (e: MouseEvent) => {
    e.stopPropagation();
    this.openMoreAction(popupTargetFromElement(e.currentTarget as HTMLElement));
  };

  openMoreAction = (target: PopupTarget) => {
    this.showToolBar(true);
    popViewOptions(target, this.view, () => {
      this.showToolBar(false);
    });
  };

  override render() {
    if (this.view.readonly$.value) {
      return;
    }
    return html` <div
      class="affine-database-toolbar-item more-action dv-icon-20"
      @click="${this.clickMoreAction}"
    >
      ${MoreHorizontalIcon()}
    </div>`;
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  override accessor view!: SingleView<TableViewData | KanbanViewData>;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}
const createSettingMenus = (
  target: PopupTarget,
  view: SingleView<TableViewData | KanbanViewData>,
  reopen: () => void
) => {
  const settingItems: MenuConfig[] = [];
  settingItems.push(
    menu.action({
      name: 'Properties',
      prefix: InfoIcon(),
      postfix: html` <div style="font-size: 14px;">
          ${view.properties$.value.length} shown
        </div>
        ${ArrowRightSmallIcon()}`,
      select: () => {
        popPropertiesSetting(target, {
          view: view,
          onBack: reopen,
        });
      },
    })
  );
  const filterCount = view.filter$.value.conditions.length;
  settingItems.push(
    menu.action({
      name: 'Filter',
      prefix: FilterIcon(),
      postfix: html` <div style="font-size: 14px;">
          ${filterCount === 0
            ? ''
            : filterCount === 1
              ? '1 filter'
              : `${filterCount} filters`}
        </div>
        ${ArrowRightSmallIcon()}`,
      select: () => {
        if (!view.filter$.value.conditions.length) {
          popCreateFilter(target, {
            vars: view.vars$,
            onBack: reopen,
            onSelect: filter => {
              view.filterSet({
                ...(view.filter$.value ?? emptyFilterGroup),
                conditions: [...view.filter$.value.conditions, filter],
              });
              popFilterRoot(target, {
                view: view,
                onBack: reopen,
              });
            },
          });
        } else {
          popFilterRoot(target, {
            view: view,
            onBack: reopen,
          });
        }
      },
    })
  );
  if (view instanceof TableSingleView) {
    const sortManager = view.sortManager;
    const sortCount = sortManager.sortList$.value.length;
    settingItems.push(
      menu.action({
        name: 'Sort',
        prefix: SortIcon(),
        postfix: html` <div style="font-size: 14px;">
            ${sortCount === 0
              ? ''
              : sortCount === 1
                ? '1 sort'
                : `${sortCount} sorts`}
          </div>
          ${ArrowRightSmallIcon()}`,
        select: () => {
          const sortList = sortManager.sortList$.value;
          if (!sortList.length) {
            popCreateSort(target, {
              sortList: sortList,
              vars: view.vars$,
              onBack: reopen,
              onSelect: sort => {
                sortManager.setSortList([...sortList, sort]);
                popSortRoot(target, {
                  view: view,
                  title: {
                    text: 'Sort',
                    onBack: reopen,
                  },
                });
              },
            });
          } else {
            popSortRoot(target, {
              view: view,
              title: {
                text: 'Sort',
                onBack: reopen,
              },
            });
          }
        },
      })
    );
  }
  settingItems.push(
    menu.action({
      name: 'Group',
      prefix: GroupingIcon(),
      postfix: html` <div style="font-size: 14px;">
          ${view instanceof TableSingleView || view instanceof KanbanSingleView
            ? view.groupManager.property$.value?.name$.value
            : ''}
        </div>
        ${ArrowRightSmallIcon()}`,
      select: () => {
        const groupBy = view.data$.value?.groupBy;
        if (!groupBy) {
          popSelectGroupByProperty(target, view, {
            onSelect: () => popGroupSetting(target, view, reopen),
            onBack: reopen,
          });
        } else {
          popGroupSetting(target, view, reopen);
        }
      },
    })
  );
  return settingItems;
};
export const popViewOptions = (
  target: PopupTarget,
  view: SingleView<TableViewData | KanbanViewData>,
  onClose?: () => void
) => {
  const reopen = () => {
    popViewOptions(target, view);
  };
  const items: MenuConfig[] = [];
  items.push(
    menu.input({
      initialValue: view.name$.value,
      onComplete: text => {
        view.nameSet(text);
      },
    })
  );
  items.push(
    menu.action({
      name: 'Layout',
      postfix: html` <div style="font-size: 14px;text-transform: capitalize;">
          ${view.type}
        </div>
        ${ArrowRightSmallIcon()}`,
      select: () => {
        const viewTypes = view.manager.viewMetas.map<MenuConfig>(meta => {
          return menu => {
            if (!menu.search(meta.model.defaultName)) {
              return;
            }
            const isSelected =
              meta.type === view.manager.currentView$.value.type;
            const iconStyle = styleMap({
              fontSize: '24px',
              color: isSelected
                ? 'var(--affine-text-emphasis-color)'
                : 'var(--affine-icon-secondary)',
            });
            const textStyle = styleMap({
              fontSize: '14px',
              lineHeight: '22px',
              color: isSelected
                ? 'var(--affine-text-emphasis-color)'
                : 'var(--affine-text-secondary-color)',
            });
            const data: MenuButtonData = {
              content: () => html`
                <div
                  style="color:var(--affine-text-emphasis-color);width:100%;display: flex;flex-direction: column;align-items: center;justify-content: center;padding: 6px 16px;"
                >
                  <div style="${iconStyle}">
                    ${renderUniLit(meta.renderer.icon)}
                  </div>
                  <div style="${textStyle}">${meta.model.defaultName}</div>
                </div>
              `,
              select: () => {
                view.manager.viewChangeType(
                  view.manager.currentViewId$.value,
                  meta.type
                );
              },
              class: '',
            };
            const containerStyle = styleMap({
              flex: '1',
            });
            return html` <affine-menu-button
              style="${containerStyle}"
              .data="${data}"
              .menu="${menu}"
            ></affine-menu-button>`;
          };
        });
        popMenu(target, {
          options: {
            title: {
              onBack: reopen,
              text: 'Layout',
            },
            items: [
              menu => {
                const result = menu.renderItems(viewTypes);
                if (result.length) {
                  return html` <div style="display: flex">${result}</div>`;
                }
                return html``;
              },
              // menu.toggleSwitch({
              //   name: 'Show block icon',
              //   on: true,
              //   onChange: value => {
              //     console.log(value);
              //   },
              // }),
              // menu.toggleSwitch({
              //   name: 'Show Vertical lines',
              //   on: true,
              //   onChange: value => {
              //     console.log(value);
              //   },
              // }),
            ],
          },
        });
      },
      prefix: LayoutIcon(),
    })
  );

  items.push(
    menu.group({
      items: createSettingMenus(target, view, reopen),
    })
  );
  items.push(
    menu.group({
      items: [
        menu.action({
          name: 'Duplicate',
          prefix: DuplicateIcon(),
          select: () => {
            view.duplicate();
          },
        }),
        menu.action({
          name: 'Delete',
          prefix: DeleteIcon(),
          select: () => {
            view.delete();
          },
          class: 'delete-item',
        }),
      ],
    })
  );
  popMenu(target, {
    options: {
      title: {
        text: 'View settings',
      },
      items,
      onClose: onClose,
    },
  });
};

import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

import {
  DEFAULT_ADD_BUTTON_WIDTH,
  DEFAULT_COLUMN_MIN_WIDTH,
  DEFAULT_COLUMN_TITLE_HEIGHT,
} from '../consts.js';

export const styles = css`
    affine-microsheet-column-header {
        display: block;
        background-color: var(--affine-background-primary-color);
        position: relative;
        z-index: 2;
    }

    .affine-microsheet-column-header {
        position: relative;
        display: flex;
        flex-direction: row;
        box-sizing: border-box;
        user-select: none;
        background-color: var(--affine-background-primary-color);
        visibility: hidden;
    }

    .affine-microsheet-column {
        cursor: pointer;
    }

    .microsheet-cell {
        min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
        user-select: none;
    }

    .microsheet-cell.add-column-button {
        flex: 1;
        min-width: ${DEFAULT_ADD_BUTTON_WIDTH}px;
        min-height: 100%;
        display: flex;
        align-items: center;
    }

    .affine-microsheet-column-content {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        height: 100%;
        padding: 8px;
        box-sizing: border-box;
        position: relative;
        padding:0;
        background-color: #eee;
    }

    .affine-microsheet-column-move:hover {
        background-color: blue;
    }

    /* .affine-microsheet-column-content:hover,
    .affine-microsheet-column-content.edit {
        background-color: blue
    } */

    .affine-microsheet-column-content.edit .affine-microsheet-column-text-icon {
        opacity: 1;
    }

    .affine-microsheet-column-text {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 6px;
        /* https://stackoverflow.com/a/36247448/15443637 */
        overflow: hidden;
        color: var(--affine-text-secondary-color);
        font-size: 14px;
        position: relative;
    }

    .affine-microsheet-column-type-icon {
        display: flex;
        align-items: center;
        border-radius: 4px;
        padding: 2px;
    }

    .affine-microsheet-column-type-icon svg {
        width: 16px;
        height: 16px;
        fill: var(--affine-icon-color);
    }

    .affine-microsheet-column-text-content {
        flex: 1;
        display: flex;
        align-items: center;
        overflow: hidden;
    }

    .affine-microsheet-column-content:hover .affine-microsheet-column-text-icon {
        opacity: 1;
    }

    .affine-microsheet-column-text-input {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .affine-microsheet-column-text-icon {
        display: flex;
        align-items: center;
        width: 16px;
        height: 16px;
        background: var(--affine-white);
        border: 1px solid var(--affine-border-color);
        border-radius: 4px;
        opacity: 0;
    }

    .affine-microsheet-column-text-save-icon {
        display: flex;
        align-items: center;
        width: 16px;
        height: 16px;
        border: 1px solid transparent;
        border-radius: 4px;
        fill: var(--affine-icon-color);
    }

    .affine-microsheet-column-text-save-icon:hover {
        background: var(--affine-white);
        border-color: var(--affine-border-color);
    }

    .affine-microsheet-column-text-icon svg {
        fill: var(--affine-icon-color);
    }

    .affine-microsheet-column-input {
        width: 100%;
        height: 24px;
        padding: 0;
        border: none;
        color: inherit;
        font-weight: 600;
        font-size: 14px;
        font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
        background: transparent;
    }

    .affine-microsheet-column-input:focus {
        outline: none;
    }

    .affine-microsheet-column-move {
        display: flex;
        align-items: center;
        padding: 0;
    }

    .affine-microsheet-column-move svg {
        width: 10px;
        height: 14px;
        color: var(--affine-black-10);
        cursor: grab;
        opacity: 0;
    }

    .affine-microsheet-column-content:hover svg {
        opacity: 1;
    }

    .affine-microsheet-add-column-button {
        position: sticky;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 38px;
        cursor: pointer;
    }

    .header-add-column-button {
        height: ${DEFAULT_COLUMN_TITLE_HEIGHT}px;
        background-color: var(--affine-background-primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        cursor: pointer;
    }

    @media print {
        .header-add-column-button {
            display: none;
        }
    }

    .header-add-column-button svg {
        color: var(--affine-icon-color);
    }

    .affine-microsheet-column-type-menu-icon {
        border: 1px solid var(--affine-border-color);
        border-radius: 4px;
        padding: 5px;
        background-color: var(--affine-background-secondary-color);
    }

    .affine-microsheet-column-type-menu-icon svg {
        color: var(--affine-text-secondary-color);
        width: 20px;
        height: 20px;

    }

    .affine-microsheet-column-move-preview {
        position: fixed;
        z-index: 100;
        width: 100px;
        height: 100px;
        background: var(--affine-text-emphasis-color);
    }

    .affine-microsheet-column-move {
        --color: var(--affine-placeholder-color);
        --active: var(--affine-black-10);
        --bw: 1px;
        --bw2: -1px;
        cursor: grab;
        background: none;
        border: none;
        border-radius: 0;
        position: absolute;
        inset: 0;
    }

    .affine-microsheet-column-move .control-l::before,
    .affine-microsheet-column-move .control-h::before,
    .affine-microsheet-column-move .control-l::after,
    .affine-microsheet-column-move .control-h::after,
    .affine-microsheet-column-move .control-r,
    .affine-microsheet-column-move .hover-trigger {
        --delay: 0s;
        --delay-opacity: 0s;
        content: '';
        position: absolute;
        transition: all 0.2s ease var(--delay),
        opacity 0.2s ease var(--delay-opacity);
    }

    .affine-microsheet-column-move .control-r {
        --delay: 0s;
        --delay-opacity: 0.6s;
        width: 4px;
        border-radius: 1px;
        height: 32%;
        background: var(--color);
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0;
        pointer-events: none;
    }

    .affine-microsheet-column-move .hover-trigger {
        width: 12px;
        height: 80%;
        right: 3px;
        top: 10%;
        background: transparent
        z-index: 1;
        opacity: 1;
    }

    .affine-microsheet-column-move:hover .control-r {
        opacity: 1;
    }

    .affine-microsheet-column-move .control-h::before,
    .affine-microsheet-column-move .control-h::after {
        --delay: 0.2s;
        width: calc(100% - var(--bw2) * 2);
        opacity: 0;
        height: var(--bw);
        right: var(--bw2);
        background: var(--active);
    }

    .affine-microsheet-column-move .control-h::before {
        top: var(--bw2);
    }

    .affine-microsheet-column-move .control-h::after {
        bottom: var(--bw2);
    }

    .affine-microsheet-column-move .control-l::before {
        --delay: 0s;
        width: var(--bw);
        height: 100%;
        opacity: 0;
        background: var(--active);
        left: var(--bw2);
    }

    .affine-microsheet-column-move .control-l::before {
        top: 0;
    }

    .affine-microsheet-column-move .control-l::after {
        bottom: 0;
    }

    /* handle--active style */

    .affine-microsheet-column-move:hover .control-r {
        --delay-opacity: 0s;
        opacity: 1;
    }

    .affine-microsheet-column-move:active .control-r,
    .hover-trigger:hover ~ .control-r,
    .grabbing.affine-microsheet-column-move .control-r {
        opacity: 1;
        --delay: 0s;
        --delay-opacity: 0s;
        right: var(--bw2);
        width: var(--bw);
        height: 100%;
        background: var(--active);
    }

    .affine-microsheet-column-move:active .control-h::before,
    .affine-microsheet-column-move:active .control-h::after,
    .hover-trigger:hover ~ .control-h::before,
    .hover-trigger:hover ~ .control-h::after,
    .grabbing.affine-microsheet-column-move .control-h::before,
    .grabbing.affine-microsheet-column-move .control-h::after {
        --delay: 0.2s;
        width: calc(100% - var(--bw2) * 2);
        opacity: 1;
    }

    .affine-microsheet-column-move:active .control-l::before,
    .affine-microsheet-column-move:active .control-l::after,
    .hover-trigger:hover ~ .control-l::before,
    .hover-trigger:hover ~ .control-l::after,
    .grabbing.affine-microsheet-column-move .control-l::before,
    .grabbing.affine-microsheet-column-move .control-l::after {
        --delay: 0.4s;
        opacity: 1;
    }


    .affine-microsheet-column-add-icon {
      position: absolute;
      // right: -12px;
      left: -10px;
      top: -16px;
      z-index: 9;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .affine-microsheet-column-add-icon svg {
        width: 20px;
        height: 20px;
        border-radius: 100px;
        background: #4949fe;
        color: white;
        display: none;
      }

    .affine-microsheet-column-right-add-icon {
        left: unset;
        right: -10px;
    }

    .affine-microsheet-column-add-icon:hover svg {
        display: block;
    }

    .affine-microsheet-column-add-icon:hover
    .affine-microsheet-column-add-not-active-icon {
        display: none;
    }

    .affine-microsheet-column-add-not-active-icon {
        margin-top: -4px;
        width: 4px;
        height: 4px;
        border-radius: 4px;
        background: #ddd;
    }

    .data-view-table-left-bar{
        padding-left: 16px;
        display: flex;
        align-items: center;
        position: sticky;
        left: 0;
        width: 24px;
        flex-shrink: 0;
        visibility: hidden;
        background-color: var(--affine-background-primary-color);
        z-index: 9;
    }
`;
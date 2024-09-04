import type {
  ShapeElementModel,
  TextAlign,
  TextVerticalAlign,
} from '@blocksuite/affine-model';
import type { Bound } from '@blocksuite/global/utils';
import type { SerializedXYWH } from '@blocksuite/global/utils';

import type { CanvasRenderer } from '../../canvas-renderer.js';

import {
  type TextDelta,
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getLineWidth,
  getTextWidth,
  measureTextInDOM,
  wrapText,
  wrapTextDeltas,
} from '../text/utils.js';

export type Colors = {
  color: string;
  fillColor: string;
  strokeColor: string;
};

export function drawGeneralShape(
  ctx: CanvasRenderingContext2D,
  shapeModel: ShapeElementModel,
  renderer: CanvasRenderer,
  filled: boolean,
  fillColor: string,
  strokeColor: string
) {
  const sizeOffset = Math.max(shapeModel.strokeWidth, 0);
  const w = Math.max(shapeModel.w - sizeOffset, 0);
  const h = Math.max(shapeModel.h - sizeOffset, 0);

  switch (shapeModel.shapeType) {
    case 'rect':
      drawRect(ctx, 0, 0, w, h, shapeModel.radius ?? 0);
      break;
    case 'diamond':
      drawDiamond(ctx, 0, 0, w, h);
      break;
    case 'ellipse':
      drawEllipse(ctx, 0, 0, w, h);
      break;
    case 'triangle':
      drawTriangle(ctx, 0, 0, w, h);
  }

  ctx.lineWidth = shapeModel.strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = filled ? fillColor : 'transparent';

  switch (shapeModel.strokeStyle) {
    case 'none':
      ctx.strokeStyle = 'transparent';
      break;
    case 'dash':
      ctx.setLineDash([12, 12]);
      break;
  }

  if (shapeModel.shadow) {
    const { blur, offsetX, offsetY, color } = shapeModel.shadow;
    const scale = ctx.getTransform().a;

    ctx.shadowBlur = blur * scale;
    ctx.shadowOffsetX = offsetX * scale;
    ctx.shadowOffsetY = offsetY * scale;
    ctx.shadowColor = renderer.getPropertyValue(color);
  }

  ctx.stroke();
  ctx.fill();

  if (shapeModel.shadow) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.fill();
  ctx.stroke();
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r =
    radius < 1
      ? Math.max(Math.min(width * radius, height * radius), 0)
      : radius;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(width / 2, y);
  ctx.lineTo(width, height / 2);
  ctx.lineTo(width / 2, height);
  ctx.lineTo(x, height / 2);
  ctx.closePath();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  _x: number,
  _y: number,
  width: number,
  height: number
) {
  const cx = width / 2;
  const cy = height / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, 2 * Math.PI);
  ctx.closePath();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(width / 2, y);
  ctx.lineTo(width, height);
  ctx.lineTo(x, height);
  ctx.closePath();
}

export function horizontalOffset(
  width: number,
  textAlign: TextAlign,
  horiPadding: number
) {
  return textAlign === 'center'
    ? width / 2
    : textAlign === 'right'
      ? width - horiPadding
      : horiPadding;
}

export function verticalOffset(
  lines: TextDelta[][],
  lineHeight: number,
  height: number,
  textVerticalAlign: TextVerticalAlign,
  verticalPadding: number
) {
  return textVerticalAlign === 'center'
    ? Math.max((height - lineHeight * lines.length) / 2, verticalPadding)
    : textVerticalAlign === 'top'
      ? verticalPadding
      : height - lineHeight * lines.length - verticalPadding;
}
export function normalizeShapeBound(
  shape: ShapeElementModel,
  bound: Bound
): Bound {
  if (!shape.text) return bound;

  const [verticalPadding, horiPadding] = shape.padding;
  const yText = shape.text;
  const { fontFamily, fontSize, fontStyle, fontWeight } = shape;
  const lineHeight = getLineHeight(fontFamily, fontSize, fontWeight);
  const font = getFontString({
    fontStyle,
    fontWeight,
    fontSize,
    fontFamily,
  });
  const widestCharWidth =
    [...yText.toString()]
      .map(char => getTextWidth(char, font))
      .sort((a, b) => a - b)
      .pop() ?? getTextWidth('W', font);

  if (bound.w < widestCharWidth + horiPadding * 2) {
    bound.w = widestCharWidth + horiPadding * 2;
  }
  const deltas: TextDelta[] = (yText.toDelta() as TextDelta[]).flatMap(
    delta => ({
      insert: wrapText(delta.insert, font, bound.w - horiPadding * 2),
      attributes: delta.attributes,
    })
  ) as TextDelta[];
  const lines = deltaInsertsToChunks(deltas);

  if (bound.h < lineHeight * lines.length + verticalPadding * 2) {
    bound.h = lineHeight * lines.length + verticalPadding * 2;
  }

  return bound;
}

export function fitContent(shape: ShapeElementModel) {
  const font = getFontString(shape);

  if (!shape.text) {
    return;
  }

  const [verticalPadding, horiPadding] = shape.padding;
  const lines = deltaInsertsToChunks(
    wrapTextDeltas(shape.text, font, shape.maxWidth || Number.MAX_SAFE_INTEGER)
  );
  const { lineHeight, lineGap } = measureTextInDOM(
    shape.fontFamily,
    shape.fontSize,
    shape.fontWeight
  );
  let maxWidth = 0;
  let height = 0;

  lines.forEach(line => {
    for (const delta of line) {
      const str = delta.insert;

      maxWidth = Math.max(maxWidth, getLineWidth(str, font));
      height += lineHeight + lineGap;
    }
  });

  height = Math.max(lineHeight + lineGap, height);

  maxWidth += horiPadding * 2;
  height += verticalPadding * 2;

  const newXYWH = `[${shape.x},${shape.y},${maxWidth},${height}]`;

  if (shape.xywh !== newXYWH) {
    shape.xywh = newXYWH as SerializedXYWH;
  }
}

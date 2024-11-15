import { CellBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class CellBlockService extends BlockService {
  static override readonly flavour = CellBlockSchema.model.flavour;

  override mounted(): void {
    super.mounted();

    // this.std.command.add('selectBlock', selectBlock);
  }
}

// export const selectBlock: Command<'focusBlock'> = (ctx, next) => {
//   const { focusBlock } = ctx;
//   if (!focusBlock) {
//     return;
//   }

//   return next();
// };

declare global {
  namespace BlockSuite {
    interface Commands {
      selectBlock: typeof selectBlock;
    }
  }
}

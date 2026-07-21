import {
  LookbookTemplateCopy,
  LookbookTemplateId,
  LookbookTemplatePhoto,
} from '../../core/utils/lookbook-page-templates';

/** Shared surface API used by lookbook-editor.page (old + ProseMirror). */
export interface LookbookEditorSurface {
  getHtml(): string;
  captureInsertPoint(force?: boolean): void;
  clearInsertPoint(): void;
  insertImage(src: string, alt?: string): void;
  insertPageTemplate(
    kind: LookbookTemplateId,
    photos?: LookbookTemplatePhoto[],
    copy?: LookbookTemplateCopy,
  ): void;
}

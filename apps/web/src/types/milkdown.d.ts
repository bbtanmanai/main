declare module '@milkdown/react' {
  export const ReactEditor: any;
  export const useEditor: any;
}
declare module '@milkdown/core' {
  export const Editor: any;
  export const defaultValueCtx: any;
  export const rootCtx: any;
  export const commandsCtx: any;
}
declare module '@milkdown/preset-commonmark' {
  export const commonmark: any;
  export const createCodeBlockCommand: any;
  export const insertHrCommand: any;
  export const insertImageCommand: any;
  export const toggleEmphasisCommand: any;
  export const toggleInlineCodeCommand: any;
  export const toggleLinkCommand: any;
  export const toggleStrongCommand: any;
  export const turnIntoTextCommand: any;
  export const wrapInBlockquoteCommand: any;
  export const wrapInBulletListCommand: any;
  export const wrapInHeadingCommand: any;
  export const wrapInOrderedListCommand: any;
}
declare module '@milkdown/preset-gfm' {
  export const gfm: any;
  export const toggleStrikethroughCommand: any;
}
declare module '@milkdown/plugin-history' {
  export const history: any;
  export const redoCommand: any;
  export const undoCommand: any;
}
declare module '@milkdown/plugin-listener' {
  export const listener: any;
  export const listenerCtx: any;
}
declare module '@milkdown/theme-nord' {
  export const nord: any;
}

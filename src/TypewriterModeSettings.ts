export interface TypewriterModeSettings {
  isTypewriterScrollEnabled: boolean;
  isOnlyActivateAfterFirstInteractionEnabled: boolean;
  isOnlyMaintainTypewriterOffsetWhenReachedEnabled: boolean;
  isTypewriterOnlyUseCommandsEnabled: boolean;
  typewriterOffset: number;
  isKeepLinesAboveAndBelowEnabled: boolean;
  linesAboveAndBelow: number;
  isMaxCharsPerLineEnabled: boolean;
  maxCharsPerLine: number;
  isDimUnfocusedParagraphsEnabled: boolean;
  dimUnfocusedEditorsBehavior: "dim-none" | "dim" | "dim-all";
  dimmedParagraphsOpacity: number;
  isPauseDimUnfocusedParagraphsWhileScrollingEnabled: boolean;
  isPauseDimUnfocusedParagraphsWhileSelectingEnabled: boolean;
  isHighlightTypewriterLineEnabled: boolean;
  isHighlightTypewriterLineOnlyInFocusedEditorEnabled: boolean;
  typewriterLineHighlightStyle: "box" | "underline";
  typewriterLineHighlightUnderlineThickness: number;
  typewriterLineHighlightColor: string;
  doesFullscreenWritingFocusShowHeader: boolean;
  doesFullscreenWritingFocusShowVignette: boolean;
  [key: string]: unknown;
}

export const DEFAULT_SETTINGS: TypewriterModeSettings = {
  isTypewriterScrollEnabled: true,
  isOnlyActivateAfterFirstInteractionEnabled: false,
  isOnlyMaintainTypewriterOffsetWhenReachedEnabled: false,
  isTypewriterOnlyUseCommandsEnabled: false,
  typewriterOffset: 0.5,
  isKeepLinesAboveAndBelowEnabled: false,
  linesAboveAndBelow: 5,
  isMaxCharsPerLineEnabled: false,
  maxCharsPerLine: 64,
  isDimUnfocusedParagraphsEnabled: false,
  dimUnfocusedEditorsBehavior: "dim",
  dimmedParagraphsOpacity: 0.25,
  isPauseDimUnfocusedParagraphsWhileScrollingEnabled: true,
  isPauseDimUnfocusedParagraphsWhileSelectingEnabled: true,
  isHighlightTypewriterLineEnabled: true,
  isHighlightTypewriterLineOnlyInFocusedEditorEnabled: false,
  typewriterLineHighlightStyle: "box",
  typewriterLineHighlightUnderlineThickness: 1,
  typewriterLineHighlightColor: "#333",
  doesFullscreenWritingFocusShowHeader: false,
  doesFullscreenWritingFocusShowVignette: true,
};

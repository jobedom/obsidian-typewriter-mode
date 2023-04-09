import { Command } from "@/features/base/Command";
import { ItemView } from "obsidian";

export class FullscreenWritingFocus extends Command {
  protected commandKey = "fullscreen-writing-focus";
  protected commandTitle = "Toggle Fullscreen Writing Focus On/Off";

  protected onCommand(): void {
    const leaf = this.plugin.app.workspace.activeLeaf;
    const view = leaf.view as ItemView;
    if (view.getViewType() === "empty") return;

    document.fullscreenElement
      ? this.exitFullscreenWritingFocus()
      : this.startFullscreenWritingFocus(view);

    view.containerEl.onfullscreenchange = () => {
      if (!document.fullscreenElement) this.onExitFullscreenWritingFocus();
    };
  }

  private startFullscreenWritingFocus(view: ItemView) {
    const fullscreenEl = this.plugin.settings
      .doesFullscreenWritingFocusShowHeader
      ? view.containerEl
      : view.contentEl;
    fullscreenEl
      .requestFullscreen()
      .then(() =>
        fullscreenEl.classList.add("ptm-fullscreen-writing-focus-element")
      );
  }

  private exitFullscreenWritingFocus() {
    document.exitFullscreen().then();
  }

  private onExitFullscreenWritingFocus() {
    const elements = document.getElementsByClassName(
      "ptm-fullscreen-writing-focus-element"
    );
    if (elements.length === 0) return;
    elements[0].classList.remove("ptm-fullscreen-writing-focus-element");
  }
}
import {
  DEFAULT_SETTINGS,
  TypewriterModeSettings,
} from "@/TypewriterModeSettings";
import { Plugin } from "obsidian";
import CMTypewriterScrollSettingTab from "@/TypewriterModeSettingsTab";
import { Extension } from "@codemirror/state";
import TypewriterScrollPlugin from "@/cm-plugin/TypewriterScrollPlugin";
import HighlightTypewriterLinePlugin from "@/cm-plugin/HighlightTypewriterLinePlugin";
import OnWheelPlugin from "@/cm-plugin/OnWheelPlugin";
import { pluginSettingsFacet } from "@/cm-plugin/PluginSettingsFacet";

export default class TypewriterModePlugin extends Plugin {
  settings: TypewriterModeSettings;
  private css: HTMLElement;
  private editorExtensions: Extension[] = [];

  override async onload() {
    this.createCssElement();
    await this.loadSettings();
    this.addSettingTab(new CMTypewriterScrollSettingTab(this.app, this));
    this.addCommands();
    this.registerEditorExtension(this.editorExtensions);
  }

  override onunload() {
    // disable the plugin
    this.disableTypewriterScroll();
    this.disableZen();
    this.disableHighlightTypewriterLine();
  }

  private addCommands() {
    // add the toggle on/off command
    this.addCommand({
      id: "toggle-typewriter-scroll",
      name: "Toggle Typewriter Mode On/Off",
      callback: () => {
        this.toggleTypewriterScroll();
      },
    });

    // toggle zen mode
    this.addCommand({
      id: "toggle-typewriter-scroll-zen",
      name: "Toggle Zen Mode On/Off",
      callback: () => {
        this.toggleZen();
      },
    });

    // toggle highlight typewriter line
    this.addCommand({
      id: "toggle-typewriter-scroll-highlight-typewriter-line",
      name: "Toggle Highlight Typewriter Line On/Off",
      callback: () => {
        this.toggleHighlightTypewriterLine();
      },
    });
  }

  private reloadCodeMirror() {
    if (this.editorExtensions.length !== 0) {
      // remove everything
      this.editorExtensions.splice(0, this.editorExtensions.length);
    }
    const extensions = [
      pluginSettingsFacet.of(this.settings),
      this.settings.enabled ? TypewriterScrollPlugin : [],
      this.settings.highlightTypewriterLineEnabled
        ? HighlightTypewriterLinePlugin
        : [],
      this.settings.highlightTypewriterLineEnabled || this.settings.zenEnabled
        ? OnWheelPlugin
        : [],
    ];
    this.editorExtensions.push(extensions);
    this.app.workspace.updateOptions();
  }

  private toggleSetting(
    setting: keyof typeof this.settings,
    newValue: boolean = null,
    enable: () => void,
    disable: () => void,
    requiresReload = false
  ) {
    // if no value is passed in, toggle the existing value
    if (newValue === null) newValue = !this.settings[setting];
    // assign the new value and call the correct enable / disable function
    this.settings[setting] = newValue;
    newValue ? enable() : disable();
    if (requiresReload && this.settings.enabled) this.reloadCodeMirror();
    // save the new settings
    this.saveData(this.settings).then();
  }

  private async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());

    // enable the plugin (based on settings)
    if (this.settings.enabled) this.enableTypewriterScroll();
    if (this.settings.zenEnabled) this.enableZen();
    if (this.settings.zenOnlyInActiveEditorEnabled)
      this.enableZenOnlyInActiveEditor();
    if (this.settings.highlightTypewriterLineEnabled)
      this.enableHighlightTypewriterLine();
    if (this.settings.highlightTypewriterLineOnlyInActiveEditorEnabled)
      this.enableHighlightTypewriterLineOnlyInActiveEditor();
    if (this.settings.pauseZenWhileScrollingEnabled)
      this.enablePauseZenWhileScrolling();
    if (this.settings.pauseZenWhileSelectingEnabled)
      this.enablePauseZenWhileSelecting();
    if (this.settings.maxCharsPerLineEnabled) this.enableMaxCharsPerLine();

    this.setCSSVariables();
  }

  private createCssElement() {
    this.css = document.createElement("style");
    this.css.id = "plugin-typewriter-scroll";
    this.css.setAttr("type", "text/css");
    document.getElementsByTagName("head")[0].appendChild(this.css);
  }

  private setCSSVariables({
    zenOpacity,
    typewriterLineHighlightColor,
    typewriterLineHighlightUnderlineThickness,
    maxCharsPerLine,
  }: {
    zenOpacity?: number;
    typewriterLineHighlightColor?: string;
    typewriterLineHighlightUnderlineThickness?: number;
    maxCharsPerLine?: number;
  } = {}) {
    this.css.innerText = `body {
      --zen-opacity: ${zenOpacity ?? this.settings.zenOpacity};
      --typewriter-line-color: ${
        typewriterLineHighlightColor ??
        this.settings.typewriterLineHighlightColor
      };
      --typewriter-line-underline-thickness: ${
        typewriterLineHighlightUnderlineThickness ??
        this.settings.typewriterLineHighlightUnderlineThickness
      }px;
      --max-chars-per-line: ${
        maxCharsPerLine ?? this.settings.maxCharsPerLine
      }ch;
    }`;
  }

  toggleTypewriterScroll(newValue: boolean = null) {
    this.toggleSetting(
      "enabled",
      newValue,
      this.enableTypewriterScroll.bind(this),
      this.disableTypewriterScroll.bind(this),
      true
    );
  }

  toggleZen(newValue: boolean = null) {
    this.toggleSetting(
      "zenEnabled",
      newValue,
      this.enableZen.bind(this),
      this.disableZen.bind(this),
      true
    );
  }

  toggleZenOnlyInActiveEditorEnabled(newValue: boolean = null) {
    this.toggleSetting(
      "zenOnlyInActiveEditorEnabled",
      newValue,
      this.enableZenOnlyInActiveEditor.bind(this),
      this.disableZenOnlyInActiveEditor.bind(this),
      true
    );
  }

  togglePauseZenWhileScrolling(newValue: boolean = null) {
    this.toggleSetting(
      "pauseZenWhileScrollingEnabled",
      newValue,
      this.enablePauseZenWhileScrolling.bind(this),
      this.disablePauseZenWhileScrolling.bind(this)
    );
  }

  togglePauseZenWhileSelecting(newValue: boolean = null) {
    this.toggleSetting(
      "pauseZenWhileSelectingEnabled",
      newValue,
      this.enablePauseZenWhileSelecting.bind(this),
      this.disablePauseZenWhileSelecting.bind(this)
    );
  }

  toggleHighlightTypewriterLine(newValue: boolean = null) {
    this.toggleSetting(
      "highlightTypewriterLineEnabled",
      newValue,
      this.enableHighlightTypewriterLine.bind(this),
      this.disableHighlightTypewriterLine.bind(this),
      true
    );
  }

  toggleHighlightTypewriterLineOnlyInActiveEditorEnabled(
    newValue: boolean = null
  ) {
    this.toggleSetting(
      "highlightTypewriterLineOnlyInActiveEditorEnabled",
      newValue,
      this.enableHighlightTypewriterLineOnlyInActiveEditor.bind(this),
      this.disableHighlightTypewriterLineOnlyInActiveEditor.bind(this),
      true
    );
  }

  toggleMaxCharsPerLine(newValue: boolean = null) {
    this.toggleSetting(
      "maxCharsPerLineEnabled",
      newValue,
      this.enableMaxCharsPerLine.bind(this),
      this.disableMaxCharsPerLine.bind(this),
      true
    );
  }

  changeMaxCharsPerLine(newValue: number) {
    this.settings.maxCharsPerLine = newValue;
    this.setCSSVariables({ maxCharsPerLine: newValue });
    this.saveData(this.settings).then();
  }

  changeTypewriterOffset(newValue: number) {
    this.settings.typewriterOffset = newValue;
    if (this.settings.enabled) this.reloadCodeMirror();
    this.saveData(this.settings).then();
  }

  changeZenOpacity(newValue = 0.25) {
    this.settings.zenOpacity = newValue;
    this.setCSSVariables({ zenOpacity: newValue });
    this.saveData(this.settings).then();
  }

  changeTypewriterLineHighlightColor(newValue: string) {
    this.settings.typewriterLineHighlightColor = newValue;
    this.setCSSVariables({ typewriterLineHighlightColor: newValue });
    this.saveData(this.settings).then();
  }

  changeTypewriterLineHighlightStyle(newValue: "box" | "underline") {
    this.settings.typewriterLineHighlightStyle = newValue;
    if (this.settings.enabled) this.reloadCodeMirror();
    this.saveData(this.settings).then();
  }

  changeTypewriterLineHighlightUnderlineThickness(newValue: number) {
    this.settings.typewriterLineHighlightUnderlineThickness = newValue;
    this.setCSSVariables({
      typewriterLineHighlightUnderlineThickness: newValue,
    });
    this.saveData(this.settings).then();
  }

  private enableTypewriterScroll() {
    // add the class
    document.body.classList.add("plugin-typewriter-mode");
    this.reloadCodeMirror();
  }

  private disableTypewriterScroll() {
    // remove the class
    document.body.classList.remove("plugin-typewriter-mode");

    // clear out the registered extension
    this.editorExtensions.splice(0, this.editorExtensions.length);
    this.app.workspace.updateOptions();
  }

  private enableZen() {
    // add the class
    document.body.classList.add("plugin-typewriter-mode-zen");
  }

  private disableZen() {
    // remove the class
    document.body.classList.remove("plugin-typewriter-mode-zen");
  }

  private enableZenOnlyInActiveEditor() {
    // add the class
    document.body.classList.add(
      "plugin-typewriter-mode-zen-only-in-active-editor"
    );
  }

  private disableZenOnlyInActiveEditor() {
    // remove the class
    document.body.classList.remove(
      "plugin-typewriter-mode-zen-only-in-active-editor"
    );
  }

  private enablePauseZenWhileScrolling() {
    // add the class
    document.body.classList.add(
      "plugin-typewriter-mode-zen-pause-while-scrolling"
    );
  }

  private disablePauseZenWhileScrolling() {
    // remove the class
    document.body.classList.remove(
      "plugin-typewriter-mode-zen-pause-while-scrolling"
    );
  }

  private enablePauseZenWhileSelecting() {
    // add the class
    document.body.classList.add(
      "plugin-typewriter-mode-zen-pause-while-selecting"
    );
  }

  private disablePauseZenWhileSelecting() {
    // remove the class
    document.body.classList.remove(
      "plugin-typewriter-mode-zen-pause-while-selecting"
    );
  }

  private enableHighlightTypewriterLine() {
    // add the class
    document.body.classList.add("plugin-typewriter-mode-highlight-line");
  }

  private disableHighlightTypewriterLine() {
    // remove the class
    document.body.classList.remove("plugin-typewriter-mode-highlight-line");
  }

  private enableHighlightTypewriterLineOnlyInActiveEditor() {
    // add the class
    document.body.classList.add(
      "plugin-typewriter-mode-highlight-line-only-in-active-editor"
    );
  }

  private disableHighlightTypewriterLineOnlyInActiveEditor() {
    // remove the class
    document.body.classList.remove(
      "plugin-typewriter-mode-highlight-line-only-in-active-editor"
    );
  }

  private enableMaxCharsPerLine() {
    // add the class
    document.body.classList.add("plugin-typewriter-mode-max-chars-per-line");
  }

  private disableMaxCharsPerLine() {
    // remove the class
    document.body.classList.remove("plugin-typewriter-mode-max-chars-per-line");
  }
}

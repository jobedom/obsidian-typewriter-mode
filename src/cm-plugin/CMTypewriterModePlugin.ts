import CodeMirrorPluginBaseClass from "@/cm-plugin/CodeMirrorPluginBaseClass";
import { perWindowProps } from "@/cm-plugin/PerWindowProps";
import { pluginSettingsFacet } from "@/cm-plugin/PluginSettingsFacet";
import type { TypewriterPositionData } from "@/cm-plugin/getTypewriterOffset";
import { measureTypewriterPosition } from "@/cm-plugin/getTypewriterOffset";
import { EditorView, ViewPlugin } from "@codemirror/view";
import { getEditorDom, getScrollDom, getSizerDom } from "./selectors";

export default ViewPlugin.fromClass(
	class extends CodeMirrorPluginBaseClass {
		private isInitialInteraction = true;
		private isRenderingAllowedUserEvent = false;

		protected override onLoad() {
			super.onLoad();
			window.addEventListener("moveByCommand", this.moveByCommand.bind(this));

			if (this.isDisabled()) return;
			this.onReconfigured();
		}

		protected override onReconfigured(): void {
			super.onReconfigured();
			this.loadPerWindowProps();
			this.updateAfterExternalEvent();
		}

		private loadPerWindowProps() {
			// this is a hack, to make it work in canvas...
			const iframes = Array.from(
				this.view.dom.ownerDocument.querySelectorAll("iframe"),
			).map((i: HTMLIFrameElement) => i.contentDocument.body);
			const bodies = [this.view.dom.ownerDocument.body, ...iframes];
			const props = this.view.state.facet(perWindowProps);
			for (const b of bodies) {
				b.addClasses(props.bodyClasses);
				b.setCssProps(props.cssVariables);
				b.setAttrs(props.bodyAttrs);
			}
		}

		private loadCurrentLineHighlight(
			view: EditorView = this.view,
		): HTMLElement | null {
			const editorDom = getEditorDom(view);
			if (!editorDom) return null;

			let currentLineHighlight = editorDom.querySelector(
				".ptm-current-line-highlight",
			) as HTMLElement;

			if (!currentLineHighlight) {
				currentLineHighlight = document.createElement("div");
				const settings = view.state.facet(pluginSettingsFacet);
				currentLineHighlight.className = `ptm-current-line-highlight ptm-current-line-highlight-${settings.currentLineHighlightStyle}`;

				editorDom.appendChild(currentLineHighlight);
			}

			return currentLineHighlight;
		}

		private destroyCurrentLineHighlight(view: EditorView = this.view) {
			const editorDom = getEditorDom(view);
			if (!editorDom) return;

			const currentLineHighlight = editorDom.querySelector(
				".ptm-current-line-highlight",
			) as HTMLElement;
			currentLineHighlight?.remove();
		}

		private setupWheelListener() {
			const scrollDom = getScrollDom(this.view);
			if (scrollDom)
				scrollDom.addEventListener("wheel", this.onWheel.bind(this));
		}

		protected override updateAllowedUserEvent() {
			super.updateAllowedUserEvent();

			const editorDom = getEditorDom(this.view);
			if (editorDom) {
				editorDom.classList.remove("ptm-wheel");
				editorDom.classList.remove("ptm-select");

				if (this.isInitialInteraction) {
					editorDom.classList.remove("ptm-first-open");
					this.isInitialInteraction = false;
				}
			}

			this.isRenderingAllowedUserEvent = true;

			measureTypewriterPosition(
				this.view,
				"TypewriterModeUpdateAfterUserEvent",
				(measure, view) => {
					this.recenterAndMoveCurrentLineHighlight(view, measure);
					this.isRenderingAllowedUserEvent = false;
				},
			);
		}

		protected override updateDisallowedUserEvent() {
			if (this.isRenderingAllowedUserEvent) return;

			super.updateDisallowedUserEvent();

			const editorDom = getEditorDom(this.view);

			if (editorDom) {
				if (this.isInitialInteraction) {
					editorDom.classList.remove("ptm-first-open");
					this.isInitialInteraction = false;
				}

				editorDom.classList.add("ptm-select");
			}

			measureTypewriterPosition(
				this.view,
				"TypewriterModeUpdateAfterUserEvent",
				({ activeLineOffset, lineHeight }, view) => {
					const { isHighlightCurrentLineEnabled } =
						view.state.facet(pluginSettingsFacet);
					if (isHighlightCurrentLineEnabled)
						this.moveCurrentLineHighlight(view, activeLineOffset, lineHeight);
				},
			);
		}

		protected override updateNonUserEvent() {
			super.updateNonUserEvent();

			if (!this.isInitialInteraction) return;

			const { isOnlyActivateAfterFirstInteractionEnabled } =
				this.view.state.facet(pluginSettingsFacet);

			if (isOnlyActivateAfterFirstInteractionEnabled) {
				const editorDom = getEditorDom(this.view);
				if (editorDom) editorDom.classList.add("ptm-first-open");
			}
		}

		private moveByCommand() {
			const editorDom = getEditorDom(this.view);
			if (editorDom) editorDom.classList.remove("ptm-select");
			this.updateAllowedUserEvent();
		}

		protected override onResize() {
			if (this.isDisabled()) return;
			super.onResize();
			this.updateAfterExternalEvent();
		}

		protected onWheel() {
			const editorDom = getEditorDom(this.view);
			if (editorDom) editorDom.classList.add("ptm-wheel");
		}

		override destroy() {
			super.destroy();

			this.destroyCurrentLineHighlight();

			const scrollDom = getScrollDom(this.view);
			if (scrollDom) scrollDom.removeEventListener("wheel", this.onWheel);

			window.removeEventListener(
				"moveByCommand",
				this.moveByCommand.bind(this),
			);
		}

		private updateAfterExternalEvent() {
			const { isTypewriterScrollEnabled } =
				this.view.state.facet(pluginSettingsFacet);
			measureTypewriterPosition(
				this.view,
				"TypewriterModeUpdateAfterExternalEvent",
				(measure, view) => {
					this.setupWheelListener();
					if (isTypewriterScrollEnabled)
						this.setPadding(view, measure.typewriterOffset);
					this.recenterAndMoveCurrentLineHighlight(view, measure);
				},
			);
		}

		private moveCurrentLineHighlight(
			view: EditorView,
			offset: number,
			lineHeight: number,
		) {
			const currentLineHighlight = this.loadCurrentLineHighlight(view);
			if (!currentLineHighlight) return;
			currentLineHighlight.style.height = `${lineHeight}px`;
			currentLineHighlight.style.top = `${offset}px`;
		}

		private setPadding(view: EditorView, offset: number) {
			const { isOnlyMaintainTypewriterOffsetWhenReachedEnabled } =
				view.state.facet(pluginSettingsFacet);

			const sizerDom = getSizerDom(view);
			if (!sizerDom) return;

			(sizerDom as HTMLElement).style.padding =
				isOnlyMaintainTypewriterOffsetWhenReachedEnabled
					? `0 0 ${offset}px 0`
					: `${offset}px 0`;
		}

		private recenter(view: EditorView, offset: number) {
			const head = view.state.selection.main.head;
			const effect = EditorView.scrollIntoView(head, {
				y: "start",
				yMargin: offset,
			});
			const transaction = view.state.update({ effects: effect });
			view.dispatch(transaction);
		}

		private recenterAndMoveCurrentLineHighlight(
			view: EditorView,
			{ scrollOffset, lineHeight }: TypewriterPositionData,
		) {
			const {
				isTypewriterScrollEnabled,
				isKeepLinesAboveAndBelowEnabled,
				isHighlightCurrentLineEnabled,
			} = view.state.facet(pluginSettingsFacet);
			if (isTypewriterScrollEnabled || isKeepLinesAboveAndBelowEnabled)
				this.recenter(view, scrollOffset);
			if (isHighlightCurrentLineEnabled)
				this.moveCurrentLineHighlight(view, scrollOffset, lineHeight);
		}
	},
);

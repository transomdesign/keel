/**
 * Toolbox Menu Module
 *
 * Desktop: CSS hover/focus-within handles dropdown — no JS.
 * Mobile: JS toggle for offcanvas panel open/close.
 */

class ToolboxMenu {
  private trigger: HTMLElement | null = null
  private panel: HTMLElement | null = null
  private wrapper: HTMLElement | null = null

  constructor() {
    this.trigger = document.querySelector('.toolbox-trigger')
    this.panel = document.querySelector('#toolbox-menu')
    this.wrapper = this.trigger?.closest<HTMLElement>('.toolbox') ?? null
    if (!this.trigger || !this.panel) return
    this.attachEventListeners()
  }

  private attachEventListeners(): void {
    // Toggle on trigger click (handles both mobile tap and keyboard activation)
    this.trigger?.addEventListener('click', (e) => {
      e.preventDefault()
      this.togglePanel()
    })

    // Close on ESC key, return focus to trigger
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.panel?.classList.contains('toolbox-menu--open')) {
        this.closePanel()
        this.trigger?.focus()
      }
    })

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!this.panel || !this.trigger) return
      const target = e.target as Node
      if (!this.panel.contains(target) && !this.trigger.contains(target)) {
        this.closePanel()
      }
    })

    // Close when focus leaves the toolbox entirely (keyboard tab-out)
    this.wrapper?.addEventListener('focusout', (e: FocusEvent) => {
      if (!this.wrapper?.contains(e.relatedTarget as Node)) {
        this.closePanel()
      }
    })
  }

  private togglePanel(): void {
    const isOpen = this.panel?.classList.contains('toolbox-menu--open')
    isOpen ? this.closePanel() : this.openPanel()
  }

  private openPanel(): void {
    this.panel?.classList.add('toolbox-menu--open')
    this.trigger?.setAttribute('aria-expanded', 'true')
    this.panel?.setAttribute('aria-expanded', 'true')
  }

  private closePanel(): void {
    this.panel?.classList.remove('toolbox-menu--open')
    this.trigger?.setAttribute('aria-expanded', 'false')
    this.panel?.setAttribute('aria-expanded', 'false')
  }
}

export default function initToolboxMenu(): void {
  new ToolboxMenu()
}

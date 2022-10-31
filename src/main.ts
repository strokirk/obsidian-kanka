import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian'

import m from 'mithril'
import { ObsidianKankaSettingTab } from './settings'

interface ObsidianKankaSettings {
  apiToken: string | null
}

const DEFAULT_SETTINGS: ObsidianKankaSettings = {
  apiToken: null,
}

export default class ObsidianKanka extends Plugin {
  settings: ObsidianKankaSettings

  async onload() {
    await this.loadSettings()

    this.addRibbons()

    this.addStatusBar()

    this.addCommands()

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new ObsidianKankaSettingTab(this))

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      console.log('click', evt)
    })

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000))

    this.addMarkdownProcessors()
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  private addMarkdownProcessors() {
    this.registerMarkdownCodeBlockProcessor('kanka', async (source, el, ctx) => {
      if (!this.settings.apiToken) {
        return
      }
      // const parsed = parseYaml(source)
      const r = /campaign\/(\d+)\/characters\/(\d+)/
      const match = r.exec(source.trim())
      if (!match) {
        return
      }
      const campaignId = match[1]
      const characterId = match[2]
      const client = new KankaClient(this.settings.apiToken)
      const data = await client.getCharacter(campaignId, characterId)

      const htmlUrl = `https://kanka.io/en/campaign/${campaignId}/characters/${characterId}`
      const entryText = data.entry_parsed

      m.render(
        el,
        m('div', [
          m('small', ['View on ', m('a', { href: htmlUrl }, 'Kanka.io')]),
          m('div', m('em', data.id), ' – ', m('em', data.name)),
          m('div', m.trust(entryText)),
        ]),
      )
    })
  }

  private addStatusBar() {
    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem()
    statusBarItemEl.setText('Status Bar Text')
  }

  private addRibbons() {
    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon('dice', 'ObsidianKanka Plugin', (evt: MouseEvent) => {
      // Called when the user clicks the icon.
      new Notice('This is a notice!')
    })
    // Perform additional things with the ribbon
    ribbonIconEl.addClass('my-plugin-ribbon-class')
  }

  private addCommands() {
    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: 'open-ob-kanka-modal-simple',
      name: 'Open Kanka modal (simple)',
      callback: () => {
        new ObsidianKankaModal(this.app).open()
      },
    })
    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: 'ob-kanka-editor-command',
      name: 'ObsidianKanka editor command',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        console.log(editor.getSelection())
        editor.replaceSelection('ObsidianKanka Editor Command')
      },
    })
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    this.addCommand({
      id: 'open-ob-kanka-modal-complex',
      name: 'Open Kanka modal (complex)',
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView)
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new ObsidianKankaModal(this.app).open()
          }

          // This command will only show up in Command Palette when the check function returns true
          return true
        }
      },
    })
  }
}

class ObsidianKankaModal extends Modal {
  constructor(app: App) {
    super(app)
  }

  onOpen() {
    const { contentEl } = this
    contentEl.setText('Woah!')
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

class KankaClient {
  constructor(private token: string) {}

  async getCharacter(campaignId: string, characterId: string) {
    const url = `https://kanka.io/api/1.0/campaigns/${campaignId}/characters/${characterId}`
    const resp = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + this.token,
      },
    })
    const data = await resp.json()
    return data.data
  }
}

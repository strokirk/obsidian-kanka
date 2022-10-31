import { PluginSettingTab, Setting } from 'obsidian'
import type ObsidianKanka from './main'

export class ObsidianKankaSettingTab extends PluginSettingTab {
  plugin: ObsidianKanka

  constructor(plugin: ObsidianKanka) {
    super(plugin.app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' })

    new Setting(containerEl)
      .setName('Setting #1')
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder('Enter your secret')
          .setValue(this.plugin.settings.apiToken || '')
          .onChange(async (value) => {
            if (value.length) {
              this.plugin.settings.apiToken = value
            } else {
              this.plugin.settings.apiToken = null
            }
            await this.plugin.saveSettings()
          }),
      )
  }
}

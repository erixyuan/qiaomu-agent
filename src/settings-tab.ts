import { App, Modal, Notice, Platform, PluginSettingTab, Setting, setIcon } from "obsidian";
import type QiaomuAgentPlugin from "./main";
import { ProviderSettings } from "./ui/provider-settings";
import { CapabilitiesModal } from "./ui/capabilities-modal";
import { searchWeb, WEB_SEARCH_SECRET_ID } from "./services/web-search";

class WebSearchModal extends Modal {
  constructor(app: App, private readonly onChange: () => void) { super(app); }
  override onOpen(): void {
    this.modalEl.addClass("qa-web-search-modal");
    this.titleEl.setText("联网搜索");
    const connected = Boolean(this.app.secretStorage.getSecret(WEB_SEARCH_SECRET_ID));
    this.contentEl.createDiv({ cls: "qa-web-search-note", text: "模型自带搜索会自动使用。其他模型可连接 Brave Search。" });
    const label = this.contentEl.createEl("label", { cls: "qa-web-search-label", text: "Brave Search API Key" });
    const input = label.createEl("input", { type: "password", attr: { placeholder: connected ? "已保存 · 填写以更换" : "粘贴 API Key", autocomplete: "off", spellcheck: "false" } });
    const link = this.contentEl.createEl("a", { cls: "qa-web-search-link", text: "获取密钥", href: "https://api-dashboard.search.brave.com/", attr: { target: "_blank", rel: "noopener noreferrer" } });
    setIcon(link.createSpan({ attr: { "aria-hidden": "true" } }), "arrow-up-right");
    const footer = this.contentEl.createDiv({ cls: "qa-modal-footer" });
    if (connected) footer.createEl("button", { text: "移除密钥" }).addEventListener("click", () => {
      this.app.secretStorage.setSecret(WEB_SEARCH_SECRET_ID, ""); this.onChange(); this.close();
    });
    const save = footer.createEl("button", { cls: "mod-cta", text: "验证并保存" });
    save.addEventListener("click", async () => {
      const key = input.value.trim();
      if (!key) { if (!connected) new Notice("请填写 API Key"); else this.close(); return; }
      save.disabled = true; save.setText("验证中…");
      try {
        await searchWeb("Brave Search", key, AbortSignal.timeout(12_000));
        this.app.secretStorage.setSecret(WEB_SEARCH_SECRET_ID, key); this.onChange(); this.close();
      } catch (error) {
        new Notice(`连接失败：${error instanceof Error ? error.message : String(error)}`);
        save.disabled = false; save.setText("验证并保存");
      }
    });
  }
}

export class ModelManagerModal extends Modal {
  constructor(app: App, private readonly plugin: QiaomuAgentPlugin) { super(app); }
  override onOpen(): void {
    this.modalEl.addClass("qa-model-manager-modal");
    this.titleEl.setText("模型");
    const tab = new QiaomuSettingTab(this.app, this.plugin, true);
    tab.containerEl = this.contentEl;
    tab.display();
  }
  override onClose(): void { this.contentEl.empty(); }
}

export class QiaomuSettingTab extends PluginSettingTab {
  private activeSection: "models" | "chat" | "tools" | "about" = "models";
  private readonly providers: ProviderSettings;
  constructor(app: App, private readonly plugin: QiaomuAgentPlugin, private readonly connectionsOnly = false) {
    super(app, plugin);
    this.providers = new ProviderSettings(plugin, () => this.display());
  }

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("qiaomu-agent-settings");
    if (this.connectionsOnly) {
      this.renderConnectionSection(containerEl);
      return;
    }
    const header = containerEl.createDiv({ cls: "qiaomu-agent-settings__header" });
    const identity = header.createDiv({ cls: "qiaomu-agent-settings__identity" });
    setIcon(identity.createSpan({ attr: { "aria-hidden": "true" } }), "tree-deciduous");
    identity.createEl("h2", { text: "乔木 Agent" });
    const tabs = header.createDiv({ cls: "qiaomu-agent-settings__tabs" });
    tabs.setAttribute("role", "tablist");
    const sections = [{ id: "models", label: "模型" }, { id: "chat", label: "对话" }, { id: "tools", label: "工具" }, { id: "about", label: "关于" }] as const;
    for (const [index, section] of sections.entries()) {
      const selected = this.activeSection === section.id;
      const button = tabs.createEl("button", { text: section.label, cls: "qiaomu-agent-settings__tab" });
      button.type = "button"; button.setAttribute("role", "tab"); button.setAttribute("aria-selected", String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected) button.addClass("is-active");
      button.addEventListener("click", () => { this.activeSection = section.id; this.display(); this.containerEl.querySelector<HTMLElement>("[role=tab][aria-selected=true]")?.focus(); });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        this.activeSection = sections[(index + (event.key === "ArrowRight" ? 1 : sections.length - 1)) % sections.length]!.id;
        this.display();
        this.containerEl.querySelector<HTMLElement>("[role=tab][aria-selected=true]")?.focus();
      });
    }
    const body = containerEl.createDiv({ cls: "qiaomu-agent-settings__body" });
    body.setAttribute("role", "tabpanel");
    if (this.activeSection === "models") this.renderConnectionSection(body);
    if (this.activeSection === "chat") this.renderBehaviorSection(body);
    if (this.activeSection === "tools") { this.renderToolsSection(body); this.renderCapabilitySection(body); }
    if (this.activeSection === "about") this.renderAboutSection(body);
  }

  private renderAboutSection(containerEl: HTMLElement): void {
    const about = containerEl.createDiv({ cls: "qiaomu-agent-settings__about" });
    const external = { target: "_blank", rel: "noopener noreferrer" };

    const hero = about.createDiv({ cls: "qiaomu-agent-settings__about-hero" });
    const release = hero.createDiv({ cls: "qiaomu-agent-settings__about-release" });
    release.createSpan({ cls: "qiaomu-agent-settings__about-label", text: "当前版本" });
    release.createSpan({ cls: "qiaomu-agent-settings__version", text: `v${this.plugin.manifest.version}` });
    const actions = hero.createDiv({ cls: "qiaomu-agent-settings__about-actions" });
    const action = (label: string, icon: string, href: string) => {
      const link = actions.createEl("a", { cls: "qiaomu-agent-settings__about-action", href, attr: external });
      setIcon(link.createSpan({ attr: { "aria-hidden": "true" } }), icon);
      link.createSpan({ text: label });
    };
    action("更新日志", "history", "https://github.com/joeseesun/qiaomu-agent/releases");
    action("反馈问题", "bug", "https://github.com/joeseesun/qiaomu-agent/issues/new");
    action("使用说明", "book-open", "https://github.com/joeseesun/qiaomu-agent#readme");

    const support = about.createDiv({ cls: "qiaomu-agent-settings__about-support" });
    const qrCard = (icon: string, label: string, hint: string, src: string, alt: string) => {
      const card = support.createEl("figure", { cls: "qiaomu-agent-settings__about-qr" });
      card.createDiv({ cls: "qiaomu-agent-settings__about-qr-image" }).createEl("img", { attr: { src, alt, loading: "lazy", width: "148", height: "148" } });
      const caption = card.createEl("figcaption");
      const name = caption.createDiv({ cls: "qiaomu-agent-settings__about-qr-title" });
      setIcon(name.createSpan({ attr: { "aria-hidden": "true" } }), icon);
      name.createSpan({ text: label });
      caption.createDiv({ cls: "qiaomu-agent-settings__about-qr-hint", text: hint });
    };
    qrCard("newspaper", "关注公众号", "微信搜索「向阳乔木推荐看」", "https://radio.qiaomu.ai/assets/qiaomu_wechat_public_account_qr.jpg", "向阳乔木推荐看公众号二维码");
    qrCard("coffee", "请我喝杯咖啡", "微信扫码，支持持续更新", "https://radio.qiaomu.ai/assets/qiaomu_reward_qr.png", "向阳乔木打赏二维码");

    const footer = about.createDiv({ cls: "qiaomu-agent-settings__about-footer" });
    const links = footer.createDiv({ cls: "qiaomu-agent-settings__about-links" });
    for (const [label, href] of [["qiaomu.ai", "https://qiaomu.ai/"], ["博客", "https://blog.qiaomu.ai/"], ["X", "https://x.com/vista8"], ["GitHub", "https://github.com/joeseesun"], ["邮箱", "mailto:vista8@gmail.com"]] as const) {
      links.createEl("a", { text: label, href, attr: external });
    }
    footer.createEl("p", { text: "对话与附件只发送给你选择的本机 Agent 或模型服务商；API Key 仅保存在本机。" });
    footer.createEl("p", { text: "© 向阳乔木 · MIT 许可 · 第三方许可见插件目录 THIRD_PARTY_NOTICES.md" });
  }

  private renderConnectionSection(containerEl: HTMLElement): void {
    this.providers.render(containerEl);
  }

  private renderToolsSection(containerEl: HTMLElement): void {
    const search = containerEl.createDiv({ cls: "qiaomu-agent-settings__group" });
    new Setting(search)
      .setName("联网搜索")
      .setDesc(this.app.secretStorage.getSecret(WEB_SEARCH_SECRET_ID) ? "模型原生搜索或 Brave Search" : "支持的模型自动搜索；其他模型可连接 Brave Search")
      .addButton((button) => button.setButtonText("设置").onClick(() => new WebSearchModal(this.app, () => this.display()).open()));
    if (!Platform.isDesktopApp) {
      containerEl.createEl("p", { cls: "setting-item-description", text: "本地 CLI、外部 Skills 和 MCP 仅在桌面端可用。" });
      return;
    }
    const group = containerEl.createDiv({ cls: "qiaomu-agent-settings__group" });
    const obsidianCli = this.plugin.obsidianCliService.getConnection();
    new Setting(group)
      .setName("Obsidian CLI")
      .setDesc(obsidianCli.detail)
      .addToggle((toggle) => toggle.setValue(this.plugin.settings.useObsidianCli).setDisabled(obsidianCli.state !== "ready").onChange(async (value) => {
        this.plugin.settings.useObsidianCli = value; await this.plugin.saveSettings();
      }))
      .addButton((button) => button.setButtonText("重新检测").onClick(async () => {
        button.setDisabled(true).setButtonText("检测中…"); await this.plugin.obsidianCliService.detect(); this.display();
      }));
  }

  private renderBehaviorSection(containerEl: HTMLElement): void {
    const appearance = containerEl.createDiv({ cls: "qiaomu-agent-settings__group" });
    new Setting(appearance)
      .setName("对话字体")
      .addDropdown((dropdown) => dropdown
        .addOption("system", "系统字体")
        .addOption("obsidian", "跟随 Obsidian")
        .setValue(this.plugin.settings.chatFontFamily)
        .onChange(async (value) => { this.plugin.settings.chatFontFamily = value === "obsidian" ? "obsidian" : "system"; await this.plugin.saveSettings(); }));
    new Setting(appearance).setName("对话字号").addDropdown((dropdown) => {
      for (let size = 13; size <= 20; size++) dropdown.addOption(String(size), `${size} px`);
      dropdown.setValue(String(this.plugin.settings.chatFontSize)).onChange(async (value) => {
        this.plugin.settings.chatFontSize = Number(value); await this.plugin.saveSettings();
      });
    });
    new Setting(appearance).setName("代码字号").addDropdown((dropdown) => {
      for (let size = 12; size <= 18; size++) dropdown.addOption(String(size), `${size} px`);
      dropdown.setValue(String(this.plugin.settings.codeFontSize)).onChange(async (value) => {
        this.plugin.settings.codeFontSize = Number(value); await this.plugin.saveSettings();
      });
    });
    const behavior = containerEl.createDiv({ cls: "qiaomu-agent-settings__group" });
    new Setting(behavior)
      .setName("默认权限")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("plan", "不允许修改文件")
          .addOption("edit", "允许修改当前 Obsidian 库")
          .addOption("full", "完全访问本机文件（Codex 桌面端）")
          .setValue(this.plugin.settings.permissionMode)
          .onChange(async (value) => {
            this.plugin.settings.permissionMode = value === "full" ? "full" : value === "edit" ? "edit" : "plan";
            await this.plugin.saveSettings();
          })
      );

    new Setting(behavior)
      .setName("自动附加当前笔记")
      .setDesc("当前笔记会发送给所选模型。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoAttachActiveNote).onChange(async (value) => {
          this.plugin.settings.autoAttachActiveNote = value;
          await this.plugin.saveSettings();
        })
      );

    const advanced = containerEl.createEl("details", { cls: "qiaomu-agent-settings__advanced-settings" });
    const summary = advanced.createEl("summary", { cls: "qa-disclosure" });
    summary.createSpan({ text: "自定义对话" });
    setIcon(summary.createSpan({ cls: "qa-disclosure-chevron", attr: { "aria-hidden": "true" } }), "chevron-right");
    const advancedGroup = advanced.createDiv({ cls: "qiaomu-agent-settings__group" });
    new Setting(advancedGroup)
      .setName("系统 Prompt")
      .addTextArea((text) => {
        text.inputEl.rows = 10;
        text.inputEl.addClass("qiaomu-agent-settings__large-input");
        text.setValue(this.plugin.settings.systemPrompt).onChange(async (value) => {
          this.plugin.settings.systemPrompt = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(advancedGroup)
      .setName("快捷提问")
      .setDesc("每行一条，最多 8 条。")
      .addTextArea((text) => {
        text.inputEl.rows = 5;
        text.setValue(this.plugin.settings.quickPrompts.join("\n")).onChange(async (value) => {
          this.plugin.settings.quickPrompts = value
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 8);
          await this.plugin.saveSettings();
        });
      });
  }

  private renderCapabilitySection(containerEl: HTMLElement): void {
    const group = containerEl.createDiv({ cls: "qiaomu-agent-settings__group" });
    new Setting(group).setName("技能")
      .setDesc(`${this.plugin.skillService.list().filter((skill) => !this.plugin.settings.disabledSkillPaths.includes(skill.path)).length} 个已启用`)
      .addButton((button) => button.setButtonText("管理技能").onClick(() => new CapabilitiesModal(this.app, this.plugin, "skills").open()));
    if (Platform.isDesktopApp) new Setting(group).setName("工具连接")
      .addButton((button) => button.setButtonText("管理连接").onClick(() => new CapabilitiesModal(this.app, this.plugin, "mcp").open()));
  }

}

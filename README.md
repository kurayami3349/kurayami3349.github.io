## **项目简介**
- 个人技术博客与工具脚本仓库，站点基于 `jekyll-theme-chirpy`。
- 包含文章、图片等内容，以及用于文章转换的脚本与站点构建工具。

## **许可总览**
- 代码许可：MIT（见 `LICENSE`）。适用于仓库中的脚本、插件及其他代码文件。
- 内容许可：All Rights Reserved（见 `LICENSE-Content`）。适用于除主题代码外的“非代码内容”（文章、图片、图表、音视频等）。

## **代码（MIT License）**
- 允许使用、复制、修改、合并、发布、分发、再许可及/或出售代码。
- 要求在代码的所有副本中保留版权声明与许可文本。
- 免责声明：代码按“现状”提供，不含任何明示或暗示保证。
- 建议在代码文件头部添加 `SPDX-License-Identifier: MIT` 以便自动化识别。

## **内容（All Rights Reserved）**
- 未经书面许可，禁止转载、改编、汇编、镜像、抓取或商业使用。
- 允许不超过 200 字的合理引用，需明确署名并提供原文链接，且不得暗示作者认可。
- 允许以普通超链接指向公开页面，禁止使用 iframe 等技术内嵌展示完整页面或文档。
- 搜索引擎为索引目的的自动抓取与缓存不视为侵权，但应尊重 robots 规则与版权请求。

## **署名与联系**
- 作者：qq7r
- 站点：`https://kurayami3349.github.io`
- 邮箱：`mu03cloud9926@163.com`

## **许可申请**
- 如需转载、翻译、使用图片，请通过上述邮箱联系，获取书面授权。


## **致谢**
- 主题：`jekyll-theme-chirpy`（MIT），原作者：Cotes Chung。主题自身的 `LICENSE` 已随仓库保留。

## 本地开发与检查

- 本机使用 Conda 的 `blob` 环境：`conda activate blob`。Ruby 版本记录于 `.ruby-version`，Gem 版本锁定于 `Gemfile.lock`。
- 新环境运行 `bundle install`；不要删除锁文件来绕过依赖问题。工具检查还需要 Python 3.9 或更新版本。
- `bash tools/run.sh`：本地预览；加 `-p` 使用生产配置。
- `bash tools/test.sh`：运行转换器回归测试、文章元数据检查、生产构建、发布范围与版权检查、HTMLProofer 内部链接检查。外部链接不在自动检查范围内。
- 无需激活环境也可运行：`conda run --no-capture-output -n blob bash tools/test.sh`。

## 笔记与发布流程

原始笔记放在 `raw/`，正文章节参考 `_templates/paper-note.md`。`raw/` 不纳入 Git 或站点构建，请自行备份。上传普通 Markdown（无需 Jekyll front matter），图片放在笔记旁的 `attachments/` 子目录，例如 `![结构图](attachments/architecture.png)`。

```bash
python3 tools/convert_paper_note.py raw/note.md "Paper title" \
  --slug paper-title --date 2026-10-28 --tag VLA --description "这篇笔记的重点"
```

转换器支持 Zotero 的 `### Meta Data` 块，字段可使用 `- **Title:** ...` 或 `* **Title:** ...`；自动提取 Title、Author、ArXiv id、DOI、URL、Abstract、Research Tags。研究领域保存在 `paper.subjects`，博客标签使用 `--tag`（可重复）或元数据中的 `Tags` 字段。可用 `--authors`、`--venue`、`--paper-url`、`--pdf`、`--code`、`--project` 补充或覆盖信息。

- 识别 arXiv 编号后，图片继续归档到 `img/arxiv-编号/`；没有图片也会创建该目录。无编号时沿用 `img/`。
- Markdown 图片、HTML `<figure>` / `<img>` 的路径会转换，已有 caption 和正文保留；不会自动编写图注或 Insights。
- 自动生成新模板共用的论文页头、折叠摘要、PDF 阅读器，并启用数学公式和 Chirpy 目录。
- 生成文章默认 `published: false`。补齐标签、简介并检查内容后再发布。完整 Jekyll 文章无需重复转换。
- 缺图、越界路径及不同内容的同名图片会报错；已有文章默认拒绝覆盖，确需覆盖时使用 `--force`。

提交前运行 `bash tools/test.sh`。PR 会运行同一检查，只有 `main` 的提交会部署到 GitHub Pages。如使用 `tools/publish.sh`，先用 `git add <明确的文件路径>` 暂存要发布的改动；脚本要求无其他未暂存改动或未跟踪文件，测试通过后提交并推送，不会自动暂存整个仓库。

文章与图片遵循 `LICENSE-Content`，公开声明位于 `/license/`；页脚与文章底部文案由 `_data/locales/zh-CN.yml` 覆盖。`AGENTS.md`、README、测试及原始笔记不进入发布产物。

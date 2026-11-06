---
layout: page
title: 许可与版权
permalink: /license/
---

本站的原创代码与原创内容保留所有权利，主题和第三方材料遵循各自许可证。

| 部分 | 适用声明 |
| --- | --- |
| 原创代码与增补 | [保留所有权利](#original-code) |
| 原创文章与媒体 | [保留所有权利](#original-content) |
| 主题上游代码 | [MIT](#theme-license) |
| 其他第三方材料 | 原有许可或适用法律 |

## 原创代码
{: #original-code }

{% include_relative LICENSE %}

## 原创内容
{: #original-content }

{% include_relative LICENSE-Content %}

## 主题 MIT 许可
{: #theme-license }

以下许可适用于 Chirpy 主题及沿用的上游部分。主题衍生文件中的原创增补按上方的原创代码声明处理。

<pre class="license-text">{% capture theme_license %}{% include_relative LICENSE-Theme %}{% endcapture %}{{ theme_license | escape }}</pre>

# luci-app-ledset

**简体中文** | [English](README.en.md)

一个用于 OpenWrt / ImmortalWrt 的小型 LuCI 应用，通过一个开关即可打开或关闭
**所有**系统 LED 指示灯，并且该设置会在重启后自动恢复。

* 基于 LuCI 2（客户端 JavaScript），不含传统的 Lua CBI 视图。
* 提供英文与简体中文（`zh_Hans`）翻译。
* 同时支持两种软件包格式：`.ipk`（opkg，OpenWrt 24.10）与 `.apk`
  （apk-openssl，OpenWrt 25.12+）。

## 工作原理

本软件包由三个相互配合的部分组成：

| 组件 | 路径 | 作用 |
| --- | --- | --- |
| UCI 配置 | `/etc/config/ledset` | 保存 `ledset.global.enable`（`1` = 开启，`0` = 关闭）。 |
| init 脚本 | `/etc/init.d/ledset` | `START=99`，在启动过程的最后阶段应用已保存的状态。 |
| LuCI 视图 | `view/ledset.js` | 渲染开关，并让改动立即生效。 |

当您点击 **保存并应用** 时，浏览器会先提交 UCI 改动，然后调用
`ubus call rc init {"name":"ledset","action":"restart"}`，因此 LED 会立刻改变
状态，无需重启。由于 init 脚本在每次启动时都会于 `START=99` 阶段再次运行
（此时内核 LED 触发器与主板默认 LED 配置均已初始化完毕），所以所选的设置能够
在重启后保持。

LED 循环与规格说明中完全一致：

```sh
for i in /sys/class/leds/*; do [ -e "$i/brightness" ] && echo 0 > "$i/brightness"; done
```

当 LED 处于启用状态时，写入的值为 `1` 而不是 `0`。

## 安装

从最新的 GitHub Actions 构建产物中下载对应的文件，复制到路由器上并安装。

OpenWrt 24.10 及更早版本（opkg）：

```sh
opkg install luci-app-ledset_*.ipk
opkg install luci-i18n-ledset-zh-cn_*.ipk
```

OpenWrt 25.12 及更新版本（apk）：

```sh
apk add --allow-untrusted luci-app-ledset-*.apk
apk add --allow-untrusted luci-i18n-ledset-zh-cn-*.apk
```

然后打开 LuCI 中的 **系统 → LED 指示灯控制**。

## 命令行

```sh
uci set ledset.global.enable='0'
uci commit ledset
/etc/init.d/ledset restart
```

## 构建

### 使用 OpenWrt SDK

```sh
# 在已解压的 SDK 目录中执行
mkdir -p package/luci-app-ledset
rsync -a --exclude .git ./ package/luci-app-ledset/
./scripts/feeds update -a
./scripts/feeds install -a
make defconfig
make package/luci-app-ledset/compile V=s
```

生成的软件包会出现在 `bin/packages/<arch>/luci/` 下。

### 使用 GitHub Actions

`.github/workflows/build.yml` 会以矩阵方式，针对 OpenWrt **24.10.8**
（`.ipk`）与 **25.12.5**（`.apk`）的官方 SDK 构建本软件包，并将应用包、翻译包
以及软件包索引文件作为构建产物上传。每次 push、pull request 以及手动触发时都会
运行。

## 仓库结构

```
luci-app-ledset/
├── Makefile
├── LICENSE
├── htdocs/luci-static/resources/view/ledset.js
├── po/
│   ├── templates/ledset.pot
│   └── zh_Hans/ledset.po
├── root/
│   ├── etc/
│   │   ├── config/ledset
│   │   ├── init.d/ledset
│   │   └── uci-defaults/luci-app-ledset
│   └── usr/share/
│       ├── luci/menu.d/luci-app-ledset.json
│       └── rpcd/acl.d/luci-app-ledset.json
└── .github/workflows/build.yml
```

真正让页面可以被访问到的是 `menu.d` 与 `acl.d` 这两个文件：前者注册了
*系统 → LED 指示灯控制* 菜单项，后者授予该视图读写 `ledset` UCI 配置以及调用
`rc init` 的权限。

## 许可证

MIT - 详见 [LICENSE](LICENSE)。

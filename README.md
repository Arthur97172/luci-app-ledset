# luci-app-ledset

A small LuCI application for OpenWrt / ImmortalWrt that switches **all** system
LEDs on or off with a single toggle, and keeps that choice across reboots.

* LuCI 2 (client side JavaScript) - no legacy Lua CBI views.
* English and Simplified Chinese (`zh_Hans`) translations.
* Supports both package formats: `.ipk` (opkg, OpenWrt 24.10) and `.apk`
  (apk-openssl, OpenWrt 25.12+).

## How it works

The package consists of three cooperating pieces:

| Component | Path | Purpose |
| --- | --- | --- |
| UCI config | `/etc/config/ledset` | Stores `ledset.global.enable` (`1` = on, `0` = off). |
| init script | `/etc/init.d/ledset` | `START=99`, applies the stored state at the very end of boot. |
| LuCI view | `view/ledset.js` | Renders the toggle and applies changes immediately. |

When you press **Save & Apply**, the browser commits the UCI change and then
calls `ubus call rc init {"name":"ledset","action":"restart"}`, so the LEDs
change state right away - no reboot needed. Because the init script runs again
on every boot at `START=99` (after the kernel LED triggers and the board
default LED configuration have been set up), the chosen state survives a
reboot.

The LED loop is exactly the one from the specification:

```sh
for i in /sys/class/leds/*; do [ -e "$i/brightness" ] && echo 0 > "$i/brightness"; done
```

with `1` written instead of `0` when LEDs are enabled.

## Installation

Grab the matching artifact from the latest GitHub Actions run, copy it to the
router and install it.

OpenWrt 24.10 and older (opkg):

```sh
opkg install luci-app-ledset_*.ipk
opkg install luci-i18n-ledset-zh-cn_*.ipk
```

OpenWrt 25.12 and newer (apk):

```sh
apk add --allow-untrusted luci-app-ledset-*.apk
apk add --allow-untrusted luci-i18n-ledset-zh-cn-*.apk
```

Then open **System → LED Control** in LuCI.

## Command line

```sh
uci set ledset.global.enable='0'
uci commit ledset
/etc/init.d/ledset restart
```

## Building

### With the OpenWrt SDK

```sh
# inside an unpacked SDK
mkdir -p package/luci-app-ledset
rsync -a --exclude .git ./ package/luci-app-ledset/
./scripts/feeds update -a
./scripts/feeds install -a
make defconfig
make package/luci-app-ledset/compile V=s
```

The resulting packages appear below `bin/packages/<arch>/luci/`.

### With GitHub Actions

`.github/workflows/build.yml` builds the package against the official SDKs of
OpenWrt **24.10.8** (`.ipk`) and **25.12.5** (`.apk`) in a matrix and uploads
the application package, the translation package and the package index files as
artifacts. It runs on every push, pull request and manual dispatch.

## Repository layout

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

The `menu.d` and `acl.d` files are what actually make the page reachable: the
first registers the *System → LED Control* entry, the second grants the view
read/write access to the `ledset` UCI config and permission to call
`rc init`.

## License

MIT - see [LICENSE](LICENSE).

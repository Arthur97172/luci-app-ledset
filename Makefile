#
# Copyright (C) 2026 Arthur97172 <arthur97172@outlook.com>
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-ledset
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Arthur97172 <Arthur97172@users.noreply.github.com>

LUCI_TITLE:=LuCI app to switch all system LEDs on or off
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all
LUCI_URL:=https://github.com/Arthur97172/luci-app-ledset
LUCI_MAINTAINER:=Arthur97172 <Arthur97172@users.noreply.github.com>

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
#
# The line above is load bearing and must not be removed: OpenWrt's package
# scanner (include/scan.mk) discovers package directories by grepping their
# Makefile for the literal text "call BuildPackage". Without it the package is
# silently skipped and "make package/luci-app-ledset/compile" fails with
# "No rule to make target".
#
# Note that the macro itself is *not* invoked here: luci.mk already calls
# BuildPackage for every entry in LUCI_BUILD_PACKAGES, which is this package
# plus one luci-i18n-$(LUCI_BASENAME)-<lang> package for each language
# directory below ./po (here po/zh_Hans -> luci-i18n-ledset-zh-cn). Calling it
# a second time would define every package twice and break the build.

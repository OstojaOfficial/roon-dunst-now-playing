# Maintainer: Ostojλ <OstojaSredojevic@protonmail.com>
pkgname=roon-dunst-now-playing-git
pkgver=1.0.0
pkgrel=1
pkgdesc="Simple Roon extension that uses notify-send"
arch=('any')
url="https://github.com/OstojaOfficial/roon-dunst-now-playing"
license=('MIT')
depends=('nodejs' 'roon-kit')
makedepends=('git')
source=("git+$url.git")
md5sums=('SKIP' 'SKIP')
install=${pkgname}.install

package() {
  cd "$srcdir"
  mkdir -p ${pkgdir}/opt/${$pkgname}
  install -Dm644 "roon_extension.js" "$pkgdir/opt/$pkgname/roon_extension.js"
  install -Dm644 "roon-extension.service" "$pkgdir/etc/systemd/user/roon-extension.service"
  install -Dm644 "LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
}
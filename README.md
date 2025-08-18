# MakeCode Minecraft Extension - Mming Lab

> このページを開く [https://mming-lab.github.io/makecode-minecraft-mming-ext/](https://mming-lab.github.io/makecode-minecraft-mming-ext/)

Minecraft Education Editionで高度なカメラワークと3D形状生成を可能にするMakeCode拡張機能です。

## 主な機能

### 🎥 カメラ制御
- 32種類のイージング効果でスムーズなカメラ移動
- 画面フェード効果とカメラプリセット
- プレイヤー入力制御

### 📐 3D形状生成
- **高速化**: 最適化されたfill操作で大幅な性能向上
- **11種類の形状**: 球、円柱、円錐、楕円体、螺旋、トーラス、パラボロイド、双曲面など
- **座標計算**: ブロック配置前の座標配列取得
- **中空対応**: すべての形状で中空/実体切り替え可能

### 🔧 数学ツール
- 3D座標回転（任意軸周り）
- 可変制御点ベジェ曲線
- 数値ブロック調査機能

## 使用方法

### 拡張機能として追加
1. [minecraft.makecode.com](https://minecraft.makecode.com/) を開く
2. **新しいプロジェクト** → **拡張機能**
3. `https://github.com/mming-lab/makecode-minecraft-mming-ext` を検索

### 基本的な使用例

```typescript
// 高速化された球体生成
let positions = coordinates.getSpherePositions(
    world(0, 70, 0), 10, false
)
coordinates.optimizedFill(positions, Block.Diamond)

// スムーズカメラ移動
Camera.EasePosition(
    world(100, 70, 100),
    world(0, 65, 0),
    Easing.in_out_cubic,
    3
)

// ベジェ曲線
shapes.PlaceVariableBezierCurve(
    world(0, 65, 0),
    [world(20, 80, 10), world(40, 60, 20)],
    world(60, 65, 30),
    Block.Gold
)
```

## 対応バージョン
- MakeCode for Minecraft: 2.1.9+
- Minecraft Education Edition

## 開発
```bash
pxt build    # ビルド
pxt deploy   # デプロイ
pxt test     # テスト
```

---

#### メタデータ (検索、レンダリングに使用)
* for PXT/minecraft
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
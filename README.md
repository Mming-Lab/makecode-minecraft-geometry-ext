# MakeCode Minecraft 図形生成拡張機能 - Mming Lab

> このページを開く [https://mming-lab.github.io/makecode-minecraft-mming-shapes/](https://mming-lab.github.io/makecode-minecraft-mming-shapes/)

Minecraft Education Editionで高度な3D図形生成を可能にするMakeCode拡張機能です。

## 主な機能

### 📐 高速3D図形生成
- **最適化アルゴリズム**: 貪欲アルゴリズムによる高速ブロック配置
- **11種類の3D図形**: 球、円柱、円錐、楕円体、螺旋、トーラス、パラボロイド、双曲面、直方体など
- **座標計算と配置の分離**: 座標配列を取得してから配置する柔軟な設計
- **中空・輪郭対応**: すべての形状で実体/輪郭/中空の切り替え可能

### 🎨 対応図形一覧
- **基本図形**: 線、円、球、円柱、円錐、直方体
- **楕円体系**: 楕円体（3軸独立半径指定）
- **曲面図形**: トーラス（ドーナツ形）、パラボロイド（衛星アンテナ形）、双曲面（冷却塔形）
- **曲線**: 可変制御点ベジェ曲線、螺旋（ヘリックス）

### 🔧 数学ツール
- 可変制御点ベジェ曲線生成
- 3D Bresenhamアルゴリズムによる線分生成
- 正規化距離計算による楕円体生成

## 使用方法

### 拡張機能として追加
1. [minecraft.makecode.com](https://minecraft.makecode.com/) を開く
2. **新しいプロジェクト** → **拡張機能**
3. `https://github.com/mming-lab/makecode-minecraft-geometry-ext` を検索

### 基本的な使用例

#### ブロックエディタ
すべての図形ブロックは日本語で表示されます：
- 「高速球作り」ブロックで球体を作成
- 「円柱」ブロックで円柱を作成
- 「螺旋」ブロックで螺旋を作成

#### JavaScript/TypeScript
```typescript
// 高速化された球体生成
shapes.optimizedSphere(Block.Diamond, world(0, 70, 0), 10)

// 中空の円柱
shapes.cylinder(Block.Glass, world(0, 65, 0), 5, 20, ShapeOperation.Hollow)

// 螺旋階段
shapes.helix(Block.StoneBrick, world(0, 60, 0), 5, 30, 5, true)

// ベジェ曲線
shapes.variableBezier(
    Block.Gold,
    world(0, 65, 0),
    world(60, 65, 30),
    [world(20, 80, 10), world(40, 60, 20)]
)

// 座標計算と配置を分離
let positions = coordinates.getSpherePositions(world(0, 70, 0), 10, false)
coordinates.optimizedFill(positions, Block.Diamond)
```

## 名前空間

### `shapes` - 図形生成
ブロックを直接配置する関数群（日本語ブロック対応）

### `coordinates` - 座標計算
座標配列を返す関数群（配置は行わない）

## 技術的特徴

### 最適化アルゴリズム
- **貪欲アルゴリズム**: 座標配列から最大直方体を検出してfill操作で効率配置
- **バッチ処理**: 大量のブロックを2048個ずつのバッチに分割して配置
- **重複排除**: MakeCode互換の方法で重複座標を排除

### 数学的実装
- **ベルンシュタイン基底多項式**: 可変次数ベジェ曲線
- **正規化距離計算**: 楕円体の高精度生成
- **3D Bresenhamアルゴリズム**: 効率的な線分生成
- **弧長ベース密度計算**: 螺旋の連続性を保つステップ数計算

## 対応バージョン
- MakeCode for Minecraft: 2.0.37+
- Minecraft Education Edition

## 開発
```bash
pxt build    # ビルド
pxt deploy   # デプロイ
pxt test     # テスト
```

## ライセンス
MIT License

---

#### メタデータ (検索、レンダリングに使用)
* for PXT/minecraft
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>

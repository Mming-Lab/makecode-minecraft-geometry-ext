
# MakeCode Minecraft Extension - Mming Lab

> このページを開く [https://mming-lab.github.io/makecode-minecraft-mming-ext/](https://mming-lab.github.io/makecode-minecraft-mming-ext/)

この拡張機能は、Minecraft Education Editionで高度なカメラワークと数学的曲線生成を可能にする MakeCode 拡張機能です。

## 主な機能

### 🎥 カメラ制御システム
- **スムーズカメラ移動**: 32種類のイージング効果でシネマティックな動き
- **画面フェード効果**: カスタマイズ可能な色とタイミング
- **カメラプリセット**: 一人称、三人称、正面視点の切り替え
- **入力制御**: プレイヤー移動とカメラ操作の有効/無効切り替え

### 📐 3D数学ツール
- **座標回転**: 任意の軸周りでの3D座標回転（回転行列使用）
- **ベジェ曲線**: 3次および可変制御点による滑らかな曲線生成
- **効率的配置**: 重複を避けたブロック配置アルゴリズム

### 🔍 ユーティリティ
- **数値ブロック調査**: エージェントによる色付きウールブロックから数値読み取り

## 拡張機能として使用

このリポジトリは、MakeCode で **拡張機能** として追加できます。

1. [https://minecraft.makecode.com/](https://minecraft.makecode.com/) を開く
2. **新しいプロジェクト** をクリック
3. ギアボタンメニューの **拡張機能** をクリック
4. **https://github.com/mming-lab/makecode-minecraft-mming-ext** を検索してインポート

## 使用例

### カメラワーク例
```typescript
// スムーズカメラ移動
Camera.EasePosition(
    positions.createWorld(100, 70, 100),
    positions.createWorld(0, 65, 0),
    Easing.in_out_cubic,
    3,
    true,
    true
)

// 画面フェード効果
Camera.fadeTime(1, 2, 1, Camera.rgb(0, 0, 0), true)
```

### 数学関数例
```typescript
// 座標回転
let rotatedPos = positions.RotateCoordinate(
    positions.createWorld(10, 0, 0),
    positions.createWorld(0, 0, 0),
    Axis.Y,
    45
)

// ベジェ曲線
shapes.PlaceVariableBezierCurve(
    positions.createWorld(0, 65, 0),
    [positions.createWorld(20, 80, 10), positions.createWorld(40, 60, 20)],
    positions.createWorld(60, 65, 30),
    Block.GoldBlock
)
```

## 開発

### このプロジェクトを編集

1. [https://minecraft.makecode.com/](https://minecraft.makecode.com/) を開く
2. **読み込む** → **URLから読み込む...** をクリック
3. **https://github.com/mming-lab/makecode-minecraft-mming-ext** を貼り付けてインポート

### ビルドコマンド
```bash
pxt build    # プロジェクトをビルド
pxt deploy   # デプロイ
pxt test     # テスト実行
```

## 対応バージョン
- MakeCode for Minecraft: 2.1.9+
- Minecraft Education Edition

#### メタデータ (検索、レンダリングに使用)

* for PXT/minecraft
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>

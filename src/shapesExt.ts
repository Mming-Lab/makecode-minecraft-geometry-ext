// 図形・フォーム生成拡張機能（最適化アルゴリズム使用）
// シンプルな3D図形から複雑なベジェ曲線までサポート

namespace shapes {

    // 標準MakeCode ShapeOperation列挙型を使用
    // ShapeOperation.Replace, ShapeOperation.Outline, ShapeOperation.Hollow

    /** 大きな座標配列を分割するためのバッチサイズ */
    const BATCH_SIZE = 2048;

    /**
     * 座標分割を使用してcoordinates.optimizedFillでブロックをバッチ配置
     * @param positions ブロックを配置する座標配列
     * @param block 配置するブロックタイプ
     */
    function batchPlaceBlocks(positions: Position[], block: number): void {
        if (!positions || positions.length === 0) {
            return;
        }

        // optimizedFill用に座標を小さなバッチに分割
        const totalBatches = Math.ceil(positions.length / BATCH_SIZE);

        player.say(`${coordinates.MESSAGES.PLACEMENT_START} (${positions.length} blocks, ${totalBatches} batches)`);

        for (let i = 0; i < positions.length; i += BATCH_SIZE) {
            const batch = positions.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            player.say(`${coordinates.MESSAGES.BATCH_PROCESSING} ${batchNumber}/${totalBatches} (${batch.length} blocks)`);
            coordinates.optimizedFill(batch, block);
        }

        player.say(coordinates.MESSAGES.PLACEMENT_COMPLETE);
    }

    /**
     * ShapeOperation.Hollowを処理：空気で満たした形状を作成し、次に輪郭を作成
     * すべての図形関数用の汎用ヘルパー
     * @param block 配置するブロックタイプ
     * @param operation 図形操作タイプ
     * @param getPositions 図形の座標配列を返す関数
     */
    function handleShapeOperation(
        block: number,
        operation: ShapeOperation,
        getPositions: (hollow: boolean) => Position[]
    ): void {
        if (operation === ShapeOperation.Hollow) {
            // 空気で満たした形状を作成し、次に輪郭を作成
            const filledPositions = getPositions(false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = getPositions(true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = getPositions(hollow);
            batchPlaceBlocks(positions, block);
        }
    }
    /**
     * 可変数の制御点を持つベジェ曲線に沿ってブロックを配置
     * 滑らかな結果のために最適化された曲線生成アルゴリズムを使用
     * @param startPoint 曲線の開始位置
     * @param controlPoints 曲線の形状に影響する制御点の配列
     * @param endPoint 曲線の終了位置
     * @param blockType 配置するブロックタイプ
     */
    //% weight=51
    //% blockId=minecraftVariableBezier
    //% block="可変ベジェ %block=minecraftBlock|開始 %startPoint=minecraftCreatePosition|終了 %endPoint=minecraftCreatePosition|制御点 %controlPoints"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% group="Lines and Curves"
    export function variableBezier(block: number, startPoint: Position, endPoint: Position, controlPoints: Position[]): void {
        const positions = coordinates.getVariableBezierCurvePositions(startPoint, controlPoints, endPoint);
        batchPlaceBlocks(positions, block);
    }

    /**
     * ブロックを配置して2点間に線を作成
     * @param p0 線の開始位置
     * @param p1 線の終了位置
     * @param block 配置するブロックタイプ
     */
    //% weight=100
    //% blockId=minecraftOptimizedLine
    //% block="高速線引き %block=minecraftBlock|開始 %p0=minecraftCreatePosition|終了 %p1=minecraftCreatePosition"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% group="Basic Shapes"
    export function optimizedLine(block: number, p0: Position, p1: Position): void {
        const positions = coordinates.getLinePositions(p0, p1);
        batchPlaceBlocks(positions, block);
    }

    /**
     * ブロックを配置して円を作成
     * @param center 円の中心位置
     * @param radius 円の半径 (1-50ブロック)
     * @param orientation 円の向き（X、Y、またはZ軸）
     * @param block 配置するブロックタイプ
     * @param hollow 中空の円を作成するか（輪郭のみ）
     */
    //% weight=95
    //% blockId=minecraftOptimizedCircle
    //% block="高速円描き %block=minecraftBlock|中心 %center=minecraftCreatePosition|半径 %radius|向き %orientation|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% group="Basic Shapes"
    export function optimizedCircle(block: number, center: Position, radius: number, orientation: Axis, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getCirclePositions(center, radius, orientation, hollow)
        );
    }

    /**
     * 最適化アルゴリズムを使用してブロックで球体を作成
     * @param center 球体の中心位置
     * @param radius 球体の半径 (1-50ブロック)
     * @param block 配置するブロックタイプ
     * @param hollow 中空球体を作成するか（殻のみ）
     * @param density 位置サンプリングの密度係数 (0.1-1.0、デフォルト: 1.0)
     */
    //% weight=90
    //% blockId=minecraftOptimizedSphere
    //% block="高速球作り %block=minecraftBlock|中心 %center=minecraftCreatePosition|半径 %radius|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% group="3D Shapes Optimized"
    export function optimizedSphere(block: number, center: Position, radius: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        // パラメータ検証
        if (!center) {
            player.say(coordinates.MESSAGES.ERROR_INVALID_CENTER);
            return;
        }
        if (radius <= 0) {
            player.say(coordinates.MESSAGES.ERROR_INVALID_RADIUS);
            return;
        }

        const density = 1.0; // 標準互換性のための固定密度
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getSpherePositions(center, radius, hollow, density)
        );
    }

    /**
     * ブロックを配置して直方体（矩形プリズム）を作成
     * @param corner1 直方体の最初の角の位置
     * @param corner2 反対側の角の位置
     * @param block 配置するブロックタイプ
     * @param hollow 中空直方体を作成するか（殻のみ）
     */
    //% weight=85
    //% blockId=minecraftCuboid
    //% block="直方体 %block=minecraftBlock|角1 %corner1=minecraftCreatePosition|角2 %corner2=minecraftCreatePosition|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% group="3D Shapes Basic"
    export function cuboid(block: number, corner1: Position, corner2: Position, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getCuboidPositions(corner1, corner2, hollow)
        );
    }

    /**
     * 最適化された建築アルゴリズムを使用して円柱を作成
     * @param center 円柱の底面中心位置
     * @param radius 円柱の半径 (1-50ブロック)
     * @param height 円柱の高さ (1-100ブロック)
     * @param block 配置するブロックタイプ
     * @param hollow 中空円柱を作成するか (デフォルト: false)
     */
    //% weight=80
    //% blockId=minecraftCylinder
    //% block="円柱 %block=minecraftBlock|中心 %center=minecraftCreatePosition|半径 %radius|高さ %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=1 height.max=300 height.defl=10
    //% group="3D Shapes Optimized"
    export function cylinder(block: number, center: Position, radius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getCylinderPositions(center, radius, height, hollow)
        );
    }

    /**
     * ブロックを配置して円錐を作成
     * @param center 円錐の底面中心位置
     * @param radius 円錐の底面半径 (1-50ブロック)
     * @param height 円錐の高さ (1-100ブロック)
     * @param block 配置するブロックタイプ
     * @param hollow 中空円錐を作成するか (デフォルト: false)
     */
    //% weight=75
    //% blockId=minecraftCone
    //% block="円錐 %block=minecraftBlock|中心 %center=minecraftCreatePosition|半径 %radius|高さ %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=1 height.max=300 height.defl=10
    //% group="3D Shapes Basic"
    export function cone(block: number, center: Position, radius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getConePositions(center, radius, height, hollow)
        );
    }

    /**
     * ブロックを配置してトーラス（ドーナツ形）を作成
     * @param center トーラスの中心位置
     * @param majorRadius 主半径（中心からチューブ中心までの距離、3-50ブロック）
     * @param minorRadius 副半径（チューブの太さ、1-20ブロック）
     * @param block 配置するブロックタイプ
     * @param hollow 中空トーラスを作成するか (デフォルト: false)
     */
    //% weight=70
    //% blockId=minecraftTorus
    //% block="トーラス %block=minecraftBlock|中心 %center=minecraftCreatePosition|主半径 %majorRadius|副半径 %minorRadius|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% majorRadius.min=3 majorRadius.max=200 majorRadius.defl=8
    //% minorRadius.min=1 minorRadius.max=100 minorRadius.defl=3
    //% group="Complex Shapes"
    export function torus(block: number, center: Position, majorRadius: number, minorRadius: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getTorusPositions(center, majorRadius, minorRadius, hollow)
        );
    }


    /**
     * 最適化された建築アルゴリズムを使用して楕円体を作成
     * @param center 楕円体の中心位置
     * @param radiusX X軸方向の半径 (1-50ブロック)
     * @param radiusY Y軸方向の半径 (1-50ブロック)
     * @param radiusZ Z軸方向の半径 (1-50ブロック)
     * @param block 配置するブロックタイプ
     * @param hollow 中空楕円体を作成するか (デフォルト: false)
     */
    //% weight=65
    //% blockId=minecraftEllipsoid
    //% block="楕円体 %block=minecraftBlock|中心 %center=minecraftCreatePosition|X半径 %radiusX|Y半径 %radiusY|Z半径 %radiusZ|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radiusX.min=1 radiusX.max=200 radiusX.defl=5
    //% radiusY.min=1 radiusY.max=200 radiusY.defl=3
    //% radiusZ.min=1 radiusZ.max=200 radiusZ.defl=7
    //% group="3D Shapes Optimized"
    export function ellipsoid(block: number, center: Position, radiusX: number, radiusY: number, radiusZ: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getEllipsoidPositions(center, radiusX, radiusY, radiusZ, hollow)
        );
    }

    /**
     * ブロックを配置してヘリックス（螺旋）を作成
     * @param center ヘリックスの底面中心位置
     * @param radius ヘリックスの半径 (1-50ブロック)
     * @param height ヘリックスの合計高さ (2-100ブロック)
     * @param turns 完全回転数 (0.5-20回転)
     * @param block 配置するブロックタイプ
     * @param clockwise 時計回りに回転するか (デフォルト: true)
     */
    //% weight=60
    //% blockId=minecraftHelix
    //% block="螺旋 %block=minecraftBlock|中心 %center=minecraftCreatePosition|半径 %radius|高さ %height|回転数 %turns||時計回り %clockwise"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=2 height.max=300 height.defl=20
    //% turns.min=0.5 turns.max=20 turns.defl=3
    //% clockwise.shadow=toggleOnOff clockwise.defl=true
    //% expandableArgumentMode="toggle"
    //% group="Complex Shapes"
    export function helix(block: number, center: Position, radius: number, height: number, turns: number, clockwise: boolean = true): void {
        const positions = coordinates.getHelixPositions(center, radius, height, turns, clockwise);
        batchPlaceBlocks(positions, block);
    }

    /**
     * ブロックを配置してパラボロイド（衛星アンテナ形）を作成
     * @param center パラボロイドの底面中心位置
     * @param radius 上部の最大半径 (2-50ブロック)
     * @param height パラボロイドの高さ (1-50ブロック)
     * @param block 配置するブロックタイプ
     * @param hollow 中空パラボロイドを作成するか (デフォルト: false)
     */
    //% weight=55
    //% blockId=minecraftParaboloid
    //% block="パラボロイド %block=minecraftBlock|中心 %center=minecraftCreatePosition|半径 %radius|高さ %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=2 radius.max=200 radius.defl=8
    //% height.min=1 height.max=300 height.defl=10
    //% group="Complex Shapes"
    export function paraboloid(block: number, center: Position, radius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getParaboloidPositions(center, radius, height, hollow)
        );
    }

    /**
     * ブロックを配置して双曲面（冷却塔形）を作成
     * @param center 双曲面の中心位置
     * @param baseRadius 底面の半径 (3-50ブロック)
     * @param waistRadius 最も狭い部分の半径 (1-30ブロック)
     * @param height 双曲面の合計高さ (4-100ブロック)
     * @param block 配置するブロックタイプ
     * @param hollow 中空双曲面を作成するか (デフォルト: false)
     */
    //% weight=50
    //% blockId=minecraftHyperboloid
    //% block="双曲面 %block=minecraftBlock|中心 %center=minecraftCreatePosition|底面半径 %baseRadius|くびれ半径 %waistRadius|高さ %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% baseRadius.min=3 baseRadius.max=200 baseRadius.defl=10
    //% waistRadius.min=1 waistRadius.max=100 waistRadius.defl=5
    //% height.min=4 height.max=300 height.defl=20
    //% group="Complex Shapes"
    export function hyperboloid(block: number, center: Position, baseRadius: number, waistRadius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        handleShapeOperation(block, operation, (hollow) =>
            coordinates.getHyperboloidPositions(center, baseRadius, waistRadius, height, hollow)
        );
    }

}
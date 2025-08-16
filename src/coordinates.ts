// 座標計算用の名前空間（ブロック配置せずに座標配列を返す）
// Coordinate calculation namespace (returns position arrays without placing blocks)
//% block="座標" weight=2 color=#4CAF50 icon="\uf43c" advanced=true
namespace coordinates {

    /**
     * Normalize coordinate to integer and clamp to valid range
     * @param coord Raw coordinate value
     * @returns Normalized integer coordinate
     */
    //% weight=5
    //% blockId=coordinatesNormalizeCoordinate
    //% block="normalize coordinate $coord"
    //% coord.defl=0
    //% advanced=true
    //% group="Coordinate Utilities"
    function normalizeCoordinate(coord: number): number {
        const normalized = Math.round(coord);
        return Math.max(-30000000, Math.min(30000000, normalized));
    }

    /**
     * Validate coordinates are within Minecraft world bounds
     * @param x X coordinate
     * @param y Y coordinate 
     * @param z Z coordinate
     * @returns True if coordinates are valid
     */
    //% weight=4
    //% blockId=coordinatesValidateCoordinates
    //% block="validate coordinates X $x Y $y Z $z"
    //% x.defl=0 y.defl=64 z.defl=0
    //% advanced=true
    //% group="Coordinate Utilities"
    function validateCoordinates(x: number, y: number, z: number): boolean {
        return x >= -30000000 && x <= 30000000 &&
               y >= -64 && y <= 320 &&
               z >= -30000000 && z <= 30000000;
    }

    /**
     * Safe world position creation with validation
     * @param x X coordinate
     * @param y Y coordinate
     * @param z Z coordinate
     * @returns Position if valid, null otherwise
     */
    //% weight=3
    //% blockId=coordinatesSafeWorld
    //% block="safe world position X $x Y $y Z $z"
    //% x.defl=0 y.defl=64 z.defl=0
    //% advanced=true
    //% group="Coordinate Utilities"
    function safeWorld(x: number, y: number, z: number): Position | null {
        const normalizedX = normalizeCoordinate(x);
        const normalizedY = normalizeCoordinate(y);
        const normalizedZ = normalizeCoordinate(z);
        
        if (validateCoordinates(normalizedX, normalizedY, normalizedZ)) {
            return world(normalizedX, normalizedY, normalizedZ);
        }
        return null;
    }
    /**
     * Calculate positions along a bezier curve with variable number of control points.
     * @param startPoint Starting position of the curve
     * @param controlPoints Array of control points that influence the curve shape
     * @param endPoint Ending position of the curve
     * @returns Array of positions along the curve
     */
    //% weight=8
    //% blockId=minecraftGetVariableBezierCurvePositions
    //% block="get variable bezier curve positions from $startPoint to $endPoint with control points $controlPoints"
    //% blockExternalInputs=1
    //% startPoint.shadow=minecraftCreateWorldInternal
    //% endPoint.shadow=minecraftCreateWorldInternal
    //% group="Curves"
    export function getVariableBezierCurvePositions(startPoint: Position, controlPoints: Position[], endPoint: Position): Position[] {
        // 全制御点を結合（開始 + 制御点配列 + 終了）
        const 全制御点: Position[] = [startPoint];
        for (let i = 0; i < controlPoints.length; i++) {
            全制御点.push(controlPoints[i]);
        }
        全制御点.push(endPoint);

        const n = 全制御点.length - 1; // 次数
        const positionsArr: Position[] = [];

        // 二項係数の計算
        function 二項係数(n: number, k: number): number {
            if (k > n) return 0;
            if (k === 0 || k === n) return 1;

            let result = 1;
            for (let i = 0; i < k; i++) {
                result = result * (n - i) / (i + 1);
            }
            return result;
        }

        // n次ベジェ曲線上の位置を計算する内部関数
        function ベジェ計算(t: number): Position {
            let x = 0, y = 0, z = 0;

            for (let i = 0; i <= n; i++) {
                // ベルンシュタイン基底多項式: B_i,n(t) = C(n,i) * (1-t)^(n-i) * t^i
                const 係数 = 二項係数(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
                x += 係数 * 全制御点[i].getValue(Axis.X);
                y += 係数 * 全制御点[i].getValue(Axis.Y);
                z += 係数 * 全制御点[i].getValue(Axis.Z);
            }

            return world(Math.round(x), Math.round(y), Math.round(z));
        }

        // 効率的な座標収集アルゴリズム
        let 前回位置 = ベジェ計算(0);
        positionsArr.push(前回位置);

        let t = 0;
        const ステップ幅 = 0.01; // 適度なステップサイズ

        while (t < 1.0) {
            t += ステップ幅;
            if (t > 1.0) t = 1.0;

            const 次位置 = ベジェ計算(t);

            // 座標が変わった場合のみ配列に追加
            if (前回位置 && !positions.equals(前回位置, 次位置)) {
                positionsArr.push(次位置);
                前回位置 = 次位置;
            }

            if (t >= 1.0) break;
        }

        return positionsArr;
    }

    /**
     * Calculate positions for a cylinder using optimized building algorithm
     * @param center Center position of the cylinder base
     * @param radius Radius of the cylinder (1-50 blocks)
     * @param height Height of the cylinder (1-100 blocks)
     * @param hollow Whether to create a hollow cylinder (default: false)
     * @param layers Maximum number of layers to generate (0 = all layers, default: 0)
     * @returns Array of positions forming the cylinder with enhanced performance
     */
    //% weight=20
    //% blockId=minecraftGetCylinderPositions
    //% block="get optimized cylinder positions at center $center radius $radius height $height || hollow $hollow layers $layers"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% layers.min=0 layers.max=50 layers.defl=0
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Optimized)"
    export function getCylinderPositions(center: Position, radius: number, height: number, hollow: boolean = false, layers: number = 0): Position[] {
        const centerX = normalizeCoordinate(center.getValue(Axis.X));
        const centerY = normalizeCoordinate(center.getValue(Axis.Y));
        const centerZ = normalizeCoordinate(center.getValue(Axis.Z));

        const radiusInt = Math.max(1, Math.round(radius));
        const heightInt = Math.max(1, Math.round(height));
        const layersInt = layers > 0 ? Math.min(layers, heightInt) : heightInt;
        const radiusSquared = radiusInt * radiusInt;
        const innerRadius = hollow ? Math.max(0, radiusInt - 1) : 0;
        const innerRadiusSquared = innerRadius * innerRadius;
        const positions: Position[] = [];

        // 最適化された円柱アルゴリズム（buildingフォルダのアルゴリズムを流用）
        for (let i = 0; i < layersInt; i++) {
            // 各層でのY座標
            const currentY = centerY + i;
            
            // 円形の最適化：対称性を利用して計算量削減
            for (let u = -radiusInt; u <= radiusInt; u++) {
                const uSquared = u * u;
                if (uSquared > radiusSquared) continue;
                
                // 平方根を最小限に抑制した最適化
                const maxVSquared = radiusSquared - uSquared;
                const maxV = Math.floor(Math.sqrt(maxVSquared));
                
                for (let v = -maxV; v <= maxV; v++) {
                    const distanceSquared = uSquared + v * v;
                    
                    if (distanceSquared <= radiusSquared &&
                        (!hollow || distanceSquared >= innerRadiusSquared)) {
                        const worldX = centerX + u;
                        const worldZ = centerZ + v;
                        if (validateCoordinates(worldX, currentY, worldZ)) {
                            positions.push(world(worldX, currentY, worldZ));
                        }
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a cone
     * @param center Center position of the cone base
     * @param radius Radius of the cone base
     * @param height Height of the cone
     * @param hollow Whether to create a hollow cone (default: false)
     * @returns Array of positions forming the cone
     */
    //% weight=19
    //% blockId=minecraftGetConePositions
    //% block="get cone positions at center $center radius $radius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Basic)"
    export function getConePositions(center: Position, radius: number, height: number, hollow: boolean = false): Position[] {
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const radiusInt = Math.round(radius);
        const heightInt = Math.round(height);
        const positions: Position[] = [];

        for (let y = 0; y < heightInt; y++) {
            // 高さに応じて半径を線形に減少させる（整数計算でコーン形状を作成）
            const currentRadius = radiusInt * (heightInt - y) / heightInt;
            const currentRadiusSquared = currentRadius * currentRadius;
            const innerRadius = hollow ? Math.max(0, currentRadius - 1) : 0;
            const innerRadiusSquared = innerRadius * innerRadius;

            const radiusIntCeil = Math.ceil(currentRadius);

            for (let x = -radiusIntCeil; x <= radiusIntCeil; x++) {
                const xSquared = x * x;
                if (xSquared > currentRadiusSquared) continue; // 範囲外の早期終了（効率化）

                for (let z = -radiusIntCeil; z <= radiusIntCeil; z++) {
                    const distanceSquared = xSquared + z * z;

                    // 現在の高さでの円の内側かつ、中空の場合は内側の円の外側（コーン形状判定）
                    if (distanceSquared <= currentRadiusSquared &&
                        (!hollow || distanceSquared >= innerRadiusSquared)) {
                        positions.push(world(
                            centerX + x,
                            centerY + y,
                            centerZ + z
                        ));
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a torus (donut shape)
     * @param center Center position of the torus
     * @param majorRadius Major radius (distance from center to tube center)
     * @param minorRadius Minor radius (tube thickness)
     * @param hollow Whether to create a hollow torus (default: false)
     * @returns Array of positions forming the torus
     */
    //% weight=18
    //% blockId=minecraftGetTorusPositions
    //% block="get torus positions at center $center major radius $majorRadius minor radius $minorRadius || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% majorRadius.min=3 majorRadius.max=50 majorRadius.defl=8
    //% minorRadius.min=1 minorRadius.max=20 minorRadius.defl=3
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Advanced)"
    export function getTorusPositions(center: Position, majorRadius: number, minorRadius: number, hollow: boolean = false): Position[] {
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const majorRadiusInt = Math.round(majorRadius);
        const minorRadiusInt = Math.round(minorRadius);
        const totalRadius = majorRadiusInt + minorRadiusInt;
        const minorRadiusSquared = minorRadiusInt * minorRadiusInt;
        const innerMinorRadius = hollow ? Math.max(0, minorRadiusInt - 1) : 0;
        const innerMinorRadiusSquared = innerMinorRadius * innerMinorRadius;
        const positions: Position[] = [];

        // トーラス生成の最適化: 距離計算を最小限に（ドーナツ形状生成）
        for (let x = -totalRadius; x <= totalRadius; x++) {
            const xSquared = x * x;
            for (let z = -totalRadius; z <= totalRadius; z++) {
                const zSquared = z * z;
                const distanceFromCenterSquared = xSquared + zSquared;

                // 平方根計算を1回のみ（計算効率の最適化）
                const distanceFromCenter = Math.sqrt(distanceFromCenterSquared);
                const distanceFromTubeCenter = Math.abs(distanceFromCenter - majorRadiusInt);

                // 管の範囲外は早期終了（トーラスの管部分のみ処理）
                if (distanceFromTubeCenter > minorRadiusInt) continue;

                // Y範囲を計算で限定（不要な計算を避ける）
                const maxYSquared = minorRadiusSquared - (distanceFromTubeCenter * distanceFromTubeCenter);
                if (maxYSquared < 0) continue;

                const maxY = Math.floor(Math.sqrt(maxYSquared));

                for (let y = -maxY; y <= maxY; y++) {
                    const tubeDistanceSquared = distanceFromTubeCenter * distanceFromTubeCenter + y * y;

                    if (tubeDistanceSquared <= minorRadiusSquared &&
                        (!hollow || tubeDistanceSquared >= innerMinorRadiusSquared)) {
                        positions.push(world(
                            centerX + x,
                            centerY + y,
                            centerZ + z
                        ));
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for an ellipsoid using optimized building algorithm
     * @param center Center position of the ellipsoid
     * @param radiusX Radius along X axis (1-50 blocks)
     * @param radiusY Radius along Y axis (1-50 blocks)
     * @param radiusZ Radius along Z axis (1-50 blocks)
     * @param hollow Whether to create a hollow ellipsoid (default: false)
     * @returns Array of positions forming the ellipsoid with enhanced performance
     */
    //% weight=17
    //% blockId=minecraftGetEllipsoidPositions
    //% block="get optimized ellipsoid positions at center $center X radius $radiusX Y radius $radiusY Z radius $radiusZ || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radiusX.min=1 radiusX.max=50 radiusX.defl=5
    //% radiusY.min=1 radiusY.max=50 radiusY.defl=3
    //% radiusZ.min=1 radiusZ.max=50 radiusZ.defl=7
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Optimized)"
    export function getEllipsoidPositions(center: Position, radiusX: number, radiusY: number, radiusZ: number, hollow: boolean = false): Position[] {
        const centerX = normalizeCoordinate(center.getValue(Axis.X));
        const centerY = normalizeCoordinate(center.getValue(Axis.Y));
        const centerZ = normalizeCoordinate(center.getValue(Axis.Z));

        const radiusXInt = Math.max(1, Math.round(radiusX));
        const radiusYInt = Math.max(1, Math.round(radiusY));
        const radiusZInt = Math.max(1, Math.round(radiusZ));
        const positions: Position[] = [];

        // 楕円体の最適化された方程式（buildingアルゴリズムベース）
        const radiusXSquared = radiusXInt * radiusXInt;
        const radiusYSquared = radiusYInt * radiusYInt;
        const radiusZSquared = radiusZInt * radiusZInt;
        
        // 中空判定の最適化
        const innerRadiusX = hollow ? Math.max(1, radiusXInt - 1) : 1;
        const innerRadiusY = hollow ? Math.max(1, radiusYInt - 1) : 1;
        const innerRadiusZ = hollow ? Math.max(1, radiusZInt - 1) : 1;
        const innerRadiusXSquared = innerRadiusX * innerRadiusX;
        const innerRadiusYSquared = innerRadiusY * innerRadiusY;
        const innerRadiusZSquared = innerRadiusZ * innerRadiusZ;

        // 計算最適化：外側ループで範囲制限を適用
        for (let x = -radiusXInt; x <= radiusXInt; x++) {
            const xTerm = x * x * radiusYSquared * radiusZSquared;
            const remainingX = radiusXSquared * radiusYSquared * radiusZSquared - xTerm;
            if (remainingX < 0) continue; // 早期終了
            
            for (let y = -radiusYInt; y <= radiusYInt; y++) {
                const yTerm = y * y * radiusXSquared * radiusZSquared;
                const remainingXY = remainingX - yTerm;
                if (remainingXY < 0) continue; // 早期終了
                
                // Z範囲の最適化計算
                const maxZSquared = remainingXY / (radiusXSquared * radiusYSquared);
                const maxZ = Math.min(radiusZInt, Math.floor(Math.sqrt(maxZSquared)));
                
                for (let z = -maxZ; z <= maxZ; z++) {
                    const zTerm = z * z * radiusXSquared * radiusYSquared;
                    const totalDistance = xTerm + yTerm + zTerm;
                    const threshold = radiusXSquared * radiusYSquared * radiusZSquared;

                    if (totalDistance <= threshold) {
                        let isInside = true;
                        if (hollow) {
                            // 中空判定の最適化
                            const innerDistance = (x * x * innerRadiusYSquared * innerRadiusZSquared) +
                                (y * y * innerRadiusXSquared * innerRadiusZSquared) +
                                (z * z * innerRadiusXSquared * innerRadiusYSquared);
                            const innerThreshold = innerRadiusXSquared * innerRadiusYSquared * innerRadiusZSquared;
                            isInside = innerDistance >= innerThreshold;
                        }

                        if (isInside) {
                            const worldX = centerX + x;
                            const worldY = centerY + y;
                            const worldZ = centerZ + z;
                            if (validateCoordinates(worldX, worldY, worldZ)) {
                                positions.push(world(worldX, worldY, worldZ));
                            }
                        }
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a line between two points using 3D Bresenham algorithm
     * @param p0 Starting position of the line
     * @param p1 Ending position of the line
     * @returns Array of positions forming the line
     */
    //% weight=100
    //% blockId=minecraftGetLinePositions
    //% block="get line positions from $p0 to $p1"
    //% p0.shadow=minecraftCreateWorldInternal
    //% p1.shadow=minecraftCreateWorldInternal
    //% group="2D Shapes"
    export function getLinePositions(p0: Position, p1: Position): Position[] {
        const positions: Position[] = [];

        // 3D Bresenham algorithm (MakeCode core compatible)
        let x0 = Math.round(p0.getValue(Axis.X));
        let x1 = Math.round(p1.getValue(Axis.X));
        let y0 = Math.round(p0.getValue(Axis.Y));
        let y1 = Math.round(p1.getValue(Axis.Y));
        let z0 = Math.round(p0.getValue(Axis.Z));
        let z1 = Math.round(p1.getValue(Axis.Z));

        // 少なくとも2つの座標が同じ場合、直線に塗りつぶしを使用する
        if ((x0 == x1 ? 1 : 0) + (y0 == y1 ? 1 : 0) + (z0 == z1 ? 1 : 0) >= 2) {
            // 1D volume - 直線的な塗りつぶし
            const minX = Math.min(x0, x1);
            const maxX = Math.max(x0, x1);
            const minY = Math.min(y0, y1);
            const maxY = Math.max(y0, y1);
            const minZ = Math.min(z0, z1);
            const maxZ = Math.max(z0, z1);

            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        positions.push(world(x, y, z));
                    }
                }
            }
            return positions;
        }

        // 3D Bresenham algorithm
        const dx = Math.abs(x1 - x0);
        const sx = x0 < x1 ? 1 : -1;
        const dy = Math.abs(y1 - y0);
        const sy = y0 < y1 ? 1 : -1;
        const dz = Math.abs(z1 - z0);
        const sz = z0 < z1 ? 1 : -1;
        
        let dm = dx > dy ? dx : dy;
        dm = dm > dz ? dm : dz;
        
        let x1_err = Math.floor(dm / 2);
        let y1_err = Math.floor(dm / 2);
        let z1_err = Math.floor(dm / 2);

        for (let i = 0; i <= dm; ++i) {
            positions.push(world(x0, y0, z0));

            x1_err -= dx;
            if (x1_err < 0) {
                x1_err += dm;
                x0 += sx;
            }

            y1_err -= dy;
            if (y1_err < 0) {
                y1_err += dm;
                y0 += sy;
            }

            z1_err -= dz;
            if (z1_err < 0) {
                z1_err += dm;
                z0 += sz;
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a helix (spiral)
     * @param center Center position of the helix base
     * @param radius Radius of the helix
     * @param height Total height of the helix
     * @param turns Number of complete turns (rotations)
     * @param clockwise Whether to rotate clockwise (default: true)
     * @returns Array of positions forming the helix
     */
    //% weight=16
    //% blockId=minecraftGetHelixPositions
    //% block="get helix positions at center $center radius $radius height $height turns $turns || clockwise $clockwise"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=2 height.max=100 height.defl=20
    //% turns.min=0.5 turns.max=20 turns.defl=3
    //% clockwise.shadow=toggleOnOff clockwise.defl=true
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Advanced)"
    export function getHelixPositions(center: Position, radius: number, height: number, turns: number, clockwise: boolean = true): Position[] {
        const positionsArr: Position[] = [];
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const radiusInt = Math.round(radius);
        const heightInt = Math.round(height);
        const totalAngle = turns * 2 * 3.14159; // 総回転角度（ラジアン）
        const direction = clockwise ? 1 : -1; // 回転方向

        // 螺旋の滑らかさを決定するステップ数（高さに比例）
        const steps = Math.max(heightInt * 2, Math.round(totalAngle * radiusInt / 2));
        const angleStep = totalAngle / steps;
        const heightStep = heightInt / steps;

        let previousPosition: Position | null = null;

        for (let i = 0; i <= steps; i++) {
            const angle = i * angleStep * direction;
            const currentHeight = i * heightStep;

            // 螺旋の3D座標計算（円形螺旋の媒介変数方程式）
            const x = centerX + Math.round(radiusInt * Math.cos(angle));
            const y = centerY + Math.round(currentHeight);
            const z = centerZ + Math.round(radiusInt * Math.sin(angle));

            const currentPosition = world(x, y, z);

            // 重複座標を避ける（効率化）
            if (!previousPosition || !positions.equals(previousPosition, currentPosition)) {
                positionsArr.push(currentPosition);
                previousPosition = currentPosition;
            }
        }

        return positionsArr;
    }

    /**
     * Calculate positions for a paraboloid (satellite dish shape)
     * @param center Center position of the paraboloid base
     * @param radius Maximum radius at the top
     * @param height Height of the paraboloid
     * @param hollow Whether to create a hollow paraboloid (default: false)
     * @returns Array of positions forming the paraboloid
     */
    //% weight=15
    //% blockId=minecraftGetParaboloidPositions
    //% block="get paraboloid positions at center $center radius $radius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=2 radius.max=50 radius.defl=8
    //% height.min=1 height.max=50 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Advanced)"
    export function getParaboloidPositions(center: Position, radius: number, height: number, hollow: boolean = false): Position[] {
        const positions: Position[] = [];
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const radiusInt = Math.round(radius);
        const heightInt = Math.round(height);
        const radiusSquared = radiusInt * radiusInt;

        // パラボロイドの方程式: z = (x² + y²) / (4 * focal_length)
        // focal_lengthを調整してheightに合わせる
        const focalLength = radiusSquared / (4 * heightInt);

        for (let y = 0; y < heightInt; y++) {
            // 現在の高さでのパラボラ半径を計算
            const currentRadiusSquared = 4 * focalLength * y;
            const currentRadius = Math.sqrt(currentRadiusSquared);
            const currentRadiusInt = Math.floor(currentRadius);

            if (currentRadiusInt > radiusInt) continue; // 最大半径を超えた場合はスキップ

            const innerRadius = hollow ? Math.max(0, currentRadiusInt - 1) : 0;
            const innerRadiusSquared = innerRadius * innerRadius;

            for (let x = -currentRadiusInt; x <= currentRadiusInt; x++) {
                const xSquared = x * x;
                if (xSquared > currentRadiusSquared) continue;

                const maxZSquared = currentRadiusSquared - xSquared;
                const maxZ = Math.floor(Math.sqrt(maxZSquared));

                for (let z = -maxZ; z <= maxZ; z++) {
                    const distanceSquared = xSquared + z * z;

                    if (distanceSquared <= currentRadiusSquared &&
                        (!hollow || distanceSquared >= innerRadiusSquared)) {
                        positions.push(world(
                            centerX + x,
                            centerY + y,
                            centerZ + z
                        ));
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a hyperboloid (cooling tower shape)
     * @param center Center position of the hyperboloid
     * @param baseRadius Radius at the base
     * @param waistRadius Radius at the narrowest point (waist)
     * @param height Total height of the hyperboloid
     * @param hollow Whether to create a hollow hyperboloid (default: false)
     * @returns Array of positions forming the hyperboloid
     */
    //% weight=14
    //% blockId=minecraftGetHyperboloidPositions
    //% block="get hyperboloid positions at center $center base radius $baseRadius waist radius $waistRadius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% baseRadius.min=3 baseRadius.max=50 baseRadius.defl=10
    //% waistRadius.min=1 waistRadius.max=30 waistRadius.defl=5
    //% height.min=4 height.max=100 height.defl=20
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Advanced)"
    export function getHyperboloidPositions(center: Position, baseRadius: number, waistRadius: number, height: number, hollow: boolean = false): Position[] {
        const positions: Position[] = [];
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const baseRadiusInt = Math.round(baseRadius);
        const waistRadiusInt = Math.round(waistRadius);
        const heightInt = Math.round(height);
        const halfHeight = Math.floor(heightInt / 2);

        // 双曲面の形状パラメータ
        const a = waistRadiusInt; // 最小半径
        const b = baseRadiusInt - waistRadiusInt; // 半径の変化幅

        for (let y = 0; y < heightInt; y++) {
            // 中心からの距離 (-1 to 1 の範囲)
            const t = (y - halfHeight) / halfHeight;
            
            // 双曲面の方程式: r(t) = a * sqrt(1 + (t*b/a)²)
            const currentRadius = a * Math.sqrt(1 + (t * b / a) * (t * b / a));
            const currentRadiusInt = Math.round(currentRadius);
            const currentRadiusSquared = currentRadiusInt * currentRadiusInt;

            const innerRadius = hollow ? Math.max(0, currentRadiusInt - 1) : 0;
            const innerRadiusSquared = innerRadius * innerRadius;

            for (let x = -currentRadiusInt; x <= currentRadiusInt; x++) {
                const xSquared = x * x;
                if (xSquared > currentRadiusSquared) continue;

                const maxZSquared = currentRadiusSquared - xSquared;
                const maxZ = Math.floor(Math.sqrt(maxZSquared));

                for (let z = -maxZ; z <= maxZ; z++) {
                    const distanceSquared = xSquared + z * z;

                    if (distanceSquared <= currentRadiusSquared &&
                        (!hollow || distanceSquared >= innerRadiusSquared)) {
                        positions.push(world(
                            centerX + x,
                            centerY + y,
                            centerZ + z
                        ));
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a circle
     * @param center Center position of the circle
     * @param radius Radius of the circle
     * @param orientation Circle orientation (X, Y, or Z axis)
     * @param hollow Whether to create a hollow circle (outline only)
     * @returns Array of positions forming the circle
     */
    //% weight=95
    //% blockId=minecraftGetCirclePositions
    //% block="get circle positions at center $center radius $radius orientation $orientation || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="2D Shapes"
    export function getCirclePositions(center: Position, radius: number, orientation: Axis, hollow: boolean = false): Position[] {
        const positions: Position[] = [];
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));
        const radiusInt = Math.round(radius);

        // 座標変換関数を軸の向きに応じて設定
        let toWorld: (u: number, v: number) => Position;

        if (orientation === Axis.X) {
            // YZ平面の円（X軸に垂直）
            toWorld = (u: number, v: number) => world(centerX, centerY + u, centerZ + v);
        } else if (orientation === Axis.Y) {
            // XZ平面の円（Y軸に垂直）
            toWorld = (u: number, v: number) => world(centerX + u, centerY, centerZ + v);
        } else {
            // XY平面の円（Z軸に垂直）
            toWorld = (u: number, v: number) => world(centerX + u, centerY + v, centerZ);
        }

        if (hollow) {
            // Midpoint circle algorithm (MakeCode core compatible)
            let x = radiusInt;
            let y = 0;
            let err = 0;

            while (x >= y) {
                // 8方向の対称点を追加
                positions.push(toWorld(x, y));
                positions.push(toWorld(y, x));
                positions.push(toWorld(-y, x));
                positions.push(toWorld(-x, y));
                positions.push(toWorld(-x, -y));
                positions.push(toWorld(-y, -x));
                positions.push(toWorld(y, -x));
                positions.push(toWorld(x, -y));

                if (err <= 0) {
                    y += 1;
                    err += 2 * y + 1;
                }
                if (err > 0) {
                    x -= 1;
                    err -= 2 * x + 1;
                }
            }
        } else {
            // 塗りつぶし円（MakeCodeコア互換の効率的実装）
            for (let x = -radiusInt; x <= radiusInt; x++) {
                const xSquared = x * x;
                const maxYSquared = radiusInt * radiusInt - xSquared;
                if (maxYSquared >= 0) {
                    const maxY = Math.floor(Math.sqrt(maxYSquared));
                    for (let y = -maxY; y <= maxY; y++) {
                        positions.push(toWorld(x, y));
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a sphere using optimized building algorithm
     * @param center Center position of the sphere
     * @param radius Radius of the sphere (1-50 blocks)
     * @param hollow Whether to create a hollow sphere (shell only)
     * @param density Density factor for position sampling (0.1-1.0, default: 1.0)
     * @returns Array of positions forming the sphere with enhanced performance
     */
    //% weight=90
    //% blockId=minecraftGetSpherePositions
    //% block="get optimized sphere positions at center $center radius $radius || hollow $hollow density $density"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% density.min=0.1 density.max=1.0 density.defl=1.0
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Optimized)"
    export function getSpherePositions(center: Position, radius: number, hollow: boolean = false, density: number = 1.0): Position[] {
        const positions: Position[] = [];
        const centerX = normalizeCoordinate(center.getValue(Axis.X));
        const centerY = normalizeCoordinate(center.getValue(Axis.Y));
        const centerZ = normalizeCoordinate(center.getValue(Axis.Z));
        const radiusInt = Math.max(1, Math.round(radius));
        const radiusSquared = radiusInt * radiusInt;
        const densityFactor = Math.max(0.1, Math.min(1.0, density));

        // 最適化された球体アルゴリズム（buildingフォルダベース）
        const innerRadius = hollow ? Math.max(0, radiusInt - 1) : 0;
        const innerRadiusSquared = innerRadius * innerRadius;
        
        // 高速化：対称性を利用した計算量削減
        for (let x = -radiusInt; x <= radiusInt; x++) {
            const xSquared = x * x;
            if (xSquared > radiusSquared) continue;

            // Y範囲の事前計算で平方根計算を削減
            const maxYSquared = radiusSquared - xSquared;
            const maxY = Math.floor(Math.sqrt(maxYSquared));

            for (let y = -maxY; y <= maxY; y++) {
                const ySquared = y * y;
                const xySquared = xSquared + ySquared;

                // Z範囲の事前計算で計算効率を向上
                const maxZSquared = radiusSquared - xySquared;
                const maxZ = Math.floor(Math.sqrt(maxZSquared));

                for (let z = -maxZ; z <= maxZ; z++) {
                    const distanceSquared = xySquared + z * z;

                    // 高速化された境界判定
                    if (distanceSquared <= radiusSquared &&
                        (!hollow || distanceSquared >= innerRadiusSquared)) {
                        // 密度サンプリングの最適化
                        if (densityFactor >= 1.0 || Math.random() < densityFactor) {
                            const worldX = centerX + x;
                            const worldY = centerY + y;
                            const worldZ = centerZ + z;
                            if (validateCoordinates(worldX, worldY, worldZ)) {
                                positions.push(world(worldX, worldY, worldZ));
                            }
                        }
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate positions for a cuboid (rectangular prism)
     * @param corner1 First corner position of the cuboid
     * @param corner2 Opposite corner position of the cuboid
     * @param hollow Whether to create a hollow cuboid (shell only)
     * @returns Array of positions forming the cuboid
     */
    //% weight=85
    //% blockId=minecraftGetCuboidPositions
    //% block="get cuboid positions from corner $corner1 to corner $corner2 || hollow $hollow"
    //% corner1.shadow=minecraftCreateWorldInternal
    //% corner2.shadow=minecraftCreateWorldInternal
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Basic)"
    export function getCuboidPositions(corner1: Position, corner2: Position, hollow: boolean = false): Position[] {
        const positions: Position[] = [];

        // 各軸の最小・最大値を計算（角の位置関係に関係なく正しい範囲を得る）
        const x1 = Math.round(corner1.getValue(Axis.X));
        const y1 = Math.round(corner1.getValue(Axis.Y));
        const z1 = Math.round(corner1.getValue(Axis.Z));
        const x2 = Math.round(corner2.getValue(Axis.X));
        const y2 = Math.round(corner2.getValue(Axis.Y));
        const z2 = Math.round(corner2.getValue(Axis.Z));

        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2);
        const maxZ = Math.max(z1, z2);

        if (hollow) {
            // 中空直方体（6面の枠組みのみ）
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        // 面上の座標かどうかを判定（少なくとも1つの軸が端にある）
                        const isOnFace = (x === minX || x === maxX) ||
                            (y === minY || y === maxY) ||
                            (z === minZ || z === maxZ);

                        if (isOnFace) {
                            positions.push(world(x, y, z));
                        }
                    }
                }
            }
        } else {
            // 完全直方体（内部も含む）
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        positions.push(world(x, y, z));
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Optimized block placement using automatic rectangular region detection
     * @param positions Array of positions to fill with blocks
     * @param block Block type to place
     */
    //% weight=1
    //% blockId=coordinatesOptimizedFill
    //% block="optimized fill positions $positions with $block=minecraftBlock"
    //% advanced=true
    //% group="Block Optimization"
    export function optimizedFill(positions: Position[], block: number): void {
        if (positions.length === 0) return;

        const positionStrings: string[] = [];
        
        for (const pos of positions) {
            const key = `${pos.getValue(Axis.X)},${pos.getValue(Axis.Y)},${pos.getValue(Axis.Z)}`;
            if (positionStrings.indexOf(key) === -1) {
                positionStrings.push(key);
            }
        }

        // 重複排除用のヘルパー関数
        function uniqueNumbers(arr: number[]): number[] {
            const unique: number[] = [];
            for (const item of arr) {
                if (unique.indexOf(item) === -1) {
                    unique.push(item);
                }
            }
            return unique.sort((a, b) => a - b);
        }

        const xs = uniqueNumbers(positions.map(p => p.getValue(Axis.X)));
        const ys = uniqueNumbers(positions.map(p => p.getValue(Axis.Y)));
        const zs = uniqueNumbers(positions.map(p => p.getValue(Axis.Z)));
        
        const remainingBlocks: string[] = [];
        for (let i = 0; i < positionStrings.length; i++) {
            remainingBlocks.push(positionStrings[i]);
        }
        
        for (let x1 = 0; x1 < xs.length; x1++) {
            for (let y1 = 0; y1 < ys.length; y1++) {
                for (let z1 = 0; z1 < zs.length; z1++) {
                    const startKey = `${xs[x1]},${ys[y1]},${zs[z1]}`;
                    if (remainingBlocks.indexOf(startKey) === -1) continue;
                    
                    let maxX = x1, maxY = y1, maxZ = z1;
                    
                    for (let x2 = x1; x2 < xs.length; x2++) {
                        let canExpand = true;
                        for (let y = y1; y <= maxY; y++) {
                            for (let z = z1; z <= maxZ; z++) {
                                if (remainingBlocks.indexOf(`${xs[x2]},${ys[y]},${zs[z]}`) === -1) {
                                    canExpand = false;
                                    break;
                                }
                            }
                            if (!canExpand) break;
                        }
                        if (canExpand) maxX = x2;
                        else break;
                    }
                    
                    for (let y2 = y1; y2 < ys.length; y2++) {
                        let canExpand = true;
                        for (let x = x1; x <= maxX; x++) {
                            for (let z = z1; z <= maxZ; z++) {
                                if (remainingBlocks.indexOf(`${xs[x]},${ys[y2]},${zs[z]}`) === -1) {
                                    canExpand = false;
                                    break;
                                }
                            }
                            if (!canExpand) break;
                        }
                        if (canExpand) maxY = y2;
                        else break;
                    }
                    
                    for (let z2 = z1; z2 < zs.length; z2++) {
                        let canExpand = true;
                        for (let x = x1; x <= maxX; x++) {
                            for (let y = y1; y <= maxY; y++) {
                                if (remainingBlocks.indexOf(`${xs[x]},${ys[y]},${zs[z2]}`) === -1) {
                                    canExpand = false;
                                    break;
                                }
                            }
                            if (!canExpand) break;
                        }
                        if (canExpand) maxZ = z2;
                        else break;
                    }
                    
                    const fromPos = world(xs[x1], ys[y1], zs[z1]);
                    const toPos = world(xs[maxX], ys[maxY], zs[maxZ]);
                    blocks.fill(block, fromPos, toPos);
                    
                    for (let x = x1; x <= maxX; x++) {
                        for (let y = y1; y <= maxY; y++) {
                            for (let z = z1; z <= maxZ; z++) {
                                const keyToRemove = `${xs[x]},${ys[y]},${zs[z]}`;
                                const index = remainingBlocks.indexOf(keyToRemove);
                                if (index !== -1) {
                                    remainingBlocks.splice(index, 1);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

}
// 座標計算用の名前空間（ブロック配置せずに座標配列を返す）
// Coordinate calculation namespace (returns position arrays without placing blocks)
//% block="座標" weight=2 color=#4CAF50 icon="\uf43c" advanced=true
namespace coordinates {
    /**
     * Calculate positions along a bezier curve with variable number of control points.
     * @param startPoint Starting position of the curve
     * @param controlPoints Array of control points that influence the curve shape
     * @param endPoint Ending position of the curve
     * @returns Array of positions along the curve
     */
    //% weight=8
    //% blockId=minecraftGetVariableBezierCurvePositions
    //% block="get positions for variable bezier curve from $startPoint to $endPoint with control points $controlPoints"
    //% blockExternalInputs=1
    //% startPoint.shadow=minecraftCreateWorldInternal
    //% endPoint.shadow=minecraftCreateWorldInternal
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
            
            if (!positions.equals(前回位置, 次位置)) {
                positionsArr.push(次位置);
                前回位置 = 次位置;
            }

            if (t >= 1.0) break;
        }

        return positionsArr;
    }

    /**
     * Calculate positions for a cylinder (circular prism)
     * @param center Center position of the cylinder base
     * @param radius Radius of the cylinder
     * @param height Height of the cylinder
     * @param hollow Whether to create a hollow cylinder (default: false)
     * @returns Array of positions forming the cylinder
     */
    //% weight=20
    //% blockId=minecraftGetCylinderPositions
    //% block="get positions for cylinder at center $center radius $radius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function getCylinderPositions(center: Position, radius: number, height: number, hollow: boolean = false): Position[] {
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const radiusInt = Math.round(radius);
        const heightInt = Math.round(height);
        const radiusSquared = radiusInt * radiusInt;
        const innerRadius = hollow ? Math.max(0, radiusInt - 1) : 0;
        const innerRadiusSquared = innerRadius * innerRadius;
        const positions: Position[] = [];

        // 中点円アルゴリズムベースの最適化（円柱生成）
        for (let y = 0; y < heightInt; y++) {
            // 各Y層で円を描画（高さごとに円を重ねて円柱を作成）
            for (let x = -radiusInt; x <= radiusInt; x++) {
                const xSquared = x * x;
                if (xSquared > radiusSquared) continue;

                // Z方向の範囲を計算（平方根を避ける最適化）
                const maxZSquared = radiusSquared - xSquared;
                const maxZ = Math.floor(Math.sqrt(maxZSquared));

                for (let z = -maxZ; z <= maxZ; z++) {
                    const distanceSquared = xSquared + z * z;

                    if (distanceSquared <= radiusSquared &&
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
     * Calculate positions for a cone
     * @param center Center position of the cone base
     * @param radius Radius of the cone base
     * @param height Height of the cone
     * @param hollow Whether to create a hollow cone (default: false)
     * @returns Array of positions forming the cone
     */
    //% weight=19
    //% blockId=minecraftGetConePositions
    //% block="get positions for cone at center $center radius $radius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
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
    //% block="get positions for torus at center $center major radius $majorRadius minor radius $minorRadius || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% majorRadius.min=3 majorRadius.max=50 majorRadius.defl=8
    //% minorRadius.min=1 minorRadius.max=20 minorRadius.defl=3
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
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
     * Calculate positions for an ellipsoid
     * @param center Center position of the ellipsoid
     * @param radiusX Radius along X axis
     * @param radiusY Radius along Y axis
     * @param radiusZ Radius along Z axis
     * @param hollow Whether to create a hollow ellipsoid (default: false)
     * @returns Array of positions forming the ellipsoid
     */
    //% weight=17
    //% blockId=minecraftGetEllipsoidPositions
    //% block="get positions for ellipsoid at center $center X radius $radiusX Y radius $radiusY Z radius $radiusZ || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radiusX.min=1 radiusX.max=50 radiusX.defl=5
    //% radiusY.min=1 radiusY.max=50 radiusY.defl=3
    //% radiusZ.min=1 radiusZ.max=50 radiusZ.defl=7
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function getEllipsoidPositions(center: Position, radiusX: number, radiusY: number, radiusZ: number, hollow: boolean = false): Position[] {
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const radiusXInt = Math.round(radiusX);
        const radiusYInt = Math.round(radiusY);
        const radiusZInt = Math.round(radiusZ);

        const radiusXSquared = radiusXInt * radiusXInt;
        const radiusYSquared = radiusYInt * radiusYInt;
        const radiusZSquared = radiusZInt * radiusZInt;

        const innerRadiusX = hollow ? Math.max(1, radiusXInt - 1) : 1;
        const innerRadiusY = hollow ? Math.max(1, radiusYInt - 1) : 1;
        const innerRadiusZ = hollow ? Math.max(1, radiusZInt - 1) : 1;
        const innerRadiusXSquared = innerRadiusX * innerRadiusX;
        const innerRadiusYSquared = innerRadiusY * innerRadiusY;
        const innerRadiusZSquared = innerRadiusZ * innerRadiusZ;
        const positions: Position[] = [];

        for (let x = -radiusXInt; x <= radiusXInt; x++) {
            const xTerm = (x * x * radiusYSquared * radiusZSquared);
            for (let y = -radiusYInt; y <= radiusYInt; y++) {
                const yTerm = (y * y * radiusXSquared * radiusZSquared);
                const xyTerm = xTerm + yTerm;

                for (let z = -radiusZInt; z <= radiusZInt; z++) {
                    const zTerm = (z * z * radiusXSquared * radiusYSquared);

                    // 楕円体の方程式: (x/a)² + (y/b)² + (z/c)² ≤ 1
                    // 整数演算に変換: x²b²c² + y²a²c² + z²a²b² ≤ a²b²c²（浮動小数点計算を避ける）
                    const distance = xyTerm + zTerm;
                    const threshold = radiusXSquared * radiusYSquared * radiusZSquared;

                    if (distance <= threshold) {
                        let isInside = true;
                        if (hollow) {
                            const innerDistance = (x * x * innerRadiusYSquared * innerRadiusZSquared) +
                                (y * y * innerRadiusXSquared * innerRadiusZSquared) +
                                (z * z * innerRadiusXSquared * innerRadiusYSquared);
                            const innerThreshold = innerRadiusXSquared * innerRadiusYSquared * innerRadiusZSquared;
                            isInside = innerDistance >= innerThreshold;
                        }

                        if (isInside) {
                            positions.push(world(
                                centerX + x,
                                centerY + y,
                                centerZ + z
                            ));
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
    //% block="get positions for line from $p0 to $p1"
    //% p0.shadow=minecraftCreateWorldInternal
    //% p1.shadow=minecraftCreateWorldInternal
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
    //% block="get positions for helix at center $center radius $radius height $height turns $turns || clockwise $clockwise"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=2 height.max=100 height.defl=20
    //% turns.min=0.5 turns.max=20 turns.defl=3
    //% clockwise.shadow=toggleOnOff clockwise.defl=true
    //% expandableArgumentMode="toggle"
    export function getHelixPositions(center: Position, radius: number, height: number, turns: number, clockwise: boolean = true): Position[] {
        const positions: Position[] = [];
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));

        const radiusInt = Math.round(radius);
        const heightInt = Math.round(height);
        const totalAngle = turns * 2 * Math.PI; // 総回転角度（ラジアン）
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
                positions.push(currentPosition);
                previousPosition = currentPosition;
            }
        }

        return positions;
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
    //% block="get positions for paraboloid at center $center radius $radius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=2 radius.max=50 radius.defl=8
    //% height.min=1 height.max=50 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
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
    //% block="get positions for hyperboloid at center $center base radius $baseRadius waist radius $waistRadius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% baseRadius.min=3 baseRadius.max=50 baseRadius.defl=10
    //% waistRadius.min=1 waistRadius.max=30 waistRadius.defl=5
    //% height.min=4 height.max=100 height.defl=20
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
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
    //% block="get positions for circle at center $center radius $radius orientation $orientation || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
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
     * Calculate positions for a sphere
     * @param center Center position of the sphere
     * @param radius Radius of the sphere
     * @param hollow Whether to create a hollow sphere (shell only)
     * @returns Array of positions forming the sphere
     */
    //% weight=90
    //% blockId=minecraftGetSpherePositions
    //% block="get positions for sphere at center $center radius $radius || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function getSpherePositions(center: Position, radius: number, hollow: boolean = false): Position[] {
        const positions: Position[] = [];
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));
        const radiusInt = Math.round(radius);
        const radiusSquared = radiusInt * radiusInt;

        // MakeCodeコア互換の"crust"概念による効率化
        const radiuso = hollow ? Math.max(0, (radiusInt - 1) * (radiusInt - 1)) : 0;

        // 球の方程式: x² + y² + z² ≤ r²（効率的な範囲制限付き）
        for (let x = -radiusInt; x <= radiusInt; x++) {
            const xSquared = x * x;
            if (xSquared > radiusSquared) continue; // X軸での早期終了

            const maxYSquared = radiusSquared - xSquared;
            const maxY = Math.floor(Math.sqrt(maxYSquared));

            for (let y = -maxY; y <= maxY; y++) {
                const ySquared = y * y;
                const xySquared = xSquared + ySquared;

                const maxZSquared = radiusSquared - xySquared;
                const maxZ = Math.floor(Math.sqrt(maxZSquared));

                for (let z = -maxZ; z <= maxZ; z++) {
                    const zSquared = z * z;
                    const distanceSquared = xySquared + zSquared;

                    // MakeCodeコア互換の"crust"判定
                    if (distanceSquared <= radiusSquared &&
                        (!hollow || distanceSquared >= radiuso)) {
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
     * Calculate positions for a cuboid (rectangular prism)
     * @param corner1 First corner position of the cuboid
     * @param corner2 Opposite corner position of the cuboid
     * @param hollow Whether to create a hollow cuboid (shell only)
     * @returns Array of positions forming the cuboid
     */
    //% weight=85
    //% blockId=minecraftGetCuboidPositions
    //% block="get positions for cuboid from corner $corner1 to corner $corner2 || hollow $hollow"
    //% corner1.shadow=minecraftCreateWorldInternal
    //% corner2.shadow=minecraftCreateWorldInternal
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
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

}
// Coordinate calculation namespace (returns position arrays without placing blocks)
//% block="座標" weight=2 color=#4CAF50 icon="\uf43c" advanced=true
namespace coordinates {
    // ==============================
    // Configuration constants and message definitions
    // ==============================
    
     /** Message display interval during coordinate generation */
    const GENERATION_MESSAGE_INTERVAL = 1024;

    /** Batch processing size (memory optimization) */
    export const BATCH_SIZE = 2048;
    
    /** Valid range for Minecraft coordinates */
    const WORLD_BOUNDS = {
        X_MIN: -30000000, X_MAX: 30000000,
        Y_MIN: -64, Y_MAX: 320,
        Z_MIN: -30000000, Z_MAX: 30000000
    };
    
    /** Progress status messages (localized) */
    const MESSAGES = {
        GENERATING: "Generating...",
        PLACEMENT_START: "Starting placement...",
        COMPLETED: "Placement complete!"
    };
    
    /** Mathematical constants */
    const MATH_CONSTANTS = {
        PI: 3.14159,
        TWO_PI: 2 * 3.14159
    };

    // ==============================
    // Coordinate utility functions
    // ==============================
    
    function normalizeCoordinate(coord: number): number {
        const normalized = Math.round(coord);
        return Math.max(WORLD_BOUNDS.X_MIN, Math.min(WORLD_BOUNDS.X_MAX, normalized));
    }

    function validateCoordinates(x: number, y: number, z: number): boolean {
        return x >= WORLD_BOUNDS.X_MIN && x <= WORLD_BOUNDS.X_MAX &&
               y >= WORLD_BOUNDS.Y_MIN && y <= WORLD_BOUNDS.Y_MAX &&
               z >= WORLD_BOUNDS.Z_MIN && z <= WORLD_BOUNDS.Z_MAX;
    }

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
     * Display progress message at specified intervals
     * @param currentCount Current processing count
     * @param messagePrefix Message prefix for display
     */
    function showProgressMessage(currentCount: number, messagePrefix: string): void {
        if (currentCount % GENERATION_MESSAGE_INTERVAL === 0 && currentCount > 0) {
            const count = Math.floor(currentCount / GENERATION_MESSAGE_INTERVAL) * GENERATION_MESSAGE_INTERVAL;
            player.say(`${messagePrefix} ${count} blocks`);
        }
    }
    
    /**
     * Calculate Euclidean distance in 3D space
     * @param x1 Point 1 X coordinate
     * @param y1 Point 1 Y coordinate
     * @param z1 Point 1 Z coordinate
     * @param x2 Point 2 X coordinate
     * @param y2 Point 2 Y coordinate
     * @param z2 Point 2 Z coordinate
     * @returns Euclidean distance between the two points
     */
    function calculateDistance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Common logic for block placement determination (spherical/hollow detection)
     * @param distance Distance from center
     * @param radius Radius value
     * @param hollow Hollow flag
     * @returns Whether block should be placed
     */
    function shouldPlaceBlock(distance: number, radius: number, hollow: boolean): boolean {
        if (hollow) {
            return distance <= radius && distance >= Math.max(0, radius - 1);
        } else {
            return distance <= radius;
        }
    }
    
    /**
     * Density sampling determination
     * @param densityFactor Density coefficient (0.1-1.0)
     * @returns Whether block should be placed based on density sampling
     */
    function passesDensitySampling(densityFactor: number): boolean {
        if (densityFactor <= 0) return false;
        return densityFactor >= 1.0 || Math.random() < densityFactor;
    }
    /**
     * Calculate positions for a variable bezier curve with multiple control points
     */
    //% weight=8
    //% blockId=minecraftGetVariableBezierCurvePositions
    //% block="get variable bezier curve positions from $startPoint to $endPoint with control points $controlPoints"
    //% blockExternalInputs=1
    //% startPoint.shadow=minecraftCreateWorldInternal
    //% endPoint.shadow=minecraftCreateWorldInternal
    //% group="Curves"
    export function getVariableBezierCurvePositions(startPoint: Position, controlPoints: Position[], endPoint: Position): Position[] {
        const allControlPoints: Position[] = [startPoint];
        for (let i = 0; i < controlPoints.length; i++) {
            allControlPoints.push(controlPoints[i]);
        }
        allControlPoints.push(endPoint);

        const n = allControlPoints.length - 1;
        const positionsArr: Position[] = [];

        function binomialCoeff(n: number, k: number): number {
            if (k > n) return 0;
            if (k === 0 || k === n) return 1;

            let result = 1;
            for (let i = 0; i < k; i++) {
                result = result * (n - i) / (i + 1);
            }
            return result;
        }

        function bezierCalculation(t: number): Position {
            let x = 0, y = 0, z = 0;

            for (let i = 0; i <= n; i++) {
                const coeff = binomialCoeff(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
                x += coeff * allControlPoints[i].getValue(Axis.X);
                y += coeff * allControlPoints[i].getValue(Axis.Y);
                z += coeff * allControlPoints[i].getValue(Axis.Z);
            }

            return world(Math.round(x), Math.round(y), Math.round(z));
        }

        let previousPos = bezierCalculation(0);
        positionsArr.push(previousPos);

        let t = 0;
        const stepSize = 0.01;

        while (t < 1.0) {
            t += stepSize;
            if (t > 1.0) t = 1.0;

            const nextPos = bezierCalculation(t);

            if (previousPos && !positions.equals(previousPos, nextPos)) {
                positionsArr.push(nextPos);
                previousPos = nextPos;
            }

            if (t >= 1.0) break;
        }

        return positionsArr;
    }

    /**
     * Optimized circle position calculation
     */
    function getCirclePositionsOptimized(center: Position, radius: number, axis: Axis, offset: number = 0, hollow: boolean = false): Position[] {
        const positions: Position[] = [];
        const centerX = Math.round(center.getValue(Axis.X));
        const centerY = Math.round(center.getValue(Axis.Y));
        const centerZ = Math.round(center.getValue(Axis.Z));
        const radiusInt = Math.round(radius);
        const radiusSquared = radiusInt * radiusInt;
        const innerRadius = hollow ? Math.max(0, radiusInt - 1) : 0;
        const innerRadiusSquared = innerRadius * innerRadius;

        // Efficient circle generation algorithm
        for (let dx = -radiusInt; dx <= radiusInt; dx++) {
            const dxSquared = dx * dx;
            if (dxSquared > radiusSquared) continue;

            const maxDzSquared = radiusSquared - dxSquared;
            const maxDz = Math.floor(Math.sqrt(maxDzSquared));

            for (let dz = -maxDz; dz <= maxDz; dz++) {
                const distanceSquared = dxSquared + dz * dz;

                if (distanceSquared <= radiusSquared &&
                    (!hollow || distanceSquared >= innerRadiusSquared)) {
                    
                    let worldPos: Position;
                    if (axis === Axis.Y) {
                        worldPos = world(centerX + dx, centerY + offset, centerZ + dz);
                    } else if (axis === Axis.X) {
                        worldPos = world(centerX + offset, centerY + dx, centerZ + dz);
                    } else { // axis === Axis.Z
                        worldPos = world(centerX + dx, centerY + dz, centerZ + offset);
                    }
                    
                    if (validateCoordinates(worldPos.getValue(Axis.X), worldPos.getValue(Axis.Y), worldPos.getValue(Axis.Z))) {
                        positions.push(worldPos);
                    }
                }
            }
        }

        return positions;
    }

    /**
     * 円柱形座標の計算（最適化アルゴリズム使用）
     * @param center 円柱の底面中心点
     * @param radius 円柱の半径 (1-200ブロック)
     * @param height 円柱の高さ (1-300ブロック)
     * @param hollow 中空円柱を作成するか (デフォルト: false)
     * @param layers 生成する最大レイヤー数 (0 = 全レイヤー, デフォルト: 0)
     * @returns 高性能で円柱を構成する座標配列
     */
    //% weight=20
    //% blockId=minecraftGetCylinderPositions
    //% block="get optimized cylinder positions at center $center radius $radius height $height || hollow $hollow layers $layers"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=1 height.max=300 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% layers.min=0 layers.max=50 layers.defl=0
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Optimized)"
    export function getCylinderPositions(center: Position, radius: number, height: number, hollow: boolean = false, layers: number = 0): Position[] {
        const radiusInt = Math.max(1, Math.round(radius));
        const heightInt = Math.max(1, Math.round(height));
        const layersInt = layers > 0 ? Math.min(layers, heightInt) : heightInt;
        const positions: Position[] = [];

        // Optimized layer division algorithm
        player.say(MESSAGES.GENERATING);
        for (let i = 0; i < layersInt; i++) {
            const layerCenter = world(
                center.getValue(Axis.X),
                center.getValue(Axis.Y) + i,
                center.getValue(Axis.Z)
            );
            
            // Generate optimized circle for each layer
            const circlePositions = getCirclePositionsOptimized(layerCenter, radiusInt, Axis.Y, 0, hollow);
            // MakeCode compatible array spread alternative
            for (const pos of circlePositions) {
                positions.push(pos);
                
                // バッチ処理：BATCH_SIZEに達したら配置
                
                showProgressMessage(positions.length, MESSAGES.GENERATING);
            }
        }
        

        return positions;
    }

    // ==============================
    // 複雑・高度な3Dシェイプ生成系関数
    // ==============================
    
    /**
     * 円錐形座標の計算
     * @param center 円錐の底面中心点
     * @param radius 円錐の底面半径
     * @param height 円錐の高さ
     * @param hollow 中空円錐を作成するか (デフォルト: false)
     * @returns 円錐を構成する座標配列
     */
    //% weight=19
    //% blockId=minecraftGetConePositions
    //% block="get cone positions at center $center radius $radius height $height || hollow $hollow"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=1 height.max=300 height.defl=10
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
    //% majorRadius.min=3 majorRadius.max=200 majorRadius.defl=8
    //% minorRadius.min=1 minorRadius.max=100 minorRadius.defl=3
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
    //% radiusX.min=1 radiusX.max=200 radiusX.defl=5
    //% radiusY.min=1 radiusY.max=200 radiusY.defl=3
    //% radiusZ.min=1 radiusZ.max=200 radiusZ.defl=7
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

        // MCP Server式正規化距離計算（シンプルで高効率）
        const maxRadius = Math.max(Math.max(radiusXInt, radiusYInt), radiusZInt);
        player.say(MESSAGES.GENERATING);
        
        for (let x = centerX - maxRadius; x <= centerX + maxRadius; x++) {
            for (let y = centerY - maxRadius; y <= centerY + maxRadius; y++) {
                for (let z = centerZ - maxRadius; z <= centerZ + maxRadius; z++) {
                    // Normalized distance calculation (MCP Server method)
                    const dx = (x - centerX) / radiusXInt;
                    const dy = (y - centerY) / radiusYInt;
                    const dz = (z - centerZ) / radiusZInt;
                    const normalizedDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    
                    let shouldPlace = false;
                    
                    if (hollow) {
                        // 中空判定：表面のみ（MCPサーバー方式）
                        shouldPlace = normalizedDistance <= 1 && normalizedDistance >= 0.8;
                    } else {
                        // 実体判定：内部含む
                        shouldPlace = normalizedDistance <= 1;
                    }
                    
                    if (shouldPlace && validateCoordinates(x, y, z)) {
                        positions.push(world(x, y, z));
                        showProgressMessage(positions.length, MESSAGES.GENERATING);
                    }
                }
            }
        }
        

        return positions;
    }

    /**
     * 2点間の直線座標計算（3D Bresenhamアルゴリズム使用）
     * @param p0 直線の開始点
     * @param p1 直線の終了点
     * @returns 直線を構成する座標配列
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
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=2 height.max=300 height.defl=20
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
        const direction = clockwise ? 1 : -1;

        // MCP Server arc length-based density calculation (continuity priority)
        const circumference = MATH_CONSTANTS.TWO_PI * radiusInt;
        const totalArcLength = circumference * turns;
        const helixLength = Math.sqrt(totalArcLength * totalArcLength + heightInt * heightInt);
        const steps = Math.max(heightInt * 2, Math.round(helixLength)); // 連続性を保つ密度

        // MakeCode互換の重複除去用（Set代替）
        const seenPositions: string[] = [];

        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const angle = (turns * MATH_CONSTANTS.TWO_PI) * progress * direction;
            const currentHeight = heightInt * progress;

            // 螺旋の3D座標計算（MCPサーバー方式）
            const x = centerX + Math.round(radiusInt * Math.cos(angle));
            const y = centerY + Math.round(currentHeight);
            const z = centerZ + Math.round(radiusInt * Math.sin(angle));

            // 重複座標チェック（MakeCode互換）
            const posKey = `${x},${y},${z}`;
            if (seenPositions.indexOf(posKey) === -1) {
                seenPositions.push(posKey);
                if (validateCoordinates(x, y, z)) {
                    positionsArr.push(world(x, y, z));
                }
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
    //% radius.min=2 radius.max=200 radius.defl=8
    //% height.min=1 height.max=300 height.defl=10
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
    //% baseRadius.min=3 baseRadius.max=200 baseRadius.defl=10
    //% waistRadius.min=1 waistRadius.max=100 waistRadius.defl=5
    //% height.min=4 height.max=300 height.defl=20
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
     * Calculate positions for a circle (public function)
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
    //% radius.min=1 radius.max=200 radius.defl=5
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
     * Calculate sphere positions using optimized algorithm
     * @param center Center position of the sphere
     * @param radius Sphere radius (1-200 blocks)
     * @param hollow Whether to create a hollow sphere (surface only)
     * @param density Density sampling factor (0.1-1.0, default: 1.0)
     * @returns High-performance array of positions forming the sphere
     */
    //% weight=90
    //% blockId=minecraftGetSpherePositions
    //% block="get optimized sphere positions at center $center radius $radius || hollow $hollow density $density"
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=200 radius.defl=5
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% density.min=0.1 density.max=1.0 density.defl=1.0
    //% expandableArgumentMode="toggle"
    //% group="3D Shapes (Optimized)"
    export function getSpherePositions(center: Position, radius: number, hollow: boolean = false, density: number = 1.0): Position[] {
        // Parameter validation
        if (!center) {
            return [];
        }
        if (radius <= 0) {
            return [];
        }
        
        const positions: Position[] = [];
        const centerX = normalizeCoordinate(center.getValue(Axis.X));
        const centerY = normalizeCoordinate(center.getValue(Axis.Y));
        const centerZ = normalizeCoordinate(center.getValue(Axis.Z));
        const radiusInt = Math.max(1, Math.round(Math.abs(radius)));
        const radiusSquared = radiusInt * radiusInt;
        const densityFactor = Math.max(0.1, Math.min(1.0, Math.abs(density)));

        // 最適化済み球体アルゴリズム
        player.say(MESSAGES.GENERATING);
        for (let x = centerX - radiusInt; x <= centerX + radiusInt; x++) {
            for (let y = centerY - radiusInt; y <= centerY + radiusInt; y++) {
                for (let z = centerZ - radiusInt; z <= centerZ + radiusInt; z++) {
                    const distance = calculateDistance(x, y, z, centerX, centerY, centerZ);
                    
                    if (shouldPlaceBlock(distance, radiusInt, hollow) && passesDensitySampling(densityFactor)) {
                        positions.push(world(x, y, z));
                        showProgressMessage(positions.length, MESSAGES.GENERATING);
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

    // ==============================
    // 最適化されたブロック配置システム
    // ==============================
    
    /**
     * 座標配列から一意な座標値を取得（MakeCode互換）
     * @param positions 座標配列
     * @param axis 取得する軸 ('x', 'y', 'z')
     * @returns ソートされた一意座標配列
     */
    function getUniqueCoordinates(positions: Position[], axis: 'x' | 'y' | 'z'): number[] {
        const coords: number[] = [];
        const axisType = axis === 'x' ? Axis.X : axis === 'y' ? Axis.Y : Axis.Z;
        
        for (const pos of positions) {
            const coord = pos.getValue(axisType);
            if (coords.indexOf(coord) === -1) {
                coords.push(coord);
            }
        }
        return coords.sort((a, b) => a - b);
    }
    
    /**
     * ブロック存在チェック用ユーティリティクラス（MakeCode互換）
     */
    class BlockExistenceChecker {
        private blockKeys: string[] = [];
        
        constructor(positions: Position[]) {
            for (const pos of positions) {
                const key = `${pos.getValue(Axis.X)},${pos.getValue(Axis.Y)},${pos.getValue(Axis.Z)}`;
                if (this.blockKeys.indexOf(key) === -1) {
                    this.blockKeys.push(key);
                }
            }
        }
        
        hasBlock(x: number, y: number, z: number): boolean {
            return this.blockKeys.indexOf(`${x},${y},${z}`) !== -1;
        }
        
        removeBlock(x: number, y: number, z: number): void {
            const key = `${x},${y},${z}`;
            const index = this.blockKeys.indexOf(key);
            if (index !== -1) {
                this.blockKeys.splice(index, 1);
            }
        }
    }
    
    /**
     * 高速ブロック配置（貪欲アルゴリズム使用）
     * @param positions 配置する座標配列
     * @param block 配置するブロックタイプ
     */
    //% weight=200
    //% blockId=coordinatesOptimizedFill
    //% block="high-speed fill positions $positions with $block=minecraftBlock"
    //% group="High-speed Building"
    export function optimizedFill(positions: Position[], block: number): void {
        if (positions.length === 0) return;
        
        // 座標をソートしてグリッド化
        const xs = getUniqueCoordinates(positions, 'x');
        const ys = getUniqueCoordinates(positions, 'y');
        const zs = getUniqueCoordinates(positions, 'z');
        
        // ブロック存在チェッカーを初期化
        const blockChecker = new BlockExistenceChecker(positions);
        
        // 貪欲アルゴリズムで最大直方体を検出してfill操作で効率的に配置
        for (let x1 = 0; x1 < xs.length; x1++) {
            for (let y1 = 0; y1 < ys.length; y1++) {
                for (let z1 = 0; z1 < zs.length; z1++) {
                    if (!blockChecker.hasBlock(xs[x1], ys[y1], zs[z1])) continue;
                    
                    let maxX = x1, maxY = y1, maxZ = z1;
                    
                    // X方向への直方体拡張
                    for (let x2 = x1; x2 < xs.length; x2++) {
                        let canExpand = true;
                        for (let y = y1; y <= maxY && canExpand; y++) {
                            for (let z = z1; z <= maxZ && canExpand; z++) {
                                if (!blockChecker.hasBlock(xs[x2], ys[y], zs[z])) {
                                    canExpand = false;
                                }
                            }
                        }
                        if (canExpand) maxX = x2;
                        else break;
                    }
                    
                    // Y方向への直方体拡張
                    for (let y2 = y1; y2 < ys.length; y2++) {
                        let canExpand = true;
                        for (let x = x1; x <= maxX && canExpand; x++) {
                            for (let z = z1; z <= maxZ && canExpand; z++) {
                                if (!blockChecker.hasBlock(xs[x], ys[y2], zs[z])) {
                                    canExpand = false;
                                }
                            }
                        }
                        if (canExpand) maxY = y2;
                        else break;
                    }
                    
                    // Z方向への直方体拡張
                    for (let z2 = z1; z2 < zs.length; z2++) {
                        let canExpand = true;
                        for (let x = x1; x <= maxX && canExpand; x++) {
                            for (let y = y1; y <= maxY && canExpand; y++) {
                                if (!blockChecker.hasBlock(xs[x], ys[y], zs[z2])) {
                                    canExpand = false;
                                }
                            }
                        }
                        if (canExpand) maxZ = z2;
                        else break;
                    }
                    
                    // 最適化blocks.fill操作で直方体を一度に配置
                    const fromPos = world(xs[x1], ys[y1], zs[z1]);
                    const toPos = world(xs[maxX], ys[maxY], zs[maxZ]);
                    blocks.fill(block, fromPos, toPos, FillOperation.Replace);
                    
                    // 使用済みブロックのマーキング
                    for (let x = x1; x <= maxX; x++) {
                        for (let y = y1; y <= maxY; y++) {
                            for (let z = z1; z <= maxZ; z++) {
                                blockChecker.removeBlock(xs[x], ys[y], zs[z]);
                            }
                        }
                    }
                }
            }
        }
    }

}
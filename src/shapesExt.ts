// 図形・形状生成用の拡張機能（最適化されたアルゴリズム使用）
// シンプルな3D図形から複雑なベジェ曲線まで対応
//% block="図形" weight=10 color=#FF6B35 icon="\uf1b2" advanced=true
namespace shapes {
    /**
     * Place blocks along a bezier curve with variable number of control points.
     * Uses optimized curve generation algorithm for smooth results.
     * @param startPoint Starting position of the curve
     * @param controlPoints Array of control points that influence the curve shape
     * @param endPoint Ending position of the curve
     * @param blockType Block type to place
     */
    //% weight=8
    //% blockId=minecraftPlaceVariableBezierCurve
    //% block="build optimized bezier curve with %block=minecraftBlock from $startPoint to $endPoint with control points $controlPoints"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% startPoint.shadow=minecraftCreateWorldInternal
    //% endPoint.shadow=minecraftCreateWorldInternal
    //% group="Lines and Curves"
    export function PlaceVariableBezierCurve(startPoint: Position, controlPoints: Position[], endPoint: Position, block: number): void {
        const positions = coordinates.getVariableBezierCurvePositions(startPoint, controlPoints, endPoint);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a line between two points by placing blocks
     * @param p0 Starting position of the line
     * @param p1 Ending position of the line
     * @param block Block type to place
     */
    //% weight=100
    //% blockId=minecraftCreateLine
    //% block="build line with %block=minecraftBlock from $p0 to $p1"
    //% block.shadow=minecraftBlock
    //% p0.shadow=minecraftCreateWorldInternal
    //% p1.shadow=minecraftCreateWorldInternal
    //% group="Basic Shapes"
    export function createLine(p0: Position, p1: Position, block: number): void {
        const positions = coordinates.getLinePositions(p0, p1);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a circle by placing blocks
     * @param center Center position of the circle
     * @param radius Radius of the circle (1-50 blocks)
     * @param orientation Circle orientation (X, Y, or Z axis)
     * @param block Block type to place
     * @param hollow Whether to create a hollow circle (outline only)
     */
    //% weight=95
    //% blockId=minecraftCreateCircle
    //% block="build circle with %block=minecraftBlock at center $center radius $radius orientation $orientation || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Basic Shapes"
    export function createCircle(center: Position, radius: number, orientation: Axis, block: number, hollow: boolean = false): void {
        const positions = coordinates.getCirclePositions(center, radius, orientation, hollow);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a sphere by placing blocks using optimized algorithm
     * @param center Center position of the sphere
     * @param radius Radius of the sphere (1-50 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow sphere (shell only)
     * @param density Density factor for position sampling (0.1-1.0, default: 1.0)
     */
    //% weight=90
    //% blockId=minecraftCreateSphere
    //% block="build optimized sphere with %block=minecraftBlock at center $center radius $radius || hollow $hollow density $density"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% density.min=0.1 density.max=1.0 density.defl=1.0
    //% expandableArgumentMode="toggle"
    //% group="Spheres and Ellipsoids"
    export function createSphere(center: Position, radius: number, block: number, hollow: boolean = false, density: number = 1.0): void {
        const positions = coordinates.getSpherePositions(center, radius, hollow, density);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a cuboid (rectangular prism) by placing blocks
     * @param corner1 First corner position of the cuboid
     * @param corner2 Opposite corner position of the cuboid
     * @param block Block type to place
     * @param hollow Whether to create a hollow cuboid (shell only)
     */
    //% weight=85
    //% blockId=minecraftCreateCuboid
    //% block="build cuboid with %block=minecraftBlock from corner $corner1 to corner $corner2 || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% corner1.shadow=minecraftCreateWorldInternal
    //% corner2.shadow=minecraftCreateWorldInternal
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Solid Shapes"
    export function createCuboid(corner1: Position, corner2: Position, block: number, hollow: boolean = false): void {
        const positions = coordinates.getCuboidPositions(corner1, corner2, hollow);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a cylinder using optimized building algorithm
     * @param center Center position of the cylinder base
     * @param radius Radius of the cylinder (1-50 blocks)
     * @param height Height of the cylinder (1-100 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow cylinder (default: false)
     */
    //% weight=20
    //% blockId=minecraftCreateCylinder
    //% block="build optimized cylinder with %block=minecraftBlock at center $center radius $radius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Spheres and Ellipsoids"
    export function createCylinder(center: Position, radius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getCylinderPositions(center, radius, height, hollow);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a cone by placing blocks
     * @param center Center position of the cone base
     * @param radius Radius of the cone base (1-50 blocks)
     * @param height Height of the cone (1-100 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow cone (default: false)
     */
    //% weight=19
    //% blockId=minecraftCreateCone
    //% block="build cone with %block=minecraftBlock at center $center radius $radius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Solid Shapes"
    export function createCone(center: Position, radius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getConePositions(center, radius, height, hollow);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a torus (donut shape) by placing blocks
     * @param center Center position of the torus
     * @param majorRadius Major radius (distance from center to tube center, 3-50 blocks)
     * @param minorRadius Minor radius (tube thickness, 1-20 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow torus (default: false)
     */
    //% weight=18
    //% blockId=minecraftCreateTorus
    //% block="build torus with %block=minecraftBlock at center $center major radius $majorRadius minor radius $minorRadius || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% majorRadius.min=3 majorRadius.max=50 majorRadius.defl=8
    //% minorRadius.min=1 minorRadius.max=20 minorRadius.defl=3
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Complex Shapes"
    export function createTorus(center: Position, majorRadius: number, minorRadius: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getTorusPositions(center, majorRadius, minorRadius, hollow);
        coordinates.optimizedFill(positions, block);
    }


    /**
     * Create an ellipsoid using optimized building algorithm
     * @param center Center position of the ellipsoid
     * @param radiusX Radius along X axis (1-50 blocks)
     * @param radiusY Radius along Y axis (1-50 blocks)
     * @param radiusZ Radius along Z axis (1-50 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow ellipsoid (default: false)
     */
    //% weight=17
    //% blockId=minecraftCreateEllipsoid
    //% block="build optimized ellipsoid with %block=minecraftBlock at center $center X radius $radiusX Y radius $radiusY Z radius $radiusZ || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radiusX.min=1 radiusX.max=50 radiusX.defl=5
    //% radiusY.min=1 radiusY.max=50 radiusY.defl=3
    //% radiusZ.min=1 radiusZ.max=50 radiusZ.defl=7
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Spheres and Ellipsoids"
    export function createEllipsoid(center: Position, radiusX: number, radiusY: number, radiusZ: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getEllipsoidPositions(center, radiusX, radiusY, radiusZ, hollow);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a helix (spiral) by placing blocks
     * @param center Center position of the helix base
     * @param radius Radius of the helix (1-50 blocks)
     * @param height Total height of the helix (2-100 blocks)
     * @param turns Number of complete turns (0.5-20 rotations)
     * @param block Block type to place
     * @param clockwise Whether to rotate clockwise (default: true)
     */
    //% weight=16
    //% blockId=minecraftCreateHelix
    //% block="build helix with %block=minecraftBlock at center $center radius $radius height $height turns $turns || clockwise $clockwise"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=2 height.max=100 height.defl=20
    //% turns.min=0.5 turns.max=20 turns.defl=3
    //% clockwise.shadow=toggleOnOff clockwise.defl=true
    //% expandableArgumentMode="toggle"
    //% group="Complex Shapes"
    export function createHelix(center: Position, radius: number, height: number, turns: number, block: number, clockwise: boolean = true): void {
        const positions = coordinates.getHelixPositions(center, radius, height, turns, clockwise);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a paraboloid (satellite dish shape) by placing blocks
     * @param center Center position of the paraboloid base
     * @param radius Maximum radius at the top (2-50 blocks)
     * @param height Height of the paraboloid (1-50 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow paraboloid (default: false)
     */
    //% weight=15
    //% blockId=minecraftCreateParaboloid
    //% block="build paraboloid with %block=minecraftBlock at center $center radius $radius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=2 radius.max=50 radius.defl=8
    //% height.min=1 height.max=50 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Complex Shapes"
    export function createParaboloid(center: Position, radius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getParaboloidPositions(center, radius, height, hollow);
        coordinates.optimizedFill(positions, block);
    }

    /**
     * Create a hyperboloid (cooling tower shape) by placing blocks
     * @param center Center position of the hyperboloid
     * @param baseRadius Radius at the base (3-50 blocks)
     * @param waistRadius Radius at the narrowest point (1-30 blocks)
     * @param height Total height of the hyperboloid (4-100 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow hyperboloid (default: false)
     */
    //% weight=14
    //% blockId=minecraftCreateHyperboloid
    //% block="build hyperboloid with %block=minecraftBlock at center $center base radius $baseRadius waist radius $waistRadius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% baseRadius.min=3 baseRadius.max=50 baseRadius.defl=10
    //% waistRadius.min=1 waistRadius.max=30 waistRadius.defl=5
    //% height.min=4 height.max=100 height.defl=20
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    //% group="Complex Shapes"
    export function createHyperboloid(center: Position, baseRadius: number, waistRadius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getHyperboloidPositions(center, baseRadius, waistRadius, height, hollow);
        coordinates.optimizedFill(positions, block);
    }

}